import { api, handleResponse, isDemoMode } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api-config';
import type {
  BookingCreateRequest,
  BookingReservationResponse,
  PaginatedBookingsResponse,
  PaymentIntentRequest,
  PaymentIntentResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
} from '@/types/api';

async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.get(endpoint);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.post(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

export const bookingApi = {
  createBooking: (data: BookingCreateRequest, fallback: () => BookingReservationResponse) =>
    apiPost<BookingReservationResponse, BookingCreateRequest>(API_ENDPOINTS.BOOKINGS.CREATE, data, fallback),

  getMyBookings: (fallback: () => PaginatedBookingsResponse, page = 1, limit = 20) =>
    apiGet<PaginatedBookingsResponse>(
      `${API_ENDPOINTS.BOOKINGS.MY_BOOKINGS}?page=${page}&limit=${limit}`,
      fallback,
    ),

  getBookingByRef: (ref: string, fallback: () => BookingReservationResponse) =>
    apiGet<BookingReservationResponse>(API_ENDPOINTS.BOOKINGS.GET_BY_REF(ref), fallback),

  createPaymentIntent: (ref: string, data: PaymentIntentRequest, fallback: () => PaymentIntentResponse) =>
    apiPost<PaymentIntentResponse, PaymentIntentRequest>(API_ENDPOINTS.BOOKINGS.PAYMENT_INTENT(ref), data, fallback),

  confirmPayment: (ref: string, data: ConfirmPaymentRequest, fallback: () => ConfirmPaymentResponse) =>
    apiPost<ConfirmPaymentResponse, ConfirmPaymentRequest>(API_ENDPOINTS.BOOKINGS.CONFIRM_PAYMENT(ref), data, fallback),

  applyDiscount: async (ref: string, code: string, fallback: () => BookingReservationResponse) => {
    if (await isDemoMode()) return fallback();
    try {
      const response = await api.post(`${API_ENDPOINTS.BOOKINGS.APPLY_DISCOUNT(ref)}?coupon_code=${encodeURIComponent(code)}`);
      const json = await handleResponse<{ success?: boolean; data?: BookingReservationResponse }>(response);
      return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as BookingReservationResponse);
    } catch {
      return fallback();
    }
  },
};
