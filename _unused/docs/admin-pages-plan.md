# ServeIQ — Admin Pages Publish-Ready Plan

> **Date:** 2026-08-03
> **App:** Expo SDK 57 (React Native) · Expo Router · TypeScript
> **Scope:** All 3 admin portals — SuperAdmin (platform ops), Host (property management), Operations Admin (staff/shifts/tasks/approvals)
> **Approach:** Frontend-first. Backend endpoints are assumed to exist (or the established mock-fallback pattern is used) — no backend work in this plan.

---

## 1. Goal

Make every admin-facing screen in ServeIQ production-grade so the app is safe to publish: every page shows real or gracefully-falling-back data, handles loading/empty/error states, validates user input, respects the portal design system, and is reachable within ≤3 taps of its dashboard.

**Architecture:** Each screen keeps the existing pattern — a thin route file under `app/(portal)/...` delegating to a component (e.g. `components/host/screens/*`, `components/superadmin/*`), pulling data from a context/provider with a mock-fallback API layer (`lib/api.ts`, `lib/api/host-api.ts`, `lib/context/*`). No new state libraries; no backend changes.

**Tech Stack:** React Native + Expo Router, existing `portal-theme` tokens, `components/ui/*` primitives, existing contexts/stores.

## 2. Global Constraints (apply to EVERY page)

Copied verbatim from the SRS + existing codebase conventions. Every task below implicitly includes these.

1. **Design tokens** — use `constants/portal-theme.ts` (`SRS`, `GRAY`, `TYPOGRAPHY`, `SPACING`, `RADIUS`, `SHADOWS`, `FONTS`) and `useColors()`. Portal accents: SuperAdmin `#7C3AED`, Host `#2563EB`, Operations `#0D9488`.
2. **Component rules** (from `docs/component-inventory.md`): use `StatusBadge` for statuses, `EmptyState` for empty lists, `Skeleton` for loading lists, `Modal` for dialogs, `AnimatedPressable`/`FadeInView` for interactions, `IconSymbol` for icons.
3. **Every data list** must have three states: loading (skeleton or spinner), empty (`EmptyState`), error (`ErrorState` + retry button).
4. **Every mutation** (create/update/delete/toggle): inline validation before submit → optimistic update or button loading state → success toast/alert → error toast with the failed payload preserved. Destructive actions require a confirmation dialog (`Alert.alert` with `destructive` style).
5. **Mock-fallback pattern** — data layer must use the established `apiGet<T>(endpoint, fallback)` style so the UI never crashes when the backend is down. Never `throw` from a page-level data load; always catch and fall back.
6. **RBAC gating** — wrap restricted routes/actions in `AuthGuard` (portal) and `RoleGuard` (allowed roles). SuperAdmin screens require superadmin session; manager-gated actions in Operations require manager role.
7. **Navigation depth** — SRS §5.5: ≤3 taps from a portal dashboard to any primary workflow. Verify every deep link below.
8. **i18n** — all user-facing strings via `lib/i18n` (`useTranslation()`). Hardcoded English is acceptable only where it already exists, but new strings must go through i18n.
9. **Pull-to-refresh** on all list screens (`RefreshControl`).
10. **Safe areas & keyboards** — respect `useSafeAreaInsets()`, `KeyboardAvoidingView` for forms, `ScrollView` keyboardShouldPersistTaps="handled".
11. **Type safety** — run `npx tsc --noEmit` after every task; zero errors required. Shared types live in `types/api.ts`.

---

## 3. Cross-Cutting Work (do once, benefits all pages)

### Task CC-1: Unified `useAsyncData` helper (optional but recommended)

**Files:**
- Create: `hooks/use-async-data.ts`

A tiny hook encapsulating the loading/error/refetch pattern all pages will use:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  return { data, loading, error, reload: load };
}
```

**Acceptance:** `npx tsc --noEmit` passes; hook usable from any screen.

### Task CC-2: Error-state component audit

Verify `components/ui/error-state.tsx` exports an `ErrorState` with `title`, `message`, `onRetry` props (it exists per the file tree). If props differ, align them. Add it beside every `EmptyState` usage listed in the pages below.

### Task CC-3: Pull-to-refresh wrapper

Confirm every list screen uses `ScrollView` + `RefreshControl` wired to its reload function (from `useAsyncData` or the existing context reload). List screens without it: tenants list, all commerce/platform/support/system lists, operations tasks/shifts.

---

# 4. Portal A — SuperAdmin (Platform Ops)

Color: purple `#7C3AED`. Route group: `app/(superadmin)/`. Auth: `SuperAdminProfile` session (portal `'superadmin'`). All screens below are inside the group layout which already applies `AuthGuard`.

---

### A-01 · SuperAdmin Dashboard — `app/(superadmin)/index.tsx`

**SRS:** SA-001, SA-002 · **Priority: P1**

**Current state:** Real tenants fetched via `getTenants()`; but Revenue chart is **fabricated** (bar heights scaled by `tenants.length`), Plan Distribution is **derived from fake math**, System Status is **hardcoded**, Recent Activity derives from tenant list.

**Publish-ready spec:**
- [ ] Revenue/MRR chart → render from `superAdminKPIs`/analytics context; if no analytics endpoint, label the card "Demo data" and show it only when data exists (hide fabricated bars entirely rather than showing fake numbers).
- [ ] Plan Distribution → count real tenants by their actual `plan` field; show 0-count rows with neutral styling (never show fake `|| 4` fallbacks).
- [ ] System Status → pull from the live probe used by A-13 Health; remove hardcoded `142ms/2.8k q/s` values.
- [ ] Add loading skeletons for KPI row + cards, `ErrorState` with retry when `getTenants()` fails (currently `.then(setTenants)` silently swallows).
- [ ] Greeting should use `user?.name`; keep portal-switch button.

