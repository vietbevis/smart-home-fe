'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DoorHistoryLog } from '@/types';
import {
  DoorClosed,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldX,
  ShieldCheck,
  CreditCard,
  KeyRound,
  Siren,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EventFilter = 'all' | 'granted' | 'denied';

export function DoorHistory() {
  const [logs, setLogs] = useState<DoorHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<EventFilter>('all');

  const fetchHistory = async (pageNum: number, eventFilter?: EventFilter) => {
    setLoading(true);
    try {
      const data = await api.getDoorHistory({ 
        page: pageNum, 
        limit: 15,
        event: eventFilter === 'all' ? undefined : eventFilter
      });
      setLogs(data.logs as DoorHistoryLog[]);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      console.error('Failed to fetch door history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, filter);
  }, [filter]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventInfo = (event: string) => {
    switch (event) {
      case 'door_opened':
      case 'access_granted':
        return { 
          icon: ShieldCheck, 
          label: 'Truy cập thành công', 
          color: 'text-success', 
          bg: 'bg-success/10',
          border: 'border-success/20'
        };
      case 'door_closed':
        return { 
          icon: DoorClosed, 
          label: 'Đóng cửa', 
          color: 'text-blue-500', 
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20'
        };
      case 'access_denied':
        return { 
          icon: ShieldX, 
          label: 'Truy cập bị từ chối', 
          color: 'text-danger', 
          bg: 'bg-danger/10',
          border: 'border-danger/20'
        };
      case 'alarm_triggered':
        return {
          icon: Siren,
          label: 'Báo động kích hoạt',
          color: 'text-danger',
          bg: 'bg-danger/10',
          border: 'border-danger/20',
        };
      default:
        return {
          icon: DoorClosed,
          label: event,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-muted',
        };
    }
  };

  const getMethodInfo = (method: string | null) => {
    if (!method) return { icon: null, label: 'Hệ thống' };
    switch (method) {
      case 'rfid_pin': return { icon: KeyRound, label: 'RFID + PIN' };
      case 'rfid': return { icon: CreditCard, label: 'Thẻ RFID' };
      case 'invalid_rfid': return { icon: CreditCard, label: 'Thẻ không hợp lệ' };
      case 'invalid_pin': return { icon: KeyRound, label: 'PIN sai' };
      case 'card_revoked': return { icon: ShieldX, label: 'Thẻ bị thu hồi' };
      case 'web_admin': return { icon: null, label: 'Web Admin' };
      case 'system': return { icon: null, label: 'Hệ thống' };
      case 'MQTT': return { icon: null, label: 'Điều khiển từ xa' };
      case 'enrollment': return { icon: CreditCard, label: 'Đăng ký thẻ' };
      case 'user_report': return { icon: null, label: 'Người dùng báo cáo' };
      default: return { icon: null, label: method };
    }
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Lịch sử truy cập</h2>
            <p className="text-xs text-muted-foreground">{total} sự kiện</p>
          </div>
        </div>
        <button
          onClick={() => fetchHistory(page, filter)}
          disabled={loading}
          className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          title="Làm mới"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b bg-muted/30">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'granted', label: 'Thành công' },
          { value: 'denied', label: 'Từ chối' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as EventFilter)}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              filter === tab.value 
                ? 'bg-background shadow-sm font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lịch sử 
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map((log) => {
                const eventInfo = getEventInfo(log.event);
                const methodInfo = getMethodInfo(log.method);
                const Icon = eventInfo.icon;
                const MethodIcon = methodInfo.icon;
                
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                      eventInfo.bg,
                      eventInfo.border
                    )}
                  >
                    <div className={cn('p-2 rounded-full', eventInfo.bg)}>
                      <Icon className={cn('w-4 h-4', eventInfo.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('font-medium text-sm', eventInfo.color)}>
                          {eventInfo.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-background rounded-full text-muted-foreground">
                          {MethodIcon && <MethodIcon className="w-3 h-3" />}
                          {methodInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(log.timestamp)}</span>
                        {log.user && (
                          <>
                            <span>•</span>
                            <User className="w-3 h-3" />
                            <span className="font-medium">{log.user.username}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <button
                  onClick={() => fetchHistory(page - 1, filter)}
                  disabled={page <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                
                <button
                  onClick={() => fetchHistory(page + 1, filter)}
                  disabled={page >= totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
