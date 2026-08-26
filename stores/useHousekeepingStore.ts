import { create } from 'zustand';
import { addToSyncQueue, processSyncQueue, getSyncQueueCount } from '@/lib/utils/offline-sync';
import { persistOpsState, OPS_STORAGE_KEYS } from '@/lib/utils/ops-persistence';
import { hostApi } from '@/lib/api/host-api';
import { operationsApi } from '@/lib/api/operations-api';
import type { BackendMyTask, BackendTask } from '@/types/api';

export type HKTaskStatus = 'Dirty' | 'In Progress' | 'Cleaned' | 'Inspected';
export type HKPriority = 'High' | 'Normal' | 'Low';

export interface HKTask {
  id: string;
  room: string;
  floor: number;
  status: HKTaskStatus;
  priority: HKPriority;
  cleaner: string;
  lastCleaned: string;
  notes?: string;
  taskType?: string;
  property_id?: string;
  checklist?: Record<string, boolean>;
  synced?: boolean; // false when changes are pending sync
}

/** Map a BackendMyTask to an HKTask for mobile use */
function mapBackendTaskToHKTask(t: BackendMyTask): HKTask {
  const statusMap: Record<string, HKTaskStatus> = {
    PENDING: 'Dirty',
    IN_PROGRESS: 'In Progress',
    AWAITING_INSPECTION: 'Cleaned',
    COMPLETED: 'Inspected',
    CANCELLED: 'Dirty',
  };
  const priorityMap: Record<string, HKPriority> = {
    HIGH: 'High',
    MEDIUM: 'Normal',
    LOW: 'Low',
  };
  return {
    id: t.id,
    room: t.room_name,
    floor: t.floor_number ?? 0,
    status: statusMap[t.status] ?? 'Dirty',
    priority: priorityMap[t.priority] ?? 'Normal',
    cleaner: t.assigned_by_name || 'Unassigned',
    lastCleaned: t.completed_at || '',
    notes: t.notes || undefined,
    taskType: t.task_type,
    property_id: t.property_id,
    synced: true,
  };
}

/** Map an admin BackendTask to an HKTask */
function mapAdminTaskToHKTask(t: BackendTask): HKTask {
  const statusMap: Record<string, HKTaskStatus> = {
    PENDING: 'Dirty',
    IN_PROGRESS: 'In Progress',
    AWAITING_INSPECTION: 'Cleaned',
    COMPLETED: 'Inspected',
    CANCELLED: 'Dirty',
  };
  const priorityMap: Record<string, HKPriority> = {
    HIGH: 'High',
    MEDIUM: 'Normal',
    LOW: 'Low',
  };
  return {
    id: t.id,
    room: t.room_name,
    floor: 0,
    status: statusMap[t.status] ?? 'Dirty',
    priority: priorityMap[t.priority] ?? 'Normal',
    cleaner: t.assigned_staff_name || 'Unassigned',
    lastCleaned: t.completed_at || '',
    notes: t.notes || undefined,
    taskType: t.task_type,
    property_id: t.property_id,
    synced: true,
  };
}

export const STATUS_ORDER: HKTaskStatus[] = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'];

export const STATUS_FLOW_COLORS: Record<string, string> = {
  Dirty: '#BA1A1A',
  'In Progress': '#006687',
  Cleaned: '#166534',
  Inspected: '#002645',
};

export const CLEANING_CHECKLIST = [
  'Strip and remake beds',
  'Clean bathroom (toilet, sink, shower)',
  'Vacuum/mop floors',
  'Dust all surfaces',
  'Restock amenities (soap, towels, etc.)',
  'Empty trash bins',
  'Wipe windows and mirrors',
  'Check mini-bar (if applicable)',
];

