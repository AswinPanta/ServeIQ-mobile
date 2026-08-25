import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';
import { useToast } from '@/components/ui/toast';
import { API_ENDPOINTS, API_BASE_URL, getPortalStorageKeys, STORAGE_KEYS } from '@/constants/api-config';
import type { Hotel } from '@/types/api';

interface FavoritesContextValue {
  favorites: Set<number | string>;
  favoritesList: (number | string)[];
  favoritesData: Record<string, Hotel>;
  isLoading: boolean;
  isFavorite: (id: number | string) => boolean;
  toggleFavorite: (id: number | string, property?: Hotel) => void;
  addFavorite: (hotelId: string, property?: Hotel) => Promise<void>;
  removeFavorite: (hotelId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  getFavoriteProperties: () => Hotel[];
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

// ─── Backend API helpers ───────────────────────────────────────────
async function getToken(): Promise<string | null> {
  try {
    const activePortal = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PORTAL);
    if (!activePortal) return null;
    const keys = getPortalStorageKeys(activePortal as any);
    return AsyncStorage.getItem(keys.AUTH_TOKEN);
  } catch { return null; }
}

/** Map a backend PropertyResponse into the Hotel shape used by the UI. */
function mapPropertyResponseToHotel(p: any): Hotel {
  const allPhotos: string[] = [];
  if (p.photos) {
    if (typeof p.photos.cover === 'string' && p.photos.cover) allPhotos.push(p.photos.cover);
    if (Array.isArray(p.photos.gallery)) allPhotos.push(...p.photos.gallery);
  }
  const amenities: Hotel['amenities'] = [
    ...(Array.isArray(p.system_amenities) ? p.system_amenities : []),
    ...(Array.isArray(p.custom_amenities) ? p.custom_amenities : []),
  ].map((a: any) => ({
    id: a.name || a,
    name: a.name || a,
    icon: a.icon || 'star',
    category: 'other' as const,
  }));
  const lat = p.latitude ? parseFloat(p.latitude) : 0;
  const lng = p.longitude ? parseFloat(p.longitude) : 0;
  return {
    id: String(p.id),
    name: p.name || '',
    location: [p.address, p.city, p.country].filter(Boolean).join(', '),
    city: p.city || '',
    country: p.country || '',
    address: p.address || '',
    rating: 0,
    review_count: 0,
    starRating: 0,
    price: 0,
    currency: p.currency || 'NPR',
    property_type: p.type || 'Hotel',
    description: p.description || '',
    shortDescription: p.description || '',
    images: allPhotos,
    photos: allPhotos.map((url: string, idx: number) => ({ url, caption: '', id: String(idx), order: idx })),
    amenities,
    roomTypes: [],
    reviews: [],
    cancellationPolicy: '',
    checkInTime: p.check_in_time || '14:00',
    checkOutTime: p.check_out_time || '11:00',
    phone: p.phone_number || '',
    email: p.email || '',
    website: p.brand_logo_url || undefined,
    coordinates: lat || lng ? { lat, lng } : undefined,
    latitude: lat || undefined,
    longitude: lng || undefined,
    availableRooms: p.total_rooms || 0,
    tags: [],
    brandColor: p.brand_color || undefined,
    logoUrl: p.brand_logo_url || undefined,
    created_at: p.created_at,
    updated_at: p.updated_at,
  } as Hotel;
}

interface FetchResult {
  ids: string[];
  properties: Record<string, Hotel>;
}

async function fetchFavoritesFromApi(): Promise<FetchResult | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAVORITES.LIST}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items = json.data ?? json ?? [];
    if (!Array.isArray(items)) return null;
    const ids: string[] = [];
    const properties: Record<string, Hotel> = {};
    for (const item of items) {
      const id = String(item.id || item.property_id);
      if (!id) continue;
      ids.push(id);
      if (item.name || item.city || item.type) {
        properties[id] = mapPropertyResponseToHotel(item);
      }
    }
    return { ids, properties };
  } catch { return null; }
}

