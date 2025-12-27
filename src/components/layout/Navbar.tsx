'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShieldAlert,
  Users,
  Shield,
  Menu,
  X,
  DoorOpen,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { subscribeToUnreadCount, clearUnreadAlerts } from '@/hooks/useMqtt';

interface NavbarProps {
  connected: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Tổng quan', icon: Home },
  { href: '/alerts', label: 'Cảnh báo', icon: ShieldAlert, showBadge: true },
  { href: '/door-history', label: 'Lịch sử ra vào', icon: DoorOpen },
  { href: '/profile', label: 'Hồ sơ', icon: User },
];

const adminItems: NavItem[] = [
  { href: '/users', label: 'Người dùng', icon: Users },
  { href: '/settings', label: 'Bảo mật', icon: Shield },
];

export function Navbar({ connected }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { isAdmin } = usePermissions();

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  // Subscribe to unread alert count
  useEffect(() => {
    const unsubscribe = subscribeToUnreadCount(setUnreadCount);
    return unsubscribe;
  }, []);

  // Clear unread count when on alerts page
  useEffect(() => {
    if (pathname === '/alerts') {
      clearUnreadAlerts();
    }
  }, [pathname]);

  return (
    <>
      {/* Desktop & Mobile Header */}
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold hidden sm:inline">SmartHome</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const showBadge = item.showBadge && unreadCount > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className={cn(
                      'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-bold px-1',
                      isActive 
                        ? 'bg-white text-primary' 
                        : 'bg-danger text-white animate-pulse'
                    )}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Connection Status + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                connected ? 'bg-success' : 'bg-danger animate-pulse'
              )}
              title={connected ? 'Đã kết nối' : 'Mất kết nối'}
            />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative md:hidden p-2 rounded-lg hover:bg-muted"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {unreadCount > 0 && !mobileOpen && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-white text-xs font-bold px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card p-2">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const showBadge = item.showBadge && unreadCount > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold px-1.5',
                      isActive 
                        ? 'bg-white text-primary' 
                        : 'bg-danger text-white'
                    )}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
