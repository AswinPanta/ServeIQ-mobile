/**
 * Authentication Context
 * Manages authentication state, tokens, and user profile
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/constants/api-config';
import type { GuestProfile, AuthResponse } from '@/types/api';

interface AuthContextType {
  user: GuestProfile | null;
  isLoading: boolean;
  isSignedIn: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (email: string, phone: string, name: string, password: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: GuestProfile | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<{ accessToken: string | null; refreshToken: string | null }>({
    accessToken: null,
    refreshToken: null,
  });

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedAccessToken, storedRefreshToken, storedUserProfile] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        ]);

        if (storedAccessToken && storedRefreshToken) {
          setTokens({
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
          });

          if (storedUserProfile) {
            setUser(JSON.parse(storedUserProfile));
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Call API
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();

      // Store tokens
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token),
      ]);

      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      // Fetch user profile
      const profileResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_ME}`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profile: GuestProfile = await profileResponse.json();
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        setUser(profile);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, phone: string, name: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone, name, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      // After registration, OTP verification is required
      // This will be handled by the OTP verification screen
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OTP verification failed');
      }

      const data: AuthResponse = await response.json();

      // Store tokens
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token),
      ]);

      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      // Fetch user profile
      const profileResponse = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_ME}`,
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profile: GuestProfile = await profileResponse.json();
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        setUser(profile);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_RESEND_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GUEST_REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, user needs to login again
        await logout();
        throw new Error('Token refresh failed');
      }

      const data: AuthResponse = await response.json();

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token),
      ]);

      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }, [tokens.refreshToken]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
      ]);

      // Clear state
      setUser(null);
      setTokens({ accessToken: null, refreshToken: null });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const demoUser: GuestProfile = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const demoToken = 'demo-access-token';
      const demoRefresh = 'demo-refresh-token';

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, demoToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, demoRefresh),
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoUser)),
      ]);

      setTokens({ accessToken: demoToken, refreshToken: demoRefresh });
      setUser(demoUser);
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: !!tokens.accessToken,
    tokens,
    login,
    demoLogin,
    register,
    verifyOTP,
    resendOTP,
    logout,
    setUser,
    setTokens,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
