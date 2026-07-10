import { create } from 'zustand';

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Wallet';

interface Payment {
  id: string;
  bookingRef?: string;
  tableId?: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  createdAt: string;
}

interface PaymentStore {
  payments: Payment[];
  processPayment: (data: { amount: number; method: PaymentMethod; reference?: string; bookingRef?: string; tableId?: string }) => Payment;
  getTodayPayments: () => Payment[];
  getTodayRevenue: () => number;
}

let paymentCounter = 0;

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],

  processPayment: (data) => {
    const payment: Payment = {
      id: `pay-${++paymentCounter}`,
      amount: data.amount,
      method: data.method,
      status: 'completed',
      reference: data.reference || `TXN-${Date.now().toString(36).toUpperCase()}`,
      bookingRef: data.bookingRef,
      tableId: data.tableId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ payments: [...state.payments, payment] }));
    return payment;
  },

  getTodayPayments: () => {
    const today = new Date().toDateString();
    return get().payments.filter((p) => new Date(p.createdAt).toDateString() === today && p.status === 'completed');
  },

  getTodayRevenue: () => {
    return get().getTodayPayments().reduce((sum, p) => sum + p.amount, 0);
  },
}));
