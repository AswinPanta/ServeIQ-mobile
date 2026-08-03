# StayEasy — Component Inventory

> Source of Truth v1.0 — July 2026

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ATOMIC COMPONENTS (primitives)                                             │
│  ─────────────────────────────                                              │
│  Button, Input, Badge, Avatar, Icon, Skeleton, Modal, Toast                │
│                                                                             │
│  MOLECULES (composed primitives)                                            │
│  ──────────────────────────────                                             │
│  SearchInput, StatusBadge, DatePickerCalendar, PriceBreakdown              │
│                                                                             │
│  ORGANISMS (complex, domain-specific)                                       │
│  ──────────────────────────────────────                                     │
│  ReservationCard, GuestCard, RoomCard, Timeline, PaymentCard               │
│                                                                             │
│  TEMPLATES (page layouts)                                                   │
│  ─────────────────────                                                      │
│  DashboardLayout, DetailLayout, WizardLayout, ListLayout                   │
│                                                                             │
│  SCREENS (full pages)                                                       │
│  ──────────────────                                                         │
│  Home, SearchResults, HotelDetail, BookingFlow, Profile                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Atomic Components (UI Primitives)

### 1.1 Button

**Purpose:** Primary interaction element with multiple variants.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show spinner |
| `disabled` | `boolean` | `false` | Disable interaction |
| `icon` | `string` | — | Leading icon name |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |

**Variants:**
- `primary`: Solid fill, high emphasis (Submit, Confirm, Pay)
- `secondary`: Outline/bordered, medium emphasis (Cancel, Back)
- `ghost`: No background, low emphasis (Text links, tertiary actions)
- `danger`: Red fill, destructive actions (Delete, Cancel booking)

**Location:** `components/ui/button.tsx`

---

### 1.2 Input

**Purpose:** Text input with label, validation, and icon support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Field label |
| `placeholder` | `string` | — | Placeholder text |
| `error` | `string` | — | Validation error message |
| `icon` | `string` | — | Leading icon |
| `type` | `'text' \| 'email' \| 'phone' \| 'password' \| 'number'` | `'text'` | Input type |
| `disabled` | `boolean` | `false` | Disable input |

**Location:** `components/ui/input.tsx`

---

### 1.3 Badge

**Purpose:** Status indicator with color coding.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | `'neutral'` | Color variant |
| `size` | `'sm' \| 'md'` | `'md'` | Badge size |
| `dot` | `boolean` | `false` | Show status dot |

**Color Mapping:**
| Variant | Color | Use Case |
|---------|-------|----------|
| `success` | Green | Available, Completed, Approved |
| `warning` | Amber | Dirty, Pending, Urgent |
| `error` | Red | Occupied, Cancelled, Overdue |
| `info` | Blue | In Progress, Confirmed |
| `neutral` | Gray | Draft, Inactive |

**Location:** `components/ui/badge.tsx`

---

### 1.4 Avatar

**Purpose:** User/person representation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Display initials if no image |
| `image` | `string` | — | Avatar image URL |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Avatar size |
| `status` | `'online' \| 'offline' \| 'busy'` | — | Status indicator |

**Sizes:**
| Size | Dimensions | Use Case |
|------|------------|----------|
| `sm` | 32×32 | Inline lists, comments |
| `md` | 40×40 | Cards, headers |
| `lg` | 56×56 | Profile cards, modals |
| `xl` | 80×80 | Profile pages |

---

### 1.5 Icon

**Purpose:** Symbolic icon with consistent sizing.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Icon name (mapped from icon set) |
| `size` | `number` | `24` | Icon size in pixels |
| `color` | `string` | `'currentColor'` | Icon color |

**Icon Set:** Uses `IconSymbol` component from `components/ui/icon-symbol.tsx`

---

### 1.6 Skeleton