**Acceptance:** Zero fabricated numbers visible; every card has loading/empty/error states; tenant fetch failure shows a retry UI instead of silent empty activity list.

---

### A-02 · Tenants List — `app/(superadmin)/tenants/index.tsx`

**SRS:** SA-002, SA-003 · **Priority: P1**

**Current state:** Starts from hardcoded `TENANTS_DATA`, overwritten by `getTenants()` only if `data.length > 0`. Backend tenants lack `company/avatar/mrr` shape → rows can render `undefined`.

**Publish-ready spec:**
- [ ] Map backend tenant → row model: `company = name || brand_name || slug`, `plan` (from `plan/plan_name` or `'Trial'`), `status` (active/suspended/trial), `properties`/`users` from backend fields or `'—'`.
- [ ] Remove reliance on `TENANTS_DATA`; use `useAsyncData(getTenants)` with skeleton + `EmptyState` + `ErrorState(retry)`.
- [ ] Keep search + `FilterChips` (All/Active/Suspended/Trial) operating on the mapped model.
- [ ] Add `RefreshControl`.
- [ ] Avatar initials derived from company name; stable `PLAN_COLORS` map.

**Acceptance:** List renders from real backend data with sensible fallbacks; no `undefined` text; all three list states present.

---

### A-03 · Tenant Detail — `app/(superadmin)/tenants/[id].tsx`

**SRS:** SA-003, SA-004 · **Priority: P1**

**Current state:** Reads `tenant_id` param, falls back to `MOCK_TENANTS`; `updateTenant`/`deleteTenantApi` wired via `lib/api.ts`. Not fully read in this audit — treat as "partially real, mock detail blocks".

**Publish-ready spec:**
- [ ] Fetch tenant by id (`getTenantById` or filter `getTenants()`); show skeleton while loading, `ErrorState` with retry on failure.
- [ ] Detail sections (contact, plan, renewal, stats, recent activity) map from real backend fields; any field missing on backend → show `'—'`, never a mock value.
- [ ] Suspend/activate via `updateTenant({ status })` with confirm dialog; show optimistic state + toast.
- [ ] Delete with destructive confirm; on success navigate back and refresh list (use `router.back()` + reload event or context).
- [ ] Replace `MOCK_TENANTS` block entirely with backend shape.

**Acceptance:** Detail page is fully backend-driven; suspend/delete confirmations work; stats show `'—'` for absent fields.

---

### A-04 · Create Tenant Wizard — `app/(superadmin)/commerce/tenant-setup.tsx`

**SRS:** SA-003 · **Priority: P1**

**Current state:** Brand-name form with Continue action (lightweight). May not call `POST /tenants/`.

**Publish-ready spec:**
- [ ] Wire form to `POST /tenants/` (`API_ENDPOINTS.TENANTS.CREATE`) with name/slug/plan/email fields per backend `CreateTenantRequest` shape.
- [ ] Inline validation (name required, email format, unique slug hint), loading state on submit, success → navigate to tenant detail; error → toast with server message.
- [ ] Add step for selecting initial plan (Free Trial/Basic/Pro/Enterprise from A-05).

**Acceptance:** Creating a tenant persists to backend (or falls back to context list locally); validation blocks empty/invalid input.

---

### A-05 · Subscription Plans — `app/(superadmin)/commerce/plans.tsx`

**SRS:** SA-012 (manage plans + entitlements) · **Priority: P1**

**Current state:** Full CRUD UI on local `INITIAL_PLANS` state only — nothing persisted.

**Publish-ready spec:**
- [ ] Add plans API (assumed `GET/POST/PATCH/DELETE /plans` or similar) behind the mock-fallback pattern; load plans on mount via `useAsyncData`.
- [ ] Keep existing add/edit modal + status toggle + delete confirm, but persist each action; on API failure keep the local change + toast "saved offline".
- [ ] Enforce that a plan can't be deleted while tenants reference it (disable delete + explain).
- [ ] Prices: keep NPR display, validate `price >= 0` and name required.

**Acceptance:** Plan CRUD persists through the data layer with offline fallback; delete guard works.

---

### A-06 · Subscriptions — `app/(superadmin)/commerce/subscriptions.tsx`

**SRS:** SA-004 · **Priority: P1**

**Current state:** Not audited in detail; expected local-mock subscription list.

**Publish-ready spec:**
- [ ] List subscriptions with tenant name, plan, status (active/trialing/past_due/canceled), renewal date.
- [ ] Actions: upgrade/downgrade plan, cancel, reactivate — each with confirm dialog + toast.
- [ ] Search + filter chips by status; pull-to-refresh; skeleton/empty/error states.
- [ ] Derive MRR summary card from the list (sum active subscriptions), not fabricated.

**Acceptance:** Subscription lifecycle actions persist and update summary KPIs derived from the list.

---

### A-07 · Billing & Invoices — `app/(superadmin)/commerce/billing.tsx`

**SRS:** SA-002 (MRR), SA-004 · **Priority: P2**

**Current state:** Expected mock invoice list.

