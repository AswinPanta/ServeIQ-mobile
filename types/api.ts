// ─── Portal Types ───────────────────────────────────────────────────────────

export type PortalType = 'guest' | 'host' | 'operations' | 'superadmin';

export interface GuestProfile {
  id: string;
  email: string;
  phone: string;
  name: string;
  full_name?: string;
  nationality: string;
  country?: string;
  currency?: string;
  profile_image?: string;
  profile_photo?: string;
  is_verified: boolean;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface HostProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  is_verified: boolean;
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
  role: OperatorRole;
  property_id: string;
  property_name: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminProfile {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type PortalProfile = GuestProfile | HostProfile | OperatorProfile | SuperAdminProfile;

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
}

// ─── CRM Types ──────────────────────────────────────────────────────────────

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

// ─── Role Types ─────────────────────────────────────────────────────────────

export type OperatorRole =
  | 'front_desk'
  | 'housekeeping'
  | 'pos'
  | 'kds'
  | 'manager';

// ─── Search Types ───────────────────────────────────────────────────────────

export interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  children?: number;
}

export interface SearchFilters {
  priceRange?: [number, number];
  starRating?: number[];
  propertyType?: string[];
  amenities?: string[];
  freeCancellation?: boolean;
}

export interface SearchResults {
  hotels: Hotel[];
  totalCount: number;
  filters: SearchFilters;
}

// ─── Hotel (Guest-Facing) ───────────────────────────────────────────────────

export interface HotelPhoto {
  url: string;
  caption?: string;
  id?: string;
  order?: number;
}

