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

const INITIAL_GUESTS: GuestProfile[] = [
  { id: 'g1', name: 'Alice Johnson', email: 'alice@email.com', phone: '+977-9841234567', nationality: 'US', documentType: 'Passport', documentNumber: 'P123456', vip: false, blacklisted: false, totalStays: 3, totalSpent: 45000, loyaltyTier: 'silver', loyaltyPoints: 1200, notes: '', created_at: '2026-01-15T10:00:00Z' },
  { id: 'g2', name: 'Bob Williams', email: 'bob@email.com', phone: '+977-9847654321', nationality: 'UK', documentType: 'Passport', documentNumber: 'P789012', vip: true, blacklisted: false, totalStays: 8, totalSpent: 180000, loyaltyTier: 'gold', loyaltyPoints: 4500, notes: 'Prefers top floor, non-smoking', created_at: '2025-11-01T10:00:00Z' },
  { id: 'g3', name: 'Carol Davis', email: 'carol@email.com', phone: '+977-9851122334', nationality: 'CA', documentType: 'Passport', documentNumber: 'P345678', vip: false, blacklisted: false, totalStays: 1, totalSpent: 11701, loyaltyTier: 'standard', loyaltyPoints: 300, notes: '', created_at: '2026-07-02T10:00:00Z' },
  { id: 'g4', name: 'David Brown', email: 'david@email.com', phone: '+977-9849988776', nationality: 'AU', documentType: 'Drivers License', documentNumber: 'DL901234', vip: false, blacklisted: false, totalStays: 2, totalSpent: 38000, loyaltyTier: 'silver', loyaltyPoints: 1800, notes: 'Allergic to feathers', created_at: '2026-03-10T10:00:00Z' },
  { id: 'g5', name: 'Eve Martin', email: 'eve@email.com', phone: '+977-9865544332', nationality: 'NZ', documentType: 'Passport', documentNumber: 'P567890', vip: false, blacklisted: false, totalStays: 1, totalSpent: 6270, loyaltyTier: 'standard', loyaltyPoints: 150, notes: '', created_at: '2026-07-03T10:00:00Z' },
  { id: 'g6', name: 'Frank Green', email: 'frank@email.com', phone: '+977-9856677889', nationality: 'DE', documentType: 'Passport', documentNumber: 'P678901', vip: false, blacklisted: false, totalStays: 2, totalSpent: 25000, loyaltyTier: 'silver', loyaltyPoints: 1000, notes: 'Speaks German', created_at: '2026-04-20T10:00:00Z' },
  { id: 'g7', name: 'Grace Lee', email: 'grace@email.com', phone: '+977-9812345678', nationality: 'KR', documentType: 'Passport', documentNumber: 'P789012', vip: true, blacklisted: false, totalStays: 5, totalSpent: 120000, loyaltyTier: 'gold', loyaltyPoints: 3500, notes: 'VIP - Corporate account', created_at: '2025-08-15T10:00:00Z' },
  { id: 'g8', name: 'Henry Wilson', email: 'henry@email.com', phone: '+977-9845678912', nationality: 'US', documentType: 'Passport', documentNumber: 'P890123', vip: false, blacklisted: false, totalStays: 4, totalSpent: 85000, loyaltyTier: 'gold', loyaltyPoints: 3200, notes: 'Prefers quiet rooms', created_at: '2025-12-01T10:00:00Z' },
  { id: 'g9', name: 'Irene Taylor', email: 'irene@email.com', phone: '+977-9856789123', nationality: 'GB', documentType: 'Passport', documentNumber: 'P901234', vip: false, blacklisted: false, totalStays: 6, totalSpent: 95000, loyaltyTier: 'gold', loyaltyPoints: 2800, notes: 'Regular guest', created_at: '2025-09-10T10:00:00Z' },
  { id: 'g10', name: 'Jack Black', email: 'jack@email.com', phone: '+977-9867891234', nationality: 'US', documentType: 'Passport', documentNumber: 'P012345', vip: false, blacklisted: true, totalStays: 5, totalSpent: 110000, loyaltyTier: 'gold', loyaltyPoints: 4200, notes: 'BLACKLISTED - Property damage on last stay', created_at: '2025-07-01T10:00:00Z' },
];

let guestCounter = 10;
function nextGuestId() { return `g${++guestCounter}`; }

export const useGuestStore = create<GuestStore>((set, get) => ({
  guests: INITIAL_GUESTS,

  addGuest: (data) => {
    const guest: GuestProfile = {
      ...data,
      id: nextGuestId(),
      vip: false,
      blacklisted: false,
      totalStays: 0,
      totalSpent: 0,
      loyaltyTier: 'standard',
      loyaltyPoints: 0,
      created_at: new Date().toISOString(),
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
      guests: state.guests.map((g) => {
        if (g.id !== guestId) return g;
        const totalStays = g.totalStays + 1;
        const totalSpent = g.totalSpent + amount;
        const points = g.loyaltyPoints + Math.floor(amount * 0.1);
        return { ...g, totalStays, totalSpent, loyaltyPoints: points, loyaltyTier: getTier(points) };
      }),
    })),

  earnPoints: (guestId, points) =>
    set((state) => ({
      guests: state.guests.map((g) => {
        if (g.id !== guestId) return g;
        const newPoints = g.loyaltyPoints + points;
        return { ...g, loyaltyPoints: newPoints, loyaltyTier: getTier(newPoints) };
      }),
    })),

  redeemPoints: (guestId, points) => {
    const guest = get().guests.find((g) => g.id === guestId);
    if (!guest || guest.loyaltyPoints < points) return false;
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints - points, loyaltyTier: getTier(g.loyaltyPoints - points) } : g
      ),
    }));
    return true;
  },

  addNote: (guestId, note) =>
    set((state) => ({
      guests: state.guests.map((g) => (g.id === guestId ? { ...g, notes: g.notes + (g.notes ? '\n' : '') + note } : g)),
    })),

  getLoyaltyTier: (points) => getTier(points),

  toggleVip: (guestId) =>
    set((state) => ({
      guests: state.guests.map((g) => (g.id === guestId ? { ...g, vip: !g.vip } : g)),
    })),
}));

function getTier(points: number): GuestProfile['loyaltyTier'] {
  if (points >= 5000) return 'platinum';
  if (points >= 2000) return 'gold';
  if (points >= 500) return 'silver';
  return 'standard';
}
