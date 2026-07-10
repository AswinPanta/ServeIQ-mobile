import { create } from 'zustand';
import type { Order, OrderItem, KdsTicket } from '@/types/api';

interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: string;
  notes?: string;
}

interface OrderStore {
  propertyId: string;
  carts: Record<string, CartItem[]>;
  tickets: KdsTicket[];
  completedOrders: CompletedOrder[];
  setPropertyId: (id: string) => void;
  addToCart: (tableId: string, item: CartItem) => void;
  removeFromCart: (tableId: string, menuItemId: string) => void;
  updateCartQty: (tableId: string, menuItemId: string, qty: number) => void;
  clearCart: (tableId: string) => void;
  getCartTotal: (tableId: string) => number;
  placeOrder: (tableId: string, tableNumber: number, notes?: string) => KdsTicket;
  advanceTicketStatus: (ticketId: string) => void;
  updateItemStatus: (ticketId: string, itemId: string, status: OrderItem['item_status']) => void;
  completePayment: (tableId: string, discount: { type: 'none' | 'percentage' | 'fixed'; value: number }, paymentMethod: string, staffName?: string, staffRole?: string) => CompletedOrder;
}

export interface CompletedOrder {
  id: string;
  tableId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  completedAt: string;
  staffName?: string;
  staffRole?: string;
}

let orderCounter = 0;
let ticketCounter = 0;

function nextOrderId() { return `ORD-${++orderCounter}`; }
function nextTicketId() { return `TCK-${++ticketCounter}`; }

const PROP_1_TICKETS: KdsTicket[] = [
  { id: 'TCK-1', order_id: 'ORD-1', table_number: 2, items: [{ id: 'oi1', menu_item_id: 'm1', name: 'Margherita Pizza', quantity: 2, unit_price: 550, modifiers: 'Large, Thin Crust', item_status: 'pending' }, { id: 'oi2', menu_item_id: 'm7', name: 'Iced Tea', quantity: 2, unit_price: 120, modifiers: '', item_status: 'pending' }], elapsed_seconds: 480, status: 'in_progress' },
  { id: 'TCK-2', order_id: 'ORD-2', table_number: 5, items: [{ id: 'oi3', menu_item_id: 'm2', name: 'Chicken Burger', quantity: 1, unit_price: 450, modifiers: 'Medium', item_status: 'in_progress' }, { id: 'oi4', menu_item_id: 'm5', name: 'French Fries', quantity: 2, unit_price: 180, modifiers: '', item_status: 'in_progress' }], elapsed_seconds: 720, status: 'ready' },
  { id: 'TCK-3', order_id: 'ORD-3', table_number: 7, items: [{ id: 'oi5', menu_item_id: 'm16', name: 'Butter Chicken', quantity: 1, unit_price: 520, modifiers: 'Medium', item_status: 'pending' }, { id: 'oi6', menu_item_id: 'm14', name: 'Mineral Water', quantity: 2, unit_price: 60, modifiers: '', item_status: 'pending' }], elapsed_seconds: 180, status: 'pending' },
  { id: 'TCK-4', order_id: 'ORD-4', table_number: 2, items: [{ id: 'oi7', menu_item_id: 'm11', name: 'Chocolate Brownie', quantity: 2, unit_price: 320, modifiers: '', item_status: 'pending' }], elapsed_seconds: 60, status: 'pending' },
  { id: 'TCK-5', order_id: 'ORD-5', table_number: 5, items: [{ id: 'oi8', menu_item_id: 'm13', name: 'Tiramisu', quantity: 1, unit_price: 350, modifiers: '', item_status: 'ready' }], elapsed_seconds: 600, status: 'ready' },
];

const PROP_2_TICKETS: KdsTicket[] = [
  { id: 'BTCK-1', order_id: 'BORD-1', table_number: 2, items: [{ id: 'boi1', menu_item_id: 'm7', name: 'Iced Tea', quantity: 2, unit_price: 120, modifiers: '', item_status: 'pending' }, { id: 'boi2', menu_item_id: 'm21', name: 'Club Sandwich', quantity: 1, unit_price: 380, modifiers: 'Toasted', item_status: 'pending' }], elapsed_seconds: 300, status: 'in_progress' },
];

const PROP_3_TICKETS: KdsTicket[] = [];

