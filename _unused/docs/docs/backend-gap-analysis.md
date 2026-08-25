# Backend Gap Analysis: SRS vs Actual Backend vs Frontend

**Date:** July 24, 2026
**Backend:** https://stay-easy-sizw.onrender.com/api/v1
**Frontend:** Expo SDK 56 React Native app

---

## Executive Summary

| Area | SRS Requirements | Backend Has | Gap |
|------|-----------------|-------------|-----|
| Auth | 4 endpoints | 12 endpoints (guest + user) | ✅ Backend exceeds SRS |
| Properties | 11 endpoints | 16 endpoints | ✅ Backend exceeds SRS |
| Rooms | 3 endpoints | 11 endpoints | ✅ Backend exceeds SRS |
| Discount Codes | 2 endpoints | 5 endpoints | ✅ Backend exceeds SRS |
| Special Offers | 0 (not in SRS) | 5 endpoints | ✅ Bonus feature |
| Search | 1 endpoint | 1 endpoint | ✅ Aligned |
| Tenants | 3 endpoints | 4 endpoints | ✅ Backend exceeds SRS |
| **Bookings** | **9 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Folio** | **3 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Availability** | **1 endpoint** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Pricing** | **3 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **POS/Restaurant** | **4 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Staff** | **3 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Analytics** | **3 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **SuperAdmin** | **4 endpoints** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Notifications** | **1 endpoint** | **0 endpoints** | 🔴 **CRITICAL GAP** |
| **Reviews** | **1 endpoint** | **0 endpoints** | 🟡 **MISSING** |
| **Guest CRM** | **0 (implied)** | **0 endpoints** | 🟡 **MISSING** |
| **WebSocket** | **Required** | **Not implemented** | 🟡 **MISSING** |
| **RBAC** | **Required** | **Not implemented** | 🟡 **MISSING** |
| **Rate Limiting** | **Required** | **Not implemented** | 🟡 **MISSING** |

**Overall: Backend covers ~35% of SRS requirements. The foundation (auth + property management) is solid, but the entire booking engine, operations, and analytics layer is missing.**

---

## 1. Authentication — ✅ COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| POST /auth/register | Admin self-registration | ✅ POST /auth/users/register |
| POST /auth/login | Login; returns access + refresh tokens | ✅ POST /auth/users/login + /auth/guests/login |
| POST /auth/refresh | Exchange refresh token for new access token | ✅ POST /auth/users/refresh + /auth/guests/refresh |
| POST /auth/logout | Revoke refresh token | ❌ **MISSING** |

### Frontend Expectations
- Guest register/login/verify-otp/resend-otp/refresh/me ✅
- User register/login/verify-otp/resend-otp/refresh/me ✅
- Portal-scoped auth tokens ✅

### Notes
- Backend has OTP verification flow (not in SRS but good security practice)
- Missing `POST /auth/logout` — should revoke refresh token server-side
- Frontend auth context correctly uses all available endpoints

---

## 2. Property Management — ✅ COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties | List own properties | ✅ GET /properties/ |
| POST /properties | Create new property | ✅ POST /properties/general-information |
| GET /properties/:id | Get property details | ✅ GET /properties/{property_id} |
| PATCH /properties/:id | Update property settings | ⚠️ Partial (setup wizard steps only) |

### Backend Extras (not in SRS)
- POST /properties/{id}/create-location ✅
- POST /properties/{id}/create-photos-and-amenities ✅
- POST /properties/{id}/create-localization ✅
- POST /properties/{id}/create-brand-visual ✅
- POST /properties/{id}/toggle-property-activation ✅
- GET /properties/{id}/number-of-floors ✅
- POST /properties/{id}/image (upload) ✅
- POST /properties/{id}/images (bulk upload) ✅
- GET /properties/amenities ✅

### Frontend Expectations
- All property CRUD operations ✅
- Setup wizard steps (general info, location, photos, localization, brand) ✅
- Image uploads ✅
- Toggle activation ✅

### Notes
- Backend uses step-by-step wizard pattern (POST per step) instead of PATCH for updates
- This is a valid architectural choice — property setup is a multi-step process
- Frontend host-api.ts correctly calls all wizard step endpoints

---

## 3. Room & Inventory Management — ✅ MOSTLY COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/room-types | List room types with rates | ✅ GET /properties/{id}/rooms/room-types |
| POST /properties/:id/room-types | Create room type | ✅ POST /properties/{id}/rooms/room-type |
| GET /properties/:id/room-units | List all room units with live status | ✅ GET /properties/{id}/rooms |
| PATCH /properties/:id/room-units/:uid/status | Update room status | ⚠️ PATCH /properties/{id}/rooms/{room_id} (partial) |

