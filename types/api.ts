/**
 * API Response and Error Types
 * Defines all API request/response structures for Stay_Easy Guest Portal
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthCredentials {
  email: string;
  phone?: string;
  password: string;
}

export interface OTPRequest {
  email?: string;
  phone?: string;
}

export interface OTPVerification {
  email?: string;
  phone?: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface GuestProfile {
  id: string;
  email: string;
  phone: string;
  name: string;
  nationality?: string;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Hotel/Property Types
// ============================================================================

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  property_type: 'Hotel' | 'Resort' | 'Hostel' | 'Restaurant' | 'Mixed';
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  rating: number; // 1-5
  review_count: number;
  photos: PropertyPhoto[];
  amenities: Amenity[];
  check_in_time: string; // HH:MM
  check_out_time: string; // HH:MM
  cancellation_policy: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: string;
  property_id: string;
  name: string;
  description: string;
  max_occupancy: number;
  bed_configuration: string;
  base_price: number;
  photos: PropertyPhoto[];
  amenities: Amenity[];
  available_count: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_type_id: string;
  room_number: string;
  floor: number;
  status: 'Available' | 'Occupied' | 'Dirty' | 'Under Maintenance';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Search & Availability Types
// ============================================================================

export interface SearchParams {
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  guests: number;
  rooms: number;
  location?: string;
  country?: string;
  currency?: string;
  page?: number;
  limit?: number;
  sort_by?: 'price' | 'rating' | 'distance';
  sort_order?: 'asc' | 'desc';
}

export interface SearchFilters {
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  amenities?: string[]; // Amenity IDs
  room_types?: string[]; // Room type names
  bed_types?: string[]; // Bed type names
}

export interface AvailabilityResponse {
  hotel: Hotel;
  room_types: RoomTypeAvailability[];
  total_price_range: {
    min: number;
    max: number;
  };
  currency: string;
}

export interface RoomTypeAvailability {
  room_type: RoomType;
  available_count: number;
  price_per_night: number;
  total_price: number; // For the entire stay
  discount_percentage?: number;
  original_price?: number;
}

export interface SearchResults {
  hotels: AvailabilityResponse[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// Booking Types
// ============================================================================

export interface BookingRequest {
  hotel_id: string;
  room_type_id: string;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  number_of_guests: number;
  number_of_rooms: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_nationality?: string;
  add_ons?: BookingAddOn[];
  special_requests?: string;
  discount_code?: string;
  payment_method: string;
}

export interface BookingAddOn {
  name: string;
  price: number;
  quantity: number;
}

export interface BookingResponse {
  id: string;
  booking_reference: string;
  hotel_id: string;
  room_type_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms: number;
  status: 'Pending' | 'Confirmed' | 'Checked In' | 'Checked Out' | 'Cancelled';
  total_price: number;
  currency: string;
  pricing_breakdown: {
    base_price: number;
    taxes: number;
    discount: number;
    add_ons: number;
    total: number;
  };
  payment_status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  qr_code?: string;
  confirmation_code: string;
  created_at: string;
  updated_at: string;
}

export interface BookingHistory {
  id: string;
  booking_reference: string;
  hotel_name: string;
  hotel_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number;
  currency: string;
  created_at: string;
}

export interface BookingDetails extends BookingResponse {
  hotel: Hotel;
  room_type: RoomType;
  guest: GuestProfile;
  reviews?: Review[];
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  booking_id: string;
  guest_id: string;
  hotel_id: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReviewRequest {
  booking_id: string;
  rating: number;
  title: string;
  comment: string;
  photos?: string[];
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentMethod {
  id: string;
  type: 'Card' | 'UPI' | 'NetBanking' | 'Wallet';
  display_name: string;
  is_default: boolean;
}

export interface PaymentRequest {
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: string;
}

export interface PaymentResponse {
  transaction_id: string;
  status: 'Success' | 'Failed' | 'Pending';
  amount: number;
  currency: string;
  timestamp: string;
  receipt_url?: string;
}

// ============================================================================
// Favorites Types
// ============================================================================

export interface FavoriteRequest {
  hotel_id: string;
}

export interface FavoriteResponse {
  hotel_id: string;
  added_at: string;
}

export interface FavoritesList {
  favorites: Hotel[];
  total_count: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationError extends APIError {
  errors: Record<string, string[]>;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationMessage {
  id: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'review_request' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface UserPreferences {
  currency: string;
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface UserStats {
  total_bookings: number;
  total_spent: number;
  favorite_hotels_count: number;
  loyalty_points: number;
  member_since: string;
}
