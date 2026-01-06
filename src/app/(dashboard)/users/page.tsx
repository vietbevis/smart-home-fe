"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { Edit2, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "USER",
  });
  const { isAdmin, can } = usePermissions();

  useEffect(() => {
    if (can("security:manage")) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [can]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        toast.success("Đã thêm người dùng");
        setShowAddModal(false);
        setNewUser({ username: "", password: "", role: "USER" });
        fetchUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Lỗi thêm người dùng");
      }
    } catch (error) {
      toast.error("Lỗi thêm người dùng");
    }
  };

  const handleUpdateRole = async (
    userId: number,
    newRole: "ADMIN" | "USER"
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success("Đã cập nhật quyền");
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error("Lỗi cập nhật quyền");
      }
    } catch (error) {
      toast.error("Lỗi cập nhật quyền");
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Đã xóa người dùng");
        fetchUsers();
      } else {
        toast.error("Lỗi xóa người dùng");
      }
    } catch (error) {
      toast.error("Lỗi xóa người dùng");
    }
  };

  // Access denied for non-admins
  if (!can("security:manage")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4">
          <Shield className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold mb-2">Truy cập bị từ chối</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Chỉ quản trị viên mới có thể quản lý người dùng.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground">User Management</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Tên đăng nhập
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Quyền</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{user.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          role: e.target.value as "ADMIN" | "USER",
                        })
                      }
                      className="px-2 py-1 rounded border text-sm"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.role === "ADMIN" ? "Quản trị" : "Người dùng"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editingUser?.id === user.id ? (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateRole(user.id, editingUser.role)
                          }
                          className="px-3 py-1 rounded-lg bg-success text-white text-sm"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-1 rounded-lg bg-muted text-sm"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 rounded-lg hover:bg-muted"
                          title="Sửa quyền"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteUser(user.id, user.username)
                          }
                          className="p-2 rounded-lg hover:bg-danger/10 text-danger"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thêm người dùng mới</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quyền</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border"
                >
                  <option value="USER">Người dùng (USER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 py-2 rounded-xl bg-primary text-white"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
