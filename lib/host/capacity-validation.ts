import type { AdminRoom } from '@/types/api';
import { STATUS, BLUE, AMBER, PURPLE, RED, CYAN, SLATE } from '@/lib/constants/figma-tokens';

export interface CapacityResult {
  valid: boolean;
  errors: string[];
  adultsOk: boolean;
  childrenOk: boolean;
  totalOk: boolean;
}

export function validateRoomCapacity(
  room: AdminRoom | null,
  adults: number,
  children: number,
): CapacityResult {
  const errors: string[] = [];
  if (!room) {
    return { valid: false, errors: ['No room selected'], adultsOk: false, childrenOk: false, totalOk: false };
  }

  const adultsOk = adults <= room.max_adults;
  const childrenOk = children <= room.max_children;
  const totalOk = adults + children <= room.max_occupancy;

  if (!adultsOk) {
    errors.push(`Room "${room.room_name}" allows max ${room.max_adults} adults (${adults} requested)`);
  }
  if (!childrenOk) {
    errors.push(`Room "${room.room_name}" allows max ${room.max_children} children (${children} requested)`);
  }
  if (!totalOk) {
    errors.push(`Room "${room.room_name}" max occupancy is ${room.max_occupancy} guests (${adults + children} requested)`);
  }

  return {
    valid: adultsOk && childrenOk && totalOk,
    errors,
    adultsOk,
    childrenOk,
    totalOk,
  };
}

export function getRoomCapacitySummary(room: AdminRoom): string {
  const parts: string[] = [];
  parts.push(`${room.max_adults} Adult${room.max_adults !== 1 ? 's' : ''}`);
  if (room.max_children > 0) parts.push(`${room.max_children} Child${room.max_children !== 1 ? 'ren' : ''}`);
  parts.push(`${room.max_occupancy} Total`);
  return parts.join(' · ');
}

export function getRoomStatusColor(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: STATUS.activeGreen,
    OCCUPIED: BLUE[500],
    DIRTY: AMBER[500],
    CLEANING: PURPLE[500],
    MAINTENANCE: RED[500],
    INSPECTED: CYAN[500],
    BLOCKED: SLATE[500],
  };
  return map[status] || SLATE[300];
}
