# Internship Project Report — IoT and Smart Technologies

**Project Title:** ServeIQ — Hotel & Restaurant Management SaaS Platform  
**Organization:** Pravidhi Digital Innovations Nepal Pvt Ltd  
**Date:** August 2026  
**Confidential — For Internal Evaluation Only**

---

## 1. Project Title and Introduction

### 1.1 Project Title

**ServeIQ — A Multi-Portal Cloud-Based Hotel & Restaurant Management SaaS Platform**

### 1.2 Introduction and Background

The hospitality industry in Nepal and across South Asia is undergoing a rapid digital transformation. Traditional hotel and restaurant management relies on fragmented, paper-based, or legacy desktop systems that fail to communicate with one another — leading to overbookings, inefficient staff coordination, lost revenue from mispriced rooms, and poor guest experiences. Small and mid-sized hospitality businesses, in particular, lack access to affordable, integrated software solutions that can unify their front desk, housekeeping, restaurant operations, and guest management under a single roof.

**ServeIQ** was conceived as a cloud-native, multi-tenant SaaS (Software as a Service) platform designed to serve as an end-to-end Hotel and Restaurant Management System. The platform supports a four-tier user hierarchy — **SuperAdmin** (platform operations), **Admin/Property Owner** (property management), **Staff** (day-to-day operations including front desk, housekeeping, restaurant, and kitchen), and **Guest** (public-facing booking and reservation). Each role has a distinct set of permissions, visual interfaces, and data access scopes, ensuring that every stakeholder interacts with only the information relevant to their responsibilities.

The mobile application is built using **Expo SDK 57 with React Native** (TypeScript), providing a cross-platform solution that runs on iOS, Android, and web from a single codebase. The backend is developed in **FastAPI (Python)** and deployed on **Render** (cloud hosting), with a **PostgreSQL** database for persistent data storage. The system communicates through RESTful APIs and supports real-time features such as room status updates, kitchen display system (KDS) ticketing, and push notifications.

From the perspective of IoT and Smart Technologies, the platform incorporates several intelligent systems that merit discussion. The **GPS-aware nearby property search** leverages device location services to deliver location-based smart recommendations, dynamically computing distances between the guest and available properties. **Push notifications** form an event-driven smart alerting layer — room status changes, booking confirmations, housekeeping task assignments, and kitchen order readiness all trigger contextually relevant notifications in real time. Furthermore, the platform employs **centralized state machines** that govern the lifecycle of reservations, rooms, housekeeping tasks, payments, and kitchen orders, automating transitions and enforcing business rules without manual intervention. These design choices exemplify how cloud-based software can embody the principles of smart technology: awareness of context, automated decision-making, and responsive interaction with users and devices.

### 1.3 Organization

The project was carried out at **Pravidhi Digital Innovations Nepal Pvt Ltd**, a software development company based in Nepal that specializes in building technology solutions for the hospitality and tourism sector. The company develops cloud-based platforms aimed at digitizing hotel and restaurant operations, with a focus on affordability and ease of use for small and medium-sized enterprises in the South Asian market.

---

## 2. Problem Statement

### 2.1 Existing Problem

The hospitality industry, particularly in developing markets like Nepal, faces several critical operational challenges:

1. **Fragmented Systems:** Most hotels and restaurants use separate, disconnected tools for reservations, billing, housekeeping, and restaurant management. A front-desk system does not communicate with the kitchen display; a booking engine does not update housekeeping tasks in real time. This fragmentation causes data silos, duplicated effort, and errors.

2. **Overbooking and Inventory Mismanagement:** Without a centralized, real-time availability system, properties frequently encounter double-bookings — especially when bookings arrive from multiple channels (direct, phone, walk-in, and online travel agencies). Manual tracking of room availability on paper or spreadsheets is error-prone and unscalable.

3. **Inefficient Staff Coordination:** Housekeeping staff learn about room status changes only through physical walkthroughs or verbal communication. Similarly, restaurant kitchen staff depend on handwritten order tickets, leading to lost orders, incorrect preparation, and delayed service.

