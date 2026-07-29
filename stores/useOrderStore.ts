import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KdsTicket {
  id: string;
  order_id: string;
  table_number: string;
  items: KdsTicketItem[];
  status: 'pending' | 'in_progress' | 'ready';
  notes?: string;
  elapsed_seconds: number;
}

export interface KdsTicketItem {
  id: string;
  name: string;
  quantity: number;
  item_status: 'pending' | 'in_progress' | 'ready' | 'served' | 'cancelled';
  modifiers?: string;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers?: string;
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

interface OrderStore {
  propertyId: string;
  tickets: KdsTicket[];
  carts: Record<string, CartItem[]>;
  completedOrders: CompletedOrder[];
  setPropertyId: (id: string) => void;
  addToCart: (tableId: string, item: CartItem) => void;
  updateCartQty: (tableId: string, menuItemId: string, qty: number) => void;
  clearCart: (tableId: string) => void;
  placeOrder: (tableId: string, tableNumber: string, notes?: string) => void;
  advanceTicketStatus: (ticketId: string) => void;
  updateItemStatus: (ticketId: string, itemId: string, status: string) => void;
  completePayment: (tableId: string, discount: { type: string; value: number }, paymentMethod: string, ..._args: string[]) => CompletedOrder;
}

let ticketIdCounter = 10;
let orderIdCounter = 10;

export const useOrderStore = create<OrderStore>((set, get) => ({
  propertyId: 'prop-1',
  tickets: [],
  carts: {},
  completedOrders: [],

  setPropertyId: (id) => set({ propertyId: id }),

  addToCart: (tableId, item) =>
    set((state) => {
      const current = state.carts[tableId] || [];
      const existing = current.find((c) => c.menu_item_id === item.menu_item_id);
      if (existing) {
        return {
          carts: {
            ...state.carts,
            [tableId]: current.map((c) =>
              c.menu_item_id === item.menu_item_id ? { ...c, quantity: c.quantity + item.quantity } : c
            ),
          },
        };
      }
      return {
        carts: { ...state.carts, [tableId]: [...current, item] },
      };
    }),

  updateCartQty: (tableId, menuItemId, qty) =>
    set((state) => {
      const current = state.carts[tableId] || [];
      if (qty <= 0) {
        return {
          carts: { ...state.carts, [tableId]: current.filter((c) => c.menu_item_id !== menuItemId) },
        };
      }
      return {
        carts: {
          ...state.carts,
          [tableId]: current.map((c) => (c.menu_item_id === menuItemId ? { ...c, quantity: qty } : c)),
        },
      };
    }),

  clearCart: (tableId) =>
    set((state) => ({
      carts: { ...state.carts, [tableId]: [] },
    })),

  placeOrder: (tableId, tableNumber, notes) => {
    const items = get().carts[tableId] || [];
    if (items.length === 0) return;
    const ticket: KdsTicket = {
      id: String(++ticketIdCounter),
      order_id: `ORD-${String(++orderIdCounter).padStart(3, '0')}`,
      table_number: tableNumber,
      items: items.map((i) => ({
        id: `${i.menu_item_id}-${Date.now()}`,
        name: i.name,
        quantity: i.quantity,
        item_status: 'pending',
        modifiers: i.modifiers,
      })),
      status: 'pending',
      notes,
      elapsed_seconds: 0,
    };
    set((state) => ({
      tickets: [...state.tickets, ticket],
      carts: { ...state.carts, [tableId]: [] },
    }));
  },

  advanceTicketStatus: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        const nextStatus: Record<string, 'pending' | 'in_progress' | 'ready'> = {
          pending: 'in_progress',
          in_progress: 'ready',
          ready: 'ready',
        };
        return { ...t, status: nextStatus[t.status] || t.status };
      }),
    })),

  updateItemStatus: (ticketId, itemId, status) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id !== ticketId
          ? t
          : { ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, item_status: status as KdsTicketItem['item_status'] } : i)) }
      ),
    })),

  completePayment: (tableId, discount, paymentMethod) => {
    const items = get().carts[tableId] || [];
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountAmount =
      discount.type === 'percentage' ? Math.round(subtotal * (discount.value / 100))
      : discount.type === 'fixed' ? discount.value
      : 0;
    const tax = Math.round((subtotal - discountAmount) * 0.1);
    const total = subtotal - discountAmount + tax;
    const order: CompletedOrder = {
      tableId,
      items: items.map((i) => ({ id: i.menu_item_id, name: i.name, price: i.unit_price, qty: i.quantity, category: 'Food' })),
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod,
      completedAt: Date.now(),
    };
    set((state) => ({
      completedOrders: [...state.completedOrders, order],
      carts: { ...state.carts, [tableId]: [] },
      tickets: state.tickets.filter((t) => t.table_number !== tableId),
    }));
    return order;
  },
}));
