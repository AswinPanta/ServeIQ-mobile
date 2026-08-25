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
  STATUS_COLORS,
  SRS,
  FIGMA_COLORS,
} from '@/constants/portal-theme';

// ═══════════════════════════════════════════════════════════════════
// BRAND COLORS (Extracted from all three SVGs)
// ═══════════════════════════════════════════════════════════════════

export const BRAND = {
  /** Primary navy — headings, navigation, primary buttons */
  navy: '#002645',
  /** Lighter navy — secondary headings, text on light bg */
  navyLight: '#1A3C5E',
  /** Darker navy — footer, deep surfaces */
  navyDark: '#16233A',
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
  /** Ink — near-black brown used on warm surfaces */
  ink: '#1C1B19',
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
  googleRed: '#EA4335',
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

// ═══════════════════════════════════════════════════════════════════
// COLOR RAMPS (Tailwind-aligned — used across app screens)
// ═══════════════════════════════════════════════════════════════════

export const RED = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
} as const;

export const ORANGE = {
  400: '#F39C12',
  500: '#F97316',
} as const;

export const AMBER = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
} as const;

export const YELLOW = {
  600: '#CA8A04',
} as const;

export const GREEN = {
  50: '#F0FDF4',
  100: '#DCFCE7',
  200: '#BBF7D0',
  300: '#86EFAC',
  500: '#22C55E',
  pale: '#F0FFF4',
  tint: '#EBF6EF',
  mint: '#C6F6D5',
  bright: '#27AE60',
} as const;

export const EMERALD = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#BBF7D0',
  300: '#86EFAC',
  500: '#10B981',
  600: '#059669',
  800: '#065F46',
} as const;

export const TEAL = {
  600: '#0D9488',
} as const;

export const CYAN = {
  50: '#F0F9FF',
  100: '#CFFAFE',
  500: '#06B6D4',
  600: '#0891B2',
} as const;

export const BLUE = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  300: '#93C5FD',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  tint: '#EBF5FB',
  ios: '#007AFF',
} as const;

export const INDIGO = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  500: '#6366F1',
} as const;

export const PURPLE = {
  50: '#F5F3FF',
  100: '#F3E8FF',
  500: '#8B5CF6',
  600: '#9333EA',
  700: '#7C3AED',
} as const;

export const PINK = {
  50: '#FDF2F8',
  500: '#EC4899',
  600: '#DB2777',
} as const;

export const CORAL = {
  300: '#FF6B6B',
  400: '#E94560',
  500: '#E63946',
  600: '#D4111E',
} as const;

export const NEUTRAL = {
  50: '#FAFAFA',
  100: '#F8F9FB',
  200: '#F8F8F8',
  300: '#F5F5F5',
  400: '#F0F2F5',
  500: '#E8E8E8',
  snow: '#FFFAFA',
} as const;

export const CLOUD = {
  frost: '#E8EEF4',
  mist: '#E6EDF3',
  haze: '#D1D9E6',
  vapor: '#C9D6E0',
  cloud: '#C8D0DB',
  fog: '#C0C8D4',
  silver: '#B0B8C4',
  steel: '#8896A6',
  slateBlue: '#8895A7',
} as const;

export const WARM = {
  ivory: '#FAF6EE',
  cream: '#EFE6D2',
  sand: '#C9C5BA',
  taupe: '#C9C2B4',
  peach: '#FFB088',
  apricot: '#FFD58A',
  gold: '#E8B84B',
  bronze: '#B8860B',
  bronzeLight: '#B8862E',
  terracotta: '#C45B3E',
} as const;

export const KDS = {
  bg: '#0D1117',
  card: '#161B22',
  border: '#30363D',
  muted: '#8B949E',
  accent: '#1F6FEB',
  success: '#238636',
} as const;

export const FLAT = {
  blue: '#2980B9',
  green: '#1E8449',
  gold: '#FFD700',
} as const;

export const PAYMENT = {
  stripe: '#635BFF',
  stripeDark: '#0C2451',
  razorpay: '#5C2D91',
  bookingBlue: '#0071C2',
  success: '#00875A',
  successLight: '#F0F7FF',
} as const;
