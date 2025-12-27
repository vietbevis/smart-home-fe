'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { toast } from 'sonner';
import { DeviceId, DeviceState, SensorData } from '@/types';

const BROKER_URL = process.env.NEXT_PUBLIC_MQTT_WS_URL || 'wss://emqx-ws.vittapcode.id.vn/mqtt';
const MQTT_USERNAME = 'test';
const MQTT_PASSWORD = 'viet';

type DeviceStates = Record<DeviceId, DeviceState>;

const defaultDeviceState: DeviceState = { status: 'unknown', online: false };

const initialDeviceStates: DeviceStates = {
  fan: { ...defaultDeviceState },
  pump: { ...defaultDeviceState },
  alarm: { ...defaultDeviceState },
  warning_light: { ...defaultDeviceState },
  light_living: { ...defaultDeviceState },
  light_outdoor: { ...defaultDeviceState },
  neo_bedroom: { ...defaultDeviceState },
  dryer_rack: { ...defaultDeviceState },
};

// Singleton state
let mqttClient: MqttClient | null = null;
let deviceStates: DeviceStates = { ...initialDeviceStates };
let sensorData: SensorData = {};
let isConnected = false;
let unreadAlertCount = 0;

const listeners = new Set<() => void>();
const alertListeners = new Set<(alert: any) => void>();
const unreadCountListeners = new Set<(count: number) => void>();
const rfidLostListeners = new Set<(data: { userId: number; username: string; cardUid: string }) => void>();
const enrollmentListeners = new Set<(data: { success: boolean; message: string; username?: string }) => void>();
const alertSound = typeof window !== 'undefined' ? new Audio('/alert.mp3') : null;

// Mark all devices as online when MQTT connects
function setAllDevicesOnline(online: boolean) {
  Object.keys(deviceStates).forEach(key => {
    deviceStates[key as DeviceId].online = online;
  });
}

// Convert ESP32 color index to hex color
function indexToColor(index: number): string {
  const colors: Record<number, string> = {
    1: '#FF0000', // Red
    2: '#00FF00', // Green
    3: '#0000FF', // Blue
    4: '#FFFF00', // Yellow
    5: '#FF00FF', // Magenta
    6: '#00FFFF', // Cyan
    7: '#FFFFFF', // White
  };
  return colors[index] || '#FFFFFF';
}

function notify() {
  listeners.forEach(l => l());
}

function showAlert(title: string, message: string, type: 'error' | 'warning' = 'error') {
  toast[type](`${title}: ${message}`);
  alertSound?.play().catch(() => {});
}

