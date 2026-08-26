import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS, getPortalStorageKeys } from '@/constants/api-config';
import { mark, markEnd, markStart } from '@/lib/utils/perf';
import { findDemoAccount, DEMO_ACCOUNTS, type DemoAccount } from '@/constants/demo-accounts';
import { decodeJwtRole } from '@/lib/context/auth-utils';
import { OPS_DEFAULT_PROPERTY_ID_KEY, OPS_DEFAULT_PROPERTY_NAME_KEY, getMustChangeGuestEmails } from '@/lib/context/host-utils';
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

export interface RegistrationResult {
  message?: string;
  guest_id?: string;
  user_id?: string;
  email?: string;
}

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
  register: (email: string, phone: string, name: string, password: string, portal?: PortalType) => Promise<RegistrationResult>;
  verifyOTP: (email: string, otp: string, portal?: PortalType) => Promise<void>;
  resendOTP: (email: string, portal?: PortalType) => Promise<void>;
  /** Returns false when the password changed but re-authentication with the new password failed. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchPortal: (portal: PortalType) => Promise<void>;
  setUser: (user: PortalProfile | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  refreshAccessToken: () => Promise<string | null>;
  /** True when the current user logged in with a temporary password and must change it. */
  mustChangePassword: boolean;
  /** The temporary password stored during login so the change-password flow can use it. */
  tempPassword: string | null;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OPS_ROLES = [
  'front_desk',
  'housekeeping',
  'pos',
  'kds',
  'manager',
  'waiter',
  'kitchen',
  'maintenance',
];

/**
 * Staff JWTs carry no property claims (the backend signs only `sub` + `role`),
 * so a staff login can't know its property from the token. The host portal
 * persists the last-selected property in these keys — reuse them so an invited
 * staff member lands on their hotel's front desk on the same device.
 */
