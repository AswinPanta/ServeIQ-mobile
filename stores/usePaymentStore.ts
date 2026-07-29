/**
 * Phase 7 — Payment Improvements
 * Deposit management with due dates and outstanding balances.
 * Split payments across multiple methods (cash + card, etc.).
 * Payment timeline with attempts, refunds, deposits.
 */
import { create } from 'zustand';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'credit_note';
export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'failed';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  processedAt: string;
}

export interface PaymentTransaction {
  id: string;
  bookingRef: string;
  type: 'payment' | 'deposit' | 'refund' | 'chargeback';
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference?: string;
  note?: string;
  processedBy: string;
  processedAt: string;
}

export interface DepositRequirement {
  required: boolean;
  percentage: number;   // e.g. 30 for 30%
  amount: number;
  dueDate: string;
  paid: number;
  outstanding: number;
}

export interface PaymentTimeline {
  bookingRef: string;
  totalCharged: number;
  totalPaid: number;
  totalRefunded: number;
  outstanding: number;
  deposit: DepositRequirement;
  transactions: PaymentTransaction[];
}

interface PaymentStore {
  paymentTimelines: Record<string, PaymentTimeline>;
  /** Get payment timeline for a booking */
  getTimeline: (bookingRef: string) => PaymentTimeline | undefined;
  /** Initialize a payment timeline for a new booking */
  initializeTimeline: (bookingRef: string, totalAmount: number, depositPercentage?: number) => void;
  /** Record a payment */
  addPayment: (bookingRef: string, payment: { method: PaymentMethod; amount: number; reference?: string; note?: string; processedBy: string }) => PaymentTransaction;
  /** Process a split payment (e.g. 30% cash + 70% card) */
  processSplitPayment: (bookingRef: string, splits: { method: PaymentMethod; amount: number; reference?: string }[], processedBy: string) => PaymentTransaction[];
  /** Process a refund */
  addRefund: (bookingRef: string, amount: number, reason: string, processedBy: string) => void;
  /** Get outstanding balance */
  getOutstanding: (bookingRef: string) => number;
}

let paymentCounter = 0;

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  paymentTimelines: {},

  getTimeline: (bookingRef) => get().paymentTimelines[bookingRef],

  initializeTimeline: (bookingRef, totalAmount, depositPercentage = 0) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const depositAmount = Math.round(totalAmount * (depositPercentage / 100));

    set(s => ({
      paymentTimelines: {
        ...s.paymentTimelines,
        [bookingRef]: {
          bookingRef,
          totalCharged: totalAmount,
          totalPaid: 0,
          totalRefunded: 0,
          outstanding: totalAmount,
          deposit: {
            required: depositPercentage > 0,
            percentage: depositPercentage,
            amount: depositAmount,
            dueDate: dueDate.toISOString().slice(0, 10),
            paid: 0,
            outstanding: depositAmount,
          },
          transactions: [],
        },
      },
    }));
  },

  addPayment: (bookingRef, payment) => {
    const timeline = get().paymentTimelines[bookingRef];
    if (!timeline) {
      get().initializeTimeline(bookingRef, payment.amount);
    }

    const transaction: PaymentTransaction = {
      id: `pay-${++paymentCounter}`,
      bookingRef,
      type: payment.amount > 0 ? 'payment' : 'refund',
      method: payment.method,
      amount: payment.amount,
      status: 'completed',
      reference: payment.reference,
      note: payment.note,
      processedBy: payment.processedBy,
      processedAt: new Date().toISOString(),
    };

    set(s => {
      const tl = s.paymentTimelines[bookingRef];
      if (!tl) return s;
      const newPaid = tl.totalPaid + payment.amount;
      const depositPaid = Math.min(tl.deposit.amount, tl.deposit.paid + payment.amount);
      return {
        paymentTimelines: {
          ...s.paymentTimelines,
          [bookingRef]: {
            ...tl,
            totalPaid: newPaid,
            outstanding: tl.totalCharged - newPaid,
            deposit: { ...tl.deposit, paid: depositPaid, outstanding: Math.max(0, tl.deposit.amount - depositPaid) },
            transactions: [...tl.transactions, transaction],
          },
        },
      };
    });

    return transaction;
  },

  processSplitPayment: (bookingRef, splits, processedBy) => {
    const transactions = splits.map(split =>
      get().addPayment(bookingRef, { ...split, note: `Split payment: ${split.method}`, processedBy })
    );
    return transactions;
  },

  addRefund: (bookingRef, amount, reason, processedBy) => {
    const transaction: PaymentTransaction = {
      id: `ref-${++paymentCounter}`,
      bookingRef,
      type: 'refund',
      method: 'cash',
      amount: -amount,
      status: 'completed',
      note: reason,
      processedBy,
      processedAt: new Date().toISOString(),
    };

    set(s => {
      const tl = s.paymentTimelines[bookingRef];
      if (!tl) return s;
      return {
        paymentTimelines: {
          ...s.paymentTimelines,
          [bookingRef]: {
            ...tl,
            totalRefunded: tl.totalRefunded + amount,
            totalPaid: Math.max(0, tl.totalPaid - amount),
            outstanding: tl.outstanding + amount,
            transactions: [...tl.transactions, transaction],
          },
        },
      };
    });
  },

  getOutstanding: (bookingRef) => {
    return get().paymentTimelines[bookingRef]?.outstanding || 0;
  },
}));
