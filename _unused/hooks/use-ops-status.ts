/**
 * useOpsStatus — lightweight connectivity tracker for Operations screens.
 *
 * Tracks three states:
 * - 'live':   Backend reachable, real data flowing
 * - 'demo':   Demo mode active, using mock/fallback data
 * - 'offline': Backend unreachable, using persisted local data
 *
 * Pings the backend every 30 seconds to keep status current.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { isDemoMode } from '@/lib/api';
import { API_BASE_URL } from '@/constants/api-config';

export type OpsStatus = 'live' | 'demo' | 'offline' | 'checking';

export interface OpsStatusInfo {
  status: OpsStatus;
  /** Timestamp of last successful backend ping (null if never reached) */
  lastSync: Date | null;
  /** Whether currently in demo mode */
  isDemo: boolean;
  /** Whether backend is reachable right now */
  isBackendLive: boolean;
  /** Human-readable label for the status */
  label: string;
  /** Color for the status dot */
  color: string;
}

const PING_INTERVAL_MS = 30_000; // 30 seconds

async function pingBackend(): Promise<boolean> {
  try {
    // Hit the root API endpoint with a short timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, '')}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    // Also try /docs as a fallback (FastAPI always serves this)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_BASE_URL.replace(/\/api\/v1$/, '')}/docs`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

const STATUS_MAP: Record<OpsStatus, { label: string; color: string }> = {
  live: { label: 'Live', color: '#10B981' },
  demo: { label: 'Demo', color: '#F59E0B' },
  offline: { label: 'Offline', color: '#EF4444' },
  checking: { label: 'Checking…', color: '#94A3B8' },
};

export function useOpsStatus(pollInterval: number = PING_INTERVAL_MS): OpsStatusInfo {
  const [isDemo, setIsDemo] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null); // null = unknown
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  // Check demo mode once on mount
  useEffect(() => {
    isDemoMode().then(demo => {
      if (mountedRef.current) setIsDemo(demo);
    });
    return () => { mountedRef.current = false; };
  }, []);

  // Ping backend periodically
  const doPing = useCallback(async () => {
    if (!mountedRef.current) return;
    const alive = await pingBackend();
    if (mountedRef.current) {
      setIsBackendLive(alive);
      if (alive) setLastSync(new Date());
    }
  }, []);

  // Initial ping + interval
  useEffect(() => {
    doPing();
    const interval = setInterval(doPing, pollInterval);
    return () => clearInterval(interval);
  }, [doPing, pollInterval]);

  // Derive status
  const status: OpsStatus = isDemo ? 'demo' : (isBackendLive === null ? 'checking' : isBackendLive ? 'live' : 'offline');
  const { label, color } = STATUS_MAP[status];

  return { status, lastSync, isDemo, isBackendLive: isBackendLive ?? false, label, color };
}