**Purpose:** Loading placeholder with shimmer effect.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number \| string` | `'100%'` | Skeleton width |
| `height` | `number` | `20` | Skeleton height |
| `borderRadius` | `number` | `8` | Border radius |
| `variant` | `'text' \| 'circle' \| 'rect'` | `'text'` | Shape variant |

**Location:** `components/ui/skeleton-loader.tsx`

---

### 1.7 Modal

**Purpose:** Overlay dialog for focused interactions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | — | Show/hide state |
| `onClose` | `() => void` | — | Close handler |
| `title` | `string` | — | Modal title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Modal size |
| `closeOnOverlay` | `boolean` | `true` | Close on backdrop tap |

**Location:** `components/ui/modal.tsx`

---

### 1.8 Toast

**Purpose:** Non-blocking notification message.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast type |
| `message` | `string` | — | Toast message |
| `duration` | `number` | `3000` | Auto-dismiss time (ms) |

**Location:** `components/ui/toast.tsx`

---

## 2. Molecules (Composed Components)

### 2.1 SearchInput

**Purpose:** Enhanced search with clear button and debounce.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `onSearch` | `(query: string) => void` | — | Search callback |
| `debounceMs` | `number` | `300` | Debounce delay |
| `showClear` | `boolean` | `true` | Show clear button |

**Location:** `components/ui/SearchInput.tsx`

---

### 2.2 StatusBadge

**Purpose:** Status indicator with icon and label.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `string` | — | Status value |
| `colorMap` | `Record<string, string>` | — | Custom color mapping |
| `showIcon` | `boolean` | `true` | Show status icon |
| `showLabel` | `boolean` | `true` | Show status text |

**Location:** `components/ui/StatusBadge.tsx`

---

### 2.3 DatePickerCalendar

**Purpose:** Date range picker with calendar view.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startDate` | `Date \| null` | — | Selected start date |
| `endDate` | `Date \| null` | — | Selected end date |
| `onDateChange` | `(start: Date, end: Date) => void` | — | Date change callback |
| `minDate` | `Date` | `today` | Earliest selectable date |
| `maxDate` | `Date` | `+1 year` | Latest selectable date |
| `blockedDates` | `Date[]` | — | Unavailable dates |

**Location:** `components/ui/date-picker-calendar.tsx`

---

### 2.4 PriceBreakdown

**Purpose:** Itemized price display with calculations.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nights` | `number` | — | Number of nights |
| `nightlyRate` | `number` | — | Rate per night |
| `taxes` | `number` | — | Tax amount |
| `discount` | `number` | `0` | Discount amount |
| `addOns` | `{ name: string; price: number }[]` | — | Additional charges |
| `currency` | `string` | `'NPR'` | Currency code |

**Display:**
```
3 nights × $2,499        $7,497
Breakfast package          $450
Airport transfer           $800
─────────────────────────────────
Subtotal                  $8,747
Tax (13%)                 $1,137
Loyalty discount (5%)     -$437
─────────────────────────────────
Total                     $9,447
```

**Location:** `components/feature/folio-breakdown.tsx`

---

### 2.5 CheckoutTimer

**Purpose:** Countdown timer for session/booking expiry.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `durationSeconds` | `number` | `600` | Timer duration |
| `onExpired` | `() => void` | — | Expiry callback |
| `showWarning` | `boolean` | `true` | Show warning at 60s |

**Location:** `components/feature/checkout-timer.tsx`

---

### 2.6 ScarcityBadge

**Purpose:** Urgency indicator for low availability.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `available` | `number` | — | Rooms remaining |
| `threshold` | `number` | `5` | Warning threshold |

**Display Logic:**
- `available > 5`: No badge
- `available 2-5`: "Only X left!" (amber)
- `available 1`: "Last room!" (red)
- `available 0`: "Sold out" (gray)

**Location:** `components/feature/scarcity-badge.tsx`

---

## 3. Organisms (Domain Components)

### 3.1 Reservation Card

**Purpose:** Compact reservation summary for lists and grids.

| Prop | Type | Description |
|------|------|-------------|
| `booking` | `OperationBooking` | Booking data |
| `onPress` | `(booking) => void` | Tap handler |
| `onCheckIn` | `(booking) => void` | Quick check-in |
| `onCheckOut` | `(booking) => void` | Quick check-out |
| `onCancel` | `(booking) => void` | Cancel handler |
| `showActions` | `boolean` | Show action buttons |
| `variant` | `'compact' \| 'full' \| 'grid'` | Display variant |

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Avatar]  Carol Davis        BK-1003  │
│            Deluxe · Room 102            │
│            Jul 2-5 (3 nights)          │
│            NPR 14,997    [Confirmed]   │
│                                         │
│  [Check-in]  [Modify]  [Cancel]        │
└─────────────────────────────────────────┘
```

**Status Colors:**
| Status | Badge Color | Actions Available |
|--------|-------------|-------------------|
| `confirmed` | Blue | Check-in, Modify, Cancel |
| `checked_in` | Green | Check-out, View Folio |
| `checked_out` | Gray | View Receipt |
| `cancelled` | Red | View Details |

---

### 3.2 Guest Card

