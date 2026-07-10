import { create } from 'zustand';
import type { TableItem, TableSection } from '@/types/api';

interface TableStore {
  propertyId: string;
  sections: TableSection[];
  tables: TableItem[];
  setPropertyId: (id: string) => void;
  setTables: (tables: TableItem[]) => void;
  updateTableStatus: (id: string, status: TableItem['status'], waiterName?: string, guestCount?: number) => void;
  getTable: (id: string) => TableItem | undefined;
  getSectionTables: (sectionId: string) => TableItem[];
  startTurnTimer: (tableId: string) => void;
  summaryStats: () => { total: number; free: number; occupied: number; reserved: number; cleaning: number };
}

const PROP_1_SECTIONS: TableSection[] = [
  { id: 'sec1', name: 'Indoor', floor: 1 },
  { id: 'sec2', name: 'Outdoor', floor: 1 },
];

const PROP_1_TABLES: TableItem[] = [
  { id: 't1', number: 1, capacity: 2, shape: 'round', status: 'available', section_id: 'sec1' },
  { id: 't2', number: 2, capacity: 4, shape: 'square', status: 'occupied', section_id: 'sec1', waiter_name: 'Rajesh', guest_count: 3, elapsed_minutes: 25 },
  { id: 't3', number: 3, capacity: 4, shape: 'square', status: 'available', section_id: 'sec1' },
  { id: 't4', number: 4, capacity: 6, shape: 'rectangle', status: 'reserved', section_id: 'sec1', guest_count: 5 },
  { id: 't5', number: 5, capacity: 2, shape: 'round', status: 'occupied', section_id: 'sec2', waiter_name: 'Anita', guest_count: 2, elapsed_minutes: 45 },
  { id: 't6', number: 6, capacity: 4, shape: 'square', status: 'available', section_id: 'sec2' },
  { id: 't7', number: 7, capacity: 4, shape: 'square', status: 'occupied', section_id: 'sec2', waiter_name: 'Rajesh', guest_count: 4, elapsed_minutes: 15 },
  { id: 't8', number: 8, capacity: 8, shape: 'rectangle', status: 'available', section_id: 'sec2' },
];

const PROP_2_SECTIONS: TableSection[] = [
  { id: 'sec1', name: 'Main Hall', floor: 1 },
];

const PROP_2_TABLES: TableItem[] = [
  { id: 'bt1', number: 1, capacity: 2, shape: 'round', status: 'available', section_id: 'sec1' },
  { id: 'bt2', number: 2, capacity: 2, shape: 'round', status: 'occupied', section_id: 'sec1', waiter_name: 'Rita', guest_count: 2, elapsed_minutes: 30 },
  { id: 'bt3', number: 3, capacity: 4, shape: 'square', status: 'available', section_id: 'sec1' },
  { id: 'bt4', number: 4, capacity: 4, shape: 'square', status: 'available', section_id: 'sec1' },
];

const PROP_3_SECTIONS: TableSection[] = [
  { id: 'sec1', name: 'Terrace', floor: 1 },
];

const PROP_3_TABLES: TableItem[] = [
  { id: 'vt1', number: 1, capacity: 4, shape: 'square', status: 'available', section_id: 'sec1' },
  { id: 'vt2', number: 2, capacity: 2, shape: 'round', status: 'available', section_id: 'sec1' },
];

function getTablesForProperty(propertyId: string): { sections: TableSection[]; tables: TableItem[] } {
  switch (propertyId) {
    case 'prop-2':
      return { sections: PROP_2_SECTIONS, tables: PROP_2_TABLES };
    case 'prop-3':
      return { sections: PROP_3_SECTIONS, tables: PROP_3_TABLES };
    default:
      return { sections: PROP_1_SECTIONS, tables: PROP_1_TABLES };
  }
}

export const useTableStore = create<TableStore>((set, get) => ({
  propertyId: 'prop-1',
  sections: PROP_1_SECTIONS,
  tables: PROP_1_TABLES,

  setPropertyId: (id) => {
    if (id === get().propertyId) return;
    const { sections, tables } = getTablesForProperty(id);
    set({ propertyId: id, sections, tables });
  },

  setTables: (tables) => set({ tables }),

  updateTableStatus: (id, status, waiterName, guestCount) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === id ? { ...t, status, waiter_name: waiterName, guest_count: guestCount, elapsed_minutes: status === 'occupied' ? 0 : t.elapsed_minutes } : t
      ),
    })),

  getTable: (id) => get().tables.find((t) => t.id === id),

  getSectionTables: (sectionId) => get().tables.filter((t) => t.section_id === sectionId),

  startTurnTimer: (tableId) =>
    set((state) => ({
      tables: state.tables.map((t) => (t.id === tableId ? { ...t, elapsed_minutes: 0 } : t)),
    })),

  summaryStats: () => {
    const tables = get().tables;
    return {
      total: tables.length,
      free: tables.filter((t) => t.status === 'available').length,
      occupied: tables.filter((t) => t.status === 'occupied').length,
      reserved: tables.filter((t) => t.status === 'reserved').length,
      cleaning: tables.filter((t) => t.status === 'cleaning').length,
    };
  },
}));
