'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          toast.error('Mật khẩu xác nhận không khớp');
          return;
        }
        await register(username, password);
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await login(username, password);
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Home className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">SmartHome</h1>
          <p className="text-sm text-muted-foreground">Điều khiển nhà thông minh</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                !isRegister
                  ? 'bg-card shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
                isRegister
                  ? 'bg-card shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Đăng ký
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all',
                'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xử lý...
                </span>
              ) : isRegister ? (
                'Tạo tài khoản'
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2024 SmartHome. Hệ thống nhà thông minh.
        </p>
      </div>
    </div>
  );
}