**Purpose:** Guest profile summary with loyalty info.

| Prop | Type | Description |
|------|------|-------------|
| `guest` | `GuestProfile` | Guest data |
| `showLoyalty` | `boolean` | Show loyalty tier |
| `showStays` | `boolean` | Show stay history |
| `onPress` | `(guest) => void` | Tap handler |
| `variant` | `'compact' \| 'full'` | Display variant |

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Avatar]  Alice Johnson     ⭐ SILVER  │
│            alice@email.com              │
│            +977-9841234567              │
│                                         │
│  Stays: 3  │  Spent: NPR 45,000        │
│  Points: 1,200  │  Nationality: US     │
└─────────────────────────────────────────┘
```

---

### 3.3 Room Card

**Purpose:** Room status display with assignment actions.

| Prop | Type | Description |
|------|------|-------------|
| `room` | `FrontDeskRoom` | Room data |
| `onAssign` | `(room) => void` | Assign guest |
| `onStatusChange` | `(room, status) => void` | Change status |
| `showGuest` | `boolean` | Show assigned guest |
| `variant` | `'grid' \| 'list' \| 'compact'` | Display variant |

**Status Colors:**
| Status | Background | Text | Icon |
|--------|------------|------|------|
| `available` | `#D1FAE5` | `#065F46` | ✓ |
| `occupied` | `#DBEAFE` | `#1E40AF` | 👤 |
| `dirty` | `#FEF3C7` | `#92400E` | 🧹 |
| `maintenance` | `#FEE2E2` | `#991B1B` | 🔧 |

---

### 3.4 Timeline

**Purpose:** Chronological event log for a reservation.

| Prop | Type | Description |
|------|------|-------------|
| `events` | `TimelineEvent[]` | Event list |
| `bookingRef` | `string` | Filter by booking |
| `maxEvents` | `number` | Limit displayed events |
| `showFilters` | `boolean` | Show event type filters |

**Event Icons:**
| Event Type | Icon | Color |
|------------|------|-------|
| `created` | ➕ | Blue |
| `modified` | ✏️ | Amber |
| `room_changed` | 🚪 | Purple |
| `payment_added` | 💳 | Green |
| `checked_in` | 🔑 | Green |
| `checked_out` | 🚪 | Gray |
| `cancelled` | ❌ | Red |
| `note_added` | 📝 | Blue |

**Location:** `components/operations/Timeline.tsx`

---

### 3.5 Payment Card

**Purpose:** Payment transaction display.

| Prop | Type | Description |
|------|------|-------------|
| `transaction` | `PaymentTransaction` | Payment data |
| `showDetails` | `boolean` | Show reference/note |
| `variant` | `'compact' \| 'full'` | Display variant |

**Layout:**
```
┌─────────────────────────────────────────┐
│  💳  Payment                +NPR 14,997 │
│      Card ending 4242                   │
│      Jul 2, 2026 14:30                  │
│      Processed by: Sita Gurung          │
└─────────────────────────────────────────┘
```

---

### 3.6 Kpi Card

**Purpose:** Key Performance Indicator display.

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | KPI name |
| `value` | `string` | Current value |
| `change` | `string` | Change indicator |
| `changeType` | `'up' \| 'down' \| 'neutral'` | Change direction |
| `icon` | `string` | KPI icon |
| `color` | `string` | Accent color |

**Location:** `components/operations/KpiCard.tsx`

---

### 3.7 Filter Chips

**Purpose:** Horizontal scrollable filter buttons.

| Prop | Type | Description |
|------|------|-------------|
| `options` | `{ label: string; value: string }[]` | Filter options |
| `selected` | `string[]` | Selected values |
| `onSelect` | `(value: string) => void` | Selection handler |
| `multiSelect` | `boolean` | Allow multiple selection |

**Location:** `components/superadmin/FilterChips.tsx`

---

### 3.8 Empty State

**Purpose:** Placeholder when no data is available.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `string` | Illustration icon |
| `title` | `string` | Empty state title |
| `description` | `string` | Explanation text |
| `action` | `{ label: string; onPress: () => void }` | CTA button |

**Location:** `components/ui/empty-state.tsx`

---

### 3.9 Section Header

**Purpose:** Section divider with title and optional action.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section title |
| `subtitle` | `string` | Optional subtitle |
| `action` | `{ label: string; onPress: () => void }` | Action button |
| `divider` | `boolean` | Show bottom divider |

**Location:** `components/superadmin/SectionHeader.tsx`

---

## 4. Feature Components (Composite)

