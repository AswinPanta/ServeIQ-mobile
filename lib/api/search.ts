import { API_ENDPOINTS, toDateParam } from '@/constants/api-config';
import type { Hotel } from '@/types/api';
import { normalizePropertyType } from '@/lib/mock/landing-data';
import { markEnd, markStart } from '@/lib/utils/perf';
import { api } from './client';
import { normalizeAmenities } from './mappers';
import { tryFetchHostProperties } from './properties';

// The live backend is a cold-startable Render instance that can take 30–45s
// to boot, so search calls get a generous timeout — otherwise they abort
// and silently fall back to mock data on first load.
const SEARCH_FETCH_TIMEOUT = 45000;

/** In-flight dedup map: keyed by destination + params, resolves to the same
 *  promise so concurrent calls for the same query share one network request. */
const inflight = new Map<string, Promise<SearchHotelsResult>>();

function dedupKey(params: Record<string, unknown>): string {
  return JSON.stringify(params);
}

interface BackendSearchItem {
  property_id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  address: string;
  description?: string | null;
  cover_photo?: string | null;
  type?: string;
  currency?: string;
  amenities: string[];
  total_price: number;
  nights: number;
}

interface BackendSearchResponse {
  adults: number;
  children: number;
  rooms: number;
  results: BackendSearchItem[];
}

interface BackendSearchMeta {
  total?: number;
  skip?: number;
  limit?: number;
  has_more?: boolean;
}

export interface SearchHotelsResult {
  hotels: Hotel[];
  fromApi: boolean;
  /** Total matching properties across ALL pages (from backend meta.total). */
  total?: number;
}

function mapSearchItemToHotel(item: BackendSearchItem): Hotel {
  const amenities = normalizeAmenities(item.amenities);
  return {
    id: item.property_id,
    name: item.name,
    location: `${item.city}, ${item.country}`,
    city: item.city,
    country: item.country,
    address: item.address,
    rating: 4.5,
    review_count: 0,
    starRating: 4,
    price: item.total_price && item.nights ? Math.round(item.total_price / item.nights) : 0,
    currency: item.currency ?? 'NPR',
    description: item.description ?? `${item.name} in ${item.city}, ${item.country}.`,
    shortDescription: item.description ?? item.name,
    images: item.cover_photo ? [item.cover_photo] : [],
    amenities,
    roomTypes: [],
    reviews: [],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    phone: '',
    email: '',
    coordinates: undefined,
    availableRooms: 0,
    tags: amenities.slice(0, 4).map(a => a.name),
    brandColor: undefined,
    logoUrl: undefined,
    isSuperhost: undefined,
    category: item.type,
    property_type: normalizePropertyType(item.type),
    hostName: undefined,
    hostAvatar: undefined,
    hostJoined: undefined,
    hostReviews: undefined,
  };
}

/** Apply skip/limit to a full result set — mirrors the backend's server-side
 * pagination for the mock-fallback paths so pages 2+ differ from page 1. */
function paginate<T>(items: T[], skip = 0, limit?: number): T[] {
  if (!limit || limit <= 0) return items;
  return items.slice(skip, skip + limit);
}

function destinationMatch(dest: string, hotel: Hotel): boolean {
  const d = dest.toLowerCase().trim();
  if (!d) return false;
  return (
    hotel.name.toLowerCase().includes(d) ||
    hotel.city.toLowerCase().includes(d) ||
    hotel.country.toLowerCase().includes(d) ||
    hotel.location.toLowerCase().includes(d)
  );
}

export async function searchHotelsApi(params: {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  limit?: number;
  skip?: number;
  minPrice?: number;
  maxPrice?: number;
  roomTypeIds?: string[];
  bedTypeIds?: string[];
  amenityIds?: string[];
}): Promise<SearchHotelsResult> {
  // Trim the destination — a trailing space (common from autocomplete or
  // keyboard input) makes the backend reject the query with HTTP 400.
  const destination = (params.destination || '').trim();

  // Dedup: if an identical query is already in-flight, return the same promise
  // instead of firing a second network request.
  const key = dedupKey({ destination, checkIn: params.checkIn, checkOut: params.checkOut, adults: params.adults, children: params.children, rooms: params.rooms, limit: params.limit, skip: params.skip, minPrice: params.minPrice, maxPrice: params.maxPrice, roomTypeIds: params.roomTypeIds, bedTypeIds: params.bedTypeIds, amenityIds: params.amenityIds });
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = _searchHotelsApiInner({ ...params, destination });
  inflight.set(key, promise);
  promise.finally(() => inflight.delete(key));
  return promise;
}

