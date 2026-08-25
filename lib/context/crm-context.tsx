/**
 * CRM Context (SRS 4.5)
 * Manages guest profiles, stay history, notes, loyalty tiers, points, and promotions
 *
 * Covers: CR-001 through CR-006
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';
import type { GuestProfile } from '@/types/api';
import { STATUS_COLORS } from '@/lib/constants/figma-tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GuestNote {
  id: string;
  guestId: string;
  author: string;
  text: string;
  createdAt: string;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface LoyaltyConfig {
  tier: LoyaltyTier;
  minPoints: number;
  color: string;
  benefits: string[];
}

export const LOYALTY_TIERS: LoyaltyConfig[] = [
  { tier: 'BRONZE', minPoints: 0, color: STATUS_COLORS.bronze, benefits: ['Free welcome drink', 'Birthday bonus points'] },
  { tier: 'SILVER', minPoints: 500, color: STATUS_COLORS.silver, benefits: ['5% discount on all bookings', 'Free welcome drink', 'Birthday bonus points', 'Early check-in (subject to availability)'] },
  { tier: 'GOLD', minPoints: 2000, color: STATUS_COLORS.gold, benefits: ['10% discount on all bookings', 'Free room upgrade (subject to availability)', 'Late check-out (2 PM)', 'Free breakfast', 'Birthday bonus points', 'Priority customer support'] },
  { tier: 'PLATINUM', minPoints: 5000, color: STATUS_COLORS.platinum, benefits: ['15% discount on all bookings', 'Guaranteed room upgrade', 'Late check-out (6 PM)', 'Free breakfast + dinner', 'VIP airport transfer', 'Dedicated concierge', 'Birthday bonus points', 'Early access to promotions'] },
];

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercentage: number;
  discountCode: string;
  minBookingAmount: number;
  startsAt: string;
  endsAt: string;
  targetSegment: 'all' | 'bronze_plus' | 'silver_plus' | 'gold_plus' | 'platinum_only';
  isActive: boolean;
}

export interface CRMProfile extends GuestProfile {
  totalStays: number;
  totalSpent: number;
  computedTier: LoyaltyTier;
  notes: GuestNote[];
  promotionsRedeemed: string[];
}

interface CRMContextValue {
  crmProfiles: Map<string, CRMProfile>;
  getProfile: (guestId: string) => CRMProfile | undefined;
  addNote: (guestId: string, text: string) => void;
  earnPoints: (guestId: string, amount: number) => void;
  redeemPoints: (guestId: string, points: number) => boolean;
  getTier: (guestId: string) => LoyaltyTier;
  getTierBenefits: (tier: LoyaltyTier) => string[];
  getActivePromotions: () => Promotion[];
  getPromotionsForGuest: (guestId: string) => Promotion[];
  createAutoProfile: (guest: { id: string; name: string; email: string; phone?: string; nationality?: string }) => void;
  recordStay: (guestId: string, bookingTotal: number) => void;
}

const CRMContext = createContext<CRMContextValue | undefined>(undefined);

const STORAGE_KEY = 'serveiq_crm_profiles';

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Summer Getaway',
    description: 'Enjoy 15% off on stays of 3+ nights at participating properties',
    discountPercentage: 15,
    discountCode: 'SUMMER15',
    minBookingAmount: 5000,
    startsAt: '2026-07-01',
    endsAt: '2026-08-31',
    targetSegment: 'all',
    isActive: true,
  },
  {
    id: 'promo-2',
    title: 'Silver Rewards Weekend',
    description: 'Weekend getaway with 10% off for Silver+ members',
    discountPercentage: 10,
    discountCode: 'SILVERWKD',
    minBookingAmount: 3000,
    startsAt: '2026-07-01',
    endsAt: '2026-09-30',
    targetSegment: 'silver_plus',
    isActive: true,
  },
  {
    id: 'promo-3',
    title: 'Platinum Luxury Escape',
    description: 'Exclusive 20% off on suite bookings for Platinum members',
    discountPercentage: 20,
    discountCode: 'PLATLUXE',
    minBookingAmount: 10000,
    startsAt: '2026-07-01',
    endsAt: '2026-12-31',
    targetSegment: 'platinum_only',
    isActive: true,
  },
  {
    id: 'promo-4',
    title: 'Refer & Earn',
    description: 'Refer a friend and both get 500 bonus points',
    discountPercentage: 0,
    discountCode: 'REFER500',
    minBookingAmount: 0,
    startsAt: '2026-01-01',
    endsAt: '2026-12-31',
    targetSegment: 'bronze_plus',
    isActive: true,
  },
];

function computeTier(points: number): LoyaltyTier {
  if (points >= 5000) return 'PLATINUM';
  if (points >= 2000) return 'GOLD';
  if (points >= 500) return 'SILVER';
  return 'BRONZE';
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [crmProfiles, setCrmProfiles] = useState<Map<string, CRMProfile>>(new Map());
  const [promotions] = useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed: [string, CRMProfile][] = JSON.parse(data);
          setCrmProfiles(new Map(parsed));
        }
      } catch (e) {
        console.warn('Failed to load CRM profiles:', e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (loaded && crmProfiles.size > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(crmProfiles.entries()))).catch(e => {
        console.warn('Failed to save CRM profiles:', e);
      });
    }
  }, [crmProfiles, loaded]);

  const getProfile = useCallback((guestId: string) => crmProfiles.get(guestId), [crmProfiles]);

  const createAutoProfile = useCallback((guest: { id: string; name: string; email: string; phone?: string; nationality?: string }) => {
    setCrmProfiles(prev => {
      if (prev.has(guest.id)) return prev;
      const now = new Date().toISOString();
      const newProfile: CRMProfile = {
        id: guest.id,
        email: guest.email,
        phone: guest.phone || '',
        name: guest.name,
        nationality: guest.nationality || '',
        is_verified: false,
        loyalty_points: 0,
        totalStays: 0,
        totalSpent: 0,
        computedTier: 'BRONZE',
        notes: [],
        promotionsRedeemed: [],
        created_at: now,
        updated_at: now,
      };
      const updated = new Map(prev);
      updated.set(guest.id, newProfile);
      return updated;
    });
  }, []);

  const recordStay = useCallback((guestId: string, bookingTotal: number) => {
    setCrmProfiles(prev => {
      const profile = prev.get(guestId);
      if (!profile) return prev;
      const updated = new Map(prev);
      const pointsEarned = Math.round(bookingTotal * 0.1); // 10% of spend as points
      const newPoints = (profile.loyalty_points || 0) + pointsEarned;
      updated.set(guestId, {
        ...profile,
        totalStays: profile.totalStays + 1,
        totalSpent: profile.totalSpent + bookingTotal,
        loyalty_points: newPoints,
        computedTier: computeTier(newPoints),
        updated_at: new Date().toISOString(),
      });
      return updated;
    });
  }, []);

  const addNote = useCallback((guestId: string, text: string) => {
    setCrmProfiles(prev => {
      const profile = prev.get(guestId);
      if (!profile) return prev;
      const updated = new Map(prev);
      const note: GuestNote = {
        id: 'note_' + Date.now().toString(36),
        guestId,
        author: 'Staff',
        text,
        createdAt: new Date().toISOString(),
      };
      updated.set(guestId, { ...profile, notes: [...profile.notes, note], updated_at: new Date().toISOString() });
      return updated;
    });
  }, []);

  const earnPoints = useCallback((guestId: string, amount: number) => {
    setCrmProfiles(prev => {
      const profile = prev.get(guestId);
      if (!profile) return prev;
      const updated = new Map(prev);
      const newPoints = (profile.loyalty_points || 0) + amount;
      updated.set(guestId, {
        ...profile,
        loyalty_points: newPoints,
        computedTier: computeTier(newPoints),
        updated_at: new Date().toISOString(),
      });
      return updated;
    });
  }, []);

  const redeemPoints = useCallback((guestId: string, points: number): boolean => {
    let success = false;
    setCrmProfiles(prev => {
      const profile = prev.get(guestId);
      if (!profile || (profile.loyalty_points || 0) < points) return prev;
      const updated = new Map(prev);
      const newPoints = (profile.loyalty_points || 0) - points;
      updated.set(guestId, {
        ...profile,
        loyalty_points: newPoints,
        computedTier: computeTier(newPoints),
        updated_at: new Date().toISOString(),
      });
      success = true;
      return updated;
    });
    return success;
  }, []);

  const getTier = useCallback((guestId: string): LoyaltyTier => {
    const profile = crmProfiles.get(guestId);
    return profile?.computedTier || 'BRONZE';
  }, [crmProfiles]);

  const getTierBenefits = useCallback((tier: LoyaltyTier): string[] => {
    return LOYALTY_TIERS.find(t => t.tier === tier)?.benefits || [];
  }, []);

  const getActivePromotions = useCallback(() => {
    const now = new Date();
    return promotions.filter(p => p.isActive && new Date(p.startsAt) <= now && new Date(p.endsAt) >= now);
  }, [promotions]);

  const getPromotionsForGuest = useCallback((guestId: string): Promotion[] => {
    const profile = crmProfiles.get(guestId);
    const tier = profile?.computedTier || 'BRONZE';
    const activePromos = promotions.filter(p => p.isActive);
    return activePromos.filter(p => {
      switch (p.targetSegment) {
        case 'all': return true;
        case 'bronze_plus': return ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier);
        case 'silver_plus': return ['SILVER', 'GOLD', 'PLATINUM'].includes(tier);
        case 'gold_plus': return ['GOLD', 'PLATINUM'].includes(tier);
        case 'platinum_only': return tier === 'PLATINUM';
        default: return false;
      }
    });
  }, [crmProfiles, promotions]);

  const value = useMemo(() => ({
    crmProfiles,
    getProfile,
    addNote,
    earnPoints,
    redeemPoints,
    getTier,
    getTierBenefits,
    getActivePromotions,
    getPromotionsForGuest,
    createAutoProfile,
    recordStay,
  }), [
    crmProfiles,
    getProfile,
    addNote,
    earnPoints,
    redeemPoints,
    getTier,
    getTierBenefits,
    getActivePromotions,
    getPromotionsForGuest,
    createAutoProfile,
    recordStay,
  ]);

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
