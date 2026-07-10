/**
 * SRS v1.0.0 — Section 9.1 Design System
 * Primary:  #1A3C5E (Navy)
 * Accent:   #2E86AB (Teal)
 * Success:  #1E8449 (Green)
 * Warning:  #D35400 (Orange)
 * Danger:   #C0392B (Red)
 * Fonts:    Inter (UI), Playfair Display (headings)
 */

/** @type {const} */
const themeColors = {
  primary: { light: '#1A3C5E', dark: '#1A3C5E' },
  accent: { light: '#2E86AB', dark: '#2E86AB' },
  background: { light: '#F8F9FA', dark: '#151718' },
  surface: { light: '#FFFFFF', dark: '#1e2022' },
  foreground: { light: '#1A1A2E', dark: '#ECEDEE' },
  muted: { light: '#6B7280', dark: '#9BA1A6' },
  border: { light: '#E5E7EB', dark: '#334155' },
  success: { light: '#1E8449', dark: '#2ECC71' },
  warning: { light: '#D35400', dark: '#E67E22' },
  error: { light: '#C0392B', dark: '#E74C3C' },
};

module.exports = { themeColors };
