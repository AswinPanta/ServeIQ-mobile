import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';

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

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<number | string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const key = getStorageKey(user?.id);
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed: (number | string)[] = JSON.parse(data);
          setFavorites(new Set(parsed));
        }
      } catch {} finally {
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
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(hotelId);
      return next;
    });
  }, []);

  const removeFavorite = useCallback(async (hotelId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(hotelId);
      return next;
    });
  }, []);

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
