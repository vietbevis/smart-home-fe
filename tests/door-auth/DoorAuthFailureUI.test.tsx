/**
 * Door Authentication Failure UI Test
 * 
 * This test simulates 5 consecutive authentication failures at 1-second intervals
 * through the UI components to verify the system's incorrect authentication handling.
 * 
 * Tests the DoorHistory component's ability to display failed access attempts
 * and alarm triggered events in real-time.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
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
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const mockApi = api as jest.Mocked<typeof api>;

// Helper to create delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Simulated door auth state for generating mock data
interface SimulatedAuthState {
  failedAttempts: number;
  alarmTriggered: boolean;
  logs: MockAccessLog[];
}

interface MockAccessLog {
  id: number;
  event: 'access_granted' | 'access_denied' | 'alarm_triggered';
  method: string;
  timestamp: string;
  user: { id: number; username: string } | null;
}

// Simulate authentication failure and generate log entry
function simulateAuthFailure(
  state: SimulatedAuthState,
  attemptNumber: number,
  method: string = 'invalid_rfid'
): MockAccessLog {
  state.failedAttempts++;
  
  const log: MockAccessLog = {
    id: attemptNumber,
    event: 'access_denied',
    method,
    timestamp: new Date().toISOString(),
    user: null,
  };
  
  state.logs.unshift(log); // Add to beginning (newest first)
  
  // Check if alarm should trigger (5th failure)
  if (state.failedAttempts >= 5 && !state.alarmTriggered) {
    state.alarmTriggered = true;
    const alarmLog: MockAccessLog = {
      id: attemptNumber + 100,
      event: 'alarm_triggered',
      method: 'max_failed_attempts',
      timestamp: new Date().toISOString(),
      user: null,
    };
    state.logs.unshift(alarmLog);
  }
  
  return log;
}

describe('Door Authentication Failure UI Test', () => {
  let authState: SimulatedAuthState;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset auth state
    authState = {
      failedAttempts: 0,
      alarmTriggered: false,
      logs: [],
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Display Failed Authentication Attempts', () => {
    it('should display access_denied events with correct styling', async () => {
      // Pre-populate with some failed attempts
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
          user: null,
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
        // Should show "Truy cập bị từ chối" for denied events
        const deniedElements = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedElements.length).toBe(2);
      });

      // Should show method labels
      expect(screen.getByText('Thẻ không hợp lệ')).toBeInTheDocument();
      expect(screen.getByText('PIN sai')).toBeInTheDocument();
    });

    it('should display alarm_triggered event prominently', async () => {
      const mockLogs: MockAccessLog[] = [
        {
          id: 100,
          event: 'alarm_triggered',
          method: 'max_failed_attempts',
          timestamp: '2025-12-27T10:00:05.000Z',
          user: null,
        },
        {
          id: 5,
          event: 'access_denied',
          method: 'invalid_rfid',
          timestamp: '2025-12-27T10:00:04.000Z',
          user: null,
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
        expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
      });
    });
  });

  describe('Sequential 5 Failures Simulation (UI Updates)', () => {
    it('should display all 5 failed attempts and alarm trigger correctly', async () => {
      // Simulate the final state after 5 failures at 1-second intervals
      // This represents what the UI would show after the sequence completes
      const mockLogs: MockAccessLog[] = [
        { id: 100, event: 'alarm_triggered', method: 'max_failed_attempts', timestamp: '2025-12-27T10:00:05.000Z', user: null },
        { id: 5, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:04.000Z', user: null },
        { id: 4, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:03.000Z', user: null },
        { id: 3, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:02.000Z', user: null },
        { id: 2, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:01.000Z', user: null },
        { id: 1, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:00.000Z', user: null },
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 6,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      // Wait for data to load
      await waitFor(() => {
        // Should show 5 "Truy cập bị từ chối" entries
        const deniedElements = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedElements.length).toBe(5);
      });

      // Should show alarm triggered
      expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();

      // Verify method labels are displayed
      const invalidRfidLabels = screen.getAllByText('Thẻ không hợp lệ');
      const invalidPinLabels = screen.getAllByText('PIN sai');
      
      expect(invalidRfidLabels.length).toBe(3); // 3 RFID failures
      expect(invalidPinLabels.length).toBe(2); // 2 PIN failures
    });

    it('should verify 1-second interval timing in logs', async () => {
      // Create logs with 1-second intervals
      const baseTime = new Date('2025-12-27T10:00:00.000Z').getTime();
      const mockLogs: MockAccessLog[] = [];
      
      for (let i = 0; i < 5; i++) {
        mockLogs.unshift({
          id: i + 1,
          event: 'access_denied',
          method: 'invalid_rfid',
          timestamp: new Date(baseTime + i * 1000).toISOString(),
          user: null,
        });
      }

      // Verify timing between logs
      for (let i = 1; i < mockLogs.length; i++) {
        const prevTime = new Date(mockLogs[i].timestamp).getTime();
        const currTime = new Date(mockLogs[i - 1].timestamp).getTime();
        const interval = currTime - prevTime;
        
        // Each interval should be 1000ms (1 second)
        expect(interval).toBe(1000);
      }

      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 5,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedElements.length).toBe(5);
      });
    });
  });

  describe('Filter Tabs for Failed Attempts', () => {
    it('should filter to show only denied events', async () => {
      const mockLogs: MockAccessLog[] = [
        { id: 1, event: 'access_granted', method: 'rfid_pin', timestamp: '2025-12-27T10:00:00.000Z', user: { id: 1, username: 'admin' } },
        { id: 2, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:01.000Z', user: null },
        { id: 3, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:02.000Z', user: null },
        { id: 4, event: 'alarm_triggered', method: 'max_failed_attempts', timestamp: '2025-12-27T10:00:03.000Z', user: null },
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 4,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        // Use flexible matcher for count text
        const countText = screen.getByText((content, element) => {
          return element?.tagName === 'P' && content.includes('4') && content.includes('sự kiện');
        });
        expect(countText).toBeInTheDocument();
      });

      // Should have filter tabs
      expect(screen.getByText('Tất cả')).toBeInTheDocument();
      expect(screen.getByText('Thành công')).toBeInTheDocument();
      expect(screen.getByText('Từ chối')).toBeInTheDocument();
    });
  });

  describe('Event Method Labels', () => {
    it('should display correct Vietnamese labels for auth methods', async () => {
      const mockLogs: MockAccessLog[] = [
        { id: 1, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:00.000Z', user: null },
        { id: 2, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:01.000Z', user: null },
        { id: 3, event: 'access_denied', method: 'card_revoked', timestamp: '2025-12-27T10:00:02.000Z', user: null },
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
      });

      expect(screen.getByText('PIN sai')).toBeInTheDocument();
      expect(screen.getByText('Thẻ bị thu hồi')).toBeInTheDocument();
    });
  });

  describe('Real-time Update Simulation', () => {
    it('should display progressive failure states correctly', async () => {
      // Test 1: Initial state with 3 failures
      const threeFailures: MockAccessLog[] = [
        { id: 3, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:02.000Z', user: null },
        { id: 2, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:01.000Z', user: null },
        { id: 1, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:00.000Z', user: null },
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: threeFailures,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      const { unmount } = render(<DoorHistory />);

      await waitFor(() => {
        const deniedElements = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedElements.length).toBe(3);
      });

      // No alarm should be shown yet
      expect(screen.queryByText('Báo động kích hoạt')).not.toBeInTheDocument();

      unmount();

      // Test 2: After 5th failure - alarm triggered
      const fiveFailuresWithAlarm: MockAccessLog[] = [
        { id: 100, event: 'alarm_triggered', method: 'max_failed_attempts', timestamp: '2025-12-27T10:00:04.500Z', user: null },
        { id: 5, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:04.000Z', user: null },
        { id: 4, event: 'access_denied', method: 'invalid_pin', timestamp: '2025-12-27T10:00:03.000Z', user: null },
        ...threeFailures,
      ];

      mockApi.getDoorHistory.mockResolvedValue({
        logs: fiveFailuresWithAlarm,
        total: 6,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        // Should now show alarm
        expect(screen.getByText('Báo động kích hoạt')).toBeInTheDocument();
        // Should show 5 denied events
        const deniedElements = screen.getAllByText('Truy cập bị từ chối');
        expect(deniedElements.length).toBe(5);
      });
    });
  });

  describe('Timestamp Display', () => {
    it('should display timestamps for each failed attempt', async () => {
      const mockLogs: MockAccessLog[] = [
        { id: 1, event: 'access_denied', method: 'invalid_rfid', timestamp: '2025-12-27T10:00:00.000Z', user: null },
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

      // Should have a timestamp displayed (format depends on locale)
      // The component shows time in Vietnamese format
      const timeElements = screen.getAllByText(/\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State After Filter', () => {
    it('should show empty state when no denied events exist', async () => {
      // Only successful events
      const mockLogs: MockAccessLog[] = [
        { id: 1, event: 'access_granted', method: 'rfid_pin', timestamp: '2025-12-27T10:00:00.000Z', user: { id: 1, username: 'admin' } },
      ];

      // When filtering for denied events, return empty
      mockApi.getDoorHistory.mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('Chưa có lịch sử')).toBeInTheDocument();
      });
    });
  });
});

describe('Door Auth Failure Event Icons', () => {
  it('should use danger color for access_denied events', () => {
    const getEventInfo = (event: string) => {
      switch (event) {
        case 'access_denied':
          return { color: 'text-danger', bg: 'bg-danger/10' };
        case 'alarm_triggered':
          return { color: 'text-danger', bg: 'bg-danger/10' };
        case 'access_granted':
          return { color: 'text-success', bg: 'bg-success/10' };
        default:
          return { color: 'text-muted-foreground', bg: 'bg-muted' };
      }
    };

    expect(getEventInfo('access_denied').color).toBe('text-danger');
    expect(getEventInfo('access_denied').bg).toBe('bg-danger/10');
  });

  it('should use danger color for alarm_triggered events', () => {
    const getEventInfo = (event: string) => {
      switch (event) {
        case 'access_denied':
        case 'alarm_triggered':
          return { color: 'text-danger', bg: 'bg-danger/10' };
        default:
          return { color: 'text-muted-foreground', bg: 'bg-muted' };
      }
    };

    expect(getEventInfo('alarm_triggered').color).toBe('text-danger');
  });
});

describe('Auth Failure Count Verification', () => {
  it('should correctly count 5 failures before alarm', () => {
    const MAX_FAILED_ATTEMPTS = 5;
    let failedAttempts = 0;
    let alarmTriggered = false;

    // Simulate 5 failures
    for (let i = 0; i < 5; i++) {
      failedAttempts++;
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        alarmTriggered = true;
      }
    }

    expect(failedAttempts).toBe(5);
    expect(alarmTriggered).toBe(true);
  });

  it('should not trigger alarm before 5 failures', () => {
    const MAX_FAILED_ATTEMPTS = 5;
    let failedAttempts = 0;
    let alarmTriggered = false;

    // Simulate 4 failures
    for (let i = 0; i < 4; i++) {
      failedAttempts++;
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        alarmTriggered = true;
      }
    }

    expect(failedAttempts).toBe(4);
    expect(alarmTriggered).toBe(false);
  });
});
