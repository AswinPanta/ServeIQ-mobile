# ServeIQ — Reservation Domain Model

> Source of Truth v1.0 — July 2026

---

## Entity Overview

```
ServeIQ Domain
│
├── Tenant (Organization)
│   └── Property (Hotel/Resort/Villa)
│       ├── RoomType
│       │   ├── ExtraCharge
│       │   └── RatePlan
│       ├── Room (Physical Unit)
│       │   └── BlockedDate
│       ├── Staff
│       │   └── Shift
│       ├── DiscountCode
│       ├── SpecialOffer
│       ├── TaxConfig
│       ├── MenuItem
│       │   └── MenuModifier
│       └── TableSection
│           └── Table
│
├── Reservation (Booking)
│   ├── Guest (Profile)
│   ├── Payment
│   │   └── PaymentSplit
│   ├── Folio
│   │   └── FolioCharge
│   ├── AddOn
│   ├── Timeline (Audit Trail)
│   ├── ApprovalRequest
│   └── WaitlistEntry
│
├── GroupReservation
│   └── SubReservation[]
│
├── HousekeepingTask
│
├── Order (POS)
│   └── OrderItem
│
├── KDSTicket
│   └── KDSTicketItem
│
└── GuestDocument
```

---

## 1. Tenant

**Purpose:** Top-level organization. A host owns one or more tenants (brands). A tenant owns properties.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `brand_name` | string | ✅ | Display name (e.g. "Grand Himalaya Hotels") |
| `logo_url` | string? | | Brand logo |
| `brand_color` | string? | | Hex color for branding |
| `custom_domain` | string? | | Optional custom booking domain |
| `is_active` | boolean | ✅ | Soft-delete flag |
| `created_at` | ISO timestamp | ✅ | Creation time |
| `updated_at` | ISO timestamp | ✅ | Last modification |

**Relationships:**
- 1 Tenant → N Properties
- 1 Tenant → N StaffMembers

**Lifecycle:** Created by Host during registration → SuperAdmin can suspend/activate

---

## 2. Property

**Purpose:** A physical hotel/resort/villa with rooms, staff, and operations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `tenant_id` | UUID (FK) | ✅ | Owning tenant |
| `name` | string | ✅ | Property name |
| `type` | PropertyType | ✅ | HOTEL, RESORT, VILLA, APARTMENT, BOUTIQUE, COTTAGE, HOSTEL, GUEST_HOUSE |
| `description` | string | ✅ | Rich text description |
| `country`, `state`, `city`, `zip_code`, `address` | string | ✅ | Location fields |
| `latitude`, `longitude` | number | ✅ | GPS coordinates |
| `check_in_time_from` | time string | ✅ | Earliest check-in (e.g. "14:00") |
| `check_in_time_to` | time string | ✅ | Latest check-in (e.g. "12:00" next day) |
| `check_out_time_from` | time string | ✅ | Earliest check-out |
| `check_out_time_to` | time string | ✅ | Latest check-out |
| `number_of_floors` | number | ✅ | Total floors |
| `total_rooms` | number | ✅ | Total room count |
| `year_built` | number | ✅ | Construction year |
| `amenities` | string[] | ✅ | Facility-level amenities |
| `is_active` | boolean | ✅ | Soft-delete flag |
| `currency` | string | ✅ | Base currency code (e.g. "NPR") |
| `timezone` | string | ✅ | IANA timezone |
| `brand_color` | string? | | Property-specific accent |
| `min_rate_floor` | number? | | Minimum allowed rate |
| `logo_url` | string? | | Property logo |
| `cancellation_policy` | CancellationPolicy | ✅ | FLEXIBLE, MODERATE, STRICT |
| `photos` | PropertyPhoto[] | ✅ | Organized by category |

**Lifecycle:** Created in Listing Wizard → Published (is_active=true) → Can be deactivated

**Relationships:**
- N Properties → 1 Tenant
- 1 Property → N Rooms
- 1 Property → N RoomTypes
- 1 Property → N StaffMembers
- 1 Property → N Reservations (via Room)

---

## 3. RoomType

