# ServeIQ QA Audit Report

Date: 2026-09-10 (on-device: Redmi Note 11 108860510505, Android 13, Expo Go)
Backend under test: `https://stay-easy-sizw.onrender.com/api/v1` (source `github.com/anilghatan6/Stay-Easy`)

## Verification baseline
- `npx tsc --noEmit` — 0 errors
- `npx jest` — 4 suites / 41 tests pass
- `npx expo lint` — 0 issues in files touched by this audit (repo-wide backlog: 116 errors / 198 warnings across 19 files, see Lint Backlog)
- Bundle warm on device (HTTP 200, 143s); Expo Go "Something went wrong" earlier was transient Metro rebuild latency, NOT an app crash

## Fixes shipped this audit (all typechecked + jested)

### P0
1. **No global error boundary** → `app/_layout.tsx` wraps `<RootNavigator/>` in a `RootErrorBoundary` (error card + Reload button) so a render crash no longer hard-freezes the app.
2. **Hardcoded manager code / iOS-only `Alert.prompt`** → `MANAGER_CODE` centralized in `constants/portal-theme.ts`; POS checkout (`pos/checkout.tsx`) now uses a cross-platform RN `Modal` 4-digit prompt (previous code called `Alert.prompt` — iOS-only — meaning Android silently bypassed manager approval). `admin/approvals.tsx` consumes the constant.
3. **SuperAdmin Settings "Delete Account Permanently" wiped all app data** (`AsyncStorage.clear()`) → replaced with an honest "contact support" card.

### P1
4. **Booking detail/confirmation labeled unpaid arrivals "Paid"** — Confirmed live: `GET /bookings/me` items expose NO `payment_status`/`amount_paid`/`amount_due`, so the app inferred paid from `status` (an UNPAID CONFIRMED arrival showed a green "Paid" badge). Fixes:
   - `lib/context/booking-context.tsx` now maps `payment_status`/`amount_paid`/`amount_due` from `GET /bookings/{ref}` (`BookingReservationResponse`, which DOES carry them).
   - `app/(tabs)/profile/bookings/[id].tsx` derives the badge from server `paymentStatus`; falls back to old inference only when offline/local.
   - `hooks/use-booking-flow.ts` passes the real paid amount (`0` arrival, advance amount, or full online total) to `/booking-confirmation`; the confirmation screen shows green "Paid" only for truly-paid, otherwise amber **"Due at arrival"** with the amount. Banner copy no longer claims a false confirmation email.
5. **Guest price total discrepancy** — Device showed `USD 7,170` on the detail screen but the booking flow charged `USD 6,000` (== the server-booked `total_amount`). Root cause: the detail invented a 15% cleaning + 12% service fee that `POST /bookings` never collects. Removed the fake fees from `guest-hotel-detail/[id]`, `hotel-detail-full/[id]`, and `PriceSummary` — detail, flow, and server now agree (room × nights). Pre-selection no longer renders a `USD 0` breakdown (`PriceSummary` gates on dates AND room).
6. **Tenant CRUD misrepresentation** — Live backend: `PATCH /tenants` accepts **only `{name}`**, `DELETE /tenants` deletes **the caller's own tenant**, `GET /tenants` returns only the caller's. `lib/api/tenants.ts` `getTenantById` no longer silently fake-returns `tenants[0]`; `(superadmin)/tenants/[id].tsx` removed pretend suspend/activate/delete actions and explains the limitation.

### P2
7. **Forgot-password false success** — Backend returns HTTP 200 with `{success:false}` when the email is unknown; the app treated any 2xx as "we emailed you". Now honors the body's `success` flag.
8. **OTP resend swallowed the real error** — `otp-verify.tsx` surfaced the generic "Failed to resend code"; now shows the backend message.
9. **Currency coherence** — confirmation screen read no currency param and hardcoded `NPR`; now passes/uses the booking currency.

## Live-verified backend contracts (used for the fixes above)
- `POST /properties` requires nested `general_information` + `location` (+ `localization` times when "always allow check-in/out" is Off). `type` enum is UPPER: `HOTEL|HOSTEL|VILLA|APARTMENT|RESORT|GUESTHOUSE|RESTURANT|OTHER` (**note the `RESTURANT` typo**).
- `POST /properties/{id}/rooms` body: `{"rooms":[{room_number, room_type_id, bed_type_id, floor_number, base_rate, room_name}]}`; `POST .../room-type` `{room_type_name}`; `GET .../bed-types`.
- QA objects created during this audit for validation (flag for cleanup): property "QA Test Hotel" `839016fc-497e-4899-9fb1-f06fb8d784b8` (tenant `cec58083-cc33-4120-ac24-53937934fc37`), room type "Standard" `6063bbc7-a553-41c5-aa58-f7786c350f11`, room "Standard Room 101" `dc2f59b2-0825-4b0d-bea7-4d7d914d59e4`.

## Backend patch drafts (for `anilghatan6/Stay-Easy`, NOT applied here)
1. **List-bookings payment fields** — `BookingListItem` omits `payment_status`/`amount_paid`/`amount_due`/`payment_method`; guests can't tell paid vs unpaid from the list. Draft: return those fields in `/bookings/me` (same source already used by `GET /bookings/{ref}`).
2. **Property-create parity** — `lib/api/host-api.ts` `createProperty` sends a flat body (422s); `createGeneralInfo` already sends the correct nested shape. Make the host wizard use the nested shape (mirror `createGeneralInfo`).
3. **`RESTURANT` enum typo** — suggest `RESTAURANT` (alias to avoid breaking existing rows).
4. **Tenant PATCH/DELETE surface** — document that `PATCH /tenants` is name-only and `DELETE` removes the caller's tenant (the app now matches).

## Open findings (no fix planned this pass)
- **Lint backlog** (repo-wide, pre-existing): 116 errors / 198 warnings in 19 files; top offender `components/splash/SplashVisual.tsx` (49). None in files touched here.
- **Host portal P2s**: cold-start profile falls back to "Welcome back, Host" (hydration timing); "All Properties" portfolio tile doesn't navigate; back key pops the listing wizard entirely; QA-created property didn't surface in host list (demo-data binding per user).
- **Front-desk walkthrough skipped** per user direction; `front-desk/check-out.tsx` folio sync + `recordStaffPayment` remain as shipped previously.

## UAT checklist (5 min, device)
1. Sign in → host dashboard → open a property → create booking → confirm screen: paid vs "Due at arrival" badge matches the payment mode chosen.
2. Guest: search → property detail → pre-select (no USD 0), select date + Standard room → total == nights × rate (no cleaning/service fee) → book → confirmation shows the same total.
3. Profile → bookings → detail of an UNPAID arrival booking: amber "Pending", not green "Paid".
4. POS checkout with a >10% discount: manager-code modal must appear on Android.
5. SuperAdmin Settings: "Delete Account" gone; Tenants detail: no fake suspend/delete.