import { create } from 'zustand';

interface ShiftStore {
  checkIns: number;
  checkOuts: number;
  revenue: number;
  incrementCheckIns: () => void;
  incrementCheckOuts: () => void;
  addRevenue: (amount: number) => void;
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  checkIns: 0,
  checkOuts: 0,
  revenue: 0,

  incrementCheckIns: () => set((s) => ({ checkIns: s.checkIns + 1 })),
  incrementCheckOuts: () => set((s) => ({ checkOuts: s.checkOuts + 1 })),
  addRevenue: (amount: number) => set((s) => ({ revenue: s.revenue + amount })),
}));
