import { create } from 'zustand';
import type { Folio, FolioCharge } from '@/types/api';

interface FolioStore {
  folios: Record<string, Folio>;
  getFolio: (bookingRef: string) => Folio | undefined;
  createFolio: (bookingRef: string, guestName: string, roomNumber: string) => Folio;
  addCharge: (bookingRef: string, charge: Omit<FolioCharge, 'id' | 'posted_at' | 'posted_by'>) => void;
  settleFolio: (bookingRef: string, discount?: number) => void;
}

let chargeCounter = 0;
function nextChargeId() { return `chg-${++chargeCounter}`; }

export const useFolioStore = create<FolioStore>((set, get) => ({
  folios: {
    'BK-1003': {
      booking_ref: 'BK-1003',
      guest_name: 'Carol Davis',
      room_number: '102',
      charges: [
        { id: 'chg-1', description: 'Room Charge (3 nights)', amount: 7497, category: 'room', posted_at: '2026-07-02T14:00:00Z', posted_by: 'System' },
        { id: 'chg-2', description: 'Restaurant - Dinner', amount: 2150, category: 'restaurant', posted_at: '2026-07-02T20:30:00Z', posted_by: 'POS' },
        { id: 'chg-3', description: 'Minibar', amount: 800, category: 'minibar', posted_at: '2026-07-03T09:15:00Z', posted_by: 'Front Desk' },
      ],
      subtotal: 10447,
      tax: 1254,
      discount: 0,
      total: 11701,
      settled: false,
    },
    'BK-1005': {
      booking_ref: 'BK-1005',
      guest_name: 'Eve Martin',
      room_number: '106',
      charges: [
        { id: 'chg-4', description: 'Room Charge (2 nights)', amount: 4998, category: 'room', posted_at: '2026-07-03T14:00:00Z', posted_by: 'System' },
        { id: 'chg-5', description: 'Laundry Service', amount: 600, category: 'laundry', posted_at: '2026-07-04T10:00:00Z', posted_by: 'Front Desk' },
      ],
      subtotal: 5598,
      tax: 672,
      discount: 0,
      total: 6270,
      settled: false,
    },
    'BK-1004': {
      booking_ref: 'BK-1004',
      guest_name: 'David Brown',
      room_number: '201',
      charges: [
        { id: 'chg-6', description: 'Room Charge (4 nights)', amount: 19996, category: 'room', posted_at: '2026-07-01T14:00:00Z', posted_by: 'System' },
        { id: 'chg-7', description: 'Restaurant - Breakfast x4', amount: 1600, category: 'restaurant', posted_at: '2026-07-02T08:30:00Z', posted_by: 'POS' },
        { id: 'chg-8', description: 'Restaurant - Lunch', amount: 1200, category: 'restaurant', posted_at: '2026-07-03T13:00:00Z', posted_by: 'POS' },
        { id: 'chg-9', description: 'Service Charge', amount: 500, category: 'service', posted_at: '2026-07-04T11:00:00Z', posted_by: 'Front Desk' },
      ],
      subtotal: 23296,
      tax: 2796,
      discount: 0,
      total: 26092,
      settled: false,
    },
  },

  getFolio: (bookingRef) => get().folios[bookingRef],

  createFolio: (bookingRef, guestName, roomNumber) => {
    const folio: Folio = {
      booking_ref: bookingRef,
      guest_name: guestName,
      room_number: roomNumber,
      charges: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      settled: false,
    };
    set((state) => ({ folios: { ...state.folios, [bookingRef]: folio } }));
    return folio;
  },

  addCharge: (bookingRef, charge) =>
    set((state) => {
      const folio = state.folios[bookingRef];
      if (!folio) return state;
      const newCharge: FolioCharge = {
        ...charge,
        id: nextChargeId(),
        posted_at: new Date().toISOString(),
        posted_by: 'Front Desk',
      };
      const updatedCharges = [...folio.charges, newCharge];
      const subtotal = updatedCharges.reduce((s, c) => s + c.amount, 0);
      const tax = Math.round(subtotal * 0.12);
      return {
        folios: {
          ...state.folios,
          [bookingRef]: { ...folio, charges: updatedCharges, subtotal, tax, total: subtotal + tax - folio.discount },
        },
      };
    }),

  settleFolio: (bookingRef, discount = 0) =>
    set((state) => {
      const folio = state.folios[bookingRef];
      if (!folio) return state;
      return {
        folios: {
          ...state.folios,
          [bookingRef]: { ...folio, discount, total: folio.subtotal + folio.tax - discount, settled: true },
        },
      };
    }),
}));