**Publish-ready spec:**
- [ ] Invoice list (invoice #, tenant, period, amount, status paid/open/overdue) with status filters.
- [ ] Actions: view invoice detail (modal), mark paid, send reminder (toast + disabled state).
- [ ] Revenue summary cards (MRR, outstanding, collected) computed from the loaded invoices.
- [ ] Loading/empty/error + refresh.

**Acceptance:** No fabricated revenue; all figures derive from loaded invoice data.

---

### A-08 · Payment Configuration — `app/(superadmin)/commerce/payment-config.tsx`

**SRS:** SA-009 · **Priority: P2**

**Current state:** Expected mock toggle list of gateways.

**Publish-ready spec:**
- [ ] Gateway list (Stripe / Razorpay / Khalti / Test) with enabled state + platform-vs-tenant-keys explanation.
- [ ] Toggle enable/disable with confirm dialog (disabling Stripe while tenants depend on it shows a warning).
- [ ] Persist via data layer with fallback; toast on change.

**Acceptance:** Gateway toggles persist and warn on risky disable.

---

### A-09 · Payment Gateway — `app/(superadmin)/commerce/payment-gateway.tsx`

**SRS:** SA-009 · **Priority: P2**

**Current state:** Expected credential-key form (masked keys).

**Publish-ready spec:**
- [ ] Key entry form (publishable/secret) with `secureTextEntry`, "show/hide", masked persistence display (only last 4).
- [ ] Validate key formats client-side (starts with `pk_`/`sk_`/`rzp_` etc.).
- [ ] "Test connection" button that calls a validate endpoint or gateway health check; show success/failure inline.
- [ ] Never log or display full secret keys.

**Acceptance:** Secrets masked everywhere; test-connection gives clear pass/fail.

---

### A-10 · Feature Flags — `app/(superadmin)/platform/feature-flags.tsx`

**SRS:** SA-005 · **Priority: P1**

**Current state:** Local `INITIAL_FLAGS` with toggle + search only; nothing persists.

**Publish-ready spec:**
- [ ] Load flags from data layer (`useAsyncData`); persist toggle changes with optimistic update + rollback on failure.
- [ ] Keep search; add rollout % and environment badges already present.
- [ ] Add "create flag" flow (name, description, environments, rollout) via modal — mirroring Plans modal pattern.
- [ ] Add confirmation when disabling a Production flag (higher stakes than staging).

**Acceptance:** Flags persist; Production disable requires confirm; create flow works.

---

### A-11 · Platform Analytics — `app/(superadmin)/platform/analytics.tsx`

**SRS:** AN-009 (platform-wide aggregated metrics) · **Priority: P2**

**Current state:** Expected mock KPI/chart screen (not audited; analytics-context may feed some KPIs).

**Publish-ready spec:**
- [ ] KPIs (total tenants, total bookings, platform revenue, churn) from data layer; skeleton on load, error+retry.
- [ ] Charts (revenue trend, bookings by tenant, active vs churned) only render when real data exists — otherwise show a "No data yet" empty state, never fake series.
- [ ] Date-range filter (7/30/90 days) that refetches.

**Acceptance:** All metrics derived from loaded data; empty state when no data; filters refetch.

---

### A-12 · Platform Reports — `app/(superadmin)/platform/reports.tsx`

**SRS:** SA-006, AN-010 (export) · **Priority: P2**

**Current state:** Expected mock report cards.

**Publish-ready spec:**
- [ ] Report list (usage by tenant, API volume, storage, bookings per tenant) each with "Generate" action.
- [ ] Generated report renders a preview list + export button (CSV via the shared export util from A-21).
- [ ] Loading spinner during generation; error state for generation failure; empty state.

**Acceptance:** Reports generate from real data or explicit empty state; export shares a CSV.

---

### A-13 · System Health — `app/(superadmin)/system/health.tsx`

**SRS:** SA-010 · **Priority: P1**

**Current state:** Fully hardcoded `SERVICES` + `RECENT_INCIDENTS` with past dates (2025) — clearly demo data.

**Publish-ready spec:**
- [ ] Probe live services from the phone: at minimum ping the API (`GET /` or `/health`) and report up/down + latency; DB/Redis/storage show `'—'` (unknown) unless a health endpoint exists.
- [ ] Replace fake incidents with an empty state ("No incidents recorded").
- [ ] Auto-refresh every 30s (interval + cleanup), plus pull-to-refresh.
- [ ] Banner ("Degraded Performance") must reflect actual computed status, not hardcoded.

**Acceptance:** No fabricated uptime/incident data; API status is a real live probe; banner derives from actual service states.

---

### A-14 · Audit Logs — `app/(superadmin)/system/audit-logs.tsx`

**SRS:** SA-003 (audit trail), §5.2 security audit requirement · **Priority: P1**

**Current state:** Expected mock log list.

**Publish-ready spec:**
- [ ] Log list (timestamp, actor, action, entity, IP) from data layer; chronological order.
- [ ] Filters: actor search, action type chips, date range; pagination or infinite scroll for large lists.
- [ ] Detail expand for old/new value diff.
- [ ] Export CSV via the shared export util from A-21 (SRS AN-010 requires export on reports/logs).
- [ ] Loading/empty/error states.

**Acceptance:** Logs are read-only, filterable, exportable; no mutation controls anywhere.

---

### A-15 · Impersonate — `app/(superadmin)/system/impersonate.tsx`

**SRS:** SA-011 (logged, auditable) · **Priority: P2**

**Current state:** Expected mock tenant picker.

**Publish-ready spec:**
- [ ] Tenant search + select; "Start impersonation" triggers the impersonate endpoint (or, frontend-first, opens a session notice).
- [ ] Prominent "You are impersonating {tenant}" banner while active + "Exit impersonation" button.
- [ ] Require explicit confirm dialog citing that the action is audited.
- [ ] If backend lacks the endpoint, gate the screen behind a `FEATURE_IMPERSONATE` flag and show a "Coming soon" empty state — do not fake a token.

**Acceptance:** Impersonation flow is explicit, confirmed, and visibly reversible; no fake tokens.

---

### A-16 · Support Tickets — `app/(superadmin)/support/tickets.tsx`

**SRS:** SA-007 · **Priority: P1**

**Current state:** Hardcoded `TICKETS` with filter chips; cards are not pressable (no detail).

**Publish-ready spec:**
- [ ] Load tickets via data layer; keep status filter chips + urgent count badge derived from data.
- [ ] Make cards open a ticket detail modal: full description, tenant context, assignee picker (from A-19 roles users), status stepper (Open → In Progress → Resolved → Closed), reply composer.
- [ ] Every status change/assign persists with toast; confirm on close-without-resolution.
- [ ] Loading/empty/error + refresh.

**Acceptance:** Full ticket lifecycle (open→assign→reply→resolve→close) works and persists; counts always derived from list.

---

### A-17 · Announcements — `app/(superadmin)/support/announcements.tsx`

**SRS:** SA-008 · **Priority: P2**

**Current state:** Expected mock announcement list.

**Publish-ready spec:**
- [ ] List announcements (title, audience: all/selected tenants, channel: in-app/email, status: draft/sent).
- [ ] Create flow: title, body, audience selector (All tenants / specific tenants multi-select), channel toggles, schedule-now or draft.
- [ ] Publish confirm dialog; sent announcements read-only.
- [ ] Persist via data layer + fallback; toast on send.

**Acceptance:** Announcement creation + audience targeting works; sent state immutable.

---

### A-18 · Broadcast Notifications — `app/(superadmin)/support/notifications.tsx`

**SRS:** SA-008 (in-app notification delivery) · **Priority: P3**

**Current state:** Expected mock notification log.

**Publish-ready spec:**
- [ ] List sent notifications (subject, recipients count, channel, sent date, status delivered/failed).
- [ ] Detail modal with delivery stats; retry-failed button (confirm + toast).
- [ ] Empty state when none; refresh.

**Acceptance:** Notification history accurate; retry only offered for failed items.

---

### A-19 · Roles & Permissions — `app/(superadmin)/admin/roles.tsx` + `edit-role.tsx`

**SRS:** RBAC (§2.2 permission matrix, §11.2) · **Priority: P1**

**Current state:** Driven by `superadmin-context` (`DEFAULT_ROLES`) — fully in-memory; create/delete/toggle work only within the session.

**Publish-ready spec:**
- [ ] Persist roles through the data layer with fallback; on mount hydrate context from API.
- [ ] `edit-role.tsx`: permission toggles must map to the SRS matrix (Manage Tenants, View Billing, Manage Platform, Manage Roles, View Reports, System Config); show a "system role" lock for SuperAdmin/Admin built-ins (already `isSystem`).
- [ ] Prevent deleting roles assigned to users (show user count; disable delete when > 0).
- [ ] Add audit note that role changes are logged (link to A-14).

**Acceptance:** Role CRUD + permission toggling persists across sessions; system roles protected; delete blocked while in use.

---

### A-20 · More Menu — `app/(superadmin)/more.tsx`

**SRS:** navigation · **Priority: P2**

**Current state:** Nav hub grouping Support/System/Admin routes; profile card falls back to `'admin@ServeIQ.com'` mock email.

**Publish-ready spec:**
- [ ] Profile card uses real `user` values only (no mock email fallback).
- [ ] Verify every route listed exists and is registered (all do per layout).
- [ ] Sign-out flows through `logout()` + portal reset (already correct).

**Acceptance:** No mock identity text; all links land correctly.

---

### A-21 · Data Exports — `app/(superadmin)/platform/exports.tsx`

**SRS:** SA-006, AN-010 · **Priority: P1 (blocker)**

**Current state:** **Generates fabricated CSV/text content** via `buildCsvFor()` — fake tenant rows (`Tenant A…H`), fake bookings, fake revenue (`3_200_000 + i*380_000`), fake analytics (`active_users,1245`) — then shares it through `Share.share`. Export history is seeded with fake 2025 entries. This could ship fabricated financial data to real users: a **publish blocker**.

**Publish-ready spec:**
- [ ] Delete `buildCsvFor`'s fake-data generation entirely.
- [ ] Exports must serialize **real loaded data**: Tenants export writes rows from the `getTenants()` response; Bookings/Revenue from real bookings data; Analytics from real metrics. If a dataset is empty → share a file with headers only + "No data" row, never synthetic rows.
- [ ] Replace seeded `EXPORT_HISTORY` with actual export attempts (recorded on each export) or an empty state.
- [ ] Move CSV-building into a shared util (`lib/utils/exports.ts`) reused by A-12 Reports, A-14 Audit Logs, B-09 Reports.
- [ ] Keep `Share.share` for delivery; add file-size + timestamp to history.

**Acceptance:** Exported files contain only real data; empty datasets export headers-only files; history reflects real actions.

---

### A-22 · Platform Settings — `app/(superadmin)/admin/settings.tsx`

**SRS:** SA-005, §5.2 (MFA mandatory for SuperAdmin) · **Priority: P1**

**Current state:** Driven by `superadmin-context` `DEFAULT_SETTINGS` — in-memory.

**Publish-ready spec:**
- [ ] Persist settings via data layer; hydrate context on mount.
- [ ] Fields: platform name, support email (validate), default currency, MFA enforcement toggle (default **on** per SRS §5.2), session timeout, maintenance mode + message, webhook URL (validate URL).
- [ ] Maintenance-mode toggle shows a full-screen notice preview before saving.
- [ ] Confirm dialog for enabling maintenance mode (affects all tenants).

**Acceptance:** Settings persist; MFA defaults enabled; URL/email validated inline.

---

# 5. Portal B — Host (Property Management)

Color: blue `#2563EB` (property screens use `SRS.teal`/navy in sections — keep the established `portal-theme` tokens). Route group: `app/(host)/`. All property screens wrap content in `PropertySectionScreen` (shared header + property loading), which already handles "property not found".

### B-00 · Host Dashboard — `app/(host)/index.tsx`

**SRS:** AD-001–AD-003 · **Priority: P1**

**Current state:** Drawer-shell dashboard listing properties with stats; links to `property/edit/[id]` and section routes; already uses `useHost()` + `portal-theme` tokens (partially refactored per recent commits).

**Publish-ready spec:**
- [ ] Loading skeleton while `useHost` hydrates; empty state with "Create your first property" CTA when none.
- [ ] Property card stats (bookings, revenue, occupancy) derived from the property's real data where available; `'—'` otherwise (no fabricated numbers).
- [ ] Add "Go to listing wizard" primary CTA (already exists via `newBtn`).
- [ ] Pull-to-refresh re-fetches properties.

**Acceptance:** Dashboard shows real properties with accurate-or-dashed stats; clear empty/loading states.

---

### B-01 · Property Hub — `app/(host)/property/[id].tsx`

**SRS:** AD-004 · **Priority: P1**

**Current state:** Section tab hub (Dashboard, Bookings, Rooms, Guests, Staff, Housekeeping, Pricing, Reports, Settings) navigating to `property/[id]/<section>` routes. Being replaced by the new `[id]/` folder screens.

**Publish-ready spec:**
- [ ] Keep the 9-section navigation; each tab highlights the active route.
- [ ] Header shows property name, status badge (active/inactive), and quick "View as guest" link to the public property page.
- [ ] Ensure every section route is registered in `app/(host)/_layout.tsx` (all new `[id]/*` + `settings/*` screens are already added per the current git diff).

**Acceptance:** All 9 sections + 11 settings sub-screens are reachable from the hub with active-route highlighting.

---

### B-02 · Property Dashboard — `app/(host)/property/[id]/dashboard.tsx` → `components/host/screens/PropertyDashboard.tsx`

**SRS:** AN-001 (real-time KPIs) · **Priority: P1**

**Current state:** Section screen wrapping `PropertyDashboard`; expected mock KPI cards + recent bookings.

**Publish-ready spec:**
- [ ] KPI row (Occupancy %, ARR, RevPAR, Total Revenue, Arrivals/Departures today) from real data (property bookings + room stats); `'—'` with tooltip "waiting for data" when backend lacks it.
- [ ] Recent bookings list links to Bookings section; arrivals/departures today lists are actionable (tap → front-desk/check-in deep link).
- [ ] Loading skeleton + empty state for a fresh property.
- [ ] Pull-to-refresh.

**Acceptance:** KPIs derive from real data or show explicit unknown state; no fabricated percentages.

---

### B-03 · Bookings — `app/(host)/property/[id]/bookings.tsx` → `PropertyBookings.tsx`

**SRS:** BK-015, BK-019, AN-002 · **Priority: P1**

**Current state:** Mock booking list (per gap analysis, booking creation is mock-only on some paths; the backend now has `/bookings/`, `/properties/{id}/bookings`, payment-intent/confirm/apply-discount endpoints).

**Publish-ready spec:**
- [ ] Fetch `GET /properties/{id}/bookings`; map to list rows (ref, guest, dates, room, amount, status).
- [ ] Filters: status chips (all/confirmed/checked-in/checked-out/cancelled), date range, guest search.
- [ ] Row actions: view detail modal (with folio link if folio endpoint exists), cancel (confirm + policy-aware messaging), check-in/check-out shortcuts.
- [ ] "New booking" button → opens the manual booking flow (BK-019) reusing `booking-flow.tsx` patterns with property context.
- [ ] Loading/empty/error + refresh.

**Acceptance:** Bookings list is backend-driven with working filters; cancel and manual-creation flows persist.

---

### B-04 · Rooms — `app/(host)/property/[id]/rooms.tsx` → `PropertyRooms.tsx`

**SRS:** RM-001–RM-004, RM-006 · **Priority: P1**

**Current state:** Real backend integration exists (room types, bulk room create, images, bed types) via `hostApi`; per recent audit this is the most complete host section.

**Publish-ready spec:**
- [ ] Verify room-type expand (photos, extra charges RM-009, per-room units) still maps to backend after any API shape changes.
- [ ] Room status overrides (RM-006: mark maintenance with expected-return date) persist via `UPDATE_ROOM`.
- [ ] Empty state when property has no rooms; CTA to run wizard RoomSetup.
- [ ] Loading/error states around `hostApi.getRooms`.

**Acceptance:** Room CRUD + status override persist; UI states complete. (Mostly done — regression-test.)

---

### B-05 · Guests — `app/(host)/property/[id]/guests.tsx` → `PropertyGuests.tsx`

**SRS:** CR-001–CR-005 (guest CRM) · **Priority: P2**

**Current state:** Mock guest list (CRM backend missing per gap analysis).

**Publish-ready spec:**
- [ ] Guest list from data layer (assumed `GET /properties/{id}/guests`); fallback list from booking history (derive guests from `GET /properties/{id}/bookings` when no CRM endpoint).
- [ ] Guest card: name, contact, nationality, loyalty tier (Bronze/Silver/Gold/Platinum), stay count, total spend.
- [ ] Guest detail: stay history, notes (CR-003 add note), preferences, contact log.
- [ ] Search + tier filter chips; refresh; empty state.

**Acceptance:** Guests derive from real bookings at minimum; tier/notes persist when backend supports them.

---

### B-06 · Staff — `app/(host)/property/[id]/staff.tsx` → `PropertyStaff.tsx`

**SRS:** ST-001–ST-003, ST-009, ST-010 · **Priority: P1**

**Current state:** Real backend staff endpoints wired (`GET/POST/PATCH/DELETE /properties/{id}/staffs`, image upload) with `mapApiStaff` in `host-context`. This is the most complete admin staff implementation.

**Publish-ready spec:**
- [ ] Regression-test invite/role assignment (ST-002), deactivate (ST-009), POS discount limits (ST-010).
- [ ] Staff invite email modal (`StaffCreatedEmailModal`) — ensure it fires only after backend creation succeeds (or falls back gracefully).
- [ ] Role filter chips by job role; active/inactive toggle persists via `UPDATE_STAFF_MEMBER`.
- [ ] Loading/empty/error states around staff fetch.

**Acceptance:** Staff lifecycle persists against backend; UI states complete. (Mostly done — regression-test.)

---

### B-07 · Housekeeping — `app/(host)/property/[id]/housekeeping.tsx` → `PropertyHousekeeping.tsx`

**SRS:** RM-007 (Dirty → Clean → Inspected → Available) · **Priority: P2**

**Current state:** Mock task/room list per gap analysis.

**Publish-ready spec:**
- [ ] Task queue derived from rooms with `DIRTY` status (from `GET /properties/{id}/rooms` status field) when no dedicated HK endpoint.
- [ ] Status stepper (Dirty → Clean → Inspected → Available) persists via `UPDATE_ROOM`.
- [ ] Assign cleaner (staff from B-06) with due time; mark complete with timestamp.
- [ ] Stats row (dirty/cleaning/inspected counts) computed from loaded rooms; refresh.

**Acceptance:** Housekeeping flow updates real room statuses; queue reflects live room data.

---

### B-08 · Pricing & Discounts — `app/(host)/property/[id]/pricing.tsx` → `PropertyPricingDiscounts.tsx`

**SRS:** PR-001–PR-012 · **Priority: P1**

**Current state:** Discount codes + special offers are real (backend CRUD); base rates/rate plans/date overrides/pricing calendar are mock (pricing engine missing on backend).

**Publish-ready spec:**
- [ ] Discount codes (real): validate form fields (type percent/fixed/free-night, min amount, max uses, validity dates) — client-side; CRUD persists.
- [ ] Special offers (real): CRUD persists.
- [ ] Rate plans / seasonal overrides / pricing calendar: build with the established mock-fallback pattern; clearly mark "demo" until pricing endpoints exist; show a "rate floor" guard (PR-011) client-side.
- [ ] Pricing calendar grid (rows = room types, cols = dates) with inline edit; bulk range selection.

**Acceptance:** Real entities persist; mock-only entities fall back cleanly with demo labeling; no fake persisted data.

---

### B-09 · Reports — `app/(host)/property/[id]/reports.tsx` → `PropertyReports.tsx`

**SRS:** AN-002–AN-008, AN-010 · **Priority: P2**

**Current state:** Mock report cards per gap analysis.

**Publish-ready spec:**
- [ ] Report list: Revenue (filters: date range, room type, rate plan, channel), Booking source, Occupancy forecast (30/60/90), Cancellation, Staff performance.
- [ ] Each report: preview (table/chart from loaded data) + export CSV via `expo-sharing`.
- [ ] Empty state "No data for this period" instead of fabricated series.
- [ ] Loading/error states.

**Acceptance:** Reports compute from real data or explicit empty state; CSV export shares correctly.

---

### B-10 · Settings Hub — `app/(host)/property/[id]/settings.tsx` → `PropertySettings.tsx`

**SRS:** AD-004, AD-006–AD-009 · **Priority: P1**

**Current state:** Settings hub listing sub-screens (11 settings pages under `settings/`).

**Publish-ready spec:**
- [ ] Hub grid lists all 11 sub-screens with icons + one-line descriptions.
- [ ] Each sub-screen is reachable and registered in the host layout.

**Acceptance:** All 11 settings sub-screens accessible from hub.

---

### B-11 · Settings sub-screens — `app/(host)/property/[id]/settings/{company,general,booking,room-rate,amenities,notifications,taxes,payments,integrations,logs,support}.tsx`

**SRS:** mapping below · **Priority: P1/P2 as noted**

**Current state:** New files created per the git diff (registered in layout). Expected to wrap small form components; not yet audited for data wiring.

**Publish-ready spec per screen:**

| Screen | SRS | Publish-ready requirements |
|---|---|---|
| `company` | AD-004, AD-009 | Name/description/contact/star rating; brand color + logo upload (reuse `ImagePickerOverlay`, `create-brand-visual`); persist via `hostApi.updateProperty`/brand endpoint. **P1** |
| `general` | AD-006, AD-007 | Currency/timezone/language (reuse `country-currency-picker`); check-in/out times + grace period; persist via `create-localization`/update. **P1** |
| `booking` | BK-011–BK-017 | Cancellation policy picker (`cancellation-policies.ts`), min/max stay, soft-lock duration display; persist. **P1** |
| `room-rate` | PR-001–PR-004 | Default nightly rate per room type; day-of-week rules; min/max stay per range; persist via pricing data layer with fallback. **P2** |
| `amenities` | AD-004 | Amenity multi-select (from `constants/amenities.ts`) + custom amenities; persist via `create-photos-and-amenities`. **P1** |
| `notifications` | §12.2 | Per-event toggles (new booking, checkout dirty, task assigned, low availability threshold) — persist via settings layer. **P2** |
| `taxes` | PR-012 | Tax configs (percent/flat, inclusive/exclusive); persist. **P2** |
| `payments` | BK-013, §12.1 | Gateway selection (Stripe/Razorpay/Khalti) + key entry masked; test-connection. **P1** |
| `integrations` | §12.3, OTA (future) | Calendar/ICS export toggle, OTA sync placeholder gated behind flag; "Coming soon" empty state for unavailable integrations. **P3** |
| `logs` | §5.2 audit | Read-only audit trail for this property (link to superadmin A-14 pattern); no mutations. **P3** |
| `support` | §12.2 | Contact support form (subject/body → email or ticket), FAQ accordion; toast on send. **P3** |

**Acceptance:** Each screen validates + persists its fields with loading/error states; masked secrets; no dead "Save" buttons (all persist or toast a fallback notice).

---

### B-12 · Edit Property — `app/(host)/property/edit/[id].tsx`

**SRS:** AD-003–AD-009 · **Priority: P1**

**Current state:** Heavily refactored per git diff (wizard-step backend calls, photos/amenities sync, activation toggle, normalizeTime). Now a real edit surface.

**Publish-ready spec:**
- [ ] Regression-test: property update payload (name/description/type/totals/location/times) persists; photos+amenities sync retry-on-publish logic (`photosSyncFailedRef`) works; activation toggle hits `toggle-property-activation`.
- [ ] Save button shows spinner; success/error toast; unsaved-changes warning on back.

**Acceptance:** Edits persist to backend; failed photo sync is retried on publish, never silently lost. (Mostly done — regression-test.)

---

### B-13 · Listing Wizard — `app/(host)/listing-wizard.tsx`

**SRS:** AD-001–AD-005, Journey 2 · **Priority: P1**

**Current state:** 5-step wizard with real backend calls for general info → location → photos/amenities; room setup; policy/offer step; publish. Recently hardened (required-field validation, `normalizeTime`, photos retry on publish).

**Publish-ready spec:**
- [ ] Regression-test full wizard on device: create property → rooms → photos → publish → appears on guest portal search.
- [ ] Step validation: all required fields per step (name/phone/email on property step already enforced); per-field inline errors.
- [ ] Progress indicator + draft persistence (`useDraftStore` exists); resume draft on re-entry.
- [ ] Publish failure → stays on wizard with actionable error, no data loss.

**Acceptance:** Wizard creates a live, searchable property end-to-end; drafts survive app restarts; publish never silently fails. (Mostly done — regression-test.)

---

# 6. Portal C — Operations Admin

Color: teal `#0D9488`. Route group: `app/(operations)/admin/`. Auth: operator session; staff-management actions require `manager` role (`RoleGuard`).

### C-01 · Staff — `app/(operations)/admin/staff.tsx`

**SRS:** ST-001–ST-003, ST-009, ST-010 · **Priority: P1**

**Current state:** Uses `useHost()` staff (real backend staff endpoints) + `StaffCreatedEmailModal` + temp-password generation. Solid.

**Publish-ready spec:**
- [ ] Regression-test create (name/email required) → backend create → email modal; toggle active persists.
- [ ] Add role filter chips + search by name/email for large teams.
- [ ] Loading/error states when staff fetch fails (currently renders empty silently).
- [ ] Show POS discount limit per role (ST-010) on the card.

**Acceptance:** Staff lifecycle persists; large-team search/filter; explicit error state. (Mostly done — regression-test.)

---

### C-02 · Shifts — `app/(operations)/admin/shifts.tsx`

**SRS:** ST-004, ST-006 (shift coverage calendar) · **Priority: P1**

**Current state:** Fully mock (`generateMockShifts()` — randomized data regenerated per mount; `checked_in`/`absent` random). Impressive UI (week overview, coverage-by-role, time grid, list view).

**Publish-ready spec:**
- [ ] Replace `generateMockShifts()` with data layer (assumed `GET/POST /properties/{id}/shifts`); hydrate from real staff (C-01) so shifts reference actual staff ids/names.
- [ ] Add shift creation/editing (staff, day, start/end, role) via modal; persist with fallback.
- [ ] Coverage warnings ("Understaffed") computed from real shifts; clock-in/out (ST-005) marks `checked_in` from a clock-in action, not random.
- [ ] Loading/empty/error states.

**Acceptance:** Shifts are real, editable, and persist; coverage warnings reflect actual data; no randomized statuses.

---

### C-03 · Tasks — `app/(operations)/admin/tasks.tsx`

**SRS:** ST-007, ST-008 · **Priority: P1**

**Current state:** Uses `staffTasks` from `host-context` (in-memory, property-scoped) — functional within session; assignee list from real staff.

**Publish-ready spec:**
- [ ] Persist tasks via data layer (assumed `GET/POST/PATCH /properties/{id}/tasks`) with fallback; hydrate context on mount.
- [ ] Due-date input: replace free-text `YYYY-MM-DD` with the existing `DatePickerCalendar` (validation of malformed dates currently weak).
- [ ] Notify on completion (ST-008) — toast + create notification via notification context.
- [ ] Loading/error/empty states; overdue highlighting already present.

**Acceptance:** Tasks persist across sessions; due dates picked via calendar; completion notification fires.

---

### C-04 · Approvals — `app/(operations)/admin/approvals.tsx`

**SRS:** BK-019, §2.2 permission matrix (Manager approves; limited refunds) · **Priority: P1**

**Current state:** Fully mock (`MOCK_APPROVALS`); approve/reject gated by hardcoded manager code `'1234'` — a **security smell** that must not ship.

**Publish-ready spec:**
- [ ] Replace hardcoded code with real authorization: role check via `RoleGuard`/auth profile (`role === 'manager'`) + optional confirmation dialog; never ship a hardcoded PIN.
- [ ] Load approval requests from data layer (assumed `GET /properties/{id}/approvals`); approve/reject persist (status + reviewedAt + reviewer).
- [ ] Keep type config (discount/refund/upgrade/comp) and filter tabs.
- [ ] Amount limits per SRS: manager refund limit; amounts above limit route to SuperAdmin escalation note.
- [ ] Loading/empty/error states.

**Acceptance:** Authorization is role-based (no hardcoded code); approvals persist with reviewer audit trail; refund limits respected.

---

### C-05 · Operations staff context bridge (implicit)

Operations admin screens (staff/tasks/shifts) read `activePropertyId` from `useHost`. Publish-ready requirement: the Operations layout must ensure `HostProvider` wraps these screens (verify `app/(operations)/_layout.tsx`) and that `activePropertyId` is set from the operator's `property_id` profile when available.

**Acceptance:** Operations admin operates on the operator's property without manual property selection.

---

# 7. Priority Roadmap

**Sprint 1 — Security & Data Integrity (P1):**
1. C-04 approvals: remove hardcoded manager code → role-based auth (security).
2. **A-21 exports: stop fabricating CSV data (publish blocker).**
3. A-13 health: remove fabricated system data.
4. A-01 dashboard: remove fabricated chart/plan numbers.
5. A-02/A-03 tenants: full backend mapping, remove mock overwrite.

**Sprint 2 — Persistence across all P1 screens:**
5. A-05 plans, A-06 subscriptions, A-10 feature flags, A-16 tickets, A-19 roles, A-20 settings (context → data layer persistence).
6. B-03 bookings list + manual booking, B-08 pricing (discounts/offers real; calendar mock w/ fallback).
7. C-02 shifts real data, C-03 tasks persistence + date picker.

**Sprint 3 — P2 feature depth:**
8. B-05 guests (derive from bookings), B-07 housekeeping flow, B-09 reports + CSV export.
9. A-07 billing, A-08/A-09 payments, A-11/A-12 analytics + reports, A-14 audit export.
10. B-11 settings sub-screens (payments/taxes first).

**Sprint 4 — P3 polish & launch:**
11. A-18 broadcast, A-15 impersonate (behind flag), B-11 integrations/logs/support.
12. Global: i18n pass, pull-to-refresh audit, 3-tap navigation audit, empty-state copy pass.
13. Pre-launch QA checklist (below).

# 8. Pre-Launch QA Checklist (applies app-wide)

- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `npx expo lint` — zero errors.
- [ ] Every admin screen: loading → data / empty / error+retry verified on device (USB/Expo Go).
- [ ] No hardcoded secrets anywhere (search `1234`, `rzp_test_`, `sk_`, `pk_`).
- [ ] No fabricated/demo numbers render in production screens (search `|| 4`, `|| 8` style fallbacks, `Math.floor(tenants.length`, `buildCsvFor`, `active_users,1245`).
- [ ] Destructive actions all confirm; mutations all toast.
- [ ] Portal auth guards: guest cannot reach any admin route; non-manager staff cannot reach approvals.
- [ ] Kill-switch test: airplane-mode the phone → all pages fall back to mocks without crashing; restore → data reloads.
- [ ] Fresh-login test: every portal login lands on its dashboard (host/operations/superadmin persist; guest starts signed out per current behavior).
- [ ] 3-tap audit: primary workflows reachable within 3 taps (SRS §5.5).

# 9. Open Questions (blocking decisions)

1. **Health endpoint:** does the backend expose `GET /health` or similar? (Determines A-13 depth.)
2. **Plans/subscriptions/roles APIs:** no backend endpoints exist for plans, subscriptions, roles, flags, tickets, announcements, audit logs. Frontend-first means building these screens against assumed contracts — confirm the contract shape before Sprint 2 so mappers match.
3. **Shifts/tasks APIs:** same as above — confirm `GET /properties/{id}/shifts` and `/tasks` contracts.
4. **Approval requests source:** confirm where discount/refund/upgrade/comp requests originate (booking folio actions?) so C-04 lists real data.
5. **Host property KPIs:** confirm booking analytics fields available from `GET /properties/{id}/bookings` (status history) to power B-02 KPIs without fabrication.
