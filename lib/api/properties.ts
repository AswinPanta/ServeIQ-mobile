import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS, getPortalStorageKeys, toDateParam } from '@/constants/api-config';
import type { Hotel } from '@/types/api';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { normalizePropertyType } from '@/lib/mock/landing-data';
import { api } from './client';
import { normalizeAmenities } from './mappers';

// The live backend is a cold-startable Render instance that can take 10–13s
// to boot, so the rooms calls get a longer timeout than the global 8s —
// otherwise they abort and silently fall back to mock rooms on first load.
const ROOMS_FETCH_TIMEOUT = 20000;

export interface AvailableRoom {
  id: string;
  room_name: string;
  room_type?: string;
  bed_type?: string;
  base_rate: string;
  max_adults: number;
  max_children: number;
  photos?: { cover?: string; gallery?: string[] };
  status: string;
  floor_number: number;
  cancellation_policy: string;
  cancellation_title?: string;
  cancellation_description?: string;
  system_amenities?: { name: string; icon?: string }[];
  custom_amenities?: { name: string; icon?: string }[];
}

interface BackendPropertyResponse {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  number_of_floors: number;
  total_rooms: number;
  year_built: number | null;
  phone_number: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  language: string | null;
  brand_logo_url: string | null;
  brand_color: string | null;
  is_active: boolean;
  system_amenities: { id: string; name: string; icon?: string }[];
  custom_amenities: { name: string }[];
  photos: { cover?: string | null; gallery?: string[] } | null;
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function mapPropertyToHotel(p: BackendPropertyResponse): Hotel {
  const allPhotos: string[] = [];
  if (p.photos) {
    if (typeof p.photos.cover === 'string' && p.photos.cover) allPhotos.push(p.photos.cover);
    if (Array.isArray(p.photos.gallery)) allPhotos.push(...p.photos.gallery);
  }
  const amenities = [
    ...normalizeAmenities(p.system_amenities),
    ...normalizeAmenities(p.custom_amenities),
  ];
  return {
    id: p.id,
    name: p.name,
    location: [p.city, p.state, p.country].filter(Boolean).join(', '),
    city: p.city || '',
    country: p.country || '',
    address: p.address || '',
    rating: 4.5,
    review_count: 0,
    starRating: 4,
    price: 0,
    currency: p.currency || 'NPR',
    description: p.description || '',
    shortDescription: p.name,
    images: allPhotos.length > 0 ? allPhotos : ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop'],
    amenities: amenities,
    roomTypes: [],
    reviews: [],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
    checkInTime: p.check_in_time || '14:00',
    checkOutTime: p.check_out_time || '11:00',
    phone: p.phone_number || '',
    email: p.email || '',
    availableRooms: p.total_rooms || 5,
    tags: amenities.slice(0, 4).map(a => a.name),
    brandColor: p.brand_color || undefined,
    logoUrl: p.brand_logo_url || undefined,
    property_type: normalizePropertyType(p.type),
  };
}

export async function tryFetchHostProperties(): Promise<Hotel[]> {
  try {
    const hostToken = await AsyncStorage.getItem(getPortalStorageKeys('host').AUTH_TOKEN);
    if (!hostToken) return [];
    const resp = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROPERTIES.GET_ALL}`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    if (!resp.ok) return [];
    const contentType = resp.headers?.get?.('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    const json = await resp.json();
    const data: { tenant_id?: string; properties?: BackendPropertyResponse[] } = json.data ?? json;
    const props = data.properties ?? [];
    if (props.length === 0) return [];
    // Backend response is scoped to the logged-in tenant, but defend against any
    // non-scoped payload by dropping properties that belong to other tenants.
    const tenantId = data.tenant_id;
    const owned = tenantId ? props.filter(p => !p.tenant_id || p.tenant_id === tenantId) : props;
    return owned.filter(p => p.is_active !== false).map(mapPropertyToHotel);
  } catch {
    return [];
  }
}

// Mock/local property ids ('1', '11', 'prop-1', …) don't exist on the backend
// (its path params require real UUIDs and reject them with 422). The booking
// flow's room step must never show "No rooms available" for these — map the
// property's mock RoomTypes into the AvailableRoom shape instead.
function mockRoomsForProperty(propertyId: string): AvailableRoom[] {
  const mock = MOCK_PROPERTIES.find(h => h.id === propertyId);
  if (!mock) return [];
  return mock.roomTypes.map((r) => {
    // Mock rooms only carry a single total guest capacity (occupancy /
    // maxGuests), no adult/child split. The booking flow's capacity check
    // enforces max_adults >= ceil(adults/roomCount) AND max_children >=
    // ceil(children/roomCount), so granting the full capacity to both roles
    // keeps valid family bookings flowing (slight overstatement is fine for
    // demo/mock data).
    const capacity = r.maxGuests ?? r.occupancy ?? 2;
    return {
      id: r.id,
      room_name: r.name,
      room_type: r.name,
      bed_type: r.bedType || r.bed || 'Queen',
      base_rate: String(r.price),
      max_adults: capacity,
      max_children: capacity,
      photos: r.image ? { cover: r.image } : undefined,
      status: 'AVAILABLE',
      floor_number: 1,
      cancellation_policy: r.cancellationPolicy || 'FLEXIBLE',
      cancellation_title: r.cancellationPolicy || 'Free cancellation',
      cancellation_description: r.cancellationPolicy || 'Cancel up to 24 hours before check-in',
      system_amenities: (r.amenities ?? []).map(name => ({ name })),
    };
  });
}

export async function getAvailableRoomsApi(
  propertyId: string,
  checkin: string,
  checkout: string,
): Promise<AvailableRoom[]> {
  // Backend has no CORS headers — web fetches hang ~13s on cold start before
  // failing. The backend can never answer on web, so fail fast to mock rooms
  // instead of hanging (matches getPropertyById's web behavior).
  if (Platform.OS === 'web') return mockRoomsForProperty(propertyId);

  // Non-UUID (mock/local) property ids can't exist on the backend — skip the
  // doomed request (it 422s on a non-UUID path param) and return mock rooms.
  if (!UUID_RE.test(propertyId)) return mockRoomsForProperty(propertyId);

  try {
    const response = await api.get(API_ENDPOINTS.AVAILABLE_ROOMS(propertyId, checkin, checkout), {
      timeout: ROOMS_FETCH_TIMEOUT,
    });
    if (!response || typeof response.json !== 'function') {
      throw new Error(`Invalid response object: ${typeof response}`);
    }
    if (!response.ok) {
      throw new Error(`Rooms endpoint returned ${response.status}`);
    }
    const json = await response.json();
    const data = json.success ? json.data : (Array.isArray(json) ? json : []);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[api] getAvailableRoomsApi for "${propertyId}" failed:`, err);
    return mockRoomsForProperty(propertyId);
  }
}