4. **Limited Revenue Optimization:** Property owners lack tools for dynamic pricing — adjusting room rates based on seasonality, demand, day-of-week patterns, and competitor pricing. Without analytics, pricing decisions are intuition-based, leaving revenue on the table.

5. **Poor Guest Experience:** Guests have no self-service portal to search, book, and manage their reservations. Communication with the property is limited to phone calls and emails, with no real-time updates on booking status, check-in procedures, or special offers.

6. **Absence of Analytics and Reporting:** Property owners make strategic decisions without access to real-time KPIs such as occupancy rate, average daily rate (ADR), revenue per available room (RevPAR), or cancellation trends. Manual reporting is time-consuming and often inaccurate.

7. **Scalability Constraints:** Existing solutions are often single-property desktop applications that cannot scale to support multi-property management or a SaaS subscription model where a platform operator manages multiple tenants.

### 2.2 How ServeIQ Addresses the Problem

ServeIQ was designed to solve all of the above challenges through a unified, cloud-based platform:

- **Unified Multi-Portal Architecture:** A single application serves all four user roles, each with purpose-built interfaces. Real-time synchronization ensures that a booking made by a guest instantly updates the front desk, housekeeping, and kitchen displays.

- **Real-Time Availability Engine:** Room availability is calculated in real-time from confirmed bookings and blocked dates. A Redis-backed soft-lock mechanism (10-minute TTL) prevents concurrent booking conflicts during checkout.

- **Automated Staff Workflows:** Check-out automatically marks rooms as "Dirty" and dispatches tasks to housekeeping. Kitchen display systems receive orders instantly via push notifications.

- **Dynamic Pricing and Discount Management:** Seasonal pricing overrides, day-of-week rates, discount codes, early-bird discounts, last-minute deals, and length-of-stay discounts — all enforced with minimum rate floors.

- **Guest Self-Service Portal:** Guests can search availability, view room details, complete multi-step booking with payment, and receive confirmation with QR codes from their mobile device.

- **Real-Time Analytics Dashboards:** KPIs including occupancy rate, ARR, RevPAR, total revenue, booking trends, and revenue-by-channel reports with exportable PDF/Excel.

- **Cloud-Native Scalability:** Multi-tenant SaaS architecture with row-level security, designed for horizontal auto-scaling as tenant load grows.

---

## 3. System Workflow / Block Diagram

### 3.1 High-Level System Architecture

The following block diagram illustrates the overall architecture of the ServeIQ platform, showing the three primary layers — Client, API Gateway, and Data — along with external payment and notification integrations.

```
┌─────────────────────────────────────────────────────┐
│                CLIENT LAYER                          │
│                                                     │
│  Guest Portal    Host Portal    Operations Portal   │
│  (Coral)         (Blue)         (Teal)              │
│  Booking,        Property       Front Desk,         │
│  Search          Mgmt           POS                 │
│                                                     │
│              SuperAdmin Portal (Purple)              │
│              Platform Admin                          │
└──────────────────────┬──────────────────────────────┘
                       │  HTTPS REST + WebSocket
                       ▼
┌─────────────────────────────────────────────────────┐
│             API GATEWAY LAYER                        │
│     FastAPI Python Backend (root_path=/api/v1)       │
│                                                     │
│  Auth | Properties | Bookings | Search | Rooms      │
│  Discounts | Offers | Tenants | Staff | Images      │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ PostgreSQL   │ │  Redis   │ │  AWS S3      │
│ (Primary DB) │ │ (Cache)  │ │  (Planned)   │
└──────────────┘ └──────────┘ └──────────────┘

┌─────────────────────────────────────────────────────┐
│          EXTERNAL INTEGRATIONS                       │
│                                                     │
│  Stripe        Razorpay       Khalti               │
│  Payment       Payment        Payment               │
└─────────────────────────────────────────────────────┘
```

**Figure 3.1 — High-Level System Architecture of ServeIQ**

