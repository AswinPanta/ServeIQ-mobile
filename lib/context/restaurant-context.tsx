import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { operationsApi } from '@/lib/api/operations-api';

export type TableStatus = 'Free' | 'Occupied' | 'Reserved';

// ─── Time-based menu types (MN-004) ────────────────────────────────────────
export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'all_day';

export const MEAL_PERIODS: { period: MealPeriod; label: string; start: number; end: number }[] = [
  { period: 'breakfast', label: 'Breakfast', start: 7, end: 11 },
  { period: 'lunch', label: 'Lunch', start: 12, end: 15 },
  { period: 'dinner', label: 'Dinner', start: 18, end: 23 },
];

export function getCurrentMealPeriod(): MealPeriod {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 11) return 'breakfast';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 18 && hour < 23) return 'dinner';
  return 'all_day';
}

export function formatMealPeriod(period: MealPeriod): string {
  const map: Record<MealPeriod, string> = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', all_day: '📋 All Day' };
  return map[period];
}

// ─── Happy Hour types (MN-006) ──────────────────────────────────────────────
export interface HappyHourConfig {
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startHour: number;
  endHour: number;
  discountPercentage: number;
}

export const DEFAULT_HAPPY_HOUR: HappyHourConfig = {
  enabled: true,
  days: [0, 1, 2, 3, 4, 5, 6],
  startHour: 17,
  endHour: 19,
  discountPercentage: 15,
};

export function isHappyHourNow(config: HappyHourConfig = DEFAULT_HAPPY_HOUR): boolean {
  if (!config.enabled) return false;
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return config.days.includes(day) && hour >= config.startHour && hour < config.endHour;
}


export interface TableData {
  id: string;
  capacity: number;
  status: TableStatus;
}

export interface SectionData {
  name: string;
  icon: string;
  color: string;
  tables: TableData[];
}

// MN-003: Menu modifiers (size, extra toppings, cooking preference)
export interface MenuModifierOption {
  label: string;
  price: number;
}

export interface MenuModifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  options: MenuModifierOption[];
}

export interface MenuItemDef {
  id: string;
  name: string;
  price: number;
  modifiers?: MenuModifier[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  modifiers?: { name: string; option: string; price: number }[];
}



export interface KDSTicketItem {
  name: string;
  qty: number;
}

export interface KDSTicketData {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: KDSTicketItem[];
  status: 'New' | 'Preparing' | 'Ready';
  timeSinceOrdered: string;
  notes?: string;
  createdAt: number;
}

export interface CompletedOrder {
  tableId: string;
  items: { id: string; name: string; price: number; qty: number; category: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  completedAt: number;
}

// PO-006: Staff discount limit
let _activeStaffDiscountLimit = 10; // Default max discount % for current POS session

export function setStaffDiscountLimit(limit: number) {
  _activeStaffDiscountLimit = limit;
}

export function getStaffDiscountLimit() {
  return _activeStaffDiscountLimit;
}

interface RestaurantContextValue {
  menuCategories: readonly string[];
  menuItems: Record<string, MenuItemDef[]>;
  sections: SectionData[];
  getTable: (id: string) => TableData | undefined;
  updateTableStatus: (id: string, status: TableStatus) => void;
  cart: Record<string, CartItem[]>;
  addToCart: (tableId: string, item: MenuItemDef) => void;
  removeFromCart: (tableId: string, itemId: string) => void;
  clearCart: (tableId: string) => void;
  getCartTotal: (tableId: string) => number;
  tickets: KDSTicketData[];
  placeOrder: (tableId: string, notes?: string) => void;
  advanceTicketStatus: (ticketId: string) => void;
  completedOrders: CompletedOrder[];
  completePayment: (tableId: string, discountType: 'none' | 'percentage' | 'fixed', discountValue: number, paymentMethod: string) => void;
  getTodayRevenue: () => number;
  getOrderCount: () => number;
  getAvgOrderValue: () => number;
  getTopItems: () => { name: string; count: number; revenue: number }[];
  getCategoryRevenue: () => { label: string; percentage: number; color: string }[];
  getRevenueTrend: () => { label: string; value: number }[];
  getTodayStats: () => { revenue: number; orders: number; avgOrder: number; turnover: string };

