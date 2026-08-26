import { api, handleResponse, isDemoMode, getActiveToken } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import type {
  OperationRoom, OperationBooking, Folio, FolioCharge,
  HousekeepingTask, TableItem, MenuItem, MenuModifier,
  Order, OrderItem, KdsTicket,
  BackendMyTask, TaskStatusUpdateRequest,
  BackendCleaningSubmission, SupervisorReviewRequest,
  BackendLeaveRequest, CreateLeaveRequest,
  BackendShiftSwap, CreateSwapRequest,
  BackendMaintenanceReport, CreateMaintenanceReportRequest,
  BackendScheduleEntry, BackendWorkHistoryStats,
} from '@/types/api';

// ─── Operations API ─────────────────────────────────────────────────────────
// POS, KDS, Folio endpoints are mock-only (backend has no /pms/*, /pos/*, /kds/*).
// Housekeeping endpoints use the REAL backend.
const OPS_ENDPOINTS = {
  ROOMS: '/pms/rooms',
  ROOM_BY_ID: (id: string) => `/pms/rooms/${id}`,
  ROOM_STATUS: (id: string) => `/pms/rooms/${id}/status`,
  BOOKINGS: '/pms/bookings',
  BOOKING_BY_ID: (id: string) => `/pms/bookings/${id}`,
  CHECK_IN: '/pms/check-in',
  CHECK_OUT: '/pms/check-out',
  FOLIO: (ref: string) => `/pms/folios/${ref}`,
  FOLIO_CHARGE: (ref: string) => `/pms/folios/${ref}/charges`,
  HK_TASKS: '/pms/housekeeping/tasks',
  HK_TASK: (id: string) => `/pms/housekeeping/tasks/${id}`,
  MENU: '/pos/menu',
  MENU_CATEGORIES: '/pos/menu/categories',
  TABLES: '/pos/tables',
  TABLE: (id: string) => `/pos/tables/${id}`,
  ORDERS: '/pos/orders',
  ORDER: (id: string) => `/pos/orders/${id}`,
  KDS_TICKETS: '/kds/tickets',
  KDS_TICKET: (id: string) => `/kds/tickets/${id}`,
  PAYMENTS: '/pos/payments',
  STAFF: '/pms/staff',
  ACTIVITIES: '/pms/activities',
  SHIFT: '/pms/shift',
};

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
  try {
    const response = await api.patch(endpoint, data);
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}

async function apiDelete(endpoint: string): Promise<boolean> {
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
  // ─── Mock-only endpoints (no backend) ──────────────────────────
  getRooms: (fallback: () => OperationRoom[]) =>
    apiGet<OperationRoom[]>(OPS_ENDPOINTS.ROOMS, fallback),

  updateRoomStatus: (id: string, status: string, fallback: () => any) =>
    apiPatch(OPS_ENDPOINTS.ROOM_STATUS(id), { status }, fallback),

  getBookings: (fallback: () => OperationBooking[]) =>
    apiGet<OperationBooking[]>(OPS_ENDPOINTS.BOOKINGS, fallback),

  checkIn: (data: { booking_ref: string; room_number: string }, fallback: () => any) =>
    apiPost(OPS_ENDPOINTS.CHECK_IN, data, fallback),

  checkOut: (data: { booking_ref: string; payment_method: string }, fallback: () => any) =>
    apiPost(OPS_ENDPOINTS.CHECK_OUT, data, fallback),

  getFolio: (ref: string, fallback: () => Folio) =>
    apiGet<Folio>(OPS_ENDPOINTS.FOLIO(ref), fallback),

  addFolioCharge: (ref: string, data: Partial<FolioCharge>, fallback: () => any) =>
    apiPost(OPS_ENDPOINTS.FOLIO_CHARGE(ref), data, fallback),

  // Legacy mock HK — kept for backward compat, prefer getMyTasks()
  getHkTasks: (fallback: () => HousekeepingTask[]) =>
    apiGet<HousekeepingTask[]>(OPS_ENDPOINTS.HK_TASKS, fallback),

  updateHkTask: (id: string, data: Partial<HousekeepingTask>, fallback: () => any) =>
    apiPatch(OPS_ENDPOINTS.HK_TASK(id), data, fallback),

  getMenu: (fallback: () => MenuItem[]) =>
    apiGet<MenuItem[]>(OPS_ENDPOINTS.MENU, fallback),

  getTables: (fallback: () => TableItem[]) =>
    apiGet<TableItem[]>(OPS_ENDPOINTS.TABLES, fallback),

  getOrders: (fallback: () => Order[]) =>
    apiGet<Order[]>(OPS_ENDPOINTS.ORDERS, fallback),

  createOrder: (data: Partial<Order>, fallback: () => Order) =>
    apiPost<Order, Partial<Order>>(OPS_ENDPOINTS.ORDERS, data, fallback),

  getKdsTickets: (fallback: () => KdsTicket[]) =>
    apiGet<KdsTicket[]>(OPS_ENDPOINTS.KDS_TICKETS, fallback),

  updateKdsTicket: (id: string, data: Partial<KdsTicket>, fallback: () => any) =>
    apiPatch(OPS_ENDPOINTS.KDS_TICKET(id), data, fallback),

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

  // ─── Schedule ──────────────────────────────────────────────────

  getTodaySchedule: (propertyId: string, fallback: () => BackendScheduleEntry) =>
    apiGet<BackendScheduleEntry>(API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_TODAY(propertyId), fallback),

  getWeeklySchedule: (propertyId: string, startDate?: string, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_WEEKLY(propertyId)}${buildQuery({ start_date: startDate })}`, fallback),

  getMonthlySchedule: (propertyId: string, year: number, month: number, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_MONTHLY(propertyId)}${buildQuery({ year, month })}`, fallback),

  getScheduleHistory: (propertyId: string, params?: { skip?: number; limit?: number }, fallback: () => BackendScheduleEntry[] = () => []) =>
    apiGet<BackendScheduleEntry[]>(`${API_ENDPOINTS.PROPERTIES.HK_GET_SCHEDULE_HISTORY(propertyId)}${buildQuery(params)}`, fallback),
};
