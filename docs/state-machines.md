# StayEasy — State Machines

> Source of Truth v1.0 — July 2026

---

## 1. Reservation State Machine ⭐⭐⭐⭐⭐

The reservation lifecycle is the backbone of the entire system. Every other state machine triggers from or feeds into this one.

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    RESERVATION LIFECYCLE                     │
                    └─────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  DRAFT  │ ◄── Auto-saved by front desk during walk-in/phone booking
    └────┬────┘
         │
         │  Staff confirms details → submit
         ▼
    ┌─────────┐
    │ PENDING │ ◄── Awaiting payment confirmation or approval
    └────┬────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  Payment received            │  Timeout / Guest cancels
         ▼                              ▼
    ┌───────────┐                 ┌────────────┐
    │ CONFIRMED │                 │ CANCELLED  │
    └─────┬─────┘                 └────────────┘
          │
          ├──────────────────────────────┐
          │                              │
          │  Deposit paid / Guaranteed   │  Guest doesn't show
          ▼                              ▼
    ┌────────────┐                ┌──────────┐
    │ GUARANTEED │                │ NO SHOW  │
    └─────┬──────┘                └──────────┘
          │
          ├──────────────────────────────┐
          │                              │
          │  Guest arrives               │  Guest cancels
          ▼                              ▼
    ┌──────────────┐              ┌────────────┐
    │CHECK-IN READY│              │ CANCELLED  │
    └──────┬───────┘              └────────────┘
           │
           │  Room assigned + ID verified
           ▼
    ┌───────────┐
    │CHECKED IN │ ◄── Guest is in-house
    └─────┬─────┘
          │
          │  Guest departs + folio settled
          ▼
    ┌────────────┐
    │CHECKED OUT │ ◄── Room marked dirty for housekeeping
    └─────┬──────┘
          │
          │  All charges settled + post-stay period
          ▼
    ┌───────────┐
    │ COMPLETED │ ◄── Terminal state
    └───────────┘
```

### Valid Transitions

| From | To | Trigger | Actor | Validation |
|------|-----|---------|-------|------------|
| `draft` | `pending` | Submit draft | Front Desk | Guest name + dates required |
| `draft` | `cancelled` | Discard draft | Front Desk | — |
| `pending` | `confirmed` | Payment received | System/Front Desk | Payment ≥ deposit required |
| `pending` | `cancelled` | Timeout/Cancel | System/Guest | — |
| `confirmed` | `guaranteed` | Deposit paid | System | Deposit amount met |
| `confirmed` | `cancelled` | Guest cancels | Guest/Front Desk | Cancellation policy applies |
| `confirmed` | `no_show` | Past check-in time | System (auto) | check_in_date + grace period elapsed |
| `guaranteed` | `checked_in` | Guest arrives | Front Desk | Room must be AVAILABLE |
| `guaranteed` | `cancelled` | Guest cancels | Guest/Front Desk | Cancellation policy applies |
| `guaranteed` | `no_show` | Past check-in time | System (auto) | Grace period (24h default) elapsed |
| `checked_in` | `checked_out` | Guest departs | Front Desk | Folio settled (balance = 0) |
| `checked_out` | `completed` | Post-stay processing | System (auto) | 24h after checkout OR manual |

### Terminal States
- `completed` — No further transitions
- `cancelled` — No further transitions
- `no_show` — No further transitions (but can be manually reversed by manager)

### Notifications on Transition

| Transition | Notification |
|------------|--------------|
| `draft` → `pending` | None (internal) |
| `pending` → `confirmed` | Email: "Booking Confirmed" + confirmation code |
| `confirmed` → `guaranteed` | Email: "Deposit Received" |
| `confirmed` → `cancelled` | Email: "Booking Cancelled" + refund details |
| `guaranteed` → `checked_in` | Push: "Welcome to [Property]!" + QR code for self-service |
| `checked_in` → `checked_out` | Email: "Thank You for Staying" + receipt + review request |
| `checked_out` → `completed` | Email: "How was your stay?" + loyalty points |

### Audit Events
Every transition creates a `TimelineEvent` with:
- `type`: The transition name
- `description`: Human-readable description
- `old_value`: Previous status
- `new_value`: New status
- `performed_by`: User ID + name

---

## 2. Room Status State Machine

```
    ┌───────────┐
    │ AVAILABLE │ ◄── Clean and ready for check-in
    └─────┬─────┘
          │
          │  Guest checks in
          ▼
    ┌───────────┐
    │ OCCUPIED  │ ◄── Guest currently staying
    └─────┬─────┘
          │
          │  Guest checks out
          ▼
    ┌────────┐
    │  DIRTY │ ◄── Needs cleaning
    └───┬────┘
        │
        │  Housekeeping starts cleaning
        ▼
    ┌───────────┐
    │ CLEANING  │ ◄── In progress
    └─────┬─────┘
          │
          │  Cleaning complete
          ▼
    ┌───────────┐
    │INSPECTED  │ ◄── Verified by supervisor
    └─────┬─────┘
          │
          │  Inspection passed
          ▼
    ┌───────────┐
    │ AVAILABLE │
    └───────────┘
