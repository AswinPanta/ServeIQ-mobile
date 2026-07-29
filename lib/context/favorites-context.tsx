import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';
import { useToast } from '@/components/ui/toast';

interface FavoritesContextValue {
  favorites: Set<number | string>;
  favoritesList: (number | string)[];
  isLoading: boolean;
  isFavorite: (id: number | string) => boolean;
  toggleFavorite: (id: number | string) => void;
  addFavorite: (hotelId: string) => Promise<void>;
  removeFavorite: (hotelId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function getStorageKey(userId?: string): string {
  return userId ? `favorites_${userId}` : 'favorites_guest';
}

// Favorites API not yet available on backend — local-only for now
async function fetchFavoritesFromApi(): Promise<string[] | null> {
  return null;
}

async function addFavoriteToApi(_hotelId: string): Promise<boolean> {
  return false;
}

async function removeFavoriteFromApi(_hotelId: string): Promise<boolean> {
  return false;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  'use no memo';
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState<Set<number | string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const apiFavorites = await fetchFavoritesFromApi();
        if (apiFavorites && apiFavorites.length > 0) {
          setFavorites(new Set(apiFavorites));
          const key = getStorageKey(user?.id);
          await AsyncStorage.setItem(key, JSON.stringify(apiFavorites));
        } else {
          const key = getStorageKey(user?.id);
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed: (number | string)[] = JSON.parse(data);
            setFavorites(new Set(parsed));
          }
        }
      } catch {
        try {
          const key = getStorageKey(user?.id);
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed: (number | string)[] = JSON.parse(data);
            setFavorites(new Set(parsed));
          }
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const save = async () => {
      try {
        const key = getStorageKey(user?.id);
        await AsyncStorage.setItem(key, JSON.stringify([...favorites]));
      } catch {}
    };
    save();
  }, [favorites, user?.id]);

  const isFavorite = useCallback((id: number | string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback((id: number | string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addFavorite = useCallback(async (hotelId: string) => {
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(hotelId);
      return next;
    });
    // Try backend API — rollback on failure
    const success = await addFavoriteToApi(hotelId);
    if (!success) {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(hotelId);
        return next;
      });
      toast.error("Couldn\u2019t sync — saved on this device only");
    }
  }, [toast]);

  const removeFavorite = useCallback(async (hotelId: string) => {
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(hotelId);
      return next;
    });
    // Try backend API — rollback on failure
    const success = await removeFavoriteFromApi(hotelId);
    if (!success) {
      setFavorites(prev => {
        const next = new Set(prev);
        next.add(hotelId);
        return next;
      });
      toast.error("Couldn\u2019t sync — removed on this device only");
    }
  }, [toast]);

  const clearFavorites = useCallback(async () => {
    setFavorites(new Set());
    try {
      await AsyncStorage.removeItem(getStorageKey(user?.id));
    } catch {}
  }, [user?.id]);

  const favoritesList = React.useMemo(() => [...favorites], [favorites]);

  const value = useMemo(() => ({
    favorites,
    favoritesList,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }), [
    favorites,
    favoritesList,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  ]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be inside FavoritesProvider');
  return ctx;
}
