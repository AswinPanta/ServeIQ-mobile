import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { operationsApi } from '@/lib/api/operations-api';
import { loadOpsState, persistOpsState, OPS_STORAGE_KEYS } from '@/lib/utils/ops-persistence';
import { loadBridgedGuestBookings } from '@/lib/utils';
const OPS_DEFAULT_PROPERTY_ID_KEY = '@stayeasy_default_ops_property_id';

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
  checkOut: (guestId: string, roomNumber: string) => void;
  createBooking: (data: {
    guestName: string;
    email: string;
    phone: string;
    nationality: string;
    roomType: 'Standard' | 'Deluxe' | 'Suite';
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    specialRequests: string;
    source?: BookingSource;
    company?: string;
    otaRef?: string;
    idNumber?: string;
  }) => void;
  cancelBooking: (bookingId: string, reason: string) => { refundAmount: number; penalty: number };
  timeline: TimelineEvent[];
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  getBookingTimeline: (bookingRef: string) => TimelineEvent[];
  summaryStats: { arrivals: number; inHouse: number; departures: number; occupancy: string };
  occupancySnapshot: OccupancySnapshot;
}

/** Dynamically registered property data (for properties added by hosts at runtime) */
const dynamicPropertyRooms = new Map<string, FrontDeskRoom[]>();
const dynamicPropertyBookings = new Map<string, FrontDeskBooking[]>();

/**
 * Register ops data for a newly host-created property so it shows up in
 * the front desk, housekeeping, and other ops screens.
 */
export function registerOpsProperty(propertyId: string, _propertyName: string): void {
  if (dynamicPropertyRooms.has(propertyId)) return;

  const rooms: FrontDeskRoom[] = [];
  for (let floor = 1; floor <= 2; floor++) {
    for (let room = 1; room <= 5; room++) {
      const num = `${floor}0${room}`;
      rooms.push({
        id: `room-${propertyId}-${num}`,
        room_number: num,
        floor,
        status: 'available',
        room_type: room <= 3 ? 'Standard' : 'Deluxe',
      });
    }
  }
  dynamicPropertyRooms.set(propertyId, rooms);
  dynamicPropertyBookings.set(propertyId, []);

  bookingCounters[propertyId] = 0;
  idCounters[propertyId] = 0;
}

export function updateOpsPropertyName(_propertyId: string, _newName: string): void {}

export function addOpsFrontDeskRoom(propertyId: string, roomNumber: string, floor: number): void {
  if (dynamicPropertyRooms.has(propertyId)) {
    const rooms = dynamicPropertyRooms.get(propertyId)!;
    rooms.push({
      id: `room-${propertyId}-${roomNumber}`,
      room_number: roomNumber,
      floor,
      status: 'available',
      room_type: 'Standard',
    });
    dynamicPropertyRooms.set(propertyId, rooms);
  }
}

export function removeOpsFrontDeskRoom(propertyId: string, roomNumber: string): void {
  if (dynamicPropertyRooms.has(propertyId)) {
    const rooms = dynamicPropertyRooms.get(propertyId)!;
    dynamicPropertyRooms.set(propertyId, rooms.filter(r => r.room_number !== roomNumber));
  }
}

export function removeOpsProperty(propertyId: string): void {
  dynamicPropertyRooms.delete(propertyId);
  dynamicPropertyBookings.delete(propertyId);
}

