import { Platform } from 'react-native';
import { API_ENDPOINTS, toDateParam } from '@/constants/api-config';
import type { Hotel } from '@/types/api';
import { MOCK_PROPERTIES, searchHotels } from '@/lib/mock/properties';
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

function mapSearchItemToHotel(item: BackendSearchItem, fallbackHotel?: Hotel): Hotel {
  const amenities = normalizeAmenities(item.amenities);
  return {
    id: item.property_id,
    name: item.name,
    location: `${item.city}, ${item.country}`,
    city: item.city,
    country: item.country,
    address: item.address,
    rating: fallbackHotel?.rating ?? 4.5,
    review_count: fallbackHotel?.review_count ?? 0,
    starRating: fallbackHotel?.starRating ?? 4,
    price: item.total_price && item.nights ? Math.round(item.total_price / item.nights) : (fallbackHotel?.price ?? 0),
    currency: (item.currency || fallbackHotel?.currency) ?? 'NPR',
    description: (item.description || fallbackHotel?.description) ?? `${item.name} in ${item.city}, ${item.country}.`,
    shortDescription: (item.description || fallbackHotel?.shortDescription) ?? item.name,
    images: item.cover_photo ? [item.cover_photo] : fallbackHotel?.images ?? [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
    ],
    amenities,
    roomTypes: fallbackHotel?.roomTypes ?? [],
    reviews: fallbackHotel?.reviews ?? [],
    cancellationPolicy: fallbackHotel?.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.',
    checkInTime: fallbackHotel?.checkInTime ?? '14:00',
    checkOutTime: fallbackHotel?.checkOutTime ?? '11:00',
    phone: fallbackHotel?.phone ?? '',
    email: fallbackHotel?.email ?? '',
    coordinates: fallbackHotel?.coordinates,
    availableRooms: fallbackHotel?.availableRooms ?? 5,
    tags: amenities.slice(0, 4).map(a => a.name),
    brandColor: fallbackHotel?.brandColor,
    logoUrl: fallbackHotel?.logoUrl,
    isSuperhost: fallbackHotel?.isSuperhost,
    category: item.type || fallbackHotel?.category,
    property_type: normalizePropertyType(item.type || fallbackHotel?.property_type),
    hostName: fallbackHotel?.hostName,
    hostAvatar: fallbackHotel?.hostAvatar,
    hostJoined: fallbackHotel?.hostJoined,
    hostReviews: fallbackHotel?.hostReviews,
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
}): Promise<SearchHotelsResult> {
  // Trim the destination — a trailing space (common from autocomplete or
  // keyboard input) makes the backend reject the query with HTTP 400.
  const destination = (params.destination || '').trim();

  // Dedup: if an identical query is already in-flight, return the same promise
  // instead of firing a second network request.
  const key = dedupKey({ destination, checkIn: params.checkIn, checkOut: params.checkOut, adults: params.adults, children: params.children, rooms: params.rooms, limit: params.limit, skip: params.skip });
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
}): Promise<SearchHotelsResult> {
  const { destination } = params;
  markStart(`searchHotels:${destination}`);

  // The live backend sends no CORS headers, so every web fetch is doomed to
  // fail — and the browser preflight only rejects after the cold Render
  // instance boots (~10-13s). Fail fast to mocks on web so the UI never waits.
  if (Platform.OS === 'web') {
    markEnd(`searchHotels:${destination} (web → mock)`);
    const mockResults = searchHotels({
      location: destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: (params.adults ?? 1) + (params.children ?? 0),
    });
    return { hotels: paginate(mockResults, params.skip, params.limit), fromApi: false, total: mockResults.length };
  }

  // No destination = "browse all" (e.g. Browse-by-property-type). The backend
  // requires a non-empty destination (min_length=2), so skip the call and
  // return mock + host-created properties instead of logging a failed fetch.
  // Short destinations (< 2 chars, e.g. a single letter) are ALSO rejected by
  // the backend with HTTP 422 — a guaranteed validation failure — so skip the
  // API call for those too instead of burning a cold-start round-trip that
  // can take ~25s only to fall back to mock anyway.
  // Count code points (spread), not UTF-16 code units, to mirror FastAPI's
  // Python `min_length` semantics (a single emoji is 1 char to the backend).
  if (!destination || [...destination].length < 2) {
    markEnd(`searchHotels:${destination} (browse/short → mock)`);
    const mockResults = searchHotels({
      location: destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: (params.adults ?? 1) + (params.children ?? 0),
    });
    try {
      const seen = new Set(mockResults.map(h => h.id));
      const hostProps = await tryFetchHostProperties();
      for (const hp of hostProps) {
        if (seen.has(hp.id)) continue;
        if (destination && !destinationMatch(destination, hp)) continue;
        mockResults.push(hp);
        seen.add(hp.id);
      }
    } catch (e) {
      console.warn('Host property fetch failed during search:', e);
    }
    return { hotels: paginate(mockResults, params.skip, params.limit), fromApi: false, total: mockResults.length };
  }

  try {
    const queryParams: Record<string, string | number> = {
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

    const response = await api.get(API_ENDPOINTS.SEARCH.SEARCH_HOTELS, { params: queryParams, timeout: SEARCH_FETCH_TIMEOUT });
    if (!response.ok) {
      console.warn(`[api] searchHotelsApi got HTTP ${response.status}, falling back to mock`);
      throw new Error(`HTTP ${response.status}`);
    }
  const contentType = response.headers?.get?.('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`[api] searchHotelsApi got non-JSON content-type "${contentType}", falling back to mock`);
      throw new Error('Non-JSON response');
    }
    const json = await response.json();

    const data: BackendSearchResponse = json.data ?? json;
    const results: BackendSearchItem[] = data.results ?? [];
    // StandardResponse wraps data + meta — the meta.total is the authoritative
    // count across all pages (used for "Page X of Y").
    const meta: BackendSearchMeta = json.meta ?? {};

    const enriched = results.map(item => {
      const fallback = MOCK_PROPERTIES.find(
        m => m.id === item.property_id || m.name.toLowerCase() === item.name.toLowerCase()
      );
      return mapSearchItemToHotel(item, fallback);
    });

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
    markEnd(`searchHotels:${destination} (mock fallback)`);
    console.warn(`[api] searchHotelsApi for "${destination}" failed, using mock data:`, err);
    try {
      const mockResults = searchHotels({
        location: destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: (params.adults ?? 1) + (params.children ?? 0),
      });
      // Mirror the backend's server-side pagination so mock pages differ too
      return { hotels: paginate(mockResults, params.skip, params.limit), fromApi: false, total: mockResults.length };
    } catch {
      return { hotels: [], fromApi: false };
    }
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

function mapNearbyToHotel(item: BackendNearbyItem, fallbackHotel?: Hotel): Hotel {
  const amenities = normalizeAmenities(item.amenities);
  return {
    id: item.property_id,
    name: item.name,
    location: [item.city, item.state, item.country].filter(Boolean).join(', '),
    city: item.city || '',
    country: item.country || '',
    address: item.address || '',
    rating: fallbackHotel?.rating ?? 4.5,
    review_count: fallbackHotel?.review_count ?? 0,
    starRating: fallbackHotel?.starRating ?? 4,
    price: item.lowest_rate ?? (fallbackHotel?.price ?? 0),
    currency: (item.currency || fallbackHotel?.currency) ?? 'NPR',
    description: (item.description || fallbackHotel?.description) ?? `${item.name} in ${item.city}, ${item.country}.`,
    shortDescription: (item.description || fallbackHotel?.shortDescription) ?? item.name,
    images: item.cover_photo ? [item.cover_photo] : fallbackHotel?.images ?? [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
    ],
    amenities,
    roomTypes: fallbackHotel?.roomTypes ?? [],
    reviews: fallbackHotel?.reviews ?? [],
    cancellationPolicy: fallbackHotel?.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.',
    checkInTime: fallbackHotel?.checkInTime ?? '14:00',
    checkOutTime: fallbackHotel?.checkOutTime ?? '11:00',
    phone: fallbackHotel?.phone ?? '',
    email: fallbackHotel?.email ?? '',
    coordinates: fallbackHotel?.coordinates,
    distance_km: item.distance_km ?? fallbackHotel?.distance_km,
    availableRooms: fallbackHotel?.availableRooms ?? 5,
    tags: amenities.slice(0, 4).map(a => a.name),
    brandColor: fallbackHotel?.brandColor,
    logoUrl: fallbackHotel?.logoUrl,
    isSuperhost: fallbackHotel?.isSuperhost,
    category: item.type || fallbackHotel?.category,
    property_type: normalizePropertyType(item.type || fallbackHotel?.property_type),
    hostName: fallbackHotel?.hostName,
    hostAvatar: fallbackHotel?.hostAvatar,
    hostJoined: fallbackHotel?.hostJoined,
    hostReviews: fallbackHotel?.hostReviews,
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

    const enriched = results.map(item => {
      const fallback = MOCK_PROPERTIES.find(
        m => m.id === item.property_id || m.name.toLowerCase() === item.name.toLowerCase()
      );
      return mapNearbyToHotel(item, fallback);
    });

    return { hotels: enriched, fromApi: true };
  } catch {
    return { hotels: [], fromApi: false };
  }
}