**Purpose:** Defines a category of rooms (e.g. "Standard", "Deluxe", "Suite") with shared attributes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `room_type_name` | string | ✅ | Display name |
| `is_default` | boolean | ✅ | Default type for quick booking |
| `description` | string | ✅ | Room type description |
| `max_occupancy` | number | ✅ | Maximum guests |
| `bed_configuration` | string | ✅ | e.g. "King + Twin" |
| `view_type` | string | ✅ | e.g. "Mountain", "Lake", "City" |
| `amenities` | string[] | ✅ | Room-level amenities |
| `photos` | string[] | ✅ | Photo URLs |
| `base_rate` | number | ✅ | Default nightly rate |
| `rate_plan` | string | ✅ | Associated rate plan name |
| `extra_charges` | ExtraCharge[] | ✅ | Additional fees |
| `created_at`, `updated_at` | ISO timestamps | ✅ | Audit fields |

**Relationships:**
- N RoomTypes → 1 Property
- 1 RoomType → N ExtraCharges
- 1 RoomType → N Rooms (physical units)

---

## 4. Room (Physical Unit)

**Purpose:** A specific bookable room (e.g. Room 101, Room 302).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `room_type_id` | UUID (FK) | ✅ | Room type classification |
| `room_name` | string | ✅ | Display name (e.g. "Room 101") |
| `floor_number` | number | ✅ | Floor location |
| `max_adults` | number | ✅ | Adult capacity |
| `max_children` | number | ✅ | Child capacity |
| `base_rate` | number | ✅ | Room-specific rate override |
| `status` | AdminRoomStatus | ✅ | Current operational status |
| `smoking` | boolean | ✅ | Smoking allowed |
| `accessible` | boolean | ✅ | Accessibility features |
| `cancellation_policy` | CancellationPolicy | ✅ | Room-level override |
| `cancellation_notes` | string? | | Custom policy text |
| `photos` | string[] | ✅ | Room-specific photos |
| `amenities` | string[] | ✅ | Room-specific amenities |
| `blocked_dates` | BlockedDate[] | ✅ | Out-of-service periods |
| `maintenance_return_date` | string? | | Expected return from maintenance |

**Room Status Values:**
- `AVAILABLE` — Ready for check-in
- `OCCUPIED` — Guest currently staying
- `DIRTY` — Needs cleaning (post-checkout)
- `CLEANING` — Housekeeping in progress
- `INSPECTED` — Cleaned and verified
- `MAINTENANCE` — Out of order
- `BLOCKED` — Manually blocked (event, hold)

**Relationships:**
- N Rooms → 1 RoomType
- 1 Room → N Reservations (time-segmented)
- 1 Room → N HousekeepingTasks

---

## 5. ExtraCharge

**Purpose:** Additional fees that can be attached to room types.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `name` | string | ✅ | Charge name (e.g. "Late Check-out") |
| `price` | number | ✅ | Amount in base currency |
| `charge_type` | enum | ✅ | `per_night` or `one_time` |
| `description` | string? | | Explanation of the charge |

---

## 6. RatePlan

**Purpose:** Defines pricing rules for room types across dates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `name` | string | ✅ | Plan name (e.g. "Standard Rate") |
| `description` | string | ✅ | Plan description |
| `base_rate_per_room_type` | Record<string, number> | ✅ | Room type → rate mapping |
| `rate_type` | enum | ✅ | `standard` or `day_of_week` |
| `weekday_rate` | Record<string, number>? | | Mon-Thu rates by room type |
| `weekend_rate` | Record<string, number>? | | Fri-Sun rates by room type |
| `min_stay` | number | ✅ | Minimum nights |
| `max_stay` | number | ✅ | Maximum nights |
| `is_active` | boolean | ✅ | Active flag |

**Relationships:**
- N RatePlans → 1 Property
- 1 RatePlan → N DateOverrides

---

## 7. DateOverride

**Purpose:** Temporary rate adjustments for specific date ranges (holidays, events).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `room_type_id` | UUID (FK) | ✅ | Target room type |
| `rate_plan_id` | UUID (FK) | ✅ | Target rate plan |
| `start_date` | date string | ✅ | Override start |
| `end_date` | date string | ✅ | Override end |
| `override_price` | number | ✅ | New price for this period |
| `reason` | string | ✅ | Explanation (e.g. "New Year Peak") |

