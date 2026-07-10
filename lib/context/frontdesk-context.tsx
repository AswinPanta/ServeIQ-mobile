import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { operationsApi } from '@/lib/api/operations-api';
import { OPS_DEFAULT_PROPERTY_ID_KEY } from './host-context';

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
}

interface FrontDeskContextValue {
  rooms: FrontDeskRoom[];
  getRoom: (roomNumber: string) => FrontDeskRoom | undefined;
  updateRoomStatus: (roomNumber: string, status: RoomStatus, guestName?: string, bookingRef?: string) => void;
  bookings: FrontDeskBooking[];
  arrivingGuests: FrontDeskBooking[];
  checkedInGuests: FrontDeskBooking[];
  getBooking: (id: string) => FrontDeskBooking | undefined;
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
  }) => void;
  summaryStats: { arrivals: number; inHouse: number; departures: number; occupancy: string };
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

  // Generate default rooms for a new property (10 rooms, 2 floors)
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

  // Initialize counters for the new property
  bookingCounters[propertyId] = 0;
  idCounters[propertyId] = 0;
}

/** Update the property name reference in ops data (called when host renames a property) */
export function updateOpsPropertyName(_propertyId: string, _newName: string): void {
  // Property name is stored in AsyncStorage via setActivePropertyId
  // and in the OperatorProfile via demoLogin. The front desk context
  // reads it from the operator profile, so no in-memory update needed here.
}

/** Add a front-desk room for an ops property (called when host adds a room) */
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

/** Remove a front-desk room from an ops property (called when host removes a room) */
export function removeOpsFrontDeskRoom(propertyId: string, roomNumber: string): void {
  if (dynamicPropertyRooms.has(propertyId)) {
    const rooms = dynamicPropertyRooms.get(propertyId)!;
    dynamicPropertyRooms.set(propertyId, rooms.filter(r => r.room_number !== roomNumber));
  }
}

/** Clean up ops data when a property is deleted */
export function removeOpsProperty(propertyId: string): void {
  dynamicPropertyRooms.delete(propertyId);
  dynamicPropertyBookings.delete(propertyId);
}

