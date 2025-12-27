'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeClockProps {
  connected?: boolean;
  compact?: boolean;
}

export function RealTimeClock({ connected = false, compact = false }: RealTimeClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Compact version for mobile
  if (compact) {
    return (
      <div className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-primary tabular-nums">
              {formatTime(time)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatShortDate(time)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
    );
  }

  // Full version for desktop sidebar
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Thời gian</span>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        )}>
          {connected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Time display */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="text-4xl sm:text-5xl font-bold tracking-tight text-primary tabular-nums">
          {formatTime(time)}
        </div>
        
        <div className="flex items-center gap-2 mt-3 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm text-center">{formatDate(time)}</span>
        </div>
      </div>

      {/* Status indicators */}
      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <div className={cn(
              'h-2 w-2 rounded-full',
              connected ? 'bg-success animate-pulse' : 'bg-danger'
            )} />
            <span className="text-muted-foreground">MQTT</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Hệ thống</span>
          </div>
        </div>
      </div>
    </div>
  );
}
