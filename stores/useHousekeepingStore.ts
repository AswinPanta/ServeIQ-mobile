import { create } from 'zustand';

export type HKStatus = 'Dirty' | 'In Progress' | 'Cleaned' | 'Inspected';
export type HKPriority = 'High' | 'Normal' | 'Low';

export interface HKTask {
  id: string;
  room: string;
  floor: number;
  status: HKStatus;
  priority: HKPriority;
  cleaner: string;
  lastCleaned: string;
  notes?: string;
  checklist?: Record<string, boolean>;
  startedAt?: number;
  taskType: 'cleaning' | 'turnover' | 'deep_clean' | 'inspection';
  property_id: string;
}

export const STATUS_ORDER: HKStatus[] = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'];
export const STATUS_FLOW_COLORS: Record<string, string> = {
  Dirty: '#F59E0B',
  'In Progress': '#3B82F6',
  Cleaned: '#10B981',
  Inspected: '#8B5CF6',
};

export const CLEANING_CHECKLIST = [
  'Make beds and change linens',
  'Clean and sanitize bathroom',
  'Vacuum/mop floors',
  'Dust all surfaces',
  'Restock amenities (soap, shampoo, etc.)',
  'Empty trash bins',
  'Wipe down mirrors and glass',
  'Arrange furniture properly',
  'Check mini-bar and restock',
  'Inspect for damages and report',
];

/** Per-property initial housekeeping tasks */
function getInitialTasksForProperty(propertyId: string): HKTask[] {
  if (propertyId === 'prop-1') {
    return [
      { id: 'hk1', room: '102', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Rajesh', lastCleaned: '2 days ago', notes: 'Guest checked out late', taskType: 'turnover', startedAt: undefined, checklist: {}, property_id: 'prop-1' },
      { id: 'hk2', room: '103', floor: 1, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '3 days ago', taskType: 'cleaning', startedAt: Date.now() - 600000, checklist: { '0': true, '1': true, '2': false, '3': true, '4': false, '5': true, '6': false, '7': false, '8': false, '9': false }, property_id: 'prop-1' },
      { id: 'hk3', room: '106', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: '1 day ago', taskType: 'deep_clean', startedAt: undefined, checklist: {}, property_id: 'prop-1' },
      { id: 'hk4', room: '203', floor: 2, status: 'Dirty', priority: 'Normal', cleaner: 'Rajesh', lastCleaned: '4 days ago', taskType: 'cleaning', startedAt: undefined, checklist: {}, property_id: 'prop-1' },
      { id: 'hk5', room: '303', floor: 3, status: 'Inspected', priority: 'Low', cleaner: 'Anita', lastCleaned: '5 days ago', notes: 'All good', taskType: 'inspection', startedAt: undefined, checklist: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true }, property_id: 'prop-1' },
      { id: 'hk6', room: '305', floor: 3, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '2 days ago', taskType: 'cleaning', startedAt: Date.now() - 120000, checklist: { '0': true, '1': true, '2': false, '3': false, '4': false, '5': false, '6': false, '7': false, '8': false, '9': false }, property_id: 'prop-1' },
      { id: 'hk7', room: '206', floor: 2, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: 'Today', taskType: 'turnover', startedAt: undefined, checklist: {}, property_id: 'prop-1' },
      { id: 'hk8', room: '104', floor: 1, status: 'Cleaned', priority: 'Low', cleaner: 'Anita', lastCleaned: 'Today', taskType: 'cleaning', startedAt: undefined, checklist: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true }, property_id: 'prop-1' },
    ];
  }

  if (propertyId === 'prop-2') {
    return [
      { id: 'hk-p2-1', room: '104', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Maya', lastCleaned: '1 day ago', notes: 'Express checkout', taskType: 'turnover', startedAt: undefined, checklist: {}, property_id: 'prop-2' },
      { id: 'hk-p2-2', room: '204', floor: 2, status: 'Dirty', priority: 'Normal', cleaner: 'Unassigned', lastCleaned: '2 days ago', taskType: 'cleaning', startedAt: undefined, checklist: {}, property_id: 'prop-2' },
      { id: 'hk-p2-3', room: '205', floor: 2, status: 'In Progress', priority: 'Normal', cleaner: 'Maya', lastCleaned: '3 days ago', taskType: 'cleaning', startedAt: Date.now() - 300000, checklist: { '0': true, '1': true, '2': true, '3': true, '4': false, '5': true, '6': false, '7': false, '8': false, '9': false }, property_id: 'prop-2' },
      { id: 'hk-p2-4', room: '103', floor: 1, status: 'Cleaned', priority: 'Low', cleaner: 'Anita', lastCleaned: 'Today', taskType: 'inspection', startedAt: undefined, checklist: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true }, property_id: 'prop-2' },
    ];
  }

  if (propertyId === 'prop-3') {
    return [
      { id: 'hk-p3-1', room: 'Villa D', floor: 2, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: 'Today', notes: 'Guest checked out', taskType: 'turnover', startedAt: undefined, checklist: {}, property_id: 'prop-3' },
      { id: 'hk-p3-2', room: 'Villa A', floor: 1, status: 'In Progress', priority: 'Normal', cleaner: 'Kiran', lastCleaned: '2 days ago', taskType: 'deep_clean', startedAt: Date.now() - 900000, checklist: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': false, '6': false, '7': false, '8': false, '9': false }, property_id: 'prop-3' },
    ];
  }

  // Dynamically created properties start with empty tasks
  return [];
}

