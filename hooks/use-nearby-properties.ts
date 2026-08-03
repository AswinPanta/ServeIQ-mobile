import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { MOCK_PROPERTIES, type Hotel } from '@/lib/mock/properties';
import { searchNearbyApi } from '@/lib/api';

interface UseNearbyPropertiesResult {
  nearbyHotels: Hotel[];
  loading: boolean;
  locationGranted: boolean;
  requestLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function fallbackNearby(lat: number, lng: number): Hotel[] {
  const withDistance = MOCK_PROPERTIES.map((h) => ({
    hotel: h,
    distance: haversineDistance(lat, lng, h.lat ?? 0, h.lng ?? 0),
  }))
    .filter((h) => h.hotel.lat && h.hotel.lng)
    .sort((a, b) => a.distance - b.distance);

  return withDistance.slice(0, 6).map((h) => h.hotel);
}

export function useNearbyProperties(): UseNearbyPropertiesResult {
  const [nearbyHotels, setNearbyHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchNearby = async (lat: number, lng: number) => {
    try {
      const res = await searchNearbyApi({ lat, lon: lng, limit: 6 });
      if (res.fromApi && res.hotels.length > 0) {
        setNearbyHotels(res.hotels);
        return;
      }
    } catch {
      // fall through to mock
    }
    setNearbyHotels(fallbackNearby(lat, lng));
  };

  const requestLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        setNearbyHotels(MOCK_PROPERTIES.slice(0, 6));
        return;
      }
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      fetchNearby(latitude, longitude);
    } catch {
      setNearbyHotels(MOCK_PROPERTIES.slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return { nearbyHotels, loading, locationGranted, requestLocation, userLocation };
}
