/**
 * Favorites Context
 * Manages favorites/wishlist state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/api-config';

interface FavoritesContextType {
  favorites: string[]; // Array of hotel IDs
  isLoading: boolean;
  addFavorite: (hotelId: string) => Promise<void>;
  removeFavorite: (hotelId: string) => Promise<void>;
  isFavorite: (hotelId: string) => boolean;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize favorites from storage
  useEffect(() => {
    const initializeFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error('Failed to initialize favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFavorites();
  }, []);

  const addFavorite = useCallback(
    async (hotelId: string) => {
      try {
        setFavorites((prev) => {
          if (prev.includes(hotelId)) return prev;
          const updated = [...prev, hotelId];
          AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error('Failed to add favorite:', error);
        throw error;
      }
    },
    []
  );

  const removeFavorite = useCallback(
    async (hotelId: string) => {
      try {
        setFavorites((prev) => {
          const updated = prev.filter((id) => id !== hotelId);
          AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        throw error;
      }
    },
    []
  );

  const isFavorite = useCallback(
    (hotelId: string) => {
      return favorites.includes(hotelId);
    },
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      throw error;
    }
  }, []);

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
