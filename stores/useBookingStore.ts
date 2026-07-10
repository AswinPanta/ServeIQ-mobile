import { create } from 'zustand';
import type { OperationBooking, BookingStatus } from '@/types/api';

interface BookingStore {
  bookings: OperationBooking[];
  isLoading: boolean;
  setBookings: (bookings: OperationBooking[]) => void;
  createBooking: (data: {
    guestName: string; email: string; phone: string; roomType: string;
    checkin: string; checkout: string; adults: number; children: number; specialRequests?: string;
  }) => OperationBooking;
  checkIn: (bookingRef: string, roomNumber: string) => void;
  checkOut: (bookingRef: string) => void;
  getBookingByRef: (ref: string) => OperationBooking | undefined;
  getArrivingGuests: () => OperationBooking[];
  getCheckedInGuests: () => OperationBooking[];
  getDepartures: () => OperationBooking[];
  summaryStats: () => { arriving: number; inHouse: number; departures: number; total: number };
}

let bkCounter = 11;
function nextRef() { return `BK-${++bkCounter}`; }

const INITIAL_BOOKINGS: OperationBooking[] = [
  { ref: 'BK-1001', guest_name: 'Alice Johnson', email: 'alice@email.com', phone: '+977-9841234567', room_type: 'Deluxe', checkin: '2026-07-04', checkout: '2026-07-07', adults: 2, children: 0, status: 'confirmed', total: 14997, balance: 14997 },
  { ref: 'BK-1002', guest_name: 'Bob Williams', email: 'bob@email.com', phone: '+977-9847654321', room_type: 'Suite', checkin: '2026-07-04', checkout: '2026-07-08', adults: 2, children: 1, status: 'confirmed', total: 35996, balance: 17998 },
  { ref: 'BK-1003', guest_name: 'Carol Davis', email: 'carol@email.com', phone: '+977-9851122334', room_type: 'Standard', room_number: '102', checkin: '2026-07-02', checkout: '2026-07-05', adults: 1, children: 0, status: 'checked_in', total: 7497, balance: 0 },
  { ref: 'BK-1004', guest_name: 'David Brown', email: 'david@email.com', phone: '+977-9849988776', room_type: 'Deluxe', room_number: '201', checkin: '2026-07-01', checkout: '2026-07-05', adults: 2, children: 2, status: 'checked_in', total: 19996, balance: 5000 },
  { ref: 'BK-1005', guest_name: 'Eve Martin', email: 'eve@email.com', phone: '+977-9865544332', room_type: 'Standard', room_number: '106', checkin: '2026-07-03', checkout: '2026-07-05', adults: 1, children: 0, status: 'checked_in', total: 4998, balance: 0 },
  { ref: 'BK-1006', guest_name: 'Frank Green', email: 'frank@email.com', phone: '+977-9856677889', room_type: 'Deluxe', room_number: '202', checkin: '2026-07-03', checkout: '2026-07-06', adults: 2, children: 0, status: 'checked_in', total: 14997, balance: 7498 },
  { ref: 'BK-1007', guest_name: 'Grace Lee', email: 'grace@email.com', phone: '+977-9812345678', room_type: 'Suite', room_number: '204', checkin: '2026-07-02', checkout: '2026-07-06', adults: 2, children: 1, status: 'checked_in', total: 23996, balance: 11998 },
  { ref: 'BK-1008', guest_name: 'Henry Wilson', email: 'henry@email.com', phone: '+977-9845678912', room_type: 'Suite', room_number: '301', checkin: '2026-06-30', checkout: '2026-07-05', adults: 2, children: 0, status: 'checked_in', total: 29995, balance: 0 },
  { ref: 'BK-1009', guest_name: 'Irene Taylor', email: 'irene@email.com', phone: '+977-9856789123', room_type: 'Suite', room_number: '302', checkin: '2026-06-29', checkout: '2026-07-04', adults: 1, children: 0, status: 'checked_in', total: 17998, balance: 0 },
  { ref: 'BK-1010', guest_name: 'Jack Black', email: 'jack@email.com', phone: '+977-9867891234', room_type: 'Suite', room_number: '306', checkin: '2026-06-28', checkout: '2026-07-04', adults: 2, children: 2, status: 'checked_in', total: 35996, balance: 5999 },
  { ref: 'BK-1011', guest_name: 'David Brown', email: 'david2@email.com', phone: '+977-9811122334', room_type: 'Deluxe', checkin: '2026-07-01', checkout: '2026-07-04', adults: 1, children: 0, status: 'checked_out', total: 11998, balance: 0 },
];

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: INITIAL_BOOKINGS,
  isLoading: false,

  setBookings: (bookings) => set({ bookings }),

  createBooking: (data) => {
    const newBooking: OperationBooking = {
      ref: nextRef(),
      guest_name: data.guestName,
      email: data.email,
      phone: data.phone,
      room_type: data.roomType,
      checkin: data.checkin,
      checkout: data.checkout,
      adults: data.adults,
      children: data.children,
      status: 'confirmed',
      total: 0,
      balance: 0,
      special_requests: data.specialRequests,
    };
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },

  checkIn: (bookingRef, roomNumber) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.ref === bookingRef ? { ...b, status: 'checked_in' as BookingStatus, room_number: roomNumber } : b
      ),
    })),

  checkOut: (bookingRef) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.ref === bookingRef ? { ...b, status: 'checked_out' as BookingStatus } : b
      ),
    })),

  getBookingByRef: (ref) => get().bookings.find((b) => b.ref === ref),

  getArrivingGuests: () => get().bookings.filter((b) => b.status === 'confirmed'),

  getCheckedInGuests: () => get().bookings.filter((b) => b.status === 'checked_in'),

  getDepartures: () => get().bookings.filter((b) => b.status === 'checked_out'),

  summaryStats: () => {
    const bookings = get().bookings;
    return {
      arriving: bookings.filter((b) => b.status === 'confirmed').length,
      inHouse: bookings.filter((b) => b.status === 'checked_in').length,
      departures: bookings.filter((b) => b.status === 'checked_out').length,
      total: bookings.length,
    };
  },
}));