export interface HotelAmenity {
  name: string;
  icon: string;
  id?: string;
  category?: string;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  address: string;
  rating: number;
  review_count: number;
  starRating: number;
  price: number;
  currency: string;
  description: string;
  shortDescription: string;
  property_type?: string;
  images: string[];
  photos?: HotelPhoto[];
  amenities: HotelAmenity[];
  roomTypes: any[];
  reviews: any[];
  cancellationPolicy: string;
  cancellation_policy?: string;
  checkInTime: string;
  check_in_time?: string;
  checkOutTime: string;
  check_out_time?: string;
  phone: string;
  email: string;
  website?: string;
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  availableRooms: number;
  brandColor?: string;
  logoUrl?: string;
  tags: string[];
  isSuperhost?: boolean;
  category?: string;
  hostName?: string;
  hostAvatar?: string;
  hostJoined?: string;
  hostReviews?: number;
  lat?: number;
  lng?: number;
  tag?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Host Portal Types ──────────────────────────────────────────────────────

export type PropertyType =
  | 'HOTEL'
  | 'RESORT'
  | 'VILLA'
  | 'APARTMENT'
  | 'BOUTIQUE'
  | 'COTTAGE'
  | 'HOSTEL'
  | 'GUEST_HOUSE';

export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE' | 'CUSTOM';

export interface PropertyPhoto {
  id: string;
  photo_url: string;
  category: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  type: PropertyType;
  description: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude: number;
  longitude: number;
  check_in_time_from: string;
  check_in_time_to: string;
  check_out_time_from: string;
  check_out_time_to: string;
  number_of_floors: number;
  total_rooms: number;
  year_built: number;
  amenities: string[];
  is_active: boolean;
  currency: string;
  timezone: string;
  brand_color?: string;
  min_rate_floor?: number;
  logo_url: string | null;
  custom_domain: string | null;
  cancellation_policy: CancellationPolicy;
  photos: PropertyPhoto[];
  created_at: string;
  updated_at: string;
}

export type AdminRoomStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'DIRTY'
  | 'CLEANING'
  | 'INSPECTED'
  | 'MAINTENANCE'
  | 'BLOCKED';

export interface AdminRoom {
  id: string;
  property_id: string;
  room_type_id: string;
  room_name: string;
  floor_number: number;
  max_adults: number;
  max_children: number;
  max_occupancy: number;
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

export interface RatePlan {
  id: string;
  property_id: string;
  name: string;
  description: string;
  base_rate_per_room_type: Record<string, number>;
  rate_type: 'standard' | 'day_of_week';
  weekday_rate?: Record<string, number>;
  weekend_rate?: Record<string, number>;
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
  type: 'PERCENTAGE' | 'FIXED';
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

export type StaffRole =
  | 'manager'
  | 'front_desk'
  | 'housekeeping'
  | 'waiter'
  | 'kitchen'
  | 'maintenance';

// Backend staff job roles (JobRole enum from staff router)
export type BackendJobRole =
  | 'MANAGER'
  | 'FRONT_DESK'
  | 'HOUSEKEEPING'
  | 'WAITER'
  | 'KITCHEN'
  | 'MAINTENANCE';

export type BackendStaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface StaffPhotos {
  profile?: string | null;
  citizenship_front?: string | null;
  citizenship_back?: string | null;
}

export interface BackendStaff {
  id: string;
  tenant_id?: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  job_role: BackendJobRole;
  monthly_salary?: string;
  joining_date: string;
  status: BackendStaffStatus;
  photos?: StaffPhotos | null;
}

export interface CreateStaffRequest {
  full_name: string;
  email: string;
  phone_number?: string;
  job_role: BackendJobRole;
  monthly_salary?: string;
  joining_date: string;
  status?: BackendStaffStatus;
  photos?: StaffPhotos;
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
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Operations Portal Types ────────────────────────────────────────────────

export type OperationRoomStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'DIRTY'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'BLOCKED';

export interface OperationRoom {
  id: string;
  property_id: string;
  room_name: string;
  floor_number: number;
  room_type: string;
  status: OperationRoomStatus;
  max_adults: number;
  max_children: number;
  base_rate: number;
  amenities: string[];
  is_smoking: boolean;
  is_accessible: boolean;
}

export type BookingStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export interface OperationBooking {
  ref: string;
  guest_name: string;
  email?: string;
  phone?: string;
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
  category: 'room' | 'restaurant' | 'minibar' | 'laundry' | 'service' | 'other';
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
  room_id: string;
  room_name: string;
  status: 'dirty' | 'in_progress' | 'cleaned' | 'inspected';
  assigned_cleaner?: string;
  notes?: string;
  property_id: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface TableItem {
  id: string;
  number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  order_id?: string;
  server_name?: string;
}

export interface MenuModifier {
  id: string;
  name: string;
  type: 'single' | 'multi';
  options: { label: string; price: number }[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
  tags: string[];
  modifiers?: MenuModifier[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  modifiers?: string;
}

export interface Order {
  id: string;
  table_id: string;
  items: OrderItem[];
  status: 'open' | 'submitted' | 'preparing' | 'ready' | 'served' | 'paid';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface KdsTicket {
  id: string;
  order_id: string;
  table_number: string;
  items: KdsTicketItem[];
  status: 'pending' | 'in_progress' | 'ready';
  notes?: string;
  elapsed_seconds: number;
}

export interface KdsTicketItem {
  id: string;
  name: string;
  quantity: number;
  item_status: 'pending' | 'in_progress' | 'ready' | 'served' | 'cancelled';
  modifiers?: string;
}

// ─── Booking API Types (matches live backend) ─────────────────────────────

export interface BookingCreateRequest {
  idempotency_key: string;
  property_id: string;
  room_ids: string[];
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
}

export interface PropertySummary {
  id: string;
  name: string;
  type: string;
  city?: string;
  country?: string;
  currency: string;
  photo?: string | null;
  phone_number: string;
  email: string;
}

export interface RoomReservationDetail {
  room_id: string;
  room_name: string;
  room_type: string;
  bed_type: string;
  max_adults: number;
  max_children: number;
  base_rate: number;
  nights: number;
  subtotal: number;
  photo?: string | null;
  cancellation_title: string;
  cancellation_description: string;
}

export interface AppliedSpecialOffer {
  title: string;
  description: string;
}

export interface BookingReservationResponse {
  booking_id: string;
  ref_number: string;
  status: string;
  number_of_adults: number;
  number_of_children: number;
  check_in: string;
  check_out: string;
  nights: number;
  payment_gateway?: string;
  property: PropertySummary;
  rooms: RoomReservationDetail[];
  total_amount: number;
  subtotal: number;
  special_offer_applied?: AppliedSpecialOffer[];
  special_offer_discount: number;
  coupon_code?: string;
  coupon_discount: number;
  soft_lock_expires_at: string;
  created_at?: string;
}

export interface BookingListItem {
  id: string;
  property_id: string;
  property_name: string;
  property_photo?: string | null;
  guest_name: string;
  guest_email: string;
  booking_number: string;
  room_names: string[];
  ref_number: string;
  status: string;
  number_of_adults?: number;
  number_of_children?: number;
  checkin_date: string;
  checkout_date: string;
  payment_gateway: string;
  subtotal: string;
  special_offer_discount: string | null;
  coupon_code: string | null;
  coupon_discount: string | null;
  currency?: string;
  total_amount: number;
  created_at: string;
}

export interface PaginatedBookingsResponse {
  items: BookingListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaymentIntentRequest {
  payment_gateway: string;
  return_url?: string | null;
}

export interface PaymentIntentResponse {
  ref_number: string;
  payment_gateway: string;
  amount: number;
  currency: string;
  payment_intent_id?: string;
  client_secret?: string;
  order_id?: string;
  pidx?: string;
}

export interface ConfirmPaymentRequest {
  idempotency_key: string;
  gateway_payload?: Record<string, unknown>;
}

export interface ConfirmPaymentResponse {
  status: string;
  message?: string;
  booking_id?: string;
  ref_number?: string;
}

// ─── Legacy Booking Types (for guest booking flow) ──────────────────────

export interface BookingAddOn {
  name: string;
  price: number;
  quantity: number;
}

// ─── Tenant API Types ───────────────────────────────────────────────────────

export interface TenantCreateRequest {
  brand_name: string;
}

export interface TenantCreateResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
