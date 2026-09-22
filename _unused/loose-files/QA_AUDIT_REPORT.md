# ServeIQ — Live E2E & UI/UX Audit (2026-09-10)

**Method:** Real device (Redmi 21061119BI, Android, Expo Go over USB `adb reverse`) + live API verification against the deployed FastAPI backend. All logins performed with **real backend credentials** (not local demo mocks). Credentials deliberately omitted from this file.

**Scope:** 4 portals + guest booking/payment; deep UI/UX pass via uiautomator dumps per screen; every claimed result verified by an actual API response or on-screen state.

---

## Findings (severity-ranked)

| # | Sev | Area | Finding | Status |
|---|-----|------|---------|--------|
| B1 | High | Backend | `GET /properties/{id}/tasks/housekeeping-staff` returns **500** whenever the property *has* housekeeping staff (returns 200 `[]` only while empty; reproducible). Sibling `/staffs/housekeeping-staffs` works. | Client mitigated: `getTaskHKStaffOptions` falls back to the working staff-module endpoint |
| F1 | High | Guest UX | Property detail with **0 available rooms** still renders booking UI ("USD 0 /night", "2 nights · Select a room") and funnels the guest to a dead-end. Should render a "No availability" state. | Open |
| F2 | Med | Data | Nearby rail data: `Chauthe Hotel1` advertises `lowest_rate: 3000` with `currency: "USD"` (NPR-typed seed data), and the detail screen ignores `lowest_rate` entirely → shows "USD 0". Needs currency sanity + rate fallback. | Open |
| F3 | Med | Host Data | Host dashboard property switcher **mixes mock property names** (Bardia Safari Lodge, Everest View Lodge, Hotel Namaste, Lumbini Peace Palace, Kathmandu Business Hotel, …) with real backend properties. Chip reads "35 propertyies" (typo; count inflated by mocks — admin owns 10). | Open |
| F4 | Med | Backend/UX | Staff creation: rejects formatted phone `+977-…` ("Phone number must contain only digits") and enforces **tenant-global unique staff emails** across properties ("Staff with this email already exists"). Neither rule is communicated in the host Staff form. | Open |
| F5 | Low | Guest UX | Guest home header search area ("Where are you going?") is a dead tap — navigation only works via the Search tab. | Open |
| F6 | Low | Host IA | No dedicated "All Properties" list page — property access only via dashboard switcher; "New" goes to the listing wizard. Deep navigation to a property's Housekeeping tab is multi-hop. | Open |
| F7 | Low | Tooling | Expo Go dev session is fragile (mid-session "Failed to download remote update"). Recommend a dev-client build for QA runs. | Open |
| F8 | Med | Host Data | Host portfolio overview shows **"30 Active Props" and "247" rooms** — counts inflated by the same mock properties (admin's real portfolio: 10 properties, few rooms). KPIs are not trustworthy for decisions. | Open |

---

## E2E status by portal

### Auth
- Guest login (`roshan1@gmail.com`): **PASS** — live `POST /auth/login` 200, `/auth/guests/me` returns profile, device session established.
- Host/Admin login (Pante parsad): **PASS** — live 200, role `admin`, owns tenant "Pokhara Hotel" + 10 properties.
- Front-desk login: **INVALID CREDENTIALS** (400) — forgot-password accepted (202, documented temp-password path). Flow pending temp-password.

### Guest portal
- Portal picker → guest home: **PASS** (live backend data: nearby rail incl. `Chauthe Hotel1` "<1 km").
- Property detail (Chauthe Hotel1): renders live description + real review text; **zero-availability dead-end found (F1)**.
- Search API verification: `Hotel Barahi` (Pokhara) → 20 rooms available tomorrow→+2n, `base_rate 250.00`, cancellation FLEXIBLE — device booking flow continues from here.
- Booking → payment → my-bookings: **pending device run**.

### Host portal
- Dashboard: **PASS** (Pante parsad, rooms grid "Room 1…Room 10", "No bookings yet", revenue empty-state renders).
- Property switcher: functional but **mock-data leakage (F3)**.
- Portfolio overview: **mock-inflated KPIs (F8)** — "30 Active Props" / "247" rooms.
- New Task (housekeeping) with real room/staff UUIDs: staff seeded server-side (Sita Rai on Property Details10, Hari Bahadur on Caution); modal wiring is in the build — device walk to the HK tab pending (host property page tab bar doesn't surface Housekeeping without horizontal scroll — UX note).
- Host staff form UX vs backend validation (F4): backend rules confirmed live (422 digits-only phone, 400 tenant-global email).

### Operations portal
- Blocked on front-desk credentials (reset in flight). Local-mock sanity only until then. Activities feeds verified via API: both return valid empty envelopes for current properties (no activity history exists yet).

### SuperAdmin (admin role via host portal)
- Tenant context confirmed via API (`GET /tenants` → Pokhara Hotel). Dedicated screens: **pending device run**.

---

## API verification matrix (live, token-authenticated)

| Endpoint | Result |
|---|---|
| `POST /auth/login` (guest + admin) | 200 |
| `GET /auth/{guests,users}/me` | 200, correct role separation |
| `GET /tenants` (admin) | 200 |
| `GET /properties` (admin) | 200 (10 properties) — guest gets 403 (correct scoping) |
| `GET /search?destination=` | 200 (Kathmandu/Pokhara rails verified) |
| `GET /search/nearby?lat&lon` | 200 (flat array, `distance_km`) |
| `GET /properties/{id}/rooms/available-rooms` | 200 (Barahi 20 rooms; Chauthe 0) |
| `GET /properties/{id}/public` | 200 (Chauthe: currency USD, 0 embedded rooms) |
| `GET /staff/properties/{id}/front-desk-summary` | 200 (all 10 properties) |
| `GET /staff/properties/{id}/activities/booking` | 200, Standard envelope, skip/limit meta |
| `GET /staff/properties/{id}/activities/housekeeping` | 200, Standard envelope, skip/limit meta |
| `GET /properties/{id}/tasks/rooms` | 200 (Barahi options; Property Details10: Room 1 / Room 1 (Copy)) |
| `GET /properties/{id}/tasks/housekeeping-staff` | **500 when staff exist** (B1); 200 `[]` when empty |
| `GET /properties/{id}/staffs` | 200 |
| `GET /properties/{id}/staffs/housekeeping-staffs` | 200 |
| `POST /properties/{id}/staffs` | 201; 422 digits-only phone; 400 tenant-global email |
| `POST /auth/forgot-password` | 202 |
| `GET /favorites` (guest) | 200 |

## Client wiring shipped in this pass
- `constants/api-config.ts`: `GET_TASK_HK_STAFF`, `GET_TASK_ROOMS`, `ACTIVITY_BOOKING`, `ACTIVITY_HOUSEKEEPING`
- `types/api.ts`: `BackendActivityLog`, `BackendStaffOption`, `BackendRoomOption`, `BackendRoomStatus`
- `host-api.ts`: `getTaskHKStaffOptions` (with B1 fallback), `getTaskRoomOptions`, `getBookingActivities`, `getHousekeepingActivities`
- Operations dashboard: merged "Recent Activity" feed (booking + HK, newest-first, top 8, silent fallback)
- HK room detail: real housekeeping-staff picker → `assignCleaner(room, name, staffId)` → `PATCH /tasks/{id}` `assigned_staff_id`
- Host New Task modal: real room/staff option pickers → `createTaskBE` with `room_id`, `assigned_staff_id`, `task_type` enum, `priority` enum, `due_time` (+24h default), server-error surfacing
- `npx tsc --noEmit` clean; `npx jest` 4 suites / 41 tests pass