---

## 8. Reservation (Booking)

**Purpose:** The core entity — represents a guest's booking at a property.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `ref` | string | ✅ | Human-readable reference (e.g. "BK-1001") |
| `property_id` | UUID (FK) | ✅ | Booked property |
| `guest_id` | UUID (FK) | ✅ | Guest profile |
| `room_type_id` | UUID (FK) | ✅ | Requested room type |
| `room_id` | UUID (FK)? | | Assigned room (null until check-in) |
| `guest_name` | string | ✅ | Guest display name |
| `email` | string | ✅ | Guest email |
| `phone` | string? | | Guest phone |
| `check_in` | date string | ✅ | Arrival date |
| `check_out` | date string | ✅ | Departure date |
| `adults` | number | ✅ | Adult count |
| `children` | number | ✅ | Child count |
| `status` | ReservationStatus | ✅ | Current lifecycle state |
| `source` | BookingSource | ✅ | How booking was created |
| `total_price` | number | ✅ | Total amount |
| `currency` | string | ✅ | Price currency |
| `payment_status` | PaymentStatus | ✅ | Payment state |
| `special_requests` | string? | | Guest notes |
| `confirmation_code` | string | ✅ | Guest-facing confirmation |
| `qr_code` | string? | | QR code for self-check-in |
| `id_number` | string? | | Government ID for registration |
| `company` | string? | | Corporate booking company name |
| `ota_ref` | string? | | OTA booking reference |
| `vip` | boolean | ✅ | VIP flag |
| `blacklisted` | boolean | ✅ | Blacklist flag |
| `group_id` | UUID (FK)? | | Group reservation parent |
| `created_at`, `updated_at` | ISO timestamps | ✅ | Audit fields |

**Booking Sources:**
- `walk_in` — Guest arrived without reservation
- `phone` — Phone reservation
- `online` — Direct website/app booking
- `ota` — Online Travel Agency (Booking.com, Expedia, etc.)
- `corporate` — Company/contract rate
- `agent` — Travel agent

**Reservation Status:** → See State Machines doc

**Relationships:**
- N Reservations → 1 Property
- N Reservations → 1 Guest
- 1 Reservation → 1 Room (assigned at check-in)
- 1 Reservation → N Payments
- 1 Reservation → 1 Folio
- 1 Reservation → N AddOns
- 1 Reservation → N TimelineEvents
- 1 Reservation → N ApprovalRequests
- 1 Reservation → N AuditEntries

---

## 9. Guest (Profile)

**Purpose:** Guest identity and loyalty information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `email` | string | ✅ | Primary email (unique) |
| `phone` | string | ✅ | Primary phone |
| `name` | string | ✅ | Full name |
| `nationality` | string | ✅ | Country code |
| `document_type` | string? | | passport, id_card, drivers_license |
| `document_number` | string? | | ID number |
| `profile_image` | string? | | Avatar URL |
| `is_verified` | boolean | ✅ | Email/phone verified |
| `loyalty_points` | number | ✅ | Accumulated points |
| `loyalty_tier` | LoyaltyTier | ✅ | BRONZE, SILVER, GOLD, PLATINUM |
| `total_stays` | number | ✅ | Lifetime stay count |
| `total_spent` | number | ✅ | Lifetime spending |
| `vip` | boolean | ✅ | VIP status |
| `blacklisted` | boolean | ✅ | Blacklist status |
| `notes` | string? | | Staff notes about guest |
| `created_at`, `updated_at` | ISO timestamps | ✅ | Audit fields |

**Loyalty Tiers:**
| Tier | Points Required | Benefits |
|------|-----------------|----------|
| BRONZE | 0 | Base rate |
| SILVER | 500 | 5% discount, priority check-in |
| GOLD | 2,000 | 10% discount, room upgrade, late checkout |
| PLATINUM | 5,000 | 15% discount, suite upgrade, free breakfast, concierge |

**Relationships:**
- 1 Guest → N Reservations
- 1 Guest → N GuestDocuments

---

## 10. Payment

