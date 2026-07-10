/**
 * SRS v1.0.0 — Section 9.1 Design System Colors
 *
 * Primary:  #1A3C5E (Navy)   — headings, navigation, primary actions
 * Accent:   #2E86AB (Teal)   — CTAs, links, highlights, status badges
 * Success:  #1E8449 (Green)  — available, confirmed, paid
 * Warning:  #D35400 (Orange) — pending, dirty, caution
 * Danger:   #C0392B (Red)    — maintenance, cancelled, errors
 */

/** Semantic color tokens per portal */
export const PORTAL_ACCENTS = {
  guest: '#E74C3C',
  host: '#2980B9',
  operations: '#2E86AB',
  superadmin: '#8E44AD',
} as const;

/** SRS-compliant status color palette */
export const STATUS_COLORS = {
  // Room statuses
  available: '#1E8449',
  occupied: '#2980B9',
  dirty: '#D35400',
  cleaning: '#16A085',
  inspected: '#8E44AD',
  maintenance: '#C0392B',
  blocked: '#7F8C8D',
  // Booking statuses
  pending: '#D35400',
  confirmed: '#2980B9',
  checked_in: '#1E8449',
  checked_out: '#7F8C8D',
  cancelled: '#C0392B',
  arriving: '#2980B9',
  in_house: '#1E8449',
  // HK statuses
  hk_dirty: '#D35400',
  hk_in_progress: '#2980B9',
  hk_cleaned: '#1E8449',
  hk_inspected: '#8E44AD',
  // Priority
  high: '#C0392B',
  medium: '#D35400',
  low: '#7F8C8D',
  // Table statuses
  table_available: '#1E8449',
  table_occupied: '#C0392B',
  table_reserved: '#D35400',
  table_cleaning: '#16A085',
  // KDS
  kds_pending: '#D35400',
  kds_in_progress: '#2980B9',
  kds_ready: '#1E8449',
  // Payment methods
  cash: '#1E8449',
  card: '#2980B9',
  upi: '#8E44AD',
  wallet: '#D35400',
  // Loyalty tiers
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
} as const;

/** Typography scale per SRS */
export const TYPOGRAPHY = {
  h1: { fontSize: 32, lineHeight: 38.4, fontFamily: 'PlayfairDisplay' },
  h2: { fontSize: 24, lineHeight: 28.8, fontFamily: 'PlayfairDisplay' },
  h3: { fontSize: 20, lineHeight: 24, fontFamily: 'Inter' },
  subtitle: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter' },
  body: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter' },
  small: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter' },
  caption: { fontSize: 10, lineHeight: 14, fontFamily: 'Inter' },
} as const;

/** Gray palette tokens for consistency */
export const GRAY = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

/** Spacing scale per SRS (4px base grid) */
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/** Border radius tokens per SRS */
export const RADIUS = {
  badge: 4,
  button: 6,
  card: 8,
  modal: 12,
  full: 9999,
} as const;

/** Shadow tokens per SRS */
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
  },
  dropdown: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const ACCENT = PORTAL_ACCENTS.operations;

export function getAccentColor(alpha?: number): string {
  if (alpha === undefined) return ACCENT;
  const hex = ACCENT.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** SRS semantic alias for quick reference */
export const SRS = {
  navy: '#1A3C5E',
  teal: '#2E86AB',
  green: '#1E8449',
  orange: '#D35400',
  red: '#C0392B',
} as const;

