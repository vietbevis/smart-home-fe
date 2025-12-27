'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MyRfidCard } from '@/components/user/MyRfidCard';
import { api } from '@/lib/api';

interface UserInfo {
  id: number;
  username: string;
  role: 'ADMIN' | 'USER';
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.getMe();
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin tài khoản và thẻ RFID
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Thông tin tài khoản</h3>
              <p className="text-xs text-muted-foreground">Chi tiết người dùng</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-semibold">{user.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info List */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">ID người dùng</span>
                <span className="text-sm font-mono">#{user.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Vai trò</span>
                <span className="text-sm">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng thường'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 font-medium transition-colors mt-4"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* RFID Card */}
        <MyRfidCard />
      </div>

      {/* Quick Links for Admin */}
      {user.role === 'ADMIN' && (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Quản trị nhanh</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/settings')}
              className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center"
            >
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm">Bảo mật</span>
            </button>
            <button
              onClick={() => router.push('/door-history')}
              className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center"
            >
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm">Lịch sử cửa</span>
            </button>
            <button
              onClick={() => router.push('/users')}
              className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center"
            >
              <User className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm">Người dùng</span>
            </button>
            <button
              onClick={() => router.push('/alerts')}
              className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center"
            >
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm">Cảnh báo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
