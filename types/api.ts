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

export type StandardResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface GuestProfile {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  full_name?: string;
  nationality?: string;
  profile_photo?: string;
  country?: string;
  currency?: string;
  profile_image?: string;
  is_verified?: boolean;
  loyalty_points?: number;
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
  price: number;
  photos: PropertyPhoto[];
  amenities: Amenity[];
  check_in_time: string; // HH:MM
  check_out_time: string; // HH:MM
  cancellation_policy: string;
  currency: string;
  brandColor?: string;
  logoUrl?: string;
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

// ============================================================================
// Portal / Multi-User Types
// ============================================================================

export type PortalType = 'guest' | 'host' | 'operations' | 'superadmin';

export interface HostProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  profile_image?: string;
  is_verified?: boolean;
  properties_count: number;
  total_bookings: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface OperatorProfile {
  id: string;
  email: string;
  name: string;
  role: 'front_desk' | 'housekeeping' | 'pos' | 'kds' | 'manager';
  property_id: string;
  property_name: string;
  profile_image?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminProfile {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  profile_image?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export type PortalProfile = GuestProfile | HostProfile | OperatorProfile | SuperAdminProfile;

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

// ============================================================================
// Enhanced Operations Types (from my-react-app)
// ============================================================================

export type OperatorRole = 'front_desk' | 'housekeeping' | 'kds' | 'pos' | 'manager';

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'cleaning' | 'inspected' | 'maintenance' | 'blocked';

export interface OperationRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  status: RoomStatus;
  smoking: boolean;
  accessible: boolean;
  guest_name?: string;
  booking_ref?: string;
  checkin_date?: string;
  checkout_date?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface OperationBooking {
  ref: string;
  guest_name: string;
  phone: string;
  email: string;
  room_type: string;
  room_number?: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  status: BookingStatus;
  total: number;
  balance: number;
  special_requests?: string;
}

export interface FolioCharge {
  id: string;
  description: string;
  amount: number;
  category: 'room' | 'minibar' | 'laundry' | 'restaurant' | 'service' | 'other';
  posted_at: string;
  posted_by: string;
}

export interface Folio {
  booking_ref: string;
  guest_name: string;
  room_number: string;
  charges: FolioCharge[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  settled: boolean;
}

export interface HousekeepingTask {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  status: 'pending' | 'cleaning' | 'inspected';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  notes?: string;
  updated_at: string;
}

export interface TableSection {
  id: string;
  name: string;
  floor: number;
}

export interface TableItem {
  id: string;
  number: number;
  capacity: number;
  shape: 'round' | 'square' | 'rectangle';
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section_id: string;
  waiter_name?: string;
  guest_count?: number;
  elapsed_minutes?: number;
}

export interface MenuModifier {
  id: string;
  name: string;
  options: { label: string; price: number }[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_veg: boolean;
  is_available: boolean;
  prep_time: number;
  tags: string[];
  modifiers?: MenuModifier[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: string;
  item_status: 'pending' | 'in_progress' | 'ready' | 'served' | 'cancelled';
}

export interface Order {
  id: string;
  table_id: string;
  table_number: number;
  waiter_id: string;
  waiter_name: string;
  items: OrderItem[];
  status: 'open' | 'submitted' | 'in_progress' | 'ready' | 'served' | 'billed' | 'paid' | 'voided';
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  paid_at?: string;
}

export interface KdsTicket {
  id: string;
  order_id: string;
  table_number: number;
  items: OrderItem[];
  elapsed_seconds: number;
  status: 'pending' | 'in_progress' | 'ready';
  supplement_to?: string;
}

export interface FloorRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  bedConfig: string;
  maxOccupancy: number;
  price: string;
  smoking: boolean;
  amenities: string[];
}

export interface Floor {
  id: string;
  name: string;
  rooms: FloorRoom[];
}

export interface HotelDetailBase {
  check_in_time_from: string;
  check_in_time_to: string;
  check_out_time_from: string;
  check_out_time_to: string;
  total_rooms: number;
  year_built?: number;
  number_of_floors: number;
}

export interface AmenityBase {
  name: string;
  is_default?: boolean;
}

export interface PropertyCreateRequest {
  name: string;
  type: string;
  description?: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude?: number;
  longitude?: number;
  hotel_detail: HotelDetailBase;
  amenities?: AmenityBase[];
  photo_urls?: string[];
}

export interface PropertyCreateResponse {
  id: string;
  tenant_id: string;
  is_active: boolean;
  name: string;
  type: string;
  description: string | null;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  hotel_detail: {
    id: string;
    property_id: string;
    check_in_time_from: string;
    check_in_time_to: string;
    check_out_time_from: string;
    check_out_time_to: string;
    total_rooms: number;
    year_built: number | null;
    number_of_floors: number;
    created_at: string;
    updated_at: string;
  };
  photos: { id: string; property_id: string; photo_url: string; created_at: string; updated_at: string }[];
  amenities: { id: string; name: string; is_default: boolean; created_at: string; updated_at: string }[];
}

export interface TenantCreateRequest {
  brand_name: string;
}

export interface TenantCreateResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface RoomCreateBase {
  room_name: string;
  floor_number: number;
  max_adults: number;
  max_children: number;
  base_rate: number;
  status?: string;
  cancellation_policy?: string;
  cancellation_notes?: string;
  room_type: { room_type_name: string; is_default?: boolean };
  bed_type: { bed_name: string; is_default?: boolean };
  photos?: string[];
  amenities?: string[];
}

export interface RoomCreateRequest {
  rooms: RoomCreateBase[];
}

// ============================================================================
// Admin / Host Portal Types (SRS 4.2)
// ============================================================================

export type PropertyType = 'HOTEL' | 'RESORT' | 'RESTAURANT' | 'HOSTEL' | 'MIXED' | 'VILLA' | 'APARTMENT' | 'BOUTIQUE';

export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export type AdminRoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE' | 'BLOCKED';

export type StaffRole = 'manager' | 'front_desk' | 'housekeeping' | 'waiter' | 'kitchen' | 'maintenance';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  type: PropertyType;
  description: string | null;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  check_in_time_from: string;
  check_in_time_to: string;
  check_out_time_from: string;
  check_out_time_to: string;
  number_of_floors: number;
  total_rooms: number;
  year_built: number | null;
  amenities: string[];
  is_active: boolean;
  currency: string;
  timezone: string;
  brand_color: string;
  min_rate_floor: number;
  logo_url: string | null;
  custom_domain: string | null;
  cancellation_policy: CancellationPolicy;
  photos: { id: string; photo_url: string; category: string }[];
  created_at: string;
  updated_at: string;
}

export interface ExtraCharge {
  id: string;
  name: string;
  price: number;
  charge_type: 'per_night' | 'one_time';
  description?: string;
}

export interface RoomTypeDef {
  id: string;
  property_id: string;
  room_type_name: string;
  is_default: boolean;
  description: string;
  max_occupancy: number;
  bed_configuration: string;
  view_type: string;
  amenities: string[];
  photos: string[];
  base_rate: number;
  rate_plan: string;
  extra_charges: ExtraCharge[];
  created_at: string;
  updated_at: string;
}

export interface AdminRoom {
  id: string;
  property_id: string;
  room_type_id: string;
  room_name: string;
  floor_number: number;
  max_adults: number;
  max_children: number;
  base_rate: number;
  status: AdminRoomStatus;
  smoking: boolean;
  accessible: boolean;
  cancellation_policy: CancellationPolicy;
  cancellation_notes: string | null;
  photos: string[];
  amenities: string[];
  blocked_dates: { start: string; end: string; reason: string }[];
  maintenance_return_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RatePlan {
  id: string;
  property_id: string;
  name: string;
  description: string;
  base_rate_per_room_type: Record<string, number>;
  rate_type: 'standard' | 'day_of_week';
  weekday_rate?: Record<string, number>; // Mon–Thu
  weekend_rate?: Record<string, number>; // Fri–Sun
  min_stay: number;
  max_stay: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DateOverride {
  id: string;
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  start_date: string;
  end_date: string;
  override_price: number;
  reason: string;
}

export interface AdminDiscountCode {
  id: string;
  property_id: string;
  code: string;
  type: DiscountType;
  discount_value: number;
  min_amount: number;
  max_uses: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  applicable_room_types: string[];
  combinable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpecialOffer {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_custom: boolean;
  conditions: {
    advance_days?: number;
    within_days?: number;
    min_nights?: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface TaxConfig {
  id: string;
  property_id: string;
  name: string;
  type: 'PERCENTAGE' | 'FLAT';
  rate: number;
  is_inclusive: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: StaffRole;
  property_id: string;
  is_active: boolean;
  pos_discount_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  property_id: string;
  staff_id: string;
  staff_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'clocked_in' | 'clocked_out' | 'absent';
  created_at: string;
  updated_at: string;
}

export interface StaffTask {
  id: string;
  property_id: string;
  assigned_to: string;
  assigned_name: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
