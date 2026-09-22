import { api, handleResponse, isDemoMode, getActiveToken } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import type {
  BackendMyTask, TaskStatusUpdateRequest,
  BackendCleaningSubmission, SupervisorReviewRequest,
  BackendLeaveRequest, CreateLeaveRequest,
  BackendShiftSwap, CreateSwapRequest,
  BackendMaintenanceReport,
  BackendScheduleEntry, BackendWorkHistoryStats,
  BackendRoomStatusItem, BackendRoomStatusSummary,
} from '@/types/api';

// ─── Operations API ─────────────────────────────────────────────────────────
// Housekeeping endpoints use the REAL backend (/properties/{id}/housekeeping/*).
// Front-desk check-in/out + folio now go through staffApi (host-api.ts).

function buildQuery(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.get(endpoint);
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T, opts?: { rethrowOnServerError?: boolean }): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.post(endpoint, data);
    return await handleResponse<T>(response);
  } catch (error) {
    if (opts?.rethrowOnServerError && (error as { isServerError?: boolean }).isServerError) {
      throw error;
    }
    return fallback();
  }
}

async function apiPatch<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.patch(endpoint, data);
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}

async function apiDelete(endpoint: string): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    const response = await api.delete(endpoint);
    return response.ok;
  } catch {
    return false;
  }
}

async function apiPostFormData<T>(endpoint: string, formData: FormData, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const token = await getActiveToken();
    if (!token) return fallback();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}