**Purpose:** Financial transaction against a reservation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `booking_ref` | string | ✅ | Reservation reference |
| `type` | PaymentType | ✅ | payment, deposit, refund, chargeback |
| `method` | PaymentMethod | ✅ | cash, card, upi, wallet, bank_transfer, credit_note |
| `amount` | number | ✅ | Transaction amount (negative for refunds) |
| `status` | PaymentStatus | ✅ | pending, partial, completed, refunded, failed |
| `reference` | string? | | Transaction reference number |
| `note` | string? | | Staff note |
| `processed_by` | string | ✅ | Staff member who processed |
| `processed_at` | ISO timestamp | ✅ | Transaction time |

**Payment Methods:**
- `cash` — Cash payment
- `card` — Credit/debit card
- `upi` — UPI (India/Nepal)
- `wallet` — Digital wallet
- `bank_transfer` — Bank wire
- `credit_note` — Applied credit

**Relationships:**
- N Payments → 1 Reservation

---

## 11. PaymentSplit

**Purpose:** Enables split payments across multiple methods.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | PaymentMethod | ✅ | Payment method |
| `amount` | number | ✅ | Amount for this split |
| `reference` | string? | | Transaction reference |
| `processed_at` | ISO timestamp | ✅ | When processed |

---

## 12. DepositRequirement

**Purpose:** Tracks advance deposit requirements for bookings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `required` | boolean | ✅ | Whether deposit is needed |
| `percentage` | number | ✅ | Deposit percentage (e.g. 30) |
| `amount` | number | ✅ | Deposit amount |
| `due_date` | date string | ✅ | Payment deadline |
| `paid` | number | ✅ | Amount already paid |
| `outstanding` | number | ✅ | Remaining deposit |

---

## 13. Folio

**Purpose:** Running account of all charges for a reservation (hotel ledger).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `booking_ref` | string | ✅ | Reservation reference |
| `guest_name` | string | ✅ | Guest display name |
| `room_number` | string | ✅ | Assigned room |
| `charges` | FolioCharge[] | ✅ | All posted charges |
| `subtotal` | number | ✅ | Sum of charges |
| `tax` | number | ✅ | Tax total |
| `discount` | number | ✅ | Applied discount |
| `total` | number | ✅ | Final amount |
| `settled` | boolean | ✅ | Payment complete |

**Relationships:**
- 1 Folio → 1 Reservation
- 1 Folio → N FolioCharges

---

## 14. FolioCharge

**Purpose:** Individual line item on a folio.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `description` | string | ✅ | Charge description |
| `amount` | number | ✅ | Charge amount |
| `category` | ChargeCategory | ✅ | room, restaurant, minibar, laundry, spa, service, other |
| `posted_at` | ISO timestamp | ✅ | When charged |
| `posted_by` | string | ✅ | Who posted the charge |

---

## 15. AddOn

**Purpose:** Extra services/products added to a reservation at booking time.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Add-on name |
| `price` | number | ✅ | Unit price |
| `quantity` | number | ✅ | Quantity |

**Common AddOns:** Airport transfer, breakfast package, spa credit, early check-in, late checkout, extra bed, minibar package

---

## 16. TimelineEvent (Audit Trail)

**Purpose:** Immutable log of every action taken on a reservation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `booking_ref` | string | ✅ | Reservation reference |
| `type` | TimelineEventType | ✅ | Action type |
| `description` | string | ✅ | Human-readable description |
| `old_value` | string? | | Previous value (for modifications) |
| `new_value` | string? | | New value (for modifications) |
| `performed_by` | string | ✅ | User/staff who performed action |
| `timestamp` | ISO timestamp | ✅ | When action occurred |

**Event Types:** created, modified, room_changed, payment_added, checked_in, checked_out, cancelled, note_added, rate_changed

**Relationships:**
- N TimelineEvents → 1 Reservation

---

## 17. ApprovalRequest

**Purpose:** Tracks requests that require manager approval.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `type` | ApprovalType | ✅ | discount_override, cancellation, rate_change, refund, upgrade |
| `requested_by` | string | ✅ | Requesting staff member |
| `booking_ref` | string | ✅ | Related reservation |
| `details` | string | ✅ | Request description |
| `old_value` | string | ✅ | Current value |
| `new_value` | string | ✅ | Requested value |
| `status` | ApprovalStatus | ✅ | pending, approved, rejected |
| `reviewed_by` | string? | | Approving manager |
| `reviewed_at` | ISO timestamp? | | Review time |
| `reason` | string? | | Rejection reason |

