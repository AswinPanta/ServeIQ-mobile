import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Hotel } from '@/lib/mock/properties';
import { searchNearbyApi } from '@/lib/api';
import { readNearbyCache, saveNearbyCache } from '@/lib/cache/nearby-cache';
import { markEnd, markStart } from '@/lib/utils/perf';

interface UseNearbyPropertiesResult {
  nearbyHotels: Hotel[];
  loading: boolean;
  locationGranted: boolean;
  requestLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
}


export function useNearbyProperties(): UseNearbyPropertiesResult {
  // Start empty — the "Stays nearby" section is hidden until the user grants
  // location permission. Results only appear after the location flow completes
  // (from the AsyncStorage cache when available, otherwise fresh).
  const [nearbyHotels, setNearbyHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const hotelsRef = useRef<Hotel[]>([]);
  const apiCacheWritten = useRef(false);

  const applyHotels = useCallback((hotels: Hotel[]) => {
    hotelsRef.current = hotels;
    setNearbyHotels(hotels);
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await searchNearbyApi({ lat, lon: lng, limit: 6 });
      if (res.fromApi && res.hotels.length > 0) {
        apiCacheWritten.current = true;
        applyHotels(res.hotels);
        saveNearbyCache(lat, lng, res.hotels, true);
        return;
      }
    } catch {
      // fall through — keep whatever is already displayed
    }
  }, [applyHotels]);

  const runLocationFlow = useCallback(async (prompt: boolean) => {
    try {
      setLoading(true);
      markStart('nearby: permission');
      const perm = prompt
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      markEnd('nearby: permission');
      if (perm.status !== 'granted') {
        setLocationGranted(false);
        setNearbyHotels([]);
        hotelsRef.current = [];
        return;
      }
      setLocationGranted(true);
      // Last-known fix is near-instant; only fall back to a fresh GPS fix when
      // the OS has no cached location yet.
      markStart('nearby: position');
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      markEnd('nearby: position');
      const { latitude, longitude } = loc.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      // Hydrate from cache first (fast start), then background-refresh.
      const cached = await readNearbyCache(latitude, longitude);
      if (cached && cached.length > 0) applyHotels(cached);
      await fetchNearby(latitude, longitude);
    } catch {
      setLocationGranted(false);
      setNearbyHotels([]);
      hotelsRef.current = [];
    } finally {
      setLoading(false);
    }
  }, [applyHotels, fetchNearby]);

  const requestLocation = useCallback(() => {
    void runLocationFlow(true);
  }, [runLocationFlow]);

  useEffect(() => {
    // Web: browser geolocation can hang ~12s and the backend rejects via CORS —
    // never auto-request; the "Enable location" banner asks the user to opt in.
    if (Platform.OS === 'web') return;
    // Non-prompting check: if permission was already granted, load nearby
    // (cache-hydrated) immediately. Otherwise do nothing — tapping the banner
    // is what prompts the user, never an intrusive launch-time dialog.
    void runLocationFlow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { nearbyHotels, loading, locationGranted, requestLocation, userLocation };
}
