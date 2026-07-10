import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS, getPortalStorageKeys } from '@/constants/api-config';
import type {
  GuestProfile,
  HostProfile,
  OperatorProfile,
  SuperAdminProfile,
  AuthResponse,
  PortalType,
  PortalProfile,
} from '@/types/api';

interface AuthContextType {
  user: PortalProfile | null;
  portal: PortalType | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isGuest: boolean;
  isHost: boolean;
  isOperator: boolean;
  isSuperAdmin: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  login: (email: string, password: string, portal?: PortalType) => Promise<void>;
  demoLogin: (portal?: PortalType) => Promise<void>;
  register: (email: string, phone: string, name: string, password: string, portal?: PortalType) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPortal: (portal: PortalType) => Promise<void>;
  setUser: (user: PortalProfile | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PORTAL_LOGIN_ENDPOINTS: Record<string, string> = {
  guest: API_ENDPOINTS.AUTH.GUEST_LOGIN,
  host: API_ENDPOINTS.AUTH.USER_LOGIN,
  operations: API_ENDPOINTS.AUTH.USER_LOGIN,
  superadmin: API_ENDPOINTS.AUTH.USER_LOGIN,
};

const PORTAL_ME_ENDPOINTS: Record<string, string> = {
  guest: API_ENDPOINTS.AUTH.GUEST_ME,
  host: API_ENDPOINTS.AUTH.USER_ME,
  operations: API_ENDPOINTS.AUTH.USER_ME,
  superadmin: API_ENDPOINTS.AUTH.USER_ME,
};

function makeDemoUser(portal: PortalType, propertyOverride?: { id: string; name: string }): PortalProfile {
  const now = new Date().toISOString();
  switch (portal) {
    case 'host':
      return {
        id: 'demo-host-1',
        email: 'host@stayeasy.com',
        name: 'Demo Host',
        firstName: 'Demo',
        lastName: 'Host',
        phone: '+977-9841234567',
        is_verified: true,
        properties_count: 3,
        total_bookings: 47,
        rating: 4.6,
        created_at: now,
        updated_at: now,
      } as HostProfile;
    case 'operations':
      return {
        id: 'demo-ops-1',
        email: 'ops@stayeasy.com',
        name: 'Demo Operator',
        role: 'front_desk',
        property_id: propertyOverride?.id || 'prop-1',
        property_name: propertyOverride?.name || 'Grand Hotel Kathmandu',
        is_verified: true,
        created_at: now,
        updated_at: now,
      } as OperatorProfile;
    case 'superadmin':
      return {
        id: 'demo-sa-1',
        email: 'admin@stayeasy.com',
        name: 'Demo Admin',
        role: 'SUPER_ADMIN',
        is_verified: true,
        created_at: now,
        updated_at: now,
      } as SuperAdminProfile;
    default:
      return {
        id: 'demo-1',
        email: 'demo@stayeasy.com',
        phone: '+977-9841234567',
        name: 'Demo User',
        nationality: 'Nepal',
        country: 'NP',
        currency: 'NPR',
        profile_image: '',
        is_verified: true,
        loyalty_points: 1250,
        created_at: now,
        updated_at: now,
      } as GuestProfile;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalProfile | null>(null);
  const [portal, setPortal] = useState<PortalType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
        if (activePortal && isPortalType(activePortal)) {
          setPortal(activePortal);
          const keys = getPortalStorageKeys(activePortal);
          const [storedAccessToken, storedRefreshToken, storedUserProfile] = await Promise.all([
            AsyncStorage.getItem(keys.AUTH_TOKEN),
            AsyncStorage.getItem(keys.REFRESH_TOKEN),
            AsyncStorage.getItem(keys.USER_PROFILE),
          ]);

          if (storedAccessToken && storedRefreshToken) {
            setTokens({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
            });
            if (storedUserProfile) {
              setUser(JSON.parse(storedUserProfile));
            }
            // Verify token with backend — only clear session on auth errors (401/403), not network errors
            try {
              const ep = activePortal === 'guest' ? API_ENDPOINTS.AUTH.GUEST_ME : API_ENDPOINTS.AUTH.USER_ME;
              const meRes = await fetch(`${API_BASE_URL}${ep}`, {
                headers: { Authorization: `Bearer ${storedAccessToken}` },
              });
              if (meRes.status === 401 || meRes.status === 403) {
                throw new Error(`Auth error: ${meRes.status}`);
              }
            } catch (err: unknown) {
              // Only clear session on actual auth rejection (401/403 from server response)
              // Network errors (fetch throws) keep the demo session alive
              if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Auth error'))) {
                setTokens({ accessToken: null, refreshToken: null });
                setUser(null);
                const keys = getPortalStorageKeys(activePortal);
                await Promise.all([
                  AsyncStorage.removeItem(keys.AUTH_TOKEN),
                  AsyncStorage.removeItem(keys.REFRESH_TOKEN),
                  AsyncStorage.removeItem(keys.USER_PROFILE),
                ]);
                await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PORTAL);
              }
              // Network errors — keep the stored session, it's valid mock data
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const isPortalType = (value: string): value is PortalType => {
    return ['guest', 'host', 'operations', 'superadmin'].includes(value);
  };

  const saveSession = async (portalType: PortalType, accessToken: string, refreshToken: string, profile: PortalProfile) => {
    const keys = getPortalStorageKeys(portalType);
    await Promise.all([
      AsyncStorage.setItem(keys.AUTH_TOKEN, accessToken),
      AsyncStorage.setItem(keys.REFRESH_TOKEN, refreshToken),
      AsyncStorage.setItem(keys.USER_PROFILE, JSON.stringify(profile)),
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, portalType),
    ]);
  };

  const clearSession = async (portalType?: PortalType) => {
    if (portalType) {
      const keys = getPortalStorageKeys(portalType);
      await Promise.all([
        AsyncStorage.removeItem(keys.AUTH_TOKEN),
        AsyncStorage.removeItem(keys.REFRESH_TOKEN),
        AsyncStorage.removeItem(keys.USER_PROFILE),
      ]);
    } else {
      for (const p of ['guest', 'host', 'operations', 'superadmin'] as PortalType[]) {
        const keys = getPortalStorageKeys(p);
        await Promise.all([
          AsyncStorage.removeItem(keys.AUTH_TOKEN),
          AsyncStorage.removeItem(keys.REFRESH_TOKEN),
          AsyncStorage.removeItem(keys.USER_PROFILE),
        ]);
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PORTAL);
    }
  };

  const login = useCallback(async (email: string, password: string, portalType?: PortalType) => {
    const targetPortal = portalType || 'guest';
    try {
      setIsLoading(true);
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const response = await fetch(`${API_BASE_URL}${PORTAL_LOGIN_ENDPOINTS[targetPortal]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      let data: AuthResponse;
      let rawBody: Record<string, unknown>;
      try {
        rawBody = await response.json();
      } catch {
        throw new Error(`Login failed (HTTP ${response.status})`);
      }

      // Handle StandardResponse wrapper: { success: true, data: { access_token, ... } }
      if (rawBody.success === true && rawBody.data) {
        data = rawBody.data as AuthResponse;
      } else if (rawBody.access_token) {
        data = rawBody as unknown as AuthResponse;
      } else {
        throw new Error((rawBody.error as string) || (rawBody.detail as string) || (rawBody.message as string) || 'Login failed');
      }

      const profileResponse = await fetch(
        `${API_BASE_URL}${PORTAL_ME_ENDPOINTS[targetPortal]}`,
        { headers: { Authorization: `Bearer ${data.access_token}` } },
      );

      let profile: PortalProfile;
      if (profileResponse.ok) {
        const rawProfile = await profileResponse.json();
        const profileData = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
        // Map API full_name → name for GuestProfile compatibility
        profile = {
          ...profileData,
          name: profileData.full_name || profileData.name,
          full_name: profileData.full_name,
        } as PortalProfile;
      } else {
        profile = makeDemoUser(targetPortal);
      }

      await saveSession(targetPortal, data.access_token, data.refresh_token, profile);
      setPortal(targetPortal);
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      setUser(profile);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, phone: string, name: string, password: string, portalType?: PortalType) => {
    const targetPortal = portalType || 'guest';
    try {
      setIsLoading(true);
      const endpoint = targetPortal === 'guest'
        ? API_ENDPOINTS.AUTH.GUEST_REGISTER
        : API_ENDPOINTS.AUTH.USER_REGISTER;
      const body = targetPortal === 'guest'
        ? { full_name: name, email, password, phone: phone || undefined }
        : { full_name: name, email, password, phone: phone || undefined };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || errorBody.detail?.[0]?.msg || errorBody.message || 'Registration failed');
      }
      // Registration successful — no token needed, user will verify OTP next
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_VERIFY_OTP}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || errorBody.message || 'OTP verification failed');
      }
      let rawBody: Record<string, unknown>;
      try {
        rawBody = await response.json();
      } catch {
        throw new Error(`OTP verification failed (HTTP ${response.status})`);
      }
      const data: AuthResponse = (rawBody.success === true && rawBody.data) ? (rawBody.data as AuthResponse) : (rawBody as unknown as AuthResponse);
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      const profileResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_ME}`,
        { headers: { Authorization: `Bearer ${data.access_token}` } },
      );
      if (profileResponse.ok) {
        const rawProfile = await profileResponse.json();
        const profileData = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
        const profile: GuestProfile = {
          ...profileData,
          name: profileData.full_name || profileData.name,
          full_name: profileData.full_name,
        };
        await Promise.all([
          AsyncStorage.setItem(getPortalStorageKeys('guest').USER_PROFILE, JSON.stringify(profile)),
          AsyncStorage.setItem(getPortalStorageKeys('guest').AUTH_TOKEN, data.access_token),
          AsyncStorage.setItem(getPortalStorageKeys('guest').REFRESH_TOKEN, data.refresh_token),
          AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, 'guest'),
        ]);
        setPortal('guest');
        setUser(profile);
      } else {
        // Fall back to demo profile
        await saveSession('guest', data.access_token, data.refresh_token, makeDemoUser('guest'));
        setUser(makeDemoUser('guest'));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email: string) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_RESEND_OTP}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || errorBody.message || 'Failed to resend OTP');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      if (portal) {
        await clearSession(portal);
      } else {
        await clearSession();
      }
      setUser(null);
      setPortal(null);
      setTokens({ accessToken: null, refreshToken: null });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [portal]);

  const switchPortal = useCallback(async (newPortal: PortalType) => {
    try {
      setIsLoading(true);
      setUser(null);
      setTokens({ accessToken: null, refreshToken: null });
      const keys = getPortalStorageKeys(newPortal);
      const [storedAccessToken, storedRefreshToken, storedUserProfile] = await Promise.all([
        AsyncStorage.getItem(keys.AUTH_TOKEN),
        AsyncStorage.getItem(keys.REFRESH_TOKEN),
        AsyncStorage.getItem(keys.USER_PROFILE),
      ]);
      setPortal(newPortal);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, newPortal);
      if (storedAccessToken && storedRefreshToken) {
        setTokens({ accessToken: storedAccessToken, refreshToken: storedRefreshToken });
        if (storedUserProfile) {
          setUser(JSON.parse(storedUserProfile));
        }
      }
    } catch (error) {
      console.error('Switch portal error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (portalType?: PortalType) => {
    const targetPortal = portalType || 'guest';
    try {
      setIsLoading(true);
      // For ops login, read the host's selected property from AsyncStorage
      let propertyOverride: { id: string; name: string } | undefined;
      if (targetPortal === 'operations') {
        const [savedId, savedName] = await Promise.all([
          AsyncStorage.getItem('@stayeasy_default_ops_property_id'),
          AsyncStorage.getItem('@stayeasy_default_ops_property_name'),
        ]);
        if (savedId && savedName) {
          propertyOverride = { id: savedId, name: savedName };
        }
      }
      const demoUser = makeDemoUser(targetPortal, propertyOverride);
      const demoToken = `demo-${targetPortal}-token`;
      const demoRefresh = `demo-${targetPortal}-refresh`;
      await saveSession(targetPortal, demoToken, demoRefresh, demoUser);
      setPortal(targetPortal);
      setTokens({ accessToken: demoToken, refreshToken: demoRefresh });
      setUser(demoUser);
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const internalSetTokens = useCallback(
    (newTokens: { accessToken: string; refreshToken: string }) => {
      setTokens(newTokens);
    },
    [],
  );

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!tokens.refreshToken || !portal) throw new Error('No refresh token available');
      const refreshEndpoint = portal === 'guest'
        ? API_ENDPOINTS.AUTH.GUEST_REFRESH
        : API_ENDPOINTS.AUTH.USER_REFRESH;
      const response = await fetch(`${API_BASE_URL}${refreshEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });
      if (!response.ok) {
        await logout();
        throw new Error('Token refresh failed');
      }
      const rawBody = await response.json();
      const data: AuthResponse = (rawBody.success === true && rawBody.data) ? rawBody.data : rawBody;
      const keys = getPortalStorageKeys(portal);
      await Promise.all([
        AsyncStorage.setItem(keys.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(keys.REFRESH_TOKEN, data.refresh_token),
      ]);
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }, [tokens.refreshToken, portal, logout]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      portal,
      isLoading,
      isSignedIn: !!tokens.accessToken,
      isGuest: portal === 'guest',
      isHost: portal === 'host',
      isOperator: portal === 'operations',
      isSuperAdmin: portal === 'superadmin',
      tokens,
      login,
      demoLogin,
      register,
      verifyOTP,
      resendOTP,
      logout,
      switchPortal,
      setUser,
      setTokens: internalSetTokens,
      refreshAccessToken,
    }),
    [
      user,
      portal,
      isLoading,
      tokens,
      login,
      demoLogin,
      register,
      verifyOTP,
      resendOTP,
      logout,
      switchPortal,
      setUser,
      internalSetTokens,
      refreshAccessToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
