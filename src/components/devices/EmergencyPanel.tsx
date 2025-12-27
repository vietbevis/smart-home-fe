'use client';

import { useState } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceState, DeviceId } from '@/types';
import { DEVICE_ICONS, getEmergencyDevices } from '@/config/devices';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface EmergencyPanelProps {
  devices: Record<DeviceId, DeviceState>;
  onControl: (deviceId: DeviceId, action: 'on' | 'off', topic: string) => void;
}

export function EmergencyPanel({ devices, onControl }: EmergencyPanelProps) {
  const [confirmState, setConfirmState] = useState<{
    deviceId: DeviceId;
    deviceName: string;
    action: 'on' | 'off';
    topic: string;
  } | null>(null);

  const emergencyDevices = getEmergencyDevices();

  const handleClick = (
    deviceId: DeviceId,
    deviceName: string,
    currentStatus: string,
    topic: string
  ) => {
    const newAction = currentStatus === 'on' ? 'off' : 'on';
    setConfirmState({ deviceId, deviceName, action: newAction, topic });
  };

  const handleConfirm = () => {
    if (confirmState) {
      const { deviceId, action, topic } = confirmState;
      
      // Special handling for alarm: when turning ON, also turn OFF fan and pump
      if ((deviceId === 'alarm' || deviceId === 'warning_light') && action === 'on') {
        // Turn on the alarm/warning light
        onControl(deviceId, action, topic);
        // Explicitly turn OFF fan and pump for safety
        onControl('fan', 'off', 'home/fan/control');
        onControl('pump', 'off', 'home/pump/control');
      } else {
        // Normal control for other devices or turning off
        onControl(deviceId, action, topic);
      }
    }
  };

  const hasActiveEmergency = emergencyDevices.some(
    d => devices[d.id]?.status === 'on'
  );

  return (
    <>
      <div
        className={cn(
          'rounded-xl border-2 p-4 sm:p-5 transition-all',
          hasActiveEmergency
            ? 'border-danger bg-danger/5'
            : 'border-warning/50 bg-warning/5'
        )}
      >
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle
            className={cn(
              'h-5 w-5',
              hasActiveEmergency ? 'text-danger animate-pulse' : 'text-warning'
            )}
          />
          <h2 className="font-semibold">Khẩn cấp</h2>
          {hasActiveEmergency && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-danger text-white text-xs font-bold animate-pulse">
              ĐANG BẬT
            </span>
          )}
        </div>

        {/* Emergency buttons - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {emergencyDevices.map(device => {
            const state = devices[device.id];
            const isOn = state?.status === 'on';
            const isOnline = state?.online !== false;
            const DeviceIcon = DEVICE_ICONS[device.id];

            return (
              <button
                key={device.id}
                onClick={() =>
                  handleClick(
                    device.id,
                    device.nameVi,
                    state?.status || 'off',
                    device.controlTopic
                  )
                }
                disabled={!isOnline}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl',
                  'border transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isOn
                    ? 'border-danger bg-danger text-white'
                    : 'border-border bg-card hover:bg-muted'
                )}
              >
                {DeviceIcon && (
                  <DeviceIcon
                    className={cn(
                      'h-6 w-6 sm:h-8 sm:w-8',
                      isOn && 'animate-bounce',
                      device.id === 'fan' && isOn && 'animate-spin'
                    )}
                  />
                )}
                <span className="font-medium text-xs sm:text-sm text-center leading-tight">
                  {device.nameVi}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isOn ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isOn ? 'BẬT' : 'TẮT'}
                </span>

                {/* Online indicator */}
                <div className="absolute top-1.5 right-1.5">
                  {isOnline ? (
                    <Wifi className={cn('h-3 w-3', isOn ? 'text-white/70' : 'text-success')} />
                  ) : (
                    <WifiOff className="h-3 w-3 text-danger" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {confirmState && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
          deviceName={confirmState.deviceName}
          action={confirmState.action}
          isEmergency={true}
        />
      )}
    </>
  );
}
