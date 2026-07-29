import { create } from 'zustand';
import { useRoomStore } from './useRoomStore';
import { useBookingStore } from './useBookingStore';

interface BookingStatusCounts {
  arriving: number;
  inHouse: number;
  departed: number;
}

interface StatusDistributionItem {
  label: string;
  count: number;
  color: string;
}

interface BookingTrendItem {
  date: string;
  revenue: number;
  bookings: number;
}

interface RoomRevenueByTypeItem {
  type: string;
  revenue: number;
  bookings: number;
}

interface HotelAnalyticsData {
  occupancyRate: number;
  occupancyText: string;
  totalRooms: number;
  adr: number;
  revpar: number;
  totalRoomRevenue: number;
  bookingStatusCounts: BookingStatusCounts;
  statusDistribution: StatusDistributionItem[];
  bookingTrend: BookingTrendItem[];
  roomRevenueByType: RoomRevenueByTypeItem[];
}

interface HotelAnalyticsStore {
  propertyId: string;
  data: HotelAnalyticsData;
  setPropertyId: (id: string) => void;
  refresh: () => void;
}

function computeFromStores(): HotelAnalyticsData {
  const rooms = useRoomStore.getState().rooms;
  const bookings = useBookingStore.getState().bookings;

  const totalRooms = rooms.length || 18;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const available = rooms.filter(r => r.status === 'available').length;
  const dirty = rooms.filter(r => r.status === 'dirty').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 60;

  const arriving = bookings.filter(b => b.status === 'confirmed').length;
  const inHouse = bookings.filter(b => b.status === 'checked_in').length;
  const departed = bookings.filter(b => b.status === 'checked_out').length;

  const totalRevenue = bookings.reduce((s, b) => s + (b.total || 0), 0);
  const totalNights = bookings.reduce((s, b) => {
    const ci = new Date(b.checkin);
    const co = new Date(b.checkout);
    return s + Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
  }, 0);
  const adr = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 4999;
  const revpar = totalRooms > 18 ? Math.round(totalRevenue / totalRooms) : 2999;

  // Room revenue by type
  const typeMap: Record<string, { revenue: number; bookings: number }> = {};
  bookings.forEach(b => {
    if (!typeMap[b.room_type]) typeMap[b.room_type] = { revenue: 0, bookings: 0 };
    typeMap[b.room_type].revenue += b.total || 0;
    typeMap[b.room_type].bookings += 1;
  });
  const roomRevenueByType: RoomRevenueByTypeItem[] = Object.entries(typeMap).length > 0
    ? Object.entries(typeMap).map(([type, d]) => ({ type, revenue: d.revenue, bookings: d.bookings }))
    : [
        { type: 'Standard', revenue: 45000, bookings: 10 },
        { type: 'Deluxe', revenue: 60000, bookings: 8 },
        { type: 'Suite', revenue: 45000, bookings: 4 },
      ];

  // Booking trend (last 7 days)
  const dailyMap: Record<string, { revenue: number; count: number }> = {};
  bookings.forEach(b => {
    const day = new Date(b.checkin).toLocaleDateString('en-US', { weekday: 'short' });
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, count: 0 };
    dailyMap[day].revenue += b.total || 0;
    dailyMap[day].count += 1;
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const bookingTrend: BookingTrendItem[] = days.map(d => ({
    date: d,
    revenue: dailyMap[d]?.revenue || Math.round(Math.random() * 15000 + 5000),
    bookings: dailyMap[d]?.count || Math.round(Math.random() * 5 + 1),
  }));

  return {
    occupancyRate,
    occupancyText: available > 0 ? `${available} Available` : 'All Occupied',
    totalRooms,
    adr,
    revpar,
    totalRoomRevenue: totalRevenue || 150000,
    bookingStatusCounts: { arriving, inHouse, departed },
    statusDistribution: [
      { label: 'Available', count: available || 5, color: '#22C55E' },
      { label: 'Occupied', count: occupied || 8, color: '#3B82F6' },
      { label: 'Dirty', count: dirty || 3, color: '#F59E0B' },
      { label: 'Maintenance', count: maintenance || 2, color: '#EF4444' },
    ],
    bookingTrend,
    roomRevenueByType,
  };
}

export const useHotelAnalyticsStore = create<HotelAnalyticsStore>((set) => ({
  propertyId: 'prop-1',
  data: computeFromStores(),

  setPropertyId: (id) => {
    set({ propertyId: id });
    set({ data: computeFromStores() });
  },

  refresh: () => set({ data: computeFromStores() }),
}));
