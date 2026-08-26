/**
 * API Configuration
 * Centralized API endpoints, base URLs, and configuration
 *
 * Endpoints verified against live backend OpenAPI spec:
 * https://stay-easy-sizw.onrender.com/api/v1/openapi.json
 */

// API Base URL - Update based on environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stay-easy-sizw.onrender.com/api/v1';

// Khalti requires return_url to start with the base the backend is configured
// with (KHALTI_RETURN_URL_BASE — the reference web app's /reserve page). The
// live backend rejects any other URL, so the mobile app sends this base and the
// hosted-checkout WebView intercepts Khalti's redirect to it after payment.
export const KHALTI_RETURN_URL_BASE =
  process.env.EXPO_PUBLIC_KHALTI_RETURN_URL || 'http://localhost:5173/reserve';

// Backend date params require exact dates ("2026-08-10"), not ISO datetimes.
// Callers may pass either an already-clean date or an ISO datetime produced by
// Date#toISOString(). The latter is in UTC, so slicing it shifts the date
// BACKWARD in positive-offset timezones (e.g. Nepal +5:45) and the backend
// rejects it as "in the past". Reconstruct the original LOCAL date instead.
export function toDateParam(value?: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v.slice(0, 10);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// API Endpoints — only those confirmed in the live backend
export const API_ENDPOINTS = {
  // ─── Authentication — Guest portal ──────────────────────────────
  AUTH: {
    // Unified login — tries guest first, then user
    LOGIN: '/auth/login',
    // Guest-specific auth
    GUEST_REGISTER: '/auth/guests/register',
    GUEST_VERIFY_OTP: '/auth/guests/verify-otp',
    GUEST_RESEND_OTP: '/auth/guests/resend-otp',
    GUEST_REFRESH: '/auth/guests/refresh',
    GUEST_ME: '/auth/guests/me',
    // User-specific auth (host, operations, superadmin)
    USER_REGISTER: '/auth/users/register',
    USER_VERIFY_OTP: '/auth/users/verify-otp',
    USER_RESEND_OTP: '/auth/users/resend-otp',
    USER_REFRESH: '/auth/users/refresh',
    USER_ME: '/auth/users/me',
    // Password reset
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD_GUEST: '/auth/guest/change-password',
    CHANGE_PASSWORD_USER: '/auth/user/change-password',
  },

  // ─── Bookings ─────────────────────────────────────────────────
  BOOKINGS: {
    CREATE: '/bookings/',
    MY_BOOKINGS: '/bookings/me',
    GET_BY_REF: (ref: string) => `/bookings/${ref}`,
    PAYMENT_INTENT: (ref: string) => `/bookings/${ref}/payment-intent`,
    CONFIRM_PAYMENT: (ref: string) => `/bookings/${ref}/confirm`,
    APPLY_DISCOUNT: (ref: string) => `/bookings/${ref}/apply-discount`,
    SPECIAL_REQUESTS: (ref: string) => `/bookings/${ref}/special-requests`,
    PAY_REMAINING: (ref: string) => `/bookings/${ref}/pay-remaining`,
    RECORD_STAFF_PAYMENT: (ref: string) => `/bookings/${ref}/record-staff-payment`,
  },

  // ─── Tenants (SuperAdmin) ──────────────────────────────────────
  TENANTS: {
    GET: '/tenants/',
    CREATE: '/tenants/',
    UPDATE: '/tenants/',        // PATCH with ?tenant_id= query param
    DELETE: '/tenants/',        // DELETE with ?tenant_id= query param
  },

  // ─── Properties / PMS ─────────────────────────────────────────
  PROPERTIES: {
    GET_ALL: '/properties/',
    GET_AMENITIES: '/properties/amenities',
    CREATE_GENERAL_INFO: '/properties',
    GET_BY_ID: (id: string) => `/properties/${id}`,
    GET_BY_ID_PUBLIC: (id: string) => `/properties/${id}/public`,
    UPDATE: (id: string) => `/properties/${id}`,
    DELETE: (id: string) => `/properties/${id}`,
    TOGGLE_ACTIVATION: (id: string) => `/properties/${id}/toggle-property-activation`,
    GET_NUMBER_OF_FLOORS: (id: string) => `/properties/${id}/number-of-floors`,
    // Property bookings
    GET_PROPERTY_BOOKINGS: (id: string) => `/properties/${id}/bookings`,
    // Image uploads — backend: POST /properties/image (property_id in FormData body)
    UPLOAD_IMAGE: (_id: string) => `/properties/image`,
    UPLOAD_IMAGES: (_id: string) => `/properties/images`,
    // Room types & bed types
    GET_ROOM_TYPES: (id: string) => `/properties/${id}/rooms/room-types`,
    CREATE_ROOM_TYPE: (id: string) => `/properties/${id}/rooms/room-type`,
    GET_BED_TYPES: (id: string) => `/properties/${id}/rooms/bed-types`,
    CREATE_BED_TYPE: (id: string) => `/properties/${id}/rooms/bed-type`,
    // Rooms
    GET_ROOMS: (id: string) => `/properties/${id}/rooms`,
    BULK_CREATE_ROOMS: (id: string) => `/properties/${id}/rooms`,
    GET_ROOM: (id: string, roomId: string) => `/properties/${id}/rooms/${roomId}`,
    UPDATE_ROOM: (id: string, roomId: string) => `/properties/${id}/rooms/${roomId}`,
    DELETE_ROOM: (id: string, roomId: string) => `/properties/${id}/rooms/${roomId}`,
    UPLOAD_ROOM_IMAGE: (id: string) => `/properties/${id}/rooms/image`,
    UPLOAD_ROOM_IMAGES: (id: string) => `/properties/${id}/rooms/images`,
    // Discount codes
    GET_DISCOUNT_CODES: (id: string) => `/properties/${id}/discount-codes/`,
    CREATE_DISCOUNT_CODE: (id: string) => `/properties/${id}/discount-codes/`,
    GET_DISCOUNT_CODE: (id: string, discountId: string) => `/properties/${id}/discount-codes/${discountId}`,
    UPDATE_DISCOUNT_CODE: (id: string, discountId: string) => `/properties/${id}/discount-codes/${discountId}`,
    DELETE_DISCOUNT_CODE: (id: string, discountId: string) => `/properties/${id}/discount-codes/${discountId}`,
    // Special offers
    GET_SPECIAL_OFFERS: (id: string) => `/properties/${id}/special-offers/`,
    CREATE_SPECIAL_OFFERS: (id: string) => `/properties/${id}/special-offers/`,
    GET_SPECIAL_OFFER: (id: string, offerId: string) => `/properties/${id}/special-offers/${offerId}`,
    UPDATE_SPECIAL_OFFER: (id: string, offerId: string) => `/properties/${id}/special-offers/${offerId}`,
    DELETE_SPECIAL_OFFER: (id: string, offerId: string) => `/properties/${id}/special-offers/${offerId}`,
    // Staff management
    GET_STAFF: (id: string) => `/properties/${id}/staffs`,
    CREATE_STAFF: (id: string) => `/properties/${id}/staffs`,
    GET_STAFF_MEMBER: (id: string, staffId: string) => `/properties/${id}/staffs/${staffId}`,
    UPDATE_STAFF_MEMBER: (id: string, staffId: string) => `/properties/${id}/staffs/${staffId}`,
    DELETE_STAFF_MEMBER: (id: string, staffId: string) => `/properties/${id}/staffs/${staffId}`,
    UPLOAD_STAFF_IMAGE: (id: string) => `/properties/${id}/staffs/image`,
    // Tasks (admin)
    CREATE_TASK: (id: string) => `/properties/${id}/tasks`,
    GET_TASKS: (id: string) => `/properties/${id}/tasks`,
    GET_TASK: (id: string, taskId: string) => `/properties/${id}/tasks/${taskId}`,
    UPDATE_TASK: (id: string, taskId: string) => `/properties/${id}/tasks/${taskId}`,
    DELETE_TASK: (id: string, taskId: string) => `/properties/${id}/tasks/${taskId}`,
    COMPLETE_TASK: (id: string, taskId: string) => `/properties/${id}/tasks/${taskId}/complete`,
    BULK_ASSIGN_TASKS: (id: string) => `/properties/${id}/tasks/bulk-assign`,
    GET_HK_STAFF: (id: string) => `/properties/${id}/tasks/housekeeping-staff`,
    GET_STAFF_WORK_SUMMARY: (id: string) => `/properties/${id}/tasks/staff-work-summary`,
    GET_TASK_TYPES: (id: string) => `/properties/${id}/tasks/task-types`,
    // Housekeeping mobile (staff-facing)
    HK_GET_MY_TASKS: (id: string) => `/properties/${id}/housekeeping/tasks`,
    HK_GET_MY_TASK: (id: string, taskId: string) => `/properties/${id}/housekeeping/tasks/${taskId}`,
    HK_UPDATE_TASK_STATUS: (id: string, taskId: string) => `/properties/${id}/housekeeping/tasks/${taskId}/status`,
    // Cleaning submissions
    HK_GET_CLEANING: (id: string) => `/properties/${id}/housekeeping/cleaning`,
    HK_GET_CLEANING_PENDING: (id: string) => `/properties/${id}/housekeeping/cleaning/pending`,
    HK_SUBMIT_CLEANING: (id: string) => `/properties/${id}/housekeeping/cleaning/submit`,
    HK_GET_CLEANING_DETAIL: (id: string, subId: string) => `/properties/${id}/housekeeping/cleaning/${subId}`,
    HK_REVIEW_CLEANING: (id: string, subId: string) => `/properties/${id}/housekeeping/cleaning/${subId}/review`,
    // Work history
    HK_GET_HISTORY: (id: string) => `/properties/${id}/housekeeping/history`,
    HK_GET_HISTORY_STATS: (id: string) => `/properties/${id}/housekeeping/history/stats`,
    // Leave requests
    HK_CREATE_LEAVE: (id: string) => `/properties/${id}/housekeeping/leave`,
    HK_GET_LEAVE: (id: string) => `/properties/${id}/housekeeping/leave`,
    HK_CANCEL_LEAVE: (id: string, leaveId: string) => `/properties/${id}/housekeeping/leave/${leaveId}`,
    // Shift swaps
    HK_CREATE_SWAP: (id: string) => `/properties/${id}/housekeeping/swap`,
    HK_GET_SWAPS: (id: string) => `/properties/${id}/housekeeping/swap`,
    HK_CANCEL_SWAP: (id: string, swapId: string) => `/properties/${id}/housekeeping/swap/${swapId}`,
    // Maintenance reports
    HK_CREATE_MAINTENANCE: (id: string) => `/properties/${id}/housekeeping/maintenance`,
    HK_GET_MAINTENANCE: (id: string) => `/properties/${id}/housekeeping/maintenance`,
    // Schedule
    HK_GET_SCHEDULE_TODAY: (id: string) => `/properties/${id}/housekeeping/schedule/today`,
    HK_GET_SCHEDULE_WEEKLY: (id: string) => `/properties/${id}/housekeeping/schedule/weekly`,
    HK_GET_SCHEDULE_MONTHLY: (id: string) => `/properties/${id}/housekeeping/schedule/monthly`,
    HK_GET_SCHEDULE_HISTORY: (id: string) => `/properties/${id}/housekeeping/schedule/history`,
    // Reviews
    GET_REVIEWS: (id: string) => `/properties/${id}/reviews`,
    CREATE_REVIEW: (id: string) => `/properties/${id}/reviews`,
    UPDATE_REVIEW: (id: string, reviewId: string) => `/properties/${id}/reviews/${reviewId}`,
    // Room status
    GET_ROOMS_STATUS: (id: string) => `/properties/${id}/rooms/status`,
    GET_ROOMS_STATUS_SUMMARY: (id: string) => `/properties/${id}/rooms/status-summary`,
    // Room images (cleaning/maintenance)
    UPLOAD_CLEANING_STATUS_IMAGES: (id: string, roomId: string) => `/properties${id}/rooms/${roomId}/cleaning_status/images`,
    UPLOAD_MAINTENANCE_IMAGES: (id: string, roomId: string) => `/properties${id}/rooms/${roomId}/maintenance/images`,
  },

  // ─── Staff Portal ─────────────────────────────────────────────
  STAFF: {
    GET_BOOKING: (ref: string) => `/staff/bookings/${ref}`,
    CHECK_IN: (ref: string) => `/staff/check-in/${ref}`,
    CHECK_OUT: (ref: string) => `/staff/check-out/${ref}`,
    MODIFY_BOOKING: (ref: string) => `/staff/${ref}/booking-modify`,
  },

  // ─── Search ────────────────────────────────────────────────────
  SEARCH: {
    SEARCH_HOTELS: '/search',
    SEARCH_NEARBY: '/search/nearby',
  },

  // ─── Favorites ────────────────────────────────────────────────
  FAVORITES: {
    LIST: '/favorites',
    TOGGLE: (propertyId: string) => `/favorites/${propertyId}/toggle`,
  },

  // ─── Available rooms for a property ──────────────────────────
  // Backend validates checkin/checkout as exact dates (zero time). Normalize
  // any ISO datetime ("2026-08-10T14:00:00.000Z") to "YYYY-MM-DD" or the
  // endpoint returns 422.
  AVAILABLE_ROOMS: (propertyId: string, checkin: string, checkout: string) =>
    `/properties/${propertyId}/rooms/available-rooms?checkin_date=${toDateParam(checkin)}&checkout_date=${toDateParam(checkout)}`,
};

// Request/Response Configuration
// Keep timeouts tight: the live backend is a cold-startable Render instance
// that can hang far past 30s. Every API function falls back to mock data on
// failure, so fast failure (8s, 1 retry) is far better UX than long hangs.
export const API_CONFIG = {
  TIMEOUT: 8000,
  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  FAVORITES: 'favorites',
  SEARCH_HISTORY: 'search_history',
  PREFERENCES: 'preferences',
  LAST_SEARCH: 'last_search',
  ACTIVE_PORTAL: 'active_portal',
  NEARBY_CACHE: 'nearby_cache',
};

// Portal-scoped storage key getter
export function getPortalStorageKeys(portal: 'guest' | 'host' | 'operations' | 'superadmin') {
  return {
    AUTH_TOKEN: `auth_token_${portal}`,
    REFRESH_TOKEN: `refresh_token_${portal}`,
    USER_PROFILE: `user_profile_${portal}`,
  };
}
