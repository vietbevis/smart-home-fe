import { DeviceConfig, DeviceId } from '@/types';
import { 
  Bell,
  Lightbulb as LightbulbIcon,
  Fan, 
  Droplets, 
  Palette, 
  Lightbulb,
  Sun,
  Shirt,
  LucideIcon 
} from 'lucide-react';

// Icon mapping for each device
export const DEVICE_ICONS: Record<DeviceId, LucideIcon> = {
  alarm: Bell,
  warning_light: LightbulbIcon,
  fan: Fan,
  pump: Droplets,
  neo_bedroom: Palette,
  light_living: Lightbulb,
  light_outdoor: Sun,
  dryer_rack: Shirt,
};

// Device configuration - centralized device definitions
export const DEVICES: DeviceConfig[] = [
  // Emergency status indicators (read-only, controlled by ESP32 sensors)
  {
    id: 'alarm',
    name: 'Alarm Siren',
    nameVi: 'Còi báo động',
    room: 'emergency',
    isEmergency: true,
    mqttTopic: 'home/alert/state',
    controlTopic: 'home/alert/control',
  },
  {
    id: 'warning_light',
    name: 'Warning Light',
    nameVi: 'Đèn cảnh báo',
    room: 'emergency',
    isEmergency: true,
    mqttTopic: 'home/alert/state',
    controlTopic: 'home/alert/control',
  },
  // Emergency controllable devices
  {
    id: 'fan',
    name: 'Fan',
    nameVi: 'Quạt',
    room: 'emergency',
    isEmergency: true,
    mqttTopic: 'home/fan/state',
    controlTopic: 'home/fan/control',
  },
  {
    id: 'pump',
    name: 'Pump',
    nameVi: 'Máy bơm',
    room: 'emergency',
    isEmergency: true,
    mqttTopic: 'home/pump/state',
    controlTopic: 'home/pump/control',
  },

  // Bedroom devices - Only NeoPixel LED
  {
    id: 'neo_bedroom',
    name: 'NeoPixel LED',
    nameVi: 'Đèn LED RGB',
    room: 'bedroom',
    mqttTopic: 'home/light/state',
    controlTopic: 'home/light/control',
  },

  // Living room devices
  {
    id: 'light_living',
    name: 'Living Room Light',
    nameVi: 'Đèn phòng khách',
    room: 'living',
    mqttTopic: 'home/light/state',
    controlTopic: 'home/light/control',
  },

  // Outdoor devices
  {
    id: 'light_outdoor',
    name: 'Outdoor Light',
    nameVi: 'Đèn ngoài trời',
    room: 'outdoor',
    mqttTopic: 'home/light/state',
    controlTopic: 'home/light/control',
  },
  {
    id: 'dryer_rack',
    name: 'Dryer Rack',
    nameVi: 'Giàn phơi',
    room: 'outdoor',
    mqttTopic: 'home/dryer/state',
    controlTopic: 'home/dryer/control',
  },
];

export const ROOMS = {
  bedroom: { name: 'Bedroom', nameVi: 'Phòng ngủ', icon: '🛏️' },
  living: { name: 'Living Room', nameVi: 'Phòng khách', icon: '🛋️' },
  outdoor: { name: 'Outdoor', nameVi: 'Ngoài trời', icon: '🌳' },
} as const;

export const getDevicesByRoom = (room: string) => 
  DEVICES.filter(d => d.room === room && !d.isEmergency);

export const getEmergencyDevices = () => 
  DEVICES.filter(d => d.isEmergency);

export const getDeviceById = (id: string) => 
  DEVICES.find(d => d.id === id);