export const operationsApi = {
  // ─── Housekeeping Mobile (real backend) ────────────────────────

  /** Get staff member's own tasks */
  getMyTasks: (propertyId: string, params?: { skip?: number; limit?: number; task_status?: string }, fallback: () => BackendMyTask[] = () => []) =>
    apiGet<BackendMyTask[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_MY_TASKS(propertyId)}${buildQuery(params)}`, fallback),

  /** Get single task detail for staff */
  getMyTask: (propertyId: string, taskId: string, fallback: () => BackendMyTask) =>
    apiGet<BackendMyTask>(API_ENDPOINTS.PROPERTIES.HK_GET_MY_TASK(propertyId, taskId), fallback),

  /** Update task status (staff marks progress) */
  updateTaskStatus: (propertyId: string, taskId: string, data: TaskStatusUpdateRequest, fallback: () => BackendMyTask) =>
    apiPatch<BackendMyTask, TaskStatusUpdateRequest>(API_ENDPOINTS.PROPERTIES.HK_UPDATE_TASK_STATUS(propertyId, taskId), data, fallback),

  // ─── Cleaning Submissions ──────────────────────────────────────

  getCleaningSubmissions: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendCleaningSubmission[] = () => []) =>
    apiGet<BackendCleaningSubmission[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_CLEANING(propertyId)}${buildQuery(params)}`, fallback),

  getPendingSubmissions: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendCleaningSubmission[] = () => []) =>
    apiGet<BackendCleaningSubmission[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_CLEANING_PENDING(propertyId)}${buildQuery(params)}`, fallback),

  submitForInspection: (propertyId: string, formData: FormData, fallback: () => BackendCleaningSubmission) =>
    apiPostFormData<BackendCleaningSubmission>(API_ENDPOINTS.PROPERTIES.HK_SUBMIT_CLEANING(propertyId), formData, fallback),

  getCleaningDetail: (propertyId: string, submissionId: string, fallback: () => BackendCleaningSubmission) =>
    apiGet<BackendCleaningSubmission>(API_ENDPOINTS.PROPERTIES.HK_GET_CLEANING_DETAIL(propertyId, submissionId), fallback),

  reviewCleaning: (propertyId: string, submissionId: string, data: SupervisorReviewRequest, fallback: () => BackendCleaningSubmission) =>
    apiPatch<BackendCleaningSubmission, SupervisorReviewRequest>(API_ENDPOINTS.PROPERTIES.HK_REVIEW_CLEANING(propertyId, submissionId), data, fallback),

  // ─── Work History ──────────────────────────────────────────────

  getWorkHistory: (propertyId: string, params?: { skip?: number; limit?: number; from_date?: string; to_date?: string }, fallback: () => any[] = () => []) =>
    apiGet<any[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_HISTORY(propertyId)}${buildQuery(params)}`, fallback),

  getWorkHistoryStats: (propertyId: string, fallback: () => BackendWorkHistoryStats) =>
    apiGet<BackendWorkHistoryStats>(API_ENDPOINTS.PROPERTIES.HK_GET_HISTORY_STATS(propertyId), fallback),

  // ─── Leave Requests ────────────────────────────────────────────

  createLeaveRequest: (propertyId: string, data: CreateLeaveRequest, fallback: () => BackendLeaveRequest) =>
    apiPost<BackendLeaveRequest, CreateLeaveRequest>(API_ENDPOINTS.PROPERTIES.HK_CREATE_LEAVE(propertyId), data, fallback, { rethrowOnServerError: true }),

  getMyLeaveRequests: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendLeaveRequest[] = () => []) =>
    apiGet<BackendLeaveRequest[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_LEAVE(propertyId)}${buildQuery(params)}`, fallback),

  cancelLeaveRequest: (propertyId: string, leaveId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.HK_CANCEL_LEAVE(propertyId, leaveId)),

  // ─── Shift Swaps ───────────────────────────────────────────────

  createSwapRequest: (propertyId: string, data: CreateSwapRequest, fallback: () => BackendShiftSwap) =>
    apiPost<BackendShiftSwap, CreateSwapRequest>(API_ENDPOINTS.PROPERTIES.HK_CREATE_SWAP(propertyId), data, fallback, { rethrowOnServerError: true }),

  getMySwapRequests: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendShiftSwap[] = () => []) =>
    apiGet<BackendShiftSwap[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SWAPS(propertyId)}${buildQuery(params)}`, fallback),

  cancelSwapRequest: (propertyId: string, swapId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.HK_CANCEL_SWAP(propertyId, swapId)),

  // ─── Maintenance Reports ───────────────────────────────────────

  createMaintenanceReport: (propertyId: string, formData: FormData, fallback: () => BackendMaintenanceReport) =>
    apiPostFormData<BackendMaintenanceReport>(API_ENDPOINTS.PROPERTIES.HK_CREATE_MAINTENANCE(propertyId), formData, fallback),

  getMyMaintenanceReports: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendMaintenanceReport[] = () => []) =>
    apiGet<BackendMaintenanceReport[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_MAINTENANCE(propertyId)}${buildQuery(params)}`, fallback),

  // ─── Room Status ─────────────────────────────────────────────

  getRoomStatus: (propertyId: string, fallback: () => BackendRoomStatusItem[] = () => []) =>
    apiGet<BackendRoomStatusItem[]>(API_ENDPOINTS.PROPERTIES.GET_ROOMS_STATUS(propertyId), fallback),

  getRoomStatusSummary: (propertyId: string, fallback: () => BackendRoomStatusSummary = () => ({ total_rooms: 0, available_rooms: 0, occupied_rooms: 0, dirty_rooms: 0, in_progress_rooms: 0, cleaning_rooms: 0, inspected_rooms: 0, blocked_rooms: 0, booked_rooms: 0, out_of_service_rooms: 0, maintenance_rooms: 0 })) =>
    apiGet<BackendRoomStatusSummary>(API_ENDPOINTS.PROPERTIES.GET_ROOMS_STATUS_SUMMARY(propertyId), fallback),

  // ─── Schedule ──────────────────────────────────────────────────

  getTodaySchedule: (propertyId: string, fallback: () => BackendScheduleEntry) =>
    apiGet<BackendScheduleEntry>(API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_TODAY(propertyId), fallback),

  getWeeklySchedule: (propertyId: string, startDate?: string, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_WEEKLY(propertyId)}${buildQuery({ start_date: startDate })}`, fallback),

  getMonthlySchedule: (propertyId: string, year: number, month: number, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_MONTHLY(propertyId)}${buildQuery({ year, month })}`, fallback),

  getScheduleHistory: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_HISTORY(propertyId)}${buildQuery(params)}`, fallback),

  // ─── Tasks (richer /tasks endpoint) ──────────────────────────

  /** List all tasks (richer than /housekeeping/tasks — includes assigned_staff_id, room_name, etc.) */
  listAllTasks: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => any[] = () => []) =>
    apiGet<any[]>(`${API_ENDPOINTS.PROPERTIES.GET_TASKS(propertyId)}${buildQuery(params)}`, fallback),

  /** Get all rooms for task assignment [{id, name, status}] */
  getTaskRooms: (propertyId: string, fallback: () => any[] = () => []) =>
    apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_TASK_ROOMS(propertyId), fallback),

  /** Update a task (PATCH /tasks/{task_id}) — status, notes, etc. */
  updateTask: (propertyId: string, taskId: string, data: Record<string, any>, fallback: () => any) =>
    apiPatch<any, Record<string, any>>(`${API_ENDPOINTS.PROPERTIES.GET_TASKS(propertyId)}/${taskId}`, data, fallback),
};
