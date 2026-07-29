import { create } from 'zustand';

export interface OperationBooking {
  ref: string;
  guest_name: string;
  email: string;
  phone: string;
  room_type: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  total: number;
  balance: number;
  room_number?: string;
  special_requests?: string;
}

interface BookingStore {
  bookings: OperationBooking[];
  createBooking: (data: {
    guestName: string; email: string; phone: string; roomType: string;
    checkin: string; checkout: string; adults: number; children: number;
    specialRequests?: string; paymentMethod?: string;
  }) => OperationBooking;
}

let bkCounter = 100;

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],

  createBooking: (data) => {
    const newBooking: OperationBooking = {
      ref: `BK-${++bkCounter}`,
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
}));