function getRoomsForProperty(propertyId: string): FrontDeskRoom[] {
  if (dynamicPropertyRooms.has(propertyId)) {
    return dynamicPropertyRooms.get(propertyId)!;
  }
  switch (propertyId) {
    case 'prop-2':
      return [
        { id: 'r101', room_number: '101', floor: 1, status: 'available', room_type: 'Standard' },
        { id: 'r102', room_number: '102', floor: 1, status: 'occupied', room_type: 'Standard', guest_name: 'Ravi Sharma', booking_ref: 'BK-2003' },
        { id: 'r103', room_number: '103', floor: 1, status: 'available', room_type: 'Standard' },
        { id: 'r104', room_number: '104', floor: 1, status: 'dirty', room_type: 'Standard' },
        { id: 'r105', room_number: '105', floor: 1, status: 'available', room_type: 'Deluxe' },
        { id: 'r201', room_number: '201', floor: 2, status: 'occupied', room_type: 'Standard', guest_name: 'Pema Sherpa', booking_ref: 'BK-2004' },
        { id: 'r202', room_number: '202', floor: 2, status: 'available', room_type: 'Deluxe' },
        { id: 'r203', room_number: '203', floor: 2, status: 'available', room_type: 'Standard' },
        { id: 'r204', room_number: '204', floor: 2, status: 'dirty', room_type: 'Standard' },
        { id: 'r205', room_number: '205', floor: 2, status: 'maintenance', room_type: 'Deluxe' },
        { id: 'r301', room_number: '301', floor: 3, status: 'available', room_type: 'Standard' },
        { id: 'r302', room_number: '302', floor: 3, status: 'available', room_type: 'Suite' },
      ];
    case 'prop-3':
      return [
        { id: 'rva', room_number: 'Villa A', floor: 1, status: 'occupied', room_type: 'Suite', guest_name: 'Henry Taylor', booking_ref: 'BK-3001' },
        { id: 'rvb', room_number: 'Villa B', floor: 1, status: 'available', room_type: 'Suite' },
        { id: 'rvc', room_number: 'Villa C', floor: 1, status: 'available', room_type: 'Suite' },
        { id: 'rvd', room_number: 'Villa D', floor: 2, status: 'dirty', room_type: 'Suite' },
        { id: 'rve', room_number: 'Villa E', floor: 2, status: 'available', room_type: 'Suite' },
        { id: 'rvf', room_number: 'Villa F', floor: 2, status: 'available', room_type: 'Suite' },
      ];
    default:
      return [
        { id: 'r1', room_number: '101', floor: 1, status: 'available', room_type: 'Standard' },
        { id: 'r2', room_number: '102', floor: 1, status: 'occupied', room_type: 'Standard', guest_name: 'Carol Davis', booking_ref: 'BK-1003' },
        { id: 'r3', room_number: '103', floor: 1, status: 'dirty', room_type: 'Standard' },
        { id: 'r4', room_number: '104', floor: 1, status: 'maintenance', room_type: 'Standard' },
        { id: 'r5', room_number: '105', floor: 1, status: 'available', room_type: 'Deluxe' },
        { id: 'r6', room_number: '106', floor: 1, status: 'occupied', room_type: 'Deluxe', guest_name: 'Eve Martin', booking_ref: 'BK-1005' },
        { id: 'r7', room_number: '201', floor: 2, status: 'occupied', room_type: 'Standard', guest_name: 'David Brown', booking_ref: 'BK-1004' },
        { id: 'r8', room_number: '202', floor: 2, status: 'occupied', room_type: 'Deluxe', guest_name: 'Frank Green', booking_ref: 'BK-1006' },
        { id: 'r9', room_number: '203', floor: 2, status: 'dirty', room_type: 'Standard' },
        { id: 'r10', room_number: '204', floor: 2, status: 'occupied', room_type: 'Suite', guest_name: 'Grace Lee', booking_ref: 'BK-1007' },
        { id: 'r11', room_number: '205', floor: 2, status: 'available', room_type: 'Deluxe' },
        { id: 'r12', room_number: '206', floor: 2, status: 'available', room_type: 'Standard' },
        { id: 'r13', room_number: '301', floor: 3, status: 'occupied', room_type: 'Suite', guest_name: 'Henry Wilson', booking_ref: 'BK-1008' },
        { id: 'r14', room_number: '302', floor: 3, status: 'occupied', room_type: 'Suite', guest_name: 'Irene Taylor', booking_ref: 'BK-1009' },
        { id: 'r15', room_number: '303', floor: 3, status: 'maintenance', room_type: 'Standard' },
        { id: 'r16', room_number: '304', floor: 3, status: 'available', room_type: 'Deluxe' },
        { id: 'r17', room_number: '305', floor: 3, status: 'dirty', room_type: 'Standard' },
        { id: 'r18', room_number: '306', floor: 3, status: 'occupied', room_type: 'Suite', guest_name: 'Jack Black', booking_ref: 'BK-1010' },
      ];
  }
}

