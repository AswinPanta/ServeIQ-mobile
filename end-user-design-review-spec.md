# Spec: End-User Design Review & Improvement Plan (ServeIQ)

**Status:** Spec only — no code changes yet.
**Requested by:** Product owner
**Date:** 2026-09-22

---

## 1. Request Summary

Answer the question: *"Will end users actually like the design implemented in this app?"* — judged from the perspective of **guests** and **staff**, across **all four portals** — and produce a **critique plus a prioritized, code-implementable improvement plan**.

This is a general quality check-up before shipping; no specific tester complaint triggered it.

### Deliverable (two layers)

1. **Executive verdict** — per-portal verdict (like / mixed / won't-like), top ~5 issues per portal with severity, readable in ~10 minutes.
2. **Detailed appendix** — screen-by-screen walkthrough of every major in-scope route with concrete issues, severity, and proposed fixes.

The final section of the detailed layer is a **prioritized improvement plan** grouped into per-portal batches (see §7).

### Evidence standard (both)

- **Heuristic walkthrough** of the actual code (screens, tokens, components) against UX heuristics: consistency, contrast, touch targets, cognitive load, error prevention, feedback.
- **Competitive benchmarking** against guest-side references (Airbnb, Booking.com) and staff-side references (Opera Cloud, Mews) for structural/ergonomic expectations.

---

## 2. Scope

### 2.1 In scope — Guest portal (whole journey)

Evaluate the **entire guest journey**, not just first impressions:

- Auth: login/register, profile edit, security
- Home (`(tabs)/index`), Search, Favorites (tab + heart tab), Guest search results
- Property browsing: destinations, promotions, rate breakdown, room select, restaurant menu
- Booking: `booking-flow` (rooms → details → payment), booking summary, booking confirmation, checkout/payments
- In-stay: self check-in, dining reservations, services, notifications
- Post-stay: post-stay review, reviews list, coupons, bookings list & detail
- Profile/notifications/settings areas reachable by guests

### 2.2 In scope — Operations/staff portal

- Operations dashboard (`(operations)/index`)
- **Front desk**: index, room status, check-in, check-out, tasks, new booking, payments, folio, guest CRM, notifications
- **Housekeeping**: index, `[roomId]` detail (dedicated HK role experience + auto-redirect flow)
- Staff-facing shell: `OperationsHeader`, `BottomTabBar`, `more`, `notifications`, `guests`, `room-plan`, `reports`, `change-password` (forced password-change flow)

### 2.3 In scope — Host & SuperAdmin portals

- Host portal (property owners): landing, property CRUD, rooms, staff, pricing, reports — evaluated as a portal, at dashboard/summary depth.
- SuperAdmin: tenants, subscriptions/billing/plans, feature flags, platform analytics/reports/exports, roles, system health/audit/impersonate, support — evaluated as a portal, at dashboard/summary depth.

### 2.4 Explicitly OUT of scope

- **KDS screens** (`(operations)/kds/*`) and **POS screens** (`(operations)/pos/*`) — user excluded them by name.
- i18n robustness work (RTL, string expansion) is **in scope as an evaluation axis** (17 languages ship), but remediation of translation files is a separate effort.
- Backend/API behavior, business logic correctness.
- Rebranding or marketing-copy rewriting.

### 2.5 Evaluation axes (all four requested by user)

| Axis | What to assess |
|---|---|
| **Token / design-system cleanup** | Three overlapping token sources exist (see §3); assess fragmentation and propose consolidation |
| **UX / layout changes** | Screen-level layout, navigation, hierarchy, information density |
| **Accessibility pass** | Contrast, touch targets, screen-reader labels, font scaling — bar is a **practical minimum for any size and platform device** (see §6) |
| **Delight & polish** | Transitions, skeletons vs. spinners, haptics, empty states, micro-copy |

Additional axes:

- **i18n-awareness** — hardcoded English strings, layout risk for long/RTL strings, currency display consistency (`use-app-currency`, `formatPrice`).
- **Dark mode** — the codebase declares a class-based dark-mode setup (`tailwind.config.js`: `darkMode: "class"`, custom `light`/`dark` variants keyed to `[data-theme]`). Evaluate whether the token system can actually support a dark theme, and enumerate what breaks. Both themes are evaluated, but **light mode is the shipping baseline**.
- **Split-brain brand identity** — user explicitly wants this **flagged as an issue**: guest accent is red `#E74C3C` (`PORTAL_ACCENTS.guest`) while the SRS/Figma system is navy `#1A3C5E` + teal `#2E86AB`, and guest screens additionally pull coral/amber/slate/blue tokens. Evaluate the fragmentation across portals (guest=red, host/ops=teal, superadmin=purple) and propose unification **only if severely needed** (see §5 constraint).

### 2.6 Device / platform baseline

- **Modern mid-size phones** (6.1–6.7", ~390–430dp) as the primary lens.
- Practical for **any screen size and platform device**: no fix may assume a specific size or platform; check small-phone breakage and `react-native-web` behavior as a sanity constraint (web is a supported target per `package.json` deps).

### 2.7 On-device verification (USB debugging available)

The reviewer is connected via USB debugging to a physical test device and will use it for verification:

| Property | Value |
|---|---|
| Device | Xiaomi Redmi Note 10 5G (`selene`, model 21061119BI) |
| App | `com.serveiq.app/.MainActivity` (foreground, Android 13) |
| Screen | 1080×2400 px, density 418 dpi override (440 physical) ≈ **411×911 dp** |

How this will be used during the review:
- **Screenshots** of each in-scope screen via `adb exec-out screencap -p`, saved as `tmp/screen{id}.png` (incrementing id per capture: `tmp/screen1.png`, `tmp/screen2.png`, …) as evidence for critique issues.
- **Touch-target measurement** — convert px→dp at 418dpi (dp = px × 160 / 418) to verify the ~44dp minimum from §6.
- **Font scaling / display size** checks via `adb shell settings put system font_scale` (revert after).
- **Dark mode** capture via system dark-theme toggle to evaluate the dark-mode axis (§2.5).
- Manual scripted navigation through flows (tap/swipe via `adb shell input`) while the owner also tests hands-on.

Screenshots are supporting evidence only — the authoritative judgment still comes from reading the code; a screenshot may not be captured for every route.

### 2.8 Usage contexts to assume

- **Guest**: typical consumer conditions — distracted, comparing options, price-sensitive, on mobile data.
- **Staff (front desk, housekeeping)**: worst-case conditions assumed — dim corridors, gloves, one-handed use, spotty wifi, interruptions. Housekeeping runs a dedicated single-purpose screen; front desk uses a dense dashboard with a clock-in/out, live room states, and activity feed.

---

## 3. Codebase Context (gathered before interview)

### 3.1 Tech

- Expo SDK 57 / React Native 0.86, Expo Router, NativeWind 4 (Tailwind), Reanimated 4, Context + Zustand.
- i18next with 17 languages; expo-localization.
- Backend FastAPI; Stripe/Razorpay/Khalti + eSewa payment flows.

### 3.2 Design token fragmentation (core finding to expand in spec output)

Three coexisting token sources:

1. **`constants/portal-theme.ts`** — SRS v1.0.0 spec tokens: `PORTAL_ACCENTS`, `STATUS_COLORS`, `TYPOGRAPHY` (Playfair Display headings + Inter body), `SPACING` (4px grid), `RADIUS`, `SHADOWS`, `FIGMA_COLORS`, `GRAY`, `SRS` palette, plus an `ACCENT` constant currently pinned to `PORTAL_ACCENTS.operations` and a demo `MANAGER_CODE`.
2. **`lib/constants/figma-tokens.ts`** — re-exports portal-theme, adds Figma-extracted `BRAND` (different navy `#002645` / teal `#006687` than SRS `#1A3C5E`/`#2E86AB`), `TEXT`, `BG`, `BORDER`, `STATUS` (a *second* status palette), `SLATE`, `CLOUD`, `WARM`, `KDS`, `PAYMENT`, per-screen color ramps (RED/ORANGE/AMBER/GREEN/EMERALD/BLUE/INDIGO/PURPLE/PINK/CORAL/NEUTRAL).
3. **`constants/theme.ts` → `lib/_core/theme.ts`** (`Colors`, `Fonts`, `SchemeColors`, `ThemeColorPalette`) — the older theme plumbing feeding `tailwind.config.js` via `constants/theme.config` CSS-variable swatches with light/dark variants.

Screens import from `figma-tokens` **and** `portal-theme` **and** hardcode hex values; two conflicting navy/teal pairs and two conflicting status palettes exist.

### 3.3 Notable UI constructs

- **Guest tabs**: default tab bar hidden; custom `LiquidDropTabBar` (Reanimated + SVG liquid-blob morph, spring physics, 66px bar). Active tint teal, inactive slate-400. Tab set: Home / Search / Favorites / Profile.
- **Guest home**: brand header w/ logo, sign-in + "become host" + notifications, `HeroSection` search, property-type browser, location-permission banner gating "stays nearby", city carousels (Kathmandu/Pokhara), trust badges, newsletter CTA, footer; pull-to-refresh; scroll restoration; Unsplash placeholder image; mixed i18n `t()` calls and hardcoded English.
- **Operations dashboard**: header + `BottomTabBar`, clock-in/out with elapsed timer, room-status chips, summary stats, occupancy snapshot, merged booking/HK activity feed with silent fallback, `STATUS_STYLE` map.
- **Booking flow**: 3-step (rooms → details → payment) with progress header, login gate, promo code, advance-amount option, multiple checkout modals (hosted gateway, eSewa form/mock, SDK checkout).
- **Housekeeping**: dedicated `_layout`, auto-redirect by role (`housekeeping` role forced to `/(operations)/housekeeping`), forced password-change gate for temp-password staff.
- Typography: Playfair Display + Inter (SRS), plus RussoOne/InknutAntiqua/Itim/AbhayaLibre/Calistoga/Sora registered as Figma fonts — many families for one product.

---

## 4. Output Format

Write one review document with:

**Layer 1 — Executive verdict (~10 min read)**
- Per portal (Guest, Host, Operations, SuperAdmin): verdict — ✅ will like / ⚠️ mixed / ❌ won't like — with 2–3 sentence rationale.
- Top ~5 issues per portal, each: severity (Critical / Major / Minor), one-line description, which persona it hurts (guest / front desk / housekeeping / host / superadmin).
- Overall answer to "will end users like it?" stated plainly, per persona.

**Layer 2 — Detailed appendix (screen-by-screen)**
- Every in-scope route from §2.1–2.3: issues found, severity, persona affected, concrete fix referencing actual files (`app/...`, `components/...`, token files).
- Each fix tagged to one or more axes from §2.5.

**Layer 3 — Improvement plan**
- Organized into **per-portal batches** (Guest batch, Operations batch, Host batch, SuperAdmin batch, Cross-portal/foundations batch) so each batch can ship as one coherent change-set.
- Within a batch, order items **by severity × user impact** (severity-ordered per user's answer), but annotate each with a **cost estimate (S/M/L)** so cheap wins are visible.
- Foundations batch (token consolidation + brand split) comes first if severly needed, since later batches depend on it.

---

## 5. Constraints

- **Visual change is allowed only if severely needed.** Default: keep the current Figma-derived look and fix problems within it. A visual change (colors, typography, brand accent) must be justified by a demonstrated usability problem, not taste.
- **Code-only fixes.** No Figma round-trips; every proposed fix must be implementable directly in RN styles/components/tokens. The spec may note "needs design input" but must still propose a code-level direction.
- **No KDS/POS** changes or evaluations.
- No backend changes; fixes must tolerate existing API behavior (e.g., silent-fallback patterns).
- Must remain practical across **any screen size and platform** (iOS, Android, web).

---

## 6. Accessibility Bar

**Practical minimum for any size and platform device** (not full WCAG certification):

- Fix the worst contrast offenders (target ≥4.5:1 for body text where feasible with current palette).
- Touch targets usable one-handed (≈44dp minimum for primary actions).
- Readable text without zoom; respect/resilience to OS font scaling.
- Labeled controls / accessibility roles for screen readers on critical flows (booking, check-in/out, housekeeping task completion).
- Layouts resilient to longer translated strings.

Exact numeric targets **should be included per fix** — the user chose measurable success criteria (contrast ratios, touch-target dp, task-step counts, lint-rule ideas) rather than purely qualitative checks.

---

## 7. Success Criteria for This Spec's Follow-up Work

Each improvement in Layer 3 should carry a verifiable check, e.g.:

- Contrast: measured ratio ≥ target after change.
- Touch targets: min tappable area in dp stated.
- Task steps: e.g. "complete booking in ≤ N taps from property card".
- Consistency: single token import per portal; zero hardcoded hex in touched files; lint/search check suggested (e.g., `rg "#[0-9A-Fa-f]{6}" app/` count reduced).
- Dark mode: enumerated screens pass in dark theme after token fix.
- i18n: no new hardcoded user-facing English strings in touched files.

---

## 8. Open Questions Resolved During Interview

| Question | Answer |
|---|---|
| Deliverable | Critique **+** improvement plan |
| Portals | All four |
| Evidence | Heuristics **+** competitive benchmarking |
| Trigger | General pre-ship check-up |
| Staff context | Harsh real conditions (worst case assumed) |
| Depth | Executive summary **+** detailed appendix |
| Fix scope | All four: tokens, UX/layout, accessibility, delight |
| Visual change | Only if severely needed |
| i18n | Evaluate it (17 languages, Nepal payments) |
| Devices | Modern mid-size baseline, practical for any size/platform |
| Dark mode | Yes, evaluate (light is shipping baseline) |
| Prioritization | Per-portal batches; severity within batches |
| Accessibility bar | Practical minimum, any size/platform, with measurable checks |
| Guest flows | Whole journey |
| Brand split (red vs navy/teal) | **Flag as an issue**, propose unification if severely needed |
| Staff roles | Front desk + housekeeping (+ ops dashboard) |
| Success criteria | Yes, with concrete metrics per fix |
| Design capability | Code-only fixes |

## 9. Out of Scope / Non-Goals

- Implementing any fix (spec only at this stage).
- KDS and POS screen evaluation.
- Translation-file remediation, copywriting, rebranding campaigns.
- Backend, performance profiling (beyond perceived-performance polish like skeletons), or test coverage work.
