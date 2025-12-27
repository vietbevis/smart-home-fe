'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  ChevronUp,
  Wifi,
  WifiOff,
  Settings,
  Key,
  Edit3,
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { subscribeToRfidLost } from '@/hooks/useMqtt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UserPanelProps {
  user: { id?: number; username: string; role: string } | null;
  connected: boolean;
  onLogout: () => void;
  onUserUpdate?: (user: { username: string; role: string }) => void;
}

export function UserPanel({ user, connected, onLogout, onUserUpdate }: UserPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'rfid'>('profile');
  const router = useRouter();

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // RFID card state
  const [rfidCard, setRfidCard] = useState<{ id: number; uid: string; status: string; createdAt: string } | null>(null);
  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [rfidLoading, setRfidLoading] = useState(false);

  // Fetch RFID card status
  const fetchRfidStatus = async () => {
    try {
      const data = await api.getMyRfidCard();
      setRfidCard(data.card);
    } catch {
      // Ignore errors
    }
  };

  // Subscribe to RFID lost events
  useEffect(() => {
    if (user?.id) {
      fetchRfidStatus();
      
      const unsubscribe = subscribeToRfidLost((data) => {
        if (data.userId === user.id) {
          setRfidCard(null);
        }
      });
      
      return unsubscribe;
    }
  }, [user?.id]);

  // Report lost card
  const handleReportLost = async () => {
    setRfidLoading(true);
    setError(null);
    
    try {
      const result = await api.reportLostCard();
      setRfidCard(null);
      setShowLostConfirm(false);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể báo mất thẻ');
    } finally {
      setRfidLoading(false);
    }
  };

  if (!user) return null;

  const handleLogout = () => {
    onLogout();
    router.push('/login');
  };

  const openSettings = () => {
    setShowSettings(true);
    setExpanded(false);
    setNewUsername(user.username);
    setError(null);
    setSuccess(null);
  };

  const handleProfileUpdate = async () => {
    if (!newUsername || newUsername.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật');

      setSuccess('Đã cập nhật thông tin');
      onUserUpdate?.({ username: data.username, role: data.role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đổi mật khẩu');

      setSuccess('Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const closeSettings = () => {
    setShowSettings(false);
    setError(null);
    setSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Tài khoản của tôi</h3>
                  <p className="text-xs text-muted-foreground">{user.username}</p>
                </div>
              </div>
              <button onClick={closeSettings} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => { setActiveTab('profile'); setError(null); setSuccess(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Thông tin</span>
              </button>
              <button
                onClick={() => { setActiveTab('password'); setError(null); setSuccess(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  activeTab === 'password'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Mật khẩu</span>
              </button>
              <button
                onClick={() => { setActiveTab('rfid'); setError(null); setSuccess(null); fetchRfidStatus(); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  activeTab === 'rfid'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Thẻ RFID</span>
              </button>
            </div>

            {/* Messages */}
            {(error || success) && (
              <div className="px-5 pt-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm">
                    <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl text-sm">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <span>{success}</span>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-5">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border bg-background"
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Vai trò</label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        (Không thể thay đổi)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading || newUsername === user.username}
                    className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
              
              {activeTab === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border bg-background pr-12"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Mật khẩu mới</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border bg-background"
                      placeholder="Nhập mật khẩu mới (ít nhất 4 ký tự)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Xác nhận mật khẩu</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border bg-background',
                        confirmPassword && confirmPassword !== newPassword && 'border-danger'
                      )}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-danger mt-1">Mật khẩu không khớp</p>
                    )}
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={loading || !currentPassword || newPassword.length < 4 || newPassword !== confirmPassword}
                    className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Đổi mật khẩu'}
                  </button>
                </div>
              )}
              
              {activeTab === 'rfid' && (
                <div className="space-y-4">
                  {rfidCard ? (
                    <>
                      {/* Card Info */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Thẻ RFID của bạn</p>
                            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mã thẻ:</span>
                            <span className="font-mono">{rfidCard.uid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Đăng ký:</span>
                            <span>{new Date(rfidCard.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lost Card Section */}
                      {!showLostConfirm ? (
                        <button
                          onClick={() => setShowLostConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Báo mất thẻ
                        </button>
                      ) : (
                        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-danger">Xác nhận báo mất thẻ?</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Thẻ sẽ bị vô hiệu hóa ngay lập tức và không thể sử dụng để mở cửa.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowLostConfirm(false)}
                              className="flex-1 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleReportLost}
                              disabled={rfidLoading}
                              className="flex-1 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors text-sm disabled:opacity-50"
                            >
                              {rfidLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xác nhận'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                        <CreditCard className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Chưa có thẻ RFID</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Liên hệ quản trị viên để được cấp thẻ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Panel */}
      <div className="fixed bottom-4 right-4 z-40">
        {/* Expanded Panel */}
        {expanded && (
          <div className="mb-2 w-64 rounded-2xl bg-card border shadow-xl animate-in slide-in-from-bottom-2 overflow-hidden">
            {/* User Info */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kết nối MQTT</span>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                )}>
                  {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {connected ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={openSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cài đặt tài khoản</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/10 text-danger transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all',
            'bg-card border hover:shadow-xl hover:scale-105',
            expanded && 'bg-primary text-primary-foreground border-primary'
          )}
        >
          <div className="relative">
            <User className="h-4 w-4" />
            <div
              className={cn(
                'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2',
                expanded ? 'border-primary' : 'border-card',
                connected ? 'bg-success' : 'bg-danger animate-pulse'
              )}
            />
          </div>
          <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
          <ChevronUp
            className={cn(
              'h-4 w-4 transition-transform',
              !expanded && 'rotate-180'
            )}
          />
        </button>
      </div>
    </>
  );
}
