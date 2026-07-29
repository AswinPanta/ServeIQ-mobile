import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS, getPortalStorageKeys } from '@/constants/api-config';
import { findDemoAccount, DEMO_ACCOUNTS, type DemoAccount } from '@/constants/demo-accounts';
import type {
  GuestProfile,
  HostProfile,
  OperatorProfile,
  SuperAdminProfile,
  AuthResponse,
  PortalType,
  PortalProfile,
  OperatorRole,
} from '@/types/api';

interface AuthContextType {
  user: PortalProfile | null;
  portal: PortalType | null;
  operatorRole: OperatorRole | null;
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
  login: (email: string, password: string) => Promise<PortalType>;
  demoLogin: (role: string) => Promise<PortalType>;
  register: (email: string, phone: string, name: string, password: string, portal?: PortalType) => Promise<void>;
  verifyOTP: (email: string, otp: string, portal?: PortalType) => Promise<void>;
  resendOTP: (email: string, portal?: PortalType) => Promise<void>;
  logout: () => Promise<void>;
  switchPortal: (portal: PortalType) => Promise<void>;
  setUser: (user: PortalProfile | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function makeDemoUser(account: DemoAccount): PortalProfile {
  const now = new Date().toISOString();
  const propertyOverride = { id: 'prop-1', name: 'Grand Hotel Kathmandu' };

  if (account.portal === 'host') {
    return {
      id: 'demo-host-1',
      email: account.email,
      name: account.name,
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
  }

  if (account.portal === 'operations') {
    return {
      id: `demo-ops-${account.operatorRole}`,
      email: account.email,
      name: account.name,
      role: account.operatorRole || 'front_desk',
      property_id: propertyOverride.id,
      property_name: propertyOverride.name,
      is_verified: true,
      created_at: now,
      updated_at: now,
    } as OperatorProfile;
  }

  if (account.portal === 'superadmin') {
    return {
      id: 'demo-sa-1',
      email: account.email,
      name: account.name,
      role: 'SUPER_ADMIN',
      is_verified: true,
      created_at: now,
      updated_at: now,
    } as SuperAdminProfile;
  }

  // Guest
  return {
    id: 'demo-guest-1',
    email: account.email,
    phone: '+977-9841234567',
    name: account.name,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalProfile | null>(null);
  const [portal, setPortal] = useState<PortalType | null>(null);
  const [operatorRole, setOperatorRole] = useState<OperatorRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null,
  });

  const isPortalType = (value: string): value is PortalType => {
    return ['guest', 'host', 'operations', 'superadmin'].includes(value);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
        if (activePortal && isPortalType(activePortal)) {
          setPortal(activePortal);
          const keys = getPortalStorageKeys(activePortal);
          const [storedAccessToken, storedRefreshToken, storedUserProfile, storedOpRole] = await Promise.all([
            AsyncStorage.getItem(keys.AUTH_TOKEN),
            AsyncStorage.getItem(keys.REFRESH_TOKEN),
            AsyncStorage.getItem(keys.USER_PROFILE),
            AsyncStorage.getItem('@stayeasy_operator_role'),
          ]);

          if (storedOpRole) {
            setOperatorRole(storedOpRole as OperatorRole);
          }

          if (storedAccessToken && storedRefreshToken) {
            setTokens({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
            });
            if (storedUserProfile) {
              setUser(JSON.parse(storedUserProfile));
            }
            try {
              const ep = activePortal === 'guest' ? API_ENDPOINTS.AUTH.GUEST_ME : API_ENDPOINTS.AUTH.USER_ME;
              const meRes = await fetch(`${API_BASE_URL}${ep}`, {
                headers: { Authorization: `Bearer ${storedAccessToken}` },
              });
              if (meRes.status === 401 || meRes.status === 403) {
                throw new Error(`Auth error: ${meRes.status}`);
              }
            } catch (err: unknown) {
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

  const saveSession = async (portalType: PortalType, accessToken: string | null | undefined, refreshToken: string | null | undefined, profile: PortalProfile, opRole?: OperatorRole | null) => {
    const safeAccessToken = accessToken ?? `demo-${portalType}-token`;
    const safeRefreshToken = refreshToken ?? `demo-${portalType}-refresh`;
    const keys = getPortalStorageKeys(portalType);
    await Promise.all([
      AsyncStorage.setItem(keys.AUTH_TOKEN, safeAccessToken),
      AsyncStorage.setItem(keys.REFRESH_TOKEN, safeRefreshToken),
      AsyncStorage.setItem(keys.USER_PROFILE, JSON.stringify(profile)),
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, portalType),
      opRole !== undefined ? AsyncStorage.setItem('@stayeasy_operator_role', opRole || '') : Promise.resolve(),
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
    await AsyncStorage.removeItem('@stayeasy_operator_role');
  };

  /**
   * Unified login — tries demo accounts first, then backend.
   * Returns the portal type so the caller can route.
   */
  const login = useCallback(async (email: string, password: string): Promise<PortalType> => {
    try {
      setIsLoading(true);

      // 1) Check hardcoded demo accounts first
      const demoAccount = findDemoAccount(email, password);
      if (demoAccount) {
        const demoUser = makeDemoUser(demoAccount);
        const demoToken = `demo-${demoAccount.portal}-token`;
        const demoRefresh = `demo-${demoAccount.portal}-refresh`;
        await saveSession(demoAccount.portal, demoToken, demoRefresh, demoUser, demoAccount.operatorRole || null);
        setPortal(demoAccount.portal);
        setOperatorRole(demoAccount.operatorRole || null);
        setTokens({ accessToken: demoToken, refreshToken: demoRefresh });
        setUser(demoUser);
        return demoAccount.portal;
      }

      // 2) Try backend API — unified /auth/login endpoint
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      let lastError: string = 'Login failed';

      try {
        // Single login endpoint — backend tries guest then user internally
        const loginRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
          method: 'POST',
          body: formData,
          // No Content-Type header — let browser set multipart/form-data with boundary
        });

        if (loginRes.ok) {
          const rawBody = await loginRes.json();
          const data: AuthResponse | null = (rawBody.success === true && rawBody.data)
            ? rawBody.data as AuthResponse
            : rawBody.access_token
              ? rawBody as unknown as AuthResponse
              : null;

          if (data) {
            const token = data.access_token;

            // Probe /auth/guests/me first — if 200, it's a guest
            // If 401/403, try /auth/users/me to determine portal
            let profile: PortalProfile;
            let detectedPortal: PortalType = 'guest';
            let detectedOpRole: OperatorRole | null = null;

            const guestMeRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_ME}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (guestMeRes.ok) {
              const rawProfile = await guestMeRes.json();
              const pd = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
              profile = { ...pd, name: pd.full_name || pd.name, full_name: pd.full_name } as GuestProfile;
              detectedPortal = 'guest';
            } else {
              // Not a guest — try user endpoint
              const userMeRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.USER_ME}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (userMeRes.ok) {
                const rawProfile = await userMeRes.json();
                const pd = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
                const role = pd.role || '';

                if (role === 'SUPER_ADMIN') {
                  detectedPortal = 'superadmin';
                  profile = { ...pd, name: pd.full_name || pd.name, role: 'SUPER_ADMIN' } as SuperAdminProfile;
                } else if (['front_desk', 'housekeeping', 'pos', 'kds', 'manager'].includes(role)) {
                  detectedPortal = 'operations';
                  detectedOpRole = role as OperatorRole;
                  profile = { ...pd, name: pd.full_name || pd.name, role } as OperatorProfile;
                } else {
                  detectedPortal = 'host';
                  profile = { ...pd, name: pd.full_name || pd.name, firstName: pd.first_name, lastName: pd.last_name } as HostProfile;
                }
              } else {
                // Both /me endpoints failed — use token but set guest as default
                profile = { email, name: email.split('@')[0] } as GuestProfile;
                detectedPortal = 'guest';
              }
            }

            const loginRefreshToken = data.refresh_token || data.access_token;
            await saveSession(detectedPortal, data.access_token, loginRefreshToken, profile, detectedOpRole);
            setPortal(detectedPortal);
            setOperatorRole(detectedOpRole);
            setTokens({ accessToken: data.access_token, refreshToken: loginRefreshToken });
            setUser(profile);
            return detectedPortal;
          }
        } else {
          const errBody = await loginRes.json().catch(() => ({}));
          lastError = errBody.error || errBody.detail || 'Login failed';
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Network error';
      }

      throw new Error(lastError);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Demo login — instant access using hardcoded demo accounts.
   * Returns the portal type so the caller can route.
   */
  const demoLogin = useCallback(async (role: string): Promise<PortalType> => {
    // Import at call time to avoid circular deps
    const { DEMO_ACCOUNTS } = await import('@/constants/demo-accounts');
    const demoAccount = DEMO_ACCOUNTS[role];
    if (!demoAccount) {
      throw new Error(`Unknown demo role: ${role}`);
    }

    try {
      setIsLoading(true);
      const demoUser = makeDemoUser(demoAccount);
      const demoToken = `demo-${demoAccount.portal}-token`;
      const demoRefresh = `demo-${demoAccount.portal}-refresh`;
      await saveSession(demoAccount.portal, demoToken, demoRefresh, demoUser, demoAccount.operatorRole || null);
      setPortal(demoAccount.portal);
      setOperatorRole(demoAccount.operatorRole || null);
      setTokens({ accessToken: demoToken, refreshToken: demoRefresh });
      setUser(demoUser);
      return demoAccount.portal;
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, phone: string, name: string, password: string, portal?: PortalType) => {
    try {
      setIsLoading(true);
      const body = { full_name: name, email, password, phone: phone || undefined };
      const endpoint = portal === 'host' ? API_ENDPOINTS.AUTH.USER_REGISTER : API_ENDPOINTS.AUTH.GUEST_REGISTER;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        if (response.status >= 500) {
          throw new Error('Our servers are temporarily unavailable. Please try the demo login instead.');
        }
        throw new Error(errorBody.error || errorBody.detail?.[0]?.msg || errorBody.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string, portal?: PortalType) => {
    try {
      setIsLoading(true);
      const targetPortal = portal || 'guest';
      const verifyEndpoint = targetPortal === 'host' ? API_ENDPOINTS.AUTH.USER_VERIFY_OTP : API_ENDPOINTS.AUTH.GUEST_VERIFY_OTP;
      const meEndpoint = targetPortal === 'host' ? API_ENDPOINTS.AUTH.USER_ME : API_ENDPOINTS.AUTH.GUEST_ME;
      const response = await fetch(`${API_BASE_URL}${verifyEndpoint}`, {
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
      const otpAccessToken = data.access_token ?? `demo-${targetPortal}-token`;
      const otpRefreshToken = data.refresh_token ?? `demo-${targetPortal}-refresh`;
      setTokens({ accessToken: otpAccessToken, refreshToken: otpRefreshToken });
      const profileResponse = await fetch(
        `${API_BASE_URL}${meEndpoint}`,
        { headers: { Authorization: `Bearer ${otpAccessToken}` } },
      );
      if (profileResponse.ok) {
        const rawProfile = await profileResponse.json();
        const profileData = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
        const profile = targetPortal === 'guest'
          ? { ...profileData, name: profileData.full_name || profileData.name, full_name: profileData.full_name } as GuestProfile
          : { ...profileData, name: profileData.full_name || profileData.name, full_name: profileData.full_name } as PortalProfile;
        await Promise.all([
          AsyncStorage.setItem(getPortalStorageKeys(targetPortal).USER_PROFILE, JSON.stringify(profile)),
          AsyncStorage.setItem(getPortalStorageKeys(targetPortal).AUTH_TOKEN, otpAccessToken),
          AsyncStorage.setItem(getPortalStorageKeys(targetPortal).REFRESH_TOKEN, otpRefreshToken),
          AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, targetPortal),
        ]);
        setPortal(targetPortal);
        setUser(profile);
      } else {
        const demoAccount = DEMO_ACCOUNTS[targetPortal];
        const demoUser = makeDemoUser(demoAccount);
        await saveSession(targetPortal, otpAccessToken, otpRefreshToken, demoUser);
        setUser(demoUser);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email: string, portal?: PortalType) => {
    const endpoint = portal === 'host' ? API_ENDPOINTS.AUTH.USER_RESEND_OTP : API_ENDPOINTS.AUTH.GUEST_RESEND_OTP;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      setOperatorRole(null);
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
      const [storedAccessToken, storedRefreshToken, storedUserProfile, storedOpRole] = await Promise.all([
        AsyncStorage.getItem(keys.AUTH_TOKEN),
        AsyncStorage.getItem(keys.REFRESH_TOKEN),
        AsyncStorage.getItem(keys.USER_PROFILE),
        AsyncStorage.getItem('@stayeasy_operator_role'),
      ]);
      setPortal(newPortal);
      if (storedOpRole) setOperatorRole(storedOpRole as OperatorRole);
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
      const newRefreshToken = data.refresh_token || tokens.refreshToken; // keep old if not returned
      await Promise.all([
        AsyncStorage.setItem(keys.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(keys.REFRESH_TOKEN, newRefreshToken),
      ]);
      setTokens({ accessToken: data.access_token, refreshToken: newRefreshToken });
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
      operatorRole,
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
      operatorRole,
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
