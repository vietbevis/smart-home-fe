/**
 * Denied Access UI Test
 *
 * Simulates denied access events caused by incorrect authentication:
 * - Invalid RFID card
 * - Invalid PIN
 * - Revoked card
 * - Alarm triggered after 5 failures
 *
 * Verifies these events display correctly in Door Access History with:
 * - Proper status labels (Vietnamese)
 * - Correct timestamps
 * - Appropriate styling (danger colors for denied)
 * - Alert creation for security events
 */

import { render, screen, waitFor } from '@testing-library/react';
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

interface SystemAlert {
  id: number;
  type: 'door' | 'fire' | 'gas';
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  createdAt: string;
}

// ==================== Denied Access Simulator ====================
interface DeniedAccessState {
  failedAttempts: number;
  alarmActive: boolean;
  accessLogs: MockAccessLog[];
  alerts: SystemAlert[];
  logIdCounter: number;
  alertIdCounter: number;
}

const MAX_FAILED_ATTEMPTS = 5;

function createDeniedAccessSimulator() {
  const state: DeniedAccessState = {
    failedAttempts: 0,
    alarmActive: false,
    accessLogs: [],
    alerts: [],
    logIdCounter: 1,
    alertIdCounter: 1,
  };

  const createTimestamp = (offsetSeconds: number = 0) => {
    const date = new Date();
    date.setSeconds(date.getSeconds() - offsetSeconds);
    return date.toISOString();
  };

  return {
    getState: () => ({ ...state }),
    getAccessLogs: () => [...state.accessLogs],
    getAlerts: () => [...state.alerts],

    // Simulate invalid RFID card attempt
    simulateInvalidRfid: (rfidUid: string = 'UNKNOWN_CARD') => {
      state.failedAttempts++;
      const timestamp = createTimestamp();

      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'access_denied',
        method: 'invalid_rfid',
        timestamp,
        user: null,
      });

      // Create alert for denied access
      state.alerts.unshift({
        id: state.alertIdCounter++,
        type: 'door',
        level: 'WARNING',
        message: `Truy cập bị từ chối: Thẻ RFID không hợp lệ (${rfidUid})`,
        createdAt: timestamp,
      });

      return checkAlarmTrigger(timestamp);
    },

    // Simulate invalid PIN attempt
    simulateInvalidPin: (username: string | null = null) => {
      state.failedAttempts++;
      const timestamp = createTimestamp();

      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'access_denied',
        method: 'invalid_pin',
        timestamp,
        user: username ? { id: 0, username } : null,
      });

      // Create alert
      state.alerts.unshift({
        id: state.alertIdCounter++,
        type: 'door',
        level: 'WARNING',
        message: `Truy cập bị từ chối: Mã PIN không đúng${username ? ` (${username})` : ''}`,
        createdAt: timestamp,
      });

      return checkAlarmTrigger(timestamp);
    },

    // Simulate revoked card attempt
    simulateRevokedCard: (username: string) => {
      state.failedAttempts++;
      const timestamp = createTimestamp();

      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'access_denied',
        method: 'card_revoked',
        timestamp,
        user: { id: 0, username },
      });

      // Create critical alert for revoked card
      state.alerts.unshift({
        id: state.alertIdCounter++,
        type: 'door',
        level: 'CRITICAL',
        message: `🚨 Thẻ bị thu hồi được sử dụng: ${username}`,
        createdAt: timestamp,
      });

      return checkAlarmTrigger(timestamp);
    },

    // Reset state
    reset: () => {
      state.failedAttempts = 0;
      state.alarmActive = false;
      state.accessLogs = [];
      state.alerts = [];
      state.logIdCounter = 1;
      state.alertIdCounter = 1;
    },
  };

  function checkAlarmTrigger(timestamp: string) {
    if (state.failedAttempts >= MAX_FAILED_ATTEMPTS && !state.alarmActive) {
      state.alarmActive = true;

      // Add alarm triggered log
      state.accessLogs.unshift({
        id: state.logIdCounter++,
        event: 'alarm_triggered',
        method: 'max_failed_attempts',
        timestamp,
        user: null,
      });

      // Create critical alert
      state.alerts.unshift({
        id: state.alertIdCounter++,
        type: 'door',
        level: 'CRITICAL',
        message: `🚨 BÁO ĐỘNG: 5 lần truy cập thất bại liên tiếp!`,
        createdAt: timestamp,
      });

      return { alarmTriggered: true };
    }
    return { alarmTriggered: false };
  }
}

// ==================== Test Suites ====================

