import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Attendance
  getTodayAttendance: () => apiFetch<{ record: any }>('/attendance/today'),
  punchIn: (lat: number, lng: number) =>
    apiFetch<{ record: any; message: string }>('/attendance/punch-in', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    }),
  punchOut: (lat: number, lng: number) =>
    apiFetch<{ record: any; message: string }>('/attendance/punch-out', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    }),
  getWeekAttendance: () =>
    apiFetch<{ records: any[]; stats: any }>('/attendance/week'),

  // Overtime
  submitOvertime: (date: string, hours: number, reason: string) =>
    apiFetch<{ record: any; message: string }>('/overtime/request', {
      method: 'POST',
      body: JSON.stringify({ date, hours, reason }),
    }),
  getMyOvertime: () =>
    apiFetch<{ records: any[] }>('/overtime/my-requests'),
  getAllOvertime: () =>
    apiFetch<{ records: any[] }>('/overtime/all'),
  updateOvertimeStatus: (id: string, status: string) =>
    apiFetch<{ record: any; message: string }>(`/overtime/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // AI Assistant
  askAssistant: (query: string) =>
    apiFetch<{ intent: string; response: string; data: any }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Admin
  getEmployees: () =>
    apiFetch<{ employees: any[] }>('/admin/employees'),
  getAdminAttendance: (dateFrom?: string, dateTo?: string, search?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (search) params.set('search', search);
    const qs = params.toString();
    return apiFetch<{ records: any[] }>(`/admin/attendance${qs ? `?${qs}` : ''}`);
  },
  getAttendanceCsv: async (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const qs = params.toString();
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/attendance/csv${qs ? `?${qs}` : ''}`, { headers });
    return res.text();
  },

  // Profiles
  getMyProfile: () =>
    apiFetch<{ profile: any }>('/profiles/me'),
  updateMyProfile: (updates: { full_name?: string; face_encoding?: string }) =>
    apiFetch<{ profile: any }>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Health
  health: () => apiFetch<{ status: string }>('/health'),
};
