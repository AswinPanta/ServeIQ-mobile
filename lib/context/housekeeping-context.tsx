import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { operationsApi } from '@/lib/api/operations-api';
import { loadOpsState, persistOpsState, OPS_STORAGE_KEYS } from '@/lib/utils/ops-persistence';

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
}

export const STATUS_ORDER: HKTaskStatus[] = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'];

export const STATUS_FLOW_COLORS: Record<string, string> = {
  Dirty: '#F59E0B',
  'In Progress': '#3B82F6',
  Cleaned: '#10B981',
  Inspected: '#8B5CF6',
};

interface HousekeepingContextValue {
  tasks: HKTask[];
  getTask: (room: string) => HKTask | undefined;
  updateTaskStatus: (room: string, status: HKTaskStatus) => void;
  assignCleaner: (room: string, cleaner: string) => void;
  updateNotes: (room: string, notes: string) => void;
  summaryStats: { dirty: number; inProgress: number; inspected: number; cleaners: number };
}

const INITIAL_TASKS: HKTask[] = [
  { id: '1', room: '102', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Rajesh', lastCleaned: '2 days ago' },
  { id: '2', room: '103', floor: 1, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '3 days ago' },
  { id: '3', room: '106', floor: 1, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: '1 day ago' },
  { id: '4', room: '203', floor: 2, status: 'Dirty', priority: 'Normal', cleaner: 'Rajesh', lastCleaned: '4 days ago' },
  { id: '5', room: '303', floor: 3, status: 'Inspected', priority: 'Low', cleaner: 'Anita', lastCleaned: '5 days ago' },
  { id: '6', room: '305', floor: 3, status: 'In Progress', priority: 'Normal', cleaner: 'Sita', lastCleaned: '2 days ago' },
  { id: '7', room: '206', floor: 2, status: 'Dirty', priority: 'High', cleaner: 'Unassigned', lastCleaned: 'Today' },
  { id: '8', room: '104', floor: 1, status: 'Cleaned', priority: 'Low', cleaner: 'Anita', lastCleaned: 'Today' },
];

const HousekeepingContext = createContext<HousekeepingContextValue | null>(null);

export function HousekeepingProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<HKTask[]>(INITIAL_TASKS);
  const [loaded, setLoaded] = useState(false);

  // Load persisted tasks on mount, fall back to INITIAL_TASKS
  useEffect(() => {
    loadOpsState<HKTask[] | null>(OPS_STORAGE_KEYS.hkTasks, null).then(saved => {
      if (saved) setTasks(saved);
      setLoaded(true);
    });
  }, []);

  // Fetch from API if backend is live
  useEffect(() => {
    if (!loaded) return;
    operationsApi.getHkTasks(() => []).then(apiTasks => {
      if (apiTasks.length > 0) setTasks(apiTasks as any);
    });
  }, [loaded]);

  const getTask = useCallback((room: string) => tasks.find(t => t.room === room), [tasks]);

  const updateTaskStatus = useCallback((room: string, status: HKTaskStatus) => {
    setTasks(prev => {
      const task = prev.find(t => t.room === room);
      if (task) {
        operationsApi.updateHkTask(task.id, { status: status as any }, () => {});
      }
      const next = prev.map(t => t.room === room ? { ...t, status } : t);
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);
      return next;
    });
  }, []);

  const assignCleaner = useCallback((room: string, cleaner: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.room === room);
      if (task) {
        operationsApi.updateHkTask(task.id, { assigned_to: cleaner } as any, () => {});
      }
      const next = prev.map(t => t.room === room ? { ...t, cleaner } : t);
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);
      return next;
    });
  }, []);

  const updateNotes = useCallback((room: string, notes: string) => {
    setTasks(prev => {
      const next = prev.map(t => t.room === room ? { ...t, notes } : t);
      persistOpsState(OPS_STORAGE_KEYS.hkTasks, next);
      return next;
    });
  }, []);

  const summaryStats = {
    dirty: tasks.filter(t => t.status === 'Dirty').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    inspected: tasks.filter(t => t.status === 'Inspected').length,
    cleaners: [...new Set(tasks.map(t => t.cleaner).filter(c => c !== 'Unassigned'))].length,
  };

  return (
    <HousekeepingContext.Provider value={{
      tasks,
      getTask,
      updateTaskStatus,
      assignCleaner,
      updateNotes,
      summaryStats,
    }}>
      {children}
    </HousekeepingContext.Provider>
  );
}

export function useHousekeeping() {
  const ctx = useContext(HousekeepingContext);
  if (!ctx) throw new Error('useHousekeeping must be used within HousekeepingProvider');
  return ctx;
}
