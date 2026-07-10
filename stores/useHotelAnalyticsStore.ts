import { create } from 'zustand';

export interface HotelAnalyticsData {
  /** Occupied / Total */
  occupancyRate: number;
  occupancyText: string;
  /** Total rooms in property */
  totalRooms: number;
  /** Room status distribution */
  statusDistribution: { label: string; count: number; color: string }[];
  /** Revenue grouped by room type */
  roomRevenueByType: { type: string; revenue: number; bookings: number }[];
  /** Average Daily Rate (total revenue / occupied room nights) */
  adr: number;
  /** Revenue Per Available Room */
  revpar: number;
  /** Booking trend over days */
  bookingTrend: { date: string; bookings: number; revenue: number }[];
  /** Current in-house vs arriving vs departed counts */
  bookingStatusCounts: { arriving: number; inHouse: number; departed: number };
  /** Total estimated room revenue */
  totalRoomRevenue: number;
}

interface HotelAnalyticsStore {
  propertyId: string;
  data: HotelAnalyticsData;
  setPropertyId: (id: string) => void;
}

// ─── Per-property room data (mirrors frontdesk-context) ───

interface AnalyticsRoom {
  room_number: string;
  status: string;
  room_type: string;
}

interface AnalyticsBooking {
  guest_name: string;
  room_type: string;
  checkin: string;
  checkout: string;
  status: string;
  balance: number;
}

function getRooms(propertyId: string): AnalyticsRoom[] {
  if (propertyId === 'prop-2') {
    return [
      { room_number: '101', status: 'available', room_type: 'Standard' },
      { room_number: '102', status: 'occupied', room_type: 'Standard' },
      { room_number: '103', status: 'available', room_type: 'Standard' },
      { room_number: '104', status: 'dirty', room_type: 'Standard' },
      { room_number: '105', status: 'available', room_type: 'Deluxe' },
      { room_number: '201', status: 'occupied', room_type: 'Standard' },
      { room_number: '202', status: 'available', room_type: 'Deluxe' },
      { room_number: '203', status: 'available', room_type: 'Standard' },
      { room_number: '204', status: 'dirty', room_type: 'Standard' },
      { room_number: '205', status: 'maintenance', room_type: 'Deluxe' },
      { room_number: '301', status: 'available', room_type: 'Standard' },
      { room_number: '302', status: 'available', room_type: 'Suite' },
    ];
  }
  if (propertyId === 'prop-3') {
    return [
      { room_number: 'Villa A', status: 'occupied', room_type: 'Suite' },
      { room_number: 'Villa B', status: 'available', room_type: 'Suite' },
      { room_number: 'Villa C', status: 'available', room_type: 'Suite' },
      { room_number: 'Villa D', status: 'dirty', room_type: 'Suite' },
      { room_number: 'Villa E', status: 'available', room_type: 'Suite' },
      { room_number: 'Villa F', status: 'available', room_type: 'Suite' },
    ];
  }
  // prop-1 default
  return [
    { room_number: '101', status: 'available', room_type: 'Standard' },
    { room_number: '102', status: 'occupied', room_type: 'Standard' },
    { room_number: '103', status: 'dirty', room_type: 'Standard' },
    { room_number: '104', status: 'maintenance', room_type: 'Standard' },
    { room_number: '105', status: 'available', room_type: 'Deluxe' },
    { room_number: '106', status: 'occupied', room_type: 'Deluxe' },
    { room_number: '201', status: 'occupied', room_type: 'Standard' },
    { room_number: '202', status: 'occupied', room_type: 'Deluxe' },
    { room_number: '203', status: 'dirty', room_type: 'Standard' },
    { room_number: '204', status: 'occupied', room_type: 'Suite' },
    { room_number: '205', status: 'available', room_type: 'Deluxe' },
    { room_number: '206', status: 'available', room_type: 'Standard' },
    { room_number: '301', status: 'occupied', room_type: 'Suite' },
    { room_number: '302', status: 'occupied', room_type: 'Suite' },
    { room_number: '303', status: 'maintenance', room_type: 'Standard' },
    { room_number: '304', status: 'available', room_type: 'Deluxe' },
    { room_number: '305', status: 'dirty', room_type: 'Standard' },
    { room_number: '306', status: 'occupied', room_type: 'Suite' },
  ];
}

