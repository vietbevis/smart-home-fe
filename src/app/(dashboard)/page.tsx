'use client';

import { useMqtt } from '@/hooks/useMqtt';
import { usePermissions } from '@/hooks/usePermissions';
import { EmergencyPanel } from '@/components/devices/EmergencyPanel';
import { RoomSection } from '@/components/devices/RoomSection';
import { SensorPanel } from '@/components/devices/SensorPanel';
import { RealTimeClock } from '@/components/ui/RealTimeClock';
import { DeviceId } from '@/types';

export default function DashboardPage() {
  const { connected, devices, sensors, controlDevice } = useMqtt();
  const { can } = usePermissions();

  const handleEmergencyControl = (
    deviceId: DeviceId,
    action: 'on' | 'off',
    topic: string
  ) => {
    if (!can('emergency:control')) return;
    controlDevice(deviceId, action, topic);
  };

  const handleDeviceControl = (
    deviceId: DeviceId,
    action: 'on' | 'off',
    topic: string,
    extra?: object
  ) => {
    if (!can('device:control')) return;
    controlDevice(deviceId, action, topic, extra);
  };

  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
        {/* Header with mobile clock */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Bảng điều khiển</h1>
            <p className="text-sm text-muted-foreground">
              Giám sát và điều khiển thiết bị thông minh
            </p>
          </div>
          
          {/* Mobile clock - visible on small screens */}
          <div className="lg:hidden">
            <RealTimeClock connected={connected} compact />
          </div>
        </div>

        {/* Emergency Panel */}
        <EmergencyPanel
          devices={devices}
          onControl={handleEmergencyControl}
        />

        {/* Sensors Panel - with device state for sync */}
        <SensorPanel sensors={sensors} devices={devices} />

        {/* Room Sections */}
        <div className="space-y-4">
          <RoomSection
            room="bedroom"
            devices={devices}
            onControl={handleDeviceControl}
          />
          <RoomSection
            room="living"
            devices={devices}
            onControl={handleDeviceControl}
          />
          <RoomSection
            room="outdoor"
            devices={devices}
            onControl={handleDeviceControl}
          />
        </div>
      </div>

      {/* Right sidebar - Clock (desktop only) */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-4">
          <RealTimeClock connected={connected} />
        </div>
      </div>
    </div>
  );
}
