/**
 * SuperAdmin — Hardcoded Credentials
 *
 * Change these values to set the SuperAdmin login credentials.
 * The SuperAdmin portal does NOT use the backend auth API — only these
 * hardcoded credentials work for security isolation.
 *
 * Security note: In a production build these are bundled in the app binary.
 * For higher security, replace with a server-side auth check or env vars.
 */

export const SUPERADMIN_CREDENTIALS = {
  email: 'admin@stayeasy.com',
  password: 'Admin@123',
} as const;

/** Human-readable label shown on the login screen */
export const SUPERADMIN_LABEL = 'Platform Administrator';
