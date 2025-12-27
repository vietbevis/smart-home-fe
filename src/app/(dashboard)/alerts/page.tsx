'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Wind,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  CheckCheck,
  ShieldEllipsis,
  Fingerprint,
  Siren,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Alert } from '@/types';
import { cn } from '@/lib/utils';
import { subscribeToAlerts, clearUnreadAlerts } from '@/hooks/useMqtt';

// Professional icons for each alert type
const TYPE_CONFIG = {
  fire: { 
    icon: Siren, 
    label: 'Cháy',
  },
  gas: { 
    icon: Wind, 
    label: 'Rò rỉ Gas',
  },
  door: { 
    icon: Fingerprint, 
    label: 'An ninh cửa',
  },
} as const;

const LEVEL_CONFIG = {
  CRITICAL: { 
    label: 'Nghiêm trọng', 
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    badge: 'bg-red-500/20 text-red-600'
  },
  WARNING: { 
    label: 'Cảnh báo', 
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-600'
  },
  INFO: { 
    label: 'Thông tin', 
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    badge: 'bg-blue-500/20 text-blue-600'
  },
} as const;

const ITEMS_PER_PAGE = 10;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [newAlertsCount, setNewAlertsCount] = useState(0);

  const fetchAlerts = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const data = await api.getAlerts({ page: pageNum, limit: ITEMS_PER_PAGE });
      setAlerts(data.alerts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
      setNewAlertsCount(0);
      // Clear unread badge when viewing alerts
      clearUnreadAlerts();
    } catch {
      toast.error('Không thể tải danh sách cảnh báo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(1);
    // Clear unread on mount
    clearUnreadAlerts();
  }, [fetchAlerts]);

  // Subscribe to real-time alerts
  useEffect(() => {
    const unsubscribe = subscribeToAlerts((newAlert: Alert) => {
      if (page === 1) {
        setAlerts(prev => {
          if (prev.some(a => a.id === newAlert.id)) return prev;
          const updated = [newAlert, ...prev];
          if (updated.length > ITEMS_PER_PAGE) updated.pop();
          return updated;
        });
        setTotal(prev => prev + 1);
        // Clear badge since user is viewing the page
        clearUnreadAlerts();
      } else {
        setNewAlertsCount(prev => prev + 1);
      }
    });
    return unsubscribe;
  }, [page]);

  const handleMarkAllAsRead = async () => {
    const unacknowledged = alerts.filter(a => !a.acknowledgedBy);
    if (unacknowledged.length === 0) {
      toast.info('Không có cảnh báo chưa đọc');
      return;
    }

    try {
      // Acknowledge all unacknowledged alerts
      await Promise.all(unacknowledged.map(a => api.acknowledgeAlert(a.id)));
      
      // Update local state
      setAlerts(prev => prev.map(alert => ({
        ...alert,
        acknowledgedBy: alert.acknowledgedBy || { id: 0, username: 'Bạn' }
      })));
      
      // Clear the unread notification badge
      clearUnreadAlerts();
      
      toast.success(`Đã đánh dấu ${unacknowledged.length} cảnh báo là đã đọc`);
    } catch {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = alerts.filter(a => !a.acknowledgedBy).length;

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cảnh báo hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi và xử lý các cảnh báo an toàn
          </p>
        </div>
      </div>

      {/* Stats & Actions Card */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ShieldEllipsis className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng cảnh báo</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{total}</p>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-medium">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {newAlertsCount > 0 && (
              <button
                onClick={() => { fetchAlerts(1); setNewAlertsCount(0); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium animate-pulse"
              >
                <Sparkles className="h-4 w-4" />
                {newAlertsCount} mới
              </button>
            )}
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                unreadCount > 0 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
              title={unreadCount > 0 ? `Đánh dấu ${unreadCount} cảnh báo đã đọc` : 'Không có cảnh báo chưa đọc'}
            >
              <CheckCheck className="h-4 w-4" />
              <span>Đã đọc tất cả</span>
            </button>
            <button
              onClick={() => fetchAlerts(page)}
              disabled={isLoading}
              className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 sm:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <ShieldCheck className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Hệ thống an toàn</h2>
            <p className="text-muted-foreground max-w-sm">
              Không có cảnh báo nào. Tất cả thiết bị đang hoạt động bình thường.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {alerts.map((alert, index) => {
              const typeConfig = TYPE_CONFIG[alert.type] || TYPE_CONFIG.door;
              const levelConfig = LEVEL_CONFIG[alert.level];
              const TypeIcon = typeConfig.icon;
              const isNew = index === 0 && page === 1 && newAlertsCount === 0;
              const isRead = !!alert.acknowledgedBy;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center gap-4 p-4 transition-all',
                    isNew && 'bg-primary/5',
                    !isRead && 'bg-muted/30'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    levelConfig.bg
                  )}>
                    <TypeIcon className={cn('h-5 w-5', levelConfig.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-medium', !isRead && 'font-semibold')}>
                        {typeConfig.label}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        levelConfig.badge
                      )}>
                        {levelConfig.label}
                      </span>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className={cn(
                      'text-sm mt-0.5 line-clamp-2',
                      isRead ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
              <button
                onClick={() => fetchAlerts(page - 1)}
                disabled={page <= 1 || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchAlerts(pageNum)}
                      disabled={isLoading}
                      className={cn(
                        'w-8 h-8 text-sm rounded-lg transition-colors',
                        page === pageNum 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => fetchAlerts(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
