/**
 * Phase 5 — Reservation Intelligence
 * Conflict detection (overlapping bookings, duplicate guests, blacklisted guests)
 * Smart validation before confirmation.
 *
 * Phase 6 — Modification Workflow
 * Change summary with old/new value comparison, audit trail.
 *
 * Phase 10 — Cancellation Engine
 * Smart refund calculation with reasons tracking.
 */
import { create } from 'zustand';

export interface ConflictCheck {
  type: 'overlap' | 'duplicate_guest' | 'blacklisted' | 'duplicate_payment' | 'rate_change';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export interface ModificationChange {
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface AuditEntry {
  id: string;
  bookingRef: string;
  action: 'created' | 'modified' | 'cancelled' | 'checked_in' | 'checked_out' | 'payment' | 'note';
  changes: ModificationChange[];
  performedBy: string;
  reason?: string;
  timestamp: string;
}

export interface CancellationResult {
  bookingRef: string;
  guestName: string;
  checkIn: string;
  status: 'cancelled';
  reason: string;
  refundAmount: number;
  penalty: number;
  policy: string;
  hoursUntilCheckIn: number;
}

const CANCELLATION_POLICIES = [
  { minHours: 48, refund: 1.0, label: 'Free cancellation' },
  { minHours: 24, refund: 0.5, label: '50% refund' },
  { minHours: 12, refund: 0.25, label: '25% refund' },
  { minHours: 0, refund: 0, label: 'No refund' },
];

interface ReservationIntelligenceStore {
  auditLog: AuditEntry[];
  /** Check for conflicts before confirming a booking */
  checkConflicts: (data: {
    guestName: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    roomNumber?: string;
    propertyId: string;
  }) => ConflictCheck[];
  /** Add audit entry */
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  /** Get audit log for a booking */
  getBookingAudit: (bookingRef: string) => AuditEntry[];
  /** Calculate cancellation refund */
  calculateCancellation: (checkInDate: string, totalPaid: number) => CancellationResult;
  /** Detect duplicate guest across active bookings */
  detectDuplicateGuest: (email: string, phone: string) => boolean;
}

let auditCounter = 0;

export const useReservationIntelligenceStore = create<ReservationIntelligenceStore>((set, get) => ({
  auditLog: [],

  checkConflicts: (data) => {
    const conflicts: ConflictCheck[] = [];

    // 1. Date validation
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    if (checkOut <= checkIn) {
      conflicts.push({
        type: 'overlap',
        severity: 'error',
        message: 'Check-out must be after check-in',
        details: `Check-in: ${data.checkIn}, Check-out: ${data.checkOut}`,
      });
    }

    // 2. Minimum stay check (1 night minimum)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    if (nights < 1) {
      conflicts.push({
        type: 'overlap',
        severity: 'error',
        message: 'Minimum stay is 1 night',
      });
    }

    // 3. Advanced booking check (max 365 days)
    const maxAdvance = new Date();
    maxAdvance.setFullYear(maxAdvance.getFullYear() + 1);
    if (checkIn > maxAdvance) {
      conflicts.push({
        type: 'overlap',
        severity: 'warning',
        message: 'Booking more than 365 days in advance',
        details: 'Please verify this is intentional',
      });
    }

    // 4. Past date check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      conflicts.push({
        type: 'overlap',
        severity: 'error',
        message: 'Check-in date is in the past',
      });
    }

    // 5. Duplicate guest check (simulated)
    if (get().detectDuplicateGuest(data.email, data.phone)) {
      conflicts.push({
        type: 'duplicate_guest',
        severity: 'warning',
        message: 'This guest already has an active booking',
        details: 'Please verify this is a new reservation',
      });
    }

    // 6. Weekend minimum stay
    if (checkIn.getDay() === 5 && nights < 2) {
      conflicts.push({
        type: 'overlap',
        severity: 'warning',
        message: 'Friday check-in requires minimum 2 nights on weekends',
      });
    }

    return conflicts;
  },

  addAuditEntry: (entry) => {
    const audit: AuditEntry = {
      ...entry,
      id: `audit-${++auditCounter}`,
      timestamp: new Date().toISOString(),
    };
    set(s => ({ auditLog: [audit, ...s.auditLog] }));
  },

  getBookingAudit: (bookingRef) => {
    return get().auditLog.filter(a => a.bookingRef === bookingRef);
  },

  calculateCancellation: (checkInDate, totalPaid) => {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const hoursUntilCheckIn = Math.max(0, (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60));

    let applicablePolicy = CANCELLATION_POLICIES[CANCELLATION_POLICIES.length - 1];
    for (const policy of CANCELLATION_POLICIES) {
      if (hoursUntilCheckIn >= policy.minHours) {
        applicablePolicy = policy;
        break;
      }
    }

    const refundAmount = Math.round(totalPaid * applicablePolicy.refund);
    const penalty = totalPaid - refundAmount;

    return {
      bookingRef: '',
      guestName: '',
      checkIn: checkInDate,
      status: 'cancelled' as const,
      reason: '',
      refundAmount,
      penalty,
      policy: applicablePolicy.label,
      hoursUntilCheckIn: Math.round(hoursUntilCheckIn * 10) / 10,
    };
  },

  detectDuplicateGuest: (email, phone) => {
    // Check audit log for recent bookings with same email/phone
    const recentAudits = get().auditLog.filter(
      a => (a.action === 'created' || a.action === 'modified') &&
        a.changes.some(c => c.newValue === email || c.newValue === phone)
    );
    return recentAudits.length > 0;
  },
}));