```

### Alternate Paths

```
    AVAILABLE ──────► MAINTENANCE ──────► AVAILABLE
        │                  ▲
        │                  │
        └──────► BLOCKED ──┘
```

### Valid Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| `AVAILABLE` | `OCCUPIED` | Check-in | Front Desk |
| `AVAILABLE` | `MAINTENANCE` | Maintenance needed | Staff/Manager |
| `AVAILABLE` | `BLOCKED` | Manual block | Manager |
| `OCCUPIED` | `DIRTY` | Check-out | Front Desk |
| `DIRTY` | `CLEANING` | Start cleaning | Housekeeping |
| `CLEANING` | `INSPECTED` | Cleaning complete | Housekeeping |
| `INSPECTED` | `AVAILABLE` | Inspection passed | Supervisor |
| `INSPECTED` | `DIRTY` | Inspection failed | Supervisor |
| `MAINTENANCE` | `AVAILABLE` | Maintenance complete | Maintenance |
| `BLOCKED` | `AVAILABLE` | Unblock | Manager |

### Room Status → Reservation Impact
- When room → `DIRTY`: Creates `HousekeepingTask` automatically
- When room → `AVAILABLE`: Room becomes bookable again
- When room → `MAINTENANCE`: Remove from availability search
- When room → `BLOCKED`: Remove from availability search

---

## 3. Housekeeping Task State Machine

```
    ┌────────┐
    │  DIRTY │ ◄── Auto-created on check-out
    └───┬────┘
        │
        │  Cleaner assigned + starts
        ▼
    ┌────────────┐
    │IN PROGRESS │ ◄── Cleaning underway
    └─────┬──────┘
          │
          │  Cleaning complete
          ▼
    ┌─────────┐
    │CLEANED  │ ◄── Ready for inspection
    └────┬────┘
         │
         │  Supervisor inspects
         ▼
    ┌───────────┐
    │INSPECTED  │ ◄── Room ready for guests
    └───────────┘
```

### Valid Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| `Dirty` | `In Progress` | Start cleaning | Housekeeping |
| `Dirty` | `Dirty` | Re-assign cleaner | Supervisor |
| `In Progress` | `Cleaned` | Finish cleaning | Housekeeping |
| `Cleaned` | `Inspected` | Pass inspection | Supervisor |
| `Cleaned` | `Dirty` | Fail inspection | Supervisor |

### Priority Rules
| Priority | Trigger | SLA |
|----------|---------|-----|
| `High` | VIP guest arriving today | 2 hours |
| `High` | Checkout before 12 PM with same-day arrival | 2 hours |
| `Medium` | Standard checkout | 4 hours |
| `Low` | Deep clean / post-stay | 24 hours |

---

## 4. Payment State Machine

```
    ┌─────────┐
    │ PENDING │ ◄── Payment initiated
    └────┬────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  Processing successful       │  Processing fails
         ▼                              ▼
    ┌───────────┐                 ┌──────────┐
    │ COMPLETED │                 │  FAILED  │
    └─────┬─────┘                 └──────────┘
          │
          ├──────────────────────────────┐
          │                              │
          │  Refund requested            │  Partial payment
          ▼                              ▼
    ┌───────────┐                 ┌──────────┐
    │ REFUNDED  │                 │ PARTIAL  │ ──► back to PENDING
    └───────────┘                 └──────────┘
