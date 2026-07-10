import { create } from 'zustand';
import type { OperationRoom, RoomStatus } from '@/types/api';

interface RoomStore {
  rooms: OperationRoom[];
  isLoading: boolean;
  setRooms: (rooms: OperationRoom[]) => void;
  updateRoomStatus: (id: string, status: RoomStatus, guestName?: string, bookingRef?: string, checkinDate?: string, checkoutDate?: string) => void;
  getRoomByNumber: (number: string) => OperationRoom | undefined;
  getAvailableRooms: () => OperationRoom[];
  getRoomsByStatus: (status: RoomStatus) => OperationRoom[];
  getRoomsByFloor: (floor: number) => OperationRoom[];
  summaryStats: () => { available: number; occupied: number; dirty: number; cleaning: number; inspected: number; maintenance: number; blocked: number; occupancy: string };
}

const INITIAL_ROOMS: OperationRoom[] = [
  { id: 'r1', room_number: '101', room_type: 'Standard', floor: 1, status: 'available', smoking: false, accessible: false },
  { id: 'r2', room_number: '102', room_type: 'Standard', floor: 1, status: 'occupied', smoking: false, accessible: false, guest_name: 'Carol Davis', booking_ref: 'BK-1003' },
  { id: 'r3', room_number: '103', room_type: 'Standard', floor: 1, status: 'dirty', smoking: false, accessible: false },
  { id: 'r4', room_number: '104', room_type: 'Standard', floor: 1, status: 'maintenance', smoking: false, accessible: false },
  { id: 'r5', room_number: '105', room_type: 'Deluxe', floor: 1, status: 'available', smoking: true, accessible: false },
  { id: 'r6', room_number: '106', room_type: 'Deluxe', floor: 1, status: 'occupied', smoking: false, accessible: false, guest_name: 'Eve Martin', booking_ref: 'BK-1005' },
  { id: 'r7', room_number: '201', room_type: 'Standard', floor: 2, status: 'occupied', smoking: false, accessible: false, guest_name: 'David Brown', booking_ref: 'BK-1004' },
  { id: 'r8', room_number: '202', room_type: 'Deluxe', floor: 2, status: 'occupied', smoking: false, accessible: false, guest_name: 'Frank Green', booking_ref: 'BK-1006' },
  { id: 'r9', room_number: '203', room_type: 'Standard', floor: 2, status: 'dirty', smoking: false, accessible: false },
  { id: 'r10', room_number: '204', room_type: 'Suite', floor: 2, status: 'occupied', smoking: true, accessible: true, guest_name: 'Grace Lee', booking_ref: 'BK-1007' },
  { id: 'r11', room_number: '205', room_type: 'Deluxe', floor: 2, status: 'available', smoking: false, accessible: false },
  { id: 'r12', room_number: '206', room_type: 'Standard', floor: 2, status: 'available', smoking: false, accessible: false },
  { id: 'r13', room_number: '301', room_type: 'Suite', floor: 3, status: 'occupied', smoking: false, accessible: false, guest_name: 'Henry Wilson', booking_ref: 'BK-1008' },
  { id: 'r14', room_number: '302', room_type: 'Suite', floor: 3, status: 'occupied', smoking: false, accessible: false, guest_name: 'Irene Taylor', booking_ref: 'BK-1009' },
  { id: 'r15', room_number: '303', room_type: 'Standard', floor: 3, status: 'maintenance', smoking: false, accessible: false },
  { id: 'r16', room_number: '304', room_type: 'Deluxe', floor: 3, status: 'available', smoking: false, accessible: false },
  { id: 'r17', room_number: '305', room_type: 'Standard', floor: 3, status: 'dirty', smoking: false, accessible: false },
  { id: 'r18', room_number: '306', room_type: 'Suite', floor: 3, status: 'occupied', smoking: false, accessible: false, guest_name: 'Jack Black', booking_ref: 'BK-1010' },
];

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: INITIAL_ROOMS,
  isLoading: false,

  setRooms: (rooms) => set({ rooms }),

  updateRoomStatus: (id, status, guestName, bookingRef, checkinDate, checkoutDate) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id ? { ...r, status, guest_name: guestName, booking_ref: bookingRef, checkin_date: checkinDate, checkout_date: checkoutDate } : r
      ),
    })),

  getRoomByNumber: (number) => get().rooms.find((r) => r.room_number === number),

  getAvailableRooms: () => get().rooms.filter((r) => r.status === 'available'),

  getRoomsByStatus: (status) => get().rooms.filter((r) => r.status === status),

  getRoomsByFloor: (floor) => get().rooms.filter((r) => r.floor === floor),

  summaryStats: () => {
    const rooms = get().rooms;
    const available = rooms.filter((r) => r.status === 'available').length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    const dirty = rooms.filter((r) => r.status === 'dirty').length;
    const cleaning = rooms.filter((r) => r.status === 'cleaning').length;
    const inspected = rooms.filter((r) => r.status === 'inspected').length;
    const maintenance = rooms.filter((r) => r.status === 'maintenance').length;
    const blocked = rooms.filter((r) => r.status === 'blocked').length;
    return {
      available, occupied, dirty, cleaning, inspected, maintenance, blocked,
      occupancy: `${occupied}/${rooms.length}`,
    };
  },
}));