### Backend Extras (not in SRS)
- POST /properties/{id}/rooms (bulk create) ✅
- GET /properties/{id}/rooms/{room_id} ✅
- DELETE /properties/{id}/rooms/{room_id} ✅
- POST /properties/{id}/rooms/bed-type ✅
- GET /properties/{id}/rooms/bed-types ✅
- POST /properties/{id}/rooms/image ✅
- POST /properties/{id}/rooms/images ✅

### Frontend Expectations
- Room CRUD with bulk create ✅
- Room types and bed types ✅
- Room image uploads ✅
- Room status updates (for housekeeping flow) ✅

### Notes
- Backend room status enum includes: AVAILABLE, OCCUPIED, DIRTY, CLEAN, INSPECTED, MAINTENANCE
- Frontend operations portal uses mock data for room status — will need to wire to backend when available
- Missing: room blocking for maintenance dates (SRS RM-010)

---

## 4. Discount Codes — ✅ COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| POST /properties/:id/discount-codes | Create discount code | ✅ POST /properties/{id}/discount-codes/ |
| POST /properties/:id/discount-codes/validate | Validate a discount code | ❌ **MISSING** |

### Backend Extras (not in SRS)
- GET /properties/{id}/discount-codes/ ✅
- GET /properties/{id}/discount-codes/{discount_id} ✅
- PATCH /properties/{id}/discount-codes/{discount_id} ✅
- DELETE /properties/{id}/discount-codes/{discount_id} ✅

### Frontend Expectations
- Full CRUD for discount codes ✅
- Validation endpoint missing ❌

### Notes
- Discount code validation is critical for guest booking flow (SRS BK-005)
- Backend should add `POST /properties/{id}/discount-codes/validate` endpoint

---

## 5. Special Offers — ✅ COMPLETE (Bonus)

### Not in SRS but implemented
| Endpoint | Description | Status |
|----------|-------------|--------|
| GET /properties/:id/special-offers/ | List special offers | ✅ |
| POST /properties/:id/special-offers/ | Bulk create special offers | ✅ |
| GET /properties/:id/special-offers/:offer_id | Get special offer | ✅ |
| PATCH /properties/:id/special-offers/:offer_id | Update special offer | ✅ |
| DELETE /properties/:id/special-offers/:offer_id | Delete special offer | ✅ |

### Notes
- This is a bonus feature not in the SRS
- Frontend correctly uses these endpoints

---

## 6. Search — ✅ COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/availability | Search available rooms | ⚠️ GET /search (different path) |

### Backend Implementation
- `GET /search` with query params: destination, check_in, check_out, adults, children, rooms
- Returns property list with pricing

### Frontend Expectations
- Search by destination, dates, guests ✅
- Maps backend response to Hotel format ✅
- Falls back to mock data on failure ✅

### Notes
- Backend search endpoint is at `/search` not `/properties/:id/availability`
- This is a global search, not per-property availability
- Per-property availability (real-time room-level) is missing

---

## 7. Tenants (SuperAdmin) — ✅ COMPLETE

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /superadmin/tenants | List all tenants with stats | ✅ GET /tenants/ |
| POST /superadmin/tenants/:id/suspend | Suspend tenant | ❌ **MISSING** |
| POST /superadmin/tenants/:id/impersonate | Issue impersonation token | ❌ **MISSING** |
| GET /superadmin/analytics | Platform-wide metrics | ❌ **MISSING** |

### Backend Extras
- POST /tenants/ (create) ✅
- PATCH /tenants/ (update) ✅
- DELETE /tenants/ (delete) ✅

### Frontend Expectations
- Tenant CRUD ✅
- Suspend/activate toggle ✅ (via PATCH)
- Delete ✅

---

## 8. Bookings — 🔴 CRITICAL GAP

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| POST /bookings | Create booking (guest or manual) | ❌ **MISSING** |
| GET /properties/:id/bookings | List bookings with filters | ❌ **MISSING** |
| GET /bookings/:ref | Get booking by reference | ❌ **MISSING** |
| PATCH /bookings/:ref/checkin | Perform check-in | ❌ **MISSING** |
| PATCH /bookings/:ref/checkout | Perform check-out | ❌ **MISSING** |
| POST /bookings/:ref/cancel | Cancel booking; triggers refund | ❌ **MISSING** |

