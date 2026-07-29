/**
 * Figma Design Tokens — Unified Source of Truth
 *
 * All colors, typography, spacing, and UI tokens extracted from the three Figma SVG designs:
 * - figmalogin.svg        → login.tsx, auth screens
 * - figmahousekeepingsvg.svg → housekeeping/index.tsx, housekeeping/[roomId].tsx
 * - figmabooking.svg      → booking-flow.tsx, search-results.tsx, guest-search-results.tsx
 *
 * Usage: Import from this file instead of hardcoding colors in screens.
 * This ensures pixel-perfect Figma alignment across all screens.
 *
 * NOTE: SPACING, RADIUS, SHADOWS, GRAY, TYPOGRAPHY, FONTS, PORTAL_ACCENTS
 * are re-exported from portal-theme.ts to maintain a single source of truth.
 * Only Figma-specific additions live here.
 */

// ═══════════════════════════════════════════════════════════════════
// RE-EXPORTS from portal-theme.ts (single source of truth)
// ═══════════════════════════════════════════════════════════════════

export {
  SPACING,
  RADIUS,
  SHADOWS,
  GRAY,
  TYPOGRAPHY,
  FONTS,
  PORTAL_ACCENTS,
} from '@/constants/portal-theme';

// ═══════════════════════════════════════════════════════════════════
// BRAND COLORS (Extracted from all three SVGs)
// ═══════════════════════════════════════════════════════════════════

export const BRAND = {
  /** Primary navy — headings, navigation, primary buttons */
  navy: '#002645',
  /** Lighter navy — secondary headings, text on light bg */
  navyLight: '#1A3C5E',
  /** Primary teal — CTAs, links, highlights, status badges */
  teal: '#006687',
  /** Darker teal — hover states, active elements */
  tealDark: '#005D7C',
  /** Very dark teal — deep accents */
  tealDeep: '#004D67',
} as const;

// ═══════════════════════════════════════════════════════════════════
// TEXT COLORS (Extracted from SVGs)
// ═══════════════════════════════════════════════════════════════════

export const TEXT = {
  /** Primary heading text — dark, high contrast */
  heading: '#1A1C1E',
  /** Body text — medium contrast */
  primary: '#43474E',
  /** Secondary text — lighter, for labels/meta */
  secondary: '#6B7280',
  /** Muted text — captions, placeholders */
  muted: '#73777F',
  /** Light muted — for light backgrounds */
  mutedLight: '#9CA3AF',
  /** Inverse text — on dark/colored backgrounds */
  inverse: '#FFFBFB',
  /** Label text — used in form labels */
  label: '#A7A4A4',
  /** Black text */
  black: '#000000',
} as const;

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND COLORS (Extracted from SVGs)
// ═══════════════════════════════════════════════════════════════════

export const BG = {
  /** Page background — light lavender tint */
  page: '#FAF9FC',
  /** Card background — slightly darker than page */
  card: '#F4F3F6',
  /** Sub-card background — even darker */
  subCard: '#EEEDF1',
  /** Input/field background */
  input: '#FFFFFF',
  /** White background */
  white: '#FFFFFF',
  /** Banner area background (login) */
  banner: '#BEC5CD',
  /** Status bar background */
  /** Light teal background for subtle highlights */
  tealPale: "#E8F4FD",
  /** Light teal background for subtle highlights */
  tealLight: '#CFFAFE',
} as const;

// ═══════════════════════════════════════════════════════════════════
// BORDER & DIVIDER COLORS
// ═══════════════════════════════════════════════════════════════════

export const BORDER = {
  /** Primary border — cards, inputs */
  primary: '#C3C6CF',
  /** Light border — subtle dividers */
  light: 'rgba(195, 198, 207, 0.3)',
  /** Input border default */
  input: '#D9D9D9',
  /** Input border focus/error */
  inputError: '#C0392B',
  /** Social button border (login) */
  social: '#D9D9D9',
  /** Inactive element border */
  inactive: '#E8E8EB',
  /** Checkbox border */
  checkbox: '#D1D5DB',
} as const;

// ═══════════════════════════════════════════════════════════════════
// STATUS COLORS (Extracted from Housekeeping SVG)
// ═══════════════════════════════════════════════════════════════════

export const STATUS = {
  // Foreground text/icon colors
  dirty: '#BA1A1A',
  inProgress: '#006687',
  cleaned: '#166534',
  inspected: '#002645',

  // Badge background tints
  badgeRed: '#FFDAD6',
  badgeBlue: '#87D6FE',
  badgeGreen: '#DCFCE7',
  badgeOrange: '#FFDDB0',

  // Active green (from Figma CSS)
  activeGreen: '#10B981',
  activeGreenDark: '#16A34A',
  activeGreenDeep: '#15803D',

  // Danger/Error
  danger: '#BA1A1A',
  dangerDark: '#93000A',
  dangerBg: '#FFDAD6',

  // Booking statuses
  bookingConfirmed: '#166534',
  bookingPending: '#F8BD00',
  bookingCancelled: '#BA1A1A',
} as const;

// ═══════════════════════════════════════════════════════════════════
// SOCIAL / AUTH COLORS (Extracted from Login SVG)
// ═══════════════════════════════════════════════════════════════════

export const SOCIAL = {
  google: '#4285F4',
  facebook: '#1877F2',
  apple: '#000000',
  phone: '#000000',
} as const;

// ═══════════════════════════════════════════════════════════════════
// UTILITY / UI COLORS
// ═══════════════════════════════════════════════════════════════════

export const UI = {
  /** Remember me text color */
  rememberText: '#AB8D8D',
  /** Placeholder text */
  placeholder: '#9CA3AF',
  /** Checkbox active background */
  checkboxActive: '#2E86AB',
  /** Error text */
  error: '#C0392B',
  /** Error background */
  errorBg: '#FEF2F2',
  /** Success text */
  success: '#166534',
  /** Warning text */
  warning: '#D35400',
  /** Warning text dark — for amber status indicators */
  warningText: '#92400E',
  /** Scarcity badge background */
  scarcityBg: '#D35400',
  /** Overlay/mask */
  overlay: 'rgba(0, 0, 0, 0.5)',
  /** Disabled state */
  disabled: '#9CA3AF',
} as const;

// ═══════════════════════════════════════════════════════════════════
// SLATE PALETTE (From Booking SVG — used extensively)
// ═══════════════════════════════════════════════════════════════════

export const SLATE = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#121C28',
} as const;

// ═══════════════════════════════════════════════════════════════════
// BLUE TINT COLORS (From Booking SVG — backgrounds)
// ═══════════════════════════════════════════════════════════════════

/** Booking screen only — from figmabooking.svg */
/** Booking screen only — from figmabooking.svg */
export const BLUE_TINT = {
  light: '#DBEAFE',
  medium: '#D9E3F4',
  pale: '#E8F4FD',
} as const;