### 4.1 Search Modal

**Purpose:** Full-screen search with date picker and guest selector.

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide state |
| `onClose` | `() => void` | Close handler |
| `onSearch` | `(params: SearchParams) => void` | Search callback |
| `initialParams` | `SearchParams` | Pre-filled values |

**Location:** `components/feature/search-modal.tsx`

---

### 4.2 Filter Modal

**Purpose:** Advanced search filters.

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide state |
| `filters` | `SearchFilters` | Current filters |
| `onApply` | `(filters: SearchFilters) => void` | Apply callback |
| `onReset` | `() => void` | Reset callback |

**Location:** `components/feature/filter-modal.tsx`

---

### 4.3 Booking Modify Modal

**Purpose:** Modify existing booking dates/room.

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide state |
| `booking` | `Booking` | Current booking |
| `onModify` | `(updates) => void` | Modification callback |
| `onClose` | `() => void` | Close handler |

**Location:** `components/feature/booking-modify-modal.tsx`

---

### 4.4 Discount Code Input

**Purpose:** Promo code entry with validation.

| Prop | Type | Description |
|------|------|-------------|
| `onApply` | `(code: string) => void` | Apply callback |
| `onRemove` | `() => void` | Remove callback |
| `appliedCode` | `string` | Currently applied code |
| `loading` | `boolean` | Validation in progress |

**Location:** `components/feature/discount-code-input.tsx`

---

### 4.5 Country Currency Picker

**Purpose:** Country selection with currency display.

| Prop | Type | Description |
|------|------|-------------|
| `selectedCountry` | `string` | Selected country code |
| `onSelect` | `(country, currency) => void` | Selection callback |
| `showCurrency` | `boolean` | Show currency alongside country |

**Location:** `components/feature/country-currency-picker.tsx`

---

### 4.6 Review Modal

**Purpose:** Submit property review with rating.

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide state |
| `hotelId` | `string` | Target property |
| `onSubmit` | `(review) => void` | Submit callback |
| `existingReview` | `Review` | Edit existing review |

**Location:** `components/feature/review-modal.tsx`

---

### 4.7 Split Bill Modal

**Purpose:** Divide restaurant bill across guests.

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide state |
| `total` | `number` | Bill total |
| `onSplit` | `(parts: number) => void` | Split callback |
| `maxParts` | `number` | Maximum split count |

**Location:** `components/feature/split-bill-modal.tsx`

---

### 4.8 Nearby Hotels

**Purpose:** Related properties carousel.

| Prop | Type | Description |
|------|------|-------------|
| `hotels` | `Hotel[]` | Nearby hotels |
| `currentHotelId` | `string` | Exclude current |
| `onPress` | `(hotel) => void` | Navigation callback |

**Location:** `components/feature/nearby-hotels.tsx`

---

## 5. Portal-Specific Components

### 5.1 Guest Portal

| Component | Location | Purpose |
|-----------|----------|---------|
| `HeroSection` | `components/feature/hero-section.tsx` | Landing page hero |
| `TrendingDestinations` | `components/guest/TrendingDestinations.tsx` | Destination carousel |
| `PopularDestinations` | `components/guest/PopularDestinations.tsx` | Popular locations |
| `Testimonials` | `components/guest/Testimonials.tsx` | Guest reviews |
| `WhyStayEasy` | `components/guest/WhyStayEasy.tsx` | Value proposition |
| `OtherHotels` | `components/guest/OtherHotels.tsx` | Related properties |
| `NewsletterCTA` | `components/guest/NewsletterCTA.tsx` | Email signup |
| `GuestFooter` | `components/guest/GuestFooter.tsx` | Page footer |

### 5.2 Host Portal

| Component | Location | Purpose |
|-----------|----------|---------|
| `HostDashboard` | `components/host/screens/HostDashboard.tsx` | Dashboard stats |
| `HostProperties` | `components/host/screens/HostProperties.tsx` | Property list |
| `HostStaff` | `components/host/screens/HostStaff.tsx` | Staff management |
| `RoomSetup` | `components/host/RoomSetup.tsx` | Room configuration |
| `ImagePickerOverlay` | `components/host/ImagePickerOverlay.tsx` | Photo upload |

### 5.3 Operations Portal

