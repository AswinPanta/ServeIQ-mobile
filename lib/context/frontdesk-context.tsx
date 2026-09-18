import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hostApi, staffApi } from '@/lib/api/host-api';
import type { AdminRoom, FrontDeskBookingResponse, BackendRoomCalendarResponse } from '@/types/api';
const OPS_DEFAULT_PROPERTY_ID_KEY = '@serveiq_default_ops_property_id';

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

export interface FrontDeskRoom {
  id: string;
  room_number: string;
  floor: number;
  status: RoomStatus;
  room_type?: string;
  guest_name?: string;
  booking_ref?: string;
}

export type BookingArrivalStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export type BookingSource = 'walk_in' | 'phone' | 'online' | 'ota' | 'corporate' | 'agent';

export interface FrontDeskBooking {
  id: string;
  guest_name: string;
  email: string;
  phone?: string;
  room_type: 'Standard' | 'Deluxe' | 'Suite';
  room_number?: string;
  ref: string;
  checkin: string;
  checkout: string;
  status: BookingArrivalStatus;
  adults?: number;
  children?: number;
  balance?: number;
  special_requests?: string;
  source?: BookingSource;
  vip?: boolean;
  company?: string;
  ota_ref?: string;
  id_number?: string;
}

export interface TimelineEvent {
  id: string;
  bookingRef: string;
  type: 'created' | 'modified' | 'room_changed' | 'payment_added' | 'checked_in' | 'checked_out' | 'cancelled' | 'note_added' | 'rate_changed';
  description: string;
  oldValue?: string;
  newValue?: string;
  performedBy: string;
  timestamp: string;
}

export interface OccupancySnapshot {
  total: number;
  occupied: number;
  available: number;
  dirty: number;
  maintenance: number;
  occupancyRate: number;
}

