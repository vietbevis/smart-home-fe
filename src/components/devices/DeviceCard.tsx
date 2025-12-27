'use client';

import { useState } from 'react';
import { Wifi, WifiOff, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceConfig, DeviceState, DeviceId } from '@/types';
import { DEVICE_ICONS } from '@/config/devices';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface DeviceCardProps {
  config: DeviceConfig;
  state: DeviceState;
  onControl: (action: 'on' | 'off') => void;
  disabled?: boolean;
}

export function DeviceCard({
  config,
  state,
  onControl,
  disabled = false,
}: DeviceCardProps) {
  const [confirmAction, setConfirmAction] = useState<'on' | 'off' | null>(null);
  
  const isOn = state.status === 'on';
  const isOnline = state.online;
  const isDisabled = disabled || !isOnline;

  const DeviceIcon = DEVICE_ICONS[config.id as DeviceId];

  const handleToggle = () => {
    const newAction = isOn ? 'off' : 'on';
    setConfirmAction(newAction);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onControl(confirmAction);
    }
  };

  const getIconColor = () => {
    if (!isOnline) return 'text-muted-foreground';
    if (config.isEmergency && isOn) return 'text-danger';
    if (isOn) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getIconBgColor = () => {
    if (!isOnline) return 'bg-muted';
    if (config.isEmergency && isOn) return 'bg-danger/10';
    if (isOn) return 'bg-primary/10';
    return 'bg-muted';
  };

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl border bg-card p-3 transition-all',
          'hover:shadow-md hover:border-primary/30',
          isOn && !config.isEmergency && 'ring-1 ring-primary/20 bg-primary/5',
          isOn && config.isEmergency && 'ring-1 ring-danger/30 bg-danger/5',
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
              getIconBgColor(),
              isOn && 'scale-105'
            )}
          >
            {DeviceIcon && (
              <DeviceIcon 
                className={cn(
                  'h-4 w-4 sm:h-5 sm:w-5 transition-colors',
                  getIconColor(),
                  config.id === 'fan' && isOn && 'animate-spin'
                )} 
              />
            )}
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
              isOn && !config.isEmergency && 'bg-success/10 text-success',
              isOn && config.isEmergency && 'bg-danger/10 text-danger',
              !isOn && 'bg-muted text-muted-foreground'
            )}
          >
            {isOn ? 'Bật' : 'Tắt'}
          </span>

          <button
            onClick={handleToggle}
            disabled={isDisabled}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isOn && !config.isEmergency && 'bg-primary text-white',
              isOn && config.isEmergency && 'bg-danger text-white',
              !isOn && 'bg-muted hover:bg-muted/80'
            )}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        deviceName={config.nameVi}
        action={confirmAction || 'on'}
        isEmergency={config.isEmergency}
      />
    </>
  );
}
