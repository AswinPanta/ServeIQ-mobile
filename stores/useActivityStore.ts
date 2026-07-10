import { create } from 'zustand';

export interface Activity {
  id: string;
  type: 'checkin' | 'checkout' | 'booking' | 'payment' | 'hk' | 'order' | 'maintenance' | 'note' | 'email';
  title: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
  property_id?: string;
}

interface ActivityStore {
  propertyId: string;
  activities: Activity[];
  setPropertyId: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
  getRecent: (limit?: number) => Activity[];
  getToday: () => Activity[];
}

const ICON_MAP: Record<string, string> = {
  checkin: '🔑',
  checkout: '🚪',
  booking: '📅',
  payment: '💳',
  hk: '🧹',
  order: '🍽️',
  maintenance: '🔧',
  note: '📝',
  email: '✉️',
};

const COLOR_MAP: Record<string, string> = {
  checkin: '#22C55E',
  checkout: '#3B82F6',
  booking: '#8B5CF6',
  payment: '#F59E0B',
  hk: '#06B6D4',
  order: '#F97316',
  maintenance: '#EF4444',
  note: '#64748B',
  email: '#8B5CF6',
};

let activityCounter = 0;

const PROP_1_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'checkin', title: 'Carol Davis checked in', description: 'Room 102 - Standard', icon: '🔑', color: '#22C55E', createdAt: new Date(Date.now() - 3600000).toISOString(), property_id: 'prop-1' },
  { id: 'a2', type: 'checkout', title: 'David Brown checked out', description: 'Room 201 - Deluxe', icon: '🚪', color: '#3B82F6', createdAt: new Date(Date.now() - 7200000).toISOString(), property_id: 'prop-1' },
  { id: 'a3', type: 'booking', title: 'New booking - Alice Johnson', description: 'Deluxe - Jul 4-7', icon: '📅', color: '#8B5CF6', createdAt: new Date(Date.now() - 14400000).toISOString(), property_id: 'prop-1' },
  { id: 'a4', type: 'payment', title: 'Payment received - Eve Martin', description: '₹6,270 via Card', icon: '💳', color: '#F59E0B', createdAt: new Date(Date.now() - 18000000).toISOString(), property_id: 'prop-1' },
  { id: 'a5', type: 'hk', title: 'Room 103 cleaning started', description: 'Assigned to Sita', icon: '🧹', color: '#06B6D4', createdAt: new Date(Date.now() - 21600000).toISOString(), property_id: 'prop-1' },
];

const PROP_2_ACTIVITIES: Activity[] = [
  { id: 'b1', type: 'checkin', title: 'Pema Sherpa checked in', description: 'Room 102 - Standard', icon: '🔑', color: '#22C55E', createdAt: new Date(Date.now() - 1800000).toISOString(), property_id: 'prop-2' },
  { id: 'b2', type: 'booking', title: 'New booking - Mingma Tamang', description: 'Deluxe - Jul 10-12', icon: '📅', color: '#8B5CF6', createdAt: new Date(Date.now() - 5400000).toISOString(), property_id: 'prop-2' },
  { id: 'b3', type: 'checkout', title: 'Sunita Rai checked out', description: 'Room 101 - Standard', icon: '🚪', color: '#3B82F6', createdAt: new Date(Date.now() - 10800000).toISOString(), property_id: 'prop-2' },
  { id: 'b4', type: 'hk', title: 'Room 104 cleaning started', description: 'Assigned to Deepak', icon: '🧹', color: '#06B6D4', createdAt: new Date(Date.now() - 14400000).toISOString(), property_id: 'prop-2' },
];

const PROP_3_ACTIVITIES: Activity[] = [
  { id: 'c1', type: 'checkin', title: 'Henry Taylor checked in', description: 'Villa A - Suite', icon: '🔑', color: '#22C55E', createdAt: new Date(Date.now() - 7200000).toISOString(), property_id: 'prop-3' },
  { id: 'c2', type: 'hk', title: 'Villa D cleaning started', description: 'Assigned to Goma', icon: '🧹', color: '#06B6D4', createdAt: new Date(Date.now() - 3600000).toISOString(), property_id: 'prop-3' },
];

function getActivitiesForProperty(propertyId: string): Activity[] {
  switch (propertyId) {
    case 'prop-2': return PROP_2_ACTIVITIES;
    case 'prop-3': return PROP_3_ACTIVITIES;
    default: return PROP_1_ACTIVITIES;
  }
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  propertyId: 'prop-1',
  activities: PROP_1_ACTIVITIES,

  setPropertyId: (id) => {
    if (id === get().propertyId) return;
    set({ propertyId: id, activities: getActivitiesForProperty(id) });
  },

  addActivity: (activity) =>
    set((state) => ({
      activities: [
        {
          ...activity,
          id: `act-${++activityCounter}`,
          icon: activity.icon || ICON_MAP[activity.type] || '📌',
          color: activity.color || COLOR_MAP[activity.type] || '#64748B',
          createdAt: new Date().toISOString(),
          property_id: activity.property_id || state.propertyId,
        },
        ...state.activities,
      ],
    })),

  getRecent: (limit = 10) => get().activities.slice(0, limit),

  getToday: () => {
    const today = new Date().toDateString();
    return get().activities.filter((a) => new Date(a.createdAt).toDateString() === today);
  },
}));
