import { create } from 'zustand';
import { useOrderStore } from './useOrderStore';

interface AnalyticsStore {
  getTodayRevenue: () => number;
  getOrderCount: () => number;
  getAvgOrderValue: () => number;
  getTopItems: (limit?: number) => { name: string; count: number; revenue: number }[];
  getCategoryRevenue: () => { category: string; revenue: number }[];
  getRevenueTrend: () => { date: string; revenue: number }[];
}

export const useAnalyticsStore = create<AnalyticsStore>(() => ({
  getTodayRevenue: () => {
    const orders = useOrderStore.getState().completedOrders;
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.completedAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
  },

  getOrderCount: () => {
    const orders = useOrderStore.getState().completedOrders;
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.completedAt).toDateString() === today).length;
  },

  getAvgOrderValue: () => {
    const orders = useOrderStore.getState().completedOrders;
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.completedAt).toDateString() === today);
    return todayOrders.length ? Math.round(todayOrders.reduce((s, o) => s + o.total, 0) / todayOrders.length) : 0;
  },

  getTopItems: (limit = 5) => {
    const orders = useOrderStore.getState().completedOrders;
    const itemCount: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemCount[item.name]) itemCount[item.name] = { count: 0, revenue: 0 };
        itemCount[item.name].count += item.quantity;
        itemCount[item.name].revenue += item.unit_price * item.quantity;
      });
    });
    return Object.entries(itemCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  getCategoryRevenue: () => {
    const orders = useOrderStore.getState().completedOrders;
    const categoryRev: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.name.includes('Pizza') || item.name.includes('Burger') || item.name.includes('Salad') || item.name.includes('Fries') || item.name.includes('Pasta') || item.name.includes('Sandwich') || item.name.includes('Chicken') ? 'Food' : item.name.includes('Tea') || item.name.includes('Juice') || item.name.includes('Coffee') || item.name.includes('Lassi') || item.name.includes('Water') ? 'Beverages' : 'Desserts';
        categoryRev[cat] = (categoryRev[cat] || 0) + item.unit_price * item.quantity;
      });
    });
    return Object.entries(categoryRev).map(([category, revenue]) => ({ category, revenue }));
  },

  getRevenueTrend: () => {
    const orders = useOrderStore.getState().completedOrders;
    const daily: Record<string, number> = {};
    orders.forEach((o) => {
      const date = new Date(o.completedAt).toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + o.total;
    });
    return Object.entries(daily)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  },
}));