### SRS Requirements (Folio)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /bookings/:ref/folio | Get guest folio with all charges | ❌ **MISSING** |
| POST /bookings/:ref/folio/charges | Post ad-hoc charge to folio | ❌ **MISSING** |
| POST /bookings/:ref/folio/payment | Record folio payment | ❌ **MISSING** |

### Frontend Expectations
- createBooking() — currently mock-only ❌
- Booking flow: Search → Room Selection → Guest Details → Add-ons → Review → Payment → Confirmation
- Check-in/Check-out flows in operations portal
- Folio management

### Impact
- **Guest cannot actually book rooms** — createBooking returns mock data
- **Front Desk cannot check guests in/out** — operations portal uses mock data
- **No real payment processing** — no Stripe/Razorpay integration
- **No folio system** — no in-stay charge tracking

### Required Backend Endpoints
```
POST   /bookings                              Create booking
GET    /bookings                              List bookings (admin)
GET    /bookings/:ref                         Get booking by reference
PATCH  /bookings/:ref/checkin                 Check-in
PATCH  /bookings/:ref/checkout                Check-out
POST   /bookings/:ref/cancel                  Cancel booking
GET    /bookings/:ref/folio                   Get folio
POST   /bookings/:ref/folio/charges           Add charge
POST   /bookings/:ref/folio/payment           Record payment
```

---

## 9. Availability Engine — 🔴 CRITICAL GAP

### SRS Requirements
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/availability | Real-time room availability | ❌ **MISSING** |

### SRS Section 11.3 — AvailabilityService
> Queries room units minus confirmed bookings minus blocked dates for a date range. Uses Redis cache with 60-second TTL. Cache invalidated on new booking or block.

### Frontend Expectations
- Real-time availability search
- Soft-lock during checkout (10 min TTL)
- No overbooking possible

### Required Backend Endpoints
```
GET    /properties/:id/availability           Search available rooms
```

### Required Business Logic
- Query room units minus confirmed bookings minus blocked dates
- Redis cache with 60-second TTL
- Soft-lock mechanism during guest checkout
- Real-time updates via WebSocket

---

## 10. Pricing Engine — 🔴 CRITICAL GAP

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/pricing-calendar | View rate calendar by date range | ❌ **MISSING** |
| POST /properties/:id/rate-plans | Create rate plan | ❌ **MISSING** |
| POST /properties/:id/date-overrides | Set seasonal price override | ❌ **MISSING** |

### SRS Section 11.3 — PricingService
> Computes final rate for a given room type, rate plan, and date range. Evaluates: base rate → date overrides → day-of-week rules → discount code → length-of-stay discount.

### Frontend Expectations
- Base nightly rate per room type
- Seasonal pricing overrides
- Day-of-week pricing rules
- Length-of-stay discounts
- Pricing calendar view

### Required Backend Endpoints
```
POST   /properties/:id/rate-plans            Create rate plan
GET    /properties/:id/rate-plans            List rate plans
POST   /properties/:id/date-overrides        Set date override
GET    /properties/:id/pricing-calendar      Get pricing calendar
```

---

## 11. POS/Restaurant — 🔴 CRITICAL GAP

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/tables | Get table floor plan with live status | ❌ **MISSING** |
| POST /properties/:id/orders | Create new POS order | ❌ **MISSING** |
| PATCH /orders/:id/items/:itemId/status | Update KDS item status | ❌ **MISSING** |
| POST /orders/:id/payment | Collect payment and close order | ❌ **MISSING** |

### Frontend Expectations
- Table management (sections, tables, floor plan)
- Menu management (categories, items, modifiers)
- Order lifecycle (create → KDS → ready → served → paid)
- Split billing
- Staff discounts

### Operations API (mock-only)
The frontend `operations-api.ts` has all POS endpoints defined but they are mock-only:
- GET /pos/menu
- GET /pos/tables
- POST /pos/orders
- PATCH /pos/orders/:id
- POST /pos/payments
- GET /kds/tickets
- PATCH /kds/tickets/:id

