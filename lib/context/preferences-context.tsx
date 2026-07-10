/**
 * Preferences Context
 * Persists user preferences (currency, language, theme) to AsyncStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@stayeasy_user_preferences';

export interface UserPreferences {
  currency: string;
  language: string;
  defaultGuests: number;
  defaultRooms: number;
  recentSearches: string[];
  favoriteCities: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'NPR',
  language: 'en',
  defaultGuests: 2,
  defaultRooms: 1,
  recentSearches: [],
  favoriteCities: [],
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  addRecentSearch: (search: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoaded(true);
    }
  };

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [preferences]);

  const addRecentSearch = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) return;
    const recent = [trimmed, ...preferences.recentSearches.filter(s => s !== trimmed)].slice(0, 10);
    await updatePreferences({ recentSearches: recent });
  }, [preferences.recentSearches, updatePreferences]);

  const clearRecentSearches = useCallback(async () => {
    await updatePreferences({ recentSearches: [] });
  }, [updatePreferences]);

  const value = useMemo(() => ({
    preferences,
    updatePreferences,
    addRecentSearch,
    clearRecentSearches,
  }), [
    preferences,
    updatePreferences,
    addRecentSearch,
    clearRecentSearches,
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
