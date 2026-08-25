# ServeIQ — User Journeys

> Source of Truth v1.0 — July 2026

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY MAP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GUEST                RECEPTIONIST         HOUSEKEEPING        MANAGER      │
│  ─────                ────────────         ────────────        ───────      │
│  Search               Dashboard            Today's Rooms       Dashboard    │
│    ↓                    ↓                    ↓                    ↓         │
│  Book                 Search Reservation   Clean Room          Approvals    │
│    ↓                    ↓                    ↓                    ↓         │
│  Manage               Modify               Inspection          Reports      │
│    ↓                    ↓                    ↓                    ↓         │
│  Check-in             Assign Room          Ready               Analytics    │
│    ↓                    ↓                                          ↓         │
│  Stay                 Payment                                      Staff     │
│    ↓                    ↓                                          ↓         │
│  Checkout             Check-in/out                                  Settings  │
│    ↓                    ↓                                                │
│  Review               Checkout                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Guest Journey

### 1.1 Search & Discovery

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Home Page  │────►│  Search Form │────►│   Results    │────►│  Filters     │
│             │     │  (destination│     │   List       │     │  Modal       │
│  Hero CTA   │     │   dates,     │     │              │     │              │
│             │     │   guests)    │     │  Sort/View   │     │  Price, Star │
└─────────────┘     └──────────────┘     └──────────────┘     │  Type, Amen. │
                                                               └──────────────┘
```

**Touchpoints:**
- Hero section with search bar (date picker, guest count, destination)
- Search results with hotel cards (image, rating, price, badges)
- Filter modal (price range, star rating, property type, amenities, free cancellation)
- Sort options (price, rating, distance, popularity)

**Data Required:**
- `SearchParams`: destination, checkIn, checkOut, guests, rooms, children
- `SearchFilters`: priceRange, starRating, propertyType, amenities, freeCancellation
- `Hotel[]`: Full hotel data from API

---

### 1.2 Booking Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Hotel       │────►│  Room        │────►│  Guest       │────►│  Payment     │
│  Detail      │     │  Selection   │     │  Details     │     │              │
│              │     │              │     │              │     │              │
│  Photos      │     │  Room types  │     │  Name, Email │     │  Card/Cash   │
│  Amenities   │     │  Pricing     │     │  Phone       │     │  Split pay   │
│  Reviews     │     │  Policies    │     │  Requests    │     │  Promo code  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                               ┌──────────────┐
                                                               │ Confirmation │
                                                               │              │
                                                               │  QR Code     │
                                                               │  Ref code    │
                                                               │  Summary     │
                                                               └──────────────┘
```

**Touchpoints:**
- Hotel detail page (photos, amenities, reviews, map)
- Room selection (type, bed config, price, cancellation policy)
- Guest details form (auto-fill from profile)
- Payment page (card, cash, split, promo code)
- Confirmation page (QR code, reference number, summary)

**Validation Rules:**
- BR-001 to BR-010: Booking creation rules
- BR-030 to BR-036: Payment rules
- BR-043 to BR-047: Discount rules

---

### 1.3 Pre-Arrival Management

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  My Bookings │────►│  Booking     │────►│  Modify /    │
│              │     │  Detail      │     │  Cancel      │
│  Upcoming    │     │              │     │              │
│  Completed   │     │  Dates       │     │  Date change │
│  Cancelled   │     │  Room        │     │  Room change │
│              │     │  Payment     │     │  Cancellation│
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Booking list (tabs: Upcoming, Completed, Cancelled)
- Booking detail (dates, room, payment, timeline)
- Modify modal (date picker, room type selector)
- Cancel confirmation (policy explanation, refund calculation)

**Validation Rules:**
- BR-016 to BR-023: Cancellation rules
- BR-024 to BR-028: Modification rules

---

### 1.4 Check-In Experience

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Self        │────►│  ID          │────►│  Room        │────►│  Welcome     │
│  Check-in    │     │  Upload      │     │  Assignment  │     │  Screen      │
│              │     │              │     │              │     │              │
│  QR Scan     │     │  Passport    │     │  Floor map   │     │  WiFi code   │
│  Booking ref │     │  Visa        │     │  Room number │     │  Amenities   │
│              │     │  ID card     │     │  Digital key │     │  Service menu│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Self check-in entry (QR code or booking reference)
- Document upload (camera/gallery)
- Room assignment confirmation
- Welcome screen (WiFi, services, property info)

---