| Component | Location | Purpose |
|-----------|----------|---------|
| `OperationsHeader` | `components/operations/OperationsHeader.tsx` | Portal header |
| `OperationsSectionNav` | `components/operations/OperationsSectionNav.tsx` | Section navigation |
| `KpiCard` | `components/operations/KpiCard.tsx` | KPI display |
| `CleaningTimer` | `components/operations/CleaningTimer.tsx` | HK timer |
| `HKStatusFlow` | `components/operations/HKStatusFlow.tsx` | Status stepper |
| `SyncIndicator` | `components/operations/SyncIndicator.tsx` | Sync status |
| `SystemFlowBar` | `components/operations/SystemFlowBar.tsx` | Progress bar |

### 5.4 SuperAdmin Portal

| Component | Location | Purpose |
|-----------|----------|---------|
| `SuperAdminHeader` | `components/superadmin/SuperAdminHeader.tsx` | Portal header |
| `SuperAdminNav` | `components/superadmin/SuperAdminNav.tsx` | Navigation |
| `AdminCard` | `components/superadmin/AdminCard.tsx` | Admin data card |
| `PermissionToggle` | `components/superadmin/PermissionToggle.tsx` | Permission switch |
| `StatCard` | `components/superadmin/StatCard.tsx` | Statistics card |
| `SectionHeader` | `components/superadmin/SectionHeader.tsx` | Section divider |
| `StatusBadge` | `components/superadmin/StatusBadge.tsx` | Status indicator |
| `FilterChips` | `components/superadmin/FilterChips.tsx` | Filter buttons |
| `EmptyState` | `components/superadmin/EmptyState.tsx` | Empty placeholder |

---

## 6. Layout Components

### 6.1 Screen Container

**Purpose:** Consistent screen wrapper with safe area.

| Prop | Type | Description |
|------|------|-------------|
| `scrollable` | `boolean` | Enable scrolling |
| `padding` | `boolean` | Add default padding |
| `header` | `ReactNode` | Custom header |

**Location:** `components/screen-container.tsx`

---

### 6.2 Themed View

**Purpose:** Theme-aware container.

| Prop | Type | Description |
|------|------|-------------|
| `style` | `ViewStyle` | Additional styles |
| `variant` | `'default' \| 'card' \| 'surface'` | Visual variant |

**Location:** `components/themed-view.tsx`

---

### 6.3 Auth Guard

**Purpose:** Portal authentication wrapper.

| Prop | Type | Description |
|------|------|-------------|
| `portal` | `PortalType` | Required portal |
| `children` | `ReactNode` | Protected content |

**Location:** `components/common/AuthGuard.tsx`

---

### 6.4 Role Guard

**Purpose:** Role-based access control.

| Prop | Type | Description |
|------|------|-------------|
| `allowedRoles` | `OperatorRole[]` | Required roles |
| `children` | `ReactNode` | Protected content |

**Location:** `components/common/RoleGuard.tsx`

---

## 7. Animation Components

### 7.1 AnimatedPressable

**Purpose:** Pressable with haptic feedback and scale animation.

| Prop | Type | Description |
|------|------|-------------|
| `onPress` | `() => void` | Press handler |
| `portal` | `PortalType` | Portal context |
| `haptic` | `'light' \| 'medium' \| 'heavy'` | Haptic type |
| `scaleTo` | `number` | Scale factor (0-1) |

**Location:** `components/ui/motion.tsx`

---

## Component Usage Guidelines

### Consistency Rules
1. **Always use StatusBadge** for status display — never raw text
2. **Always use PriceBreakdown** for pricing — never manual calculation
3. **Always use Avatar** for user images — with fallback initials
4. **Always use EmptyState** for empty lists — never blank screens
5. **Always use Skeleton** for loading states — never spinners in lists

### Color Coding
| Context | Color | Hex |
|---------|-------|-----|
| Primary action | Teal | `#0D9488` |
| Host portal | Blue | `#2563EB` |
| Operations portal | Teal | `#0D9488` |
| SuperAdmin portal | Purple | `#7C3AED` |
| Guest portal | Coral | `#E63946` |
| Success | Green | `#10B981` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#EF4444` |
| Info | Blue | `#3B82F6` |

### Spacing
| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight spacing |
| `sm` | 8px | Default gap |
| `md` | 12px | Section spacing |
| `lg` | 16px | Card padding |
| `xl` | 24px | Page padding |
| `2xl` | 32px | Major sections |

### Typography
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 28px | 700 | Page titles |
| `h2` | 22px | 700 | Section headers |
| `h3` | 18px | 600 | Card titles |
| `body` | 14px | 400 | Body text |
| `caption` | 12px | 400 | Labels, hints |
| `small` | 11px | 400 | Fine print |