**Approval Matrix:**
| Action | Front Desk | Manager | GM | Admin |
|--------|-----------|---------|-----|-------|
| Standard booking | ✅ | ✅ | ✅ | ✅ |
| Discount ≤10% | ❌ | ✅ | ✅ | ✅ |
| Discount ≤20% | ❌ | ✅ | ✅ | ✅ |
| Discount >20% | ❌ | ❌ | ✅ | ✅ |
| Refund | ❌ | ✅ (≤50%) | ✅ | ✅ |
| Room upgrade | ❌ | ✅ | ✅ | ✅ |
| Cancellation | ❌ | ✅ | ✅ | ✅ |

**Relationships:**
- N ApprovalRequests → 1 Reservation

---

## 18. WaitlistEntry

**Purpose:** Queue for sold-out dates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Target property |
| `guest_name` | string | ✅ | Guest name |
| `email` | string | ✅ | Contact email |
| `phone` | string | ✅ | Contact phone |
| `preferred_room_type` | string | ✅ | Desired room type |
| `preferred_dates` | { checkIn, checkOut } | ✅ | Requested dates |
| `requested_at` | ISO timestamp | ✅ | When added to waitlist |
| `status` | WaitlistStatus | ✅ | waiting, offered, converted, expired |
| `notes` | string? | | Special requests |

**Relationships:**
- N WaitlistEntries → 1 Property

---

## 19. GroupReservation

**Purpose:** Manages multi-room bookings under a single master reservation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `master_booking_ref` | string | ✅ | Primary reservation reference |
| `name` | string | ✅ | Group name (e.g. "Smith Family Reunion") |
| `sub_bookings` | SubReservation[] | ✅ | Individual room bookings |
| `billing_type` | BillingType | ✅ | master (single bill), split (per-room), individual |
| `notes` | string? | | Group notes |

