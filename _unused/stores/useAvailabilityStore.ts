/**
 * Phase 2 — Availability & Inventory
 * Live availability matrix with daily occupancy tracking,
 * room recommendations based on guest profile, and occupancy validation.
 */
import { create } from 'zustand';

export interface DailyAvailability {
  date: string;
  totalRooms: number;
  occupied: number;
  available: number;
  blocked: number;     // out-of-order / maintenance
  underMaintenance: number;
  occupancyRate: number;
}

export interface RoomRecommendation {
  roomNumber: string;
  roomType: string;
  price: number;
  score: number;       // 0-100 match score
  matches: string[];   // reasons why recommended
}

interface AvailabilityStore {
  /** Daily snapshots for the next 90 days (computed from room data) */
  dailyAvailability: DailyAvailability[];
  /** Set availability for a specific date range */
  setAvailability: (propertyId: string, rooms: { room_number: string; room_type: string; status: string; floor: number; price: number }[]) => void;
  /** Get availability for a specific date range */
  getAvailabilityForRange: (startDate: string, endDate: string) => DailyAvailability[];
  /** Recommend rooms for a guest */
  recommendRooms: (
    guestCount: number,
    preferredType?: string,
    budget?: number,
    accessibility?: boolean,
    previousRoomType?: string,
  ) => RoomRecommendation[];
  /** Validate if a booking meets occupancy rules */
  validateOccupancy: (roomType: string, adults: number, children: number) => { valid: boolean; error?: string; maxOccupancy?: number };
  /** Check room compatibility for multi-room bookings */
  getCompatibleRooms: (roomNumbers: string[]) => { compatible: boolean; adjacentRooms?: string[] };
}

const ROOM_CAPACITIES: Record<string, number> = {
  Standard: 2,
  Deluxe: 3,
  Suite: 5,
};

const MOCK_ROOMS_BY_TYPE = [
  { roomNumber: '101', roomType: 'Standard', price: 2499, floor: 1 },
  { roomNumber: '102', roomType: 'Standard', price: 2499, floor: 1 },
  { roomNumber: '103', roomType: 'Standard', price: 2499, floor: 1 },
  { roomNumber: '104', roomType: 'Standard', price: 2499, floor: 1 },
  { roomNumber: '105', roomType: 'Deluxe', price: 4999, floor: 1 },
  { roomNumber: '106', roomType: 'Deluxe', price: 4999, floor: 1 },
  { roomNumber: '201', roomType: 'Standard', price: 2999, floor: 2 },
  { roomNumber: '202', roomType: 'Deluxe', price: 5499, floor: 2 },
  { roomNumber: '203', roomType: 'Standard', price: 2999, floor: 2 },
  { roomNumber: '204', roomType: 'Suite', price: 8999, floor: 2 },
  { roomNumber: '301', roomType: 'Suite', price: 9999, floor: 3 },
  { roomNumber: '302', roomType: 'Deluxe', price: 5999, floor: 3 },
];

export const useAvailabilityStore = create<AvailabilityStore>((set, get) => ({
  dailyAvailability: [],

  setAvailability: (propertyId, rooms) => {
    const today = new Date();
    const daily: DailyAvailability[] = [];
    const totalRooms = rooms.length || MOCK_ROOMS_BY_TYPE.length;

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);

      // Simulate varying occupancy (higher on weekends)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const baseOccupied = isWeekend
        ? Math.round(totalRooms * (0.7 + Math.random() * 0.25))
        : Math.round(totalRooms * (0.4 + Math.random() * 0.35));

      const blocked = Math.round(totalRooms * 0.05); // ~5% maintenance
      const occupied = Math.min(baseOccupied, totalRooms - blocked);
      const underMaintenance = blocked;
      const available = totalRooms - occupied - underMaintenance;

      daily.push({
        date: dateStr,
        totalRooms,
        occupied,
        available,
        blocked,
        underMaintenance,
        occupancyRate: Math.round((occupied / totalRooms) * 100),
      });
    }

    set({ dailyAvailability: daily });
  },

  getAvailabilityForRange: (startDate, endDate) => {
    const { dailyAvailability } = get();
    if (dailyAvailability.length === 0) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    return dailyAvailability.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= start && dDate <= end;
    });
  },

  recommendRooms: (guestCount, preferredType, budget, accessibility, previousRoomType) => {
    const recommendations: RoomRecommendation[] = [];
    const rooms = MOCK_ROOMS_BY_TYPE;

    for (const room of rooms) {
      const capacity = ROOM_CAPACITIES[room.roomType] || 2;
      if (guestCount > capacity) continue;
      if (preferredType && room.roomType !== preferredType) continue;
      if (budget && room.price > budget) continue;

      let score = 50;
      const matches: string[] = [];

      // Exact capacity match
      if (capacity >= guestCount && capacity < guestCount + 2) {
        score += 20;
        matches.push('Perfect size for your group');
      }

      // Preferred type match
      if (room.roomType === preferredType) {
        score += 15;
        matches.push('Matches your preferred room type');
      }

      // Budget match
      if (budget && room.price <= budget * 0.9) {
        score += 10;
        matches.push('Great value for your budget');
      }

      // Returning guest preference
      if (previousRoomType && room.roomType === previousRoomType) {
        score += 10;
        matches.push('Same room type as your previous stay');
      }

      // Upsell opportunity (close to budget)
      if (budget && room.price <= budget && room.price > budget * 0.85) {
        score += 5;
        matches.push('Premium option within budget');
      }

      // Same floor adjacency
      if (recommendations.some(r => r.roomNumber.startsWith(room.roomNumber[0]))) {
        score += 5;
        if (!matches.includes('On same floor')) matches.push('On same floor');
      }

      recommendations.push({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        price: room.price,
        score: Math.min(score, 100),
        matches,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  },

  validateOccupancy: (roomType, adults, children) => {
    const maxOcc = ROOM_CAPACITIES[roomType];
    if (!maxOcc) return { valid: false, error: `Unknown room type: ${roomType}`, maxOccupancy: 2 };
    const total = adults + children;
    if (total > maxOcc) {
      return {
        valid: false,
        error: `Maximum occupancy for ${roomType} is ${maxOcc} guests (${adults} adults + ${children} children = ${total})`,
        maxOccupancy: maxOcc,
      };
    }
    return { valid: true, maxOccupancy: maxOcc };
  },

  getCompatibleRooms: (roomNumbers) => {
    if (roomNumbers.length < 2) return { compatible: true };
    // Check if rooms are on the same floor or adjacent
    const floors = roomNumbers.map(r => parseInt(r.replace(/\D/g, '').charAt(0), 10) || 1);
    const sameFloor = floors.every(f => f === floors[0]);
    // Suggest adjacent room numbers on same floor
    const nums = roomNumbers.map(r => parseInt(r.replace(/\D/g, ''), 10) || 0).sort((a, b) => a - b);
    const adjacent = nums.slice(0, -1).map((n, i) => nums[i + 1] - n <= 1);
    const allAdjacent = adjacent.every(Boolean);

    return {
      compatible: sameFloor && allAdjacent,
      adjacentRooms: sameFloor ? roomNumbers : undefined,
    };
  },
}));