**Architecture Description**

The system is organized into three primary layers:

- **Client Layer:** The Expo React Native mobile application provides four distinct portal interfaces (Guest, Host, Operations, SuperAdmin), each with its own color theme and purpose-built UI components.

- **API Gateway Layer:** The FastAPI Python backend with domain-specific routers handling authentication, property management, bookings, search, discounts, offers, tenants, staff, and image uploads.

- **Data Layer:** PostgreSQL for persistent data storage, Redis for caching and session management, and AWS S3 (planned) for media file storage.

- **External Integrations:** Three payment gateways (Stripe, Razorpay, Khalti) for processing guest payments.

### 3.2 Booking Flow Workflow

The following diagram shows the complete booking lifecycle, from guest search through payment processing to confirmation.

```
Guest Opens App
       │
       ▼
1. Search: Dates, Guests, Property
       │
       ▼
2. Display Room Types with Photos & Pricing
       │
       ▼
3. Enter Guest Details
       │
       ▼
4. Apply Discount Code (Optional)
       │
       ▼
5. Review Booking with Rate Breakdown
       │
       ▼
6. POST /bookings/payment-intent
       │
       ▼
Select Payment Gateway
   ┌───────┼───────┬──────────┐
   ▼       ▼       ▼          ▼
Stripe  Razorpay Khalti    Test
  SDK      SDK     SDK    Payment
   │       │       │          │
   └───────┴───────┴──────────┘
               │
               ▼
7. Extract Transaction ID from Return URL
               │
         Verified?
        ┌───┴───┐
       Yes      No
        │        │
        ▼        ▼
  Confirmed   Retry
        │
        ▼
Email + SMS + Push + QR Code
```

**Figure 3.2 — Booking Flow Workflow**

**Booking Flow Description**

The booking process follows a structured multi-step workflow:

1. **Search:** The guest provides check-in/check-out dates, number of guests, and property location. The system queries the backend for available rooms.

2. **Room Selection:** Results display room types with photos, descriptions, amenities, and pricing per night.

3. **Guest Details:** The guest enters personal information and optionally applies a discount code.

4. **Payment:** A payment intent is created, and the guest is redirected to their chosen gateway (Stripe, Razorpay, or Khalti).

5. **Confirmation:** Upon successful payment, the backend confirms the booking, updates room inventory, sends confirmation communications, and notifies the property admin.

### 3.3 Check-in / Check-out Flow

```
CHECK-IN                      DURING STAY                CHECK-OUT
1. Search Booking        1. Guest Uses Services    1. Display Final Folio
       │                        │                          │
       ▼                        ▼                          ▼
2. Verify Identity       2. Staff Posts Charges    2. Process Payment
       │                        │                          │
       ▼                        ▼                          ▼
3. Assign Room Unit      3. Charges Added to Folio 3. Generate Receipt
       │                        │                          │
       ▼                        ▼                          ▼
4. Available → Occupied  4. Running Total Updated  4. Occupied → Dirty
       │                                                │
       ▼                                                ▼
5. Activate Guest Folio                          5. Notify Housekeeping
                                                        │
                                                        ▼
                                            HOUSEKEEPING FLOW
                                            Dirty → Cleaned → Inspected
                                                        │
                                                        ▼
                                            Room Status: Available ✓
                                            Ready for Next Guest
```

**Figure 3.3 — Check-in, Stay, and Check-out Workflow with Housekeeping Flow**

### 3.4 Restaurant POS / KDS Flow

```
WAITER POS                 KITCHEN DISPLAY              BILLING
1. Open Table          WebSocket    1. Receive Order     1. Close Bill
       │                  │                │                    │
       ▼                  │                ▼                    ▼
2. Browse Menu          │         2. Display Items     2. Itemized Total
       │                  │         + Table                  + Tax
       ▼                  │                │                    │
3. Add Items            │         3. Mark: In          3. Split Bill
   + Modifiers          │            Progress            (Optional)
       │                  │                │                    │
       ▼                  │                ▼                    ▼
4. Review Cart          │         4. Mark: Ready       4. Process Payment
       │                  │                │                    │
       ▼                  │                ▼                    ▼
5. Submit Order ─────────┘         5. Mark: Served      5. Generate Receipt
                                                         Table: Available ✓
```

