import { api, handleResponse, isDemoMode } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api-config';
import type {
  Property, RoomTypeDef, AdminRoom, AdminDiscountCode, SpecialOffer, AdminRoomStatus,
  BackendStaff, CreateStaffRequest,
} from '@/types/api';

// ─── Step-by-step property setup types ───────────────────────────────
interface GeneralPropertyInfo {
  name: string;
  type?: string;
  description?: string;
  total_rooms?: number;
  number_of_floors?: number;
  year_built?: number;
  phone_number?: string;
  email?: string;
  amenities?: string[];
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

async function apiPost<T, D>(endpoint: string, data: D, fallback: () => T): Promise<T> {
  if (await isDemoMode()) return fallback();
  try {
    const response = await api.post(endpoint, data);
    const json = await handleResponse<{ success?: boolean; data?: T }>(response);
    return (json.success !== false && json.data !== undefined) ? json.data : (json as unknown as T);
  } catch {
    return fallback();
  }
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
    const response = await api.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
    return handleResponse<any>(response);
  } catch {
    return null;
  }
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
      if (Array.isArray(props) && props.length > 0) return props;
      if (json.success !== false && json.data && Array.isArray(json.data)) return json.data as Property[];
      return fallback();
    } catch {
      return fallback();
    }
  },

  getPropertyById: (id: string, fallback: () => Property | null) =>
    apiGet<Property | null>(API_ENDPOINTS.PROPERTIES.GET_BY_ID(id), fallback),

  createProperty: (data: GeneralPropertyInfo, fallback: () => any) =>
    apiPost<any, GeneralPropertyInfo>(API_ENDPOINTS.PROPERTIES.CREATE_GENERAL_INFO, data, fallback),

  updateProperty: async (id: string, data: Record<string, unknown>, fallback: () => any) => {
    // Backend has no PATCH /properties/{id} — updates are done via setup wizard steps
    // TODO: wire to backend when PATCH /properties/{id} is added
    try {
      const response = await api.patch(`/properties/${id}`, data);
      if (response.ok) {
        const json = await response.json();
        return json.data ?? json;
      }
    } catch {
      // Backend unavailable or PATCH not supported — use local fallback
    }
    return fallback();
  },

  deleteProperty: (id: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE(id)),

  toggleActivation: (id: string, fallback: () => any) =>
    apiPost<any, Record<string, never>>(API_ENDPOINTS.PROPERTIES.TOGGLE_ACTIVATION(id), {}, fallback),

  getNumberOfFloors: (id: string, fallback: () => number) =>
    apiGet<number>(API_ENDPOINTS.PROPERTIES.GET_NUMBER_OF_FLOORS(id), fallback),

  // ─── Setup wizard steps ──────────────────────────────────────
  createGeneralInfo: (data: GeneralPropertyInfo, fallback: () => any) =>
    apiPost<any, GeneralPropertyInfo>(API_ENDPOINTS.PROPERTIES.CREATE_GENERAL_INFO, data, fallback),

  createLocation: (propertyId: string, data: PropertyLocation, fallback: () => any) =>
    apiPost<any, PropertyLocation>(API_ENDPOINTS.PROPERTIES.CREATE_LOCATION(propertyId), data, fallback),

  createPhotosAndAmenities: (propertyId: string, data: PropertyPhotosAndAmenities, fallback: () => any) =>
    apiPost<any, PropertyPhotosAndAmenities>(API_ENDPOINTS.PROPERTIES.CREATE_PHOTOS_AMENITIES(propertyId), data, fallback),

  createLocalization: (propertyId: string, data: PropertyLocalization, fallback: () => any) =>
    apiPost<any, PropertyLocalization>(API_ENDPOINTS.PROPERTIES.CREATE_LOCALIZATION(propertyId), data, fallback),

  createBrandVisual: (propertyId: string, data: BrandVisual, fallback: () => any) =>
    apiPost<any, BrandVisual>(API_ENDPOINTS.PROPERTIES.CREATE_BRAND_VISUAL(propertyId), data, fallback),

  // ─── Image uploads ──────────────────────────────────────────
  uploadPropertyImage: (propertyId: string, formData: FormData) =>
    apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGE(propertyId), formData),

  uploadPropertyImages: (propertyId: string, formData: FormData) =>
    apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_IMAGES(propertyId), formData),

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
    apiGet<BackendStaff[]>(API_ENDPOINTS.PROPERTIES.GET_STAFF(propertyId), fallback),

  createStaff: (propertyId: string, data: CreateStaffRequest, fallback: () => BackendStaff) =>
    apiPost<BackendStaff, CreateStaffRequest>(API_ENDPOINTS.PROPERTIES.CREATE_STAFF(propertyId), data, fallback),

  updateStaff: (propertyId: string, staffId: string, data: Partial<CreateStaffRequest>, fallback: () => BackendStaff) =>
    apiPatch<BackendStaff, Partial<CreateStaffRequest>>(API_ENDPOINTS.PROPERTIES.UPDATE_STAFF_MEMBER(propertyId, staffId), data, fallback),

  deleteStaff: (propertyId: string, staffId: string) =>
    apiDelete(API_ENDPOINTS.PROPERTIES.DELETE_STAFF_MEMBER(propertyId, staffId)),

  uploadStaffImage: (propertyId: string, formData: FormData) =>
    apiUploadFormData(API_ENDPOINTS.PROPERTIES.UPLOAD_STAFF_IMAGE(propertyId), formData),
};
