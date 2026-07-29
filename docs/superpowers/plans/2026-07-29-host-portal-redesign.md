# Host Portal Redesign Implementation Plan

**Goal:** Restructure host portal with overall property grid dashboard, property-level navigation, and backend property loading.

**Architecture:** Existing drawer shell becomes overall dashboard showing property cards. Clicking a property navigates to property detail with its own section nav (Dashboard, Bookings, Rooms, Guests, etc.). Backend data replaces mock data when available.

**Tech Stack:** React Native, Expo Router, react-native-drawer-layout

## Global Constraints
- `npx tsc --noEmit` must pass with zero errors
- Mock data fallback when API unavailable (no UX regression)
- Follow existing portal patterns (drawer, auth guard, context providers)

---

### Task 1: Fix property loading from backend

**Files:**
- Modify: `lib/api/host-api.ts:157-159`
- Modify: `lib/context/host-context.tsx:173-201`

**Status: DONE** — `getProperties` now extracts `data.properties`, `mapApiProperty` transforms API shape to `Property` type, `mapApiRoom` transforms API rooms.

---

### Task 2: Redirect logic — first login → wizard, has properties → dashboard

**Files:**
- Modify: `app/(host)/index.tsx`

- [ ] Add redirect: if `properties.length === 0` on mount (and not loading), redirect to `listing-wizard`
- [ ] Show loading state while auth/data is initializing
- [ ] After properties load successfully, show the dashboard content

---

### Task 3: Overall dashboard — property cards grid

**Files:**
- Modify: `components/host/screens/HostDashboard.tsx`

Replace existing KPI dashboard with a property cards grid (like Samip's `DashboardPage.tsx`):
- Property cards with cover image, name, location, status badge, room count
- "Add New Property" button
- Filter/search for properties
- Click card → navigate to property detail route

---

### Task 4: Property detail route with section navigation

**Files:**
- Create: `app/(host)/property/[id].tsx`
- Create: `components/host/screens/PropertyDashboard.tsx`
- Create: `components/host/screens/PropertyBookings.tsx`
- Create: `components/host/screens/PropertyRooms.tsx`
- Create: `components/host/screens/PropertyGuests.tsx`
- Create: `components/host/screens/PropertyStaff.tsx`
- Create: `components/host/screens/PropertyHousekeeping.tsx`
- Create: `components/host/screens/PropertyPricingDiscounts.tsx`
- Create: `components/host/screens/PropertyReports.tsx`
- Create: `components/host/screens/PropertySettings.tsx`

Property-level layout with section tabs:
- Dashboard, Bookings, Rooms, Guests, Staff, Housekeeping, Pricing & Discounts, Reports
- Settings (nested: Company Profile, General, Booking, Room & Rate, Amenities, Notifications, Taxes, Payments, Integrations, Activity Logs, Support)

---

### Task 5: Update hamburger drawer — My Properties + Notifications

**Files:**
- Modify: `app/(host)/index.tsx`

- [ ] Replace existing nav items with: My Properties, Notifications
- [ ] "My Properties" shows property grid
- [ ] "Notifications" shows notification list
- [ ] Keep "New Listing" button
- [ ] Keep user profile section