function handleMessage(topic: string, payload: Buffer) {
  try {
    const data = JSON.parse(payload.toString());
    console.log(`MQTT [${topic}]:`, data);

    // Fan state
    if (topic === 'home/fan/state') {
      deviceStates.fan = {
        status: data.status,
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
    }
    // Pump state
    else if (topic === 'home/pump/state') {
      deviceStates.pump = {
        status: data.status,
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
    }
    // Alert/Emergency state
    else if (topic === 'home/alert/state') {
      const isActive = data.active;
      deviceStates.alarm = {
        status: isActive ? 'on' : 'off',
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
      deviceStates.warning_light = {
        status: isActive ? 'on' : 'off',
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
    }
    // Light states
    else if (topic === 'home/light/state') {
      deviceStates.light_living = {
        status: data.living === 'on' ? 'on' : 'off',
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
      // Outdoor light: 'auto' means it follows sensor, but we show it as 'on' mode
      deviceStates.light_outdoor = {
        status: data.outside === 'auto' ? 'on' : 'off',
        online: data.online ?? true,
        lastUpdated: Date.now(),
        // Store the actual mode for display
        mode: data.outside,
      };
      // NeoPixel with color support
      const neoColor = data.neopixelColor || (data.bedroomColor > 0 ? indexToColor(data.bedroomColor) : undefined);
      const neoIsOn = data.neopixel === 'on' || data.bedroomColor > 0;
      deviceStates.neo_bedroom = {
        status: neoIsOn ? 'on' : 'off',
        online: data.online ?? true,
        lastUpdated: Date.now(),
        color: neoIsOn ? neoColor : deviceStates.neo_bedroom.color, // Preserve color when off
      };
    }
    // Dryer rack state
    else if (topic === 'home/dryer/state') {
      deviceStates.dryer_rack = {
        status: data.out ? 'open' : 'closed',
        online: data.online ?? true,
        lastUpdated: Date.now(),
      };
      sensorData.dryer = { out: data.out ?? false };
    }
    // Door state
    else if (topic === 'home/door/state') {
      if (data.abnormal) {
        showAlert('🚪 Cảnh báo cửa', 'Phát hiện truy cập bất thường!', 'warning');
      }
    }
    // Sensors
    else if (topic === 'home/sensor/gas') {
      sensorData.gas = { level: data.level, threshold: data.threshold };
      if (data.level > data.threshold) {
        showAlert('⚠️ Rò rỉ gas!', `Nồng độ: ${data.level} ppm`);
      }
    }
    else if (topic === 'home/sensor/fire') {
      sensorData.fire = { detected: data.detected, value: data.value };
      if (data.detected) {
        showAlert('🔥 Phát hiện cháy!', data.location || 'Vị trí không xác định');
      }
    }
    else if (topic === 'home/sensor/light') {
      sensorData.light = { bright: data.bright };
    }
    else if (topic === 'home/sensor/rain') {
      sensorData.rain = { raining: data.raining };
    }
    // Alert events
    else if (topic === 'home/alert') {
      const alertType = data.level === 'CRITICAL' ? 'error' : 'warning';
      showAlert(`${data.type.toUpperCase()}`, data.message, alertType);
    }
    // Real-time new alerts from backend
    else if (topic === 'home/alert/new') {
      console.log('📢 New alert received:', data);
      // Increment unread count
      unreadAlertCount++;
      unreadCountListeners.forEach(listener => listener(unreadAlertCount));
      // Notify alert listeners
      alertListeners.forEach(listener => listener(data));
      // Show toast notification
      const alertType = data.level === 'CRITICAL' ? 'error' : 'warning';
      showAlert(`${data.type.toUpperCase()}`, data.message, alertType);
    }
    // RFID card reported lost
    else if (topic === 'home/rfid/lost') {
      console.log('🚨 RFID card reported lost:', data);
      rfidLostListeners.forEach(listener => listener(data));
      showAlert('🚨 Thẻ RFID bị mất', `${data.username} đã báo mất thẻ`, 'warning');
    }
    // RFID enrollment result
    else if (topic === 'door/enrollment/result') {
      console.log('📝 Enrollment result:', data);
      enrollmentListeners.forEach(listener => listener(data));
      if (data.success) {
        showAlert('✅ Đăng ký thẻ', data.message || `Đã đăng ký cho ${data.username}`, 'warning');
      }
    }

    notify();
  } catch (e) {
    console.error('MQTT parse error:', e);
  }
}

function connect() {
  if (mqttClient) return;

  const options = {
    clientId: 'smarthome_web_' + Math.random().toString(16).substr(2, 8),
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 5000,
    protocolVersion: 4 as const,
  };

  console.log('Connecting to:', BROKER_URL);

  mqttClient = mqtt.connect(BROKER_URL, options);

  mqttClient.on('connect', () => {
    console.log('MQTT connected');
    isConnected = true;
    // Mark all devices as online when connected
    setAllDevicesOnline(true);
    notify();

    mqttClient?.subscribe([
      'home/fan/state',
      'home/pump/state',
      'home/door/state',
      'home/light/state',
      'home/alert/state',
      'home/dryer/state',
      'home/sensor/gas',
      'home/sensor/fire',
      'home/sensor/light',
      'home/sensor/rain',
      'home/device/heartbeat',
      'home/alert',
      'home/alert/new', // Real-time alerts from backend
      'home/rfid/lost', // RFID card lost notifications
      'door/enrollment/result', // RFID enrollment results
    ]);
  });

  mqttClient.on('message', handleMessage);
  mqttClient.on('error', (err) => console.error('MQTT error:', err));
  mqttClient.on('close', () => {
    isConnected = false;
    setAllDevicesOnline(false);
    notify();
  });
}

export function useMqtt() {
  const [, forceUpdate] = useState(0);
  const pendingRollbacks = useRef<Map<DeviceId, DeviceState>>(new Map());

  useEffect(() => {
    const listener = () => forceUpdate(x => x + 1);
    listeners.add(listener);
    connect();
    return () => { listeners.delete(listener); };
  }, []);

  const publish = useCallback((topic: string, payload: object) => {
    if (mqttClient?.connected) {
      const message = JSON.stringify(payload);
      console.log(`MQTT PUBLISH [${topic}]:`, payload);
      mqttClient.publish(topic, message);
      return true;
    }
    console.warn('MQTT not connected, cannot publish');
    return false;
  }, []);

  // Control device with optimistic update and rollback
  const controlDevice = useCallback((
    deviceId: DeviceId,
    action: 'on' | 'off',
    controlTopic: string,
    extraPayload?: object
  ) => {
    console.log(`Control device: ${deviceId}, action: ${action}, topic: ${controlTopic}`, extraPayload);
    
    const previousState = { ...deviceStates[deviceId] };
    
    // Optimistic update
    const newState: DeviceState = {
      ...deviceStates[deviceId],
      status: action,
      online: true,
      lastUpdated: Date.now(),
    };
    
    // Preserve or set color for NeoPixel
    if (deviceId === 'neo_bedroom') {
      if (action === 'on' && extraPayload && 'color' in extraPayload) {
        newState.color = (extraPayload as { color?: string }).color;
      } else if (action === 'off') {
        // Keep color but mark as off
        newState.color = previousState.color;
      }
    }
    
    deviceStates[deviceId] = newState;
    notify();

    // Store for rollback
    pendingRollbacks.current.set(deviceId, previousState);

    // Send MQTT command
    const success = publish(controlTopic, { action, ...extraPayload });

    if (!success) {
      // Immediate rollback if publish failed
      deviceStates[deviceId] = previousState;
      notify();
      toast.error('Không thể gửi lệnh. Kiểm tra kết nối MQTT.');
      return;
    }

    // Rollback after timeout if no state update received
    setTimeout(() => {
      const pending = pendingRollbacks.current.get(deviceId);
      if (pending && deviceStates[deviceId].lastUpdated === newState.lastUpdated) {
        // Only rollback if state hasn't been updated by MQTT response
        console.warn(`No response for ${deviceId}, rolling back`);
        deviceStates[deviceId] = pending;
        notify();
        toast.error(`Không nhận được phản hồi từ thiết bị`);
      }
      pendingRollbacks.current.delete(deviceId);
    }, 5000);
  }, [publish]);

  return {
    connected: isConnected,
    devices: deviceStates,
    sensors: sensorData,
    publish,
    controlDevice,
  };
}

// Subscribe to real-time alerts
export function subscribeToAlerts(callback: (alert: any) => void) {
  alertListeners.add(callback);
  return () => {
    alertListeners.delete(callback);
  };
}

// Subscribe to unread alert count changes
export function subscribeToUnreadCount(callback: (count: number) => void) {
  unreadCountListeners.add(callback);
  // Immediately call with current count
  callback(unreadAlertCount);
  return () => {
    unreadCountListeners.delete(callback);
  };
}

// Get current unread count
export function getUnreadAlertCount() {
  return unreadAlertCount;
}

// Clear unread count (call when user views alerts)
export function clearUnreadAlerts() {
  unreadAlertCount = 0;
  unreadCountListeners.forEach(listener => listener(0));
}

// Subscribe to RFID lost card events
export function subscribeToRfidLost(callback: (data: { userId: number; username: string; cardUid: string }) => void) {
  rfidLostListeners.add(callback);
  return () => {
    rfidLostListeners.delete(callback);
  };
}

// Subscribe to enrollment result events
export function subscribeToEnrollment(callback: (data: { success: boolean; message: string; username?: string }) => void) {
  enrollmentListeners.add(callback);
  return () => {
    enrollmentListeners.delete(callback);
  };
}
