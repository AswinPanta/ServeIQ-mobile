/**
 * Operations Invite Context
 *
 * ERP-style staff management: Host creates operator accounts with roles,
 * the system generates invite codes, and operators claim them at login.
 *
 * In production, the invite would be emailed. For now, invite codes are
 * stored in-memory (and AsyncStorage) with a placeholder for real email
 * integration.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OperatorRole } from '@/types/api';

// ─── Types ─────────────────────────────────────────

export interface OperatorInvite {
  /** Unique invite code (e.g. OPS-A1B2C3) */
  code: string;
  /** Operator's email address */
  email: string;
  /** Operator's display name */
  name: string;
  /** Assigned role at the property */
  role: OperatorRole;
  /** Property ID this operator belongs to */
  propertyId: string;
  /** Property display name */
  propertyName: string;
  /** Whether the invite has been claimed */
  claimed: boolean;
  /** Whether the operator account is active */
  isActive: boolean;
  /** ISO timestamp */
  createdAt: string;
}

interface OperationsInviteContextType {
  /** All invites (claimed + unclaimed) for the current host's properties */
  invites: OperatorInvite[];
  /** Loading state */
  isLoading: boolean;
  /** Create a new operator invite */
  createInvite: (data: {
    email: string;
    name: string;
    role: OperatorRole;
    propertyId: string;
    propertyName: string;
  }) => OperatorInvite;
  /** Claim an invite code — called from operations login */
  claimInvite: (code: string) => OperatorInvite | null;
  /** Validate an invite code without claiming */
  validateInvite: (code: string) => OperatorInvite | null;
  /** Toggle operator active status */
  toggleActive: (code: string) => void;
  /** Remove an invite */
  removeInvite: (code: string) => void;
  /** Get invites filtered by property */
  getInvitesByProperty: (propertyId: string) => OperatorInvite[];
}

const STORAGE_KEY = '@serveiq_operator_invites';

// ─── Helpers ───────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OPS-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Mock Invites (Dev Data) ───────────────────────

const MOCK_INVITES: OperatorInvite[] = [
  {
    code: 'OPS-DEMO01',
    email: 'frontdesk@demo.com',
    name: 'Demo Front Desk',
    role: 'front_desk',
    propertyId: 'prop-1',
    propertyName: 'Grand Hotel Kathmandu',
    claimed: true,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    code: 'OPS-DEMO02',
    email: 'housekeeping@demo.com',
    name: 'Demo Housekeeper',
    role: 'housekeeping',
    propertyId: 'prop-1',
    propertyName: 'Grand Hotel Kathmandu',
    claimed: true,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    code: 'OPS-DEMO03',
    email: 'manager@demo.com',
    name: 'Demo Manager',
    role: 'manager',
    propertyId: 'prop-1',
    propertyName: 'Grand Hotel Kathmandu',
    claimed: true,
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─── Context ───────────────────────────────────────

const InviteContext = createContext<OperationsInviteContextType | undefined>(undefined);

export function OperationsInviteProvider({ children }: { children: React.ReactNode }) {
  const [invites, setInvites] = useState<OperatorInvite[]>(MOCK_INVITES);
  const [isLoading, setIsLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: OperatorInvite[] = JSON.parse(stored);
          // Merge stored invites with mock data (mock takes precedence for dev)
          const merged = [...MOCK_INVITES];
          for (const inv of parsed) {
            if (!merged.find(m => m.code === inv.code)) {
              merged.push(inv);
            }
          }
          if (!cancelled) setInvites(merged);
        }
      } catch {
        // Keep mock data on parse failure
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist to AsyncStorage whenever invites change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(invites)).catch(e => {
        console.warn('Failed to save invites:', e);
      });
    }
  }, [invites, isLoading]);

  const createInvite = useCallback((data: {
    email: string;
    name: string;
    role: OperatorRole;
    propertyId: string;
    propertyName: string;
  }): OperatorInvite => {
    const invite: OperatorInvite = {
      code: generateInviteCode(),
      email: data.email,
      name: data.name,
      role: data.role,
      propertyId: data.propertyId,
      propertyName: data.propertyName,
      claimed: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setInvites(prev => [...prev, invite]);
    return invite;
  }, []);

  const validateInvite = useCallback((code: string): OperatorInvite | null => {
    const normalized = code.trim().toUpperCase();
    const invite = invites.find(i => i.code === normalized && !i.claimed && i.isActive);
    return invite || null;
  }, [invites]);

  const claimInvite = useCallback((code: string): OperatorInvite | null => {
    const normalized = code.trim().toUpperCase();
    let claimed: OperatorInvite | null = null;
    setInvites(prev => {
      const updated = prev.map(i => {
        if (i.code === normalized && !i.claimed && i.isActive) {
          claimed = { ...i, claimed: true };
          return claimed;
        }
        return i;
      });
      return updated;
    });
    return claimed;
  }, []);

  const toggleActive = useCallback((code: string) => {
    setInvites(prev => prev.map(i =>
      i.code === code ? { ...i, isActive: !i.isActive } : i
    ));
  }, []);

  const removeInvite = useCallback((code: string) => {
    setInvites(prev => prev.filter(i => i.code !== code));
  }, []);

  const getInvitesByProperty = useCallback((propertyId: string) => {
    return invites.filter(i => i.propertyId === propertyId);
  }, [invites]);

  return (
    <InviteContext.Provider value={{
      invites,
      isLoading,
      createInvite,
      claimInvite,
      validateInvite,
      toggleActive,
      removeInvite,
      getInvitesByProperty,
    }}>
      {children}
    </InviteContext.Provider>
  );
}

export function useOperationsInvites() {
  const context = useContext(InviteContext);
  if (!context) throw new Error('useOperationsInvites must be used within OperationsInviteProvider');
  return context;
}
