/**
 * API Configuration
 * Centralized API endpoints, base URLs, and configuration
 */

// API Base URL - Update based on environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stayeasy-1-35ba.onrender.com/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication — Guest portal
  AUTH: {
    GUEST_REGISTER: '/auth/guests/register',
    GUEST_LOGIN: '/auth/guests/login',
    GUEST_VERIFY_OTP: '/auth/guests/verify-otp',
    GUEST_RESEND_OTP: '/auth/guests/resend-otp',
    GUEST_REFRESH: '/auth/guests/refresh',
    GUEST_ME: '/auth/guests/me',
    // Host / User portal authentication
    USER_REGISTER: '/auth/users/register',
    USER_LOGIN: '/auth/users/login',
    USER_VERIFY_OTP: '/auth/users/verify-otp',
    USER_RESEND_OTP: '/auth/users/resend-otp',
    USER_REFRESH: '/auth/users/refresh',
    USER_ME: '/auth/users/me',
  },

  // Properties/Hotels
  PROPERTIES: {
    GET_ALL: '/pms/properties/',
    CREATE: '/pms/properties/',
    UPDATE: (id: string) => `/pms/properties/${id}`,
    DELETE: (id: string) => `/pms/properties/${id}`,
    GET_BY_ID: (id: string) => `/pms/properties/${id}`,
    GET_AMENITIES: '/pms/properties/amenities',
    GET_ROOMS: (propertyId: string) => `/pms/properties/${propertyId}/rooms`,
    GET_ROOM_BY_ID: (propertyId: string, roomId: string) =>
      `/pms/properties/${propertyId}/rooms/${roomId}`,
    CREATE_ROOM: (propertyId: string) => `/pms/properties/${propertyId}/rooms`,
    UPDATE_ROOM: (propertyId: string, roomId: string) => `/pms/properties/${propertyId}/rooms/${roomId}`,
    DELETE_ROOM: (propertyId: string, roomId: string) => `/pms/properties/${propertyId}/rooms/${roomId}`,
  },

  // Host-specific property management
  HOST: {
    PROPERTIES: '/pms/properties/',
    PROPERTY_BY_ID: (id: string) => `/pms/properties/${id}`,
    BOOKINGS: '/hosts/bookings',
    CALENDAR: '/hosts/calendar',
    MESSAGES: '/hosts/messages',
  },

  // Search & Availability
  SEARCH: {
    SEARCH_HOTELS: '/search/hotels',
    CHECK_AVAILABILITY: (hotelId: string) => `/search/availability/${hotelId}`,
  },

  // Bookings
  BOOKINGS: {
    CREATE: '/bookings/',
    GET_ALL: '/bookings/',
    GET_BY_ID: (id: string) => `/bookings/${id}`,
    UPDATE: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    GET_HISTORY: '/bookings/history',
  },

  // Reviews
  REVIEWS: {
    CREATE: '/reviews/',
    GET_BY_BOOKING: (bookingId: string) => `/reviews/booking/${bookingId}`,
    GET_BY_HOTEL: (hotelId: string) => `/reviews/hotel/${hotelId}`,
  },

  // Favorites
  FAVORITES: {
    GET_ALL: '/favorites/',
    ADD: '/favorites/',
    REMOVE: (hotelId: string) => `/favorites/${hotelId}`,
  },

  // Payments
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM: '/payments/confirm',
    GET_METHODS: '/payments/methods',
  },

  // User Profile
  PROFILE: {
    GET: '/guests/profile',
    UPDATE: '/guests/profile',
    GET_PREFERENCES: '/guests/preferences',
    UPDATE_PREFERENCES: '/guests/preferences',
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: '/notifications/',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    REGISTER_PUSH_TOKEN: '/notifications/push-token',
  },

  // Tenants
  TENANTS: {
    GET: '/tenants/',
    CREATE: '/tenants/',
    UPDATE: (id: string) => `/tenants/${id}`,
    DELETE: (id: string) => `/tenants/${id}`,
  },
};

// Request/Response Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
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