**Figure 3.4 — Restaurant POS and Kitchen Display System Flow**

---

## 4. Description of Components / Modules

### 4.1 Frontend — Expo React Native Mobile Application

**Technology:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router

The mobile application is the primary user interface for all four portals. It is built as a single Expo project using Expo Router for file-based navigation, with portal-specific route groups providing visual and functional isolation.

**Key Characteristics:**
- **Cross-Platform:** Runs on iOS, Android, and web from a single TypeScript codebase.
- **File-Based Routing:** Expo Router provides automatic route generation from the `app/` directory structure.
- **Type Safety:** Full TypeScript coverage with strict mode enabled.
- **State Management:** Zustand for global client state; React Context for portal-specific state.
- **Styling:** NativeWind (Tailwind CSS for React Native) + StyleSheet.

| Portal | Route Group | Theme Color | Primary Users |
|--------|------------|-------------|---------------|
| Guest | `(tabs)/` | Coral (#E63946) | End-users booking rooms |
| Host | `(host)/` | Blue (#2563EB) | Property owners |
| Operations | `(operations)/` | Teal (#0D9488) | Staff (front desk, housekeeping, POS, kitchen) |
| SuperAdmin | `(superadmin)/` | Purple (#7C3AED) | Platform administrators |

### 4.2 Backend — FastAPI Python Server

**Technology:** FastAPI, Python, PostgreSQL, deployed on Render

The backend is a RESTful API server with `root_path="/api/v1"` and domain-specific routers:

| Router | Prefix | Purpose |
|--------|--------|---------|
| `login_router` | `/auth` | Authentication (login, register, OTP, refresh) |
| `properties_routers` | `/properties` | Property CRUD, amenities, setup wizard |
| `room_routers` | `/properties/{id}/rooms` | Room type and unit management |
| `discount_code_router` | `/properties/{id}/discount-codes` | Discount code CRUD |
| `offers_routers` | `/properties/{id}/special-offers` | Special offer management |
| `booking_router` | `/bookings` | Booking lifecycle, payment, confirmation |
| `tenants_routers` | `/tenants` | Tenant management (SuperAdmin) |
| `search_router` | `/search` | Hotel search and nearby properties |
| `image_routers` | `/properties` | Image upload and management |

### 4.3 Database — PostgreSQL

**Technology:** PostgreSQL (primary data store)

The database stores all persistent data with multi-tenant isolation via `tenant_id` columns. Key tables include:

- **tenants** — Platform customers (property owners/companies)
- **users** — All authenticated users (Admin, Staff) with role assignments
- **guests** — End-customers who make bookings
- **properties** — Hotel/resort/restaurant metadata
- **room_types / room_units** — Room templates and physical instances with real-time status
- **bookings / booking_rooms** — Master booking records and room assignments
- **folios / folio_charges** — Financial accounts per stay
- **menu_items / orders / order_items** — Restaurant operations
- **staff_shifts / tasks** — Staff management
- **audit_logs** — Immutable audit trail

### 4.4 Caching Layer — Redis

**Technology:** Redis 7 (deployed)

Redis serves multiple purposes in the current deployment:

- **Session caching:** JWT refresh tokens and search result cache
- **Rate limiting:** 100 requests/minute on public API, 1,000/minute on authenticated API
- **Real-time availability:** Soft-lock tokens for room inventory during checkout (10-minute TTL)

**Planned enhancements:** Background job queues (BullMQ) for email, reports, and reminders; AWS S3 integration for media file storage. These are part of the architectural roadmap and are not yet deployed in the current production environment.

### 4.5 Payment Gateway Integration

**Technology:** Stripe, Razorpay, Khalti (native SDKs + WebView fallback)

The platform supports three payment gateways, configurable per property:

| Gateway | Use Case | Implementation |
|---------|----------|---------------|
| **Stripe** | International properties | Native SDK (`@stripe/stripe-react-native`) + WebView fallback |
| **Razorpay** | Indian market | Native SDK (`react-native-razorpay`) + WebView fallback |
| **Khalti** | Nepali market | Native SDK (`@bishaldahal/react-native-khalti-checkout`) + WebView fallback |

**Payment Flow:**
1. Booking creates a payment intent via `POST /bookings/payment-intent`
2. Backend returns a `payment_url` and gateway-specific payload (e.g., `pidx` for Khalti)
3. Frontend opens the payment gateway (native SDK in dev builds, WebView in Expo Go)
4. Customer completes payment on the gateway
5. Frontend intercepts the return URL, extracts the gateway-confirmed transaction ID
6. Frontend calls `POST /bookings/confirm` with the gateway payload
7. Backend verifies the payment and confirms the booking

### 4.6 Operations Portal — Real-Time Management

The Operations Portal provides four specialized sub-modules for day-to-day hotel and restaurant operations:

**Front Desk Module:**
- Visual room grid with color-coded status (Available/Occupied/Dirty/Maintenance)
- New booking creation for walk-in guests
- Check-in and check-out processing with folio management
- Real-time room status updates

**Housekeeping Module:**
- Task queue with status flow: Dirty → In Progress → Cleaned → Inspected
- Room detail view with cleaner assignment and notes
- Automatic task creation on guest check-out

**Restaurant POS Module:**
- Visual floor plan with table status (Available/Occupied/Reserved/Needs Cleaning)
- Menu browsing by category with modifier selection
- Cart management with quantity controls
- Split-bill functionality (by item, percentage, or equally)
- Multiple payment methods: cash, card, UPI, room charge, loyalty points

**Kitchen Display System (KDS):**
- Real-time order ticket display
- Ticket aging with color urgency coding (green → yellow → red)
- Item-level status updates: New → In Progress → Ready
- Dark background for reduced eye strain in kitchen environments

### 4.7 Host Portal — Property Management

The Host Portal enables property owners to manage their listings:

- **Dashboard:** Overview statistics (total properties, bookings, revenue), recent bookings, quick actions
- **Listing Wizard:** 8-step guided property setup (Property Type → Details → Rooms → Policies → Branding → Photos → Facilities → Confirmation)
- **Room Management:** Create room types with bed configuration, pricing, amenities, and photos
- **Discount Codes:** Percentage off, fixed amount, free night offers with validity periods and usage limits
- **Special Offers:** Seasonal promotions and length-of-stay discounts
- **Staff Management:** Invite staff, assign roles (Manager, Front Desk, Housekeeping, Waiter, Kitchen, Maintenance), manage shifts
- **Brand Customization:** Brand color picker and logo upload for white-label booking portal

### 4.8 SuperAdmin Portal — Platform Administration

The SuperAdmin Portal provides platform-level control:

- **KPI Dashboard:** Total tenants, MRR (Monthly Recurring Revenue), active properties, platform health
- **Tenant Management:** List, search, suspend, activate, and delete tenant accounts with full audit trail
- **Commerce:** Subscription plan management (Free Trial, Basic, Professional, Enterprise)
- **Platform:** Feature flags, analytics, reports, data exports
- **Support:** Ticket management with priority filtering, platform announcements
- **System:** Service health monitoring, audit log viewer
- **Admin:** Role and permission management, platform settings

### 4.9 Guest Portal — Booking and Reservation

The Guest Portal provides a consumer-facing booking experience:

- **Home Screen:** City-based property rails (Kathmandu, Pokhara) with backend-fetched results
- **Search:** Destination, date range, guest count with real-time availability
- **Property Detail:** Photo galleries, room types, amenities, pricing, reviews
- **Booking Flow:** Multi-step process (Room Selection → Guest Details → Payment → Confirmation)
- **Profile:** Booking history, loyalty points, personal information management
- **Nearby Properties:** GPS-based nearby search using the `/search/nearby` endpoint

### 4.10 Push Notifications

**Technology:** Expo Notifications, Expo Push Tokens

Push notifications are sent for new bookings, check-in/check-out alerts, housekeeping task assignments, and kitchen order readiness. Tokens are registered with the backend and stored in AsyncStorage. Notifications work in foreground (banner + sound), background, and killed states with graceful failure handling.

### 4.11 Internationalization (i18n)

**Technology:** i18next, react-i18next

The platform supports multiple languages: English (default), Nepali, Chinese, and Japanese. Translation files are stored in `lib/i18n/locales/` with structured JSON format covering all user-facing strings.

### 4.12 API Client Layer

Custom fetch-based HTTP client (`lib/api.ts`) with portal-scoped auth token injection, request/response interceptors, automatic retry on transient failures, 401 auto-clear, timeout handling, and an API-first with mock data fallback pattern that ensures the UI remains functional even when the backend is degraded or unavailable.

### 4.13 Component Library

| Directory | Components |
|-----------|-----------|
| `components/guest/` | Testimonials, WhyServeIQ, OtherHotels |
| `components/host/` | RoomSetup, WizardSteps, Controls |
| `components/booking/` | BookingHeader, ProgressHeader, Step components |
| `components/operations/` | OperationsHeader, OperationsSectionNav |
| `components/superadmin/` | SuperAdminHeader, SuperAdminNav |
| `components/feature/` | SearchModal, PaymentCheckoutModal, SDKPaymentCheckout |
| `components/ui/` | Reusable primitives (buttons, cards, inputs, modals) |

---

## 5. Student's Role and Contribution

### 5.1 Overview of Contributions

During the internship, I was involved in the full-stack development of the ServeIQ platform, contributing to both the mobile application (React Native/Expo) and the backend API integration (FastAPI). My work spanned architecture design, feature implementation, API integration, testing, and documentation.

### 5.2 Specific Tasks and Modules

#### 5.2.1 Multi-Portal Architecture Design and Implementation

I designed and implemented the four-portal architecture that allows a single Expo application to serve Guest, Host, Operations, and SuperAdmin users with fully independent sessions, visual identities, and workflows:

- Created the portal picker screen (`app/index.tsx`) with four premium cards, each with distinct color themes
- Extended the `AuthContext` to support portal-aware authentication with separate login, demo login, and portal switching
- Implemented portal-scoped AsyncStorage keys (`auth_token_{portal}`, `refresh_token_{portal}`, `user_profile_{portal}`) for session isolation
- Designed the portal profile type system (`GuestProfile`, `HostProfile`, `OperatorProfile`, `SuperAdminProfile`) as a TypeScript union type

#### 5.2.2 Host Portal Development

I built the complete Host Portal, including:

- **Dashboard** with statistics cards, recent bookings, and quick action buttons
- **Listing Wizard** — an 8-step guided property setup flow (property type selection, basic details, room configuration, policies, branding, photos, facilities, and confirmation)
- **Room Management** with floor-based room grid, room type creation, bed configuration, pricing, amenity toggles, and photo management
- **Brand Customization** with hex color picker, preset swatches, live preview, and logo upload
- **Staff Management** with role-based invitations, shift coverage calendar, and staff profile management
- **Discount Code and Special Offer** CRUD with API integration and mock fallback

#### 5.2.3 Operations Portal Development

I developed the Operations Portal with four specialized sub-modules:

- **Front Desk:** Visual room grid, new booking creation, check-in/check-out processing with folio management
- **Housekeeping:** Task queue with status flow (Dirty → Clean → Inspected), cleaner assignment, room detail with notes
- **Restaurant POS:** Floor plan with table status, menu browsing, cart management, order placement, split-bill, and checkout
- **Kitchen Display System (KDS):** Real-time order ticket display, item status progression, ticket aging with color coding

I also created the shared contexts (`RestaurantContext`, `FrontDeskContext`, `HousekeepingContext`) that wire these modules together — for instance, placing an order in POS creates a KDS ticket, and checking out a guest creates a housekeeping task.

#### 5.2.4 SuperAdmin Portal Development

I built the SuperAdmin Portal with:

- **KPI Dashboard** displaying tenant count, MRR, active properties, and platform health
- **Tenant Management** with list view, detail view, suspend/activate actions, and audit trail
- **Commerce Module** with subscription plan cards and billing management
- **Platform Module** with feature flags, analytics, reports, and data exports
- **Support Module** with ticket management and announcements
- **System Module** with health monitoring and audit log viewer

#### 5.2.5 API Integration and Backend Connectivity

I integrated the frontend with the live FastAPI backend:

- Verified all 40+ API endpoints against the live OpenAPI specification
- Implemented the `host-api.ts` module with 16+ API functions (properties CRUD, rooms CRUD, discount codes, special offers, staff management) using the fallback pattern
- Connected all three Operations contexts (restaurant, front desk, housekeeping) to `operations-api.ts`
- Wired the SuperAdmin tenant list and detail screens to real backend endpoints
- Implemented `searchNearbyApi()` for GPS-based property discovery

#### 5.2.6 Payment Gateway Integration

I implemented the multi-gateway payment system:

- Integrated **Stripe** (native SDK + WebView), **Razorpay** (native SDK + WebView), and **Khalti** (native SDK + WebView)
- Built the `PaymentCheckoutModal` (WebView-based hosted checkout) for Expo Go compatibility
- Built the `SdkPaymentCheckout` component for native SDK payments in development builds
- Implemented the payment intent flow with gateway-specific payload construction
- Verified end-to-end Khalti payment completion through the native SDK

#### 5.2.7 Booking Flow Engineering

I designed and implemented the complete booking flow:

- Multi-step booking process (Room Selection → Guest Details → Payment → Confirmation)
- Room pre-selection skip when navigating from property detail page
- Timezone-safe date handling (local date reconstruction to avoid UTC offset bugs)
- Discount code validation and application
- Rate breakdown calculation (base rate × nights + taxes - discount)
- Payment gateway selection with availability detection

#### 5.2.8 Quality Assurance and Code Quality

I performed extensive quality work:

- Ran `npx tsc --noEmit` to verify zero TypeScript errors after every change
- Performed color tokenization across 198 files (~3,200 hex color references converted to design tokens)
- Split large files for maintainability: `lib/api.ts` (monolith → 6 focused modules), `listing-wizard.tsx` (2,427 lines → 712-line orchestrator + 4 extracted modules), `booking-flow.tsx` (1,254 lines → thin composition + 4 extracted modules)
- Reduced lint errors from 44 to 32 across multiple refactoring sessions

### 5.3 Testing and Verification

Throughout development, I performed the following verification steps:

| Verification Step | Tool / Command | Result |
|------------------|----------------|--------|
| TypeScript Compilation | `npx tsc --noEmit` | Zero errors after every change |
| Linting | `npm run lint` | No new errors introduced; 12 pre-existing lint issues reduced through refactoring |
| Build Verification | `CI=1 npx expo export --platform ios` | Exit 0 — all modules resolved |
| API Connectivity | OpenAPI spec cross-reference | All 40+ endpoints verified |
| Payment Flow | End-to-end Khalti test | Payment completed successfully |
| Prebuild | `npx expo prebuild --no-install` | All native modules resolved |

---

## 6. Summary and Conclusion

### 6.1 Project Summary

**ServeIQ** is a comprehensive, cloud-native Hotel & Restaurant Management SaaS platform that addresses the critical operational challenges faced by hospitality businesses in Nepal and South Asia. The platform unifies four distinct user portals — Guest, Host, Operations, and SuperAdmin — within a single Expo React Native mobile application, backed by a FastAPI Python server and PostgreSQL database.

The project encompasses:
- **Property Management:** Multi-property support with room types, pricing, photos, and amenities
- **Booking Engine:** Real-time search, availability calculation, multi-step booking with payment processing
- **Operations Management:** Front desk (check-in/out), housekeeping (task queue), restaurant POS (table orders, menu management), and kitchen display system (real-time order tracking)
- **Revenue Management:** Dynamic pricing, seasonal overrides, discount codes, and special offers
- **Payment Processing:** Multi-gateway support (Stripe, Razorpay, Khalti) with native SDK and WebView fallbacks
- **Analytics:** Real-time KPI dashboards, revenue reports, occupancy forecasting
- **Platform Administration:** Tenant management, subscription billing, feature flags, and audit logging

### 6.2 Effectiveness in Addressing the Problem

| Problem | ServeIQ Solution |
|---------|-----------------|
| Fragmented Systems | Unified multi-portal platform with real-time synchronization |
| Overbooking | Real-time availability engine with Redis-backed soft-lock |
| Inefficient Staff Coordination | Automated workflows with push notifications |
| Limited Revenue Optimization | Dynamic pricing with analytics-driven decisions |
| Poor Guest Experience | Self-service portal for search, booking, and payment |
| No Analytics | Real-time KPI dashboards with exportable reports |
| Scalability Constraints | Cloud-native SaaS with multi-tenant architecture |

### 6.3 Knowledge and Skills Gained

**Technical Skills:**
- **React Native / Expo:** Cross-platform mobile development with Expo SDK 57, file-based routing with Expo Router, and native module integration
- **TypeScript:** Strict-mode TypeScript development with complex type systems (union types, generics, discriminated unions)
- **Python FastAPI:** Backend API development with FastAPI, OpenAPI specification, and RESTful API design
- **PostgreSQL:** Database schema design, multi-tenant data isolation, and query optimization
- **Payment Integration:** Native SDK integration for Stripe, Razorpay, and Khalti with WebView fallback patterns
- **State Management:** Zustand and React Context for complex multi-portal state management
- **Real-Time Systems:** Push notification-based real-time updates for KDS and room status
- **Authentication:** JWT-based auth with portal-scoped sessions and OTP verification

**Professional Skills:**
- **Architecture Design:** Designing a multi-portal, multi-tenant SaaS architecture from scratch
- **API Integration:** Cross-referencing frontend endpoints with backend OpenAPI specifications
- **Documentation:** Maintaining comprehensive architecture documentation and session history
- **Problem Solving:** Debugging timezone-related date bugs, payment gateway integration issues, and React Native platform-specific challenges
- **Collaboration:** Working with Git version control and code review practices

### 6.4 Conclusion

The ServeIQ platform demonstrates how modern cloud-native technologies can be leveraged to create an affordable, comprehensive solution for hospitality management. The multi-portal architecture ensures that every stakeholder — from the platform administrator to the end guest — has access to purpose-built interfaces that streamline their specific workflows. The integration of real-time features, multiple payment gateways, and analytics dashboards positions the platform as a competitive solution in the South Asian hospitality technology market.

From the standpoint of IoT and Smart Technologies, the project illustrates how mobile-first cloud platforms can incorporate context-aware computing (GPS-based search), event-driven automation (state machines governing room and booking lifecycles), and intelligent notification systems to deliver a responsive, smart hospitality experience. These principles — awareness, automation, and adaptability — are foundational to the broader field of smart technologies, and their practical application within ServeIQ has provided a meaningful foundation for understanding how software systems can serve as the intelligence layer atop physical operations.

The internship provided invaluable hands-on experience in full-stack development, from designing database schemas and building REST APIs to implementing complex mobile UIs and integrating third-party payment systems. The skills gained — particularly in React Native, TypeScript, Python FastAPI, and SaaS architecture — are directly applicable to future software engineering endeavors.

---

**Report Prepared By:** Aswin Panta  
**Internship Period:** July 2026 — August 2026  
**Organization:** Pravidhi Digital Innovations Nepal Pvt Ltd  
**Project:** ServeIQ — Hotel & Restaurant Management SaaS Platform
