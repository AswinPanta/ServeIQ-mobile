import { create } from 'zustand';

interface GuestProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  vip: boolean;
  blacklisted: boolean;
  totalStays: number;
  totalSpent: number;
  loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  notes: string;
  created_at: string;
}

interface GuestStore {
  guests: GuestProfile[];
  addGuest: (guest: Omit<GuestProfile, 'id' | 'created_at' | 'totalStays' | 'totalSpent' | 'loyaltyTier' | 'loyaltyPoints' | 'vip' | 'blacklisted'>) => GuestProfile;
  getGuest: (id: string) => GuestProfile | undefined;
  findGuest: (query: string) => GuestProfile[];
  recordStay: (guestId: string, amount: number) => void;
  earnPoints: (guestId: string, points: number) => void;
  redeemPoints: (guestId: string, points: number) => boolean;
  addNote: (guestId: string, note: string) => void;
  getLoyaltyTier: (points: number) => GuestProfile['loyaltyTier'];
  toggleVip: (guestId: string) => void;
}

let guestCounter = 100;

const INITIAL_GUESTS: GuestProfile[] = [
  { id: 'g1', name: 'Alice Johnson', email: 'alice@email.com', phone: '+977-9841234567', nationality: 'US', documentType: 'Passport', documentNumber: 'P123456', vip: false, blacklisted: false, totalStays: 3, totalSpent: 45000, loyaltyTier: 'silver', loyaltyPoints: 1200, notes: '', created_at: '2026-01-15T10:00:00Z' },
  { id: 'g2', name: 'Bob Williams', email: 'bob@email.com', phone: '+977-9847654321', nationality: 'UK', documentType: 'Passport', documentNumber: 'P789012', vip: true, blacklisted: false, totalStays: 8, totalSpent: 180000, loyaltyTier: 'gold', loyaltyPoints: 4500, notes: 'Prefers top floor, non-smoking', created_at: '2025-11-01T10:00:00Z' },
  { id: 'g3', name: 'Carol Davis', email: 'carol@email.com', phone: '+977-9851122334', nationality: 'CA', documentType: 'Passport', documentNumber: 'P345678', vip: false, blacklisted: false, totalStays: 1, totalSpent: 11701, loyaltyTier: 'standard', loyaltyPoints: 300, notes: '', created_at: '2026-07-02T10:00:00Z' },
  { id: 'g4', name: 'David Brown', email: 'david@email.com', phone: '+977-9849988776', nationality: 'AU', documentType: 'Drivers License', documentNumber: 'DL901234', vip: false, blacklisted: false, totalStays: 2, totalSpent: 38000, loyaltyTier: 'silver', loyaltyPoints: 1800, notes: 'Allergic to feathers', created_at: '2026-03-10T10:00:00Z' },
  { id: 'g5', name: 'Eve Martin', email: 'eve@email.com', phone: '+977-9865544332', nationality: 'NZ', documentType: 'Passport', documentNumber: 'P567890', vip: false, blacklisted: false, totalStays: 1, totalSpent: 6270, loyaltyTier: 'standard', loyaltyPoints: 150, notes: '', created_at: '2026-07-03T10:00:00Z' },
];

export const useGuestStore = create<GuestStore>((set, get) => ({
  guests: INITIAL_GUESTS,

  addGuest: (data) => {
    const guest: GuestProfile = {
      ...data,
      id: `g${++guestCounter}`,
      created_at: new Date().toISOString(),
      totalStays: 0,
      totalSpent: 0,
      loyaltyTier: 'standard',
      loyaltyPoints: 0,
      vip: false,
      blacklisted: false,
    };
    set((state) => ({ guests: [...state.guests, guest] }));
    return guest;
  },

  getGuest: (id) => get().guests.find((g) => g.id === id),

  findGuest: (query) => {
    const q = query.toLowerCase();
    return get().guests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q)
    );
  },

  recordStay: (guestId, amount) =>
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId
          ? { ...g, totalStays: g.totalStays + 1, totalSpent: g.totalSpent + amount }
          : g
      ),
    })),

  earnPoints: (guestId, points) =>
    set((state) => ({
      guests: state.guests.map((g) => {
        if (g.id !== guestId) return g;
        const newPoints = g.loyaltyPoints + points;
        return { ...g, loyaltyPoints: newPoints, loyaltyTier: get().getLoyaltyTier(newPoints) };
      }),
    })),

  redeemPoints: (guestId, points) => {
    const guest = get().guests.find((g) => g.id === guestId);
    if (!guest || guest.loyaltyPoints < points) return false;
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints - points } : g
      ),
    }));
    return true;
  },

  addNote: (guestId, note) =>
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, notes: g.notes ? `${g.notes}\n${note}` : note } : g
      ),
    })),

  getLoyaltyTier: (points) => {
    if (points >= 5000) return 'platinum';
    if (points >= 2000) return 'gold';
    if (points >= 500) return 'silver';
    return 'standard';
  },

  toggleVip: (guestId) =>
    set((state) => ({
      guests: state.guests.map((g) => (g.id === guestId ? { ...g, vip: !g.vip } : g)),
    })),
}));
