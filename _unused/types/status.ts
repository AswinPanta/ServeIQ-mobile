/**
 * Unified Status Types — ServeIQ Domain Model
 *
 * Single source of truth for all status enums across the application.
 * Replaces scattered definitions in:
 *   - types/api.ts (BookingStatus)
 *   - stores/useDraftStore.ts (ReservationStatus)
 *   - lib/context/frontdesk-context.tsx (BookingArrivalStatus)
 *   - lib/context/booking-context.tsx (Booking.status)
 */

// ─── Reservation / Booking Status ──────────────────────────────────────────
// The full lifecycle of a reservation from draft to completion.
// Used by: Guest portal, Operations portal, Host portal

export type ReservationStatus =
  | 'draft'        // Being created (walk-in, phone)
  | 'pending'      // Awaiting payment/confirmation
  | 'confirmed'    // Booking confirmed, room reserved
  | 'guaranteed'   // Deposit paid, room guaranteed
  | 'checked_in'   // Guest has arrived and checked in
  | 'checked_out'  // Guest has departed
  | 'completed'    // Post-stay processing done (terminal)
  | 'cancelled'    // Booking cancelled (terminal)
  | 'no_show';     // Guest didn't arrive (terminal)

// Simplified status for guest-facing booking list
// Maps from ReservationStatus for guest portal display
export type GuestBookingStatus = 'upcoming' | 'completed' | 'cancelled';

// Terminal states — no further transitions allowed
export type TerminalStatus = 'completed' | 'cancelled' | 'no_show';

// ─── Room Status ───────────────────────────────────────────────────────────
// Physical room operational status.
// Used by: Operations portal (Front Desk, Housekeeping)

export type RoomStatus =
  | 'available'    // Clean and ready for check-in
  | 'occupied'     // Guest currently staying
  | 'dirty'        // Needs cleaning (post-checkout)
  | 'cleaning'     // Housekeeping in progress
  | 'inspected'    // Cleaned and verified by supervisor
  | 'maintenance'  // Out of order
  | 'blocked';     // Manually blocked (event, hold)

// ─── Housekeeping Status ──────────────────────────────────────────────────
// Cleaning task lifecycle.
// Used by: Operations portal (Housekeeping)

export type HousekeepingStatus =
  | 'dirty'        // Task created, awaiting assignment
  | 'in_progress'  // Cleaning underway
  | 'cleaned'      // Cleaning complete, awaiting inspection
  | 'inspected';   // Verified by supervisor

// ─── Payment Status ────────────────────────────────────────────────────────
// Financial transaction status.
// Used by: Operations portal (Front Desk), Guest portal

export type PaymentStatus =
  | 'pending'      // Payment initiated
  | 'partial'      // Partial payment received
  | 'completed'    // Payment successful
  | 'refunded'     // Refund processed
  | 'failed';      // Payment declined

// ─── Order Status (POS) ───────────────────────────────────────────────────
// Restaurant order lifecycle.
// Used by: Operations portal (POS, KDS)

export type OrderStatus =
  | 'open'         // Cart being built
  | 'submitted'    // Sent to kitchen
  | 'preparing'    // Being cooked
  | 'ready'        // Ready to serve
  | 'served'       // Delivered to table
  | 'paid';        // Payment complete (terminal)

// ─── KDS Ticket Status ────────────────────────────────────────────────────
// Kitchen display system ticket.
// Used by: Operations portal (KDS)

export type KdsTicketStatus =
  | 'pending'      // Just received
  | 'in_progress'  // Being prepared
  | 'ready';       // Ready for pickup

// ─── Approval Status ──────────────────────────────────────────────────────
// Manager approval workflow.
// Used by: Operations portal (Manager), SuperAdmin

export type ApprovalStatus =
  | 'pending'      // Awaiting review
  | 'approved'     // Request approved
  | 'rejected';    // Request rejected

// ─── Approval Type ────────────────────────────────────────────────────────
// What kind of approval is being requested.

export type ApprovalType =
  | 'discount_override'  // Discount exceeds staff limit
  | 'cancellation'       // Cancellation requires approval
  | 'rate_change'        // Rate modification
  | 'refund'             // Refund exceeds limit
  | 'upgrade';           // Room upgrade

// ─── Waitlist Status ──────────────────────────────────────────────────────
// Waitlist entry lifecycle.

export type WaitlistStatus =
  | 'waiting'      // In queue
  | 'offered'      // Room available, offered to guest
  | 'converted'    // Guest booked
  | 'expired';     // Offer expired

// ─── Shift Status ─────────────────────────────────────────────────────────
// Staff shift tracking.

export type ShiftStatus =
  | 'scheduled'    // Shift planned
  | 'clocked_in'   // On duty
  | 'clocked_out'  // Shift ended
  | 'absent';      // No-show

