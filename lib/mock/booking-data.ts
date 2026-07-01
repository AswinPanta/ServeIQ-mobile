// lib/mock/booking-data.ts
export interface RoomAvailability {
  roomTypeId: string;
  roomTypeName: string;
  available: number;
  total: number;
  price: number;
  currency: string;
}

export const MOCK_ROOM_AVAILABILITY: RoomAvailability[] = [
  {
    roomTypeId: 'standard',
    roomTypeName: 'Standard Room',
    available: 2,
    total: 10,
    price: 5000,
    currency: 'NPR',
  },
  {
    roomTypeId: 'deluxe',
    roomTypeName: 'Deluxe Room',
    available: 5,
    total: 8,
    price: 8000,
    currency: 'NPR',
  },
  {
    roomTypeId: 'suite',
    roomTypeName: 'Suite',
    available: 1,
    total: 4,
    price: 12000,
    currency: 'NPR',
  },
];

export interface BookingHistoryItem {
  id: string;
  hotelName: string;
  hotelCity: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: 'upcoming' | 'past' | 'cancelled';
  bookedAt: string;
  cancellationPolicy: 'free' | 'moderate' | 'strict';
  cancellationDeadline: string;
}

export const MOCK_BOOKING_HISTORY: BookingHistoryItem[] = [
  {
    id: 'BK-2026-001',
    hotelName: 'Grand Hotel Kathmandu',
    hotelCity: 'Kathmandu',
    roomType: 'Deluxe Room',
    checkIn: '2026-07-15',
    checkOut: '2026-07-18',
    nights: 3,
    totalPrice: 27120,
    status: 'upcoming',
    bookedAt: '2026-06-28',
    cancellationPolicy: 'free',
    cancellationDeadline: '2026-07-14T14:00:00',
  },
  {
    id: 'BK-2026-002',
    hotelName: 'Luxury Suites',
    hotelCity: 'Pokhara',
    roomType: 'Suite',
    checkIn: '2026-08-01',
    checkOut: '2026-08-05',
    nights: 4,
    totalPrice: 54080,
    status: 'upcoming',
    bookedAt: '2026-06-25',
    cancellationPolicy: 'moderate',
    cancellationDeadline: '2026-07-25T14:00:00',
  },
];