interface HousekeepingStore {
  propertyId: string;
  tasks: HKTask[];
  syncPendingCount: number;
  isSyncing: boolean;
  isLoading: boolean;
  setPropertyId: (id: string) => void;
  fetchTasks: (propertyId?: string) => Promise<void>;
  advanceStatus: (room: string) => void;
  updateChecklist: (room: string, index: number, done: boolean) => void;
  assignCleaner: (room: string, cleaner: string) => void;
  updateNotes: (room: string, notes: string) => void;
  createTask: (data: { room: string; floor: number; status: HKTaskStatus; priority: HKPriority; cleaner: string; lastCleaned: string; taskType?: string; property_id?: string }) => void;
  syncPendingChanges: () => Promise<void>;
  refreshSyncCount: () => Promise<void>;
}

const INITIAL_TASKS: HKTask[] = [
  { id: '1', room: '102', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Rajesh', lastCleaned: '2 days ago', property_id: 'prop-1', synced: true },
  { id: '2', room: '103', floor: 1, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '3 days ago', property_id: 'prop-1', synced: true },
  { id: '3', room: '106', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: '1 day ago', property_id: 'prop-1', synced: true },
  { id: '4', room: '203', floor: 2, status: 'Dirty', priority: 'Normal', cleaner: 'Rajesh', lastCleaned: '4 days ago', property_id: 'prop-1', synced: true },
  { id: '5', room: '303', floor: 3, status: 'Inspected', priority: 'Low', cleaner: 'Anita', lastCleaned: '5 days ago', property_id: 'prop-1', synced: true },
  { id: '6', room: '305', floor: 3, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '2 days ago', property_id: 'prop-1', synced: true },
  { id: '7', room: '206', floor: 2, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: 'Today', property_id: 'prop-1', synced: true },
  { id: '8', room: '104', floor: 1, status: 'Cleaned', priority: 'Low', cleaner: 'Anita', lastCleaned: 'Today', property_id: 'prop-1', synced: true },
];

let taskIdCounter = 100;

export const useHousekeepingStore = create<HousekeepingStore>((set, get) => ({
  propertyId: 'prop-1',
  tasks: INITIAL_TASKS,
  syncPendingCount: 0,
  isSyncing: false,
  isLoading: false,

  setPropertyId: (id) => set({ propertyId: id }),

  fetchTasks: async (propertyId?: string) => {
    const pid = propertyId || get().propertyId;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(pid)) return; // demo property, keep mock data

    set({ isLoading: true });
    try {
      // Staff mobile endpoint returns their assigned tasks
      const apiTasks = await operationsApi.getMyTasks(pid);
      if (apiTasks.length > 0) {
        set({ tasks: apiTasks.map(mapBackendTaskToHKTask) });
      } else {
        // No tasks from mobile endpoint, try admin endpoint (property owner view)
        const adminTasks = await hostApi.getTasks(pid);
        if (adminTasks.length > 0) {
          set({ tasks: adminTasks.map(mapAdminTaskToHKTask) });
        }
      }
    } catch {
      // Keep existing mock data on failure
    } finally {
      set({ isLoading: false });
    }
  },

  advanceStatus: (room) => {
    set((state) => {
      const task = state.tasks.find(t => t.room === room);
      if (!task) return state;
      const idx = STATUS_ORDER.indexOf(task.status);
      if (idx >= STATUS_ORDER.length - 1) return state;
      const nextStatus = STATUS_ORDER[idx + 1];

      // Map HKTaskStatus to backend TaskStatusBE
      const statusMapToBackend: Record<HKTaskStatus, string> = {
        Dirty: 'PENDING',
        'In Progress': 'IN_PROGRESS',
        Cleaned: 'AWAITING_INSPECTION',
        Inspected: 'COMPLETED',
      };

      // Call backend API if task has a valid UUID
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (task.property_id && UUID_RE.test(task.property_id) && UUID_RE.test(task.id)) {
        operationsApi.updateTaskStatus(task.property_id, task.id, {
          status: statusMapToBackend[nextStatus] as any,
        }, () => ({} as any)).catch(() => {});
      }

      // Add to sync queue for offline support
      addToSyncQueue({
        type: 'UPDATE_STATUS',
        payload: { taskId: task.id, room, status: nextStatus },
      });

      const next = state.tasks.map((t) => {
        if (t.room !== room) return t;
        return { ...t, status: nextStatus, synced: false };
      });
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);

      return { tasks: next, syncPendingCount: state.syncPendingCount + 1 };
    });
  },

  updateChecklist: (room, index, done) => {
    set((state) => {
      const task = state.tasks.find(t => t.room === room);
      if (!task) return state;

      addToSyncQueue({
        type: 'UPDATE_CHECKLIST',
        payload: { taskId: task.id, room, checklist: { ...(task.checklist || {}), [String(index)]: done } },
      });

      const next = state.tasks.map((t) => {
        if (t.room !== room) return t;
        return { ...t, checklist: { ...(t.checklist || {}), [String(index)]: done }, synced: false };
      });
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);

      return { tasks: next, syncPendingCount: state.syncPendingCount + 1 };
    });
  },

  assignCleaner: (room, cleaner) => {
    set((state) => {
      const task = state.tasks.find(t => t.room === room);
      if (!task) return state;

      addToSyncQueue({
        type: 'ASSIGN_CLEANER',
        payload: { taskId: task.id, room, cleaner },
      });

      const next = state.tasks.map((t) => (t.room === room ? { ...t, cleaner, synced: false } : t));
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);

      return { tasks: next, syncPendingCount: state.syncPendingCount + 1 };
    });
  },

  updateNotes: (room, notes) => {
    set((state) => {
      const task = state.tasks.find(t => t.room === room);
      if (!task) return state;

      addToSyncQueue({
        type: 'UPDATE_NOTES',
        payload: { taskId: task.id, room, notes },
      });

      const next = state.tasks.map((t) => (t.room === room ? { ...t, notes, synced: false } : t));
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);

      return { tasks: next, syncPendingCount: state.syncPendingCount + 1 };
    });
  },

  createTask: (data) => {
    const newTask: HKTask = {
      id: `hk-${++taskIdCounter}`,
      room: data.room,
      floor: data.floor,
      status: data.status,
      priority: data.priority,
      cleaner: data.cleaner,
      lastCleaned: data.lastCleaned,
      taskType: data.taskType || 'ROOM_CLEANING',
      property_id: data.property_id,
      synced: false,
    };

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (data.property_id && UUID_RE.test(data.property_id)) {
      hostApi.createTask(data.property_id, {
        room_name: data.room,
        task_type: data.taskType || 'ROOM_CLEANING',
        priority: data.priority.toUpperCase() as any,
        notes: `Floor ${data.floor} — ${data.cleaner}`,
      }, () => {});
    }

    addToSyncQueue({
      type: 'UPDATE_STATUS',
      payload: { taskId: newTask.id, room: data.room, status: data.status },
    });

    set((state) => {
      const next = [newTask, ...state.tasks];
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);
      return { tasks: next, syncPendingCount: state.syncPendingCount + 1 };
    });
  },

  syncPendingChanges: async () => {
    const state = get();
    if (state.isSyncing) return;

    set({ isSyncing: true });

    try {
      await processSyncQueue(async (action) => {
        // Simulate API call - in production, this would call the actual backend
        // For now, we mark as synced after a small delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mark the corresponding task as synced
        set((state) => {
          const next = state.tasks.map(t => {
            if (t.id === action.payload.taskId || t.room === action.payload.room) {
              return { ...t, synced: true };
            }
            return t;
          });
          persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);
          return { tasks: next };
        });

        return true; // Success
      });

      // Refresh sync count
      const count = await getSyncQueueCount();
      set({ syncPendingCount: count });
    } finally {
      set({ isSyncing: false });
    }
  },

  refreshSyncCount: async () => {
    const count = await getSyncQueueCount();
    set({ syncPendingCount: count });
  },
}));
