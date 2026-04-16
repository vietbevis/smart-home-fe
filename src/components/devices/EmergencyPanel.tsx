'use client';

import { useState } from 'react';
import { AlertTriangle, Wifi, WifiOff, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceState, DeviceId } from '@/types';
import { DEVICE_ICONS } from '@/config/devices';
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

  // Status indicators (read-only)
  const alarmState = devices.alarm;
  const warningLightState = devices.warning_light;
  
  // Controllable devices
  const fanState = devices.fan;
  const pumpState = devices.pump;

  // Emergency is active if either alarm or warning light is on
  const isEmergencyActive = alarmState?.status === 'on' || warningLightState?.status === 'on';
  const isEmergencyOnline = alarmState?.online !== false || warningLightState?.online !== false;

  const handleControlClick = (
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
      onControl(deviceId, action, topic);
    }
  };

  return (
    <>
      <div
        className={cn(
          'rounded-xl border-2 p-4 sm:p-5 transition-all',
          isEmergencyActive
            ? 'border-danger bg-danger/5'
            : 'border-border bg-card'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isEmergencyActive ? 'bg-danger/10' : 'bg-muted'
            )}>
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  isEmergencyActive ? 'text-danger animate-pulse' : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <h2 className="font-semibold text-base">Hệ thống khẩn cấp</h2>
              <p className="text-xs text-muted-foreground">
                Giám sát và điều khiển thiết bị khẩn cấp
              </p>
            </div>
          </div>
          {isEmergencyActive && (
            <span className="px-3 py-1 rounded-full bg-danger text-white text-xs font-bold animate-pulse">
              CẢNH BÁO
            </span>
          )}
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Emergency Alert Status - Full Width Top */}
          <div
            className={cn(
              'col-span-2 flex flex-col items-center justify-center gap-3 p-5 rounded-lg border transition-all',
              isEmergencyActive
                ? 'border-danger bg-danger/10'
                : 'border-border bg-muted/50'
            )}
          >
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl shrink-0',
              isEmergencyActive ? 'bg-danger/20' : 'bg-background'
            )}>
              <Bell className={cn(
                'h-7 w-7',
                isEmergencyActive ? 'text-danger animate-bounce' : 'text-muted-foreground'
              )} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Báo động khẩn cấp</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isEmergencyActive 
                  ? 'Hệ thống đang phát hiện nguy hiểm'
                  : 'Tự động kích hoạt khi phát hiện lửa hoặc gas'
                }
              </p>
            </div>
            {isEmergencyActive && (
              <div className="flex items-center gap-2">
                <span className="px-4 py-1.5 rounded-lg font-semibold bg-danger text-white animate-pulse">
                  ĐANG CẢNH BÁO
                </span>
              </div>
            )}
            {!isEmergencyActive && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isEmergencyOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-success" />
                    <span>Đang hoạt động</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-danger" />
                    <span>Mất kết nối</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Fan Control - Bottom Left */}
          <button
            onClick={() =>
              handleControlClick(
                'fan',
                'Quạt',
                fanState?.status || 'off',
                'home/fan/control'
              )
            }
            disabled={fanState?.online === false}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              fanState?.status === 'on'
                ? 'border-primary bg-primary/10 hover:bg-primary/15'
                : 'border-border bg-card hover:bg-muted'
            )}
          >
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
              fanState?.status === 'on' ? 'bg-primary/20' : 'bg-muted'
            )}>
              {DEVICE_ICONS.fan && (
                <DEVICE_ICONS.fan className={cn(
                  'h-6 w-6',
                  fanState?.status === 'on' ? 'text-primary animate-spin' : 'text-muted-foreground'
                )} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Quạt</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md font-medium',
                    fanState?.status === 'on'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {fanState?.status === 'on' ? 'BẬT' : 'TẮT'}
                </span>
                {fanState?.online ? (
                  <Wifi className="h-3 w-3 text-success" />
                ) : (
                  <WifiOff className="h-3 w-3 text-danger" />
                )}
              </div>
            </div>
          </button>

          {/* Pump Control - Bottom Right */}
          <button
            onClick={() =>
              handleControlClick(
                'pump',
                'Máy bơm',
                pumpState?.status || 'off',
                'home/pump/control'
              )
            }
            disabled={pumpState?.online === false}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              pumpState?.status === 'on'
                ? 'border-primary bg-primary/10 hover:bg-primary/15'
                : 'border-border bg-card hover:bg-muted'
            )}
          >
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
              pumpState?.status === 'on' ? 'bg-primary/20' : 'bg-muted'
            )}>
              {DEVICE_ICONS.pump && (
                <DEVICE_ICONS.pump className={cn(
                  'h-6 w-6',
                  pumpState?.status === 'on' ? 'text-primary' : 'text-muted-foreground'
                )} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Máy bơm</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md font-medium',
                    pumpState?.status === 'on'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {pumpState?.status === 'on' ? 'BẬT' : 'TẮT'}
                </span>
                {pumpState?.online ? (
                  <Wifi className="h-3 w-3 text-success" />
                ) : (
                  <WifiOff className="h-3 w-3 text-danger" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {confirmState && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
          deviceName={confirmState.deviceName}
          action={confirmState.action}
          isEmergency={false}
        />
      )}
    </>
  );
}
