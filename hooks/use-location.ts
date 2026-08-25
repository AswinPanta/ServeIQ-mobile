/**
 * Location Hook
 * Fetches user's live GPS location with permission handling
 * Reverse geocoding via OpenStreetMap Nominatim (free, no API key)
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export interface ReverseGeocodeResult {
  /** Street address (house number + road, when available) */
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  /** Postal / ZIP code */
  postcode?: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ServeIQApp/1.0 (serveiq@example.com)',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) return {};
  const data = await res.json();
  const addr = data?.address ?? {};
  const road = addr.road || addr.pedestrian || addr.footway || addr.street || addr.neighbourhood || undefined;
  return {
    street: road ? [addr.house_number, road].filter(Boolean).join(' ') : undefined,
    city: addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county || undefined,
    state: addr.state || addr.region || addr.province || undefined,
    country: addr.country || undefined,
    postcode: addr.postcode || addr.postal_code || undefined,
  };
}

async function fetchCurrentLocation(
  setLocation: (loc: UserLocation) => void,
  setError: (err: string | null) => void,
  setLoading: (loading: boolean) => void
) {
  setLoading(true);
  setError(null);
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;
    const geo = await reverseGeocode(latitude, longitude);
    setLocation({ latitude, longitude, city: geo.city, country: geo.country });
  } catch (err) {
    setError('Failed to get location');
    console.error('Location error:', err);
  } finally {
    setLoading(false);
  }
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchCurrentLocation(
      (loc) => { if (!cancelled) setLocation(loc); },
      (err) => { if (!cancelled) setError(err); },
      (loading) => { if (!cancelled) setLoading(loading); },
    );
    return () => { cancelled = true; };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      await fetchCurrentLocation(setLocation, setError, setLoading);
      return true;
    }
    return false;
  };

  return {
    location,
    loading,
    error,
    requestPermission,
    refresh: () => fetchCurrentLocation(setLocation, setError, setLoading),
  };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
