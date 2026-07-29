import { create } from 'zustand';

export interface FolioCharge {
  id: string;
  description: string;
  amount: number;
  category: 'room' | 'restaurant' | 'minibar' | 'laundry' | 'service' | 'other';
  posted_at: string;
  posted_by: string;
}

export interface Folio {
  booking_ref: string;
  guest_name: string;
  room_number: string;
  charges: FolioCharge[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  settled: boolean;
}

interface FolioStore {
  folios: Record<string, Folio>;
  getFolio: (bookingRef: string) => Folio | undefined;
  createFolio: (bookingRef: string, guestName: string, roomNumber: string) => Folio;
  addCharge: (bookingRef: string, charge: Omit<FolioCharge, 'id' | 'posted_at' | 'posted_by'>) => void;
  settleFolio: (bookingRef: string, discount?: number) => void;
}

let chargeCounter = 0;

export const useFolioStore = create<FolioStore>((set, get) => ({
  folios: {},

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
        id: `chg-${++chargeCounter}`,
        posted_at: new Date().toISOString(),
        posted_by: 'Front Desk',
      };
      const updatedCharges = [...folio.charges, newCharge];
      const subtotal = updatedCharges.reduce((s, c) => s + c.amount, 0);
      const tax = Math.round(subtotal * 0.12);
      return {
        folios: {
          ...state.folios,
          [bookingRef]: {
            ...folio,
            charges: updatedCharges,
            subtotal,
            tax,
            total: subtotal + tax - folio.discount,
          },
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