  // MN-004: Time-based menus
  currentMealPeriod: MealPeriod;
  getMenuForPeriod: (period: MealPeriod) => MenuItemDef[];

  // MN-006: Happy hour
  happyHourConfig: HappyHourConfig;
  setHappyHourConfig: (config: HappyHourConfig) => void;
  isHappyHour: boolean;

  // RS-005: Table-turn timers
  tableTurnTimers: Record<string, number>;
  getTableElapsedMinutes: (tableId: string) => number;

  // PO-007: Split bill
  splitBill: (tableId: string, parts: number) => { partTotal: number; parts: { items: CartItem[]; total: number }[] };
}

const MENU_CATEGORIES = ['Food', 'Beverages', 'Desserts'] as const;

// MN-003: Menu items with modifiers support
const BUTTER_CHICKEN_MODIFIERS: MenuModifier[] = [
  { id: 'm1', name: 'Spice Level', type: 'single', options: [{ label: 'Mild', price: 0 }, { label: 'Medium', price: 0 }, { label: 'Spicy', price: 0 }, { label: 'Extra Spicy', price: 0 }] },
  { id: 'm2', name: 'Add-ons', type: 'multiple', options: [{ label: 'Extra Butter', price: 30 }, { label: 'Extra Cream', price: 40 }, { label: 'Cheese', price: 50 }] },
];

const BIRYANI_MODIFIERS: MenuModifier[] = [
  { id: 'm3', name: 'Portion Size', type: 'single', options: [{ label: 'Regular', price: 0 }, { label: 'Large', price: 120 }, { label: 'Jumbo', price: 200 }] },
  { id: 'm4', name: 'Add Protein', type: 'multiple', options: [{ label: 'Extra Chicken', price: 100 }, { label: 'Extra Egg', price: 30 }, { label: 'Extra Vegetables', price: 50 }] },
];

const ICE_CREAM_MODIFIERS: MenuModifier[] = [
  { id: 'm7', name: 'Flavor', type: 'single', options: [{ label: 'Vanilla', price: 0 }, { label: 'Chocolate', price: 0 }, { label: 'Strawberry', price: 0 }, { label: 'Mango', price: 20 }, { label: 'Pista', price: 10 }] },
  { id: 'm8', name: 'Toppings', type: 'multiple', options: [{ label: 'Chocolate Syrup', price: 20 }, { label: 'Nuts', price: 25 }, { label: 'Cherry', price: 15 }] },
];

const MENU_ITEMS: Record<string, MenuItemDef[]> = {
  Food: [
    { id: 'f1', name: 'Butter Chicken', price: 450, modifiers: BUTTER_CHICKEN_MODIFIERS },
    { id: 'f2', name: 'Dal Makhani', price: 350 },
    { id: 'f3', name: 'Naan (2 pcs)', price: 80 },
    { id: 'f4', name: 'Biryani', price: 420, modifiers: BIRYANI_MODIFIERS },
    { id: 'f5', name: 'Paneer Tikka', price: 380 },
    { id: 'f6', name: 'Roti (2 pcs)', price: 60 },
    { id: 'f7', name: 'Chicken Curry', price: 400 },
    { id: 'f8', name: 'Fish Fry', price: 500 },
  ],
  Beverages: [
    { id: 'b1', name: 'Masala Chai', price: 60 },
    { id: 'b2', name: 'Fresh Lime Soda', price: 120 },
    { id: 'b3', name: 'Mango Lassi', price: 150 },
    { id: 'b4', name: 'Mineral Water', price: 40 },
    { id: 'b5', name: 'Soft Drink', price: 80 },
    { id: 'b6', name: 'Fresh Juice', price: 180 },
  ],
  Desserts: [
    { id: 'd1', name: 'Gulab Jamun (2 pcs)', price: 120 },
    { id: 'd2', name: 'Ice Cream (1 scoop)', price: 100, modifiers: ICE_CREAM_MODIFIERS },
    { id: 'd3', name: 'Kheer', price: 140 },
    { id: 'd4', name: 'Fruit Custard', price: 160 },
    { id: 'd5', name: 'Brownie', price: 200 },
  ],
};

const INITIAL_SECTIONS: SectionData[] = [
  {
    name: 'Indoor',
    icon: '🏠',
    color: '#0891B2',
    tables: [
      { id: 'T1', capacity: 2, status: 'Free' },
      { id: 'T2', capacity: 4, status: 'Occupied' },
      { id: 'T3', capacity: 2, status: 'Reserved' },
      { id: 'T4', capacity: 6, status: 'Free' },
    ],
  },
  {
    name: 'Outdoor',
    icon: '🌿',
    color: '#059669',
    tables: [
      { id: 'T5', capacity: 4, status: 'Occupied' },
      { id: 'T6', capacity: 4, status: 'Free' },
      { id: 'T7', capacity: 2, status: 'Occupied' },
      { id: 'T8', capacity: 6, status: 'Occupied' },
    ],
  },
];

const ITEM_CATEGORY_MAP: Record<string, string> = {
  f1: 'Food', f2: 'Food', f3: 'Food', f4: 'Food', f5: 'Food', f6: 'Food', f7: 'Food', f8: 'Food',
  b1: 'Beverages', b2: 'Beverages', b3: 'Beverages', b4: 'Beverages', b5: 'Beverages', b6: 'Beverages',
  d1: 'Desserts', d2: 'Desserts', d3: 'Desserts', d4: 'Desserts', d5: 'Desserts',
};

let ticketCounter = 5;
let orderCounter = 5;
function nextTicketId() { return String(++ticketCounter); }
function nextOrderNumber() { return `ORD-${String(++orderCounter).padStart(3, '0')}`; }
function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<SectionData[]>(INITIAL_SECTIONS);
  const [cart, setCart] = useState<Record<string, CartItem[]>>({
    T2: [
      { id: 'f1', name: 'Butter Chicken', price: 450, qty: 1 },
      { id: 'f3', name: 'Naan (2 pcs)', price: 80, qty: 2 },
      { id: 'f2', name: 'Dal Makhani', price: 350, qty: 1 },
    ],
    T5: [
      { id: 'f4', name: 'Biryani', price: 420, qty: 2 },
      { id: 'd1', name: 'Gulab Jamun (2 pcs)', price: 120, qty: 2 },
    ],
    T7: [
      { id: 'f5', name: 'Paneer Tikka', price: 380, qty: 1 },
      { id: 'b1', name: 'Masala Chai', price: 60, qty: 2 },
    ],
    T8: [
      { id: 'f1', name: 'Butter Chicken', price: 450, qty: 2 },
      { id: 'f3', name: 'Naan (2 pcs)', price: 80, qty: 4 },
      { id: 'b5', name: 'Soft Drink', price: 80, qty: 2 },
      { id: 'd3', name: 'Kheer', price: 140, qty: 1 },
    ],
  });
  const [tickets, setTickets] = useState<KDSTicketData[]>([
    { id: '1', orderNumber: 'ORD-001', tableNumber: 'T2', items: [{ name: 'Butter Chicken', qty: 1 }, { name: 'Naan (2 pcs)', qty: 2 }, { name: 'Dal Makhani', qty: 1 }], status: 'Preparing', timeSinceOrdered: '8 min', createdAt: Date.now() - 480000 },
    { id: '2', orderNumber: 'ORD-002', tableNumber: 'T5', items: [{ name: 'Biryani', qty: 2 }, { name: 'Gulab Jamun', qty: 2 }], status: 'Preparing', timeSinceOrdered: '12 min', createdAt: Date.now() - 720000 },
    { id: '3', orderNumber: 'ORD-003', tableNumber: 'T7', items: [{ name: 'Paneer Tikka', qty: 1 }, { name: 'Masala Chai', qty: 2 }], status: 'New', timeSinceOrdered: '1 min', createdAt: Date.now() - 60000, notes: 'Extra spicy' },
    { id: '4', orderNumber: 'ORD-004', tableNumber: 'T8', items: [{ name: 'Butter Chicken', qty: 2 }, { name: 'Naan (2 pcs)', qty: 4 }, { name: 'Soft Drink', qty: 2 }, { name: 'Kheer', qty: 1 }], status: 'New', timeSinceOrdered: '3 min', createdAt: Date.now() - 180000 },
    { id: '5', orderNumber: 'ORD-005', tableNumber: 'T1', items: [{ name: 'Fresh Lime Soda', qty: 1 }], status: 'Ready', timeSinceOrdered: '15 min', createdAt: Date.now() - 900000 },
  ]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);

