const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Yêu cầu thất bại' }));
      throw new Error(error.error || 'Yêu cầu thất bại');
    }

    return res.json();
  }

  // Auth
  login(username: string, password: string) {
    return this.request<{ token: string; user: { id: number; username: string; role: 'ADMIN' | 'USER' } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    );
  }

  register(username: string, password: string) {
    return this.request<{ id: number; username: string; role: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    );
  }

  getMe() {
    return this.request<{ id: number; username: string; role: 'ADMIN' | 'USER' }>('/auth/me');
  }

  // Alerts
  getAlerts(params?: { page?: number; limit?: number; type?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<{ alerts: any[]; total: number; page: number; totalPages: number }>(
      `/alerts${query ? `?${query}` : ''}`
    );
  }

  acknowledgeAlert(id: number) {
    return this.request(`/alerts/${id}/acknowledge`, { method: 'PATCH' });
  }

  // Push tokens
  registerPushToken(token: string, platform: 'web' | 'android') {
    return this.request('/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  // Door history
  getDoorHistory(params?: { page?: number; limit?: number; event?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.event) queryParams.event = params.event;
    const query = new URLSearchParams(queryParams).toString();
    return this.request<{
      logs: Array<{
        id: number;
        event: string;
        method: string | null;
        timestamp: string;
        user: { id: number; username: string } | null;
      }>;
      total: number;
      page: number;
      totalPages: number;
    }>(`/doors/history${query ? `?${query}` : ''}`);
  }

  // RFID Card Management
  getMyRfidCard() {
    return this.request<{
      hasCard: boolean;
      card: {
        id: number;
        uid: string;
        status: string;
        createdAt: string;
      } | null;
    }>('/doors/rfid/my-card');
  }

  reportLostCard() {
    return this.request<{
      success: boolean;
      card: { id: number; uid: string; username: string };
      message: string;
    }>('/doors/rfid/report-lost', { method: 'POST' });
  }
}

export const api = new ApiClient();