### 1.5 In-Stay Experience

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Services    │────►│  Request     │────►│  Status      │
│  Menu        │     │  Created     │     │  Update      │
│              │     │              │     │              │
│  Room service│     │  Confirmation│     │  In progress │
│  Dining      │     │  ETA         │     │  Completed   │
│  Spa         │     │              │     │              │
│  Transport   │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Service request menu (room service, dining, spa, transport)
- Request confirmation with ETA
- Real-time status updates
- Folio summary (charges breakdown)

---

### 1.6 Check-Out

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Self        │────►│  Folio       │────►│  Payment     │
│  Check-out   │     │  Review      │     │  Settlement  │
│              │     │              │     │              │
│  QR Code     │     │  Charges     │     │  Card/Cash   │
│  Room number │     │  Tax         │     │  Points      │
│              │     │  Discounts   │     │  Receipt     │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Self check-out entry
- Folio breakdown (all charges, tax, discounts)
- Payment settlement (multiple methods, loyalty points)
- Digital receipt + thank you message

---

### 1.7 Post-Stay

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Review      │────►│  Loyalty     │────►│  Re-booking  │
│  Request     │     │  Points      │     │  Prompt      │
│              │     │              │     │              │
│  Star rating │     │  Points earned│    │  Returning   │
│  Comment     │     │  Tier update │     │  guest offer │
│  Photos      │     │  Next tier   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Review request email (24h post-checkout)
- Loyalty points summary
- Tier progression update
- Returning guest personalized offer

---

## 2. Receptionist (Front Desk) Journey

### 2.1 Morning Dashboard

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dashboard   │────►│  Today's     │────►│  Quick       │
│              │     │  Overview    │     │  Actions     │
│              │     │              │     │              │
│  Arrivals    │     │  Room grid   │     │  New booking │
│  In-house    │     │  Status map  │     │  Check-in    │
│  Departures  │     │  Alerts      │     │  Check-out   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Dashboard with KPI cards (arrivals, in-house, departures, occupancy)
- Room grid (color-coded status)
- Alert panel (approvals, VIP arrivals, maintenance)

**Data Required:**
- `summaryStats`: arrivals, in-house, departures, occupancy
- `occupancySnapshot`: total, occupied, available, dirty, maintenance
- `arrivingGuests`: Confirmed reservations for today

---

### 2.2 Search & Modify Reservation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Search      │────►│  Results     │────►│  Reservation │
│  Bar         │     │  List        │     │  Detail      │
│              │     │              │     │              │
│  Guest name  │     │  Status      │     │  Timeline    │
│  Booking ref │     │  Dates       │     │  Modifications│
│  Room number │     │  Room        │     │  Payments    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Universal search (guest name, booking ref, room number, email, phone)
- Filtered results (by status, date, room type)
- Reservation detail with timeline
- Modification form (dates, room, special requests)

**Validation Rules:**
- BR-024 to BR-028: Modification rules
- BR-006 to BR-010: Room assignment rules

---

### 2.3 Check-In Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Arriving    │────►│  Guest       │────►│  Room        │────►│  Check-in    │
│  Guest List  │     │  Verification│     │  Assignment  │     │  Complete    │
│              │     │              │     │              │     │              │
│  Filtered    │     │  ID check    │     │  Room grid   │     │  Key issued  │
│  By date     │     │  Payment     │     │  Available   │     │  Timeline    │
│              │     │  Deposit     │     │  Preference  │     │  updated     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Arriving guests list (filtered by date)
- Guest verification (ID, payment status)
- Room assignment (available rooms grid, preference matching)
- Check-in confirmation

**Validation Rules:**
- BR-011 to BR-015: Room assignment rules
- BR-030 to BR-031: Payment collection rules

---

### 2.4 Check-Out Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Departing   │────►│  Folio       │────►│  Payment     │────►│  Room        │
│  Guest List  │     │  Review      │     │  Settlement  │     │  Release     │
│              │     │              │     │              │     │              │
│  Filtered    │     │  Charges     │     │  Card/Cash   │     │  Status→Dirty│
│  By date     │     │  Discounts   │     │  Split       │     │  HK notified │
│              │     │  Tax         │     │  Points      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Departing guests list
- Folio breakdown
- Payment settlement (multiple methods)
- Room status update (→ Dirty)

**Validation Rules:**
- BR-031: Full payment due at check-out
- BR-054: Room automatically becomes DIRTY on check-out

---

