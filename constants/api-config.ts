/**
 * API Configuration
 * Centralized API endpoints, base URLs, and configuration
 *
 * Endpoints verified against live backend OpenAPI spec:
 * https://stay-easy-sizw.onrender.com/api/v1/openapi.json
 */

// API Base URL - Update based on environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stay-easy-sizw.onrender.com/api/v1';

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
    RESET_PASSWORD: '/auth/reset-password',
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
    CREATE_GENERAL_INFO: '/properties/general-information',
    GET_BY_ID: (id: string) => `/properties/${id}`,
    GET_BY_ID_PUBLIC: (id: string) => `/properties/${id}/public`,
    DELETE: (id: string) => `/properties/${id}`,
    TOGGLE_ACTIVATION: (id: string) => `/properties/${id}/toggle-property-activation`,
    GET_NUMBER_OF_FLOORS: (id: string) => `/properties/${id}/number-of-floors`,
    // Setup wizard steps
    CREATE_LOCATION: (id: string) => `/properties/${id}/create-location`,
    CREATE_PHOTOS_AMENITIES: (id: string) => `/properties/${id}/create-photos-and-amenities`,
    CREATE_LOCALIZATION: (id: string) => `/properties/${id}/create-localization`,
    CREATE_BRAND_VISUAL: (id: string) => `/properties/${id}/create-brand-visual`,
    // Property bookings
    GET_PROPERTY_BOOKINGS: (id: string) => `/properties/${id}/bookings`,
    // Image uploads
    UPLOAD_IMAGE: (id: string) => `/properties/${id}/image`,
    UPLOAD_IMAGES: (id: string) => `/properties/${id}/images`,
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
  },

  // ─── Search ────────────────────────────────────────────────────
  SEARCH: {
    SEARCH_HOTELS: '/search',
    SEARCH_NEARBY: '/search/nearby',
  },

  // ─── Available rooms for a property ──────────────────────────
  AVAILABLE_ROOMS: (propertyId: string, checkin: string, checkout: string) =>
    `/properties/${propertyId}/rooms/available-rooms?checkin_date=${checkin}&checkout_date=${checkout}`,
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
};

// Portal-scoped storage key getter
export function getPortalStorageKeys(portal: 'guest' | 'host' | 'operations' | 'superadmin') {
  return {
    AUTH_TOKEN: `auth_token_${portal}`,
    REFRESH_TOKEN: `refresh_token_${portal}`,
    USER_PROFILE: `user_profile_${portal}`,
  };
}
