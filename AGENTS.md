# StayEasy — Architecture

## Backend
- **FastAPI (Python)** deployed on Render at `https://stayeasy-1-35ba.onrender.com`
- Swagger docs at `https://stayeasy-1-35ba.onrender.com/docs`
- OpenAPI spec at `https://stayeasy-1-35ba.onrender.com/api/v1/openapi.json`

## Mobile App
- **Expo SDK 56** with React Native
- All API calls go directly to the FastAPI backend via `fetch()`
- Auth endpoints in `lib/context/auth-context.tsx` use `API_BASE_URL` + `API_ENDPOINTS` from `constants/api-config.ts`
- Override API URL via `EXPO_PUBLIC_API_URL` env var (default in `.env`)

## Multi-Portal Architecture

The app has 4 portals, each with fully separate login flows:

### Route Structure
```
app/
  _layout.tsx          — Root Stack (index + all portal groups)
  index.tsx            — Portal picker (4 premium cards)

  (host)/              — Host Portal (blue #2563EB)
    _layout.tsx, login.tsx, register.tsx
    index.tsx          — Dashboard (stats, bookings, quick actions)
    listing-wizard.tsx — 5-step property listing

  (operations)/        — Operations Portal (teal #0D9488)
    _layout.tsx, login.tsx
    index.tsx          — Dashboard (room grid, today's stats, quick access)
    front-desk/        — Room grid, new booking, check-in, check-out
    housekeeping/      — Task queue, room detail
    pos/               — Floor plan, table orders, checkout
    kds/               — Kitchen display system
    analytics/         — Restaurant analytics

  (superadmin)/        — SuperAdmin Portal (purple #7C3AED)
    _layout.tsx, login.tsx
    index.tsx          — KPI dashboard (tenants, MRR, properties)
    tenants/           — List + detail with suspend/activate
    commerce/          — Subscriptions + billing
    platform/          — Feature flags, analytics, reports, exports
    support/           — Tickets, announcements
    system/            — Health, audit logs
    admin/             — Roles, settings

  Existing guest screens at root (unchanged):
    (auth)/, (tabs)/, [id].tsx, booking-flow.tsx, etc.
```