### Required Backend Endpoints
```
GET    /properties/:id/sections               List sections
POST   /properties/:id/sections               Create section
GET    /properties/:id/tables                 List tables
POST   /properties/:id/tables                 Create table
PATCH  /properties/:id/tables/:id/status      Update table status

GET    /properties/:id/menu/categories        List menu categories
POST   /properties/:id/menu/categories        Create category
GET    /properties/:id/menu/items             List menu items
POST   /properties/:id/menu/items             Create menu item
PATCH  /properties/:id/menu/items/:id         Update menu item

POST   /properties/:id/orders                 Create order
GET    /properties/:id/orders                 List orders
PATCH  /orders/:id                            Update order
PATCH  /orders/:id/items/:itemId/status       Update item status (KDS)
POST   /orders/:id/payment                    Process payment
```

---

## 12. Staff Management — 🔴 CRITICAL GAP

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| POST /properties/:id/staff/invite | Invite staff by email | ❌ **MISSING** |
| GET /properties/:id/staff | List staff members | ❌ **MISSING** |
| POST /properties/:id/tasks | Create task for staff | ❌ **MISSING** |

### SRS Requirements (Section 4.2.4)
- ST-001: Invite staff by email
- ST-002: Assign roles (Manager, Front Desk, Housekeeping, Waiter, Kitchen, Maintenance)
- ST-003: Assign staff to properties
- ST-004: Create/manage shift schedules
- ST-005: Clock in/out
- ST-006: Shift coverage calendar
- ST-007: Create/assign tasks
- ST-008: Mark tasks complete
- ST-009: Deactivate staff
- ST-010: POS access limits per role

### Frontend Expectations
- Staff CRUD
- Shift management
- Task assignments
- Role-based access

### Required Backend Endpoints
```
POST   /properties/:id/staff                  Invite staff
GET    /properties/:id/staff                  List staff
PATCH  /properties/:id/staff/:id              Update staff
DELETE /properties/:id/staff/:id              Remove staff

POST   /properties/:id/shifts                 Create shift
GET    /properties/:id/shifts                 List shifts
PATCH  /properties/:id/shifts/:id             Update shift

POST   /properties/:id/tasks                  Create task
GET    /properties/:id/tasks                  List tasks
PATCH  /properties/:id/tasks/:id              Update task
```

---

## 13. Analytics & Reporting — 🔴 CRITICAL GAP

### SRS Requirements (Section 8.2)
| Endpoint | Description | Backend Status |
|----------|-------------|----------------|
| GET /properties/:id/analytics/overview | Real-time KPI dashboard data | ❌ **MISSING** |
| GET /properties/:id/analytics/revenue | Revenue report with filters | ❌ **MISSING** |
| GET /properties/:id/analytics/occupancy | Occupancy forecast + history | ❌ **MISSING** |

### SRS Requirements (Section 4.6)
- AN-001: Real-time KPIs (Occupancy Rate, ARR, RevPAR, Total Revenue)
- AN-002: Revenue reports filterable by date, room type, rate plan, channel
- AN-003: Booking source report
- AN-004: Occupancy forecast (30/60/90 days)
- AN-005: Restaurant sales report
- AN-006: Cancellation report
- AN-007: Staff performance report
- AN-008: Automated report scheduling
- AN-009: SuperAdmin platform-wide reports
- AN-010: Export as CSV/PDF/Excel

### Frontend Expectations
- Analytics dashboard with KPI cards
- Revenue charts
- Occupancy trends
- Top items report
- Export capabilities

### Required Backend Endpoints
```
GET    /properties/:id/analytics/overview     KPI dashboard
GET    /properties/:id/analytics/revenue      Revenue report
GET    /properties/:id/analytics/occupancy    Occupancy forecast
GET    /properties/:id/analytics/bookings     Booking report
GET    /properties/:id/analytics/staff        Staff performance
GET    /superadmin/analytics                  Platform-wide metrics
```

---

## 14. Notifications — 🔴 CRITICAL GAP

### SRS Requirements (Section 12.2)
| Trigger | Recipient | Channels |
|---------|-----------|----------|
| Booking confirmed | Guest + Admin | Email + SMS + In-app |
| Booking cancelled | Guest + Admin | Email + SMS + In-app |
| Refund processed | Guest | Email + SMS |
| Check-in reminder (T-24h) | Guest | Email + WhatsApp |
| Checkout receipt | Guest | Email (with PDF) |
| Post-stay review | Guest | Email (2h after checkout) |
| New POS order | Kitchen | KDS WebSocket |
| Room checkout (dirty) | Housekeeping | In-app + SMS |
| Task assigned | Staff | In-app + Email |
| Low availability (≤3) | Admin | In-app |
| Staff invite | Invited Staff | Email |
| Subscription renewal | Admin | Email |

### Frontend Expectations
- Push token registration
- Notification list
- Mark as read
- Push notifications

