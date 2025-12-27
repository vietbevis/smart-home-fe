'use client';

import { useState } from 'react';
import { Wifi, WifiOff, Shirt, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceConfig, DeviceState } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface DryerRackCardProps {
  config: DeviceConfig;
  state: DeviceState;
  onControl: (action: 'on' | 'off') => void;
  disabled?: boolean;
}

export function DryerRackCard({
  config,
  state,
  onControl,
  disabled = false,
}: DryerRackCardProps) {
  const [confirmAction, setConfirmAction] = useState<'on' | 'off' | null>(null);
  
  const isOut = state.status === 'open';
  const isOnline = state.online;
  const isDisabled = disabled || !isOnline;

  const handleToggle = () => {
    const newAction = isOut ? 'off' : 'on';
    setConfirmAction(newAction);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onControl(confirmAction);
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl border bg-card p-3 transition-all',
          'hover:shadow-md hover:border-primary/30',
          isOut && 'ring-1 ring-primary/20 bg-primary/5',
          isDisabled && 'opacity-60'
        )}
      >
        {/* Online indicator */}
        <div className="absolute top-2 right-2">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3 text-danger" />
          )}
        </div>

        {/* Icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
              isOut ? 'bg-primary/10 scale-105' : 'bg-muted'
            )}
          >
            <Shirt 
              className={cn(
                'h-4 w-4 sm:h-5 sm:w-5 transition-colors',
                isOut ? 'text-primary' : 'text-muted-foreground'
              )} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs sm:text-sm truncate">{config.nameVi}</h3>
          </div>
        </div>

        {/* Status and control */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isOut && 'bg-success/10 text-success',
              !isOut && 'bg-muted text-muted-foreground'
            )}
          >
            {isOut ? 'Đang mở' : 'Đã thu'}
          </span>

          <button
            onClick={handleToggle}
            disabled={isDisabled}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isOut && 'bg-primary text-white',
              !isOut && 'bg-muted hover:bg-muted/80'
            )}
            title={isOut ? 'Thu giàn phơi' : 'Mở giàn phơi'}
          >
            {isOut ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        deviceName={config.nameVi}
        action={confirmAction || 'on'}
      />
    </>
  );
}