### Visual Identity Per Portal
- **Guest**: Coral (#E63946), warm, travel-focused (Airbnb-inspired)
- **Host**: Blue (#2563EB), professional, data-driven (Booking.com-inspired)
- **Operations**: Teal (#0D9488), clean, task-focused
- **SuperAdmin**: Purple (#7C3AED), dark-friendly, admin dashboard feel

### Auth System
- Portal-aware `AuthContext` with `portal` field (`'guest'|'host'|'operations'|'superadmin'`)
- `login(email, password, portalType)` — separate login per portal
- `demoLogin(portalType)` — instant demo access for development
- `switchPortal(portalType)` — loads another portal's session from scoped AsyncStorage keys
- Storage keys scoped: `auth_token_{portal}`, `refresh_token_{portal}`, `user_profile_{portal}`
- Active portal persisted in `STORAGE_KEYS.ACTIVE_PORTAL`

### Portal Profile Types (`types/api.ts`)
- `GuestProfile` — email, phone, name, nationality, loyalty_points
- `HostProfile` — email, name, first/last, phone, properties_count, total_bookings, rating
- `OperatorProfile` — email, name, role (`front_desk`|`housekeeping`|`pos`|`kds`|`manager`), property_id, property_name
- `SuperAdminProfile` — email, name, role (`SUPER_ADMIN`)
- `PortalProfile` = union of all 4

---

### 2026-07-09 — Backend Connection: Host Portal API + Auth Verification

**Backend Analysis**
- Deployed at `https://stayeasy-1-35ba.onrender.com` (FastAPI, source: `github.com/Anilbk777/Booking_system`)
- Working endpoints: Auth (guest+user OTP flow), PMS Properties/Rooms CRUD, Tenants CRUD, Discount Codes CRUD, Special Offers CRUD, Image Upload
- Missing: No operations-specific endpoints (check-in/out, housekeeping, POS, KDS, analytics) — those have DB models but no API routers
- Auth routes live under `/api/v1/` prefix (FastAPI `root_path`)

**Done**
- Verified auth connectivity: guest/user registration, login, OTP verification all work against live backend
- Confirmed frontend `auth-context.tsx` already correctly calls real backend for login, register, verifyOTP, resendOTP — no changes needed
- Created `lib/api/host-api.ts` — 16 host-specific API functions with fallback pattern mirroring `operations-api.ts`
  - Properties CRUD → `GET/POST/PATCH/DELETE /pms/properties/`
  - Rooms CRUD → `GET/POST/PATCH/DELETE /pms/properties/{id}/rooms`
  - Discount Codes CRUD → `/pms/properties/{id}/discount-codes/`
  - Special Offers CRUD → `/pms/{id}/special-offers`
- Updated `host-context.tsx`:
  - `useEffect` on mount tries `hostApi.getProperties()` — overwrites state if API returns data
  - On `activePropertyId` change, fetches rooms/discounts/offers from API
  - `addProperty`, `updateProperty`, `removeProperty`, `addDiscountCode`, `addSpecialOffer` now call API first with fallback
- `npx tsc --noEmit` — zero errors

**Key decisions**
- Host context initialized with mock data first (instant render), then attempts API fetch in background — seamless UX regardless of backend availability
- Only properties, rooms, discount codes, and special offers have real endpoints — rest (rate plans, staff, shifts, tax configs) remain mock-only until backend adds endpoints
- Fallback pattern (`apiGet<T>(endpoint, fallback)`) catches any error (network, auth, parse) and returns mock data — no UX regression when backend is down
- Added `getTenants()`, `updateTenant()`, `deleteTenantApi()` to `lib/api.ts` with fallback
- Wired all 3 operations contexts (restaurant, frontdesk, housekeeping) to `operations-api.ts` — mount fetch + mutation wrappers with fallback
- Wired SuperAdmin tenant list + detail screens: mount fetch from `GET /tenants/`, suspend/activate via `PATCH`, delete via `DELETE`

---

## Removed
- Express/tRPC server (`server/`) — unused, switched to FastAPI
- tRPC client (`lib/trpc.ts`) — unused
- Drizzle ORM (`drizzle/`) — unused
- Server-only deps removed from `package.json`

---

## Session History

### 2026-07-04 — Multi-Portal Architecture (Host, Operations, SuperAdmin)

**Done**
- Added 4 portal route groups in a single Expo app: Guest (existing, unchanged), Host, Operations, SuperAdmin
- Created portal picker at `app/index.tsx` — 4 premium cards with distinct colors and icons
- Extended `AuthContext` with portal awareness — `login(email, password, portal)`, `demoLogin(portal)`, `switchPortal(portal)`
- Added portal-scoped AsyncStorage keys for fully independent sessions per portal
- Added 4 portal user types to `types/api.ts`: `HostProfile`, `OperatorProfile`, `SuperAdminProfile`, `PortalProfile`
- Created **Host Portal** (5 files): Registration, dashboard with stats/bookings/quick actions, 5-step listing wizard (property type → details → rooms → policies → confirmation)
- Created **Operations Portal** (17 files): Dashboard with room grid/status/today's stats/quick access modules; Front Desk (room grid, check-in, check-out, new booking); Housekeeping (task queue, room detail); POS (floor plan, table orders, checkout); KDS (kitchen display with order tickets); Analytics (KPI cards, bar charts, top items)
- Created **SuperAdmin Portal** (23 files): Dashboard with KPI cards/module navigation; Tenants (list with filters, detail with suspend/activate); Commerce (subscriptions with plan cards, billing with invoice list); Platform (feature flags with toggles, analytics, reports, exports); Support (tickets with priority filters, announcements); System (health dashboard with service status, audit log viewer); Admin (roles & permissions, platform settings)
- Fixed TypeScript: cast `user` to `GuestProfile` in existing guest profile screens to handle `PortalProfile` union type
- `npx tsc --noEmit` — zero errors

**Key decisions**
- Guest portal screens stay at root level (not moved into `(guest)/` group) to avoid breaking existing routes
- Each portal has its own color identity: Guest=coral, Host=blue, Operations=teal, SuperAdmin=purple
- Auth sessions are fully independent per portal (separate AsyncStorage keys), not a unified login with role toggle
- `demoLogin(portal)` creates mock user per portal type for development
- All portal screens use mock data defined inline — no backend API calls yet
- Visual style borrows from Airbnb/Booking.com/Agoda: premium rounded cards, shadows, clean typography

---

### 2026-07-04 (later) — Matched my-react-app Completeness (API, Guards, Layouts, Components)

**Done**
- **Phase 1 — Foundation**:
  - `lib/api.ts` — centralized fetch wrapper with portal-scoped auth token injection, request/response interceptors, retries, timeout, 401 auto-clear
  - `hooks/use-portal-auth.ts` — portal auth guard hook that redirects to login if unauthenticated, redirects to home if already signed in on login screen
  - Extended `types/api.ts` with operation types: `OperatorRole`, `OperationRoom`, `OperationBooking`, `FolioCharge`, `Folio`, `HousekeepingTask`, `TableSection`, `TableItem`, `MenuItem`, `MenuModifier`, `OrderItem`, `Order`, `KdsTicket`
  - `lib/mock/countries.ts` — country list with flags, dial codes
  - `lib/mock/phone-codes.ts` — phone country codes

- **Phase 2 — Operations Layout**:
  - `components/operations/OperationsHeader.tsx` — header with live clock, property name, user avatar, notifications badge, dropdown menu with sign out
  - `components/operations/OperationsSectionNav.tsx` — role-filtered section navigation (compact horizontal or full grid with group labels)
  - `app/(operations)/_layout.tsx` — now wraps all screens with persistent header, auth guard via `usePortalAuth`

- **Phase 3 — SuperAdmin Layout**:
  - `components/superadmin/SuperAdminHeader.tsx` — header with user info, notifications, dropdown menu (profile, settings, sign out)
  - `components/superadmin/SuperAdminNav.tsx` — 7-group navigation (Overview, Tenants, Commerce, Platform, Support, System, Admin) with color-coded chips
  - `app/(superadmin)/_layout.tsx` — wraps all screens with persistent header, auth guard

- **Phase 4 — Host Portal Enhancement**:
  - `components/host/RoomSetup.tsx` — floor-based room management (add/remove floors, per-room type/bed/price/amenity toggles)
  - Enhanced `app/(host)/listing-wizard.tsx` — 8 property types (Hotel, Villa, Apartment, Resort, Cottage, Hostel, Guest House, Boutique), 8 amenity options, RoomSetup step, facilities step with cancellation policies, 8 house rules, 8 languages, min/max stay

- **Phase 5 — Guest Portal Components**:
  - `components/guest/Testimonials.tsx` — horizontal scrollable testimonial cards with ratings, avatars
  - `components/guest/WhyStayEasy.tsx` — feature cards (Secure Booking, 24/7 Support, Best Price Guarantee, Curated Properties)
  - `components/guest/OtherHotels.tsx` — horizontal scrollable property cards with rating, price, image icons

- `npx tsc --noEmit` — zero errors

**Key decisions**
- API client (`lib/api.ts`) uses a `fetch()`-based wrapper (not Axios) to avoid adding a new dependency, but matches Axios pattern with interceptors, retries, timeout
- Auth guard hook (`usePortalAuth`) uses Expo Router's `useSegments()` to detect login screens and redirect appropriately
- Operations/SuperAdmin headers appear on every screen within the portal (persistent top bar) — mobile-optimized version of the web app's sidebar+header pattern
- Role-based filtering in `OperationsSectionNav` respects `OperatorRole` enum (front_desk sees only front desk items, etc.)
- `RoomSetup` component uses a flat floor→rooms data model suitable for React Native ScrollView

---

### 2026-07-04 (late) — Shared Contexts for Operations Portal (POS, Front Desk, Housekeeping)

**Done**
- Created `lib/context/restaurant-context.tsx` — shared state for POS/KDS/Analytics: menu items, per-table carts, KDS tickets (placed from POS, displayed in KDS), completed orders, and computed analytics (revenue, top items, category breakdown, revenue trend)
- Created `lib/context/frontdesk-context.tsx` — shared state for Front Desk: 18 rooms across 3 floors with status tracking, bookings lifecycle (create → check-in → check-out), summary stats
- Created `lib/context/housekeeping-context.tsx` — shared state for Housekeeping: 8 tasks with status flow (Dirty → In Progress → Cleaned → Inspected), cleaner assignment, notes
- Wired `app/(operations)/_layout.tsx` — wraps with `RestaurantProvider`
- Wired `app/(operations)/front-desk/_layout.tsx` — wraps with `FrontDeskProvider`
- Wired `app/(operations)/housekeeping/_layout.tsx` — wraps with `HousekeepingProvider`
- Updated all 10 Operations screens to use their respective context:
  - `pos/index.tsx` — table statuses, order counts, revenue from context
  - `pos/table/[id].tsx` — shared menu, cart, place order creates real KDS ticket with notes
  - `pos/checkout.tsx` — actual cart items, payment clears table & resets room
  - `kds/index.tsx` — real tickets from POS, advance New→Preparing→Ready
  - `analytics/index.tsx` — computed KPIs from completed payments
  - `front-desk/index.tsx` — live rooms/stats/bookings from context
  - `front-desk/check-in.tsx` — searches arriving guests, assigns available room, updates context
  - `front-desk/check-out.tsx` — searched checked-in guests, processes checkout, frees room
  - `front-desk/new-booking.tsx` — creates booking in context
  - `housekeeping/index.tsx` — live tasks/stats from context
  - `housekeeping/[roomId].tsx` — status flow, cleaner assignment, notes persisted to context
- `npx tsc --noEmit` — zero errors

**Key decisions**
- Used React Context (not Zustand) for consistency with existing auth/notification/booking patterns
- Each Operations sub-module has its own context provider scoped to its layout group, avoiding unnecessary re-renders
- POS "Place Order" → creates a KDS ticket; KDS "advance status" and Checkout "complete payment" both affect shared state
- Front Desk check-out marks room as "Dirty" (not "Available") to trigger housekeeping flow
- No AsyncStorage persistence for operational contexts — transient state (in-memory) is acceptable for same-day operations

---

### 2026-07-04 (late night) — Missing Screens: HostLandingPage, CountryPage, TenantSetup

**Done**
- Created `lib/mock/world-countries.ts` — 20 countries with 100+ cities, attractions, cuisine, and travel information, matching the GitHub reference app dataset
- Created `lib/mock/hotels.ts` — 10 premium hotels (Nepal, Maldives, Switzerland, Greece, Indonesia, Japan, Italy, France) with ratings, pricing, amenities
- Created `app/(host)/landing.tsx` — HostLandingPage marketing screen: hero with CTA, "Why host here" section, "Why choose StayEasy" panel, 3-step process, expandable FAQ, CTA banner
- Created `app/country/[code].tsx` — CountryPage: hero image with gradient overlay, city filter chips, country info cards (capital/top attraction/cuisine/best time), top attractions list, cuisine tags, city explorer, hotel listings
- Created `app/(superadmin)/commerce/tenant-setup.tsx` — TenantSetup: simple brand name form with Continue action
- Registered `landing` in Host stack layout
- Registered `tenant-setup` in SuperAdmin Commerce stack layout  
- Registered `country/[code]` in root Stack navigator
- `npx tsc --noEmit` — zero errors

**Key decisions**
- Data files (`world-countries.ts`, `hotels.ts`) placed in `lib/mock/` alongside existing mock data
- Reused the existing `HotelData` interface shape from the reference (flat data, not the API `Hotel` type) since the CountryPage is a standalone screen
- HostLandingPage adapted to React Native ScrollView with View-based layout (no web HTML/CSS)
- CountryPage uses `useLocalSearchParams<{ code: string }>()` for the URL param
- Hotels filtered by matching `country` field; falls back to first 4 hotels if none match

---

### 2026-07-04 (late night) — Expo Push Notifications

**Done**
- Installed `expo-notifications` and `expo-device` (SDK 57 compatible)
- Created `hooks/use-push-notifications.ts` — hook that requests permission, gets Expo push token, sets up notification handler (foreground banners/sound/badge), and registers tap-to-navigate listeners
- Added `REGISTER_PUSH_TOKEN` endpoint to `constants/api-config.ts`
- Extended `notification-context.tsx` — added `pushToken` state, `registerPushToken(token)` function that persists to AsyncStorage and POSTs to the backend
- Wired `PushNotificationInit` component in `app/_layout.tsx` that bridges the push hook with the notification context
- `npx tsc --noEmit` — only pre-existing `expo-image-picker` errors remain (unrelated)

**Key decisions**
- Used `useRef<EventSubscription>` for listener cleanup via `.remove()` (SDK 57 API, not `removeNotificationSubscription`)
- Notification `handleNotification` returns `{ shouldShowBanner, shouldShowList, shouldPlaySound, shouldSetBadge }` (SDK 57 requires all 4)
- `EXPO_PUBLIC_PROJECT_ID` env var expected for `getExpoPushTokenAsync` (standard Expo config)
- Token registration with backend is fire-and-forget (graceful failure if backend unavailable)
- Physical device check prevents simulator/false tokens

---

### 2026-07-08 — Host Portal Polish: Photos, Branding, Extra Charges, Shift Coverage Calendar

**Done**
- **AD-005 (Property Photo Gallery)**: Category-organized gallery (Exterior, Lobby, Rooms, Dining, Amenities) with add/remove per category using `ImagePickerOverlay`; 10 sample property photos across categories in mock data
- **RM-004 (Room Type Photos)**: Expandable photo grid per room type with add/remove
- **AD-009 (Brand Color & Logo)**: Hex input + 10 preset swatches + live preview, saved on blur/tap; logo upload via `ImagePickerOverlay` with thumbnail + remove; `brandColor` wired into `HotelCard` (rating badge, price badge) and `[id].tsx` (price, button, contact, related hotels); `logoUrl` overlay on hero image
- **RM-009 (Extra Charges)**: `ExtraCharge` type (`per_night`/`one_time`), `extra_charges` on `RoomTypeDef`, sample data on all 6 room types, charges summary card in expanded room type area
- **ST-006 (Shift Coverage Calendar)**: Replaced flat shift list with weekly calendar grid showing coverage counts per day; color-coded cells (green ≥3, amber =2, red ≤1); understaffed warning banner; tap day to see shift details; week navigation (prev/next); mock shifts expanded across multiple dates
- Created reusable `ImagePickerOverlay.tsx` (camera/gallery modal, permission handling)
- All properties have unique `brandColor` and `logoUrl` values
- Enhanced mock shift data with prop-1 well-staffed, prop-2 thin, prop-3 severely understaffed

**Key decisions**
- Room type photos = flat `string[]` (no sub-categories) — SRS doesn't specify further
- Brand color stored as `brand_color` on `Property` type, exposed as `brandColor?: string` on guest `Hotel` type — two separate mock sets
- `ExtraCharge` structured as `{ id, name, price, charge_type, description? }` — covers all SRS fee types
- Calendar coverage threshold: ≥3 = green (well-covered), 2 = amber (adequate), ≤1 = red (understaffed)
- Week starts Monday, aligned to hotel industry standard
- `npx tsc --noEmit` — zero errors