async function _searchHotelsApiInner(params: {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  limit?: number;
  skip?: number;
  minPrice?: number;
  maxPrice?: number;
  roomTypeIds?: string[];
  bedTypeIds?: string[];
  amenityIds?: string[];
}): Promise<SearchHotelsResult> {
  const { destination } = params;
  markStart(`searchHotels:${destination}`);

  // The backend requires a non-empty destination (min_length=2). Short
  // destinations (< 2 chars, e.g. a single letter) are rejected with HTTP
  // 422 — skip the round-trip and return host-created properties only.
  // Count code points (spread), not UTF-16 code units, to mirror FastAPI's
  // Python `min_length` semantics (a single emoji is 1 char to the backend).
  if (!destination || [...destination].length < 2) {
    markEnd(`searchHotels:${destination} (browse/short)`);
    let hostProps: Hotel[] = [];
    try {
      hostProps = await tryFetchHostProperties();
      if (destination) {
        hostProps = hostProps.filter(hp => destinationMatch(destination, hp));
      }
    } catch (e) {
      console.warn('Host property fetch failed during search:', e);
    }
    return { hotels: paginate(hostProps, params.skip, params.limit), fromApi: false, total: hostProps.length };
  }

  try {
    const queryParams: Record<string, string | number | Array<string | number>> = {
      destination,
      // Backend expects exact YYYY-MM-DD dates — normalize any ISO datetime
      // to the LOCAL date (UTC slicing shifts it backward in +offset zones).
      check_in: toDateParam(params.checkIn) || toDateParam(new Date().toISOString()),
      check_out: toDateParam(params.checkOut) || toDateParam(new Date(Date.now() + 86400000).toISOString()),
    };
    if (params.adults) queryParams.adults = params.adults;
    if (params.children) queryParams.children = params.children;
    if (params.rooms) queryParams.rooms = params.rooms;
    if (params.limit) queryParams.limit = params.limit;
    if (params.skip) queryParams.skip = params.skip;
    if (params.minPrice != null) queryParams.min_price = params.minPrice;
    if (params.maxPrice != null) queryParams.max_price = params.maxPrice;
    if (params.roomTypeIds?.length) queryParams.room_type_ids = params.roomTypeIds;
    if (params.bedTypeIds?.length) queryParams.bed_type_ids = params.bedTypeIds;
    if (params.amenityIds?.length) queryParams.amenity_ids = params.amenityIds;

    const response = await api.get(API_ENDPOINTS.SEARCH.SEARCH_HOTELS, { params: queryParams, timeout: SEARCH_FETCH_TIMEOUT });
    if (!response.ok) {
      console.warn(`[api] searchHotelsApi got HTTP ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }
  const contentType = response.headers?.get?.('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`[api] searchHotelsApi got non-JSON content-type "${contentType}"`);
      throw new Error('Non-JSON response');
    }
    const json = await response.json();

    const data: BackendSearchResponse = json.data ?? json;
    const results: BackendSearchItem[] = data.results ?? [];
    // StandardResponse wraps data + meta — the meta.total is the authoritative
    // count across all pages (used for "Page X of Y").
    const meta: BackendSearchMeta = json.meta ?? {};

    const enriched = results.map(item => mapSearchItemToHotel(item));

    const seen = new Set(enriched.map(h => h.id));
    const hostProps = await tryFetchHostProperties();
    for (const hp of hostProps) {
      if (!seen.has(hp.id) && destinationMatch(params.destination, hp)) {
        enriched.push(hp);
        seen.add(hp.id);
      }
    }

    // Host-created properties are appended client-side and may exceed the
    // backend count — never let total understate what we actually show.
    const total = meta.total != null ? Math.max(meta.total, enriched.length) : enriched.length;

    markEnd(`searchHotels:${destination}`);
    return { hotels: enriched, fromApi: true, total };    } catch (err) {
    markEnd(`searchHotels:${destination} (failed)`);
    console.warn(`[api] searchHotelsApi for "${destination}" failed:`, err);
    return { hotels: [], fromApi: false };
  }
}

interface BackendNearbyItem {
  property_id: string;
  name: string;
  type?: string;
  country: string;
  state?: string;
  city: string;
  address?: string;
  currency?: string;
  cover_photo?: string | null;
  description?: string | null;
  distance_km?: number;
  lowest_rate?: number;
  amenities?: string[];
}

function mapNearbyToHotel(item: BackendNearbyItem): Hotel {
  const amenities = normalizeAmenities(item.amenities);
  return {
    id: item.property_id,
    name: item.name,
    location: [item.city, item.state, item.country].filter(Boolean).join(', '),
    city: item.city || '',
    country: item.country || '',
    address: item.address || '',
    rating: 4.5,
    review_count: 0,
    starRating: 4,
    price: item.lowest_rate ?? 0,
    currency: item.currency ?? 'NPR',
    description: item.description ?? `${item.name} in ${item.city}, ${item.country}.`,
    shortDescription: item.description ?? item.name,
    images: item.cover_photo ? [item.cover_photo] : [],
    amenities,
    roomTypes: [],
    reviews: [],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    phone: '',
    email: '',
    coordinates: undefined,
    distance_km: item.distance_km,
    availableRooms: 0,
    tags: amenities.slice(0, 4).map(a => a.name),
    brandColor: undefined,
    logoUrl: undefined,
    isSuperhost: undefined,
    category: item.type,
    property_type: normalizePropertyType(item.type),
    hostName: undefined,
    hostAvatar: undefined,
    hostJoined: undefined,
    hostReviews: undefined,
  };
}

export async function searchNearbyApi(params: {
  lat: number;
  lon: number;
  limit?: number;
}): Promise<{ hotels: Hotel[]; fromApi: boolean }> {
  try {
    const queryParams: Record<string, string | number> = {
      lat: params.lat,
      lon: params.lon,
    };
    if (params.limit) queryParams.limit = params.limit;

    const response = await api.get(API_ENDPOINTS.SEARCH.SEARCH_NEARBY, { params: queryParams, timeout: SEARCH_FETCH_TIMEOUT });
    if (!response.ok || !(response.headers?.get?.('content-type') || '').includes('application/json')) {
      throw new Error(`Non-OK or non-JSON response: ${response.status}`);
    }
    const json = await response.json();

    const data: BackendNearbyItem[] | BackendSearchResponse = json.data ?? json;
    const results: BackendNearbyItem[] = Array.isArray(data) ? data : (data.results ?? []);

    const enriched = results.map(item => mapNearbyToHotel(item));

    return { hotels: enriched, fromApi: true };
  } catch {
    return { hotels: [], fromApi: false };
  }
}

type SystemItem = { id: string; name: string };

async function fetchSystemList(endpoint: string, nameKey: 'name' | 'bed_name' | 'room_type_name'): Promise<SystemItem[]> {
  try {
    const response = await api.get(endpoint, { timeout: SEARCH_FETCH_TIMEOUT });
    if (!response.ok) return [];
    const json = await response.json();
    const data: Array<Record<string, unknown>> = json.data ?? json;
    if (!Array.isArray(data)) return [];
    return data
      .map(item => ({ id: String(item.id), name: String(item[nameKey] ?? '') }))
      .filter(item => item.id && item.name);
  } catch {
    return [];
  }
}

/** Backend system amenity list — for mapping filter names → UUID amenity_ids. */
export function fetchSystemAmenities(): Promise<SystemItem[]> {
  return fetchSystemList(API_ENDPOINTS.SEARCH.SYSTEM_AMENITIES, 'name');
}

/** Backend system bed-type list — for mapping filter names → UUID bed_type_ids. */
export function fetchSystemBedTypes(): Promise<SystemItem[]> {
  return fetchSystemList(API_ENDPOINTS.SEARCH.SYSTEM_BED_TYPES, 'bed_name');
}
