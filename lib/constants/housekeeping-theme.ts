/**
 * Housekeeping Figma Design Tokens
 * Extracted from figmahousekeepingsvg.svg (node-id=636-185)
 *
 * These tokens match the Figma design exactly and should be used
 * across all housekeeping screens for visual consistency.
 */

export const HK_COLORS = {
  // Page & card backgrounds
  pageBg: '#FAF9FC',
  cardBg: '#F4F3F6',
  subCardBg: '#EEEDF1',

  // Borders & dividers
  border: '#C3C6CF',
  borderLight: 'rgba(195, 198, 207, 0.3)',

  // Text colors
  textPrimary: '#43474E',
  textHeading: '#1A1C1E',
  textMuted: '#73777F',

  // Brand colors
  navy: '#002645',
  navyLight: '#1A3C5E',
  teal: '#006687',
  tealDark: '#005D7C',

  // Status colors (foreground)
  dirty: '#BA1A1A',
  inProgress: '#006687',
  cleaned: '#166534',
  inspected: '#002645',

  // Status badge backgrounds (tinted)
  badgeRed: '#FFDAD6',
  badgeBlue: '#87D6FE',
  badgeGreen: '#DCFCE7',
  badgeOrange: '#FFDDB0',

  // Active green (from Figma CSS)
  activeGreen: '#10B981',

  // UI element colors
  inactive: '#E8E8EB',
  white: '#FFF',

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
