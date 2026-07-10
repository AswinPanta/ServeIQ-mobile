import { create } from 'zustand';

interface ShiftStore {
  checkIns: number;
  checkOuts: number;
  walkIns: number;
  noShows: number;
  revenue: number;
  shiftStarted: string | null;
  startShift: () => void;
  incrementCheckIns: () => void;
  incrementCheckOuts: () => void;
  incrementWalkIns: () => void;
  incrementNoShows: () => void;
  addRevenue: (amount: number) => void;
  resetShift: () => void;
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  checkIns: 0,
  checkOuts: 0,
  walkIns: 0,
  noShows: 0,
  revenue: 0,
  shiftStarted: null,

  startShift: () => set({ shiftStarted: new Date().toISOString() }),

  incrementCheckIns: () => set((state) => ({ checkIns: state.checkIns + 1 })),
  incrementCheckOuts: () => set((state) => ({ checkOuts: state.checkOuts + 1 })),
  incrementWalkIns: () => set((state) => ({ walkIns: state.walkIns + 1 })),
  incrementNoShows: () => set((state) => ({ noShows: state.noShows + 1 })),
  addRevenue: (amount) => set((state) => ({ revenue: state.revenue + amount })),
  resetShift: () => set({ checkIns: 0, checkOuts: 0, walkIns: 0, noShows: 0, revenue: 0 }),
}));