function getBookings(propertyId: string): AnalyticsBooking[] {
  if (propertyId === 'prop-2') {
    return [
      { guest_name: 'Ravi Sharma', room_type: 'Deluxe', checkin: '2026-07-05', checkout: '2026-07-08', status: 'checked_in', balance: 5000 },
      { guest_name: 'Pema Sherpa', room_type: 'Standard', checkin: '2026-07-06', checkout: '2026-07-09', status: 'checked_in', balance: 0 },
      { guest_name: 'Mingma Tamang', room_type: 'Deluxe', checkin: '2026-07-10', checkout: '2026-07-12', status: 'confirmed', balance: 8999 },
      { guest_name: 'Sunita Rai', room_type: 'Standard', checkin: '2026-07-08', checkout: '2026-07-08', status: 'checked_out', balance: 0 },
    ];
  }
  if (propertyId === 'prop-3') {
    return [
      { guest_name: 'Henry Taylor', room_type: 'Suite', checkin: '2026-07-01', checkout: '2026-07-10', status: 'checked_in', balance: 12000 },
      { guest_name: 'Anita Gurung', room_type: 'Suite', checkin: '2026-07-15', checkout: '2026-07-18', status: 'confirmed', balance: 17999 },
      { guest_name: 'Rajesh Hamal', room_type: 'Suite', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_out', balance: 0 },
    ];
  }
  // prop-1 default
  return [
    { guest_name: 'Alice Johnson', room_type: 'Deluxe', checkin: '2026-07-04', checkout: '2026-07-07', status: 'confirmed', balance: 14997 },
    { guest_name: 'Bob Williams', room_type: 'Suite', checkin: '2026-07-04', checkout: '2026-07-08', status: 'confirmed', balance: 17998 },
    { guest_name: 'Carol Davis', room_type: 'Standard', checkin: '2026-07-02', checkout: '2026-07-05', status: 'checked_in', balance: 0 },
    { guest_name: 'David Brown', room_type: 'Deluxe', checkin: '2026-07-01', checkout: '2026-07-05', status: 'checked_in', balance: 5000 },
    { guest_name: 'Eve Martin', room_type: 'Standard', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_in', balance: 0 },
    { guest_name: 'David Brown (checked out)', room_type: 'Deluxe', checkin: '2026-07-01', checkout: '2026-07-04', status: 'checked_out', balance: 0 },
  ];
}

const ROOM_BASE_RATES: Record<string, number> = {
  Standard: 2500,
  Deluxe: 5000,
  Suite: 9000,
};

function computeAnalytics(propertyId: string): HotelAnalyticsData {
  const rooms = getRooms(propertyId);
  const bookings = getBookings(propertyId);

  const statusMap: Record<string, { label: string; color: string }> = {
    available: { label: 'Available', color: '#22C55E' },
    occupied: { label: 'Occupied', color: '#3B82F6' },
    dirty: { label: 'Dirty', color: '#F59E0B' },
    maintenance: { label: 'Maintenance', color: '#EF4444' },
  };

  const statusDistribution = Object.entries(statusMap).map(([key, val]) => ({
    label: val.label,
    count: rooms.filter(r => r.status === key).length,
    color: val.color,
  }));

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Room revenue by type (estimated from base rates × nights)
  const revenueByType: Record<string, { revenue: number; count: number }> = {};
  bookings.forEach(b => {
    const baseRate = ROOM_BASE_RATES[b.room_type] || 3000;
    const checkIn = new Date(b.checkin);
    const checkOut = new Date(b.checkout);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400000)));
    const revenue = baseRate * nights;
    if (!revenueByType[b.room_type]) revenueByType[b.room_type] = { revenue: 0, count: 0 };
    revenueByType[b.room_type].revenue += revenue;
    revenueByType[b.room_type].count += 1;
  });
  const roomRevenueByType = Object.entries(revenueByType).map(([type, data]) => ({
    type,
    revenue: data.revenue,
    bookings: data.count,
  }));

  const totalRoomRevenue = Object.values(revenueByType).reduce((s, d) => s + d.revenue, 0);

  // ADR = total room revenue / occupied room nights
  let totalOccupiedNights = 0;
  bookings.forEach(b => {
    const checkIn = new Date(b.checkin);
    const checkOut = new Date(b.checkout);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400000)));
    totalOccupiedNights += nights;
  });
  const adr = totalOccupiedNights > 0 ? Math.round(totalRoomRevenue / totalOccupiedNights) : 0;

  // RevPAR = total room revenue / total available rooms
  const revpar = totalRooms > 0 ? Math.round(totalRoomRevenue / totalRooms) : 0;

  // Booking trend (bookings grouped by date)
  const trendMap: Record<string, { bookings: number; revenue: number }> = {};
  bookings.forEach(b => {
    const date = b.checkin;
    const baseRate = ROOM_BASE_RATES[b.room_type] || 3000;
    const checkIn = new Date(b.checkin);
    const checkOut = new Date(b.checkout);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (86400000)));
    if (!trendMap[date]) trendMap[date] = { bookings: 0, revenue: 0 };
    trendMap[date].bookings += 1;
    trendMap[date].revenue += baseRate * nights;
  });
  const bookingTrend = Object.entries(trendMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const bookingStatusCounts = {
    arriving: bookings.filter(b => b.status === 'confirmed').length,
    inHouse: bookings.filter(b => b.status === 'checked_in').length,
    departed: bookings.filter(b => b.status === 'checked_out').length,
  };

  return {
    occupancyRate,
    occupancyText: `${occupiedCount}/${totalRooms}`,
    totalRooms,
    statusDistribution,
    roomRevenueByType,
    adr,
    revpar,
    bookingTrend,
    bookingStatusCounts,
    totalRoomRevenue,
  };
}

export const useHotelAnalyticsStore = create<HotelAnalyticsStore>((set) => ({
  propertyId: 'prop-1',
  data: computeAnalytics('prop-1'),

  setPropertyId: (id) => {
    set({ propertyId: id, data: computeAnalytics(id) });
  },
}));
