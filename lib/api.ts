import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_CONFIG, API_ENDPOINTS } from '@/constants/api-config';
import type {
  PortalType, BookingRequest, BookingResponse, TenantCreateRequest, TenantCreateResponse, AuthResponse,
} from '@/types/api';
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
      await Promise.all([
        AsyncStorage.setItem(keys.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(keys.REFRESH_TOKEN, data.refresh_token),
      ]);
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

/**
 * Mock API functions — return local mock data instead of hitting the backend.
 * This makes the entire project functional offline with zero backend dependencies.
 */

export async function createTenant(data: TenantCreateRequest): Promise<TenantCreateResponse> {
  try {
    const response = await api.post(API_ENDPOINTS.TENANTS.CREATE, data);
    const json = await handleResponse<{ success: boolean; data: TenantCreateResponse }>(response);
    return json.data;
  } catch {
    // Backend unavailable — return mock response
    return {
      id: 'tnt-' + Date.now().toString(36),
      name: data.brand_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function getTenants(): Promise<any[]> {
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
  try {
    const response = await api.patch(API_ENDPOINTS.TENANTS.UPDATE(id), data);
    return response.ok;
  } catch {
    return false;
  }
}

export async function deleteTenantApi(id: string): Promise<boolean> {
  try {
    const response = await api.delete(API_ENDPOINTS.TENANTS.DELETE(id));
    return response.ok;
  } catch {
    return false;
  }
}

export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  try {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CREATE, data);
    return handleResponse<BookingResponse>(response);
  } catch {
    // Backend unavailable — return mock response
    const bookingRef = 'BK-' + Date.now().toString(36).toUpperCase();
    const basePrice = data.add_ons
      ? data.add_ons.reduce((s, a) => s + a.price * a.quantity, 0)
      : 0;
    const nights = data.check_in_date && data.check_out_date
      ? Math.max(1, Math.ceil((new Date(data.check_out_date).getTime() - new Date(data.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    return {
      id: Date.now().toString(36),
      booking_reference: bookingRef,
      hotel_id: data.hotel_id,
      room_type_id: data.room_type_id,
      guest_id: 'demo-1',
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      number_of_guests: data.number_of_guests,
      number_of_rooms: data.number_of_rooms,
      status: 'Confirmed',
      total_price: basePrice || 5000 * nights,
      currency: 'NPR',
      pricing_breakdown: {
        base_price: basePrice || 5000 * nights,
        taxes: Math.round((basePrice || 5000 * nights) * 0.13),
        discount: 0,
        add_ons: 0,
        total: Math.round((basePrice || 5000 * nights) * 1.13),
      },
      payment_status: 'Completed',
      qr_code: undefined,
      confirmation_code: bookingRef,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