**SubReservation:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ref` | string | ✅ | Sub-booking reference |
| `guest_name` | string | ✅ | Sub-guest name |
| `room_type` | string | ✅ | Room type |
| `room_number` | string? | | Assigned room |
| `check_in`, `check_out` | date strings | ✅ | Stay dates |
| `total_price` | number | ✅ | Sub-booking amount |

**Relationships:**
- 1 GroupReservation → N Reservations

---

## 20. GuestDocument

**Purpose:** Uploaded documents (passport, visa, consent forms).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `guest_id` | UUID (FK) | ✅ | Owning guest |
| `type` | DocumentType | ✅ | passport, visa, id_card, voucher, consent_form, other |
| `file_name` | string | ✅ | Original filename |
| `file_url` | string | ✅ | Storage URL |
| `uploaded_at` | ISO timestamp | ✅ | Upload time |
| `uploaded_by` | string | ✅ | Who uploaded |
| `notes` | string? | | Description |

**Relationships:**
- N GuestDocuments → 1 Guest

---

## 21. HousekeepingTask

**Purpose:** Cleaning/maintenance task for a room.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `room_id` | UUID (FK) | ✅ | Target room |
| `room_name` | string | ✅ | Room display name |
| `status` | HKTaskStatus | ✅ | Dirty, In Progress, Cleaned, Inspected |
| `assigned_cleaner` | string? | | Assigned staff member |
| `notes` | string? | | Cleaning notes |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `priority` | Priority | ✅ | High, Medium, Low |
| `due_date` | date string | ✅ | When needed by |
| `created_at`, `updated_at` | ISO timestamps | ✅ | Audit fields |

**Task Status Flow:**
```
Dirty → In Progress → Cleaned → Inspected
```

**Relationships:**
- N HousekeepingTasks → 1 Room

---

## 22. StaffMember

**Purpose:** Property employee with role-based access.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `tenant_id` | UUID (FK) | ✅ | Owning tenant |
| `email` | string | ✅ | Work email |
| `first_name`, `last_name` | string | ✅ | Name |
| `phone` | string | ✅ | Contact phone |
| `role` | StaffRole | ✅ | manager, front_desk, housekeeping, waiter, kitchen, maintenance |
| `property_id` | UUID (FK) | ✅ | Assigned property |
| `is_active` | boolean | ✅ | Employment status |
| `pos_discount_limit` | number | ✅ | Max discount % allowed |

**Relationships:**
- N StaffMembers → 1 Tenant
- N StaffMembers → 1 Property

---

## 23. Shift

**Purpose:** Scheduled work shift for a staff member.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Property |
| `staff_id` | UUID (FK) | ✅ | Staff member |
| `staff_name` | string | ✅ | Display name |
| `date` | date string | ✅ | Shift date |
| `start_time` | time string | ✅ | Shift start |
| `end_time` | time string | ✅ | Shift end |
| `status` | ShiftStatus | ✅ | scheduled, clocked_in, clocked_out, absent |

---

## 24. StaffTask

**Purpose:** General task assigned to staff (not room-specific).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Property |
| `assigned_to` | UUID (FK) | ✅ | Staff member |
| `assigned_name` | string | ✅ | Display name |
| `title` | string | ✅ | Task title |
| `description` | string | ✅ | Task details |
| `priority` | Priority | ✅ | High, Medium, Low |
| `status` | TaskStatus | ✅ | pending, in_progress, completed |
| `due_date` | date string | ✅ | Deadline |
| `completed_at` | ISO timestamp? | | Completion time |

---

## 25. DiscountCode

**Purpose:** Promo codes for discounts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `code` | string | ✅ | Promo code (unique per property) |
| `type` | DiscountType | ✅ | PERCENTAGE or FIXED |
| `discount_value` | number | ✅ | Discount amount/percentage |
| `min_amount` | number | ✅ | Minimum booking amount |
| `max_uses` | number | ✅ | Total allowed uses |
| `used_count` | number | ✅ | Current usage count |
| `valid_from`, `valid_to` | date strings | ✅ | Validity window |
| `applicable_room_types` | string[] | ✅ | Room types this applies to |
| `combinable` | boolean | ✅ | Can stack with other offers |
| `is_active` | boolean | ✅ | Active flag |

---

## 26. SpecialOffer

**Purpose:** Time-bound promotional offers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `title` | string | ✅ | Offer title |
| `description` | string? | | Offer details |
| `discount_percentage` | number | ✅ | Discount percent |
| `start_date`, `end_date` | date strings | ✅ | Validity window |
| `is_active` | boolean | ✅ | Active flag |
| `is_custom` | boolean | ✅ | Manually created vs auto-generated |
| `conditions` | OfferConditions? | | Trigger conditions |

**Offer Conditions:**
| Field | Type | Description |
|-------|------|-------------|
| `advance_days` | number | Book N+ days in advance |
| `within_days` | number | Check in within N days |
| `min_nights` | number | Minimum stay length |

---

## 27. TaxConfig

**Purpose:** Tax rules for a property.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Owning property |
| `name` | string | ✅ | Tax name (e.g. "VAT", "Service Charge") |
| `type` | TaxType | ✅ | PERCENTAGE or FLAT |
| `rate` | number | ✅ | Tax rate/amount |
| `is_inclusive` | boolean | ✅ | Included in displayed price |
| `is_active` | boolean | ✅ | Active flag |

---

## 28. BlockedDate

**Purpose:** Dates when a room is unavailable.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | date string | ✅ | Block start |
| `end` | date string | ✅ | Block end |
| `reason` | string | ✅ | Why blocked (maintenance, event, hold) |

---

## 29. RoomBlock

**Purpose:** Reserve rooms for events/groups before general release.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `property_id` | UUID (FK) | ✅ | Property |
| `name` | string | ✅ | Block name (e.g. "Wedding Block") |
| `room_numbers` | string[] | ✅ | Blocked rooms |
| `start_date`, `end_date` | date strings | ✅ | Block period |
| `release_date` | date string | ✅ | When unsold rooms return to inventory |
| `rate_override` | number? | | Special rate for blocked rooms |
| `contact_name` | string | ✅ | Contact person |
| `contact_email` | string | ✅ | Contact email |

---

## 30. POS Entities

### MenuItem
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `name` | string | ✅ | Item name |
| `price` | number | ✅ | Base price |
| `category` | string | ✅ | Food, Beverages, Desserts |
| `is_available` | boolean | ✅ | Currently available |
| `is_veg` | boolean | ✅ | Vegetarian flag |
| `tags` | string[] | ✅ | Search tags |
| `modifiers` | MenuModifier[] | | Customization options |

### MenuModifier
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `name` | string | ✅ | Modifier group name |
| `type` | enum | ✅ | single (pick one) or multiple (pick many) |
| `options` | ModifierOption[] | ✅ | Available choices |

### ModifierOption
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | ✅ | Option display name |
| `price` | number | ✅ | Price adjustment |

### TableSection
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Section name (Indoor, Outdoor) |
| `icon` | string | ✅ | Section icon |
| `color` | string | ✅ | Section color |
| `tables` | Table[] | ✅ | Tables in section |

### Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `number` | string | ✅ | Table number |
| `section` | string | ✅ | Section name |
| `capacity` | number | ✅ | Seating capacity |
| `status` | TableStatus | ✅ | Free, Occupied, Reserved |
| `order_id` | string? | | Active order reference |
| `server_name` | string? | | Assigned server |

### Order
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `table_id` | UUID (FK) | ✅ | Target table |
| `items` | OrderItem[] | ✅ | Ordered items |
| `status` | OrderStatus | ✅ | open, submitted, preparing, ready, served, paid |
| `subtotal` | number | ✅ | Item total |
| `tax` | number | ✅ | Tax amount |
| `total` | number | ✅ | Final amount |
| `notes` | string? | | Special instructions |
| `created_at`, `updated_at` | ISO timestamps | ✅ | Audit fields |

### KDSTicket
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Unique identifier |
| `order_id` | UUID (FK) | ✅ | Source order |
| `table_number` | string | ✅ | Table identifier |
| `items` | KDSTicketItem[] | ✅ | Kitchen items |
| `status` | KDSStatus | ✅ | pending, in_progress, ready |
| `notes` | string? | | Kitchen notes |
| `elapsed_seconds` | number | ✅ | Time since order |

---

## Type Enums Reference

```typescript
type PropertyType = 'HOTEL' | 'RESORT' | 'VILLA' | 'APARTMENT' | 'BOUTIQUE' | 'COTTAGE' | 'HOSTEL' | 'GUEST_HOUSE';
type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';
type AdminRoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE' | 'BLOCKED';
type ReservationStatus = 'draft' | 'pending' | 'confirmed' | 'guaranteed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show';
type BookingSource = 'walk_in' | 'phone' | 'online' | 'ota' | 'corporate' | 'agent';
type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer' | 'credit_note';
type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded' | 'failed';
type PaymentType = 'payment' | 'deposit' | 'refund' | 'chargeback';
type StaffRole = 'manager' | 'front_desk' | 'housekeeping' | 'waiter' | 'kitchen' | 'maintenance';
type OperatorRole = 'front_desk' | 'housekeeping' | 'pos' | 'kds' | 'manager';
type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
type HKTaskStatus = 'Dirty' | 'In Progress' | 'Cleaned' | 'Inspected';
type Priority = 'high' | 'medium' | 'low';
type TableStatus = 'Free' | 'Occupied' | 'Reserved';
type OrderStatus = 'open' | 'submitted' | 'preparing' | 'ready' | 'served' | 'paid';
type KDSStatus = 'pending' | 'in_progress' | 'ready';
type ApprovalType = 'discount_override' | 'cancellation' | 'rate_change' | 'refund' | 'upgrade';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type WaitlistStatus = 'waiting' | 'offered' | 'converted' | 'expired';
type BillingType = 'master' | 'split' | 'individual';
type DocumentType = 'passport' | 'visa' | 'id_card' | 'voucher' | 'consent_form' | 'other';
type ChargeCategory = 'room' | 'restaurant' | 'minibar' | 'laundry' | 'spa' | 'service' | 'other';
type DiscountType = 'PERCENTAGE' | 'FIXED';
type TaxType = 'PERCENTAGE' | 'FLAT';
```