// ─── Task Status ──────────────────────────────────────────────────────────
// General staff task status.

export type TaskStatus =
  | 'pending'      // Not started
  | 'in_progress'  // Underway
  | 'completed';   // Done

// ─── Discount Code Status ────────────────────────────────────────────────
// Promo code lifecycle.

export type DiscountCodeStatus =
  | 'active'       // Available for use
  | 'exhausted'    // max_uses reached
  | 'expired';     // valid_to passed

// ─── Helper Functions ─────────────────────────────────────────────────────

/**
 * Maps ReservationStatus to GuestBookingStatus for guest portal display.
 */
export function toGuestStatus(status: ReservationStatus): GuestBookingStatus {
  switch (status) {
    case 'confirmed':
    case 'guaranteed':
    case 'checked_in':
      return 'upcoming';
    case 'checked_out':
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'no_show':
      return 'cancelled';
    // draft and pending are internal states — not shown to guests
    case 'draft':
    case 'pending':
    default:
      return 'upcoming';
  }
}

/**
 * Checks if a reservation status is terminal (no further transitions).
 */
export function isTerminalStatus(status: ReservationStatus): boolean {
  return ['completed', 'cancelled', 'no_show'].includes(status);
}

/**
 * Checks if a room status allows booking.
 */
export function isRoomBookable(status: RoomStatus): boolean {
  return status === 'available';
}

/**
 * Checks if a room status requires housekeeping.
 */
export function requiresHousekeeping(status: RoomStatus): boolean {
  return status === 'dirty';
}

/**
 * Checks if a payment status indicates funds received.
 */
export function isPaymentComplete(status: PaymentStatus): boolean {
  return status === 'completed';
}

/**
 * Human-readable labels for all statuses.
 */
export const STATUS_LABELS: Record<string, string> = {
  // Reservation
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  guaranteed: 'Guaranteed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  // Room
  available: 'Available',
  occupied: 'Occupied',
  dirty: 'Dirty',
  cleaning: 'Cleaning',
  inspected: 'Inspected',
  maintenance: 'Maintenance',
  blocked: 'Blocked',
  // Housekeeping (uses 'dirty', 'in_progress', 'cleaned', 'inspected' — already covered above)
  // Payment (uses 'pending', 'partial', 'completed', 'refunded', 'failed')
  partial: 'Partial',
  refunded: 'Refunded',
  failed: 'Failed',
  // Order (uses 'open', 'submitted', 'preparing', 'ready', 'served', 'paid')
  open: 'Open',
  submitted: 'Submitted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  paid: 'Paid',
  // Approval (uses 'pending', 'approved', 'rejected')
  approved: 'Approved',
  rejected: 'Rejected',
  // Waitlist
  waiting: 'Waiting',
  offered: 'Offered',
  converted: 'Converted',
  expired: 'Expired',
  // Shift
  scheduled: 'Scheduled',
  clocked_in: 'Clocked In',
  clocked_out: 'Clocked Out',
  absent: 'Absent',
  // Discount
  active: 'Active',
  exhausted: 'Exhausted',
};

/**
 * Color coding for all statuses.
 */
export const STATUS_COLORS: Record<string, string> = {
  // Reservation
  draft: '#94A3B8',
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  guaranteed: '#8B5CF6',
  checked_in: '#10B981',
  checked_out: '#6B7280',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#DC2626',
  // Room
  available: '#10B981',
  occupied: '#3B82F6',
  dirty: '#F59E0B',
  cleaning: '#3B82F6',
  inspected: '#8B5CF6',
  maintenance: '#EF4444',
  blocked: '#6B7280',
  // Housekeeping (uses 'dirty', 'in_progress', 'cleaned', 'inspected' — already covered above)
  // Payment (uses 'pending', 'partial', 'completed', 'refunded', 'failed')
  partial: '#F59E0B',
  refunded: '#8B5CF6',
  failed: '#EF4444',
  // Order (uses 'open', 'submitted', 'preparing', 'ready', 'served', 'paid')
  open: '#94A3B8',
  submitted: '#3B82F6',
  preparing: '#F59E0B',
  ready: '#10B981',
  served: '#10B981',
  paid: '#10B981',
  // Approval (uses 'pending', 'approved', 'rejected')
  approved: '#10B981',
  rejected: '#EF4444',
  // Waitlist
  waiting: '#F59E0B',
  offered: '#3B82F6',
  converted: '#10B981',
  expired: '#6B7280',
  // Shift
  scheduled: '#94A3B8',
  clocked_in: '#10B981',
  clocked_out: '#6B7280',
  absent: '#EF4444',
  // Discount
  active: '#10B981',
  exhausted: '#6B7280',
};
