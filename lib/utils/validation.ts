// ─── Frontend Validation Helpers ────────────────────────────────────
// Mirror backend Pydantic schema constraints so invalid payloads never
// reach the API (fast UX feedback + avoids 422 round-trips).

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Email ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email is required.';
  if (v.length > 254) return 'Email must be 254 characters or fewer.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return null;
}

// ─── Phone ─────────────────────────────────────────────────────────
// Accepts: +977-9841234567, 9841234567, +1 555-123-4567, etc.
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return null; // phone is optional on most forms
  if (!PHONE_RE.test(v)) return 'Enter a valid phone number.';
  return null;
}

/** Strict phone validation for backend property creation.
 *  Backend GeneralPropertyInfo schema: phone_number is exactly 10 digits,
 *  no spaces, no dashes, no plus sign. */
const STRICT_PHONE_RE = /^\d{10}$/;

export function validatePropertyPhone(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Phone number is required.';
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits.';
  if (!STRICT_PHONE_RE.test(digits)) return 'Phone number must contain only digits.';
  return null;
}

// ─── Time (HH:MM format) ──────────────────────────────────────────
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function validateTime(value: string, label: string): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!TIME_RE.test(v)) return `${label} must be in HH:MM format (e.g. 15:00).`;
  return null;
}

// ─── Name (tenant / brand / general) ───────────────────────────────
export function validateName(value: string, opts?: { min?: number; max?: number; label?: string }): string | null {
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 255;
  const label = opts?.label ?? 'Name';
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < min) return `${label} must be at least ${min} character${min > 1 ? 's' : ''}.`;
  if (v.length > max) return `${label} must be ${max} characters or fewer.`;
  // Reject control characters and excessive special chars
  if (/[\x00-\x08\x0e-\x1f]/.test(v)) return `${label} contains invalid characters.`;
  return null;
}

// ─── Required field ────────────────────────────────────────────────
export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

// ─── Number (salary, etc.) ─────────────────────────────────────────
export function validateNumber(value: string, opts?: { min?: number; max?: number; label?: string; required?: boolean }): string | null {
  const min = opts?.min ?? 0;
  const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
  const label = opts?.label ?? 'Value';
  const v = value.trim();
  if (!v && opts?.required !== false) return `${label} is required.`;
  if (!v && opts?.required === false) return null;
  const n = Number(v);
  if (isNaN(n)) return `${label} must be a number.`;
  if (n < min) return `${label} must be at least ${min}.`;
  if (n > max) return `${label} must be ${max} or fewer.`;
  return null;
}

// ─── Date ──────────────────────────────────────────────────────────
export function validateDate(value: string, opts?: { label?: string; required?: boolean; notPast?: boolean }): string | null {
  const label = opts?.label ?? 'Date';
  const v = value.trim();
  if (!v && opts?.required !== false) return `${label} is required.`;
  if (!v && opts?.required === false) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return `${label} is not a valid date.`;
  if (opts?.notPast && d < new Date(new Date().toDateString())) return `${label} cannot be in the past.`;
  return null;
}

// ─── Backend error parser ──────────────────────────────────────────
// Extracts a human-readable message from common backend error shapes:
// { detail: "..." }, { error: "..." }, { message: "..."}, { detail: [{loc:[], msg:"..."}] }
export function parseBackendError(body: unknown): string {
  if (!body || typeof body !== 'object') return 'An unexpected error occurred.';
  const obj = body as Record<string, any>;

  // FastAPI validation error: { detail: [{loc: [...], msg: "...", type: "..."}] }
  if (Array.isArray(obj.detail)) {
    const msgs = obj.detail
      .filter((e: any) => e?.msg)
      .map((e: any) => {
        const path = Array.isArray(e.loc) ? e.loc.filter((l: any) => typeof l === 'string').join(' → ') : '';
        return path ? `${path}: ${e.msg}` : e.msg;
      });
    if (msgs.length) return msgs.join('\n');
  }

  // Simple string fields
  if (typeof obj.detail === 'string') return obj.detail;
  if (typeof obj.error === 'string') return obj.error;
  if (typeof obj.message === 'string') return obj.message;

  return 'An unexpected error occurred.';
}