  // MN-004: Time-based menu
  const [currentMealPeriod, setCurrentMealPeriod] = useState<MealPeriod>(getCurrentMealPeriod());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMealPeriod(getCurrentMealPeriod());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    operationsApi.getMenu(() => []).then(apiMenu => {
      if (apiMenu.length > 0) {
        // Menu shape differs — kept for future mapping
      }
    });
    operationsApi.getTables(() => []).then(apiTables => {
      if (apiTables.length > 0) setSections(apiTables as any);
    });
    operationsApi.getOrders(() => []).then(apiOrders => {
      if (apiOrders.length > 0) {
        // Orders shape differs — kept for future mapping
      }
    });
    operationsApi.getKdsTickets(() => []).then(apiTickets => {
      if (apiTickets.length > 0) setTickets(apiTickets as any);
    });
  }, []);

  const getMenuForPeriod = useCallback((period: MealPeriod): MenuItemDef[] => {
    if (period === 'all_day') {
      return Object.values(MENU_ITEMS).flat();
    }
    if (period === 'breakfast') {
      // Breakfast: lighter items (filter by id prefix)
      return [
        ...MENU_ITEMS.Beverages.filter(i => ['b1', 'b3'].includes(i.id)),
        { id: 'bf1', name: 'Paratha (2 pcs)', price: 120 },
        { id: 'bf2', name: 'Egg Omelette', price: 100 },
        { id: 'bf3', name: 'Toast with Jam', price: 80 },
        { id: 'bf4', name: 'Cereal Bowl', price: 150 },
      ];
    }
    if (period === 'lunch') {
      // Full lunch menu
      return Object.values(MENU_ITEMS).flat();
    }
    // Dinner: similar to lunch
    return Object.values(MENU_ITEMS).flat();
  }, []);

  // MN-006: Happy hour
  const [happyHourConfig, setHappyHourConfig] = useState<HappyHourConfig>(DEFAULT_HAPPY_HOUR);
  const isHappyHour = isHappyHourNow(happyHourConfig);

  // RS-005: Table-turn timers
  const [tableTurnTimers, setTableTurnTimers] = useState<Record<string, number>>({});

  const getTableElapsedMinutes = useCallback((tableId: string): number => {
    const start = tableTurnTimers[tableId];
    if (!start) return 0;
    return Math.floor((Date.now() - start) / 60000);
  }, [tableTurnTimers]);

  // PO-007: Split bill
  const splitBill = useCallback((tableId: string, parts: number) => {
    const items = cart[tableId] || [];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const partTotal = Math.round(total / parts);

    // Distribute items among parts
    const partItems: { items: CartItem[]; total: number }[] = [];
    let itemIdx = 0;
    for (let p = 0; p < parts; p++) {
      const pItems: CartItem[] = [];
      let pSum = 0;
      while (itemIdx < items.length && pSum + items[itemIdx].price * items[itemIdx].qty <= partTotal) {
        const item = items[itemIdx];
        pItems.push(item);
        pSum += item.price * item.qty;
        itemIdx++;
      }
      if (p === parts - 1 && itemIdx < items.length) {
        // Last part gets remaining items
        for (let i = itemIdx; i < items.length; i++) {
          pItems.push(items[i]);
          pSum += items[i].price * items[i].qty;
        }
      }
      partItems.push({ items: pItems, total: pSum });
    }
    return { partTotal, parts: partItems };
  }, [cart]);

  const getTable = useCallback((id: string) => {
    for (const s of sections) {
      const t = s.tables.find(tbl => tbl.id === id);
      if (t) return t;
    }
    return undefined;
  }, [sections]);

  const updateTableStatus = useCallback((id: string, status: TableStatus) => {
    setSections(prev => prev.map(s => ({
      ...s,
      tables: s.tables.map(t => t.id === id ? { ...t, status } : t),
    })));
  }, []);

  const addToCart = useCallback((tableId: string, item: MenuItemDef) => {
    setCart(prev => {
      const current = prev[tableId] || [];
      const existing = current.find(i => i.id === item.id);
      if (existing) {
        return { ...prev, [tableId]: current.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) };
      }
      // Start table-turn timer when first item is added
      if (current.length === 0) {
        setTableTurnTimers(prev => ({ ...prev, [tableId]: Date.now() }));
      }
      const cartItem: CartItem = { id: item.id, name: item.name, price: item.price, qty: 1 };
      return { ...prev, [tableId]: [...current, cartItem] };
    });
    updateTableStatus(tableId, 'Occupied');
  }, [updateTableStatus]);

  const removeFromCart = useCallback((tableId: string, itemId: string) => {
    setCart(prev => {
      const current = prev[tableId] || [];
      const existing = current.find(i => i.id === itemId);
      if (existing && existing.qty <= 1) {
        const updated = { ...prev, [tableId]: current.filter(i => i.id !== itemId) };
        if (updated[tableId].length === 0) {
          const table = getTable(tableId);
          if (table && table.status === 'Occupied') {
            setTimeout(() => updateTableStatus(tableId, 'Free'), 0);
          }
        }
        return updated;
      }
      return { ...prev, [tableId]: current.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i) };
    });
  }, [getTable, updateTableStatus]);

  const clearCart = useCallback((tableId: string) => {
    setCart(prev => ({ ...prev, [tableId]: [] }));
    const table = getTable(tableId);
    if (table && table.status === 'Occupied') {
      updateTableStatus(tableId, 'Free');
    }
  }, [getTable, updateTableStatus]);

  const getCartTotal = useCallback((tableId: string) => {
    return (cart[tableId] || []).reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [cart]);

  const placeOrder = useCallback((tableId: string, notes?: string) => {
    const items = cart[tableId];
    if (!items || items.length === 0) return;
    const now = Date.now();
    const ticket: KDSTicketData = {
      id: nextTicketId(),
      orderNumber: nextOrderNumber(),
      tableNumber: tableId,
      items: items.map(i => ({ name: i.name, qty: i.qty })),
      status: 'New',
      timeSinceOrdered: 'just now',
      notes,
      createdAt: now,
    };
    operationsApi.createOrder({
      table_id: tableId,
      items: items.map(i => ({
        menu_item_id: i.id,
        name: i.name,
        quantity: i.qty,
        unit_price: i.price,
      })),
      notes,
    } as any, () => ({} as any));
    setTickets(prev => [...prev, ticket]);
    setCart(prev => ({ ...prev, [tableId]: [] }));
  }, [cart]);

  const advanceTicketStatus = useCallback((ticketId: string) => {
    setTickets(prev => {
      const ticket = prev.find(t => t.id === ticketId);
      if (ticket) {
        const apiStatus: Record<string, string> = { New: 'in_progress', Preparing: 'ready', Ready: 'ready' };
        operationsApi.updateKdsTicket(ticketId, { status: apiStatus[ticket.status] } as any, () => {});
      }
      return prev.map(t => {
        if (t.id !== ticketId) return t;
        const next: Record<string, 'New' | 'Preparing' | 'Ready'> = { New: 'Preparing', Preparing: 'Ready', Ready: 'Ready' };
        return { ...t, status: next[t.status] };
      });
    });
  }, []);

  const completePayment = useCallback((tableId: string, discountType: 'none' | 'percentage' | 'fixed', discountValue: number, paymentMethod: string) => {
    const items = cart[tableId];
    if (!items || items.length === 0) return;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = discountType === 'percentage'
      ? Math.round(subtotal * (discountValue / 100))
      : discountType === 'fixed'
      ? discountValue
      : 0;
    const tax = Math.round((subtotal - discount) * 0.1);
    const total = subtotal - discount + tax;
    const order: CompletedOrder = {
      tableId,
      items: items.map(i => ({ ...i, category: ITEM_CATEGORY_MAP[i.id] || 'Food' })),
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      completedAt: Date.now(),
    };
    setCompletedOrders(prev => [...prev, order]);
    setCart(prev => ({ ...prev, [tableId]: [] }));
    updateTableStatus(tableId, 'Free');
    setTickets(prev => prev.filter(t => t.tableNumber !== tableId));
  }, [cart, updateTableStatus]);

  const getTodayRevenue = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return completedOrders
      .filter(o => o.completedAt >= todayStart.getTime())
      .reduce((s, o) => s + o.total, 0);
  }, [completedOrders]);

  const getOrderCount = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return completedOrders.filter(o => o.completedAt >= todayStart.getTime()).length;
  }, [completedOrders]);

  const getAvgOrderValue = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = completedOrders.filter(o => o.completedAt >= todayStart.getTime());
    if (today.length === 0) return 0;
    return Math.round(today.reduce((s, o) => s + o.total, 0) / today.length);
  }, [completedOrders]);

  const getTopItems = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = completedOrders.filter(o => o.completedAt >= todayStart.getTime());
    const counts: Record<string, { count: number; revenue: number }> = {};
    for (const o of today) {
      for (const item of o.items) {
        if (!counts[item.name]) counts[item.name] = { count: 0, revenue: 0 };
        counts[item.name].count += item.qty;
        counts[item.name].revenue += item.price * item.qty;
      }
    }
    return Object.entries(counts)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completedOrders]);

  const getCategoryRevenue = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = completedOrders.filter(o => o.completedAt >= todayStart.getTime());
    const catRevenue: Record<string, number> = { Food: 0, Beverages: 0, Desserts: 0 };
    for (const o of today) {
      for (const item of o.items) {
        const cat = ITEM_CATEGORY_MAP[item.id] || 'Food';
        catRevenue[cat] = (catRevenue[cat] || 0) + item.price * item.qty;
      }
    }
    const total = Object.values(catRevenue).reduce((s, v) => s + v, 0);
    if (total === 0) {
      return [
        { label: 'Food', percentage: 72, color: '#0D9488' },
        { label: 'Beverages', percentage: 18, color: '#3B82F6' },
        { label: 'Desserts', percentage: 10, color: '#8B5CF6' },
      ];
    }
    return [
      { label: 'Food', percentage: Math.round((catRevenue.Food / total) * 100), color: '#0D9488' },
      { label: 'Beverages', percentage: Math.round((catRevenue.Beverages / total) * 100), color: '#3B82F6' },
      { label: 'Desserts', percentage: Math.round((catRevenue.Desserts / total) * 100), color: '#8B5CF6' },
    ];
  }, [completedOrders]);

  const getRevenueTrend = useCallback(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekData = dayLabels.map((label, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - mondayOffset + i);
      d.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayRevenue = completedOrders
        .filter(o => o.completedAt >= d.getTime() && o.completedAt <= dayEnd.getTime())
        .reduce((s, o) => s + o.total, 0);
      return { label, value: dayRevenue };
    });
    const maxVal = Math.max(...weekData.map(d => d.value), 1);
    return weekData.map(d => ({ ...d, value: Math.round((d.value / 12000) * 100) }));
  }, [completedOrders]);

  const getTodayStats = useCallback(() => {
    const rev = getTodayRevenue();
    const orders = getOrderCount();
    const avg = getAvgOrderValue();
    const occupied = sections.flatMap(s => s.tables).filter(t => t.status === 'Occupied').length;
    const total = sections.flatMap(s => s.tables).length;
    const turnover = occupied > 0 ? `${(total / Math.max(occupied, 1)).toFixed(1)}×` : '0×';
    return { revenue: rev, orders, avgOrder: avg, turnover };
  }, [getTodayRevenue, getOrderCount, getAvgOrderValue, sections]);

  return (
    <RestaurantContext.Provider value={{
      menuCategories: MENU_CATEGORIES,
      menuItems: MENU_ITEMS,
      sections,
      getTable,
      updateTableStatus,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      getCartTotal,
      tickets,
      placeOrder,
      advanceTicketStatus,
      completedOrders,
      completePayment,
      getTodayRevenue,
      getOrderCount,
      getAvgOrderValue,
      getTopItems,
      getCategoryRevenue,
      getRevenueTrend,
      getTodayStats,

      // MN-004: Time-based menus
      currentMealPeriod,
      getMenuForPeriod,

      // MN-006: Happy hour
      happyHourConfig,
      setHappyHourConfig,
      isHappyHour,

      // RS-005: Table-turn timers
      tableTurnTimers,
      getTableElapsedMinutes,

      // PO-007: Split bill
      splitBill,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
}
