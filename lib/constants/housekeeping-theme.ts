import { BG, BORDER, TEXT, BRAND, STATUS } from '@/lib/constants/figma-tokens';
/**
 * Housekeeping Figma Design Tokens
 * Extracted from figmahousekeepingsvg.svg (node-id=636-185)
 *
 * These tokens match the Figma design exactly and should be used
 * across all housekeeping screens for visual consistency.
 */

export const HK_COLORS = {
  // Page & card backgrounds
  pageBg: BG.page,
  cardBg: BG.card,
  subCardBg: BG.subCard,

  // Borders & dividers
  border: BORDER.primary,
  borderLight: 'rgba(195, 198, 207, 0.3)',

  // Text colors
  textPrimary: TEXT.primary,
  textHeading: TEXT.heading,
  textMuted: TEXT.muted,

  // Brand colors
  navy: BRAND.navy,
  navyLight: BRAND.navyLight,
  teal: BRAND.teal,
  tealDark: BRAND.tealDark,

  // Status colors (foreground)
  dirty: STATUS.danger,
  inProgress: BRAND.teal,
  cleaned: STATUS.bookingConfirmed,
  inspected: BRAND.navy,

  // Status badge backgrounds (tinted)
  badgeRed: STATUS.dangerBg,
  badgeBlue: STATUS.badgeBlue,
  badgeGreen: STATUS.badgeGreen,
  badgeOrange: STATUS.badgeOrange,

  // Active green (from Figma CSS)
  activeGreen: STATUS.activeGreen,

  // UI element colors
  inactive: BORDER.inactive,
  white: BG.white,

  // Shadows (from Figma CSS)
  shadowSm: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
  shadowLg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const;

/** Map status name to its foreground text color */
export const HK_STATUS_TEXT: Record<string, string> = {
  Dirty: HK_COLORS.dirty,
  'In Progress': HK_COLORS.inProgress,
  Cleaned: HK_COLORS.cleaned,
  Inspected: HK_COLORS.inspected,
};

/** Map status name to its tinted badge background color */
export const HK_STATUS_BG: Record<string, string> = {
  Dirty: HK_COLORS.badgeRed,
  'In Progress': HK_COLORS.badgeBlue,
  Cleaned: HK_COLORS.badgeGreen,
  Inspected: HK_COLORS.badgeBlue,
};

/** Map priority to dot color */
export const HK_PRIORITY_COLORS: Record<string, string> = {
  High: HK_COLORS.dirty,
  Normal: HK_COLORS.badgeOrange,
  Low: HK_COLORS.textMuted,
};
