import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { BRAND, SRS, BG, NEUTRAL, SLATE, CLOUD, GRAY } from '@/lib/constants/figma-tokens';

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

// Fallback center (Kathmandu) used only when the device location can't be read
// and the caller didn't provide coordinates.
const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.3240;

/**
 * Interactive map modal built on WebView + Leaflet (OpenStreetMap).
 * - Works in Expo Go (react-native-webview is a bundled native module)
 * - No API keys required (OSM tiles are free)
 * - Centers on the device's live location when it's available
 * - Tap anywhere → posts { lat, lng } back to React Native
 */
function buildMapHtml(initialLat: number, initialLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .leaflet-container { background: #e8eef4; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  // Register the RN → web channel EARLY (before Leaflet loads) so a message
  // that arrives mid-load is queued and applied once the map is ready.
  var pendingNativePoint = null;
  function onNativeMessage(e) {
    try {
      var data = JSON.parse(e.data);
      if (data && data.type === 'setLocation' && typeof data.lat === 'number' && typeof data.lng === 'number') {
        pendingNativePoint = { lat: data.lat, lng: data.lng };
        if (window.__applyPoint) window.__applyPoint(data.lat, data.lng);
      }
    } catch (err) {}
  }
  document.addEventListener('message', onNativeMessage);
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${initialLat}, ${initialLng}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var marker = null;
  function setMarker(lat, lng) {
    if (marker) { map.removeLayer(marker); }
    marker = L.marker([lat, lng]).addTo(map);
  }
  function applyPoint(lat, lng) {
    map.setView([lat, lng], 14);
    setMarker(lat, lng);
  }
  window.__applyPoint = applyPoint;

  map.on('click', function (e) {
    setMarker(e.latlng.lat, e.latlng.lng);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
    }
  });

  // Apply a native "setLocation" message that arrived before the map existed.
  if (pendingNativePoint) {
    applyPoint(pendingNativePoint.lat, pendingNativePoint.lng);
    pendingNativePoint = null;
  }

  setMarker(${initialLat}, ${initialLng});
</script>
</body>
</html>`;
}

export function MapLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLat,
  initialLng,
}: MapLocationPickerProps) {
  const webRef = useRef<WebView>(null);
  const [selected, setSelected] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? DEFAULT_LAT,
    lng: initialLng ?? DEFAULT_LNG,
  });
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  // The WebView may not have finished loading (or the Leaflet channel may not
  // be listening) when a locate result arrives — queue it and flush on load.
  const webReadyRef = useRef(false);
  const pendingPointRef = useRef<{ lat: number; lng: number } | null>(null);
  const locatingRef = useRef(false);
  const autoLocatedRef = useRef(false);

  // HTML is built once from the initial coords so the WebView doesn't reload
  // (and lose the marker) every time `selected` changes after a tap.
  const mapHtml = useMemo(
    () => buildMapHtml(initialLat ?? DEFAULT_LAT, initialLng ?? DEFAULT_LNG),
    [initialLat, initialLng]
  );

  // Keep the HTML in sync with `selected` WITHOUT unmounting the WebView:
  // push coordinate updates to the marker via window message instead.
  const syncMarker = useCallback((lat: number, lng: number) => {
    const msg = JSON.stringify({ type: 'setLocation', lat, lng });
    if (webReadyRef.current) {
      webRef.current?.postMessage(msg);
    } else {
      pendingPointRef.current = { lat, lng };
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    webReadyRef.current = true;
    if (pendingPointRef.current) {
      const p = pendingPointRef.current;
      pendingPointRef.current = null;
      webRef.current?.postMessage(JSON.stringify({ type: 'setLocation', lat: p.lat, lng: p.lng }));
    }
  }, []);

  /** Request permission + read the device's current GPS position, then center the map on it. */
  const locateUser = useCallback(async () => {
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Allow location access so the map can center on your current position. You can still tap the map to pin a location.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setSelected(point);
      syncMarker(point.lat, point.lng);
    } catch (e) {
      console.warn('Failed to read device location:', e);
      Alert.alert(
        'Location Unavailable',
        'We couldn\u2019t determine your current location. You can still tap the map to pin a location.'
      );
    } finally {
      locatingRef.current = false;
      setLocating(false);
    }
  }, [syncMarker]);

  // When the map opens without an existing pin, auto-center on the live location.
  useEffect(() => {
    if (visible && initialLat == null && initialLng == null && !autoLocatedRef.current) {
      autoLocatedRef.current = true;
      locateUser();
    }
    if (!visible) autoLocatedRef.current = false;
  }, [visible, initialLat, initialLng, locateUser]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        setSelected({ lat: data.lat, lng: data.lng });
      }
    } catch {
      // ignore malformed messages
    }
  };

  const handleConfirm = () => {
    onLocationSelect(selected.lat, selected.lng);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={BRAND.navyLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webRef}
            source={{ html: mapHtml }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMessage}
            onLoadEnd={handleLoadEnd}
            style={styles.map}
          />
          {loading && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={SRS.teal} />
            </View>
          )}
          <Text style={styles.mapHint}>Tap anywhere on the map to select a location</Text>
        </View>

        {/* Bottom Panel */}
        <View style={styles.bottomPanel}>
          <View style={styles.coordCard}>
            <View style={styles.coordRow}>
              <Ionicons name="location-outline" size={16} color={SRS.teal} />
              <Text style={styles.coordLabel}>Selected Location</Text>
            </View>
            <View style={styles.coordValues}>
              <View style={styles.coordItem}>
                <Text style={styles.coordKey}>Latitude</Text>
                <Text style={styles.coordVal}>{selected.lat.toFixed(6)}</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordKey}>Longitude</Text>
                <Text style={styles.coordVal}>{selected.lng.toFixed(6)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={locateUser}
              style={[styles.locateBtn, locating && { opacity: 0.6 }]}
              activeOpacity={0.7}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={SRS.teal} />
              ) : (
                <Ionicons name="locate-outline" size={18} color={SRS.teal} />
              )}
              <Text style={styles.locateBtnText}>{locating ? 'Locating…' : 'Use My Location'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.confirmBtn}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={BG.white} />
              <Text style={styles.confirmBtnText}>Use This Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[100] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[200],
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: SLATE[100],
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1, backgroundColor: CLOUD.frost },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: NEUTRAL[100],
  },
  mapHint: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.75)', color: BG.white,
    fontSize: 11, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, overflow: 'hidden',
  },
  bottomPanel: {
    backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[200],
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34,
  },
  coordCard: {
    backgroundColor: NEUTRAL[100], borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: SLATE[200],
  },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  coordLabel: { fontSize: 12, fontWeight: '600', color: SRS.teal },
  coordValues: { flexDirection: 'row', gap: 12 },
  coordItem: { flex: 1 },
  coordKey: { fontSize: 11, color: SLATE[400], marginBottom: 2 },
  coordVal: { fontSize: 15, fontWeight: '700', color: GRAY[900], fontVariant: ['tabular-nums'] },
  coordDivider: { width: 1, backgroundColor: SLATE[200] },
  actions: { flexDirection: 'row', gap: 10 },
  locateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    backgroundColor: SLATE[100], borderWidth: 1, borderColor: SLATE[200],
  },
  locateBtnText: { fontSize: 13, fontWeight: '600', color: SRS.teal },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: SRS.teal,
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: BG.white },
});