### Required Backend Endpoints
```
GET    /notifications                        List notifications
PATCH  /notifications/:id/read               Mark as read
POST   /notifications/mark-all-read          Mark all as read
POST   /notifications/push-token             Register push token
```

---

## 15. Reviews — 🟡 MISSING

### SRS Requirements (CR-008)
> Guest can submit a review via post-stay email link; reviews are displayed on the property booking page.

### Frontend Expectations
- Review submission
- Review display on property page
- Rating system

### Required Backend Endpoints
```
POST   /reviews                              Submit review
GET    /properties/:id/reviews               List reviews
GET    /reviews/:id                          Get review
```

---

## 16. Guest CRM — 🟡 MISSING

### SRS Requirements (Section 4.5)
- CR-001: Auto-create guest profile on first booking
- CR-002: Aggregate stay history, dining history, preferences
- CR-003: Admin notes on guest profiles
- CR-004: Guest tier computation (Bronze/Silver/Gold/Platinum)
- CR-005: Loyalty points
- CR-006: Targeted promotions
- CR-007: Guest self-service profile management
- CR-008: Post-stay reviews

### Required Backend Endpoints
```
GET    /guests/profile                       Get guest profile
PATCH  /guests/profile                       Update guest profile
GET    /guests/history                       Stay history
GET    /guests/loyalty                       Loyalty points
```

---

## 17. WebSocket Support — 🟡 MISSING

### SRS Requirements (Section 11.3 — RealTimeService)
> Manages Socket.io rooms (namespaced by property_id). Broadcasts: new booking events, room status changes, order tickets, KDS updates, notification alerts.

### Use Cases
- Real-time room status updates
- Booking notifications
- KDS ticket updates
- Table status changes
- Staff notifications

### Frontend Expectations
- Real-time room grid updates
- Live KDS ticket board
- Push notification delivery

---

## 18. RBAC (Role-Based Access Control) — 🟡 MISSING

### SRS Requirements (Section 11.2)
> RBAC middleware checks user role against endpoint permission map; 403 if insufficient.

### SRS Permission Matrix (Section 2.2)
| Action | SuperAdmin | Admin | Manager | Staff |
|--------|-----------|-------|---------|-------|
| Create/delete properties | ✅ | ❌ | ❌ | ❌ |
| Add/remove staff | ❌ | ✅ | View | ❌ |
| Configure room types | ❌ | ✅ | Edit rates | ❌ |
| View bookings | ❌ | ✅ | ✅ | Front Desk |
| Create/cancel bookings | ❌ | ✅ | ✅ | Front Desk |
| Check-in/out | ❌ | ✅ | ✅ | Front Desk |
| Issue refunds | ❌ | ✅ | Limited | ❌ |
| Manage menu | ❌ | ✅ | ✅ | ❌ |
| Take orders (POS) | ❌ | ❌ | ✅ | Waiter |
| View KDS | ❌ | ❌ | ✅ | Kitchen |
| View reports | ❌ | ✅ | ✅ | ❌ |

### Frontend Expectations
- RoleGuard component (already exists)
- Portal-scoped permissions
- Role-based UI filtering

---

## 19. Rate Limiting — 🟡 MISSING

### SRS Requirements (Section 5.2)
> Rate limiting: 100 requests/minute per IP on public API; 1000/minute on authenticated API.

### Implementation Needed
- Redis-based rate limiting middleware
- IP-based for public endpoints
- User-based for authenticated endpoints

---

## 20. Multi-Tenancy — 🟡 PARTIAL

### SRS Requirements (Section 3.4)
1. Every table includes tenant_id (UUID) column
2. Tenant resolution middleware extracts tenant_id from JWT
3. Row-Level Security (RLS) in PostgreSQL
4. File storage namespaced by tenant_id
5. Redis keys prefixed with tenant_id
6. SuperAdmin bypasses tenant isolation

### Backend Implementation
- Auth endpoints have tenant_id in user model
- Properties are scoped to tenant
- But no RLS policies visible
- No tenant resolution middleware

---

## Priority Matrix

### P1 — Must Have (Blocks core functionality)
1. **Bookings API** — Guest cannot book without this
2. **Availability Engine** — Search results are meaningless without real availability
3. **Check-in/Check-out API** — Front Desk cannot function
4. **Folio API** — No charge tracking or invoicing
5. **Discount Code Validation** — Guest cannot apply discounts

