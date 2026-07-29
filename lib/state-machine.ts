/**
 * Centralized State Machine — StayEasy Domain Model
 *
 * Single source of truth for all status transitions across the application.
 * Replaces scattered STATUS_TRANSITIONS in:
 *   - stores/useDraftStore.ts
 *   - lib/context/frontdesk-context.tsx (implicit)
 *   - lib/context/housekeeping-context.tsx (STATUS_ORDER)
 *
 * Usage:
 *   import { reservationMachine, roomMachine } from '@/lib/state-machine';
 *
 *   const result = reservationMachine.transition('confirmed', 'checked_in', context);
 *   if (!result.success) console.error(result.error);
 */

import type {
  ReservationStatus,
  RoomStatus,
  HousekeepingStatus,
  PaymentStatus,
  OrderStatus,
  KdsTicketStatus,
  ApprovalStatus,
  ShiftStatus,
} from '@/types/status';

// ─── Types ────────────────────────────────────────────────────────────────

export interface TransitionResult {
  success: boolean;
  error?: string;
}

export interface TransitionContext {
  /** Current user performing the action */
  performedBy: string;
  /** User role for permission checks */
  role?: string;
  /** Additional context data */
  data?: Record<string, any>;
}

export interface StateMachineConfig<T extends string> {
  /** All valid states */
  states: T[];
  /** Allowed transitions from each state */
  transitions: Record<T, T[]>;
  /** Guard functions — return false to block transition */
  guards?: Record<string, (context: TransitionContext) => boolean>;
  /** Action functions — called on successful transition */
  actions?: Record<string, (context: TransitionContext) => void>;
}

export interface StateMachine<T extends string> {
  /** Check if a transition is allowed */
  canTransition: (from: T, to: T, context?: TransitionContext) => boolean;
  /** Execute a transition with validation */
  transition: (from: T, to: T, context: TransitionContext) => TransitionResult;
  /** Get all valid next states from current state */
  getValidTransitions: (current: T) => T[];
  /** Check if a state is terminal */
  isTerminal: (state: T) => boolean;
}

// ─── Factory Function ─────────────────────────────────────────────────────

/**
 * Create a state machine from a configuration object.
 */
export function createStateMachine<T extends string>(
  config: StateMachineConfig<T>
): StateMachine<T> {
  const terminalStates: T[] = [];

  // Identify terminal states (no outgoing transitions)
  for (const state of config.states) {
    if (!config.transitions[state] || config.transitions[state].length === 0) {
      terminalStates.push(state);
    }
  }

  return {
    canTransition: (from: T, to: T, context?: TransitionContext): boolean => {
      // Check if transition is allowed
      const allowed = config.transitions[from] || [];
      if (!allowed.includes(to)) return false;

      // Check guards
      const guardKey = `${from}→${to}`;
      if (config.guards?.[guardKey] && context) {
        return config.guards[guardKey](context);
      }

      return true;
    },

    transition: (from: T, to: T, context: TransitionContext): TransitionResult => {
      // Check if transition is allowed
      const allowed = config.transitions[from] || [];
      if (!allowed.includes(to)) {
        return {
          success: false,
          error: `Invalid transition: ${from} → ${to}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`,
        };
      }

      // Check guards
      const guardKey = `${from}→${to}`;
      if (config.guards?.[guardKey]) {
        if (!config.guards[guardKey](context)) {
          return {
            success: false,
            error: `Guard failed for transition: ${from} → ${to}`,
          };
        }
      }

      // Execute actions
      const actionKey = `${from}→${to}`;
      if (config.actions?.[actionKey]) {
        config.actions[actionKey](context);
      }

      return { success: true };
    },

    getValidTransitions: (current: T): T[] => {
      return config.transitions[current] || [];
    },

    isTerminal: (state: T): boolean => {
      return terminalStates.includes(state);
    },
  };
}

// ─── Reservation State Machine ────────────────────────────────────────────

