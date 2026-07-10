import type {
  Property,
  RoomTypeDef,
  ExtraCharge,
  AdminRoom,
  RatePlan,
  DateOverride,
  AdminDiscountCode,
  SpecialOffer,
  TaxConfig,
  StaffMember,
  Shift,
  StaffTask,
} from '@/types/api';

const now = new Date().toISOString();

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    tenant_id: 'demo-host-1',
    name: 'Grand Himalaya Resort',
    type: 'RESORT',
    description: 'A luxury resort in the heart of the Himalayas with breathtaking mountain views.',
    country: 'Nepal',
    state: 'Bagmati',
    city: 'Kathmandu',
    zip_code: '44600',
    address: 'Lakeside Road, Pokhara',
    latitude: 28.2096,
    longitude: 83.9856,
    check_in_time_from: '14:00',
    check_in_time_to: '12:00',
    check_out_time_from: '00:00',
    check_out_time_to: '11:00',
    number_of_floors: 5,
    total_rooms: 20,
    year_built: 2018,
    amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Parking', 'Spa', 'Bar', 'Room Service'],
    is_active: true,
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    brand_color: '#2563EB',
    min_rate_floor: 2000,
    logo_url: null,
    custom_domain: null,
    cancellation_policy: 'MODERATE',
    photos: [
      { id: 'ph-1', photo_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', category: 'exterior' },
      { id: 'ph-2', photo_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', category: 'lobby' },
      { id: 'ph-3', photo_url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', category: 'room' },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prop-2',
    tenant_id: 'demo-host-1',
    name: 'Kathmandu Boutique Hotel',
    type: 'BOUTIQUE',
    description: 'A charming boutique hotel in the heart of Thamel.',
    country: 'Nepal',
    state: 'Bagmati',
    city: 'Kathmandu',
    zip_code: '44600',
    address: 'Thamel, Kathmandu',
    latitude: 27.7172,
    longitude: 85.3240,
    check_in_time_from: '14:00',
    check_in_time_to: '12:00',
    check_out_time_from: '00:00',
    check_out_time_to: '10:00',
    number_of_floors: 4,
    total_rooms: 12,
    year_built: 2015,
    amenities: ['WiFi', 'Restaurant', 'Bar', 'Airport Shuttle', 'Laundry', 'Tour Desk'],
    is_active: true,
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    brand_color: '#7C3AED',
    min_rate_floor: 1500,
    logo_url: null,
    custom_domain: null,
    cancellation_policy: 'FLEXIBLE',
    photos: [
      { id: 'ph-4', photo_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', category: 'exterior' },
      { id: 'ph-5', photo_url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', category: 'room' },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prop-3',
    tenant_id: 'demo-host-1',
    name: 'Pokhara Lake View Villa',
    type: 'VILLA',
    description: 'Beautiful villa overlooking Phewa Lake with private garden.',
    country: 'Nepal',
    state: 'Gandaki',
    city: 'Pokhara',
    zip_code: '33700',
    address: 'Lakeside, Pokhara',
    latitude: 28.2096,
    longitude: 83.9856,
    check_in_time_from: '13:00',
    check_in_time_to: '11:00',
    check_out_time_from: '00:00',
    check_out_time_to: '10:00',
    number_of_floors: 2,
    total_rooms: 6,
    year_built: 2020,
    amenities: ['WiFi', 'Kitchen', 'Parking', 'Garden', 'Lake View', 'BBQ'],
    is_active: true,
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    brand_color: '#0D9488',
    min_rate_floor: 8000,
    logo_url: null,
    custom_domain: null,
    cancellation_policy: 'STRICT',
    photos: [
      { id: 'ph-6', photo_url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', category: 'exterior' },
    ],
    created_at: now,
    updated_at: now,
  },
];

export const mockRoomTypeDefs: RoomTypeDef[] = [
  {
    id: 'rt-1', property_id: 'prop-1', room_type_name: 'Standard Room', is_default: true,
    description: 'Comfortable room with essential amenities', max_occupancy: 2,
    bed_configuration: 'Double', view_type: 'Garden', amenities: ['WiFi', 'AC', 'TV'],
    photos: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'], base_rate: 2500, rate_plan: 'Standard',
    extra_charges: [
      { id: 'ec-1', name: 'Extra Bed', price: 500, charge_type: 'per_night', description: 'Rollaway bed for additional guest' },
      { id: 'ec-2', name: 'Late Check-out', price: 1000, charge_type: 'one_time', description: 'Check-out up to 6 PM' },
    ],
    created_at: now, updated_at: now,
  },
  {
    id: 'rt-2', property_id: 'prop-1', room_type_name: 'Deluxe Room', is_default: false,
    description: 'Spacious room with mountain view', max_occupancy: 3,
    bed_configuration: 'King', view_type: 'Mountain', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'],
    photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'], base_rate: 4500, rate_plan: 'Premium',
    extra_charges: [
      { id: 'ec-3', name: 'Extra Bed', price: 800, charge_type: 'per_night', description: 'Premium rollaway with mattress topper' },
      { id: 'ec-4', name: 'Early Check-in', price: 1500, charge_type: 'one_time', description: 'Check-in from 8 AM' },
      { id: 'ec-5', name: 'Late Check-out', price: 1500, charge_type: 'one_time', description: 'Check-out up to 8 PM' },
    ],
    created_at: now, updated_at: now,
  },
  {
    id: 'rt-3', property_id: 'prop-1', room_type_name: 'Suite', is_default: false,
    description: 'Luxury suite with separate living area', max_occupancy: 4,
    bed_configuration: 'King + Sofa', view_type: 'Mountain', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Living Room'],
    photos: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400'], base_rate: 8000, rate_plan: 'Luxury',
    extra_charges: [
      { id: 'ec-6', name: 'Extra Bed', price: 1200, charge_type: 'per_night', description: 'Luxury rollaway with premium bedding' },
      { id: 'ec-7', name: 'Rollaway Crib', price: 500, charge_type: 'per_night', description: 'Baby crib with mattress' },
      { id: 'ec-8', name: 'Late Check-out', price: 2000, charge_type: 'one_time', description: 'Check-out up to 10 PM' },
    ],
    created_at: now, updated_at: now,
  },
  {
    id: 'rt-4', property_id: 'prop-2', room_type_name: 'Standard Room', is_default: true,
    description: 'Cozy room with city view', max_occupancy: 2,
    bed_configuration: 'Queen', view_type: 'City', amenities: ['WiFi', 'AC', 'TV'],
    photos: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400'], base_rate: 1800, rate_plan: 'Standard',
    extra_charges: [
      { id: 'ec-9', name: 'Extra Bed', price: 400, charge_type: 'per_night' },
      { id: 'ec-10', name: 'Late Check-out', price: 800, charge_type: 'one_time', description: 'Check-out up to 4 PM' },
    ],
    created_at: now, updated_at: now,
  },
  {
    id: 'rt-5', property_id: 'prop-2', room_type_name: 'Deluxe Room', is_default: false,
    description: 'Premium room with heritage decor', max_occupancy: 3,
    bed_configuration: 'King', view_type: 'City', amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
    photos: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], base_rate: 3200, rate_plan: 'Premium',
    extra_charges: [
      { id: 'ec-11', name: 'Extra Bed', price: 600, charge_type: 'per_night' },
      { id: 'ec-12', name: 'Early Check-in', price: 1000, charge_type: 'one_time', description: 'Check-in from 10 AM' },
    ],
    created_at: now, updated_at: now,
  },
  {
    id: 'rt-6', property_id: 'prop-3', room_type_name: 'Entire Villa', is_default: true,
    description: 'Full villa with private garden', max_occupancy: 8,
    bed_configuration: '3 King + 2 Single', view_type: 'Lake', amenities: ['WiFi', 'AC', 'TV', 'Kitchen', 'Garden', 'BBQ'],
    photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400'], base_rate: 12000, rate_plan: 'Standard',
    extra_charges: [
      { id: 'ec-13', name: 'Extra Bed', price: 1500, charge_type: 'per_night', description: 'Premium rollaway' },
      { id: 'ec-14', name: 'Rollaway Crib', price: 800, charge_type: 'per_night', description: 'Baby crib' },
      { id: 'ec-15', name: 'Late Check-out', price: 3000, charge_type: 'one_time', description: 'Check-out up to 6 PM' },
      { id: 'ec-16', name: 'Early Check-in', price: 2500, charge_type: 'one_time', description: 'Check-in from 8 AM' },
    ],
    created_at: now, updated_at: now,
  },
];

export const mockAdminRooms: AdminRoom[] = [
  // Grand Himalaya Resort — Floor 1 (Standard)
  { id: 'rm-1', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '101', floor_number: 1, max_adults: 2, max_children: 1, base_rate: 2500, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-2', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '102', floor_number: 1, max_adults: 2, max_children: 0, base_rate: 2500, status: 'OCCUPIED', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-3', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '103', floor_number: 1, max_adults: 2, max_children: 1, base_rate: 2500, status: 'DIRTY', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-4', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '104', floor_number: 1, max_adults: 2, max_children: 0, base_rate: 2500, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  // Floor 2 (Standard)
  { id: 'rm-5', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '201', floor_number: 2, max_adults: 2, max_children: 1, base_rate: 2500, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-6', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '202', floor_number: 2, max_adults: 2, max_children: 0, base_rate: 2500, status: 'OCCUPIED', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-7', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '203', floor_number: 2, max_adults: 2, max_children: 1, base_rate: 2500, status: 'CLEANING', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-8', property_id: 'prop-1', room_type_id: 'rt-1', room_name: '204', floor_number: 2, max_adults: 2, max_children: 0, base_rate: 2500, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  // Floor 3 (Deluxe)
  { id: 'rm-9', property_id: 'prop-1', room_type_id: 'rt-2', room_name: '301', floor_number: 3, max_adults: 3, max_children: 1, base_rate: 4500, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-10', property_id: 'prop-1', room_type_id: 'rt-2', room_name: '302', floor_number: 3, max_adults: 3, max_children: 1, base_rate: 4500, status: 'OCCUPIED', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-11', property_id: 'prop-1', room_type_id: 'rt-2', room_name: '303', floor_number: 3, max_adults: 3, max_children: 0, base_rate: 4500, status: 'AVAILABLE', smoking: true, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-12', property_id: 'prop-1', room_type_id: 'rt-2', room_name: '304', floor_number: 3, max_adults: 3, max_children: 1, base_rate: 4500, status: 'MAINTENANCE', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: 'Plumbing issue', photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'], blocked_dates: [], maintenance_return_date: '2026-07-15', created_at: now, updated_at: now },
  // Floor 4 (Suite)
  { id: 'rm-13', property_id: 'prop-1', room_type_id: 'rt-3', room_name: '401', floor_number: 4, max_adults: 4, max_children: 2, base_rate: 8000, status: 'AVAILABLE', smoking: false, accessible: true, cancellation_policy: 'STRICT', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Living Room'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-14', property_id: 'prop-1', room_type_id: 'rt-3', room_name: '402', floor_number: 4, max_adults: 4, max_children: 2, base_rate: 8000, status: 'OCCUPIED', smoking: false, accessible: true, cancellation_policy: 'STRICT', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Living Room'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-15', property_id: 'prop-1', room_type_id: 'rt-3', room_name: '403', floor_number: 4, max_adults: 4, max_children: 2, base_rate: 8000, status: 'AVAILABLE', smoking: false, accessible: true, cancellation_policy: 'STRICT', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Living Room'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  // Kathmandu Boutique Hotel
  { id: 'rm-16', property_id: 'prop-2', room_type_id: 'rt-4', room_name: '101', floor_number: 1, max_adults: 2, max_children: 1, base_rate: 1800, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-17', property_id: 'prop-2', room_type_id: 'rt-4', room_name: '102', floor_number: 1, max_adults: 2, max_children: 0, base_rate: 1800, status: 'OCCUPIED', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-18', property_id: 'prop-2', room_type_id: 'rt-4', room_name: '103', floor_number: 1, max_adults: 2, max_children: 1, base_rate: 1800, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'FLEXIBLE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-19', property_id: 'prop-2', room_type_id: 'rt-5', room_name: '201', floor_number: 2, max_adults: 3, max_children: 1, base_rate: 3200, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-20', property_id: 'prop-2', room_type_id: 'rt-5', room_name: '202', floor_number: 2, max_adults: 3, max_children: 1, base_rate: 3200, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'MODERATE', cancellation_notes: null, photos: [], amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  // Pokhara Lake View Villa
  { id: 'rm-21', property_id: 'prop-3', room_type_id: 'rt-6', room_name: 'Villa A', floor_number: 1, max_adults: 8, max_children: 4, base_rate: 12000, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'STRICT', cancellation_notes: 'Full payment required', photos: [], amenities: ['WiFi', 'AC', 'TV', 'Kitchen', 'Garden', 'BBQ'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
  { id: 'rm-22', property_id: 'prop-3', room_type_id: 'rt-6', room_name: 'Villa B', floor_number: 1, max_adults: 6, max_children: 3, base_rate: 10000, status: 'AVAILABLE', smoking: false, accessible: false, cancellation_policy: 'STRICT', cancellation_notes: 'Full payment required', photos: [], amenities: ['WiFi', 'AC', 'TV', 'Kitchen', 'Garden'], blocked_dates: [], maintenance_return_date: null, created_at: now, updated_at: now },
];

export const mockRatePlans: RatePlan[] = [
  { id: 'rp-1', property_id: 'prop-1', name: 'Standard', description: 'Best available rate', base_rate_per_room_type: { 'rt-1': 2500, 'rt-2': 4500, 'rt-3': 8000 }, rate_type: 'day_of_week', weekday_rate: { 'rt-1': 2500, 'rt-2': 4500, 'rt-3': 8000 }, weekend_rate: { 'rt-1': 3200, 'rt-2': 5500, 'rt-3': 9500 }, min_stay: 1, max_stay: 30, is_active: true, created_at: now, updated_at: now },
  { id: 'rp-2', property_id: 'prop-1', name: 'Weekend Getaway', description: 'Special weekend pricing', base_rate_per_room_type: { 'rt-1': 2200, 'rt-2': 4000, 'rt-3': 7500 }, rate_type: 'standard', min_stay: 2, max_stay: 4, is_active: true, created_at: now, updated_at: now },
  { id: 'rp-3', property_id: 'prop-1', name: 'Weekly Saver', description: 'Save on extended stays', base_rate_per_room_type: { 'rt-1': 2000, 'rt-2': 3800, 'rt-3': 7000 }, rate_type: 'standard', min_stay: 7, max_stay: 30, is_active: true, created_at: now, updated_at: now },
  { id: 'rp-4', property_id: 'prop-2', name: 'Standard', description: 'Best available rate', base_rate_per_room_type: { 'rt-4': 1800, 'rt-5': 3200 }, rate_type: 'standard', min_stay: 1, max_stay: 30, is_active: true, created_at: now, updated_at: now },
  { id: 'rp-5', property_id: 'prop-3', name: 'Standard', description: 'Best available rate', base_rate_per_room_type: { 'rt-6': 12000 }, rate_type: 'standard', min_stay: 2, max_stay: 14, is_active: true, created_at: now, updated_at: now },
];

export const mockDateOverrides: DateOverride[] = [
  { id: 'do-1', property_id: 'prop-1', room_type_id: 'rt-3', rate_plan_id: 'rp-1', start_date: '2026-12-24', end_date: '2026-12-26', override_price: 15000, reason: 'Christmas' },
  { id: 'do-2', property_id: 'prop-1', room_type_id: 'rt-3', rate_plan_id: 'rp-1', start_date: '2026-12-31', end_date: '2027-01-02', override_price: 18000, reason: 'New Year' },
  { id: 'do-3', property_id: 'prop-1', room_type_id: 'rt-1', rate_plan_id: 'rp-1', start_date: '2026-09-15', end_date: '2026-09-20', override_price: 3500, reason: 'Peak season' },
  { id: 'do-4', property_id: 'prop-2', room_type_id: 'rt-5', rate_plan_id: 'rp-4', start_date: '2026-10-01', end_date: '2026-10-10', override_price: 5000, reason: 'Dashain festival' },
];

export const mockDiscountCodes: AdminDiscountCode[] = [
  { id: 'dc-1', property_id: 'prop-1', code: 'WELCOME10', type: 'PERCENTAGE', discount_value: 10, min_amount: 5000, max_uses: 100, used_count: 23, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: ['rt-1', 'rt-2'], combinable: false, is_active: true, created_at: now, updated_at: now },
  { id: 'dc-2', property_id: 'prop-1', code: 'FLAT500', type: 'FIXED', discount_value: 500, min_amount: 10000, max_uses: 50, used_count: 12, valid_from: '2026-06-01', valid_to: '2026-12-31', applicable_room_types: ['rt-2', 'rt-3'], combinable: true, is_active: true, created_at: now, updated_at: now },
  { id: 'dc-3', property_id: 'prop-1', code: 'SUMMER25', type: 'PERCENTAGE', discount_value: 25, min_amount: 3000, max_uses: 200, used_count: 45, valid_from: '2026-06-01', valid_to: '2026-08-31', applicable_room_types: ['rt-1', 'rt-2', 'rt-3'], combinable: false, is_active: true, created_at: now, updated_at: now },
  { id: 'dc-4', property_id: 'prop-2', code: 'BOUTIQUE15', type: 'PERCENTAGE', discount_value: 15, min_amount: 2000, max_uses: 100, used_count: 8, valid_from: '2026-01-01', valid_to: '2026-12-31', applicable_room_types: ['rt-4', 'rt-5'], combinable: false, is_active: true, created_at: now, updated_at: now },
];

export const mockSpecialOffers: SpecialOffer[] = [
  { id: 'so-1', property_id: 'prop-1', title: 'Early Bird Discount', description: 'Book 30 days in advance and save 20%', discount_percentage: 20, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true, is_custom: false, conditions: { advance_days: 30 }, created_at: now, updated_at: now },
  { id: 'so-2', property_id: 'prop-1', title: 'Last Minute Deal', description: 'Book within 3 days and save 15%', discount_percentage: 15, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true, is_custom: false, conditions: { within_days: 3 }, created_at: now, updated_at: now },
  { id: 'so-3', property_id: 'prop-1', title: 'Long Stay Discount', description: 'Stay 7+ nights and save 25%', discount_percentage: 25, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true, is_custom: false, conditions: { min_nights: 7 }, created_at: now, updated_at: now },
  { id: 'so-4', property_id: 'prop-2', title: 'Weekend Special', description: 'Book Friday-Sunday and get 10% off', discount_percentage: 10, start_date: '2026-06-01', end_date: '2026-09-30', is_active: true, is_custom: false, conditions: null, created_at: now, updated_at: now },
];

export const mockTaxConfigs: TaxConfig[] = [
  { id: 'tx-1', property_id: 'prop-1', name: 'VAT', type: 'PERCENTAGE', rate: 13, is_inclusive: false, is_active: true, created_at: now, updated_at: now },
  { id: 'tx-2', property_id: 'prop-1', name: 'Service Charge', type: 'PERCENTAGE', rate: 10, is_inclusive: false, is_active: true, created_at: now, updated_at: now },
  { id: 'tx-3', property_id: 'prop-2', name: 'VAT', type: 'PERCENTAGE', rate: 13, is_inclusive: false, is_active: true, created_at: now, updated_at: now },
  { id: 'tx-4', property_id: 'prop-2', name: 'Tourist Tax', type: 'FLAT', rate: 200, is_inclusive: true, is_active: true, created_at: now, updated_at: now },
  { id: 'tx-5', property_id: 'prop-3', name: 'VAT', type: 'PERCENTAGE', rate: 13, is_inclusive: false, is_active: true, created_at: now, updated_at: now },
];

export const mockStaff: StaffMember[] = [
  { id: 'st-1', tenant_id: 'demo-host-1', email: 'ram.sharma@grandhimalaya.com', first_name: 'Ram', last_name: 'Sharma', phone: '+977-9841000001', role: 'manager', property_id: 'prop-1', is_active: true, pos_discount_limit: 20, created_at: now, updated_at: now },
  { id: 'st-2', tenant_id: 'demo-host-1', email: 'sita.gurung@grandhimalaya.com', first_name: 'Sita', last_name: 'Gurung', phone: '+977-9841000002', role: 'front_desk', property_id: 'prop-1', is_active: true, pos_discount_limit: 10, created_at: now, updated_at: now },
  { id: 'st-3', tenant_id: 'demo-host-1', email: 'hari.thapa@grandhimalaya.com', first_name: 'Hari', last_name: 'Thapa', phone: '+977-9841000003', role: 'housekeeping', property_id: 'prop-1', is_active: true, pos_discount_limit: 0, created_at: now, updated_at: now },
  { id: 'st-4', tenant_id: 'demo-host-1', email: 'gita.poudel@grandhimalaya.com', first_name: 'Gita', last_name: 'Poudel', phone: '+977-9841000004', role: 'housekeeping', property_id: 'prop-1', is_active: true, pos_discount_limit: 0, created_at: now, updated_at: now },
  { id: 'st-5', tenant_id: 'demo-host-1', email: 'anil.kc@grandhimalaya.com', first_name: 'Anil', last_name: 'KC', phone: '+977-9841000005', role: 'waiter', property_id: 'prop-1', is_active: true, pos_discount_limit: 5, created_at: now, updated_at: now },
  { id: 'st-6', tenant_id: 'demo-host-1', email: 'deepa.rai@boutique.com', first_name: 'Deepa', last_name: 'Rai', phone: '+977-9841000006', role: 'manager', property_id: 'prop-2', is_active: true, pos_discount_limit: 20, created_at: now, updated_at: now },
  { id: 'st-7', tenant_id: 'demo-host-1', email: 'kiran.adhi@boutique.com', first_name: 'Kiran', last_name: 'Adhikari', phone: '+977-9841000007', role: 'front_desk', property_id: 'prop-2', is_active: true, pos_discount_limit: 10, created_at: now, updated_at: now },
  { id: 'st-8', tenant_id: 'demo-host-1', email: 'manisha.magar@pokharavilla.com', first_name: 'Manisha', last_name: 'Magar', phone: '+977-9841000008', role: 'housekeeping', property_id: 'prop-3', is_active: true, pos_discount_limit: 0, created_at: now, updated_at: now },
];

export const mockShifts: Shift[] = [
  // Grand Himalaya Resort (prop-1) — well-staffed
  { id: 'sh-1', property_id: 'prop-1', staff_id: 'st-1', staff_name: 'Ram Sharma', date: '2026-07-08', start_time: '09:00', end_time: '17:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-2', property_id: 'prop-1', staff_id: 'st-2', staff_name: 'Sita Gurung', date: '2026-07-08', start_time: '07:00', end_time: '15:00', status: 'clocked_in', created_at: now, updated_at: now },
  { id: 'sh-3', property_id: 'prop-1', staff_id: 'st-3', staff_name: 'Hari Thapa', date: '2026-07-08', start_time: '08:00', end_time: '16:00', status: 'clocked_in', created_at: now, updated_at: now },
  { id: 'sh-4', property_id: 'prop-1', staff_id: 'st-4', staff_name: 'Gita Poudel', date: '2026-07-08', start_time: '08:00', end_time: '16:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-5', property_id: 'prop-1', staff_id: 'st-5', staff_name: 'Anil KC', date: '2026-07-08', start_time: '11:00', end_time: '19:00', status: 'clocked_in', created_at: now, updated_at: now },
  // Understaffed day for prop-1 (only 1 staff)
  { id: 'sh-9', property_id: 'prop-1', staff_id: 'st-1', staff_name: 'Ram Sharma', date: '2026-07-09', start_time: '09:00', end_time: '17:00', status: 'scheduled', created_at: now, updated_at: now },
  // Adequate coverage for prop-1
  { id: 'sh-10', property_id: 'prop-1', staff_id: 'st-2', staff_name: 'Sita Gurung', date: '2026-07-10', start_time: '07:00', end_time: '15:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-11', property_id: 'prop-1', staff_id: 'st-3', staff_name: 'Hari Thapa', date: '2026-07-10', start_time: '08:00', end_time: '16:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-12', property_id: 'prop-1', staff_id: 'st-4', staff_name: 'Gita Poudel', date: '2026-07-11', start_time: '08:00', end_time: '16:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-13', property_id: 'prop-1', staff_id: 'st-5', staff_name: 'Anil KC', date: '2026-07-11', start_time: '14:00', end_time: '22:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-14', property_id: 'prop-1', staff_id: 'st-1', staff_name: 'Ram Sharma', date: '2026-07-11', start_time: '09:00', end_time: '17:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-15', property_id: 'prop-1', staff_id: 'st-2', staff_name: 'Sita Gurung', date: '2026-07-11', start_time: '07:00', end_time: '15:00', status: 'scheduled', created_at: now, updated_at: now },
  // Kathmandu Boutique Hotel (prop-2) — thin coverage
  { id: 'sh-6', property_id: 'prop-2', staff_id: 'st-7', staff_name: 'Kiran Adhikari', date: '2026-07-08', start_time: '07:00', end_time: '15:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-7', property_id: 'prop-2', staff_id: 'st-6', staff_name: 'Deepa Rai', date: '2026-07-08', start_time: '10:00', end_time: '18:00', status: 'scheduled', created_at: now, updated_at: now },
  { id: 'sh-16', property_id: 'prop-2', staff_id: 'st-6', staff_name: 'Deepa Rai', date: '2026-07-09', start_time: '10:00', end_time: '18:00', status: 'scheduled', created_at: now, updated_at: now },
  // Pokhara Lake View Villa (prop-3) — severely understaffed
  { id: 'sh-8', property_id: 'prop-3', staff_id: 'st-8', staff_name: 'Manisha Magar', date: '2026-07-08', start_time: '09:00', end_time: '17:00', status: 'clocked_out', created_at: now, updated_at: now },
  { id: 'sh-17', property_id: 'prop-3', staff_id: 'st-8', staff_name: 'Manisha Magar', date: '2026-07-10', start_time: '09:00', end_time: '15:00', status: 'scheduled', created_at: now, updated_at: now },
];

export const mockStaffTasks: StaffTask[] = [
  { id: 'task-1', property_id: 'prop-1', assigned_to: 'st-3', assigned_name: 'Hari Thapa', title: 'Clean Room 103', description: 'Deep clean after checkout', priority: 'high', status: 'in_progress', due_date: '2026-07-08', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-2', property_id: 'prop-1', assigned_to: 'st-4', assigned_name: 'Gita Poudel', title: 'Clean Room 203', description: 'Standard cleaning', priority: 'medium', status: 'pending', due_date: '2026-07-08', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-3', property_id: 'prop-1', assigned_to: 'st-3', assigned_name: 'Hari Thapa', title: 'Restock Room 101', description: 'Add fresh towels and amenities', priority: 'low', status: 'completed', due_date: '2026-07-07', completed_at: '2026-07-07T14:00:00Z', created_at: now, updated_at: now },
  { id: 'task-4', property_id: 'prop-1', assigned_to: 'st-2', assigned_name: 'Sita Gurung', title: 'Welcome guest booking #BK-102', description: 'Prepare welcome package for arriving guests', priority: 'medium', status: 'pending', due_date: '2026-07-08', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-5', property_id: 'prop-1', assigned_to: 'st-1', assigned_name: 'Ram Sharma', title: 'Monthly revenue report', description: 'Prepare and submit monthly revenue summary', priority: 'high', status: 'in_progress', due_date: '2026-07-10', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-6', property_id: 'prop-2', assigned_to: 'st-7', assigned_name: 'Kiran Adhikari', title: 'Process check-ins', description: 'Process 3 expected check-ins today', priority: 'high', status: 'in_progress', due_date: '2026-07-08', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-7', property_id: 'prop-2', assigned_to: 'st-6', assigned_name: 'Deepa Rai', title: 'Staff schedule review', description: 'Review and approve next week schedule', priority: 'medium', status: 'pending', due_date: '2026-07-09', completed_at: null, created_at: now, updated_at: now },
  { id: 'task-8', property_id: 'prop-3', assigned_to: 'st-8', assigned_name: 'Manisha Magar', title: 'Villa A garden maintenance', description: 'Water plants and clean garden area', priority: 'medium', status: 'completed', due_date: '2026-07-07', completed_at: '2026-07-07T12:00:00Z', created_at: now, updated_at: now },
];

export const mockBookings = [
  { id: 'bk-101', property_id: 'prop-1', guest_name: 'Alice Johnson', room_name: '102', check_in: '2026-07-06', check_out: '2026-07-10', status: 'checked_in', total: 10000, created_at: now },
  { id: 'bk-102', property_id: 'prop-1', guest_name: 'Bob Smith', room_name: '202', check_in: '2026-07-07', check_out: '2026-07-09', status: 'checked_in', total: 5000, created_at: now },
  { id: 'bk-103', property_id: 'prop-1', guest_name: 'Carol Williams', room_name: '302', check_in: '2026-07-05', check_out: '2026-07-08', status: 'checked_in', total: 13500, created_at: now },
  { id: 'bk-104', property_id: 'prop-1', guest_name: 'David Brown', room_name: '402', check_in: '2026-07-01', check_out: '2026-07-10', status: 'checked_in', total: 72000, created_at: now },
  { id: 'bk-105', property_id: 'prop-1', guest_name: 'Eve Davis', room_name: '103', check_in: '2026-07-08', check_out: '2026-07-10', status: 'pending', total: 5000, created_at: now },
  { id: 'bk-106', property_id: 'prop-2', guest_name: 'Frank Miller', room_name: '102', check_in: '2026-07-05', check_out: '2026-07-08', status: 'checked_in', total: 5400, created_at: now },
  { id: 'bk-107', property_id: 'prop-2', guest_name: 'Grace Wilson', room_name: '201', check_in: '2026-07-10', check_out: '2026-07-13', status: 'pending', total: 9600, created_at: now },
  { id: 'bk-108', property_id: 'prop-3', guest_name: 'Henry Taylor', room_name: 'Villa A', check_in: '2026-07-01', check_out: '2026-07-07', status: 'checked_out', total: 72000, created_at: now },
];