```

### Valid Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| `pending` | `completed` | Payment processed | System |
| `pending` | `failed` | Payment declined | System |
| `pending` | `partial` | Partial payment received | System |
| `partial` | `pending` | Additional payment needed | System |
| `partial` | `completed` | Full payment received | System |
| `completed` | `refunded` | Refund processed | Manager |

### Payment Rules
1. **Deposit Requirement**: If `DepositRequirement.required = true`, booking cannot move to `guaranteed` until deposit is paid
2. **Split Payments**: Multiple `PaymentSplit` entries can satisfy a single `PaymentTimeline`
3. **Refund Limits**: Refund cannot exceed `totalPaid - previouslyRefunded`
4. **Payment Methods**: Each method has its own processing rules:
   - `cash`: Immediate completion
   - `card`: Requires authorization
   - `upi`: QR code scan
   - `bank_transfer`: May take 1-3 days

---

## 5. Order (POS) State Machine

```
    ┌──────┐
    │ OPEN │ ◄── Cart being built
    └──┬───┘
       │
       │  Staff submits order
       ▼
    ┌───────────┐
    │ SUBMITTED │ ◄── Sent to kitchen
    └─────┬─────┘
          │
          │  Kitchen starts preparing
          ▼
    ┌───────────┐
    │PREPARING  │ ◄── Being cooked
    └─────┬─────┘
          │
          │  Food ready
          ▼
    ┌───────┐
    │ READY │ ◄── Ready to serve
    └───┬───┘
        │
        │  Served to table
        ▼
    ┌───────┐
    │ SERVED │ ◄── Guest eating
    └───┬───┘
        │
        │  Payment processed
        ▼
    ┌─────┐
    │ PAID │ ◄── Terminal state
    └─────┘
```

### Valid Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| `open` | `submitted` | Submit order | POS Staff |
| `submitted` | `preparing` | Start preparation | Kitchen |
| `preparing` | `ready` | Food ready | Kitchen |
| `ready` | `served` | Served to table | POS Staff |
| `served` | `paid` | Payment complete | POS Staff |

---

## 6. KDS Ticket State Machine

```
    ┌─────────┐
    │   NEW   │ ◄── Order just received
    └────┬────┘
         │
         │  Kitchen starts
         ▼
    ┌───────────┐
    │PREPARING  │ ◄── Being prepared
    └─────┬─────┘
          │
          │  All items ready
          ▼
    ┌───────┐
    │ READY │ ◄── Ready for pickup
    └───────┘
```

---

## 7. Approval Request State Machine

```
    ┌─────────┐
    │ PENDING │ ◄── Request submitted
    └────┬────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  Manager approves            │  Manager rejects
         ▼                              ▼
    ┌──────────┐                ┌──────────┐
    │ APPROVED │                │ REJECTED │
    └──────────┘                └──────────┘
```

### Valid Transitions

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| `pending` | `approved` | Manager approves | Manager |
| `pending` | `rejected` | Manager rejects | Manager |

### Timeout Rule
- Pending approvals older than 24 hours are auto-escalated to GM
- Pending approvals older than 48 hours are auto-rejected with notification

---

## 8. Waitlist Entry State Machine

```
    ┌─────────┐
    │ WAITING │ ◄── Guest added to waitlist
    └────┬────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  Room becomes available      │  30 days pass without availability
         ▼                              ▼
    ┌─────────┐                   ┌──────────┐
    │ OFFERED │                   │ EXPIRED  │
    └────┬────┘                   └──────────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  Guest books                 │  Guest declines
         ▼                              ▼
    ┌───────────┐                ┌──────────┐
    │ CONVERTED │                │ WAITING  │ ──► back to queue
    └───────────┘                └──────────┘
```

---

## 9. Staff Shift State Machine

```
    ┌───────────┐
    │ SCHEDULED │ ◄── Shift created
    └─────┬─────┘
          │
          │  Clock in
          ▼
    ┌────────────┐
    │ CLOCKED IN │ ◄── On duty
    └─────┬──────┘
          │
          ├──────────────────────────────┐
          │                              │
          │  Clock out                   │  Mark absent
          ▼                              ▼
    ┌────────────┐                ┌──────────┐
    │CLOCKED OUT │                │  ABSENT  │
    └────────────┘                └──────────┘
