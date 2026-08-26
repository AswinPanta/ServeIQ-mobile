import { api, handleResponse, isDemoMode, getActiveToken } from '@/lib/api';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import type {
  Property, AdminRoom, AdminDiscountCode, SpecialOffer,
  BackendStaff, CreateStaffRequest, UpdateStaffRequest, CancellationPolicy,
  BackendTask, CreateTaskRequestBE, UpdateTaskRequestBE, BulkAssignTaskItem,
  BackendStaffWorkSummary, BackendTaskTypeOption,
} from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Defense-in-depth: backend property-id path params must be real UUIDs.
 *  Seed/demo ids (e.g. "prop-1") must never reach the server. */
function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Build query string from params object, skipping undefined/null values */
function buildQuery(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ─── Step-by-step property setup types ───────────────────────────────
interface GeneralPropertyInfo {
  name: string;
  type?: string;
  description?: string;
  total_rooms?: number;
  number_of_floors?: number;
  year_built?: number;
  /** Required by backend schema; validated in UI before create. */
  phone_number?: string;
  /** Required by backend schema; validated in UI before create. */
  email?: string;
  amenities?: string[];
}

/** All updatable fields accepted by PATCH /properties/{id} (UpdatePropertyInfo schema) */
interface UpdatePropertyInfo {
  name?: string;
  type?: string;
  description?: string;
  total_rooms?: number;
  number_of_floors?: number;
  year_built?: number;
  phone_number?: string;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  currency?: string;
  timezone?: string;
  language?: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_grace_period?: number;
  check_out_grace_period?: number;
  always_allow_check_in_out?: boolean;
  brand_logo_url?: string;
  brand_color?: string;
  system_amenity_ids?: string[];
  custom_amenities?: { name: string; icon?: string }[];
  photos?: { cover?: string | null; gallery?: string[] };
}

/** Normalize a time value to backend's free-form HH:mm (24h) canonical format. */
export function normalizeTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  const m = String(value).trim().match(/(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10) % 24;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/**
 * Backend `phone_number` has max_length=10 (verified against the live OpenAPI;
 * `+977-...` formatted numbers 422). Strip formatting and the leading country
 * code so the payload passes validation. Digits-only, at most 10.
 *
 * NOTE: assumes Nepal-style numbers — for longer international numbers the last
 * 10 digits are kept (the country code is dropped), which matches the backend's
 * constraint but may not round-trip a non-Nepal number exactly.
 */
export function normalizePhone(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = String(value).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits || undefined;
}

interface PropertyLocation {
  country: string;
  state: string;
  city: string;
  zip_code: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyPhotosAndAmenities {
  photos?: {
    cover?: string | null;
    gallery?: string[];
  };
  amenities?: {
    system_amenity_ids?: string[];
    custom_amenities?: { name: string; icon?: string }[];
  };
}

interface PropertyLocalization {
  currency?: string;
  timezone?: string;
  language?: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_grace_period?: number;
  check_out_grace_period?: number;
  always_allow_check_in_out?: boolean;
}

interface BrandVisual {
  brand_color?: string;
  brand_logo_url?: string;
}

interface RoomTypeCreate {
  room_type_name: string;
  description?: string;
  max_occupancy?: number;
  amenities?: string[];
}

interface BedTypeCreate {
  bed_name: string;
  description?: string;
}

interface RoomBase {
  floor_number: number;
  room_name: string;
  room_type_id: string;
  bed_type_id: string;
  base_rate: number;
  max_adults?: number;
  max_children?: number;
  smoking?: boolean;
  accessible?: boolean;
  amenities?: string[];
  /** Backend RoomBase schema: CancellationPolicy enum + free-text title/description. */
  cancellation_policy?: CancellationPolicy;
  cancellation_title?: string | null;
  cancellation_description?: string | null;
}

interface BulkRoomCreate {
  rooms: RoomBase[];
}

interface OfferItem {
  title: string;
  description?: string | null;
  discount_percentage?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

interface BulkSpecialOffers {
  offers: OfferItem[];
}

async function apiGet<T>(endpoint: string, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.get(endpoint);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T, opts?: { rethrowOnServerError?: boolean }): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.post(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch (error) {
    if (opts?.rethrowOnServerError && (error as { isServerError?: boolean }).isServerError) {
      throw error;
    }
    return fallback();
  }
}

interface ExistingNamedType { id?: string; name?: string | null }

/**
 * Shared resolve-or-create for room types / bed types. The backend ships
 * global defaults (property_id null) and POST room-type rejects a duplicate
 * name with 400 "Room type name already exists" — so reuse the existing id
 * when the name (or its natural "<name> Room" / "<name> Bed" variant) matches,
 * otherwise create. Returns the id or null (network/validation failure).
 */
async function ensureNamedType(opts: {
  name: string;
  suffix: ' Room' | ' Bed';
  fetchExisting: () => Promise<ExistingNamedType[]>;
  create: (name: string) => Promise<{ id?: string } | null>;
}): Promise<string | null> {
  const candidates = [opts.name, `${opts.name}${opts.suffix}`];
  try {
    const existing = await opts.fetchExisting();
    const norm = (s: string) => String(s || '').toLowerCase().trim();
    if (Array.isArray(existing)) {
      for (const t of existing) {
        if (t && t.id && candidates.some(c => norm(c) === norm(t.name || ''))) return t.id;
      }
    }
  } catch {
    // fall through to create
  }
  try {
    const created = await opts.create(opts.name.slice(0, 100));
    return created?.id || null;
  } catch {
    return null;
  }
}

export function ensureRoomType(propertyId: string, name: string): Promise<string | null> {
  return ensureNamedType({
    name,
    suffix: ' Room',
    fetchExisting: async () => {
      const list = await hostApi.getRoomTypes(propertyId, () => []);
      return (Array.isArray(list) ? list : []).map(t => ({ id: t?.id, name: t?.room_type_name }));
    },
    create: n => hostApi.createRoomType(propertyId, { room_type_name: n }, () => null),
  });
}

export function ensureBedType(propertyId: string, name: string): Promise<string | null> {
  return ensureNamedType({
    name,
    suffix: ' Bed',
    fetchExisting: async () => {
      const list = await hostApi.getBedTypes(propertyId, () => []);
      return (Array.isArray(list) ? list : []).map(t => ({ id: t?.id, name: t?.bed_name }));
    },
    create: n => hostApi.createBedType(propertyId, { bed_name: n }, () => null),
  });
}

async function apiPatch<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.patch(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
}

async function apiDelete(endpoint: string, params?: Record<string, string>): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    const response = await api.delete(endpoint, { params });
    return response.ok;
  } catch {
    return false;
  }
}

async function apiUploadFormData(endpoint: string, formData: FormData): Promise<any> {
  if (await isDemoMode()) return null;
  try {
    const token = await getActiveToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[host-api] Upload failed ${response.status}: ${errText}`);
      return null;
    }
    const json = await response.json().catch(() => ({}));
    return json?.data ?? json;
  } catch (e) {
    console.warn('[host-api] Upload error:', e);
    return null;
  }
}

// Cache keyed by the active token so we only probe/create the tenant once per
// login session (GET /tenants/ + POST /tenants/ are cheap, but not free).
let tenantCheckToken: string | null = null;
let tenantEnsured = false;

/**
 * The live backend assigns properties to the JWT user's tenant and refuses to
 * create a property when the account has none ("You are not authorized to
 * perform this action. You should have a tenant."). Real registered hosts land
 * in the app without a tenant, so before the first property write we check
 * GET /tenants/ and, if empty, POST /tenants/ (owner_id is attached server-side
 * from the token). Demo tokens skip this — they can't authenticate.
 *
 * handleResponse() throws on ANY non-2xx, and a tenant-less account returns a
 * non-2xx (or an empty body) from GET /tenants/ — so a failed probe must NOT
 * abort the flow: we still attempt the create. Best-effort: if both fail we
 * return null and the caller surfaces the backend's own error as before.
 */
async function ensureHostTenant(propertyName?: string): Promise<string | null> {
  if (await isDemoMode()) return null;
  const token = await getActiveToken();
  if (token && tenantEnsured && tenantCheckToken === token) return null;

  let tenantId: string | null = null;
  try {
    const response = await api.get(API_ENDPOINTS.TENANTS.GET);
    const json = await handleResponse<{ success?: boolean; data?: any }>(response);
    const data = json?.success === false ? null : (json?.data ?? json);
    if (data && typeof data === 'object' && typeof data.id === 'string') tenantId = data.id;
  } catch {
    // No tenant yet (404/403/empty) or network blip — fall through and try to create.
    tenantId = null;
  }

  if (!tenantId) {
    try {
      const created = await api.post(API_ENDPOINTS.TENANTS.CREATE, {
        name: (propertyName || 'My Hotel').trim().slice(0, 255) || 'My Hotel',
      });
      const createdJson = await handleResponse<{ success?: boolean; data?: any }>(created);
      const id = createdJson?.success === false ? null : (createdJson?.data?.id ?? null);
      tenantId = typeof id === 'string' ? id : null;
    } catch {
      tenantId = null;
    }
  }

  if (tenantId) {
    tenantCheckToken = token;
    tenantEnsured = true;
  }
  return tenantId;
}

export const hostApi = {
  // ─── Properties ───────────────────────────────────────────────
  getProperties: async (fallback: () => Property[]): Promise<Property[]> => {
    if (await isDemoMode()) return fallback();
    try {
      const response = await api.get(API_ENDPOINTS.PROPERTIES.GET_ALL, { params: { skip: 0, limit: 50 } });
      const json = await handleResponse<{
        success?: boolean;
        data?: { tenant_id?: string; properties?: Property[] };
      }>(response);
      const props = json.data?.properties;
      const list = Array.isArray(props) && props.length > 0
        ? props
        : (json.success !== false && json.data && Array.isArray(json.data) ? json.data as Property[] : null);
      if (!list) return fallback();
      // The endpoint is scoped to the logged-in tenant, but defend against any
      // non-scoped payload by dropping properties that belong to other tenants.
      const tenantId = json.data?.tenant_id;
      if (tenantId) return list.filter(p => !p.tenant_id || p.tenant_id === tenantId);
      return list;
    } catch {
      return fallback();
    }
  },

  getPropertyById: (id: string, fallback: () => Property | null) =>
    apiGet<Property | null>(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id), fallback),

  createProperty: async (data: GeneralPropertyInfo, fallback: () => any) => {
    await ensureHostTenant(data.name);
    // Rethrow server errors so callers (e.g. sync-to-server) can surface the
    // backend's actual validation message instead of a silent mock fallback.
    return apiPost<any, GeneralPropertyInfo>(API_ENDPOINTS.PROPERTIES.CREATE_GENERAL_INFO, {
      ...data,
      phone_number: normalizePhone(data.phone_number),
    }, fallback, { rethrowOnServerError: true });
  },

  updateProperty: async (id: string, data: UpdatePropertyInfo, fallback: () => any) => {
    // Backend supports PATCH /properties/{id} (UpdatePropertyInfo schema) — verified via OpenAPI
    const { phone_number, ...rest } = data;
    return apiPatch<any, UpdatePropertyInfo>(
      API_ENDPOINTS.PROPERTIES.GET_BY_ID(id),
      phone_number !== undefined ? { ...rest, phone_number: normalizePhone(phone_number) } : rest,
      fallback
    );
  },

  deleteProperty: (id: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE(id)),

  toggleActivation: (id: string, fallback: () => any) =>
    apiPost<any, Record<string, never>>(API_ENDPOINTS.PROPERTIES.TOGGLE_ACTIVATION(id), {}, fallback),

  getNumberOfFloors: (id: string, fallback: () => number) =>
    apiGet<number>(API_ENDPOINTS.PROPERTIES.GET_NUMBER_OF_FLOORS(id), fallback),

  // ─── Setup wizard steps ──────────────────────────────────────
  createGeneralInfo: async (data: GeneralPropertyInfo, fallback: () => any) => {
    await ensureHostTenant(data.name);
    // Backend POST /properties expects CreatePropertyRequest with nested general_information
    // and location (both required). Provide sensible defaults for localization.
    return apiPost<any, any>(API_ENDPOINTS.PROPERTIES.CREATE_GENERAL_INFO, {
      general_information: {
        ...data,
        phone_number: normalizePhone(data.phone_number),
      },
      location: {
        country: 'Nepal',
        state: '',
        city: '',
        zip_code: '00000',
        address: '',
      },
      localization: {
        currency: 'NPR',
        check_in_time: '15:00',
        check_out_time: '11:00',
        always_allow_check_in_and_check_out: false,
      },
    }, fallback, { rethrowOnServerError: true });
  },

  createLocation: (propertyId: string, data: PropertyLocation, fallback: () => any) =>
    apiPatch<any, PropertyLocation>(API_ENDPOINTS.PROPERTIES.UPDATE(propertyId), data, fallback),

  createPhotosAndAmenities: (propertyId: string, data: PropertyPhotosAndAmenities, fallback: () => any) =>
    apiPatch<any, PropertyPhotosAndAmenities>(API_ENDPOINTS.PROPERTIES.UPDATE(propertyId), data, fallback),

  createLocalization: (propertyId: string, data: PropertyLocalization, fallback: () => any) =>
    apiPatch<any, PropertyLocalization>(API_ENDPOINTS.PROPERTIES.UPDATE(propertyId), data, fallback),

  createBrandVisual: (propertyId: string, data: BrandVisual, fallback: () => any) =>
    apiPatch<any, BrandVisual>(API_ENDPOINTS.PROPERTIES.UPDATE(propertyId), data, fallback),

  // ─── Image uploads ──────────────────────────────────────────
  // Backend: POST /properties/image (property_id in FormData body, not URL)
  uploadPropertyImage: (propertyId: string, formData: FormData) => {
    formData.append('property_id', propertyId);
    return apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGE(propertyId), formData);
  },

  uploadPropertyImages: (propertyId: string, formData: FormData) => {
    formData.append('property_id', propertyId);
    return apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGES(propertyId), formData);
  },

  // ─── Room types ──────────────────────────────────────────────
  getRoomTypes: (propertyId: string, fallback: () => any[]) =>
    apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_ROOM_TYPES(propertyId), fallback),

  createRoomType: (propertyId: string, data: RoomTypeCreate, fallback: () => any) =>
    apiPost<any, RoomTypeCreate>(API_ENDPOINTS.PROPERTIES.CREATE_ROOM_TYPE(propertyId), data, fallback),

  // ─── Bed types ───────────────────────────────────────────────
  getBedTypes: (propertyId: string, fallback: () => any[]) =>
    apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_BED_TYPES(propertyId), fallback),

  createBedType: (propertyId: string, data: BedTypeCreate, fallback: () => any) =>
    apiPost<any, BedTypeCreate>(API_ENDPOINTS.PROPERTIES.CREATE_BED_TYPE(propertyId), data, fallback),

  // ─── Rooms ──────────────────────────────────────────────────
  getRooms: (propertyId: string, fallback: () => AdminRoom[]) =>
    apiGet<AdminRoom[]>(API_ENDPOINTS.PROPERTIES.GET_ROOMS(propertyId), fallback),

  createRoom: (propertyId: string, data: RoomBase, fallback: () => any) =>
    // Backend uses bulk create — individual room create wraps as single-item bulk
    apiPost<any, BulkRoomCreate>(API_ENDPOINTS.PROPERTIES.BULK_CREATE_ROOMS(propertyId), { rooms: [data] }, fallback),

  bulkCreateRooms: (propertyId: string, data: BulkRoomCreate, fallback: () => any) =>
    apiPost<any, BulkRoomCreate>(API_ENDPOINTS.PROPERTIES.BULK_CREATE_ROOMS(propertyId), data, fallback),

  getRoom: (propertyId: string, roomId: string, fallback: () => any) =>
    apiGet<any>(API_ENDPOINTS.PROPERTIES.GET_ROOM(propertyId, roomId), fallback),

  updateRoom: (propertyId: string, roomId: string, data: Partial<AdminRoom>, fallback: () => AdminRoom) =>
    apiPatch<AdminRoom, Partial<AdminRoom>>(API_ENDPOINTS.PROPERTIES.UPDATE_ROOM(propertyId, roomId), data, fallback),

  deleteRoom: (propertyId: string, roomId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_ROOM(propertyId, roomId)),

  uploadRoomImage: (propertyId: string, formData: FormData) =>
    apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_ROOM_IMAGE(propertyId), formData),

  uploadRoomImages: (propertyId: string, formData: FormData) =>
    apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_ROOM_IMAGES(propertyId), formData),

  // ─── Amenities ──────────────────────────────────────────────
  getAmenities: (fallback: () => string[]) =>
    apiGet<string[]>(API_ENDPOINTS.PROPERTIES.GET_AMENITIES, fallback),

  // ─── Discount codes ─────────────────────────────────────────
  getDiscountCodes: (propertyId: string, fallback: () => AdminDiscountCode[]) =>
    apiGet<AdminDiscountCode[]>(API_ENDPOINTS.PROPERTIES.GET_DISCOUNT_CODES(propertyId), fallback),

  getDiscountCode: (propertyId: string, discountId: string, fallback: () => AdminDiscountCode) =>
    apiGet<AdminDiscountCode>(API_ENDPOINTS.PROPERTIES.GET_DISCOUNT_CODE(propertyId, discountId), fallback),

  createDiscountCode: (propertyId: string, data: Partial<AdminDiscountCode>, fallback: () => AdminDiscountCode) =>
    apiPost<AdminDiscountCode, Partial<AdminDiscountCode>>(API_ENDPOINTS.PROPERTIES.CREATE_DISCOUNT_CODE(propertyId), data, fallback),

  updateDiscountCode: (propertyId: string, discountId: string, data: Partial<AdminDiscountCode>, fallback: () => AdminDiscountCode) =>
    apiPatch<AdminDiscountCode, Partial<AdminDiscountCode>>(API_ENDPOINTS.PROPERTIES.UPDATE_DISCOUNT_CODE(propertyId, discountId), data, fallback),

  deleteDiscountCode: (propertyId: string, discountId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_DISCOUNT_CODE(propertyId, discountId)),

  // ─── Special offers ─────────────────────────────────────────
  getSpecialOffers: (propertyId: string, fallback: () => SpecialOffer[]) =>
    apiGet<SpecialOffer[]>(API_ENDPOINTS.PROPERTIES.GET_SPECIAL_OFFERS(propertyId), fallback),

  getSpecialOffer: (propertyId: string, offerId: string, fallback: () => SpecialOffer) =>
    apiGet<SpecialOffer>(API_ENDPOINTS.PROPERTIES.GET_SPECIAL_OFFER(propertyId, offerId), fallback),

  createSpecialOffers: (propertyId: string, data: BulkSpecialOffers, fallback: () => any) =>
    apiPost<any, BulkSpecialOffers>(API_ENDPOINTS.PROPERTIES.CREATE_SPECIAL_OFFERS(propertyId), data, fallback),

  updateSpecialOffer: (propertyId: string, offerId: string, data: Partial<SpecialOffer>, fallback: () => SpecialOffer) =>
    apiPatch<SpecialOffer, Partial<SpecialOffer>>(API_ENDPOINTS.PROPERTIES.UPDATE_SPECIAL_OFFER(propertyId, offerId), data, fallback),

  deleteSpecialOffer: (propertyId: string, offerId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_SPECIAL_OFFER(propertyId, offerId)),

  // ─── Property Bookings ───────────────────────────────────────
  getPropertyBookings: (propertyId: string, fallback: () => any[]) =>
    apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_PROPERTY_BOOKINGS(propertyId), fallback),

  // ─── Staff ───────────────────────────────────────────────────
  getStaff: (propertyId: string, fallback: () => BackendStaff[]) =>
    isValidUuid(propertyId)
      ? apiGet<BackendStaff[]>(API_ENDPOINTS.PROPERTIES.GET_STAFF(propertyId), fallback)
      : Promise.resolve(fallback()),

  createStaff: (propertyId: string, data: CreateStaffRequest, fallback: () => BackendStaff) =>
    isValidUuid(propertyId)
      ? apiPost<BackendStaff, CreateStaffRequest>(API_ENDPOINTS.PROPERTIES.CREATE_STAFF(propertyId), {
        ...data,
        phone_number: normalizePhone(data.phone_number) ?? null,
      }, fallback, { rethrowOnServerError: true })
      : Promise.resolve(fallback()),

  updateStaff: (propertyId: string, staffId: string, data: UpdateStaffRequest, fallback: () => BackendStaff) =>
    isValidUuid(propertyId)
      ? apiPatch<BackendStaff, UpdateStaffRequest>(API_ENDPOINTS.PROPERTIES.UPDATE_STAFF_MEMBER(propertyId, staffId), {
        ...data,
        ...(data.phone_number !== undefined ? { phone_number: normalizePhone(data.phone_number) ?? null } : {}),
      }, fallback)
      : Promise.resolve(fallback()),

  deleteStaff: (propertyId: string, staffId: string) =>
    isValidUuid(propertyId)
      ? apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_STAFF_MEMBER(propertyId, staffId))
      : Promise.resolve(true),

  uploadStaffImage: (propertyId: string, formData: FormData) =>
    isValidUuid(propertyId)
      ? apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_STAFF_IMAGE(propertyId), formData)
      : Promise.resolve(null),

  createTask: (propertyId: string, data: { room_id?: string; room_name?: string; task_type: string; priority?: string; assigned_staff_id?: string; due_time?: string; notes?: string }, fallback: () => any) =>
    apiPost<any, typeof data>(API_ENDPOINTS.PROPERTIES.CREATE_TASK(propertyId), data, fallback),

  // ─── Housekeeping Tasks (admin) ────────────────────────────────
  getTasks: (propertyId: string, params?: { skip?: number; limit?: number; search?: string; task_status?: string; priority?: string }, fallback: () => BackendTask[] = () => []) =>
    isValidUuid(propertyId)
      ? apiGet<BackendTask[]>(`${API_ENDPOINTS.PROPERTIES.GET_TASKS(propertyId)}${buildQuery(params)}`, fallback)
      : Promise.resolve(fallback()),

  getTask: (propertyId: string, taskId: string, fallback: () => BackendTask) =>
    isValidUuid(propertyId)
      ? apiGet<BackendTask>(API_ENDPOINTS.PROPERTIES.GET_TASK(propertyId, taskId), fallback)
      : Promise.resolve(fallback()),

  createTaskBE: (propertyId: string, data: CreateTaskRequestBE, fallback: () => BackendTask) =>
    isValidUuid(propertyId)
      ? apiPost<BackendTask, CreateTaskRequestBE>(API_ENDPOINTS.PROPERTIES.CREATE_TASK(propertyId), data, fallback, { rethrowOnServerError: true })
      : Promise.resolve(fallback()),

  updateTask: (propertyId: string, taskId: string, data: UpdateTaskRequestBE, fallback: () => BackendTask) =>
    isValidUuid(propertyId)
      ? apiPatch<BackendTask, UpdateTaskRequestBE>(API_ENDPOINTS.PROPERTIES.UPDATE_TASK(propertyId, taskId), data, fallback)
      : Promise.resolve(fallback()),

  deleteTask: (propertyId: string, taskId: string) =>
    isValidUuid(propertyId)
      ? apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_TASK(propertyId, taskId))
      : Promise.resolve(true),

  completeTask: (propertyId: string, taskId: string, fallback: () => BackendTask) =>
    isValidUuid(propertyId)
      ? apiPatch<BackendTask, Record<string, never>>(API_ENDPOINTS.PROPERTIES.COMPLETE_TASK(propertyId, taskId), {}, fallback)
      : Promise.resolve(fallback()),

  bulkAssignTasks: (propertyId: string, tasks: BulkAssignTaskItem[], fallback: () => { created_count: number; tasks: BackendTask[] }) =>
    isValidUuid(propertyId)
      ? apiPost<{ created_count: number; tasks: BackendTask[] }, { tasks: BulkAssignTaskItem[] }>(API_ENDPOINTS.PROPERTIES.BULK_ASSIGN_TASKS(propertyId), { tasks }, fallback, { rethrowOnServerError: true })
      : Promise.resolve(fallback()),

  getHKStaff: (propertyId: string, fallback: () => BackendStaff[]) =>
    isValidUuid(propertyId)
      ? apiGet<BackendStaff[]>(API_ENDPOINTS.PROPERTIES.GET_HK_STAFF(propertyId), fallback)
      : Promise.resolve(fallback()),

  getStaffWorkSummary: (propertyId: string, fallback: () => BackendStaffWorkSummary[]) =>
    isValidUuid(propertyId)
      ? apiGet<BackendStaffWorkSummary[]>(API_ENDPOINTS.PROPERTIES.GET_STAFF_WORK_SUMMARY(propertyId), fallback)
      : Promise.resolve(fallback()),

  getTaskTypes: (propertyId: string, fallback: () => BackendTaskTypeOption[]) =>
    isValidUuid(propertyId)
      ? apiGet<BackendTaskTypeOption[]>(API_ENDPOINTS.PROPERTIES.GET_TASK_TYPES(propertyId), fallback)
      : Promise.resolve(fallback()),

  // ─── Room Status ────────────────────────────────────────────
  getRoomsByStatus: (propertyId: string, fallback: () => any[]) =>
    isValidUuid(propertyId)
      ? apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_ROOMS_STATUS(propertyId), fallback)
      : Promise.resolve(fallback()),

  getRoomStatusSummary: (propertyId: string, fallback: () => any) =>
    isValidUuid(propertyId)
      ? apiGet<any>(API_ENDPOINTS.PROPERTIES.GET_ROOMS_STATUS_SUMMARY(propertyId), fallback)
      : Promise.resolve(fallback()),

  // ─── Room Images (cleaning/maintenance) ─────────────────────
  uploadCleaningStatusImages: (propertyId: string, roomId: string, formData: FormData) =>
    isValidUuid(propertyId)
      ? apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_CLEANING_STATUS_IMAGES(propertyId, roomId), formData)
      : Promise.resolve(null),

  uploadMaintenanceImages: (propertyId: string, roomId: string, formData: FormData) =>
    isValidUuid(propertyId)
      ? apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_MAINTENANCE_IMAGES(propertyId, roomId), formData)
      : Promise.resolve(null),

  // ─── Reviews ────────────────────────────────────────────────
  getReviews: (propertyId: string, fallback: () => any[]) =>
    isValidUuid(propertyId)
      ? apiGet<any[]>(API_ENDPOINTS.PROPERTIES.GET_REVIEWS(propertyId), fallback)
      : Promise.resolve(fallback()),

  createReview: (propertyId: string, data: { rating: number; comment?: string }, fallback: () => any) =>
    isValidUuid(propertyId)
      ? apiPost<any, typeof data>(API_ENDPOINTS.PROPERTIES.CREATE_REVIEW(propertyId), data, fallback, { rethrowOnServerError: true })
      : Promise.resolve(fallback()),

  updateReview: (propertyId: string, reviewId: string, data: { rating?: number; comment?: string }, fallback: () => any) =>
    isValidUuid(propertyId)
      ? apiPatch<any, typeof data>(API_ENDPOINTS.PROPERTIES.UPDATE_REVIEW(propertyId, reviewId), data, fallback)
      : Promise.resolve(fallback()),
};

// ─── Staff Portal API ───────────────────────────────────────────────────────
// These endpoints are for staff at the front desk (check-in/out, modify bookings).
export const staffApi = {
  getBookingByRef: (ref: string, fallback: () => any) =>
    apiGet<any>(API_ENDPOINTS.STAFF.GET_BOOKING(ref), fallback),

  checkIn: (ref: string, data: { room_number?: string }, fallback: () => any) =>
    apiPost<any, typeof data>(API_ENDPOINTS.STAFF.CHECK_IN(ref), data, fallback),

  checkOut: (ref: string, data: { payment_method?: string }, fallback: () => any) =>
    apiPost<any, typeof data>(API_ENDPOINTS.STAFF.CHECK_OUT(ref), data, fallback),

  modifyBooking: (ref: string, data: Record<string, unknown>, fallback: () => any) =>
    apiPatch<any, Record<string, unknown>>(API_ENDPOINTS.STAFF.MODIFY_BOOKING(ref), data, fallback),
};