interface ToggleResult {
  ok: boolean;
  isFavorite: boolean | null;
}

async function toggleFavoriteApi(propertyId: string): Promise<ToggleResult> {
  const token = await getToken();
  if (!token) return { ok: false, isFavorite: null };
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FAVORITES.TOGGLE(propertyId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, isFavorite: null };
    const json = await res.json();
    const isFav = json?.data?.is_favorite ?? null;
    return { ok: true, isFavorite: isFav };
  } catch { return { ok: false, isFavorite: null }; }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  'use no memo';
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState<Set<number | string>>(new Set());
  const [favoritesData, setFavoritesData] = useState<Record<string, Hotel>>({});
  const [isLoading, setIsLoading] = useState(true);

  // ─── Fetch favorites from server on mount / user change ──────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchFavoritesFromApi();
        if (cancelled) return;
        if (result !== null) {
          setFavorites(new Set(result.ids));
          if (Object.keys(result.properties).length > 0) {
            setFavoritesData(result.properties);
          }
        } else {
          // Not logged in — empty
          setFavorites(new Set());
          setFavoritesData({});
        }
      } catch {
        setFavorites(new Set());
        setFavoritesData({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ─── Core operations — always server ──────────────────────────────
  const isFavorite = useCallback((id: number | string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback((id: number | string, property?: Hotel) => {
    const idStr = String(id);
    const wasFav = favorites.has(id);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (property) {
      setFavoritesData(prev => {
        const next = { ...prev };
        if (wasFav) delete next[idStr];
        else next[idStr] = property;
        return next;
      });
    }

    // Server call — use server's is_favorite as source of truth
    toggleFavoriteApi(idStr).then(result => {
      if (!result.ok) {
        // Server failed — revert to previous state
        setFavorites(prev => {
          const next = new Set(prev);
          if (wasFav) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error('Sync failed — please try again');
      } else if (result.isFavorite !== null) {
        // Server confirmed — set exact state
        setFavorites(prev => {
          const next = new Set(prev);
          if (result.isFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    });
  }, [favorites, toast]);

  const addFavorite = useCallback(async (hotelId: string, property?: Hotel) => {
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(hotelId);
      return next;
    });
    if (property) {
      setFavoritesData(prev => ({ ...prev, [hotelId]: property }));
    }

    // Server call
    const result = await toggleFavoriteApi(hotelId);
    if (!result.ok) {
      // Revert
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(hotelId);
        return next;
      });
      toast.error('Sync failed — please try again');
    } else if (result.isFavorite === false) {
      // Server says not favorited (shouldn't happen on add, but handle it)
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(hotelId);
        return next;
      });
    }
  }, [toast]);

  const removeFavorite = useCallback(async (hotelId: string) => {
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(hotelId);
      return next;
    });

    // Server call
    const result = await toggleFavoriteApi(hotelId);
    if (!result.ok) {
      // Revert
      setFavorites(prev => {
        const next = new Set(prev);
        next.add(hotelId);
        return next;
      });
      toast.error('Sync failed — please try again');
    } else if (result.isFavorite === true) {
      // Server says still favorited (shouldn't happen on remove, but handle it)
      setFavorites(prev => {
        const next = new Set(prev);
        next.add(hotelId);
        return next;
      });
    }
  }, [toast]);

  const clearFavorites = useCallback(async () => {
    setFavorites(new Set());
    setFavoritesData({});
  }, []);

  const favoritesList = React.useMemo(() => [...favorites], [favorites]);

  const getFavoriteProperties = useCallback(() => {
    return Object.values(favoritesData).filter(p => favorites.has(p.id));
  }, [favorites, favoritesData]);

  const value = useMemo(() => ({
    favorites,
    favoritesList,
    favoritesData,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoriteProperties,
  }), [
    favorites,
    favoritesList,
    favoritesData,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoriteProperties,
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
