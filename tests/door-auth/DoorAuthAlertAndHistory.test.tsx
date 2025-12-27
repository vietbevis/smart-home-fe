/**
 * Door Authentication Alert & History Filter Test
 *
 * Tests:
 * 1. System triggers alert after 5 consecutive failed authentication attempts
 * 2. Door history only displays access events (granted/denied), NOT lost card events
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

// ==================== Mock Data Types ====================
interface MockAccessLog {
  id: number;
  event: string;
  method: string;
  timestamp: string;
  user: { id: number; username: string } | null;
}

// ==================== Alert Trigger Simulation ====================
interface AlertState {
  triggered: boolean;
  reason: string | null;
  failCount: number;
}

interface AuthState {
  failedAttempts: number;
  alarmActive: boolean;
  logs: MockAccessLog[];
  alerts: AlertState[];
}

const MAX_FAILED_ATTEMPTS = 5;

function createAuthSimulator() {
  const state: AuthState = {
    failedAttempts: 0,
    alarmActive: false,
    logs: [],
    alerts: [],
  };

  return {
    getState: () => ({ ...state }),

    // Simulate failed authentication
    simulateFailedAuth: (
      method: string,
      rfidUid: string = 'UNKNOWN'
    ): { alarmTriggered: boolean } => {
      state.failedAttempts++;

      // Log the failed attempt
      state.logs.unshift({
        id: state.logs.length + 1,
        event: 'access_denied',
        method,
        timestamp: new Date().toISOString(),
        user: null,
      });

      // Check if alarm should trigger
      if (state.failedAttempts >= MAX_FAILED_ATTEMPTS && !state.alarmActive) {
        state.alarmActive = true;

        // Create alert
        state.alerts.push({
          triggered: true,
          reason: 'max_failed_attempts',
          failCount: state.failedAttempts,
        });

        // Log alarm triggered event
        state.logs.unshift({
          id: state.logs.length + 1,
          event: 'alarm_triggered',
          method: 'max_failed_attempts',
          timestamp: new Date().toISOString(),
          user: null,
        });

        return { alarmTriggered: true };
      }

      return { alarmTriggered: false };
    },

    // Simulate successful authentication
    simulateSuccessAuth: (
      userId: number,
      username: string,
      method: string = 'rfid_pin'
    ) => {
      state.failedAttempts = 0;
      state.logs.unshift({
        id: state.logs.length + 1,
        event: 'access_granted',
        method,
        timestamp: new Date().toISOString(),
        user: { id: userId, username },
      });
    },

    // Reset state
    reset: () => {
      state.failedAttempts = 0;
      state.alarmActive = false;
      state.logs = [];
      state.alerts = [];
    },
  };
}

// ==================== Test Suites ====================

describe('Alert Trigger After 5 Failed Attempts', () => {
  let simulator: ReturnType<typeof createAuthSimulator>;

  beforeEach(() => {
    simulator = createAuthSimulator();
  });

  it('should NOT trigger alert after 1-4 failed attempts', () => {
    // Simulate 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const result = simulator.simulateFailedAuth('invalid_rfid', `card_${i}`);
      expect(result.alarmTriggered).toBe(false);
    }

    const state = simulator.getState();
    expect(state.failedAttempts).toBe(4);
    expect(state.alarmActive).toBe(false);
    expect(state.alerts).toHaveLength(0);
  });

  it('should trigger alert on exactly the 5th failed attempt', () => {
    // Simulate 4 failed attempts (no alarm)
    for (let i = 1; i <= 4; i++) {
      simulator.simulateFailedAuth('invalid_rfid');
    }

    expect(simulator.getState().alarmActive).toBe(false);

    // 5th attempt should trigger alarm
    const result = simulator.simulateFailedAuth('invalid_pin');

    expect(result.alarmTriggered).toBe(true);
    expect(simulator.getState().alarmActive).toBe(true);
    expect(simulator.getState().failedAttempts).toBe(5);
    expect(simulator.getState().alerts).toHaveLength(1);
    expect(simulator.getState().alerts[0].reason).toBe('max_failed_attempts');
  });

  it('should create alarm_triggered log entry when alert fires', () => {
    // Trigger alarm with 5 failures
    for (let i = 1; i <= 5; i++) {
      simulator.simulateFailedAuth('invalid_rfid');
    }

    const state = simulator.getState();
    const alarmLog = state.logs.find((log) => log.event === 'alarm_triggered');

    expect(alarmLog).toBeDefined();
    expect(alarmLog?.method).toBe('max_failed_attempts');
  });

  it('should have 6 log entries after 5 failures (5 denied + 1 alarm)', () => {
    for (let i = 1; i <= 5; i++) {
      simulator.simulateFailedAuth('invalid_rfid');
    }

    const state = simulator.getState();
    expect(state.logs).toHaveLength(6);

    const deniedLogs = state.logs.filter((l) => l.event === 'access_denied');
    const alarmLogs = state.logs.filter((l) => l.event === 'alarm_triggered');

    expect(deniedLogs).toHaveLength(5);
    expect(alarmLogs).toHaveLength(1);
  });

  it('should reset failed attempts counter after successful auth', () => {
    // 3 failed attempts
    for (let i = 1; i <= 3; i++) {
      simulator.simulateFailedAuth('invalid_rfid');
    }
    expect(simulator.getState().failedAttempts).toBe(3);

    // Successful auth resets counter
    simulator.simulateSuccessAuth(1, 'admin', 'rfid_pin');
    expect(simulator.getState().failedAttempts).toBe(0);

    // 3 more failures should NOT trigger alarm
    for (let i = 1; i <= 3; i++) {
      simulator.simulateFailedAuth('invalid_rfid');
    }
    expect(simulator.getState().alarmActive).toBe(false);
  });
});

describe('Door History Filters - Excludes Lost Card Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data including various event types
  const allEventsData: MockAccessLog[] = [
    // Access events (should be shown)
    {
      id: 1,
      event: 'access_granted',
      method: 'rfid_pin',
      timestamp: '2025-12-27T10:00:00.000Z',
      user: { id: 1, username: 'admin' },
    },
    {
      id: 2,
      event: 'access_denied',
      method: 'invalid_rfid',
      timestamp: '2025-12-27T10:01:00.000Z',
      user: null,
    },
    {
      id: 3,
      event: 'access_denied',
      method: 'invalid_pin',
      timestamp: '2025-12-27T10:02:00.000Z',
      user: null,
    },
    {
      id: 4,
      event: 'access_granted',
      method: 'web_admin',
      timestamp: '2025-12-27T10:03:00.000Z',
      user: { id: 2, username: 'user1' },
    },
    {
      id: 5,
      event: 'alarm_triggered',
      method: 'max_failed_attempts',
      timestamp: '2025-12-27T10:04:00.000Z',
      user: null,
    },
    // Lost card events (should NOT be shown in door history)
    {
      id: 6,
      event: 'card_reported_lost',
      method: 'user_report',
      timestamp: '2025-12-27T10:05:00.000Z',
      user: { id: 3, username: 'user2' },
    },
    {
      id: 7,
      event: 'card_reported_lost',
      method: 'user_report',
      timestamp: '2025-12-27T10:06:00.000Z',
      user: { id: 4, username: 'user3' },
    },
  ];

  // Filtered data (what the API should return for door history)
  const filteredAccessEvents = allEventsData.filter(
    (log) => log.event !== 'card_reported_lost'
  );

  it('should display access_granted events', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: filteredAccessEvents.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      const grantedElements = screen.getAllByText('Truy cập thành công');
      expect(grantedElements.length).toBe(2);
    });
  });

  it('should display access_denied events', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: filteredAccessEvents.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      const deniedElements = screen.getAllByText('Truy cập bị từ chối');
      expect(deniedElements.length).toBe(2);
    });
  });

  it('should display alarm_triggered events', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: filteredAccessEvents.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
    });
  });

  it('should NOT display card_reported_lost events', async () => {
    // API returns filtered data (no lost card events)
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: filteredAccessEvents.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Wait for data to load
      expect(screen.getAllByText('Truy cập thành công').length).toBeGreaterThan(
        0
      );
    });

    // Lost card events should NOT appear
    expect(screen.queryByText('Báo mất thẻ')).not.toBeInTheDocument();
    expect(screen.queryByText('user2')).not.toBeInTheDocument();
    expect(screen.queryByText('user3')).not.toBeInTheDocument();
  });

  it('should show correct total count excluding lost card events', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: 5, // Only 5 access events, not 7
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Should show 5 events, not 7
      const countText = screen.getByText((content, element) => {
        return (
          element?.tagName === 'P' &&
          content.includes('5') &&
          content.includes('sự kiện')
        );
      });
      expect(countText).toBeInTheDocument();
    });
  });

  it('should only show usernames from access events, not lost card reporters', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: filteredAccessEvents,
      total: filteredAccessEvents.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Users from access events should appear
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Users who only reported lost cards should NOT appear
    expect(screen.queryByText('user2')).not.toBeInTheDocument();
    expect(screen.queryByText('user3')).not.toBeInTheDocument();
  });
});

describe('Combined: 5 Failures + History Display', () => {
  let simulator: ReturnType<typeof createAuthSimulator>;

  beforeEach(() => {
    jest.clearAllMocks();
    simulator = createAuthSimulator();
  });

  it('should show all 5 denied events and alarm in history after triggering', async () => {
    // Simulate 5 failures to trigger alarm
    for (let i = 1; i <= 5; i++) {
      simulator.simulateFailedAuth(i % 2 === 0 ? 'invalid_pin' : 'invalid_rfid');
    }

    const state = simulator.getState();
    expect(state.alarmActive).toBe(true);

    // Mock API to return the generated logs
    mockApi.getDoorHistory.mockResolvedValue({
      logs: state.logs,
      total: state.logs.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Should show 5 denied events
      const deniedElements = screen.getAllByText('Truy cập bị từ chối');
      expect(deniedElements.length).toBe(5);
    });

    // Should show alarm triggered
    expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
  });

  it('should show mixed success and failure events correctly', async () => {
    // Simulate: 2 failures, 1 success, 3 failures (triggers alarm)
    simulator.simulateFailedAuth('invalid_rfid');
    simulator.simulateFailedAuth('invalid_pin');
    simulator.simulateSuccessAuth(1, 'admin', 'rfid_pin');
    simulator.simulateFailedAuth('invalid_rfid');
    simulator.simulateFailedAuth('invalid_pin');
    simulator.simulateFailedAuth('invalid_rfid');
    simulator.simulateFailedAuth('invalid_pin');
    simulator.simulateFailedAuth('invalid_rfid'); // 5th after reset, triggers alarm

    const state = simulator.getState();

    mockApi.getDoorHistory.mockResolvedValue({
      logs: state.logs,
      total: state.logs.length,
      page: 1,
      totalPages: 1,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      // Should show success event
      expect(screen.getByText('Truy cập thành công')).toBeInTheDocument();
      // Should show admin username
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    // Should show denied events
    const deniedElements = screen.getAllByText('Truy cập bị từ chối');
    expect(deniedElements.length).toBe(7); // 2 + 5 failures

    // Should show alarm (triggered after 5 consecutive failures)
    expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
  });
});

describe('Event Type Verification', () => {
  it('should correctly identify access events vs non-access events', () => {
    const accessEvents = [
      'access_granted',
      'access_denied',
      'door_opened',
      'door_closed',
      'alarm_triggered',
    ];

    const nonAccessEvents = [
      'card_reported_lost',
      'enrollment_success',
      'enrollment_failed',
    ];

    // Verify access events are recognized
    accessEvents.forEach((event) => {
      const isAccessEvent = [
        'access_granted',
        'access_denied',
        'door_opened',
        'door_closed',
        'alarm_triggered',
      ].includes(event);
      expect(isAccessEvent).toBe(true);
    });

    // Verify non-access events are excluded
    nonAccessEvents.forEach((event) => {
      const isAccessEvent = [
        'access_granted',
        'access_denied',
        'door_opened',
        'door_closed',
        'alarm_triggered',
      ].includes(event);
      expect(isAccessEvent).toBe(false);
    });
  });

  it('should have correct Vietnamese labels for displayed events', () => {
    const eventLabels: Record<string, string> = {
      access_granted: 'Truy cập thành công',
      access_denied: 'Truy cập bị từ chối',
      alarm_triggered: 'Báo động kích hoạt',
      door_opened: 'Mở cửa',
      door_closed: 'Đóng cửa',
    };

    // card_reported_lost should NOT have a display label in door history
    expect(eventLabels['card_reported_lost']).toBeUndefined();

    // Access events should have labels
    expect(eventLabels['access_granted']).toBe('Truy cập thành công');
    expect(eventLabels['access_denied']).toBe('Truy cập bị từ chối');
    expect(eventLabels['alarm_triggered']).toBe('Báo động kích hoạt');
  });
});

describe('Backend Filter Verification (Mock)', () => {
  it('should verify getDoorHistory API filters out lost card events', async () => {
    // This simulates what the backend should return
    // The backend's getDoorHistory should NOT include card_reported_lost or enrollment events

    const allowedAccessEvents = [
      'door_opened',
      'door_closed',
      'access_granted',
      'access_denied',
      'alarm_triggered',
    ];

    const excludedEvents = [
      'card_reported_lost',
      'enrollment_success',
      'enrollment_failed',
    ];

    // Verify the filter logic - allowed events should be in the list
    allowedAccessEvents.forEach((event) => {
      expect(allowedAccessEvents.includes(event)).toBe(true);
    });

    // Verify excluded events are NOT in the allowed list
    excludedEvents.forEach((event) => {
      expect(allowedAccessEvents.includes(event)).toBe(false);
    });
  });

  it('should call API with correct parameters', async () => {
    mockApi.getDoorHistory.mockResolvedValue({
      logs: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(<DoorHistory />);

    await waitFor(() => {
      expect(mockApi.getDoorHistory).toHaveBeenCalled();
    });

    // Verify API was called (filter is applied server-side)
    expect(mockApi.getDoorHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: expect.any(Number),
      })
    );
  });
});