function getTicketsForProperty(propertyId: string): KdsTicket[] {
  switch (propertyId) {
    case 'prop-2': return PROP_2_TICKETS;
    case 'prop-3': return PROP_3_TICKETS;
    default: return PROP_1_TICKETS;
  }
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  propertyId: 'prop-1',
  carts: {},
  tickets: PROP_1_TICKETS,
  completedOrders: [],

  setPropertyId: (id) => {
    if (id === get().propertyId) return;
    set({ propertyId: id, tickets: getTicketsForProperty(id), carts: {}, completedOrders: [] });
  },

  addToCart: (tableId, item) =>
    set((state) => {
      const cart = [...(state.carts[tableId] || [])];
      const existingIdx = cart.findIndex((c) => c.menu_item_id === item.menu_item_id && c.modifiers === item.modifiers);
      if (existingIdx >= 0) {
        cart[existingIdx] = { ...cart[existingIdx], quantity: cart[existingIdx].quantity + item.quantity };
      } else {
        cart.push(item);
      }
      return { carts: { ...state.carts, [tableId]: cart } };
    }),

  removeFromCart: (tableId, menuItemId) =>
    set((state) => {
      const cart = (state.carts[tableId] || []).filter((c) => c.menu_item_id !== menuItemId);
      return { carts: { ...state.carts, [tableId]: cart } };
    }),

  updateCartQty: (tableId, menuItemId, qty) =>
    set((state) => {
      const cart = (state.carts[tableId] || []).map((c) =>
        c.menu_item_id === menuItemId ? { ...c, quantity: Math.max(0, qty) } : c
      ).filter((c) => c.quantity > 0);
      return { carts: { ...state.carts, [tableId]: cart } };
    }),

  clearCart: (tableId) =>
    set((state) => {
      const { [tableId]: _, ...rest } = state.carts;
      return { carts: rest };
    }),

  getCartTotal: (tableId) => {
    const cart = get().carts[tableId] || [];
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  },

  placeOrder: (tableId, tableNumber, notes) => {
    const cart = get().carts[tableId] || [];
    const items: OrderItem[] = cart.map((c, i) => ({
      id: `oi-${Date.now()}-${i}`,
      menu_item_id: c.menu_item_id,
      name: c.name,
      quantity: c.quantity,
      unit_price: c.unit_price,
      modifiers: c.modifiers,
      item_status: 'pending',
    }));
    const existingTickets = get().tickets.filter(
      (t) => t.table_number === tableNumber && t.status !== 'ready'
    );
    const supplementTo = existingTickets.length > 0 ? existingTickets[0].order_id : undefined;
    const ticket: KdsTicket = {
      id: nextTicketId(),
      order_id: nextOrderId(),
      table_number: tableNumber,
      items,
      elapsed_seconds: 0,
      status: 'pending',
      supplement_to: supplementTo,
    };
    set((state) => ({
      tickets: [...state.tickets, ticket],
      carts: { ...state.carts, [tableId]: [] },
    }));
    return ticket;
  },

  advanceTicketStatus: (ticketId) =>
    set((state) => {
      const statusOrder: KdsTicket['status'][] = ['pending', 'in_progress', 'ready'];
      return {
        tickets: state.tickets.map((t) => {
          if (t.id !== ticketId) return t;
          const currentIdx = statusOrder.indexOf(t.status);
          if (currentIdx >= statusOrder.length - 1) return t;
          return { ...t, status: statusOrder[currentIdx + 1] };
        }),
      };
    }),

  updateItemStatus: (ticketId, itemId, status) =>
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return { ...t, items: t.items.map((item) => (item.id === itemId ? { ...item, item_status: status } : item)) };
      }),
    })),

  completePayment: (tableId, discount, paymentMethod, staffName, staffRole) => {
    const cart = get().carts[tableId] || [];
    const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discountAmount = discount.type === 'percentage' ? Math.round(subtotal * discount.value / 100) : discount.type === 'fixed' ? discount.value : 0;
    const afterDiscount = subtotal - discountAmount;
    const tax = Math.round(afterDiscount * 0.1);
    const total = afterDiscount + tax;

    const order: CompletedOrder = {
      id: nextOrderId(),
      tableId,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod,
      completedAt: new Date().toISOString(),
      staffName,
      staffRole,
    };

    set((state) => ({
      completedOrders: [...state.completedOrders, order],
      carts: { ...state.carts, [tableId]: [] },
      tickets: state.tickets.filter((t) => {
        const orderForTable = state.carts[tableId];
        return !orderForTable || orderForTable.length > 0;
      }),
    }));

    return order;
  },
}));
