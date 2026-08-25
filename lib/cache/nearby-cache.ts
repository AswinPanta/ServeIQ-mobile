import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/api-config';
import type { Hotel } from '@/lib/mock/properties';

// A stale-while-revalidate cache for "Stays nearby". Entries are valid for one
// hour (CACHE_TTL_MS) — older snapshots are discarded on read so a stale list
// never lingers across a whole session. The other guard is distance: results
// are keyed to the coordinates they were fetched for, so a big move
// invalidates them.
const MAX_DISTANCE_KM = 25;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface NearbyCacheEntry {
  savedAt: number;
  lat: number;
  lng: number;
  fromApi: boolean;
  hotels: Hotel[];
}

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function saveNearbyCache(lat: number, lng: number, hotels: Hotel[], fromApi: boolean): Promise<void> {
  if (hotels.length === 0) return;
  const entry: NearbyCacheEntry = { savedAt: Date.now(), lat, lng, fromApi, hotels };
  AsyncStorage.setItem(STORAGE_KEYS.NEARBY_CACHE, JSON.stringify(entry)).catch(() => {});
}

export async function readNearbyCache(lat: number, lng: number): Promise<Hotel[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NEARBY_CACHE);
    if (!raw) return null;
    const entry: NearbyCacheEntry = JSON.parse(raw);
    if (!entry || !Array.isArray(entry.hotels) || entry.hotels.length === 0) return null;
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
    if (haversineDistanceKm(lat, lng, entry.lat, entry.lng) > MAX_DISTANCE_KM) return null;
    return entry.hotels;
  } catch {
    return null;
  }
}