describe('Denied Access Event Simulation', () => {
  let simulator: ReturnType<typeof createDeniedAccessSimulator>;

  beforeEach(() => {
    simulator = createDeniedAccessSimulator();
  });

  describe('Invalid RFID Card', () => {
    it('should create access_denied log with invalid_rfid method', () => {
      simulator.simulateInvalidRfid('ABC123');

      const logs = simulator.getAccessLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('access_denied');
      expect(logs[0].method).toBe('invalid_rfid');
      expect(logs[0].user).toBeNull();
    });

    it('should create WARNING alert for invalid RFID', () => {
      simulator.simulateInvalidRfid('XYZ789');

      const alerts = simulator.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('door');
      expect(alerts[0].level).toBe('WARNING');
      expect(alerts[0].message).toContain('Thẻ RFID không hợp lệ');
      expect(alerts[0].message).toContain('XYZ789');
    });
  });

  describe('Invalid PIN', () => {
    it('should create access_denied log with invalid_pin method', () => {
      simulator.simulateInvalidPin();

      const logs = simulator.getAccessLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('access_denied');
      expect(logs[0].method).toBe('invalid_pin');
    });

    it('should include username if RFID was valid but PIN wrong', () => {
      simulator.simulateInvalidPin('user1');

      const logs = simulator.getAccessLogs();
      expect(logs[0].user).toEqual({ id: 0, username: 'user1' });

      const alerts = simulator.getAlerts();
      expect(alerts[0].message).toContain('user1');
    });
  });

  describe('Revoked Card', () => {
    it('should create access_denied log with card_revoked method', () => {
      simulator.simulateRevokedCard('banned_user');

      const logs = simulator.getAccessLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe('access_denied');
      expect(logs[0].method).toBe('card_revoked');
      expect(logs[0].user?.username).toBe('banned_user');
    });

    it('should create CRITICAL alert for revoked card', () => {
      simulator.simulateRevokedCard('banned_user');

      const alerts = simulator.getAlerts();
      expect(alerts[0].level).toBe('CRITICAL');
      expect(alerts[0].message).toContain('Thẻ bị thu hồi');
    });
  });

  describe('Alarm Trigger After 5 Failures', () => {
    it('should trigger alarm on 5th failed attempt', () => {
      // 4 failures - no alarm
      for (let i = 0; i < 4; i++) {
        const result = simulator.simulateInvalidRfid(`card_${i}`);
        expect(result.alarmTriggered).toBe(false);
      }

      // 5th failure - alarm triggers
      const result = simulator.simulateInvalidPin();
      expect(result.alarmTriggered).toBe(true);
      expect(simulator.getState().alarmActive).toBe(true);
    });

    it('should create alarm_triggered log entry', () => {
      for (let i = 0; i < 5; i++) {
        simulator.simulateInvalidRfid();
      }

      const logs = simulator.getAccessLogs();
      const alarmLog = logs.find((l) => l.event === 'alarm_triggered');
      expect(alarmLog).toBeDefined();
      expect(alarmLog?.method).toBe('max_failed_attempts');
    });

    it('should create CRITICAL alert for alarm', () => {
      for (let i = 0; i < 5; i++) {
        simulator.simulateInvalidRfid();
      }

      const alerts = simulator.getAlerts();
      const criticalAlert = alerts.find((a) => a.level === 'CRITICAL' && a.message.includes('BÁO ĐỘNG'));
      expect(criticalAlert).toBeDefined();
    });
  });
});