### 2.5 New Booking (Walk-in/Phone)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  New Booking │────►│  Guest       │────►│  Room &      │────►│  Payment &   │
│  Wizard      │     │  Details     │     │  Dates       │     │  Confirm     │
│              │     │              │     │              │     │              │
│  Source      │     │  Name, Email │     │  Room type   │     │  Deposit     │
│  Walk-in/    │     │  Phone       │     │  Check-in/out│     │  Method      │
│  Phone/Online│     │  ID          │     │  Available   │     │  Confirmation│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Source selection (walk-in, phone, online, OTA, corporate, agent)
- Guest details form (auto-fill if returning guest)
- Room and date selection (availability check)
- Payment and confirmation

**Validation Rules:**
- BR-001 to BR-010: Booking creation rules
- BR-007 to BR-010: Guest count rules

---

## 3. Housekeeping Journey

### 3.1 Task Queue

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dashboard   │────►│  Task List   │────►│  Task Detail │
│              │     │              │     │              │
│  Summary     │     │  By priority │     │  Room info   │
│  stats       │     │  By floor    │     │  Status flow │
│              │     │  By cleaner  │     │  Notes       │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Dashboard with summary (dirty count, in-progress, inspected, active cleaners)
- Task list (filtered by priority, floor, cleaner)
- Task detail (room info, status flow, notes)

**Data Required:**
- `tasks[]`: All housekeeping tasks
- `summaryStats`: dirty, inProgress, inspected, cleaners

---

### 3.2 Cleaning Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Task        │────►│  Start       │────►│  Complete    │────►│  Inspection  │
│  Assigned    │     │  Cleaning    │     │  Cleaning    │     │              │
│              │     │              │     │              │     │  Supervisor  │
│  Cleaner     │     │  Status→     │     │  Status→     │     │  verifies    │
│  assigned    │     │  In Progress │     │  Cleaned     │     │  Pass/Fail   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Task assignment (cleaner selection)
- Status update (Dirty → In Progress → Cleaned)
- Inspection (supervisor: pass → Inspected, fail → Dirty)

**Validation Rules:**
- BR-070 to BR-079: Housekeeping rules

---

## 4. Manager Journey

### 4.1 Dashboard & Analytics

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dashboard   │────►│  Analytics   │────►│  Reports     │
│              │     │              │     │              │
│  KPI cards   │     │  Revenue     │     │  Occupancy   │
│  Alerts      │     │  Occupancy   │     │  Revenue     │
│  Approvals   │     │  ADR/RevPAR  │     │  Guest mix   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- KPI dashboard (occupancy, ADR, RevPAR, revenue, cancellation rate)
- Analytics (revenue trends, booking funnel, source breakdown)
- Reports (occupancy calendar, revenue by room type, guest demographics)

---

### 4.2 Approvals

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Pending     │────►│  Request     │────►│  Decision    │
│  Approvals   │     │  Detail      │     │              │
│              │     │              │     │  Approve     │
│  Discount    │     │  Old vs New  │     │  Reject      │
│  Cancellation│     │  Reason      │     │  Escalate    │
│  Upgrade     │     │  Impact      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Pending approvals list (by type, urgency)
- Request detail (old value, new value, requester, reason)
- Decision (approve, reject, escalate)

**Validation Rules:**
- BR-040 to BR-042: Discount approval rules
- BR-084 to BR-087: POS discount rules

---

### 4.3 Staff Management

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Staff List  │────►│  Staff       │────►│  Shift       │
│              │     │  Detail      │     │  Management  │
│              │     │              │     │              │
│  Roles       │     │  Performance │     │  Calendar    │
│  Status      │     │  Tasks       │     │  Coverage    │
│              │     │  Attendance  │     │  Assignments │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Touchpoints:**
- Staff roster (by role, status)
- Staff detail (performance, tasks, attendance)
- Shift calendar (weekly view, coverage heatmap)

---

## 5. Host Journey

### 5.1 Property Management

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Properties  │────►│  Property    │────►│  Edit /      │
│  List        │     │  Detail      │     │  Update      │
│              │     │              │     │              │
│  Cards with  │     │  Stats       │     │  Info        │
│  stats       │     │  Rooms       │     │  Photos      │
│              │     │  Bookings    │     │  Amenities   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

### 5.2 Listing Wizard

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Step 1:     │────►│  Step 2:     │────►│  Step 3:     │────►│  Step 4:     │
│  Type        │     │  Details     │     │  Rooms       │     │  Policies    │
│              │     │              │     │              │     │              │
│  Property    │     │  Name        │     │  Room types  │     │  Check-in    │
│  type        │     │  Description │     │  Bed config  │     │  Check-out   │
│  (8 types)   │     │  Location    │     │  Pricing     │     │  Cancellation│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                               ┌──────────────┐
                                                               │ Step 5:      │
                                                               │ Confirmation │
                                                               │              │
                                                               │  Summary     │
                                                               │  Publish     │
                                                               └──────────────┘
