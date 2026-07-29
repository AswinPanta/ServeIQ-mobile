import { create } from 'zustand';

export interface AdminRoom {
  id: string;
  room_name: string;
  room_number: string;
  floor_number: number;
  property_id: string;
  room_type: string;
  status: 'available' | 'occupied' | 'dirty' | 'maintenance';
  bed_type?: string;
  price?: number;
}

interface RoomStore {
  rooms: AdminRoom[];
}

export const useRoomStore = create<RoomStore>(() => ({
  rooms: [],
}));
