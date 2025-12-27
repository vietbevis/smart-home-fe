'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Key,
  CreditCard,
  UserPlus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  User,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { useMqtt, subscribeToEnrollment } from '@/hooks/useMqtt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RfidCard {
  id: number;
  uid: string;
  status: string;
  createdAt: string;
}

interface UserWithRfid {
  id: number;
  username: string;
  role: string;
  hasRfidCard: boolean;
  rfidCard: RfidCard | null;
}

interface EnrollmentStatus {
  active: boolean;
  userId?: number;
  username?: string;
}

export function SecuritySettings() {
  // State
  const [users, setUsers] = useState<UserWithRfid[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>({ active: false });
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRfid | null>(null);

  // PIN form state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // MQTT for security mode
  const { devices, publish, connected } = useMqtt();
  const securityModeActive = devices.alarm?.status === 'on';

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/doors/users-rfid-status`, { headers }),
        fetch(`${API_URL}/doors/enrollment/status`, { headers })
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (statusRes.ok) setEnrollmentStatus(await statusRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (enrollmentStatus.active) fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchData, enrollmentStatus.active]);

  // Subscribe to real-time enrollment results
  useEffect(() => {
    const unsubscribe = subscribeToEnrollment((data) => {
      if (data.success) {
        setSuccess(data.message || `Đã đăng ký thẻ cho ${data.username}`);
        setEnrollmentStatus({ active: false });
        fetchData(); // Refresh user list
      } else {
        setError(data.message || 'Đăng ký thất bại');
        setEnrollmentStatus({ active: false });
      }
    });
    return unsubscribe;
  }, [fetchData]);

  // RFID Enrollment handlers
  const startEnrollment = async (user: UserWithRfid, confirm = false) => {
    setError(null);
    setSuccess(null);
    setEnrolling(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/doors/enrollment/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, confirmReplace: confirm })
      });

      const data = await res.json();

      if (res.status === 409 && data.requireConfirmation) {
        setSelectedUser(user);
        setShowConfirmReplace(true);
        setShowRfidModal(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Không thể bắt đầu đăng ký');

      setSuccess(`Đang chờ quét thẻ cho ${data.username}...`);
      setEnrollmentStatus({ active: true, userId: user.id, username: data.username });
      setShowRfidModal(false);
      setShowConfirmReplace(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setEnrolling(false);
    }
  };

  const cancelEnrollment = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/doors/enrollment/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnrollmentStatus({ active: false });
      setSuccess(null);
      fetchData();
    } catch (err) {
      console.error('Failed to cancel enrollment:', err);
    }
  };

  const revokeCard = async (user: UserWithRfid) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/doors/rfid/revoke/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Không thể thu hồi thẻ');
      }

      setSuccess(`Đã thu hồi thẻ của ${user.username}`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  // PIN change handler
  const handlePinChange = async () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('Mã PIN phải là 4 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Mã PIN xác nhận không khớp');
      return;
    }

    setPinLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/doors/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin: newPin })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Không thể đổi PIN');
      }

      setSuccess('Đã cập nhật mã PIN thành công');
      setShowPinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setPinLoading(false);
    }
  };

  // Security mode handlers - Only siren and warning lights ON, other devices OFF
  const toggleSecurityMode = (activate: boolean) => {
    if (activate) {
      // Turn ON alarm (siren + warning light)
      publish('home/alert/control', { action: 'on' });
      // Explicitly turn OFF fan and pump
      publish('home/fan/control', { action: 'off' });
      publish('home/pump/control', { action: 'off' });
      setSuccess('Đã kích hoạt chế độ bảo mật (còi + đèn cảnh báo)');
    } else {
      // Turn OFF alarm
      publish('home/alert/control', { action: 'off' });
      setSuccess('Đã tắt chế độ bảo mật');
    }
  };

  // Stats
  const usersWithCard = users.filter(u => u.hasRfidCard).length;
  const usersWithoutCard = users.filter(u => !u.hasRfidCard).length;

  return (
    <AdminOnly
      fallback={
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bạn không có quyền truy cập cài đặt bảo mật.</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl animate-in slide-in-from-top">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-danger hover:text-danger/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-xl animate-in slide-in-from-top">
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
            <span className="text-sm flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-success hover:text-success/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Enrollment Active Banner */}
        {enrollmentStatus.active && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <CreditCard className="h-8 w-8 text-yellow-500" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-500">Chờ quét thẻ RFID</p>
                  <p className="text-sm text-muted-foreground">
                    Đăng ký cho: <span className="font-medium">{enrollmentStatus.username}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={cancelEnrollment}
                className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 font-medium transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {connected ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-danger" />}
            </div>
            <p className="text-2xl font-bold">{connected ? 'Online' : 'Offline'}</p>
            <p className="text-xs text-muted-foreground">Kết nối MQTT</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{usersWithCard}</p>
            <p className="text-xs text-muted-foreground">Có thẻ RFID</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-warning">{usersWithoutCard}</p>
            <p className="text-xs text-muted-foreground">Chưa có thẻ</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1',
              securityModeActive ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'
            )}>
              {securityModeActive ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              {securityModeActive ? 'BẬT' : 'TẮT'}
            </div>
            <p className="text-xs text-muted-foreground">Chế độ bảo mật</p>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* RFID Card Management */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Thẻ RFID</h3>
                  <p className="text-xs text-muted-foreground">{users.length} người dùng</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </button>
                <button
                  onClick={() => setShowRfidModal(true)}
                  disabled={enrollmentStatus.active}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng ký thẻ</span>
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có người dùng</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl transition-colors',
                        user.hasRfidCard ? 'bg-success/5 hover:bg-success/10' : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full',
                          user.hasRfidCard ? 'bg-success/10' : 'bg-muted'
                        )}>
                          <User className={cn('h-4 w-4', user.hasRfidCard ? 'text-success' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.hasRfidCard ? (
                              <span className="text-success">✓ {user.rfidCard?.uid.substring(0, 8)}...</span>
                            ) : (
                              'Chưa đăng ký thẻ'
                            )}
                          </p>
                        </div>
                      </div>
                      {user.hasRfidCard && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Thu hồi thẻ của ${user.username}?`)) {
                              revokeCard(user);
                            }
                          }}
                          disabled={enrollmentStatus.active}
                          className="p-2 rounded-lg text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
                          title="Thu hồi thẻ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* PIN Settings */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Key className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">Mã PIN cửa</h3>
                  <p className="text-xs text-muted-foreground">Mật khẩu mở cửa 4 chữ số</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Mã PIN được sử dụng để mở cửa qua bàn phím. Thay đổi sẽ được đồng bộ ngay đến ESP32.
              </p>
              <button
                onClick={() => setShowPinModal(true)}
                className="w-full py-3 rounded-xl bg-warning/10 text-warning hover:bg-warning/20 font-medium transition-colors"
              >
                Đổi mã PIN
              </button>
            </div>

            {/* Security Mode */}
            <div className={cn(
              'rounded-2xl border p-5 transition-all',
              securityModeActive ? 'border-danger/50 bg-danger/5' : 'bg-card'
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  securityModeActive ? 'bg-danger/10' : 'bg-muted'
                )}>
                  <Shield className={cn('h-5 w-5', securityModeActive ? 'text-danger' : 'text-muted-foreground')} />
                </div>
                <div>
                  <h3 className="font-semibold">Chế độ bảo mật</h3>
                  <p className={cn(
                    'text-xs',
                    securityModeActive ? 'text-danger' : 'text-muted-foreground'
                  )}>
                    {securityModeActive ? '🚨 Đang hoạt động' : 'Không hoạt động'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Khi kích hoạt, hệ thống sẽ:
                </p>
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    Bật còi báo động và đèn cảnh báo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Tắt quạt và máy bơm (an toàn)
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground italic mt-2">
                  💡 Quạt và bơm chỉ tự động bật khi phát hiện cháy/gas từ cảm biến
                </p>
              </div>

              <div className="flex gap-3">
                {securityModeActive ? (
                  <button
                    onClick={() => toggleSecurityMode(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-white hover:bg-success/90 font-medium transition-colors"
                  >
                    <Unlock className="h-4 w-4" />
                    Tắt chế độ bảo mật
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm('Kích hoạt chế độ bảo mật? Còi báo động và đèn cảnh báo sẽ bật.')) {
                        toggleSecurityMode(true);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-danger text-white hover:bg-danger/90 font-medium transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    Kích hoạt bảo mật
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RFID Registration Modal */}
        {showRfidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Đăng ký thẻ RFID</h3>
                    <p className="text-xs text-muted-foreground">Chọn người dùng để gán thẻ</p>
                  </div>
                </div>
                <button onClick={() => setShowRfidModal(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-5 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startEnrollment(user)}
                      disabled={enrolling}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-xl transition-all text-left',
                        'hover:bg-primary/5 hover:border-primary/30 border border-transparent',
                        user.hasRfidCard && 'bg-warning/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          user.hasRfidCard ? 'bg-warning/10' : 'bg-muted'
                        )}>
                          <User className={cn('h-5 w-5', user.hasRfidCard ? 'text-warning' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.hasRfidCard ? '⚠️ Đã có thẻ - sẽ thay thế' : 'Chưa có thẻ'}
                          </p>
                        </div>
                      </div>
                      <UserPlus className="h-5 w-5 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-5 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Sau khi chọn, quét thẻ RFID trên đầu đọc ESP32
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Replace Modal */}
        {showConfirmReplace && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
                  <AlertCircle className="h-7 w-7 text-warning" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Thay thế thẻ RFID?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                <span className="font-medium">{selectedUser.username}</span> đã có thẻ RFID. 
                Thẻ cũ sẽ bị thu hồi và thay thế bằng thẻ mới.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmReplace(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => startEnrollment(selectedUser, true)}
                  disabled={enrolling}
                  className="flex-1 py-3 rounded-xl bg-warning text-white hover:bg-warning/90 font-medium transition-colors disabled:opacity-50"
                >
                  {enrolling ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Change Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Key className="h-5 w-5 text-warning" />
                  </div>
                  <h3 className="font-semibold">Đổi mã PIN</h3>
                </div>
                <button onClick={() => setShowPinModal(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Mã PIN mới</label>
                  <div className="relative">
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Nhập 4 chữ số"
                      className="w-full px-4 py-3 rounded-xl border bg-background text-center text-2xl tracking-widest font-mono"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPins(!showPins)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Xác nhận mã PIN</label>
                  <input
                    type={showPins ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Nhập lại mã PIN"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-background text-center text-2xl tracking-widest font-mono',
                      confirmPin && confirmPin !== newPin && 'border-danger'
                    )}
                    maxLength={4}
                  />
                  {confirmPin && confirmPin !== newPin && (
                    <p className="text-xs text-danger mt-1">Mã PIN không khớp</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePinChange}
                    disabled={pinLoading || newPin.length !== 4 || newPin !== confirmPin}
                    className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pinLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      'Cập nhật mã PIN'
                    )}
                  </button>
                </div>
              </div>
              
              <div className="p-5 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Mã PIN sẽ được đồng bộ ngay đến ESP32 qua MQTT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
