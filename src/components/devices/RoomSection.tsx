'use client';

import { Bed, Sofa, TreePine, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceId, DeviceState } from '@/types';
import { DeviceCard } from './DeviceCard';
import { NeoPixelCard } from './NeoPixelCard';
import { DryerRackCard } from './DryerRackCard';
import { getDevicesByRoom, ROOMS } from '@/config/devices';

interface RoomSectionProps {
  room: 'bedroom' | 'living' | 'outdoor';
  devices: Record<DeviceId, DeviceState>;
  onControl: (deviceId: DeviceId, action: 'on' | 'off', topic: string, extra?: object) => void;
}

const ROOM_ICONS: Record<string, LucideIcon> = {
  bedroom: Bed,
  living: Sofa,
  outdoor: TreePine,
};

export function RoomSection({ room, devices, onControl }: RoomSectionProps) {
  const roomConfig = ROOMS[room];
  const roomDevices = getDevicesByRoom(room);
  const RoomIcon = ROOM_ICONS[room];

  if (roomDevices.length === 0) return null;

  const hasActiveDevice = roomDevices.some(d => {
    const state = devices[d.id];
    return state?.status === 'on' || state?.status === 'open';
  });
  const activeCount = roomDevices.filter(d => {
    const state = devices[d.id];
    return state?.status === 'on' || state?.status === 'open';
  }).length;

  const getExtraPayload = (deviceId: DeviceId, color?: string) => {
    switch (deviceId) {
      case 'light_living':
        return { device: 'living' };
      case 'light_outdoor':
        return { device: 'outside' };
      case 'neo_bedroom':
        // Always include device: 'neopixel' for both on and off
        return color ? { device: 'neopixel', color } : { device: 'neopixel' };
      default:
        return {};
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      {/* Room header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            hasActiveDevice ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          {RoomIcon && (
            <RoomIcon 
              className={cn(
                'h-4 w-4',
                hasActiveDevice ? 'text-primary' : 'text-muted-foreground'
              )} 
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base truncate">
            {roomConfig.nameVi}
          </h2>
        </div>
        {hasActiveDevice && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
            {activeCount} hoạt động
          </span>
        )}
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {roomDevices.map(device => {
          // Use NeoPixelCard for neo_bedroom device
          if (device.id === 'neo_bedroom') {
            return (
              <NeoPixelCard
                key={device.id}
                config={device}
                state={devices[device.id] || { status: 'unknown', online: false }}
                onControl={(action, color) => 
                  onControl(device.id, action, device.controlTopic, getExtraPayload(device.id, color))
                }
              />
            );
          }
          
          // Use DryerRackCard for dryer_rack device
          if (device.id === 'dryer_rack') {
            return (
              <DryerRackCard
                key={device.id}
                config={device}
                state={devices[device.id] || { status: 'unknown', online: false }}
                onControl={(action) => 
                  onControl(device.id, action, device.controlTopic)
                }
              />
            );
          }
          
          return (
            <DeviceCard
              key={device.id}
              config={device}
              state={devices[device.id] || { status: 'unknown', online: false }}
              onControl={(action) => 
                onControl(device.id, action, device.controlTopic, getExtraPayload(device.id))
              }
            />
          );
        })}
      </div>
    </section>
  );
}