interface HousekeepingStore {
  tasks: HKTask[];
  propertyId: string;
  setTasks: (tasks: HKTask[]) => void;
  setPropertyId: (id: string) => void;
  getTask: (room: string) => HKTask | undefined;
  updateTaskStatus: (room: string, status: HKStatus) => void;
  advanceStatus: (room: string) => void;
  assignCleaner: (room: string, cleaner: string) => void;
  updateNotes: (room: string, notes: string) => void;
  updateChecklist: (room: string, itemIndex: number, done: boolean) => void;
  createTask: (data: Omit<HKTask, 'id'>) => HKTask;
  summaryStats: () => { dirty: number; inProgress: number; cleaned: number; inspected: number; total: number; cleaners: number };
  getFilteredTasks: (statusFilter?: HKStatus | 'All') => HKTask[];
}

export const useHousekeepingStore = create<HousekeepingStore>((set, get) => ({
  tasks: getInitialTasksForProperty('prop-1'),
  propertyId: 'prop-1',

  setTasks: (tasks) => set({ tasks }),

  setPropertyId: (id) => {
    const currentTasks = get().tasks;
    // Only reload initial data if switching to a different property
    if (id !== get().propertyId) {
      const newTasks = getInitialTasksForProperty(id);
      set({ propertyId: id, tasks: newTasks });
    }
  },

  getTask: (room) => get().tasks.find((t) => t.room === room),

  updateTaskStatus: (room, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.room === room ? { ...t, status, startedAt: status === 'In Progress' && !t.startedAt ? Date.now() : t.startedAt } : t
      ),
    })),

  advanceStatus: (room) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.room !== room) return t;
        const currentIdx = STATUS_ORDER.indexOf(t.status);
        if (currentIdx >= STATUS_ORDER.length - 1) return t;
        const nextStatus = STATUS_ORDER[currentIdx + 1];
        return {
          ...t,
          status: nextStatus,
          startedAt: nextStatus === 'In Progress' && !t.startedAt ? Date.now() : t.startedAt,
        };
      }),
    })),

  assignCleaner: (room, cleaner) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.room === room ? { ...t, cleaner } : t)),
    })),

  updateNotes: (room, notes) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.room === room ? { ...t, notes } : t)),
    })),

  updateChecklist: (room, itemIndex, done) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.room !== room) return t;
        return { ...t, checklist: { ...t.checklist, [itemIndex]: done } };
      }),
    })),

  createTask: (data) => {
    const newTask: HKTask = { id: 'hk-' + Date.now(), ...data, notes: data.notes || '', checklist: data.checklist || {}, startedAt: data.startedAt || undefined };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  summaryStats: () => {
    const tasks = get().tasks;
    return {
      dirty: tasks.filter((t) => t.status === 'Dirty').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      cleaned: tasks.filter((t) => t.status === 'Cleaned').length,
      inspected: tasks.filter((t) => t.status === 'Inspected').length,
      total: tasks.length,
      cleaners: [...new Set(tasks.map((t) => t.cleaner).filter((c) => c !== 'Unassigned'))].length,
    };
  },

  getFilteredTasks: (statusFilter) => {
    const tasks = get().tasks;
    if (!statusFilter || statusFilter === 'All') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  },
}));