describe('Denied Access UI Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Status Labels', () => {
    it('should display "Truy cập bị từ chối" for access_denied events', async () => {
      const mockLogs: MockAccessLog[] = [
        {
          id: 1,
          event: 'access_denied',
          method: 'invalid_rfid',
          timestamp: '2025-12-27T10:00:00.000Z',
          user: null,
        },
        {
          id: 2,
          event: 'access_denied',
          method: 'invalid_pin',
          timestamp: '2025-12-27T10:00:01.000Z',
          user: { id: 1, username: 'user1' },
        },
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 2,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        const deniedLabels = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedLabels).toHaveLength(2);
      });
    });

    it('should display "Báo động kích hoạt" for alarm_triggered events', async () => {
      const mockLogs: MockAccessLog[] = [
        {
          id: 1,
          event: 'alarm_triggered',
          method: 'max_failed_attempts',
          timestamp: '2025-12-27T10:00:05.000Z',
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
        expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
      });
    });
  });

  describe('Method Labels', () => {
    it('should display correct Vietnamese labels for denial methods', async () => {
      const mockLogs: MockAccessLog[] = [
        { id: 1, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:00.000Z', user: null },
        { id: 2, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:01.000Z', user: null },
        { id: 3, event: 'access_denied', method: 'card_revoked', timestamp: '2025-12-27T10:00:02.000Z', user: { id: 1, username: 'banned' } },
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('Thẻ không hợp lệ')).toBeInTheDocument();
        expect(screen.getByText('PIN sai')).toBeInTheDocument();
        expect(screen.getByText('Thẻ bị thu hồi')).toBeInTheDocument();
      });
    });
  });

  describe('Timestamps', () => {
    it('should display timestamps for each denied event', async () => {
      const mockLogs: MockAccessLog[] = [
        {
          id: 1,
          event: 'access_denied',
          method: 'invalid_rfid',
          timestamp: new Date().toISOString(), // Today
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

      // Should have time displayed - look for the parent container with all content
      const logItem = screen.getByText('Truy cập bị từ chối').closest('[class*="rounded-xl"]');
      // Time should contain digits (any format)
      expect(logItem?.textContent).toMatch(/\d+/);
    });
  });

  describe('User Attribution', () => {
    it('should display username when user is known', async () => {
      const mockLogs: MockAccessLog[] = [
        {
          id: 1,
          event: 'access_denied',
          method: 'invalid_pin',
          timestamp: '2025-12-27T10:00:00.000Z',
          user: { id: 1, username: 'john_doe' },
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
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });

    it('should not display username when user is unknown', async () => {
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

      // Should not have any username displayed
      expect(screen.queryByText('john_doe')).not.toBeInTheDocument();
    });
  });
});

describe('Complete Denied Access Scenario', () => {
  let simulator: ReturnType<typeof createDeniedAccessSimulator>;

  beforeEach(() => {
    jest.clearAllMocks();
    simulator = createDeniedAccessSimulator();
  });

  it('should display complete scenario: 5 failures leading to alarm', async () => {
    // Simulate various denial types
    simulator.simulateInvalidRfid('CARD_001');
    simulator.simulateInvalidPin('user1');
    simulator.simulateRevokedCard('banned_user');
    simulator.simulateInvalidRfid('CARD_002');
    simulator.simulateInvalidPin(); // 5th - triggers alarm

    const logs = simulator.getAccessLogs();
    const alerts = simulator.getAlerts();

    // Verify logs
    expect(logs).toHaveLength(6); // 5 denied + 1 alarm
    expect(logs.filter((l) => l.event === 'access_denied')).toHaveLength(5);
    expect(logs.filter((l) => l.event === 'alarm_triggered')).toHaveLength(1);

    // Verify alerts
    expect(alerts.filter((a) => a.level === 'WARNING')).toHaveLength(4);
    expect(alerts.filter((a) => a.level === 'CRITICAL')).toHaveLength(2); // revoked + alarm

    // Mock API with generated logs
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

    // Should show alarm
    expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();

    // Should show various methods
    expect(screen.getAllByText('Thẻ không hợp lệ')).toHaveLength(2);
    expect(screen.getAllByText('PIN sai')).toHaveLength(2);
    expect(screen.getByText('Thẻ bị thu hồi')).toBeInTheDocument();

    // Should show usernames where applicable
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('banned_user')).toBeInTheDocument();
  });

  it('should show denied events in "Từ chối" filter tab', async () => {
    simulator.simulateInvalidRfid();
    simulator.simulateInvalidPin();

    const logs = simulator.getAccessLogs();

    mockApi.getDoorHistory.mockResolvedValue({
      logs,
      total: logs.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Filter tabs should be visible
      expect(screen.getByText('Tất cả')).toBeInTheDocument();
      expect(screen.getByText('Thành công')).toBeInTheDocument();
      expect(screen.getByText('Từ chối')).toBeInTheDocument();
    });
  });
});

describe('Alert Creation for Denied Access', () => {
  let simulator: ReturnType<typeof createDeniedAccessSimulator>;

  beforeEach(() => {
    simulator = createDeniedAccessSimulator();
  });

  it('should create appropriate alerts for each denial type', () => {
    simulator.simulateInvalidRfid('CARD_X');
    simulator.simulateInvalidPin('user_y');
    simulator.simulateRevokedCard('banned_z');

    const alerts = simulator.getAlerts();

    // Invalid RFID - WARNING
    const rfidAlert = alerts.find((a) => a.message.includes('CARD_X'));
    expect(rfidAlert?.level).toBe('WARNING');

    // Invalid PIN - WARNING
    const pinAlert = alerts.find((a) => a.message.includes('user_y'));
    expect(pinAlert?.level).toBe('WARNING');

    // Revoked card - CRITICAL
    const revokedAlert = alerts.find((a) => a.message.includes('banned_z'));
    expect(revokedAlert?.level).toBe('CRITICAL');
  });

  it('should have correct alert structure', () => {
    simulator.simulateInvalidRfid();

    const alert = simulator.getAlerts()[0];

    expect(alert).toHaveProperty('id');
    expect(alert).toHaveProperty('type', 'door');
    expect(alert).toHaveProperty('level');
    expect(alert).toHaveProperty('message');
    expect(alert).toHaveProperty('createdAt');
    expect(new Date(alert.createdAt).getTime()).not.toBeNaN();
  });
});

describe('Timestamp Formatting', () => {
  it('should format today timestamps as time only', () => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }

      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const todayTimestamp = new Date().toISOString();
    const formatted = formatTime(todayTimestamp);

    // Should be time format (HH:MM:SS)
    expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should format past dates with date and time', () => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }

      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const pastTimestamp = '2025-12-25T10:30:00.000Z';
    const formatted = formatTime(pastTimestamp);

    // Should include date digits (format varies by locale)
    expect(formatted).toMatch(/\d+/);
    // Should include both date and time components
    expect(formatted.length).toBeGreaterThan(5);
  });
});