```

---

### 5.3 Pricing & Revenue

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Rate Plans  │────►│  Date        │────►│  Discount    │
│              │     │  Overrides   │     │  Codes       │
│              │     │              │     │              │
│  Standard    │     │  Peak dates  │     │  Promo codes │
│  Day-of-week │     │  Holiday     │     │  Special     │
│              │     │  Event       │     │  offers      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 6. SuperAdmin Journey

### 6.1 Platform Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  KPI         │────►│  Tenant      │────►│  Platform    │
│  Dashboard   │     │  Management  │     │  Settings    │
│              │     │              │     │              │
│  MRR         │     │  List/Detail │     │  Features    │
│  Tenants     │     │  Suspend/    │     │  Flags       │
│  Properties  │     │  Activate    │     │  Config      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Journey → Screen Mapping

| Journey | Screen | Route | Portal |
|---------|--------|-------|--------|
| Guest Search | Home | `/` | Guest |
| Guest Search Results | Results | `/search-results` | Guest |
| Guest Hotel Detail | Detail | `/[id]` | Guest |
| Guest Booking Flow | Flow | `/booking-flow` | Guest |
| Guest Confirmation | Confirmation | `/booking-confirmation` | Guest |
| Guest Profile | Profile | `/(tabs)/profile` | Guest |
| Guest Self Check-in | Check-in | `/(tabs)/self-checkin` | Guest |
| Guest Self Check-out | Check-out | `/(tabs)/self-checkout` | Guest |
| Receptionist Dashboard | Dashboard | `/(operations)/front-desk` | Operations |
| Receptionist New Booking | New Booking | `/(operations)/front-desk/new-booking` | Operations |
| Receptionist Check-in | Check-in | `/(operations)/front-desk/check-in` | Operations |
| Receptionist Check-out | Check-out | `/(operations)/front-desk/check-out` | Operations |
| Receptionist Guest CRM | CRM | `/(operations)/front-desk/guest-crm` | Operations |
| Housekeeping Dashboard | Tasks | `/(operations)/housekeeping` | Operations |
| Housekeeping Task Detail | Detail | `/(operations)/housekeeping/[roomId]` | Operations |
| Manager Analytics | Analytics | `/(operations)/analytics` | Operations |
| POS Floor Plan | Floor Plan | `/(operations)/pos` | Operations |
| POS Table Order | Table | `/(operations)/pos/table/[id]` | Operations |
| POS Checkout | Checkout | `/(operations)/pos/checkout` | Operations |
| KDS Tickets | Tickets | `/(operations)/kds` | Operations |
| Host Dashboard | Dashboard | `/(host)` | Host |
| Host Properties | Properties | `/(host)` (tab) | Host |
| Host Rooms | Rooms | `/(host)` (tab) | Host |
| Host Pricing | Pricing | `/(host)` (tab) | Host |
| Host Staff | Staff | `/(host)` (tab) | Host |
| Host Listing Wizard | Wizard | `/(host)/listing-wizard` | Host |
| SuperAdmin Dashboard | Dashboard | `/(superadmin)` | SuperAdmin |
| SuperAdmin Tenants | Tenants | `/(superadmin)/tenants` | SuperAdmin |
| SuperAdmin Commerce | Commerce | `/(superadmin)/commerce` | SuperAdmin |
| SuperAdmin Platform | Platform | `/(superadmin)/platform` | SuperAdmin |
| SuperAdmin Support | Support | `/(superadmin)/support` | SuperAdmin |
| SuperAdmin System | System | `/(superadmin)/system` | SuperAdmin |
| SuperAdmin Admin | Admin | `/(superadmin)/admin` | SuperAdmin |

---

## Journey Completion Metrics

| Journey | Target Time | Success Rate | Key Metric |
|---------|-------------|--------------|------------|
| Guest Booking | < 3 minutes | > 80% | Conversion rate |
| Guest Check-in (self) | < 2 minutes | > 90% | Completion rate |
| Guest Check-out (self) | < 1 minute | > 95% | Completion rate |
| Receptionist Check-in | < 3 minutes | > 95% | Avg time |
| Receptionist Check-out | < 2 minutes | > 95% | Avg time |
| Housekeeping Task | < 30 minutes | > 90% | On-time completion |
| Manager Approval | < 4 hours | > 80% | Response time |