function getBookingsForProperty(propertyId: string): FrontDeskBooking[] {
  if (dynamicPropertyBookings.has(propertyId)) {
    return dynamicPropertyBookings.get(propertyId)!;
  }
  switch (propertyId) {
    case 'prop-2':
      return [
        { id: 'b7', guest_name: 'Ravi Sharma', email: 'ravi@email.com', phone: '+977-9812345678', room_type: 'Deluxe', ref: 'BK-2003', checkin: '2026-07-05', checkout: '2026-07-08', status: 'checked_in', balance: 5000, source: 'phone' },
        { id: 'b8', guest_name: 'Pema Sherpa', email: 'pema@email.com', phone: '+977-9854321098', room_type: 'Standard', ref: 'BK-2004', checkin: '2026-07-06', checkout: '2026-07-09', status: 'checked_in', balance: 0, source: 'walk_in' },
        { id: 'b9', guest_name: 'Mingma Tamang', email: 'mingma@email.com', phone: '+977-9845678901', room_type: 'Deluxe', ref: 'BK-2005', checkin: '2026-07-10', checkout: '2026-07-12', status: 'confirmed', balance: 8999, source: 'online' },
        { id: 'b10', guest_name: 'Sunita Rai', email: 'sunita@email.com', phone: '+977-9865432109', room_type: 'Standard', ref: 'BK-2006', checkin: '2026-07-08', checkout: '2026-07-08', status: 'checked_out', balance: 0, source: 'walk_in' },
      ];
    case 'prop-3':
      return [
        { id: 'b11', guest_name: 'Henry Taylor', email: 'henry@email.com', phone: '+977-9811112233', room_type: 'Suite', ref: 'BK-3001', checkin: '2026-07-01', checkout: '2026-07-10', status: 'checked_in', balance: 12000, source: 'ota', ota_ref: 'EXP-88472' },
        { id: 'b12', guest_name: 'Anita Gurung', email: 'anita@email.com', phone: '+977-9855556677', room_type: 'Suite', ref: 'BK-3002', checkin: '2026-07-15', checkout: '2026-07-18', status: 'confirmed', balance: 17999, source: 'corporate', company: 'Gurung Industries' },
        { id: 'b13', guest_name: 'Rajesh Hamal', email: 'rajesh@email.com', phone: '+977-9844445566', room_type: 'Suite', ref: 'BK-3003', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_out', balance: 0, source: 'agent' },
      ];
    default:
      return [
        { id: 'b1', guest_name: 'Alice Johnson', email: 'alice@email.com', phone: '+977-9841234567', room_type: 'Deluxe', ref: 'BK-1001', checkin: '2026-07-04', checkout: '2026-07-07', status: 'confirmed', balance: 14997, source: 'online' },
        { id: 'b2', guest_name: 'Bob Williams', email: 'bob@email.com', phone: '+977-9847654321', room_type: 'Suite', ref: 'BK-1002', checkin: '2026-07-04', checkout: '2026-07-08', status: 'confirmed', balance: 17998, source: 'ota', ota_ref: 'BKNG-4521' },
        { id: 'b3', guest_name: 'Carol Davis', email: 'carol@email.com', phone: '+977-9851122334', room_type: 'Standard', room_number: '102', ref: 'BK-1003', checkin: '2026-07-02', checkout: '2026-07-05', status: 'checked_in', balance: 0, source: 'walk_in', vip: true },
        { id: 'b4', guest_name: 'David Brown', email: 'david@email.com', phone: '+977-9849988776', room_type: 'Deluxe', room_number: '201', ref: 'BK-1004', checkin: '2026-07-01', checkout: '2026-07-05', status: 'checked_in', balance: 5000, source: 'phone' },
        { id: 'b5', guest_name: 'Eve Martin', email: 'eve@email.com', phone: '+977-9865544332', room_type: 'Standard', room_number: '106', ref: 'BK-1005', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_in', balance: 0, source: 'online' },
        { id: 'b6', guest_name: 'David Brown (checked out)', email: 'david2@email.com', phone: '+977-9811122334', room_type: 'Deluxe', ref: 'BK-1011', checkin: '2026-07-01', checkout: '2026-07-04', status: 'checked_out', balance: 0, source: 'walk_in' },
      ];
  }
}

let bookingCounters: Record<string, number> = { 'prop-1': 11, 'prop-2': 6, 'prop-3': 3 };
function nextBookingRef(propertyId: string) {
  bookingCounters[propertyId] = (bookingCounters[propertyId] || 11) + 1;
  return `BK-${bookingCounters[propertyId]}`;
}
let idCounters: Record<string, number> = { 'prop-1': 6, 'prop-2': 10, 'prop-3': 13 };
function nextId(propertyId: string) {
  idCounters[propertyId] = (idCounters[propertyId] || 6) + 1;
  return `b${idCounters[propertyId]}`;
}
let timelineCounter = 0;

const FrontDeskContext = createContext<FrontDeskContextValue | null>(null);

export function FrontDeskProvider({ children, propertyId: propPropertyId }: { children: React.ReactNode; propertyId?: string }) {
  const activePropertyId = useRef(propPropertyId || 'prop-1');
  const [propertyId, setPropertyId] = useState<string>(propPropertyId || 'prop-1');
  const defaultPropId = propPropertyId || 'prop-1';
  const [rooms, setRooms] = useState<FrontDeskRoom[]>(() => getRoomsForProperty(defaultPropId));
  const [bookings, setBookings] = useState<FrontDeskBooking[]>(() => getBookingsForProperty(defaultPropId));
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      let pid = propPropertyId || 'prop-1';
      if (!propPropertyId) {
        const savedId = await AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY);
        if (savedId) pid = savedId;
      }
      activePropertyId.current = pid;
      setPropertyId(pid);

      const [savedRooms, savedBookings] = await Promise.all([
        loadOpsState<FrontDeskRoom[] | null>(OPS_STORAGE_KEYS.rooms(pid), null),
        loadOpsState<FrontDeskBooking[] | null>(OPS_STORAGE_KEYS.bookings(pid), null),
      ]);
      setRooms(savedRooms ?? getRoomsForProperty(pid));
      setBookings(savedBookings ?? getBookingsForProperty(pid));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    loadBridgedGuestBookings(propertyId || 'prop-1').then(bridged => {
      if (bridged.length > 0) {
        const pid = propertyId || 'prop-1';
        const newBookings: FrontDeskBooking[] = bridged.map((b, i) => ({
          id: `bridge-${Date.now()}-${i}`,
          guest_name: b.guest_name,
          email: b.email,
          phone: b.phone,
          room_type: b.room_type,
          ref: `BK-BRIDGE-${Date.now().toString(36).toUpperCase().slice(0, 6)}-${i}`,
          checkin: b.checkin,
          checkout: b.checkout,
          status: 'confirmed',
          adults: b.adults,
          children: b.children,
          balance: 0,
          special_requests: b.special_requests,
          source: 'online',
        }));
        setBookings(prev => {
          const updated = [...newBookings, ...prev];
          persistOpsState(OPS_STORAGE_KEYS.bookings(pid), updated);
          return updated;
        });
        // Add timeline events for bridged bookings
        newBookings.forEach(b => {
          addTimelineEvent({
            bookingRef: b.ref,
            type: 'created',
            description: `Online booking from ${b.guest_name}`,
            performedBy: 'Guest Portal',
          });
        });
      }
    });
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    operationsApi.getRooms(() => []).then(apiRooms => {
      if (apiRooms.length > 0) setRooms(apiRooms as any);
    });
    operationsApi.getBookings(() => []).then(apiBookings => {
      if (apiBookings.length > 0) setBookings(apiBookings as any);
    });
  }, [loaded]);

  const getRoom = useCallback((roomNumber: string) => rooms.find(r => r.room_number === roomNumber), [rooms]);

  const updateRoomStatus = useCallback((roomNumber: string, status: RoomStatus, guestName?: string, bookingRef?: string) => {
    setRooms(prev => {
      const next = prev.map(r => r.room_number === roomNumber ? { ...r, status, guest_name: guestName, booking_ref: bookingRef } : r);
      persistOpsState(OPS_STORAGE_KEYS.rooms(activePropertyId.current), next);
      return next;
    });
  }, []);

  const getBooking = useCallback((id: string) => bookings.find(b => b.id === id), [bookings]);

  const addTimelineEvent = useCallback((data: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    const event: TimelineEvent = {
      ...data,
      id: `tl-${++timelineCounter}`,
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
    operationsApi.checkIn({ booking_ref: guest.ref, room_number: roomNumber }, () => {});
    const pid = activePropertyId.current;
    setRooms(prev => {
      const next = prev.map(r =>
        r.room_number === roomNumber ? { ...r, status: 'occupied' as RoomStatus, guest_name: guest.guest_name, booking_ref: guest.ref } : r
      );
      persistOpsState(OPS_STORAGE_KEYS.rooms(pid), next);
      return next;
    });
    setBookings(prev => {
      const next = prev.map(b =>
        b.id === guest.id ? { ...b, status: 'checked_in' as BookingArrivalStatus, room_number: roomNumber } : b
      );
      persistOpsState(OPS_STORAGE_KEYS.bookings(pid), next);
      return next;
    });
    addTimelineEvent({
      bookingRef: guest.ref,
      type: 'checked_in',
      description: `${guest.guest_name} checked in to Room ${roomNumber}`,
      oldValue: 'confirmed',
      newValue: 'checked_in',
      performedBy: 'Front Desk',
    });
  }, [addTimelineEvent]);

  const checkOut = useCallback((guestId: string, roomNumber: string) => {
    const pid = activePropertyId.current;
    const booking = bookings.find(b => b.id === guestId);
    setRooms(prev => {
      const next = prev.map(r =>
        r.room_number === roomNumber ? { ...r, status: 'dirty' as RoomStatus, guest_name: undefined, booking_ref: undefined } : r
      );
      persistOpsState(OPS_STORAGE_KEYS.rooms(pid), next);
      return next;
    });
    setBookings(prev => {
      if (booking) {
        operationsApi.checkOut({ booking_ref: booking.ref, payment_method: 'cash' }, () => {});
      }
      const next = prev.map(b =>
        b.id === guestId ? { ...b, status: 'checked_out' as BookingArrivalStatus } : b
      );
      persistOpsState(OPS_STORAGE_KEYS.bookings(pid), next);
      return next;
    });
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

  const createBooking = useCallback((data: {
    guestName: string; email: string; phone: string; nationality: string;
    roomType: 'Standard' | 'Deluxe' | 'Suite';
    checkIn: string; checkOut: string; adults: number; children: number; specialRequests: string;
    source?: BookingSource; company?: string; otaRef?: string; idNumber?: string;
  }) => {
    const pid = activePropertyId.current;
    const newBooking: FrontDeskBooking = {
      id: nextId(pid),
      ref: nextBookingRef(pid),
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
      source: data.source || 'walk_in',
      company: data.company,
      ota_ref: data.otaRef,
      id_number: data.idNumber,
    };
    setBookings(prev => {
      const next = [...prev, newBooking];
      persistOpsState(OPS_STORAGE_KEYS.bookings(pid), next);
      return next;
    });
    addTimelineEvent({
      bookingRef: newBooking.ref,
      type: 'created',
      description: `Booking created for ${data.guestName} — ${data.roomType}`,
      performedBy: 'Front Desk',
    });
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

    setBookings(prev => {
      const next = prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as BookingArrivalStatus, balance: 0 } : b);
      persistOpsState(OPS_STORAGE_KEYS.bookings(pid), next);
      return next;
    });
    if (booking) {
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

  const summaryStats = useMemo(() => ({
    arrivals: bookings.filter(b => b.status === 'confirmed').length,
    inHouse: bookings.filter(b => b.status === 'checked_in').length,
    departures: bookings.filter(b => b.status === 'checked_out').length,
    occupancy: `${rooms.filter(r => r.status === 'occupied').length}/${rooms.length}`,
  }), [bookings, rooms]);

  const occupancySnapshot = useMemo(() => {
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
      occupancyRate: Math.round((occupied / total) * 100),
    };
  }, [rooms]);

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
