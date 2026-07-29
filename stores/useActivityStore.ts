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

let activityCounter = 0;

export const useActivityStore = create<ActivityStore>((set, get) => ({
  propertyId: 'prop-1',
  activities: [],

  setPropertyId: (id) => {
    set({ propertyId: id });
  },

  addActivity: (activity) =>
    set((state) => ({
      activities: [
        {
          ...activity,
          id: `act-${++activityCounter}`,
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
