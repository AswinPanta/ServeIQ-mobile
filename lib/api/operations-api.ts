import { api, handleResponse, isDemoMode } from '@/lib/api';
import type {
  OperationRoom, OperationBooking, Folio, FolioCharge,
  HousekeepingTask, TableItem, MenuItem, MenuModifier,
  Order, OrderItem, KdsTicket,
} from '@/types/api';

// ─── Operations API — ALL endpoints below are mock-only ──────
// The live backend does NOT have /pms/*, /pos/*, /kds/* endpoints yet.
// All functions in this module fall back to mock data automatically.
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

async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.get(endpoint);
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.post(endpoint, data);
    return await handleResponse<T>(response);
  } catch {
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

export const operationsApi = {
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
};
