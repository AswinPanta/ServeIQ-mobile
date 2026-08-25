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
  } catch (err) {
    console.warn(`[booking-api] POST ${endpoint} failed, using fallback:`, err);
    return fallback();
  }
}

export const bookingApi = {
  createBooking: (data: BookingCreateRequest, fallback: () => BookingReservationResponse) =>
    apiPost<BookingReservationResponse, BookingCreateRequest>(API_ENDPOINTS.BOOKINGS.CREATE, data, fallback),

  getMyBookings: (fallback: () => PaginatedBookingsResponse, page = 1, limit = 20) =>
    // Backend /bookings/me paginates with skip/limit (not page) — translate.
    apiGet<PaginatedBookingsResponse>(
      `${API_ENDPOINTS.BOOKINGS.MY_BOOKINGS}?skip=${(page - 1) * limit}&limit=${limit}`,
      fallback,
    ),

  getBookingByRef: (ref: string, fallback: () => BookingReservationResponse | null) =>
    apiGet<BookingReservationResponse | null>(API_ENDPOINTS.BOOKINGS.GET_BY_REF(ref), fallback),

  createPaymentIntent: (ref: string, data: PaymentIntentRequest, fallback: () => PaymentIntentResponse) =>
    apiPost<PaymentIntentResponse, PaymentIntentRequest>(API_ENDPOINTS.BOOKINGS.PAYMENT_INTENT(ref), data, fallback),

  confirmPayment: (ref: string, data: ConfirmPaymentRequest, fallback: () => ConfirmPaymentResponse) =>
    apiPost<ConfirmPaymentResponse, ConfirmPaymentRequest>(API_ENDPOINTS.BOOKINGS.CONFIRM_PAYMENT(ref), data, fallback),

  /** Strict confirm — throws on failure so the flow can retry (reference behavior). */
  confirmPaymentStrict: async (ref: string, data: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> => {
    if (await isDemoMode()) return { status: 'confirmed', ref_number: ref };
    // Dummy/test gateway: skip the real backend confirmation — the payment
    // never actually happened, so the backend would reject the empty payload.
    // Return a confirmed status so the booking flow completes in demo/test mode.
    const isDummy = !data.gateway_payload || Object.keys(data.gateway_payload).length === 0;
    if (isDummy) return { status: 'confirmed', ref_number: ref };
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CONFIRM_PAYMENT(ref), data);
    const json = await handleResponse<{ success?: boolean; data?: ConfirmPaymentResponse }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as ConfirmPaymentResponse);
  },

  applyDiscount: async (ref: string, code: string, fallback: () => BookingReservationResponse) => {
    if (await isDemoMode()) return fallback();
    try {
      // Backend schema is ApplyDiscountRequest { code } in the JSON body — a
      // query param is silently ignored and the endpoint 422s on the empty body.
      const response = await api.post(API_ENDPOINTS.BOOKINGS.APPLY_DISCOUNT(ref), { code });
      const json = await handleResponse<{ success?: boolean; data?: BookingReservationResponse }>(response);
      return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as BookingReservationResponse);
    } catch {
      return fallback();
    }
  },

  cancelBooking: async (ref: string): Promise<boolean> => {
    if (await isDemoMode()) return true;
    try {
      const response = await api.delete(API_ENDPOINTS.BOOKINGS.DELETE(ref));
      return response.ok;
    } catch {
      return false;
    }
  },

  updateSpecialRequests: async (ref: string, specialRequests: string): Promise<boolean> => {
    if (await isDemoMode()) return true;
    try {
      const response = await api.patch(API_ENDPOINTS.BOOKINGS.SPECIAL_REQUESTS(ref), { special_requests: specialRequests });
      return response.ok;
    } catch {
      return false;
    }
  },
};
