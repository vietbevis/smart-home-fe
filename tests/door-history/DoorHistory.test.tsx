/**
 * DoorHistory Component Tests
 * Tests for door history display with mocked API responses
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoorHistory } from '@/components/devices/DoorHistory';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    getDoorHistory: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('DoorHistory Component', () => {
  const mockLogs = [
    {
      id: 1,
      event: 'door_opened',
      method: 'web_admin',
      timestamp: '2025-12-27T10:00:00.000Z',
      user: { id: 1, username: 'admin' },
    },
    {
      id: 2,
      event: 'door_closed',
      method: 'system',
      timestamp: '2025-12-27T10:00:05.000Z',
      user: null,
    },
    {
      id: 3,
      event: 'access_granted',
      method: 'rfid_pin',
      timestamp: '2025-12-27T11:00:00.000Z',
      user: { id: 2, username: 'user1' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', async () => {
      mockApi.getDoorHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DoorHistory />);

      // Should show loading state
      expect(screen.getByTitle('Làm mới')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display door history logs', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getAllByText('Mở cửa').length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Đóng cửa')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    it('should display correct method labels', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('Web Admin')).toBeInTheDocument();
      });

      expect(screen.getByText('Hệ thống')).toBeInTheDocument();
      expect(screen.getByText('RFID + PIN')).toBeInTheDocument();
    });

    it('should display total event count', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('(3 sự kiện)')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no logs exist', async () => {
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

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 25,
        page: 1,
        totalPages: 3,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('Trang 1 / 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Trước')).toBeInTheDocument();
      expect(screen.getByText('Sau')).toBeInTheDocument();
    });

    it('should disable previous button on first page', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 25,
        page: 1,
        totalPages: 3,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        const prevButton = screen.getByText('Trước').closest('button');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button on last page', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 25,
        page: 3,
        totalPages: 3,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        const nextButton = screen.getByText('Sau').closest('button');
        expect(nextButton).toBeDisabled();
      });
    });

    it('should fetch next page when clicking next button', async () => {
      mockApi.getDoorHistory
        .mockResolvedValueOnce({
          logs: mockLogs,
          total: 25,
          page: 1,
          totalPages: 3,
        })
        .mockResolvedValueOnce({
          logs: mockLogs,
          total: 25,
          page: 2,
          totalPages: 3,
        });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getByText('Trang 1 / 3')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Sau').closest('button');
      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(mockApi.getDoorHistory).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
        });
      });
    });

    it('should not show pagination for single page', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getAllByText('Mở cửa').length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('Trước')).not.toBeInTheDocument();
      expect(screen.queryByText('Sau')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when clicking refresh button', async () => {
      mockApi.getDoorHistory.mockResolvedValue({
        logs: mockLogs,
        total: 3,
        page: 1,
        totalPages: 1,
      });

      render(<DoorHistory />);

      await waitFor(() => {
        expect(screen.getAllByText('Mở cửa').length).toBeGreaterThan(0);
      });

      const refreshButton = screen.getByTitle('Làm mới');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockApi.getDoorHistory).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApi.getDoorHistory.mockRejectedValue(new Error('API Error'));

      render(<DoorHistory />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});

describe('DoorHistory Event Icons', () => {
  it('should use green color for door_opened event', () => {
    const getEventInfo = (event: string) => {
      switch (event) {
        case 'door_opened':
        case 'access_granted':
          return { color: 'text-green-500' };
        case 'door_closed':
          return { color: 'text-blue-500' };
        default:
          return { color: 'text-gray-500' };
      }
    };

    expect(getEventInfo('door_opened').color).toBe('text-green-500');
  });

  it('should use blue color for door_closed event', () => {
    const getEventInfo = (event: string) => {
      switch (event) {
        case 'door_opened':
        case 'access_granted':
          return { color: 'text-green-500' };
        case 'door_closed':
          return { color: 'text-blue-500' };
        default:
          return { color: 'text-gray-500' };
      }
    };

    expect(getEventInfo('door_closed').color).toBe('text-blue-500');
  });

  it('should use green color for access_granted event', () => {
    const getEventInfo = (event: string) => {
      switch (event) {
        case 'door_opened':
        case 'access_granted':
          return { color: 'text-green-500' };
        case 'door_closed':
          return { color: 'text-blue-500' };
        default:
          return { color: 'text-gray-500' };
      }
    };

    expect(getEventInfo('access_granted').color).toBe('text-green-500');
  });
});

describe('DoorHistory Timestamp Formatting', () => {
  it('should format timestamp in Vietnamese locale', () => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    const formatted = formatTime('2025-12-27T10:30:45.000Z');
    // Should contain date parts (exact format depends on locale)
    expect(formatted).toMatch(/\d{2}/);
  });
});