```

---

## 10. Discount Code State Machine

```
    ┌─────────┐
    │ ACTIVE  │ ◄── Code available for use
    └────┬────┘
         │
         ├──────────────────────────────┐
         │                              │
         │  max_uses reached            │  valid_to passed
         ▼                              ▼
    ┌─────────┐                   ┌─────────┐
    │EXHAUSTED│                   │ EXPIRED │
    └─────────┘                   └─────────┘
```

---

## Cross-Entity State Interactions

### Reservation ↔ Room Status
```
Reservation: confirmed → guaranteed → checked_in
                    ↓
Room: available → occupied → dirty → cleaning → inspected → available
```

### Reservation ↔ Housekeeping
```
Reservation: checked_out
                    ↓
Room: occupied → dirty
                    ↓
HousekeepingTask: dirty → in_progress → cleaned → inspected
                    ↓
Room: inspected → available
                    ↓
(Available for next reservation)
```

### Reservation ↔ Payment
```
Reservation: draft → pending
                    ↓
Payment: pending → completed
                    ↓
Reservation: pending → confirmed
                    ↓
Payment: (deposit) → completed
                    ↓
Reservation: confirmed → guaranteed
```

### Reservation ↔ Folio
```
Reservation: checked_in
    ↓ (charges accumulate)
Folio: room + restaurant + minibar + service charges
    ↓
Reservation: checked_out
    ↓
Folio: settle (total = charges + tax - discounts)
    ↓
Payment: complete settlement
    ↓
Reservation: completed
```

---

## State Machine Implementation in Code

### Current Implementation Locations

| State Machine | File | Status |
|---------------|------|--------|
| Reservation | `stores/useDraftStore.ts` | ✅ `STATUS_TRANSITIONS` map |
| Room Status | `lib/context/frontdesk-context.tsx` | ✅ `RoomStatus` type |
| Housekeeping | `lib/context/housekeeping-context.tsx` | ✅ `STATUS_ORDER` array |
| Payment | `stores/usePaymentStore.ts` | ✅ `PaymentStatus` type |
| Order (POS) | `lib/context/restaurant-context.tsx` | ✅ Ticket advancement |
| KDS Ticket | `stores/useOrderStore.ts` | ✅ `advanceTicketStatus` |
| Approval | `stores/useReservationIntelligenceStore.ts` | 📋 Designed |
| Waitlist | `docs/enterprise-architecture.md` | 📋 Designed |
| Shift | `types/api.ts` | ✅ Status enum only |
| Discount Code | `types/api.ts` | ✅ `is_active` flag only |

### Recommended: Centralized State Machine Service

```typescript
// lib/state-machine.ts (proposed)
interface StateMachineConfig<T extends string> {
  states: T[];
  transitions: Record<T, T[]>;
  guards: Record<string, (context: any) => boolean>;
  actions: Record<string, (context: any) => void>;
}

export function createStateMachine<T extends string>(config: StateMachineConfig<T>) {
  return {
    canTransition: (from: T, to: T, context?: any): boolean => {
      const allowed = config.transitions[from] || [];
      if (!allowed.includes(to)) return false;
      // Check guards
      const guardKey = `${from}→${to}`;
      if (config.guards[guardKey] && context) {
        return config.guards[guardKey](context);
      }
      return true;
    },
    transition: (from: T, to: T, context: any): { success: boolean; error?: string } => {
      if (!config.transitions[from]?.includes(to)) {
        return { success: false, error: `Invalid transition: ${from} → ${to}` };
      }
      const guardKey = `${from}→${to}`;
      if (config.guards[guardKey] && !config.guards[guardKey](context)) {
        return { success: false, error: `Guard failed for ${from} → ${to}` };
      }
      const actionKey = `${from}→${to}`;
      if (config.actions[actionKey]) {
        config.actions[actionKey](context);
      }
      return { success: true };
    },
  };
}
```
