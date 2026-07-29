import { create } from 'zustand';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section_id: string;
  shape?: string;
  elapsed_minutes?: number;
}

export interface Section {
  id: string;
  name: string;
  tables: string[];
}

interface TableStore {
  propertyId: string;
  tables: Table[];
  sections: Section[];
  setPropertyId: (id: string) => void;
  updateTableStatus: (id: string, status: string) => void;
}

const INITIAL_TABLES: Table[] = [
  { id: 'T1', number: '1', capacity: 2, status: 'available', section_id: 'indoor', shape: 'square' },
  { id: 'T2', number: '2', capacity: 4, status: 'occupied', section_id: 'indoor', shape: 'square', elapsed_minutes: 45 },
  { id: 'T3', number: '3', capacity: 2, status: 'reserved', section_id: 'indoor', shape: 'square' },
  { id: 'T4', number: '4', capacity: 6, status: 'available', section_id: 'indoor', shape: 'round' },
  { id: 'T5', number: '5', capacity: 4, status: 'occupied', section_id: 'outdoor', shape: 'square', elapsed_minutes: 30 },
  { id: 'T6', number: '6', capacity: 4, status: 'available', section_id: 'outdoor', shape: 'square' },
  { id: 'T7', number: '7', capacity: 2, status: 'occupied', section_id: 'outdoor', shape: 'square', elapsed_minutes: 15 },
  { id: 'T8', number: '8', capacity: 6, status: 'occupied', section_id: 'outdoor', shape: 'round', elapsed_minutes: 60 },
];

const INITIAL_SECTIONS: Section[] = [
  { id: 'indoor', name: 'Indoor', tables: ['T1', 'T2', 'T3', 'T4'] },
  { id: 'outdoor', name: 'Outdoor', tables: ['T5', 'T6', 'T7', 'T8'] },
];

export const useTableStore = create<TableStore>((set) => ({
  propertyId: 'prop-1',
  tables: INITIAL_TABLES,
  sections: INITIAL_SECTIONS,

  setPropertyId: (id) => set({ propertyId: id }),

  updateTableStatus: (id, status) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === id ? { ...t, status: status as Table['status'], elapsed_minutes: status === 'occupied' ? 0 : t.elapsed_minutes } : t
      ),
    })),
}));
