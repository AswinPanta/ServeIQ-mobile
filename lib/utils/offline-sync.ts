import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = '@stayeasy_sync_queue';
const SYNC_LOCK_KEY = '@stayeasy_sync_lock';
const SYNC_LOCK_TS_KEY = '@stayeasy_sync_lock_ts';
const FAILED_SYNCS_KEY = '@stayeasy_failed_syncs';

const LOCK_TTL_MS = 30_000; // 30 seconds

export interface SyncAction {
  id: string;
  type: 'UPDATE_STATUS' | 'UPDATE_CHECKLIST' | 'ASSIGN_CLEANER' | 'UPDATE_NOTES';
  payload: {
    taskId?: string;
    room?: string;
    status?: string;
    checklist?: Record<string, boolean>;
    cleaner?: string;
    notes?: string;
  };
  timestamp: number;
  retries: number;
  maxRetries: number;
}

let actionIdCounter = Date.now();

/**
 * Add an action to the sync queue (fire-and-forget for store mutations)
 */
export function addToSyncQueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retries' | 'maxRetries'>): string {
  const id = `sync_${++actionIdCounter}`;
  const syncAction: SyncAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: 3,
  };

  // Fire-and-forget - write happens in background
  getSyncQueue().then(queue => {
    queue.push(syncAction);
    AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
  });

  return id;
}

/**
 * Get all pending sync actions
 */
export async function getSyncQueue(): Promise<SyncAction[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (raw) {
      return JSON.parse(raw) as SyncAction[];
    }
  } catch {
    // Corrupted data - return empty
  }
  return [];
}

/**
 * Get pending sync count (synchronous check from storage)
 */
export async function getSyncQueueCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

/**
 * Remove a completed action from the sync queue
 */
export async function removeFromSyncQueue(actionId: string): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter(a => a.id !== actionId);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Clear the entire sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Store a failed sync action for manual review
 */
async function storeFailedSync(action: SyncAction, error?: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FAILED_SYNCS_KEY);
    const failed = raw ? JSON.parse(raw) : [];
    failed.push({ ...action, error, failedAt: Date.now() });
    // Keep only last 50 failed items
    const trimmed = failed.slice(-50);
    await AsyncStorage.setItem(FAILED_SYNCS_KEY, JSON.stringify(trimmed));
  } catch {
    // Swallow - best effort
  }
}

/**
 * Check if the sync lock is stale (>30s old)
 */
async function isLockStale(): Promise<boolean> {
  try {
    const tsRaw = await AsyncStorage.getItem(SYNC_LOCK_TS_KEY);
    if (!tsRaw) return true;
    const ts = parseInt(tsRaw, 10);
    return Date.now() - ts > LOCK_TTL_MS;
  } catch {
    return true;
  }
}

/**
 * Acquire sync lock (with TTL check)
 */
async function acquireLock(): Promise<boolean> {
  const lockRaw = await AsyncStorage.getItem(SYNC_LOCK_KEY);
  if (lockRaw === 'true') {
    // Check if lock is stale
    if (await isLockStale()) {
      // Lock is stale - force release
      await releaseLock();
    } else {
      return false;
    }
  }

  await AsyncStorage.setItem(SYNC_LOCK_KEY, 'true');
  await AsyncStorage.setItem(SYNC_LOCK_TS_KEY, String(Date.now()));
  return true;
}

/**
 * Release sync lock
 */
async function releaseLock(): Promise<void> {
  await AsyncStorage.setItem(SYNC_LOCK_KEY, 'false');
}

/**
 * Process the sync queue by executing each action
 */
export async function processSyncQueue(
  executor: (action: SyncAction) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  // Acquire lock to prevent concurrent sync
  const acquired = await acquireLock();
  if (!acquired) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  try {
    const queue = await getSyncQueue();

    for (const action of queue) {
      try {
        const success = await executor(action);
        if (success) {
          await removeFromSyncQueue(action.id);
          processed++;
        } else {
          action.retries++;
          if (action.retries >= action.maxRetries) {
            await removeFromSyncQueue(action.id);
            await storeFailedSync(action, 'Max retries exceeded');
            failed++;
          } else {
            // Update retry count
            const updatedQueue = await getSyncQueue();
            const idx = updatedQueue.findIndex(a => a.id === action.id);
            if (idx !== -1) {
              updatedQueue[idx] = action;
              await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
            }
          }
        }
      } catch (err) {
        failed++;
        await removeFromSyncQueue(action.id);
        await storeFailedSync(action, String(err));
      }
    }
  } finally {
    await releaseLock();
  }

  return { processed, failed };
}