### P2 — Should Have (Required for full product)
6. **Pricing Engine** — Rate plans, date overrides, pricing calendar
7. **Staff Management** — Invite, roles, shifts, tasks
8. **Analytics API** — KPI dashboard, revenue reports
9. **POS/Restaurant API** — Table management, orders, KDS
10. **Notifications API** — Email, SMS, push

### P3 — Nice to Have (Polish)
11. **Reviews API** — Guest feedback
12. **Guest CRM** — Profiles, loyalty, preferences
13. **WebSocket Support** — Real-time updates
14. **RBAC Middleware** — Role-based access control
15. **Rate Limiting** — API protection
16. **SuperAdmin Specific** — Suspend, impersonate, platform analytics

---

## Frontend Alignment Summary

### What Frontend Already Supports (with mock data)
| Feature | Frontend Status | Backend Status | Alignment |
|---------|----------------|----------------|-----------|
| Guest auth (register/login/OTP) | ✅ Real API | ✅ Real API | ✅ Perfect |
| User auth (register/login/OTP) | ✅ Real API | ✅ Real API | ✅ Perfect |
| Property search | ✅ Real API + mock fallback | ✅ Real API | ✅ Good |
| Property detail | ✅ Real API + mock fallback | ✅ Real API | ✅ Good |
| Property setup wizard | ✅ Real API | ✅ Real API | ✅ Perfect |
| Room management | ✅ Real API | ✅ Real API | ✅ Perfect |
| Discount codes | ✅ Real API | ✅ Real API | ✅ Perfect |
| Special offers | ✅ Real API | ✅ Real API | ✅ Perfect |
| Tenant CRUD | ✅ Real API | ✅ Real API | ✅ Perfect |
| **Booking creation** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Check-in/Check-out** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Folio management** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **POS/Restaurant** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Staff management** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Analytics** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Notifications** | ⚠️ Mock only | ❌ Missing | 🔴 Gap |
| **Reviews** | ⚠️ Mock only | ❌ Missing | 🟡 Gap |

### Frontend API Config Endpoints
The frontend `constants/api-config.ts` correctly maps all 49 backend endpoints:
- Auth: 12 endpoints ✅
- Properties: 30+ endpoints ✅
- Search: 1 endpoint ✅
- Tenants: 4 endpoints ✅

### Frontend Mock Fallback Pattern
The frontend uses a consistent pattern:
```typescript
async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.get(endpoint);
    return await handleResponse<T>(response);
  } catch {
    return fallback();
  }
}
```
This means the frontend works seamlessly whether the backend is available or not.

---

## Recommendations

### Immediate (Week 1-2)
1. Add `POST /auth/logout` endpoint
2. Add `POST /properties/{id}/discount-codes/validate` endpoint
3. Add `PATCH /properties/{id}` endpoint for property updates (not just wizard steps)

### Short-term (Week 3-4) — Core Booking
4. Implement Bookings CRUD API
5. Implement Availability Engine with Redis caching
6. Implement Check-in/Check-out flow
7. Implement Folio system
8. Add payment gateway integration (Stripe)

### Medium-term (Week 5-6) — Operations
9. Implement Staff Management API
10. Implement POS/Restaurant API
11. Implement Analytics API
12. Add Notifications API

### Long-term (Week 7-10) — Polish
13. Add WebSocket support
14. Implement RBAC middleware
15. Add rate limiting
16. Implement Guest CRM
17. Add Reviews API
18. SuperAdmin-specific endpoints

---

## Technology Stack Differences

| Aspect | SRS Spec | Actual Backend | Impact |
|--------|----------|----------------|--------|
| Backend Framework | Node.js (Express) | Python (FastAPI) | Different but functional |
| ORM | Prisma | SQLAlchemy (likely) | Different but functional |
| Database | PostgreSQL | PostgreSQL | ✅ Aligned |
| Cache | Redis | Unknown | Need to verify |
| Real-time | Socket.io | Not implemented | 🔴 Gap |
| Background Jobs | BullMQ | Not implemented | 🟡 Gap |
| File Storage | AWS S3 | Unknown | Need to verify |
| Payment | Stripe + Razorpay | Not implemented | 🔴 Gap |
| Email | Resend | Not implemented | 🟡 Gap |
| SMS | Twilio | Not implemented | 🟡 Gap |

**Note:** The backend uses FastAPI (Python) instead of Express (Node.js) as specified in the SRS. This is a valid architectural choice — FastAPI is excellent for API development with automatic OpenAPI documentation. The frontend doesn't care about the backend language as long as the API contract is maintained.