/** Per-property room data */
function getRoomsForProperty(propertyId: string): FrontDeskRoom[] {
  // Check dynamically registered properties first
  if (dynamicPropertyRooms.has(propertyId)) {
    return dynamicPropertyRooms.get(propertyId)!;
  }
  switch (propertyId) {
    case 'prop-2': // Kathmandu Boutique Hotel — boutique, 12 rooms
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
    case 'prop-3': // Pokhara Lake View Villa — small villa, 6 rooms
      return [
        { id: 'rva', room_number: 'Villa A', floor: 1, status: 'occupied', room_type: 'Suite', guest_name: 'Henry Taylor', booking_ref: 'BK-3001' },
        { id: 'rvb', room_number: 'Villa B', floor: 1, status: 'available', room_type: 'Suite' },
        { id: 'rvc', room_number: 'Villa C', floor: 1, status: 'available', room_type: 'Suite' },
        { id: 'rvd', room_number: 'Villa D', floor: 2, status: 'dirty', room_type: 'Suite' },
        { id: 'rve', room_number: 'Villa E', floor: 2, status: 'available', room_type: 'Suite' },
        { id: 'rvf', room_number: 'Villa F', floor: 2, status: 'available', room_type: 'Suite' },
      ];
    default: // prop-1 (Grand Himalaya Resort) — busy resort
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

/** Per-property booking data */
function getBookingsForProperty(propertyId: string): FrontDeskBooking[] {
  // Check dynamically registered properties first
  if (dynamicPropertyBookings.has(propertyId)) {
    return dynamicPropertyBookings.get(propertyId)!;
  }
  switch (propertyId) {
    case 'prop-2': // Kathmandu Boutique Hotel
      return [
        { id: 'b7', guest_name: 'Ravi Sharma', email: 'ravi@email.com', phone: '+977-9812345678', room_type: 'Deluxe', ref: 'BK-2003', checkin: '2026-07-05', checkout: '2026-07-08', status: 'checked_in', balance: 5000 },
        { id: 'b8', guest_name: 'Pema Sherpa', email: 'pema@email.com', phone: '+977-9854321098', room_type: 'Standard', ref: 'BK-2004', checkin: '2026-07-06', checkout: '2026-07-09', status: 'checked_in', balance: 0 },
        { id: 'b9', guest_name: 'Mingma Tamang', email: 'mingma@email.com', phone: '+977-9845678901', room_type: 'Deluxe', ref: 'BK-2005', checkin: '2026-07-10', checkout: '2026-07-12', status: 'confirmed', balance: 8999 },
        { id: 'b10', guest_name: 'Sunita Rai', email: 'sunita@email.com', phone: '+977-9865432109', room_type: 'Standard', ref: 'BK-2006', checkin: '2026-07-08', checkout: '2026-07-08', status: 'checked_out', balance: 0 },
      ];
    case 'prop-3': // Pokhara Lake View Villa
      return [
        { id: 'b11', guest_name: 'Henry Taylor', email: 'henry@email.com', phone: '+977-9811112233', room_type: 'Suite', ref: 'BK-3001', checkin: '2026-07-01', checkout: '2026-07-10', status: 'checked_in', balance: 12000 },
        { id: 'b12', guest_name: 'Anita Gurung', email: 'anita@email.com', phone: '+977-9855556677', room_type: 'Suite', ref: 'BK-3002', checkin: '2026-07-15', checkout: '2026-07-18', status: 'confirmed', balance: 17999 },
        { id: 'b13', guest_name: 'Rajesh Hamal', email: 'rajesh@email.com', phone: '+977-9844445566', room_type: 'Suite', ref: 'BK-3003', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_out', balance: 0 },
      ];
    default: // prop-1 (Grand Himalaya Resort) — busy resort
      return [
        { id: 'b1', guest_name: 'Alice Johnson', email: 'alice@email.com', phone: '+977-9841234567', room_type: 'Deluxe', ref: 'BK-1001', checkin: '2026-07-04', checkout: '2026-07-07', status: 'confirmed', balance: 14997 },
        { id: 'b2', guest_name: 'Bob Williams', email: 'bob@email.com', phone: '+977-9847654321', room_type: 'Suite', ref: 'BK-1002', checkin: '2026-07-04', checkout: '2026-07-08', status: 'confirmed', balance: 17998 },
        { id: 'b3', guest_name: 'Carol Davis', email: 'carol@email.com', phone: '+977-9851122334', room_type: 'Standard', room_number: '102', ref: 'BK-1003', checkin: '2026-07-02', checkout: '2026-07-05', status: 'checked_in', balance: 0 },
        { id: 'b4', guest_name: 'David Brown', email: 'david@email.com', phone: '+977-9849988776', room_type: 'Deluxe', room_number: '201', ref: 'BK-1004', checkin: '2026-07-01', checkout: '2026-07-05', status: 'checked_in', balance: 5000 },
        { id: 'b5', guest_name: 'Eve Martin', email: 'eve@email.com', phone: '+977-9865544332', room_type: 'Standard', room_number: '106', ref: 'BK-1005', checkin: '2026-07-03', checkout: '2026-07-05', status: 'checked_in', balance: 0 },
        { id: 'b6', guest_name: 'David Brown (checked out)', email: 'david2@email.com', phone: '+977-9811122334', room_type: 'Deluxe', ref: 'BK-1011', checkin: '2026-07-01', checkout: '2026-07-04', status: 'checked_out', balance: 0 },
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

const FrontDeskContext = createContext<FrontDeskContextValue | null>(null);

export function FrontDeskProvider({ children, propertyId: propPropertyId }: { children: React.ReactNode; propertyId?: string }) {
  const [propertyId, setPropertyId] = useState<string>(propPropertyId || 'prop-1');
  const [rooms, setRooms] = useState<FrontDeskRoom[]>(() => getRoomsForProperty(propPropertyId || 'prop-1'));
  const [bookings, setBookings] = useState<FrontDeskBooking[]>(() => getBookingsForProperty(propPropertyId || 'prop-1'));

  // If no propertyId prop provided, try reading from AsyncStorage (host's selected property)
  useEffect(() => {
    if (!propPropertyId) {
      AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY).then(savedId => {
        if (savedId && savedId !== propertyId) {
          setPropertyId(savedId);
          setRooms(getRoomsForProperty(savedId));
          setBookings(getBookingsForProperty(savedId));
        }
      });
    }
  }, []);

  useEffect(() => {
    operationsApi.getRooms(() => []).then(apiRooms => {
      if (apiRooms.length > 0) setRooms(apiRooms as any);
    });
    operationsApi.getBookings(() => []).then(apiBookings => {
      if (apiBookings.length > 0) setBookings(apiBookings as any);
    });
  }, []);

  const getRoom = useCallback((roomNumber: string) => rooms.find(r => r.room_number === roomNumber), [rooms]);

  const updateRoomStatus = useCallback((roomNumber: string, status: RoomStatus, guestName?: string, bookingRef?: string) => {
    setRooms(prev => prev.map(r => r.room_number === roomNumber ? { ...r, status, guest_name: guestName, booking_ref: bookingRef } : r));
  }, []);

  const getBooking = useCallback((id: string) => bookings.find(b => b.id === id), [bookings]);

  const checkIn = useCallback((guest: FrontDeskBooking, roomNumber: string) => {
    operationsApi.checkIn({ booking_ref: guest.ref, room_number: roomNumber }, () => {});
    setRooms(prev => prev.map(r =>
      r.room_number === roomNumber ? { ...r, status: 'occupied' as RoomStatus, guest_name: guest.guest_name, booking_ref: guest.ref } : r
    ));
    setBookings(prev => prev.map(b =>
      b.id === guest.id ? { ...b, status: 'checked_in' as BookingArrivalStatus, room_number: roomNumber } : b
    ));
  }, []);

  const checkOut = useCallback((guestId: string, roomNumber: string) => {
    setRooms(prev => prev.map(r =>
      r.room_number === roomNumber ? { ...r, status: 'dirty' as RoomStatus, guest_name: undefined, booking_ref: undefined } : r
    ));
    setBookings(prev => {
      const booking = prev.find(b => b.id === guestId);
      if (booking) {
        operationsApi.checkOut({ booking_ref: booking.ref, payment_method: 'cash' }, () => {});
      }
      return prev.map(b =>
        b.id === guestId ? { ...b, status: 'checked_out' as BookingArrivalStatus } : b
      );
    });
  }, []);

  const createBooking = useCallback((data: {
    guestName: string; email: string; phone: string; nationality: string;
    roomType: 'Standard' | 'Deluxe' | 'Suite';
    checkIn: string; checkOut: string; adults: number; children: number; specialRequests: string;
  }) => {
    const pid = propertyId;
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
    };
    setBookings(prev => [...prev, newBooking]);
  }, [propertyId]);

  const arrivingGuests = bookings.filter(b => b.status === 'confirmed');
  const checkedInGuests = bookings.filter(b => b.status === 'checked_in');

  const summaryStats = {
    arrivals: bookings.filter(b => b.status === 'confirmed').length,
    inHouse: bookings.filter(b => b.status === 'checked_in').length,
    departures: bookings.filter(b => b.status === 'checked_out').length,
    occupancy: `${rooms.filter(r => r.status === 'occupied').length}/${rooms.length}`,
  };

  return (
    <FrontDeskContext.Provider value={{
      rooms,
      getRoom,
      updateRoomStatus,
      bookings,
      arrivingGuests,
      checkedInGuests,
      getBooking,
      checkIn,
      checkOut,
      createBooking,
      summaryStats,
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