interface FrontDeskContextValue {
  rooms: FrontDeskRoom[];
  getRoom: (roomNumber: string) => FrontDeskRoom | undefined;
  updateRoomStatus: (roomNumber: string, status: RoomStatus, guestName?: string, bookingRef?: string) => void;
  bookings: FrontDeskBooking[];
  arrivingGuests: FrontDeskBooking[];
  checkedInGuests: FrontDeskBooking[];
  departingToday: FrontDeskBooking[];
  getBooking: (id: string) => FrontDeskBooking | undefined;
  searchReservations: (query: string, filters?: { status?: string; date?: string; roomType?: string }) => FrontDeskBooking[];
  checkIn: (guest: FrontDeskBooking, roomNumber: string) => void;
  checkOut: (guestId: string, roomNumber: string, amount?: number) => void;
  createBooking: (data: {
    guestName: string;
    email: string;
    phone: string;
    nationality: string;
    roomType: 'Standard' | 'Deluxe' | 'Suite';
    roomNumber?: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    specialRequests: string;
    source?: BookingSource;
    company?: string;
    otaRef?: string;
    idNumber?: string;
    paymentMethod?: 'ONLINE' | 'ADVANCE' | 'PAY_ON_ARRIVAL';
    paymentGateway?: 'KHALTI' | 'ESEWA' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | null;
    amountPaid?: number;
  }) => Promise<FrontDeskBooking>;
  cancelBooking: (bookingId: string, reason: string) => { refundAmount: number; penalty: number };
  timeline: TimelineEvent[];
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  getBookingTimeline: (bookingRef: string) => TimelineEvent[];
  summaryStats: { arrivals: number; inHouse: number; departures: number; occupancy: string };
  occupancySnapshot: OccupancySnapshot;
  /** Server-side guest list with rich details (citizenship, VIP, etc.) */
  bookingGuestsData: FrontDeskBookingResponse[];
  /** Room calendar showing date-range occupancy per room */
  roomCalendarData: BackendRoomCalendarResponse | null;
  /** Get rooms available for a specific date range from room-calendar data */
  getAvailableRoomsForDates: (checkIn: string, checkOut: string) => string[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id: string): boolean { return UUID_RE.test(id); }

function mapBackendRoomToFD(r: AdminRoom): FrontDeskRoom {
  const statusMap: Record<string, RoomStatus> = {
    AVAILABLE: 'available', OCCUPIED: 'occupied', DIRTY: 'dirty',
    CLEANING: 'dirty', INSPECTED: 'available', MAINTENANCE: 'maintenance', BLOCKED: 'maintenance',
  };
  return {
    id: r.id,
    room_number: r.room_name,
    floor: r.floor_number,
    status: statusMap[r.status] || 'available',
    room_type: r.room_type_name || r.room_name,
  };
}

function mapFDStatusToBackend(status: RoomStatus): string {
  const map: Record<RoomStatus, string> = {
    available: 'AVAILABLE', occupied: 'OCCUPIED', dirty: 'DIRTY', maintenance: 'MAINTENANCE',
  };
  return map[status] || 'AVAILABLE';
}

const STATUS_LOWER: Record<string, BookingArrivalStatus> = {
  CONFIRMED: 'confirmed', CHECKED_IN: 'checked_in', CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled', PENDING: 'confirmed', FAILED: 'cancelled',
};
function normalizeStatus(status?: string): BookingArrivalStatus {
  const s = String(status || '').trim().toUpperCase();
  return STATUS_LOWER[s] || (String(status || '').toLowerCase() as BookingArrivalStatus) || 'confirmed';
}

/** /properties/{pid}/bookings list item → FrontDeskBooking */
function mapBackendBookingToFD(b: any): FrontDeskBooking {
  return {
    id: b.id,
    guest_name: b.guest_name || 'Guest',
    email: b.guest_email || b.email || '',
    phone: b.phone,
    room_type: (b.room_type || (b.rooms?.[0]?.room_type) || 'Standard') as FrontDeskBooking['room_type'],
    room_number: b.room_number || b.rooms?.[0]?.room_name,
    ref: b.ref_number || b.booking_number || b.ref || '',
    checkin: b.checkin_date || b.check_in || '',
    checkout: b.checkout_date || b.check_out || '',
    status: normalizeStatus(b.status),
    adults: b.number_of_adults || b.adults || 1,
    children: b.number_of_children || b.children || 0,
    balance: typeof b.amount_due === 'number' ? b.amount_due : (typeof b.total_amount === 'number' ? b.total_amount : 0),
  };
}

/** GET /staff/properties/{pid}/today/{arrivals,departures} item → FrontDeskBooking */
function mapStaffBookingToFD(b: any): FrontDeskBooking {
  return {
    id: b.booking_id || b.id,
    guest_name: b.guest?.full_name || b.guest_name || 'Guest',
    email: b.guest?.email || b.guest_email || '',
    phone: b.guest?.phone || b.phone,
    room_type: (b.rooms?.[0]?.room_type || b.room_type || 'Standard') as FrontDeskBooking['room_type'],
    room_number: b.rooms?.[0]?.room_name || b.room_number,
    ref: b.ref_number || b.booking_number || b.ref || '',
    checkin: b.checkin_date || b.check_in || '',
    checkout: b.checkout_date || b.check_out || '',
    status: normalizeStatus(b.status),
    adults: b.number_of_adults || b.adults || 1,
    children: b.number_of_children || b.children || 0,
    balance: typeof b.amount_due === 'number' ? b.amount_due : 0,
    special_requests: b.special_requests,
  };
}

const FrontDeskContext = createContext<FrontDeskContextValue | null>(null);

export function FrontDeskProvider({ children, propertyId: propPropertyId }: { children: React.ReactNode; propertyId?: string }) {
  const activePropertyId = useRef(propPropertyId || '');
  const backendRoomsRef = useRef<Map<string, AdminRoom>>(new Map());
  const [propertyId, setPropertyId] = useState<string>(propPropertyId || '');
  const [rooms, setRooms] = useState<FrontDeskRoom[]>([]);
  const [bookings, setBookings] = useState<FrontDeskBooking[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [roomSummary, setRoomSummary] = useState<{ total_rooms?: number; available_rooms?: number; occupied_rooms?: number; dirty_rooms?: number; maintenance_rooms?: number } | null>(null);
  const [fdSummary, setFdSummary] = useState<{ todays_arrivals: number; todays_departures: number; todays_checked_in: number; occupied_rooms: number; total_rooms: number; total_available_rooms: number } | null>(null);
  const [bookingGuestsData, setBookingGuestsData] = useState<FrontDeskBookingResponse[]>([]);
  const [roomCalendarData, setRoomCalendarData] = useState<BackendRoomCalendarResponse | null>(null);

  useEffect(() => {
    (async () => {
      let pid = propPropertyId || '';
      if (!propPropertyId) {
        const savedId = await AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY);
        if (savedId) pid = savedId;
      }
      activePropertyId.current = pid;
      setPropertyId(pid);
      setLoaded(true);
    })();
  }, []);

  const refreshRooms = useCallback(async (pid: string) => {
    const apiRooms: any[] = await hostApi.getRooms(pid, () => []);
    if (apiRooms.length > 0) {
      setRooms(apiRooms.map(mapBackendRoomToFD));
      backendRoomsRef.current = new Map(apiRooms.map((r: AdminRoom) => [r.room_name, r]));
    }
  }, []);

  const refreshBookings = useCallback(async (pid: string) => {
    const [propertyBookings, arrivals, departures] = await Promise.all([
      hostApi.getPropertyBookings(pid, () => []),
      staffApi.getTodayArrivals(pid, () => []),
      staffApi.getTodayDepartures(pid, () => []),
    ]);
    const byRef = new Map<string, FrontDeskBooking>();
    (propertyBookings as any[]).forEach(b => byRef.set(mapBackendBookingToFD(b).ref || b.id, mapBackendBookingToFD(b)));
    arrivals.forEach(b => byRef.set(b.ref_number || b.booking_id, mapStaffBookingToFD(b)));
    departures.forEach(b => byRef.set(b.ref_number || b.booking_id, mapStaffBookingToFD(b)));
    setBookings(Array.from(byRef.values()));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const pid = activePropertyId.current;
    if (!isValidUuid(pid)) return;
    let cancelled = false;
    Promise.all([
      refreshRooms(pid),
      refreshBookings(pid),
      hostApi.getRoomStatusSummary(pid, () => null).then((summary: any) => {
        if (!cancelled && summary) setRoomSummary(summary.data?.summary || summary.summary || summary);
      }),
      staffApi.getFrontDeskSummary(pid, () => null).then(s => { if (!cancelled && s) setFdSummary(s); }),
      staffApi.getBookingGuests(pid, { limit: 50 }, () => []).then(guests => {
        if (!cancelled && Array.isArray(guests) && guests.length > 0) setBookingGuestsData(guests);
      }),
      staffApi.getRoomCalendar(pid, {}, () => ({ start_date: '', end_date: '', rooms: [] })).then(cal => {
        if (!cancelled && cal && cal.rooms?.length > 0) setRoomCalendarData(cal);
      }),
    ]);
    return () => { cancelled = true; };
  }, [loaded, refreshRooms, refreshBookings]);

  const getRoom = useCallback((roomNumber: string) => rooms.find(r => r.room_number === roomNumber), [rooms]);

  const updateRoomStatus = useCallback((roomNumber: string, status: RoomStatus, guestName?: string, bookingRef?: string) => {
    setRooms(prev => prev.map(r => r.room_number === roomNumber ? { ...r, status, guest_name: guestName, booking_ref: bookingRef } : r));
    const pid = activePropertyId.current;
    if (isValidUuid(pid)) {
      const backendRoom = backendRoomsRef.current.get(roomNumber);
      if (backendRoom) {
        hostApi.updateRoom(pid, backendRoom.id, { status: mapFDStatusToBackend(status) as any }, () => backendRoom);
      }
    }
  }, []);

  const getBooking = useCallback((id: string) => bookings.find(b => b.id === id), [bookings]);

  const addTimelineEvent = useCallback((data: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    const event: TimelineEvent = {
      ...data,
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setTimeline(prev => [event, ...prev]);
  }, []);

  const getBookingTimeline = useCallback((bookingRef: string) => {
    return timeline.filter(e => e.bookingRef === bookingRef);
  }, [timeline]);

  const searchReservations = useCallback((query: string, filters?: { status?: string; date?: string; roomType?: string }) => {
    if (!query.trim() && !filters) return [];
    const q = query.toLowerCase().trim();
    let results = bookings;
    if (q) {
      results = bookings.filter(b =>
        b.guest_name.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.phone && b.phone.includes(q)) ||
        (b.room_number && b.room_number.includes(q)) ||
        (b.company && b.company.toLowerCase().includes(q)) ||
        (b.ota_ref && b.ota_ref.toLowerCase().includes(q)) ||
        b.checkin.includes(q) ||
        b.checkout.includes(q) ||
        (b.id_number && b.id_number.includes(q))
      );
    }
    if (filters?.status) {
      results = results.filter(b => b.status === filters.status);
    }
    if (filters?.date) {
      results = results.filter(b => b.checkin === filters.date || b.checkout === filters.date);
    }
    if (filters?.roomType) {
      results = results.filter(b => b.room_type.toLowerCase() === filters.roomType!.toLowerCase());
    }
    return results;
  }, [bookings]);

  const checkIn = useCallback((guest: FrontDeskBooking, roomNumber: string) => {
    const pid = activePropertyId.current;
    if (isValidUuid(pid)) {
      const backendRoom = backendRoomsRef.current.get(roomNumber);
      if (backendRoom) {
        hostApi.updateRoom(pid, backendRoom.id, { status: 'OCCUPIED' as any }, () => backendRoom);
      }
      staffApi.checkIn(guest.ref, {}, () => null);
    }
    setRooms(prev => prev.map(r =>
      r.room_number === roomNumber ? { ...r, status: 'occupied' as RoomStatus, guest_name: guest.guest_name, booking_ref: guest.ref } : r
    ));
    setBookings(prev => prev.map(b =>
      b.id === guest.id ? { ...b, status: 'checked_in' as BookingArrivalStatus, room_number: roomNumber } : b
    ));
    addTimelineEvent({
      bookingRef: guest.ref,
      type: 'checked_in',
      description: `${guest.guest_name} checked in to Room ${roomNumber}`,
      oldValue: 'confirmed',
      newValue: 'checked_in',
      performedBy: 'Front Desk',
    });
  }, [addTimelineEvent]);

  const checkOut = useCallback((guestId: string, roomNumber: string, amount?: number) => {
    const pid = activePropertyId.current;
    const booking = bookings.find(b => b.id === guestId);
    if (isValidUuid(pid)) {
      const backendRoom = backendRoomsRef.current.get(roomNumber);
      if (backendRoom) {
        hostApi.updateRoom(pid, backendRoom.id, { status: 'DIRTY' as any }, () => backendRoom);
      }
      if (booking) {
        staffApi.checkOut(booking.ref, { amount: amount ?? 0 }, () => null);
      }
    }
    setRooms(prev => prev.map(r =>
      r.room_number === roomNumber ? { ...r, status: 'dirty' as RoomStatus, guest_name: undefined, booking_ref: undefined } : r
    ));
    setBookings(prev => prev.map(b =>
      b.id === guestId ? { ...b, status: 'checked_out' as BookingArrivalStatus } : b
    ));
    if (booking) {
      addTimelineEvent({
        bookingRef: booking.ref,
        type: 'checked_out',
        description: `${booking.guest_name} checked out from Room ${roomNumber}`,
        oldValue: 'checked_in',
        newValue: 'checked_out',
        performedBy: 'Front Desk',
      });
    }
  }, [bookings, addTimelineEvent]);

  const createBooking = useCallback(async (data: {
    guestName: string; email: string; phone: string; nationality: string;
    roomType: 'Standard' | 'Deluxe' | 'Suite'; roomNumber?: string;
    checkIn: string; checkOut: string; adults: number; children: number; specialRequests: string;
    source?: BookingSource; company?: string; otaRef?: string; idNumber?: string;
    /** PAY_ON_ARRIVAL (default) confirms immediately; ADVANCE requires paymentGateway. */
    paymentMethod?: 'ONLINE' | 'ADVANCE' | 'PAY_ON_ARRIVAL';
    paymentGateway?: 'KHALTI' | 'ESEWA' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | null;
    /** Cash/card collected at the desk right now — recorded on the booking. */
    amountPaid?: number;
  }) => {
    const pid = activePropertyId.current;
    const roomSource: BookingSource = data.source || 'walk_in';
    const newBooking: FrontDeskBooking = {
      id: `fd-${Date.now()}`,
      ref: `BK-FD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      guest_name: data.guestName,
      email: data.email,
      phone: data.phone,
      room_type: data.roomType,
      checkin: data.checkIn,
      checkout: data.checkOut,
      status: 'confirmed',
      adults: data.adults,
      children: data.children,
      balance: 0,
      special_requests: data.specialRequests,
      source: roomSource,
      company: data.company,
      ota_ref: data.otaRef,
      id_number: data.idNumber,
    };
    setBookings(prev => [...prev, newBooking]);
    if (isValidUuid(pid)) {
      // Backend room_ids are required UUIDs (min 1) — a local-only room number
      // can't be booked server-side, so surface that instead of a silent 422.
      const backendRoom = data.roomNumber ? backendRoomsRef.current.get(data.roomNumber) : undefined;
      if (!backendRoom) {
        throw new Error(
          `Room "${data.roomNumber}" isn't synced to the server yet. It can't be booked until the room list is refreshed.`
        );
      }
      const created = await staffApi.createWalkinBooking({
        idempotency_key: `fd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        property_id: pid,
        room_ids: [backendRoom.id],
        check_in: data.checkIn,
        check_out: data.checkOut,
        adults: data.adults,
        children: data.children || 0,
        guest_full_name: data.guestName,
        guest_email: data.email,
        guest_phone: data.phone || undefined,
        guest_nationality: data.nationality || undefined,
        payment_method: data.paymentMethod || 'PAY_ON_ARRIVAL',
        payment_gateway: data.paymentGateway ?? null,
        amount_paid: data.amountPaid ?? 0,
        special_requests: data.specialRequests || undefined,
      }, () => null);
      // Adopt the server's authoritative ref so check-in/out and folio
      // lookups hit the same booking the backend created.
      if (created?.ref_number && created.ref_number !== newBooking.ref) {
        newBooking.ref = created.ref_number;
        setBookings(prev => prev.map(b => b.id === newBooking.id ? { ...b, ref: created.ref_number } : b));
      }
    }
    addTimelineEvent({
      bookingRef: newBooking.ref,
      type: 'created',
      description: `Booking created for ${data.guestName} — ${data.roomType}`,
      performedBy: 'Front Desk',
    });
    return newBooking;
  }, [addTimelineEvent]);

  const cancelBooking = useCallback((bookingId: string, reason: string) => {
    const pid = activePropertyId.current;
    const booking = bookings.find(b => b.id === bookingId);
    const now = new Date();
    const checkin = booking ? new Date(booking.checkin) : now;
    const hoursUntilCheckIn = (checkin.getTime() - now.getTime()) / (1000 * 60 * 60);
    let refundAmount = 0;
    let penalty = 0;

    if (hoursUntilCheckIn >= 48) {
      refundAmount = booking?.balance || 0;
      penalty = 0;
    } else if (hoursUntilCheckIn >= 24) {
      refundAmount = Math.round((booking?.balance || 0) * 0.5);
      penalty = Math.round((booking?.balance || 0) * 0.5);
    } else if (hoursUntilCheckIn >= 12) {
      refundAmount = Math.round((booking?.balance || 0) * 0.25);
      penalty = Math.round((booking?.balance || 0) * 0.75);
    } else {
      refundAmount = 0;
      penalty = booking?.balance || 0;
    }

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as BookingArrivalStatus, balance: 0 } : b));
    if (booking && isValidUuid(pid)) {
      staffApi.cancelBooking(booking.ref, { reason }, () => null);
      addTimelineEvent({
        bookingRef: booking.ref,
        type: 'cancelled',
        description: `Booking cancelled: ${reason} — Refund: NPR ${refundAmount}`,
        performedBy: 'Front Desk',
      });
    }
    return { refundAmount, penalty };
  }, [bookings, addTimelineEvent]);

  const arrivingGuests = useMemo(() => bookings.filter(b => b.status === 'confirmed'), [bookings]);
  const checkedInGuests = useMemo(() => bookings.filter(b => b.status === 'checked_in'), [bookings]);
  const departingToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bookings.filter(b => b.status === 'checked_in' && b.checkout === today);
  }, [bookings]);

  const summaryStats = useMemo(() => {
    if (fdSummary) {
      return {
        arrivals: fdSummary.todays_arrivals,
        inHouse: fdSummary.occupied_rooms,
        departures: fdSummary.todays_departures,
        occupancy: `${fdSummary.total_available_rooms}/${fdSummary.total_rooms}`,
      };
    }
    return {
      arrivals: bookings.filter(b => b.status === 'confirmed').length,
      inHouse: bookings.filter(b => b.status === 'checked_in').length,
      departures: bookings.filter(b => b.status === 'checked_out').length,
      occupancy: `${rooms.filter(r => r.status === 'occupied').length}/${rooms.length}`,
    };
  }, [bookings, rooms, fdSummary]);

  const occupancySnapshot = useMemo(() => {
    if (roomSummary) {
      const total = roomSummary.total_rooms ?? rooms.length;
      const occupied = roomSummary.occupied_rooms ?? 0;
      return {
        total,
        occupied,
        available: roomSummary.available_rooms ?? Math.max(0, total - occupied - (roomSummary.dirty_rooms || 0) - (roomSummary.maintenance_rooms || 0)),
        dirty: roomSummary.dirty_rooms ?? 0,
        maintenance: roomSummary.maintenance_rooms ?? 0,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    }
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;
    const dirty = rooms.filter(r => r.status === 'dirty').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;
    return {
      total,
      occupied,
      available,
      dirty,
      maintenance,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }, [rooms, roomSummary]);

  /** Returns room_names that have NO overlapping booking for the given date range. */
  const getAvailableRoomsForDates = useCallback((checkIn: string, checkOut: string): string[] => {
    if (!roomCalendarData?.rooms) return [];
    const inDate = new Date(checkIn).getTime();
    const outDate = new Date(checkOut).getTime();
    return roomCalendarData.rooms
      .filter(room => {
        if (!room.bookings || room.bookings.length === 0) return true;
        return room.bookings.every(b => {
          const bOut = new Date(b.check_out).getTime();
          const bIn = new Date(b.check_in).getTime();
          return outDate <= bIn || inDate >= bOut;
        });
      })
      .map(room => room.room_name);
  }, [roomCalendarData]);

  return (
    <FrontDeskContext.Provider value={{
      rooms,
      getRoom,
      updateRoomStatus,
      bookings,
      arrivingGuests,
      checkedInGuests,
      departingToday,
      getBooking,
      searchReservations,
      checkIn,
      checkOut,
      createBooking,
      cancelBooking,
      timeline,
      addTimelineEvent,
      getBookingTimeline,
      summaryStats,
      occupancySnapshot,
      bookingGuestsData,
      roomCalendarData,
      getAvailableRoomsForDates,
    }}>
      {children}
    </FrontDeskContext.Provider>
  );
}

export function useFrontDesk() {
  const ctx = useContext(FrontDeskContext);
  if (!ctx) throw new Error('useFrontDesk must be used within FrontDeskProvider');
  return ctx;
}