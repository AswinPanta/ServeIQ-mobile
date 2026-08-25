import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Property, AdminRoom, StaffMember, BackendStaff } from '@/types/api';
import { mockProperties } from '@/lib/mock/host-data';

/** SA-004: Subscription plan limits enforcement */
export const SUBSCRIPTION_PLANS = {
  free_trial: { label: 'Free Trial', max_properties: 1, max_rooms: 10, max_staff: 3, max_bookings_monthly: 50 },
  basic: { label: 'Basic', max_properties: 1, max_rooms: 25, max_staff: 10, max_bookings_monthly: 200 },
  professional: { label: 'Professional', max_properties: 5, max_rooms: 100, max_staff: 50, max_bookings_monthly: 2000 },
  enterprise: { label: 'Enterprise', max_properties: Infinity, max_rooms: Infinity, max_staff: Infinity, max_bookings_monthly: Infinity },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the id is a backend UUID, i.e. safe to send to the API (vs seed/demo ids like "prop-1"). */
export function isApiPropertyId(id: string | null | undefined): id is string {
  return !!id && UUID_RE.test(id);
}

export function checkPlanLimit(
  plan: SubscriptionPlan,
  currentCount: number,
  limitKey: keyof typeof SUBSCRIPTION_PLANS.free_trial
): { allowed: boolean; limit: number; message?: string } {
  const limit = SUBSCRIPTION_PLANS[plan][limitKey] as number;
  const allowed = currentCount < limit;
  return {
    allowed,
    limit,
    message: allowed ? undefined : `Plan limit reached (${currentCount}/${limit}). Upgrade your plan to add more.`,
  };
}

const HOST_PROPERTIES_KEY = 'host_saved_properties_v1';
const HOST_DELETED_SEEDS_KEY = 'host_deleted_seed_properties_v1';
const SEED_PROPERTY_IDS = new Set(['prop-1', 'prop-2', 'prop-3']);

/**
 * Persisted host properties are scoped per user so one host account can never
 * see (or inherit) another account's locally-saved properties on the same device.
 */
export function getHostPropertiesKey(userId?: string): string {
  return userId ? `host_saved_properties_${userId}` : HOST_PROPERTIES_KEY;
}

/**
 * Legacy persisted properties may be missing `photos` or carry it in an old
 * shape (e.g. a plain string array). Normalize to the PropertyPhoto[] contract
 * so restore and re-persist never feed `undefined` into render code.
 */
export function normalizeSavedProperty(p: any): Property {
  if (!p || typeof p !== 'object' || !p.id) return p;
  const photos = Array.isArray(p.photos)
    ? p.photos
      .filter((ph: any) => ph && typeof ph === 'object' && typeof ph.photo_url === 'string')
      .map((ph: any, i: number) => ({
        id: ph.id ?? `ph-${i}`,
        photo_url: ph.photo_url,
        category: ph.category || 'exterior',
      }))
    : [];
  return { ...p, photos };
}

export const persistHostProperties = (list: Property[], userId?: string) => {
  const real = list.filter(p => !SEED_PROPERTY_IDS.has(p.id)).map(normalizeSavedProperty);
  AsyncStorage.setItem(getHostPropertiesKey(userId), JSON.stringify(real)).catch(() => {});
};
export { HOST_PROPERTIES_KEY, HOST_DELETED_SEEDS_KEY, SEED_PROPERTY_IDS };

/**
 * Pure merge used by the host-context restore effect. Demo hosts get the demo
 * seed properties back (minus any the user deleted); REAL hosts never see the
 * seeds — only their own per-user saved properties plus anything added earlier
 * in this session.
 */
export function mergeRestoredProperties(opts: {
  prev: Property[];
  saved: Property[];
  deletedSeedIds: ReadonlySet<string>;
  isDemoHost: boolean;
}): Property[] {
  const { prev, saved, deletedSeedIds, isDemoHost } = opts;
  const savedList = (Array.isArray(saved) ? saved : []).map(normalizeSavedProperty);
  const normalizedPrev = prev.map(normalizeSavedProperty);
  if (isDemoHost) {
    const seeds = mockProperties.filter(p => !deletedSeedIds.has(p.id)).map(normalizeSavedProperty);
    const seedIds = new Set(seeds.map(s => s.id));
    const restored = savedList.filter(p => p && p.id && !seedIds.has(p.id) && !deletedSeedIds.has(p.id));
    const extra = normalizedPrev.filter(
      p => !deletedSeedIds.has(p.id) && !seedIds.has(p.id) && !restored.some(r => r.id === p.id),
    );
    return [...seeds, ...restored, ...extra];
  }
  // Real host: seeds are excluded from both restored and session data.
  const restored = savedList.filter(p => p && p.id && !SEED_PROPERTY_IDS.has(p.id));
  const extra = normalizedPrev.filter(
    p => p && p.id && !SEED_PROPERTY_IDS.has(p.id) && !restored.some(r => r.id === p.id),
  );
  return [...restored, ...extra];
}

/**
 * Pick the surviving active property id after a restore so child effects never
 * fetch rooms/staff for a ghost (e.g. a deleted seed) property.
 */
export function computeActivePropertyId(opts: {
  prevActive: string | null;
  saved: Property[];
  deletedSeedIds: ReadonlySet<string>;
  isDemoHost: boolean;
}): string | null {
  const { prevActive, saved, deletedSeedIds, isDemoHost } = opts;
  const savedIds = new Set((Array.isArray(saved) ? saved : []).map(p => p && p.id));
  if (prevActive && savedIds.has(prevActive)) return prevActive;
  if (isDemoHost && prevActive && mockProperties.some(p => p.id === prevActive) && !deletedSeedIds.has(prevActive)) {
    return prevActive;
  }
  if (isDemoHost) return mockProperties.find(p => !deletedSeedIds.has(p.id))?.id ?? saved[0]?.id ?? null;
  return saved[0]?.id ?? null;
}

export const OPS_DEFAULT_PROPERTY_ID_KEY = '@serveiq_default_ops_property_id';
export const OPS_DEFAULT_PROPERTY_NAME_KEY = '@serveiq_default_ops_property_name';

/**
 * Staff members are created with a server-generated temporary password that is
 * emailed to them. The backend exposes no "must change password" flag, so the
 * app tracks it locally: admin marks an email on staff creation, and the ops
 * portal forces a change (via /auth/user/change-password) until it is cleared.
 */
const STAFF_MUST_CHANGE_KEY = '@serveiq_staff_must_change_v1';

export async function getMustChangeStaffEmails(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(STAFF_MUST_CHANGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setStaffMustChange(email: string): Promise<void> {
  const map = await getMustChangeStaffEmails();
  map[email.toLowerCase()] = true;
  await AsyncStorage.setItem(STAFF_MUST_CHANGE_KEY, JSON.stringify(map));
}

export async function clearStaffMustChange(email: string): Promise<void> {
  const map = await getMustChangeStaffEmails();
  const key = email.toLowerCase();
  if (map[key]) {
    delete map[key];
    await AsyncStorage.setItem(STAFF_MUST_CHANGE_KEY, JSON.stringify(map));
  }
}


let _nextId = 100;

// ─── Guest / Host must-change-password tracking ───────────────────
// Same pattern as staff: when a user requests a forgot-password reset,
// the backend sends a temporary password. The app tracks the email so
// the next login forces a password change before anything else.
const GUEST_MUST_CHANGE_KEY = '@serveiq_guest_must_change_v1';

export async function getMustChangeGuestEmails(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_MUST_CHANGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setGuestMustChange(email: string): Promise<void> {
  const map = await getMustChangeGuestEmails();
  map[email.toLowerCase()] = true;
  await AsyncStorage.setItem(GUEST_MUST_CHANGE_KEY, JSON.stringify(map));
}

export async function clearGuestMustChange(email: string): Promise<void> {
  const map = await getMustChangeGuestEmails();
  const key = email.toLowerCase();
  if (map[key]) {
    delete map[key];
    await AsyncStorage.setItem(GUEST_MUST_CHANGE_KEY, JSON.stringify(map));
  }
}
export function genId(prefix: string) {
  _nextId += 1;
  return `${prefix}-${_nextId}`;
}

/** Transform API property shape to our Property type */
export function mapApiProperty(p: any): Property {
  return {
    id: p.id,
    tenant_id: p.tenant_id || '',
    name: p.name || '',
    type: p.type || 'HOTEL',
    description: p.description || '',
    phone_number: p.phone_number || '',
    email: p.email || '',
    country: p.country || '',
    state: p.state || '',
    city: p.city || '',
    zip_code: p.zip_code || '',
    address: p.address || '',
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    check_in_time_from: p.check_in_time || '2:00 PM',
    check_in_time_to: '12:00 AM',
    check_out_time_from: '12:00 AM',
    check_out_time_to: p.check_out_time || '11:00 AM',
    number_of_floors: p.number_of_floors || 1,
    total_rooms: p.total_rooms || 0,
    year_built: p.year_built || 0,
    amenities: [
      ...(p.system_amenities || []).map((a: any) => a.name),
      ...(p.custom_amenities || []).map((a: any) => a.name),
    ],
    is_active: p.is_active ?? true,
    currency: p.currency || 'NPR',
    timezone: p.timezone || 'UTC',
    brand_color: p.brand_color,
    min_rate_floor: p.min_rate_floor || 0,
    logo_url: p.brand_logo_url || null,
    custom_domain: p.custom_domain || null,
    cancellation_policy: p.cancellation_policy || 'MODERATE',
    photos: [
      ...(p.photos?.cover ? [{ id: 'cover', photo_url: p.photos.cover, category: 'cover' }] : []),
      ...(p.photos?.gallery || []).map((url: string, i: number) => ({
        id: `gallery-${i}`, photo_url: url, category: 'gallery',
      })),
    ],
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

/** Transform API room to AdminRoom shape */
export function mapApiRoom(r: any, activePropertyId: string | null): AdminRoom {
  return {
    id: r.id,
    property_id: r.property_id || activePropertyId || '',
    room_type_id: r.room_type_id || '',
    bed_type_id: r.bed_type_id || '',
    room_name: r.room_name || '',
    floor_number: r.floor_number ?? 1,
    max_adults: r.max_adults ?? 2,
    max_children: r.max_children ?? 0,
    max_occupancy: r.max_occupancy ?? (r.max_adults ?? 2) + (r.max_children ?? 0),
    base_rate: parseFloat(r.base_rate) || 0,
    status: r.status || 'AVAILABLE',
    smoking: r.smoking ?? false,
    accessible: r.accessible ?? false,
    cancellation_policy: r.cancellation_policy || 'MODERATE',
    cancellation_notes: r.cancellation_description || null,
    photos: [
      ...(r.photos?.cover ? [r.photos.cover] : []),
      ...(r.photos?.gallery || []),
    ],
    amenities: [
      ...(r.custom_amenities || []).map((a: any) => a.name),
    ],
    blocked_dates: [],
    maintenance_return_date: null,
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || new Date().toISOString(),
  };
}

/** Transform API staff shape to our StaffMember type */
export function mapApiStaff(s: BackendStaff, activePropertyId: string | null): StaffMember {
  const nameParts = (s.full_name || '').trim().split(/\s+/);
  const first_name = nameParts[0] || '';
  const last_name = nameParts.slice(1).join(' ');
  const roleMap: Record<string, StaffMember['role']> = {
    MANAGER: 'manager',
    FRONT_DESK: 'front_desk',
    HOUSEKEEPING: 'housekeeping',
    WAITER: 'waiter',
    KITCHEN: 'kitchen',
    MAINTENANCE: 'maintenance',
  };
  return {
    id: s.id,
    tenant_id: s.tenant_id || '',
    email: s.email,
    first_name,
    last_name,
    phone: s.phone_number || '',
    role: roleMap[s.job_role] || 'front_desk',
    property_id: activePropertyId || '',
    is_active: s.status !== 'INACTIVE',
    pos_discount_limit: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
