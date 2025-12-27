export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export type DeviceId = 
  | 'fan' 
  | 'pump' 
  | 'alarm' 
  | 'warning_light'
  | 'neo_bedroom'
  | 'light_living' 
  | 'light_outdoor'
  | 'dryer_rack';

export type DeviceStatus = 'on' | 'off' | 'open' | 'closed' | 'unknown';

export interface DeviceState {
  status: DeviceStatus;
  online: boolean;
  lastUpdated?: number;
  color?: string; // RGB hex color for NeoPixel
  mode?: string; // For outdoor light: 'auto' | 'off'
}

export interface DeviceConfig {
  id: DeviceId;
  name: string;
  nameVi: string;
  room?: 'bedroom' | 'living' | 'outdoor' | 'emergency';
  isEmergency?: boolean;
  mqttTopic: string;
  controlTopic: string;
}

export interface SensorData {
  gas?: { level: number; threshold: number };
  fire?: { detected: boolean; value: number };
  light?: { bright: boolean };
  rain?: { raining: boolean };
  dryer?: { out: boolean };
}

export interface Alert {
  id: number;
  type: 'fire' | 'gas' | 'door';
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  createdAt: string;
  acknowledgedBy?: { id: number; username: string } | null;
}

export type Permission = 
  | 'device:control'
  | 'emergency:control'
  | 'security:view'
  | 'security:manage'
  | 'users:manage'
  | 'alerts:view';

export interface DoorHistoryLog {
  id: number;
  event: 'door_opened' | 'door_closed' | 'access_granted';
  method: string | null;
  timestamp: string;
  user: { id: number; username: string } | null;
}
