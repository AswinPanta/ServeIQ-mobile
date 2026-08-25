/**
 * Phase 12 — User Experience
 * Draft reservations with auto-save and restore.
 * Reservation templates for walk-in, corporate, group, VIP, returning guest.
 * Smart suggestions based on guest history.
 * Reservation status workflow with clear state transitions.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReservationStatus = 'draft' | 'pending' | 'confirmed' | 'guaranteed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show';

export interface ReservationDraft {
  id: string;
  propertyId: string;
  guestName?: string;
  email?: string;
  phone?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  source?: string;
  specialRequests?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ReservationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: Partial<ReservationDraft>;
}

export interface SmartSuggestion {
  type: 'returning_guest' | 'preferred_room' | 'preferred_floor' | 'preferred_payment' | 'upgrade';
  label: string;
  value: string;
  confidence: number; // 0-100
}

const DRAFTS_STORAGE_KEY = '@serveiq_booking_drafts';

const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['guaranteed', 'cancelled', 'no_show'],
  guaranteed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

const TEMPLATES: ReservationTemplate[] = [
  { id: 'tpl-walkin', name: 'Walk-in', description: 'Quick walk-in booking', icon: '🚶', defaults: { source: 'walk_in' } },
  { id: 'tpl-corporate', name: 'Corporate', description: 'Company booking with billing', icon: '🏢', defaults: { source: 'corporate' } },
  { id: 'tpl-group', name: 'Group', description: 'Multiple rooms booking', icon: '👥', defaults: { adults: 2, children: 0 } },
  { id: 'tpl-vip', name: 'VIP', description: 'VIP guest with premium service', icon: '⭐', defaults: { source: 'walk_in', specialRequests: 'VIP guest - premium service' } },
  { id: 'tpl-returning', name: 'Returning', description: 'Returning guest auto-fill', icon: '🔄', defaults: {} },
];

interface DraftStore {
  drafts: ReservationDraft[];
  templates: ReservationTemplate[];
  /** Save/update a draft */
  saveDraft: (draft: Omit<ReservationDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  /** Delete a draft */
  deleteDraft: (id: string) => void;
  /** Load all drafts from storage */
  loadDrafts: () => Promise<void>;
  /** Restore a draft into a new booking */
  restoreDraft: (id: string) => ReservationDraft | undefined;
  /** Get available next status transitions */
  getValidTransitions: (currentStatus: ReservationStatus) => ReservationStatus[];
  /** Validate a status transition */
  canTransition: (from: ReservationStatus, to: ReservationStatus) => boolean;
  /** Get smart suggestions for a returning guest */
  getSuggestions: (guestHistory: { previousRoomType?: string; previousFloor?: number; preferredPayment?: string; totalStays: number }) => SmartSuggestion[];
  /** Get a template by id */
  getTemplate: (id: string) => ReservationTemplate | undefined;
}

let draftCounter = 0;

export const useDraftStore = create<DraftStore>((set, get) => ({
  drafts: [],
  templates: TEMPLATES,

  saveDraft: (draftData) => {
    const now = new Date().toISOString();
    if (draftData.id) {
      set(s => ({
        drafts: s.drafts.map(d => d.id === draftData.id ? { ...d, ...draftData, updatedAt: now } : d),
      }));
    } else {
      const draft: ReservationDraft = {
        ...draftData,
        id: `draft-${++draftCounter}`,
        createdAt: now,
        updatedAt: now,
      };
      set(s => ({ drafts: [...s.drafts, draft] }));
    }
    // Persist to AsyncStorage
    AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(get().drafts)).catch(() => {});
  },

  deleteDraft: (id) => {
    set(s => ({ drafts: s.drafts.filter(d => d.id !== id) }));
    AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(get().drafts)).catch(() => {});
  },

  loadDrafts: async () => {
    try {
      const data = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (data) {
        set({ drafts: JSON.parse(data) });
      }
    } catch {}
  },

  restoreDraft: (id) => {
    return get().drafts.find(d => d.id === id);
  },

  getValidTransitions: (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus] || [];
  },

  canTransition: (from, to) => {
    return (STATUS_TRANSITIONS[from] || []).includes(to);
  },

  getSuggestions: (guestHistory) => {
    const suggestions: SmartSuggestion[] = [];
    if (guestHistory.previousRoomType) {
      suggestions.push({
        type: 'preferred_room',
        label: 'Previous room type',
        value: guestHistory.previousRoomType,
        confidence: 85,
      });
    }
    if (guestHistory.preferredPayment) {
      suggestions.push({
        type: 'preferred_payment',
        label: 'Preferred payment',
        value: guestHistory.preferredPayment,
        confidence: 70,
      });
    }
    if (guestHistory.totalStays > 2) {
      suggestions.push({
        type: 'upgrade',
        label: 'Upgrade opportunity',
        value: 'Returning guest - consider upgrade',
        confidence: 60,
      });
    }
    return suggestions;
  },

  getTemplate: (id) => {
    return TEMPLATES.find(t => t.id === id);
  },
}));