export async function getPropertyById(propertyId: string): Promise<Hotel | null> {
  const mockHotel = MOCK_PROPERTIES.find(h => h.id === propertyId) || null;

  // Same CORS cold-start hang as searchHotelsApi — web can never reach the
  // backend, so return the mock immediately instead of waiting ~13s to fail.
  if (Platform.OS === 'web') return mockHotel;

  // Backend property ids are UUIDs. Mock/local ids ('11', 'prop-1', …) can't
  // exist on the backend — skip the pointless request (it 422s on a non-UUID
  // path param) instead of logging a misleading warning.
  if (!UUID_RE.test(propertyId)) return mockHotel;

  try {
    // Try public endpoint first (no auth required — guests can browse).
    // Same cold-start rationale as the rooms call: a cold Render instance
    // takes 10-13s to boot, so the global 8s timeout would abort and drop
    // us onto the mock fallback. Give it the same 20s as rooms.
    const response = await api.get(API_ENDPOINTS.PROPERTIES.GET_BY_ID_PUBLIC(propertyId), {
      timeout: ROOMS_FETCH_TIMEOUT,
    });
    if (!response.ok || !(response.headers?.get?.('content-type') || '').includes('application/json')) {
      console.warn(`[api] getPropertyById got non-OK or non-JSON response (${response.status}), using mock`);
      return mockHotel;
    }
    const json = await response.json();
    const data: BackendPropertyResponse = json.data ?? json;
    if (!data || !data.id) return mockHotel;

    const allPhotos: string[] = [];
    if (data.photos) {
      if (typeof data.photos.cover === 'string' && data.photos.cover) allPhotos.push(data.photos.cover);
      if (Array.isArray(data.photos.gallery)) allPhotos.push(...data.photos.gallery);
    }

    const amenitiesMap = new Map<string, { name: string; icon: string }>();
    for (const a of normalizeAmenities(data.system_amenities)) {
      amenitiesMap.set(a.name, a);
    }
    for (const a of normalizeAmenities(data.custom_amenities)) {
      if (!amenitiesMap.has(a.name)) amenitiesMap.set(a.name, a);
    }
    const amenities = Array.from(amenitiesMap.values());

    // Fetch rooms from backend
    let roomTypes: Hotel['roomTypes'] = mockHotel?.roomTypes ?? [];
    try {
      const today = toDateParam(new Date().toISOString());
      const nextWeek = toDateParam(new Date(Date.now() + 7 * 86400000).toISOString());
      const roomsUrl = API_ENDPOINTS.AVAILABLE_ROOMS(data.id, today, nextWeek);
      const roomsRes = await api.get(roomsUrl, { timeout: ROOMS_FETCH_TIMEOUT });
      // No success-path logging here — the catch block below logs a single
      // WARN on failure only, keeping the console clean on the happy path.
      if (!roomsRes || typeof roomsRes.json !== 'function') {
        throw new Error(`Invalid rooms response object (status ${roomsRes?.status ?? 'unknown'}): ${typeof roomsRes}`);
      }
      if (!roomsRes.ok) {
        throw new Error(`Rooms endpoint returned ${roomsRes.status}`);
      }
      const roomsJson = await roomsRes.json();
      const roomsData = roomsJson?.success ? roomsJson.data : (Array.isArray(roomsJson) ? roomsJson : []);
      if (Array.isArray(roomsData) && roomsData.length > 0) {
        // Map backend rooms to guest RoomType format
        const grouped = new Map<string, AvailableRoom[]>();
        for (const room of roomsData) {
          if (!room || typeof room !== 'object') continue;
          const rawType = room.room_type || room.room_name;
          const key = typeof rawType === 'string' && rawType ? rawType : 'Room';
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(room);
        }
        roomTypes = Array.from(grouped.entries()).map(([typeName, rooms]) => {
          const first = rooms[0];
          const price = parseFloat(first.base_rate) || 0;
          const roomImage = first.photos?.cover || (allPhotos.length > 0 ? allPhotos[0] : '');
          const systemAmenities = normalizeAmenities(first.system_amenities);
          const customAmenities = normalizeAmenities(first.custom_amenities);
          return {
            id: first.id,
            name: typeName || first.room_name,
            price,
            currency: data.currency || 'NPR',
            occupancy: (first.max_adults ?? 0) + (first.max_children ?? 0),
            occupancyLabel: `${first.max_adults} adults${first.max_children > 0 ? `, ${first.max_children} children` : ''}`,
            maxGuests: (first.max_adults ?? 0) + (first.max_children ?? 0),
            bed: first.bed_type || 'Standard',
            description: first.cancellation_description || first.cancellation_title || 'Comfortable room',
            available: rooms.length,
            amenities: [...systemAmenities, ...customAmenities].map((a) => a.name),
            image: roomImage,
            gallery: first.photos?.gallery || [],
            totalRooms: rooms.length,
            bedType: first.bed_type,
            areaSqFt: undefined,
            cancellationPolicy: first.cancellation_policy || 'FLEXIBLE',
            breakfastIncluded: systemAmenities.some((a) => a.name.toLowerCase().includes('breakfast')),
          };
        });
      }
    } catch (roomErr) {
      // Rooms fetch failed — use mock data
      console.warn(`[api] getAvailableRooms for property "${propertyId}" failed:`, roomErr);
    }

    return {
      id: data.id,
      name: data.name,
      location: [data.city, data.state, data.country].filter(Boolean).join(', '),
      city: data.city || mockHotel?.city || '',
      country: data.country || mockHotel?.country || '',
      address: data.address || mockHotel?.address || '',
      rating: mockHotel?.rating ?? 4.5,
      review_count: mockHotel?.review_count ?? 0,
      starRating: mockHotel?.starRating ?? 4,
      price: mockHotel?.price ?? 0,
      currency: data.currency || mockHotel?.currency || 'NPR',
      description: data.description || mockHotel?.description || '',
      shortDescription: mockHotel?.shortDescription || data.description || data.name,
      images: allPhotos.length > 0 ? allPhotos : (mockHotel?.images ?? []),
      amenities: amenities.length > 0 ? amenities : (mockHotel?.amenities ?? []),
      roomTypes,
      reviews: mockHotel?.reviews ?? [],
      cancellationPolicy: mockHotel?.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.',
      checkInTime: data.check_in_time || (mockHotel?.checkInTime ?? '14:00'),
      checkOutTime: data.check_out_time || (mockHotel?.checkOutTime ?? '11:00'),
      phone: data.phone_number || (mockHotel?.phone ?? ''),
      email: data.email || (mockHotel?.email ?? ''),
      coordinates: (data.latitude && data.longitude)
        ? { lat: parseFloat(data.latitude) || 0, lng: parseFloat(data.longitude) || 0 }
        : mockHotel?.coordinates,
      availableRooms: data.total_rooms || (mockHotel?.availableRooms ?? 5),
      tags: amenities.slice(0, 4).map(a => a.name),
      brandColor: data.brand_color || mockHotel?.brandColor,
      logoUrl: data.brand_logo_url || mockHotel?.logoUrl,
      isSuperhost: mockHotel?.isSuperhost,
      category: mockHotel?.category,
      hostName: mockHotel?.hostName,
      hostAvatar: mockHotel?.hostAvatar,
      hostJoined: mockHotel?.hostJoined,
      hostReviews: mockHotel?.hostReviews,
    };
  } catch (err) {
    console.warn(`[api] getPropertyById for "${propertyId}" failed, using mock:`, err);
    return mockHotel;
  }
}
