# Enterprise Architecture — StayEasy PMS (Phase 13)

## 1. Multi-Property Reservation Management

### Data Model
```
Property
  ├── id, name, brand_color, logo_url
  ├── Rooms[]
  ├── RatePlans[]
  ├── DiscountCodes[]
  ├── SpecialOffers[]
  └── Staff[]

Reservation (scoped to propertyId)
  ├── ref, guest_name, email, phone
  ├── room_type, room_number
  ├── check_in, check_out, status
  ├── source: 'walk_in' | 'phone' | 'online' | 'ota' | 'corporate' | 'agent'
  └── property_id (FK)
```

### Architecture Pattern
```typescript
// Each property has fully isolated:
// - Room inventory (FrontDeskRoom[])
// - Bookings (FrontDeskBooking[])
// - Folios (Folio[])
// - Staff shifts (ShiftStore)
// - Activity/timeline logs

// Property scoping is done via:
// 1. FrontDeskProvider({ propertyId }) — wraps ops screens
// 2. OPS_STORAGE_KEYS — per-property AsyncStorage keys
// 3. API calls — scoped to property_id in query/body
```

### Cross-Property Queries
- SuperAdmin sees aggregate across all properties
- Host portal manages their own properties
- Guest portal searches across all active properties

## 2. Multi-Currency Support

### Currency Storage
```typescript
interface CurrencyConfig {
  code: string;         // 'NPR' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY'
  symbol: string;       // 'रू' | '$' | '€' | '£'
  exchangeRate: number; // relative to base currency (NPR)
  isBase: boolean;      // only one per property
}

// Property-level currency setting
// Guest sees prices in their preferred currency
// Backend converts at current exchange rate
// Front desk operates in property's base currency
```

### Implementation Points
- `CountryCurrencyPicker` component already exists
- All `price` and `total` fields should be stored in base currency
- Display conversion happens at render time
- Exchange rates cached and refreshed daily

## 3. Full Audit Logging

### Audit Trail Data Model
```typescript
interface AuditEntry {
  id: string;
  bookingRef: string;
  action: 'created' | 'modified' | 'cancelled' | 'checked_in' | 'checked_out' | 'payment' | 'rate_changed' | 'room_changed' | 'note';
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  performedBy: string;    // user ID + name
  performedAt: string;     // ISO timestamp
  ipAddress?: string;      // for security audit
  reason?: string;         // for cancellations/overrides
}
```

### Current State
- `stores/useReservationIntelligenceStore.ts` has `addAuditEntry` and `getBookingAudit`
- `lib/context/frontdesk-context.tsx` has `TimelineEvent` tracking
- Need to wire: check-in/check-out context methods → audit store

## 4. Reservation Locking

```typescript
interface ReservationLock {
  bookingRef: string;
  lockedBy: string;      // user ID
  lockedAt: string;
  expiresAt: string;     // auto-release after 5 minutes
}
```

- Prevents concurrent edits by multiple front desk staff
- Auto-releases after timeout
- Shows "being edited by X" indicator

## 5. Group Bookings & Master/Sub Reservations

```typescript
interface GroupReservation {
  id: string;
  masterBookingRef: string;
  name: string;             // e.g. "Smith Family Reunion"
  subBookings: SubBooking[];
  billingType: 'master' | 'split' | 'individual';
  notes?: string;
}

interface SubBooking {
  ref: string;
  guestName: string;
  roomType: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}
```

## 6. Waitlist Management

```typescript
interface WaitlistEntry {
  id: string;
  propertyId: string;
  guestName: string;
  email: string;
  phone: string;
  preferredRoomType: string;
  preferredDates: { checkIn: string; checkOut: string };
  requestedAt: string;
  status: 'waiting' | 'offered' | 'converted' | 'expired';
  notes?: string;
}
```

## 7. Room Blocking for Events

```typescript
interface RoomBlock {
  id: string;
  propertyId: string;
  name: string;          // e.g. "Wedding Block"
  roomNumbers: string[];
  startDate: string;
  endDate: string;
  releaseDate: string;   // when unsold rooms release to general inventory
  rateOverride?: number;
  contactName: string;
  contactEmail: string;
}
```

## 8. Document Attachments

```typescript
interface GuestDocument {
  id: string;
  guestId: string;
  type: 'passport' | 'visa' | 'id_card' | 'voucher' | 'consent_form' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}
```

## 9. Role-Based Approval Workflow

```typescript
type ApprovalType = 'discount_override' | 'cancellation' | 'rate_change' | 'refund' | 'upgrade';

interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  bookingRef: string;
  details: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

// Approval matrix per role:
// - Front Desk: no override, standard rates only
// - Manager: up to 20% discount override
// - GM: up to 50% discount override
// - Admin: unlimited override
```

## 10. Booking Source Analytics

```typescript
interface BookingSourceReport {
  source: BookingSource;
  bookings: number;
  revenue: number;
  percentage: number;
  cancellationRate: number;
  avgStayLength: number;
}
```

### Current State
- `stores/useReservationAnalyticsStore.ts` has `getRevenueBySource()`
- Front desk new-booking wizard supports `source` field
- Dashboard shows source badges on booking cards

## Summary of Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| Multi-property rooms/bookings | ✅ | `frontdesk-context.tsx` |
| Multi-currency picker | ✅ | `CountryCurrencyPicker` |
| Audit trail timeline | ✅ | `frontdesk-context.tsx` + `useReservationIntelligenceStore.ts` |
| Reservation locking | 📋 | Design documented — not implemented |
| Group bookings | 📋 | Design documented — not implemented |
| Waitlist management | 📋 | Design documented — not implemented |
| Room blocking | 📋 | Design documented — not implemented |
| Document attachments | 📋 | Design documented — not implemented |
| Role-based approvals | 📋 | Design documented — not implemented |
| Booking source analytics | ✅ | `useReservationAnalyticsStore.ts` |

**Key:** ✅ Implemented · 📋 Designed/planned
