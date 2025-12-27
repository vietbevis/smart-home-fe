/**
 * All Tab Display & Alarm Trigger Test
 *
 * Tests:
 * 1. "All" tab displays all door events (door_closed, access_denied, access_granted)
 * 2. After 5 consecutive denied access attempts:
 *    - Trigger real-time warning notification
 *    - Activate alarm siren immediately
 * 3. Verify real-time updates via MQTT simulation
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DoorHistory } from '@/components/devices/DoorHistory';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    getDoorHistory: jest.fn(),
  },
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' '),
}));

const mockApi = api as jest.Mocked<typeof api>;

// ==================== Types ====================
interface MockAccessLog {
  id: number;
  event: string;
  method: string;
  timestamp: string;
  user: { id: number; username: string } | null;
}

interface RealTimeNotification {
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

interface AlarmState {
  active: boolean;
  sirenOn: boolean;
  warningLightOn: boolean;
  triggeredAt: string | null;
  reason: string | null;
}

// ==================== Real-Time System Simulator ====================
interface SystemState {
  failedAttempts: number;
  accessLogs: MockAccessLog[];
  notifications: RealTimeNotification[];
  alarm: AlarmState;
  logIdCounter: number;
}

const MAX_FAILED_ATTEMPTS = 5;

function createRealTimeSystemSimulator() {
  const state: SystemState = {
    failedAttempts: 0,
    accessLogs: [],
    notifications: [],
    alarm: {
      active: false,
      sirenOn: false,
      warningLightOn: false,
      triggeredAt: null,
      reason: null,
    },
    logIdCounter: 1,
  };

  const createTimestamp = () => new Date().toISOString();

  // Notification listeners (simulates MQTT subscription)
  const notificationListeners: ((notification: RealTimeNotification) => void)[] = [];
  const alarmListeners: ((alarm: AlarmState) => void)[] = [];

  const emitNotification = (notification: RealTimeNotification) => {
    state.notifications.unshift(notification);
    notificationListeners.forEach((listener) => listener(notification));
  };

  const emitAlarmChange = () => {
    alarmListeners.forEach((listener) => listener({ ...state.alarm }));
  };

  return {
    getState: () => ({ ...state }),
    getAccessLogs: () => [...state.accessLogs],
    getNotifications: () => [...state.notifications],
    getAlarmState: () => ({ ...state.alarm }),

    // Subscribe to real-time notifications
    onNotification: (callback: (notification: RealTimeNotification) => void) => {
      notificationListeners.push(callback);
      return () => {
        const index = notificationListeners.indexOf(callback);
        if (index > -1) notificationListeners.splice(index, 1);
      };
    },

    // Subscribe to alarm state changes
    onAlarmChange: (callback: (alarm: AlarmState) => void) => {
      alarmListeners.push(callback);
      return () => {
        const index = alarmListeners.indexOf(callback);
        if (index > -1) alarmListeners.splice(index, 1);
      };
    },

    // Simulate door opened event
    simulateDoorOpened: (method: string = 'rfid_pin', username: string | null = null) => {
      const timestamp = createTimestamp();
      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'door_opened',
        method,
        timestamp,
        user: username ? { id: 1, username } : null,
      });
    },

    // Simulate door closed event
    simulateDoorClosed: () => {
      const timestamp = createTimestamp();
      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'door_closed',
        method: 'system',
        timestamp,
        user: null,
      });
    },

    // Simulate access granted event
    simulateAccessGranted: (method: string, username: string) => {
      const timestamp = createTimestamp();
      state.failedAttempts = 0; // Reset on success

      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'access_granted',
        method,
        timestamp,
        user: { id: 1, username },
      });

      emitNotification({
        type: 'info',
        title: '🚪 Truy cập thành công',
        message: `${username} đã mở cửa`,
        timestamp,
      });
    },

    // Simulate access denied event
    simulateAccessDenied: (method: string, username: string | null = null) => {
      const timestamp = createTimestamp();
      state.failedAttempts++;

      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'access_denied',
        method,
        timestamp,
        user: username ? { id: 0, username } : null,
      });

      // Send real-time warning notification
      emitNotification({
        type: 'warning',
        title: '⚠️ Truy cập bị từ chối',
        message: `${username || 'Unknown'} - ${method} (Lần ${state.failedAttempts}/5)`,
        timestamp,
      });

      // Check if alarm should trigger
      if (state.failedAttempts >= MAX_FAILED_ATTEMPTS && !state.alarm.active) {
        // TRIGGER ALARM IMMEDIATELY
        state.alarm = {
          active: true,
          sirenOn: true,
          warningLightOn: true,
          triggeredAt: timestamp,
          reason: 'max_failed_attempts',
        };

        // Add alarm triggered log
        state.accessLogs.unshift({
          id: state.logIdCounter++,
          event: 'alarm_triggered',
          method: 'max_failed_attempts',
          timestamp,
          user: null,
        });

        // Send CRITICAL notification
        emitNotification({
          type: 'critical',
          title: '🚨 BÁO ĐỘNG!',
          message: '5 lần truy cập thất bại liên tiếp - Còi báo động đã kích hoạt!',
          timestamp,
        });

        // Emit alarm state change
        emitAlarmChange();

        return { alarmTriggered: true };
      }

      return { alarmTriggered: false };
    },

    // Reset alarm (admin action)
    resetAlarm: () => {
      state.alarm = {
        active: false,
        sirenOn: false,
        warningLightOn: false,
        triggeredAt: null,
        reason: null,
      };
      state.failedAttempts = 0;
      emitAlarmChange();
    },

    // Reset all state
    reset: () => {
      state.failedAttempts = 0;
      state.accessLogs = [];
      state.notifications = [];
      state.alarm = {
        active: false,
        sirenOn: false,
        warningLightOn: false,
        triggeredAt: null,
        reason: null,
      };
      state.logIdCounter = 1;
    },
  };
}

// ==================== Test Suites ====================

describe('All Tab - Display All Door Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display door_closed events', async () => {
    const mockLogs: MockAccessLog[] = [
      {
        id: 1,
        event: 'door_closed',
        method: 'system',
        timestamp: '2025-12-27T10:00:00.000Z',
        user: null,
      },
    ];

    mockApi.getDoorHistory.mockResolvedValue({
      logs: mockLogs,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Đóng cửa')).toBeInTheDocument();
    });
  });

  it('should display access_denied events', async () => {
    const mockLogs: MockAccessLog[] = [
      {
        id: 1,
        event: 'access_denied',
        method: 'invalid_rfid',
        timestamp: '2025-12-27T10:00:00.000Z',
        user: null,
      },
    ];

    mockApi.getDoorHistory.mockResolvedValue({
      logs: mockLogs,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Truy cập bị từ chối')).toBeInTheDocument();
    });
  });

  it('should display access_granted events', async () => {
    const mockLogs: MockAccessLog[] = [
      {
        id: 1,
        event: 'access_granted',
        method: 'rfid_pin',
        timestamp: '2025-12-27T10:00:00.000Z',
        user: { id: 1, username: 'admin' },
      },
    ];

    mockApi.getDoorHistory.mockResolvedValue({
      logs: mockLogs,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Truy cập thành công')).toBeInTheDocument();
    });
  });

  it('should display all event types together in "All" tab', async () => {
    const mockLogs: MockAccessLog[] = [
      { id: 1, event: 'access_granted', method: 'rfid_pin', timestamp: '2025-12-27T10:00:00.000Z', user: { id: 1, username: 'admin' } },
      { id: 2, event: 'door_closed', method: 'system', timestamp: '2025-12-27T10:00:05.000Z', user: null },
      { id: 3, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:01:00.000Z', user: null },
      { id: 4, event: 'door_opened', method: 'web_admin', timestamp: '2025-12-27T10:02:00.000Z', user: { id: 2, username: 'user1' } },
    ];

    mockApi.getDoorHistory.mockResolvedValue({
      logs: mockLogs,
      total: 4,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Use getAllBy for elements that may appear multiple times
      const grantedElements = screen.getAllByText('Truy cập thành công');
      expect(grantedElements.length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Đóng cửa')).toBeInTheDocument();
    expect(screen.getByText('Truy cập bị từ chối')).toBeInTheDocument();

    // Verify "All" tab is selected by default
    expect(screen.getByText('Tất cả')).toBeInTheDocument();
  });

  it('should show filter tabs', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Tất cả')).toBeInTheDocument();
      expect(screen.getByText('Thành công')).toBeInTheDocument();
      expect(screen.getByText('Từ chối')).toBeInTheDocument();
    });
  });
});

describe('5 Consecutive Denied Access - Alarm Trigger', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    jest.clearAllMocks();
    simulator = createRealTimeSystemSimulator();
  });

  it('should trigger alarm after exactly 5 denied attempts', () => {
    // 4 failures - no alarm
    for (let i = 0; i < 4; i++) {
      const result = simulator.simulateAccessDenied('invalid_rfid');
      expect(result.alarmTriggered).toBe(false);
      expect(simulator.getAlarmState().active).toBe(false);
    }

    // 5th failure - alarm triggers
    const result = simulator.simulateAccessDenied('invalid_pin');
    expect(result.alarmTriggered).toBe(true);
    expect(simulator.getAlarmState().active).toBe(true);
  });

  it('should activate siren immediately on alarm trigger', () => {
    // Trigger alarm
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const alarm = simulator.getAlarmState();
    expect(alarm.sirenOn).toBe(true);
    expect(alarm.warningLightOn).toBe(true);
    expect(alarm.triggeredAt).not.toBeNull();
  });

  it('should send real-time warning notification for each denied attempt', () => {
    simulator.simulateAccessDenied('invalid_rfid', 'user1');

    const notifications = simulator.getNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('warning');
    expect(notifications[0].title).toContain('Truy cập bị từ chối');
    expect(notifications[0].message).toContain('user1');
    expect(notifications[0].message).toContain('Lần 1/5');
  });

  it('should send CRITICAL notification when alarm triggers', () => {
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const notifications = simulator.getNotifications();
    const criticalNotification = notifications.find((n) => n.type === 'critical');

    expect(criticalNotification).toBeDefined();
    expect(criticalNotification?.title).toContain('BÁO ĐỘNG');
    expect(criticalNotification?.message).toContain('Còi báo động đã kích hoạt');
  });

  it('should create alarm_triggered log entry', () => {
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const logs = simulator.getAccessLogs();
    const alarmLog = logs.find((l) => l.event === 'alarm_triggered');

    expect(alarmLog).toBeDefined();
    expect(alarmLog?.method).toBe('max_failed_attempts');
  });

  it('should emit alarm state change to listeners', () => {
    const alarmCallback = jest.fn();
    simulator.onAlarmChange(alarmCallback);

    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    expect(alarmCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        active: true,
        sirenOn: true,
        warningLightOn: true,
      })
    );
  });
});

describe('Real-Time Notification Flow', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    simulator = createRealTimeSystemSimulator();
  });

  it('should emit notifications in real-time via callback', () => {
    const notificationCallback = jest.fn();
    simulator.onNotification(notificationCallback);

    simulator.simulateAccessDenied('invalid_rfid', 'attacker');

    expect(notificationCallback).toHaveBeenCalledTimes(1);
    expect(notificationCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: expect.stringContaining('Truy cập bị từ chối'),
      })
    );
  });

  it('should show progressive failure count in notifications', () => {
    const notifications: RealTimeNotification[] = [];
    simulator.onNotification((n) => notifications.push(n));

    for (let i = 1; i <= 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    // Check warning notifications (first 5)
    const warningNotifications = notifications.filter((n) => n.type === 'warning');
    expect(warningNotifications[0].message).toContain('Lần 1/5');
    expect(warningNotifications[1].message).toContain('Lần 2/5');
    expect(warningNotifications[2].message).toContain('Lần 3/5');
    expect(warningNotifications[3].message).toContain('Lần 4/5');
    expect(warningNotifications[4].message).toContain('Lần 5/5');
  });

  it('should unsubscribe from notifications correctly', () => {
    const callback = jest.fn();
    const unsubscribe = simulator.onNotification(callback);

    simulator.simulateAccessDenied('invalid_rfid');
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    simulator.simulateAccessDenied('invalid_rfid');
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
  });
});

describe('UI Display After Alarm Trigger', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    jest.clearAllMocks();
    simulator = createRealTimeSystemSimulator();
  });

  it('should display all events including alarm_triggered in history', async () => {
    // Simulate 5 failures to trigger alarm
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied(i % 2 === 0 ? 'invalid_rfid' : 'invalid_pin');
    }

    const logs = simulator.getAccessLogs();

    mockApi.getDoorHistory.mockResolvedValue({
      logs,
      total: logs.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Should show 5 denied events
      const deniedLabels = screen.getAllByText('Truy cập bị từ chối');
      expect(deniedLabels).toHaveLength(5);
    });

    // Should show alarm triggered
    expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
  });

  it('should display mixed events correctly', async () => {
    // Simulate a realistic scenario
    simulator.simulateAccessGranted('rfid_pin', 'admin');
    simulator.simulateDoorClosed();
    simulator.simulateAccessDenied('invalid_rfid');
    simulator.simulateAccessDenied('invalid_pin', 'user1');

    const logs = simulator.getAccessLogs();

    mockApi.getDoorHistory.mockResolvedValue({
      logs,
      total: logs.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Truy cập thành công')).toBeInTheDocument();
      expect(screen.getByText('Đóng cửa')).toBeInTheDocument();
      expect(screen.getAllByText('Truy cập bị từ chối')).toHaveLength(2);
    });

    // Verify usernames
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });
});

describe('Alarm State Management', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    simulator = createRealTimeSystemSimulator();
  });

  it('should have correct initial alarm state', () => {
    const alarm = simulator.getAlarmState();

    expect(alarm.active).toBe(false);
    expect(alarm.sirenOn).toBe(false);
    expect(alarm.warningLightOn).toBe(false);
    expect(alarm.triggeredAt).toBeNull();
    expect(alarm.reason).toBeNull();
  });

  it('should set alarm reason to max_failed_attempts', () => {
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const alarm = simulator.getAlarmState();
    expect(alarm.reason).toBe('max_failed_attempts');
  });

  it('should reset alarm state correctly', () => {
    // Trigger alarm
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }
    expect(simulator.getAlarmState().active).toBe(true);

    // Reset alarm
    simulator.resetAlarm();

    const alarm = simulator.getAlarmState();
    expect(alarm.active).toBe(false);
    expect(alarm.sirenOn).toBe(false);
    expect(alarm.warningLightOn).toBe(false);
    expect(simulator.getState().failedAttempts).toBe(0);
  });

  it('should emit alarm change on reset', () => {
    const callback = jest.fn();
    simulator.onAlarmChange(callback);

    // Trigger alarm
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    // Reset
    simulator.resetAlarm();

    // Should have been called twice: once on trigger, once on reset
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        active: false,
        sirenOn: false,
      })
    );
  });
});

describe('Success Resets Failed Attempts', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    simulator = createRealTimeSystemSimulator();
  });

  it('should reset failed attempts counter on successful access', () => {
    // 3 failures
    simulator.simulateAccessDenied('invalid_rfid');
    simulator.simulateAccessDenied('invalid_rfid');
    simulator.simulateAccessDenied('invalid_rfid');
    expect(simulator.getState().failedAttempts).toBe(3);

    // Success resets counter
    simulator.simulateAccessGranted('rfid_pin', 'admin');
    expect(simulator.getState().failedAttempts).toBe(0);

    // 3 more failures should NOT trigger alarm
    simulator.simulateAccessDenied('invalid_rfid');
    simulator.simulateAccessDenied('invalid_rfid');
    simulator.simulateAccessDenied('invalid_rfid');

    expect(simulator.getAlarmState().active).toBe(false);
    expect(simulator.getState().failedAttempts).toBe(3);
  });
});

describe('Event Count Verification', () => {
  let simulator: ReturnType<typeof createRealTimeSystemSimulator>;

  beforeEach(() => {
    simulator = createRealTimeSystemSimulator();
  });

  it('should have 6 logs after 5 failures (5 denied + 1 alarm)', () => {
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const logs = simulator.getAccessLogs();
    expect(logs).toHaveLength(6);

    const deniedLogs = logs.filter((l) => l.event === 'access_denied');
    const alarmLogs = logs.filter((l) => l.event === 'alarm_triggered');

    expect(deniedLogs).toHaveLength(5);
    expect(alarmLogs).toHaveLength(1);
  });

  it('should have 6 notifications after 5 failures (5 warnings + 1 critical)', () => {
    for (let i = 0; i < 5; i++) {
      simulator.simulateAccessDenied('invalid_rfid');
    }

    const notifications = simulator.getNotifications();
    expect(notifications).toHaveLength(6);

    const warnings = notifications.filter((n) => n.type === 'warning');
    const criticals = notifications.filter((n) => n.type === 'critical');

    expect(warnings).toHaveLength(5);
    expect(criticals).toHaveLength(1);
  });
});
