'use client';

import { useMqtt } from '@/hooks/useMqtt';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { EmergencyPanel } from '@/components/devices/EmergencyPanel';
import { RoomSection } from '@/components/devices/RoomSection';
import { SensorPanel } from '@/components/devices/SensorPanel';
import { RealTimeClock } from '@/components/ui/RealTimeClock';
import { DynamicGreeting } from '@/components/layout/DynamicGreeting';
import { DeviceId } from '@/types';

export default function DashboardPage() {
  const { connected, devices, sensors, controlDevice } = useMqtt();
  const { can } = usePermissions();
  const { user } = useAuth();

  const activeDevices = Object.values(devices).filter(d => d.state === 'on').length;
  const totalDevices = Object.keys(devices).length;

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
        {/* Dynamic Greeting */}
        {user && (
          <DynamicGreeting 
            user={user} 
            deviceCount={totalDevices}
            activeDevices={activeDevices}
          />
        )}
        
        {/* Mobile clock - visible on small screens */}
        <div className="lg:hidden">
          <RealTimeClock connected={connected} compact />
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
