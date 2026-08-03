import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_CONFIG, API_ENDPOINTS } from '@/constants/api-config';
import type {
  PortalType, TenantCreateRequest, TenantCreateResponse, AuthResponse,
  Hotel,
} from '@/types/api';
import { MOCK_PROPERTIES, searchHotels } from '@/lib/mock/properties';
import { getPortalStorageKeys, STORAGE_KEYS } from '@/constants/api-config';

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
      if (!activePortal) return false;

      const keys = getPortalStorageKeys(activePortal as PortalType);
      const refreshToken = await AsyncStorage.getItem(keys.REFRESH_TOKEN);
      if (!refreshToken) return false;

      const refreshEndpoint = activePortal === 'guest'
        ? API_ENDPOINTS.AUTH.GUEST_REFRESH
        : API_ENDPOINTS.AUTH.USER_REFRESH;

      const response = await fetch(`${API_BASE_URL}${refreshEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await AsyncStorage.multiRemove([keys.AUTH_TOKEN, keys.REFRESH_TOKEN, keys.USER_PROFILE]);
        return false;
      }

      const data: AuthResponse = await response.json();
      const ops: [string, string][] = [[keys.AUTH_TOKEN, data.access_token]];
      if (data.refresh_token) {
        ops.push([keys.REFRESH_TOKEN, data.refresh_token]);
      } else {
        ops.push([keys.REFRESH_TOKEN, refreshToken]); // keep old one
      }
      await Promise.all(ops.map(([k, v]) => AsyncStorage.setItem(k, v)));
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

interface RequestConfig extends Omit<RequestInit, 'headers'> {
  headers: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
}

function buildUrl(base: string, endpoint: string, params?: RequestConfig['params']): string {
  const url = new URL(`${base.replace(/\/$/, '')}${endpoint}`, base);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) url.searchParams.set(key, String(val));
    });
  }
  return url.toString();
}

function createApiClient(baseUrl: string = API_BASE_URL) {
  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];

  const api = {
    useRequestInterceptor: (interceptor: RequestInterceptor) => {
      requestInterceptors.push(interceptor);
    },
    useResponseInterceptor: (interceptor: ResponseInterceptor) => {
      responseInterceptors.push(interceptor);
    },
    request: async (endpoint: string, config: Partial<RequestConfig> = {}): Promise<Response> => {
      const { params, timeout = API_CONFIG.TIMEOUT, retries = API_CONFIG.RETRY_ATTEMPTS, ...fetchConfig } = config;

      let processedConfig: RequestConfig = {
        headers: { 'Content-Type': 'application/json' },
        ...fetchConfig,
        params,
      };

      for (const interceptor of requestInterceptors) {
        processedConfig = await interceptor(processedConfig);
      }

      const url = buildUrl(baseUrl, endpoint, processedConfig.params);
      const { params: _p, ...cleanConfig } = processedConfig;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const doFetch = async (attempt: number): Promise<Response> => {
        try {
          const response = await fetch(url, {
            ...cleanConfig,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          let processedResponse = response;

          // Auto-refresh on 401 (skip refresh endpoint to avoid loops)
          if (response.status === 401 && !endpoint.includes('/refresh')) {
            const refreshed = await attemptTokenRefresh();
            if (refreshed) {
              const newToken = await getActiveToken();
              if (newToken) {
                cleanConfig.headers = { ...cleanConfig.headers, Authorization: `Bearer ${newToken}` };
                return doFetch(attempt);
              }
            }
          }

          for (const interceptor of responseInterceptors) {
            processedResponse = await interceptor(processedResponse);
          }

          return processedResponse;
        } catch (error) {
          clearTimeout(timeoutId);
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, API_CONFIG.RETRY_DELAY * (attempt + 1)));
            return doFetch(attempt + 1);
          }
          throw error;
        }
      };

      return doFetch(0);
    },

    get: (endpoint: string, config?: Partial<RequestConfig>) =>
      api.request(endpoint, { ...config, method: 'GET' }),

    post: <T>(endpoint: string, body?: T, config?: Partial<RequestConfig>) =>
      api.request(endpoint, { ...config, method: 'POST', body: body ? JSON.stringify(body) : undefined }),

    put: <T>(endpoint: string, body?: T, config?: Partial<RequestConfig>) =>
      api.request(endpoint, { ...config, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

    patch: <T>(endpoint: string, body?: T, config?: Partial<RequestConfig>) =>
      api.request(endpoint, { ...config, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

    delete: (endpoint: string, config?: Partial<RequestConfig>) =>
      api.request(endpoint, { ...config, method: 'DELETE' }),
  };

  api.useRequestInterceptor((config) => {
    return config;
  });

  api.useResponseInterceptor(async (response) => {
    if (response.status === 401) {
      const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
      if (activePortal) {
        const keys = getPortalStorageKeys(activePortal as PortalType);
        await AsyncStorage.multiRemove([keys.AUTH_TOKEN, keys.REFRESH_TOKEN, keys.USER_PROFILE]);
      }
    }
    return response;
  });

  return api;
}

export const api = createApiClient();

export async function getActiveToken(): Promise<string | null> {
  const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
  if (!activePortal) return null;
  const keys = getPortalStorageKeys(activePortal as PortalType);
  return AsyncStorage.getItem(keys.AUTH_TOKEN);
}

export async function isDemoMode(): Promise<boolean> {
  const token = await getActiveToken();
  return token?.startsWith('demo-') ?? false;
}

api.useRequestInterceptor(async (config) => {
  const token = await getActiveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.error || parsed.message || parsed.detail || message;
    } catch {}
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

// ─── Tenants (SuperAdmin) ─────────────────────────────────────────
// Backend uses query params: PATCH/DELETE /tenants/?tenant_id=xxx

export async function createTenant(data: TenantCreateRequest): Promise<TenantCreateResponse> {
  if (await isDemoMode()) {
    return {
      id: 'tnt-' + Date.now().toString(36),
      name: data.brand_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  try {
    const response = await api.post(API_ENDPOINTS.TENANTS.CREATE, data);
    const json = await handleResponse<{ success: boolean; data: TenantCreateResponse }>(response);
    return json.data;
  } catch {
    return {
      id: 'tnt-' + Date.now().toString(36),
      name: data.brand_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function getTenants(): Promise<any[]> {
  if (await isDemoMode()) return [];
  try {
    const response = await api.get(API_ENDPOINTS.TENANTS.GET);
    const json = await handleResponse<{ success: boolean; data: any }>(response);
    const data = json.success !== false && json.data !== undefined ? json.data : json;
    return Array.isArray(data) ? data : (data.items || data.tenants || data.records || []);
  } catch {
    return [];
  }
}

export async function updateTenant(id: string, data: Record<string, unknown>): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    const response = await api.patch(API_ENDPOINTS.TENANTS.UPDATE, { ...data, tenant_id: id });
    return response.ok;
  } catch {
    return false;
  }
}

export async function deleteTenantApi(id: string): Promise<boolean> {
  if (await isDemoMode()) return false;
  try {
    const response = await api.delete(API_ENDPOINTS.TENANTS.DELETE, {
      params: { tenant_id: id },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ─── Search ────────────────────────────────────────────────────────

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

function mapSearchItemToHotel(item: BackendSearchItem, fallbackHotel?: Hotel): Hotel {
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
    amenities: item.amenities.map(a => ({ name: a, icon: '✨' })),
    roomTypes: fallbackHotel?.roomTypes ?? [],
    reviews: fallbackHotel?.reviews ?? [],
    cancellationPolicy: fallbackHotel?.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.',
    checkInTime: fallbackHotel?.checkInTime ?? '14:00',
    checkOutTime: fallbackHotel?.checkOutTime ?? '11:00',
    phone: fallbackHotel?.phone ?? '',
    email: fallbackHotel?.email ?? '',
    coordinates: fallbackHotel?.coordinates,
    availableRooms: fallbackHotel?.availableRooms ?? 5,
    tags: item.amenities.slice(0, 4),
    brandColor: fallbackHotel?.brandColor,
    logoUrl: fallbackHotel?.logoUrl,
    isSuperhost: fallbackHotel?.isSuperhost,
    category: item.type || fallbackHotel?.category,
    hostName: fallbackHotel?.hostName,
    hostAvatar: fallbackHotel?.hostAvatar,
    hostJoined: fallbackHotel?.hostJoined,
    hostReviews: fallbackHotel?.hostReviews,
  };
}

function mapPropertyToHotel(p: BackendPropertyResponse): Hotel {
  const allPhotos: string[] = [];
  if (p.photos) {
    for (const arr of [p.photos.exterior, p.photos.lobby, p.photos.rooms, p.photos.dining, p.photos.amenities]) {
      if (Array.isArray(arr)) allPhotos.push(...arr);
      else if (typeof arr === 'string' && arr) allPhotos.push(arr);
    }
  }
  const amenities = [
    ...(p.system_amenities || []).map(a => ({ name: a.name, icon: a.icon || '✨' })),
    ...(p.custom_amenities || []).map(a => ({ name: a.name, icon: '✨' })),
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
  };
}

async function tryFetchHostProperties(): Promise<Hotel[]> {
  try {
    const hostToken = await AsyncStorage.getItem(getPortalStorageKeys('host').AUTH_TOKEN);
    if (!hostToken) return [];
    const resp = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROPERTIES.GET_ALL}`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const data: { tenant_id?: string; properties?: BackendPropertyResponse[] } = json.data ?? json;
    const props = data.properties ?? [];
    if (props.length === 0) return [];
    return props.filter(p => p.is_active !== false).map(mapPropertyToHotel);
  } catch {
    return [];
  }
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
}): Promise<{ hotels: Hotel[]; fromApi: boolean }> {
  try {
    const queryParams: Record<string, string | number> = {
      destination: params.destination,
      check_in: params.checkIn || new Date().toISOString().split('T')[0],
      check_out: params.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };
    if (params.adults) queryParams.adults = params.adults;
    if (params.children) queryParams.children = params.children;
    if (params.rooms) queryParams.rooms = params.rooms;
    if (params.limit) queryParams.limit = params.limit;
    if (params.skip) queryParams.skip = params.skip;

    const response = await api.get(API_ENDPOINTS.SEARCH.SEARCH_HOTELS, { params: queryParams });
    const json = await response.json();

    const data: BackendSearchResponse = json.data ?? json;
    const results: BackendSearchItem[] = data.results ?? [];

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

    return { hotels: enriched, fromApi: true };
  } catch {
    try {
      const mockResults = searchHotels({
        location: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: (params.adults ?? 1) + (params.children ?? 0),
      });
      return { hotels: mockResults, fromApi: false };
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
    amenities: (item.amenities || []).map(a => ({ name: a, icon: '✨' })),
    roomTypes: fallbackHotel?.roomTypes ?? [],
    reviews: fallbackHotel?.reviews ?? [],
    cancellationPolicy: fallbackHotel?.cancellationPolicy ?? 'Free cancellation up to 24 hours before check-in.',
    checkInTime: fallbackHotel?.checkInTime ?? '14:00',
    checkOutTime: fallbackHotel?.checkOutTime ?? '11:00',
    phone: fallbackHotel?.phone ?? '',
    email: fallbackHotel?.email ?? '',
    coordinates: fallbackHotel?.coordinates,
    availableRooms: fallbackHotel?.availableRooms ?? 5,
    tags: (item.amenities || []).slice(0, 4),
    brandColor: fallbackHotel?.brandColor,
    logoUrl: fallbackHotel?.logoUrl,
    isSuperhost: fallbackHotel?.isSuperhost,
    category: item.type || fallbackHotel?.category,
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

    const response = await api.get(API_ENDPOINTS.SEARCH.SEARCH_NEARBY, { params: queryParams });
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

// ─── Available Rooms ────────────────────────────────────────────

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
  system_amenities?: string[];
  custom_amenities?: string[];
}

export async function getAvailableRoomsApi(
  propertyId: string,
  checkin: string,
  checkout: string,
): Promise<AvailableRoom[]> {
  try {
    const response = await api.get(API_ENDPOINTS.AVAILABLE_ROOMS(propertyId, checkin, checkout));
    const json = await response.json();
    const data = json.success ? json.data : (Array.isArray(json) ? json : []);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Property Detail ───────────────────────────────────────────────

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
  photos: { exterior?: string[]; lobby?: string[]; rooms?: string[]; dining?: string[]; amenities?: string[] } | null;
}

export async function getPropertyById(propertyId: string): Promise<Hotel | null> {
  const mockHotel = MOCK_PROPERTIES.find(h => h.id === propertyId) || null;

  try {
    // Try public endpoint first (no auth required — guests can browse)
    const response = await api.get(API_ENDPOINTS.PROPERTIES.GET_BY_ID_PUBLIC(propertyId));
    const json = await response.json();
    const data: BackendPropertyResponse = json.data ?? json;
    if (!data || !data.id) return mockHotel;

    const allPhotos: string[] = [];
    if (data.photos) {
      const photoArrays = [data.photos.exterior, data.photos.lobby, data.photos.rooms, data.photos.dining, data.photos.amenities];
      for (const arr of photoArrays) {
        if (Array.isArray(arr)) allPhotos.push(...arr);
        else if (typeof arr === 'string' && arr) allPhotos.push(arr);
      }
    }

    const amenitiesMap = new Map<string, { name: string; icon: string }>();
    for (const a of (data.system_amenities || [])) {
      amenitiesMap.set(a.name, { name: a.name, icon: a.icon || '✨' });
    }
    for (const a of (data.custom_amenities || [])) {
      if (!amenitiesMap.has(a.name)) amenitiesMap.set(a.name, { name: a.name, icon: '✨' });
    }
    const amenities = Array.from(amenitiesMap.values());

    // Fetch rooms from backend
    let roomTypes: Hotel['roomTypes'] = mockHotel?.roomTypes ?? [];
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const roomsRes = await api.get(API_ENDPOINTS.AVAILABLE_ROOMS(data.id, today, nextWeek));
      const roomsJson = await roomsRes.json();
      const roomsData = roomsJson.success ? roomsJson.data : (Array.isArray(roomsJson) ? roomsJson : []);
      if (Array.isArray(roomsData) && roomsData.length > 0) {
        // Map backend rooms to guest RoomType format
        const grouped = new Map<string, AvailableRoom[]>();
        for (const room of roomsData) {
          const key = room.room_type || room.room_name;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(room);
        }
        roomTypes = Array.from(grouped.entries()).map(([typeName, rooms]) => {
          const first = rooms[0];
          const price = parseFloat(first.base_rate) || 0;
          const roomImage = first.photos?.cover || (allPhotos.length > 0 ? allPhotos[0] : '');
          return {
            id: first.id,
            name: typeName || first.room_name,
            price,
            currency: data.currency || 'NPR',
            occupancy: `${first.max_adults} adults${first.max_children > 0 ? `, ${first.max_children} children` : ''}`,
            bed: first.bed_type || 'Standard',
            description: first.cancellation_description || first.cancellation_title || 'Comfortable room',
            available: rooms.length,
            amenities: [...(first.system_amenities || []), ...(first.custom_amenities || [])].filter(Boolean),
            image: roomImage,
            gallery: first.photos?.gallery || [],
            totalRooms: rooms.length,
            bedType: first.bed_type,
            areaSqFt: undefined,
            cancellationPolicy: first.cancellation_policy || 'FLEXIBLE',
            breakfastIncluded: (first.system_amenities || []).some((a: string) => a.toLowerCase().includes('breakfast')),
          };
        });
      }
    } catch {
      // Rooms fetch failed — use mock data
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
  } catch {
    return mockHotel;
  }
}