export const reservationMachine = createStateMachine<ReservationStatus>({
  states: [
    'draft',
    'pending',
    'confirmed',
    'guaranteed',
    'checked_in',
    'checked_out',
    'completed',
    'cancelled',
    'no_show',
  ],
  transitions: {
    draft: ['pending', 'cancelled'],
    pending: ['confirmed', 'cancelled'],
    confirmed: ['guaranteed', 'cancelled', 'no_show'],
    guaranteed: ['checked_in', 'cancelled', 'no_show'],
    checked_in: ['checked_out'],
    checked_out: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
  },
  guards: {
    // Only front desk, manager, or host can create bookings
    'draft→pending': (ctx) => {
      const allowedRoles = ['front_desk', 'manager', 'host', 'superadmin'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
    // Check-in requires room assignment
    'guaranteed→checked_in': (ctx) => {
      return !!ctx.data?.roomNumber;
    },
    // Check-out requires folio settlement
    'checked_in→checked_out': (ctx) => {
      return ctx.data?.folioSettled === true || ctx.data?.balance === 0;
    },
  },
  actions: {
    'confirmed→guaranteed': (ctx) => {
      // TODO: wire to audit store — create TimelineEvent with type 'payment_added'
      console.log(`[Audit] Deposit received for booking by ${ctx.performedBy}`);
    },
    'guaranteed→checked_in': (ctx) => {
      // TODO: wire to audit store — create TimelineEvent with type 'checked_in'
      console.log(`[Audit] Guest checked in to Room ${ctx.data?.roomNumber} by ${ctx.performedBy}`);
    },
    'checked_in→checked_out': (ctx) => {
      // TODO: wire to audit store — create TimelineEvent with type 'checked_out'
      console.log(`[Audit] Guest checked out from Room ${ctx.data?.roomNumber} by ${ctx.performedBy}`);
    },
    'checked_out→completed': (ctx) => {
      // TODO: wire to audit store — create TimelineEvent with type 'completed'
      console.log(`[Audit] Booking completed — loyalty points awarded`);
    },
  },
});

// ─── Room State Machine ───────────────────────────────────────────────────

export const roomMachine = createStateMachine<RoomStatus>({
  states: ['available', 'occupied', 'dirty', 'cleaning', 'inspected', 'maintenance', 'blocked'],
  transitions: {
    available: ['occupied', 'maintenance', 'blocked'],
    occupied: ['dirty'],
    dirty: ['cleaning'],
    cleaning: ['inspected'],
    inspected: ['available', 'dirty'], // inspection can fail
    maintenance: ['available'],
    blocked: ['available'],
  },
  guards: {
    // Only front desk or manager can check in
    'available→occupied': (ctx) => {
      const allowedRoles = ['front_desk', 'manager'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
    // Only manager can set maintenance
    'available→maintenance': (ctx) => {
      const allowedRoles = ['manager', 'maintenance'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
    // Only manager can block
    'available→blocked': (ctx) => {
      const allowedRoles = ['manager', 'host'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
    // Only supervisor can inspect
    'cleaned→inspected': (ctx) => {
      const allowedRoles = ['manager', 'front_desk'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
  },
  actions: {
    'available→occupied': (ctx) => {
      // TODO: wire to audit store — log room assignment
      console.log(`[Room] Room occupied by ${ctx.data?.guestName || 'guest'}`);
    },
    'occupied→dirty': (ctx) => {
      // TODO: wire to housekeeping context — auto-create HK task
      console.log(`[Room] Housekeeping task created for Room ${ctx.data?.roomNumber}`);
    },
    'inspected→available': (ctx) => {
      // TODO: wire to audit store — log room returned to inventory
      console.log(`[Room] Room available again`);
    },
  },
});

// ─── Housekeeping State Machine ───────────────────────────────────────────

export const housekeepingMachine = createStateMachine<HousekeepingStatus>({
  states: ['dirty', 'in_progress', 'cleaned', 'inspected'],
  transitions: {
    dirty: ['in_progress'],
    in_progress: ['cleaned'],
    cleaned: ['inspected', 'dirty'], // inspection can fail
    inspected: [],
  },
  guards: {
    // Only assigned cleaner or manager can start
    'dirty→in_progress': (ctx) => {
      return !!ctx.data?.cleanerAssigned;
    },
    // Only supervisor can inspect
    'cleaned→inspected': (ctx) => {
      const allowedRoles = ['manager', 'front_desk'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
  },
  actions: {
    'dirty→in_progress': (ctx) => {
      // TODO: wire to audit store — log cleaning started
      console.log(`[HK] Cleaning started by ${ctx.performedBy}`);
    },
    'in_progress→cleaned': (ctx) => {
      // TODO: wire to audit store — log cleaning completed
      console.log(`[HK] Cleaning completed — awaiting inspection`);
    },
    'cleaned→inspected': (ctx) => {
      // TODO: wire to audit store + update room status to 'available'
      console.log(`[HK] Inspection passed — room ready`);
    },
    'cleaned→dirty': (ctx) => {
      // TODO: wire to audit store — log inspection failure
      console.log(`[HK] Inspection failed — room needs re-cleaning`);
    },
  },
});

// ─── Payment State Machine ────────────────────────────────────────────────

export const paymentMachine = createStateMachine<PaymentStatus>({
  states: ['pending', 'partial', 'completed', 'refunded', 'failed'],
  transitions: {
    pending: ['completed', 'failed', 'partial'],
    partial: ['completed'],
    completed: ['refunded'],
    refunded: [],
    failed: ['pending'], // retry
  },
  guards: {
    // Refund requires manager approval
    'completed→refunded': (ctx) => {
      const allowedRoles = ['manager', 'superadmin'];
      return !ctx.role || allowedRoles.includes(ctx.role);
    },
  },
  actions: {
    'pending→completed': (ctx) => {
      // TODO: wire to payment store — record transaction
      console.log(`[Payment] Payment of ${ctx.data?.amount} completed via ${ctx.data?.method}`);
    },
    'completed→refunded': (ctx) => {
      // TODO: wire to payment store — record refund transaction
      console.log(`[Payment] Refund of ${ctx.data?.amount} processed by ${ctx.performedBy}`);
    },
  },
});

// ─── Order (POS) State Machine ────────────────────────────────────────────

// ─── Order (POS) State Machine ────────────────────────────────────────────
// Restaurant order lifecycle.
// Used by: Operations portal (POS, KDS)

export const orderMachine = createStateMachine<OrderStatus>({
  states: ['open', 'submitted', 'preparing', 'ready', 'served', 'paid'],
  transitions: {
    open: ['submitted'],
    submitted: ['preparing'],
    preparing: ['ready'],
    ready: ['served', 'preparing'], // can go back if mistake found
    served: ['paid', 'ready'],       // can correct after serving
    paid: [],
  },
  actions: {
    'open→submitted': (ctx) => {
      // TODO: wire to restaurant context — create KDS ticket
      console.log(`[POS] Order ${ctx.data?.orderId} submitted to kitchen`);
    },
    'served→paid': (ctx) => {
      // TODO: wire to restaurant context — complete payment
      console.log(`[POS] Order ${ctx.data?.orderId} paid — ${ctx.data?.paymentMethod}`);
    },
  },
});

// ─── KDS Ticket State Machine ─────────────────────────────────────────────

export const kdsTicketMachine = createStateMachine<KdsTicketStatus>({
  states: ['pending', 'in_progress', 'ready'],
  transitions: {
    pending: ['in_progress'],
    in_progress: ['ready', 'pending'], // can reset if needed
    ready: ['in_progress'],            // can go back if mistake found
  },
  actions: {
    'pending→in_progress': (ctx) => {
      // TODO: wire to restaurant context — update ticket status
      console.log(`[KDS] Ticket ${ctx.data?.ticketId} — preparation started`);
    },
    'in_progress→ready': (ctx) => {
      // TODO: wire to restaurant context — update ticket status
      console.log(`[KDS] Ticket ${ctx.data?.ticketId} — ready for pickup`);
    },
  },
});

// ─── Approval State Machine ───────────────────────────────────────────────

export const approvalMachine = createStateMachine<ApprovalStatus>({
  states: ['pending', 'approved', 'rejected'],
  transitions: {
    pending: ['approved', 'rejected'],
    approved: [],
    rejected: [],
  },
  guards: {
    // Only managers and above can approve
    'pending→approved': (ctx) => {
      const allowedRoles = ['manager', 'superadmin'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
    'pending→rejected': (ctx) => {
      const allowedRoles = ['manager', 'superadmin'];
      return ctx.role ? allowedRoles.includes(ctx.role) : false;
    },
  },
  actions: {
    'pending→approved': (ctx) => {
      // TODO: wire to approval store — record decision
      console.log(`[Approval] Request ${ctx.data?.approvalId} approved by ${ctx.performedBy}`);
    },
    'pending→rejected': (ctx) => {
      // TODO: wire to approval store — record decision
      console.log(`[Approval] Request ${ctx.data?.approvalId} rejected by ${ctx.performedBy} — ${ctx.data?.reason}`);
    },
  },
});

// ─── Shift State Machine ──────────────────────────────────────────────────

export const shiftMachine = createStateMachine<ShiftStatus>({
  states: ['scheduled', 'clocked_in', 'clocked_out', 'absent'],
  transitions: {
    scheduled: ['clocked_in', 'absent'],
    clocked_in: ['clocked_out'],
    clocked_out: [],
    absent: [],
  },
  guards: {
    // Can only clock in within shift window (±30 min)
    'scheduled→clocked_in': (ctx) => {
      return ctx.data?.withinShiftWindow === true;
    },
  },
  actions: {
    'scheduled→clocked_in': (ctx) => {
      // TODO: wire to shift store — record clock-in time
      console.log(`[Shift] ${ctx.performedBy} clocked in at ${ctx.data?.time}`);
    },
    'clocked_in→clocked_out': (ctx) => {
      // TODO: wire to shift store — record clock-out time
      console.log(`[Shift] ${ctx.performedBy} clocked out at ${ctx.data?.time}`);
    },
    'scheduled→absent': (ctx) => {
      // TODO: wire to shift store — mark absence
      console.log(`[Shift] ${ctx.data?.staffName} marked absent by ${ctx.performedBy}`);
    },
  },
});

// ─── Machine Registry ─────────────────────────────────────────────────────

/**
 * Get a state machine by entity name.
 * Useful for dynamic/conditional logic.
 */
export function getMachine(entity: string): StateMachine<any> | null {
  const machines: Record<string, StateMachine<any>> = {
    reservation: reservationMachine,
    room: roomMachine,
    housekeeping: housekeepingMachine,
    payment: paymentMachine,
    order: orderMachine,
    kdsTicket: kdsTicketMachine,
    approval: approvalMachine,
    shift: shiftMachine,
  };
  return machines[entity] || null;
}

/**
 * Get all valid transitions for a given entity and state.
 */
export function getValidTransitions(entity: string, state: string): string[] {
  const machine = getMachine(entity);
  if (!machine) return [];
  return machine.getValidTransitions(state);
}

/**
 * Check if a transition is valid for a given entity.
 */
export function isValidTransition(entity: string, from: string, to: string): boolean {
  const machine = getMachine(entity);
  if (!machine) return false;
  return machine.canTransition(from, to);
}
