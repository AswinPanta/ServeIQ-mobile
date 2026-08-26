import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_CONFIG, API_ENDPOINTS, getPortalStorageKeys, STORAGE_KEYS } from '@/constants/api-config';
import type { AuthResponse, PortalType } from '@/types/api';

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
        headers: { 'Content-Type': 'application/json', ...fetchConfig.headers },
        ...fetchConfig,
        params,
      };

      for (const interceptor of requestInterceptors) {
        processedConfig = await interceptor(processedConfig);
      }

      const url = buildUrl(baseUrl, endpoint, processedConfig.params);
      const { params: _p, ...cleanConfig } = processedConfig;

      const doFetch = async (attempt: number): Promise<Response> => {
        // Fresh AbortController per attempt: a controller that already fired
        // (timeout/abort) stays aborted forever, so reusing it across retries
        // would make every retry reject instantly with AbortError.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
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
    } catch {
      // Raw error body is not JSON — keep the HTTP status message
    }
    const error = new Error(message) as Error & { status?: number; isServerError?: boolean };
    error.status = response.status;
    error.isServerError = true;
    throw error;
  }
  const text = await response.text();
  if (!text) return {} as T;
  const contentType = response.headers?.get?.('content-type') || '';
  if (!contentType.includes('application/json')) {
    return text as unknown as T;
  }
  return JSON.parse(text) as T;
}