async function resolveOpsPropertyContext() {
  try {
    const [pid, name] = await Promise.all([
      AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_ID_KEY),
      AsyncStorage.getItem(OPS_DEFAULT_PROPERTY_NAME_KEY),
    ]);
    if (pid) return { property_id: pid, property_name: name || '' };
  } catch {
    // Non-fatal — the profile falls back to the default ops property (prop-1).
  }
  return null;
}

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
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const isPortalType = (value: string): value is PortalType => {
    return ['guest', 'host', 'operations', 'superadmin'].includes(value);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      markStart('auth-init');
      // Restore the stored session from AsyncStorage first — no network.
      let activePortal: PortalType | null = null;
      let storedAccessToken: string | null = null;
      let storedRefreshToken: string | null = null;
      let keys: ReturnType<typeof getPortalStorageKeys> | null = null;

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
        if (stored && isPortalType(stored)) {
          activePortal = stored;
          setPortal(stored);
          keys = getPortalStorageKeys(stored);

          const [access, refresh, profile, opRole] = await Promise.all([
            AsyncStorage.getItem(keys.AUTH_TOKEN),
            AsyncStorage.getItem(keys.REFRESH_TOKEN),
            AsyncStorage.getItem(keys.USER_PROFILE),
            AsyncStorage.getItem('@serveiq_operator_role'),
          ]);

          if (opRole) setOperatorRole(opRole as OperatorRole);
          storedAccessToken = access;
          storedRefreshToken = refresh;

          if (access && refresh) {
            setTokens({ accessToken: access, refreshToken: refresh });
            if (profile) {
              try {
                setUser(JSON.parse(profile));
              } catch {
                // Corrupt stored profile — keep tokens, start signed out
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Auth init failure is non-fatal; stored tokens may still be valid.
        // User will see the login screen if no session could be restored.
      } finally {
        // Unblock launch immediately after restoring the stored session.
        // The token validation below runs in the background so a slow or cold
        // backend can never delay entry into the app (was 30-40s+ before).
        setIsLoading(false);
        markEnd('auth-init (isLoading cleared)');
      }

      // Background token validation (fire-and-forget): only clear the session
      // on a DEFINITIVE 401/403. Timeouts and network errors trust stored tokens.
      if (activePortal && keys && storedAccessToken && storedRefreshToken) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const ep = activePortal === 'guest' ? API_ENDPOINTS.AUTH.GUEST_ME : API_ENDPOINTS.AUTH.USER_ME;
          const meRes = await fetch(`${API_BASE_URL}${ep}`, {
            headers: { Authorization: `Bearer ${storedAccessToken}` },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (meRes.status === 401 || meRes.status === 403) {
            // Token definitely expired — clear session, but only if the stored
            // token is still the one we validated. The user may have logged in
            // or switched portal while the probe was in flight; never wipe a
            // newer session with a stale 401.
            const currentToken = await AsyncStorage.getItem(keys.AUTH_TOKEN);
            if (currentToken === storedAccessToken) {
              setTokens({ accessToken: null, refreshToken: null });
              setUser(null);
              await Promise.all([
                AsyncStorage.removeItem(keys.AUTH_TOKEN),
                AsyncStorage.removeItem(keys.REFRESH_TOKEN),
                AsyncStorage.removeItem(keys.USER_PROFILE),
              ]);
              await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_PORTAL);
            }
          }
          // On 200 or any other status, trust stored tokens and proceed
        } catch {
          // Network error, timeout, or abort — trust stored tokens, don't clear
        }
        markEnd('auth probe done');
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
      opRole !== undefined ? AsyncStorage.setItem('@serveiq_operator_role', opRole || '') : Promise.resolve(),
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
    await AsyncStorage.removeItem('@serveiq_operator_role');
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
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      let lastError: string = 'Login failed';

      try {
        // Single login endpoint — backend tries guest then user internally
        const loginRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (loginRes.ok) {
          const contentType = loginRes.headers?.get?.('content-type') || '';
          if (!contentType.includes('application/json')) {
            lastError = 'Backend is starting up, please try again in a moment';
            throw new Error(lastError);
          }
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
                const role = String(pd.role || '').toLowerCase();

                if (role === 'super_admin') {
                  detectedPortal = 'superadmin';
                  profile = { ...pd, name: pd.full_name || pd.name, role: 'SUPER_ADMIN' } as SuperAdminProfile;
                } else if (OPS_ROLES.includes(role)) {
                  detectedPortal = 'operations';
                  detectedOpRole = role as OperatorRole;
                  const opsProp = await resolveOpsPropertyContext();
                  profile = {
                    ...pd,
                    name: pd.full_name || pd.name,
                    role,
                    ...(opsProp || {}),
                  } as OperatorProfile;
                } else {
                  detectedPortal = 'host';
                  profile = { ...pd, name: pd.full_name || pd.name, firstName: pd.first_name, lastName: pd.last_name } as HostProfile;
                }
              } else {
                // Both /me probes failed — fall back to the JWT role claim.
                const jwtRole = (decodeJwtRole(data.access_token) || '').toLowerCase();
                if (jwtRole === 'super_admin') {
                  detectedPortal = 'superadmin';
                  profile = { email, name: email.split('@')[0], role: 'SUPER_ADMIN' } as SuperAdminProfile;
                } else if (OPS_ROLES.includes(jwtRole)) {
                  detectedPortal = 'operations';
                  detectedOpRole = jwtRole as OperatorRole;
                  const opsProp = await resolveOpsPropertyContext();
                  profile = {
                    email,
                    name: email.split('@')[0],
                    role: jwtRole,
                    ...(opsProp || {}),
                  } as OperatorProfile;
                } else if (jwtRole === 'admin') {
                  detectedPortal = 'host';
                  profile = { email, name: email.split('@')[0] } as HostProfile;
                } else {
                  profile = { email, name: email.split('@')[0] } as GuestProfile;
                  detectedPortal = 'guest';
                }
              }
            }

            const loginRefreshToken = data.refresh_token || data.access_token;
            await saveSession(detectedPortal, data.access_token, loginRefreshToken, profile, detectedOpRole);
            setPortal(detectedPortal);
            setOperatorRole(detectedOpRole);
            setTokens({ accessToken: data.access_token, refreshToken: loginRefreshToken });
            setUser(profile);
            // Check if this email has a pending temp-password flag
            const mustChangeMap = await getMustChangeGuestEmails();
            if (mustChangeMap[email.toLowerCase()]) {
              setMustChangePassword(true);
              setTempPassword(password);
            }
            return detectedPortal;
          }
        } else {
          if (loginRes.status === 502 || loginRes.status === 503) {
            lastError = 'Backend is starting up, please try again in a moment';
          } else {
            const errBody = await loginRes.json().catch(() => ({}));
            lastError = errBody.error || errBody.detail || `Login failed (${loginRes.status})`;
          }
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

  const register = useCallback(async (email: string, phone: string, name: string, password: string, portal?: PortalType): Promise<RegistrationResult> => {
    try {
      const body: Record<string, string> = { full_name: name, email, password };
      if (phone) body.phone = phone;
      const endpoint = portal === 'host' ? API_ENDPOINTS.AUTH.USER_REGISTER : API_ENDPOINTS.AUTH.GUEST_REGISTER;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const rawBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error('Our servers are temporarily unavailable. Please try again shortly.');
        }
        const detail = rawBody.detail;
        const message =
          typeof detail === 'string' ? detail
          : Array.isArray(detail) && detail[0]?.msg ? detail[0].msg
          : rawBody.message || rawBody.error || 'Registration failed';
        throw new Error(message);
      }
      return (rawBody.success === true && rawBody.data) ? rawBody.data : rawBody as RegistrationResult;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string, portal?: PortalType) => {
    try {
      const targetPortal = portal || 'guest';
      const verifyEndpoint = targetPortal === 'host' ? API_ENDPOINTS.AUTH.USER_VERIFY_OTP : API_ENDPOINTS.AUTH.GUEST_VERIFY_OTP;
      const response = await fetch(`${API_BASE_URL}${verifyEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const rawBody = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(rawBody.error || rawBody.message || 'OTP verification failed');
      }

      // Backend may or may not return tokens after verification
      const data = (rawBody.success === true && rawBody.data) ? rawBody.data : rawBody;
      const otpAccessToken = data.access_token;
      const otpRefreshToken = data.refresh_token;

      if (otpAccessToken) {
        // Backend returned tokens — use them directly
        setTokens({ accessToken: otpAccessToken, refreshToken: otpRefreshToken || otpAccessToken });
        const meEndpoint = targetPortal === 'host' ? API_ENDPOINTS.AUTH.USER_ME : API_ENDPOINTS.AUTH.GUEST_ME;
        const profileResponse = await fetch(
          `${API_BASE_URL}${meEndpoint}`,
          { headers: { Authorization: `Bearer ${otpAccessToken}` } },
        );
        if (profileResponse.ok) {
          const rawProfile = await profileResponse.json();
          const profileData = (rawProfile.success === true && rawProfile.data) ? rawProfile.data : rawProfile;
          const profile = targetPortal === 'host'
            ? { ...profileData, name: profileData.full_name || profileData.name, full_name: profileData.full_name, firstName: profileData.first_name, lastName: profileData.last_name } as HostProfile
            : { ...profileData, name: profileData.full_name || profileData.name, full_name: profileData.full_name } as GuestProfile;
          await Promise.all([
            AsyncStorage.setItem(getPortalStorageKeys(targetPortal).USER_PROFILE, JSON.stringify(profile)),
            AsyncStorage.setItem(getPortalStorageKeys(targetPortal).AUTH_TOKEN, otpAccessToken),
            AsyncStorage.setItem(getPortalStorageKeys(targetPortal).REFRESH_TOKEN, otpRefreshToken || otpAccessToken),
            AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PORTAL, targetPortal),
          ]);
          setPortal(targetPortal);
          setUser(profile);
        }
      }
      // If no tokens returned, caller (register screen) handles auto-login with password
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
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
      throw error;
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
        AsyncStorage.getItem('@serveiq_operator_role'),
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
      throw error;
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

  /**
   * Change the signed-in account's password via the live backend.
   * Guest accounts hit /auth/guest/change-password, all other portals hit
   * /auth/user/change-password (both AUTH-gated, body ChangePasswordRequest).
   * Demo accounts carry local-only tokens, so they can't hit the backend —
   * surface a friendly error instead of a confusing 401.
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const accessToken = tokens.accessToken;
    if (!accessToken || !portal) throw new Error('You are not signed in. Please log in first.');
    if (accessToken.startsWith('demo-')) {
      throw new Error('Demo accounts can\'t change passwords. Sign in with a registered account to update your password.');
    }

    const endpoint = portal === 'guest'
      ? API_ENDPOINTS.AUTH.CHANGE_PASSWORD_GUEST
      : API_ENDPOINTS.AUTH.CHANGE_PASSWORD_USER;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });

    const rawBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Your current password is incorrect or your session has expired.');
      }
      if (response.status === 422) {
        const detail = rawBody.detail;
        const message = Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : 'New password must be at least 8 characters.';
        throw new Error(message);
      }
      throw new Error(rawBody.error || rawBody.message || rawBody.detail || 'Failed to change password. Please try again.');
    }

    // The backend changes the password but the deployed instance invalidates
    // the old session afterwards (its response literally says "You can now log
    // in with your new password"). Re-authenticate with the new password so
    // the user stays signed in with fresh tokens instead of being logged out.
    if (user?.email) {
      try {
        await login(user.email, newPassword);
        return true;
      } catch {
        // The password WAS changed — only the re-login failed (e.g. backend
        // hiccup). Keep the current session state and let the caller warn the
        // user to sign in again with the new password if the old tokens die.
        return false;
      }
    }
    return true;
  }, [tokens.accessToken, portal, user?.email, login]);

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
  }, []);

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
      changePassword,
      logout,
      switchPortal,
      setUser,
      setTokens: internalSetTokens,
      refreshAccessToken,
      mustChangePassword,
      tempPassword,
      clearMustChangePassword,
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
      changePassword,
      logout,
      switchPortal,
      setUser,
      internalSetTokens,
      refreshAccessToken,
      mustChangePassword,
      tempPassword,
      clearMustChangePassword,
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
