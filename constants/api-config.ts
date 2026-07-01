/**
 * API Configuration
 * Centralized API endpoints, base URLs, and configuration
 */

// API Base URL - Update based on environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stayeasy-1-35ba.onrender.com/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    GUEST_REGISTER: '/auth/guests/register',
    GUEST_LOGIN: '/auth/guests/login',
    GUEST_VERIFY_OTP: '/auth/guests/verify-otp',
    GUEST_RESEND_OTP: '/auth/guests/resend-otp',
    GUEST_REFRESH: '/auth/guests/refresh',
    GUEST_ME: '/auth/guests/me',
    GUEST_LOGOUT: '/auth/guests/logout',
  },

  // Properties/Hotels
  PROPERTIES: {
    GET_ALL: '/pms/properties/',
    GET_BY_ID: (id: string) => `/pms/properties/${id}`,
    GET_AMENITIES: '/pms/properties/amenities',
    GET_ROOMS: (propertyId: string) => `/pms/properties/${propertyId}/rooms`,
    GET_ROOM_BY_ID: (propertyId: string, roomId: string) =>
      `/pms/properties/${propertyId}/rooms/${roomId}`,
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
  },

  // Tenants
  TENANTS: {
    GET: '/tenants/',
  },
};

// Request/Response Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  BOOKING_FAILED: 'Booking failed. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  SEARCH_FAILED: 'Search failed. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  REGISTER_SUCCESS: 'Registration successful',
  BOOKING_SUCCESS: 'Booking confirmed successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  FAVORITE_ADDED: 'Added to favorites',
  FAVORITE_REMOVED: 'Removed from favorites',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_RESET: 'Password reset link sent to your email',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Sorting Options
export const SORT_OPTIONS = [
  { id: 'price_asc', label: 'Price: Low to High', value: 'price', order: 'asc' },
  { id: 'price_desc', label: 'Price: High to Low', value: 'price', order: 'desc' },
  { id: 'rating_desc', label: 'Rating: High to Low', value: 'rating', order: 'desc' },
  { id: 'rating_asc', label: 'Rating: Low to High', value: 'rating', order: 'asc' },
  { id: 'distance_asc', label: 'Distance: Nearest', value: 'distance', order: 'asc' },
];

// Filter Ranges
export const FILTER_RANGES = {
  PRICE: {
    MIN: 0,
    MAX: 10000,
    STEP: 100,
  },
  RATING: {
    MIN: 1,
    MAX: 5,
    STEP: 0.5,
  },
  OCCUPANCY: {
    MIN: 1,
    MAX: 10,
    STEP: 1,
  },
};

// Room Types
export const ROOM_TYPES = [
  { id: 'standard', label: 'Standard', icon: 'door' },
  { id: 'deluxe', label: 'Deluxe', icon: 'star' },
  { id: 'suite', label: 'Suite', icon: 'crown' },
  { id: 'penthouse', label: 'Penthouse', icon: 'building-2' },
  { id: 'villa', label: 'Villa', icon: 'home' },
];

// Bed Types
export const BED_TYPES = [
  { id: 'single', label: 'Single Bed' },
  { id: 'double', label: 'Double Bed' },
  { id: 'twin', label: 'Twin Beds' },
  { id: 'queen', label: 'Queen Bed' },
  { id: 'king', label: 'King Bed' },
  { id: 'bunk', label: 'Bunk Beds' },
];

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  CANCELLED: 'Cancelled',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'upi', label: 'UPI', icon: 'smartphone' },
  { id: 'netbanking', label: 'Net Banking', icon: 'building-bank' },
  { id: 'wallet', label: 'Digital Wallet', icon: 'wallet' },
];

// Cancellation Policies
export const CANCELLATION_POLICIES = {
  FREE: 'Free cancellation up to 24 hours before check-in',
  MODERATE: 'Free cancellation up to 7 days before check-in',
  STRICT: 'Non-refundable',
  FLEXIBLE: 'Free cancellation up to 48 hours before check-in',
};

// Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

// Countries
export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
];

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ne', name: 'Nepali' },
];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy', // e.g., "Jan 15, 2024"
  API: 'yyyy-MM-dd', // e.g., "2024-01-15"
  TIME: 'HH:mm', // e.g., "14:30"
  DATETIME: 'MMM dd, yyyy HH:mm', // e.g., "Jan 15, 2024 14:30"
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  OTP: /^\d{6}$/,
  BOOKING_REFERENCE: /^[A-Z0-9]{10}$/,
};

// Cache Keys
export const CACHE_KEYS = {
  HOTELS: 'hotels',
  HOTEL_DETAIL: (id: string) => `hotel_${id}`,
  SEARCH_RESULTS: 'search_results',
  FAVORITES: 'favorites',
  BOOKINGS: 'bookings',
  BOOKING_DETAIL: (id: string) => `booking_${id}`,
  USER_PROFILE: 'user_profile',
  AMENITIES: 'amenities',
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
};
