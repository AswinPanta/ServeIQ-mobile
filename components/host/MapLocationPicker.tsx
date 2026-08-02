import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions,
} from 'react-native';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_CENTER: [number, number] = [85.3240, 27.7172]; // Kathmandu

const FREE_TILE_STYLE = 'https://tiles.openfreeemap.org/styles/liberty/style.json';

export function MapLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialLat,
  initialLng,
}: MapLocationPickerProps) {
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLng, initialLat] : null
  );
  const cameraRef = useRef<any>(null);

  const handleMapPress = (event: any) => {
    const nativeEvent = event.nativeEvent || event;
    if (nativeEvent.geometry && nativeEvent.geometry.coordinates) {
      const [lng, lat] = nativeEvent.geometry.coordinates;
      setSelectedCoord([lng, lat]);
    }
  };

  const handleConfirm = () => {
    if (selectedCoord) {
      onLocationSelect(selectedCoord[1], selectedCoord[0]); // lat, lng
      onClose();
    }
  };

  const handleMyLocation = () => {
    cameraRef.current?.setCamera({
      center: DEFAULT_CENTER,
      zoom: 14,
      animationDuration: 500,
    });
    setSelectedCoord(DEFAULT_CENTER);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#1A3C5E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Map
            style={styles.map}
            mapStyle={FREE_TILE_STYLE}
            onPress={handleMapPress}
          >
            <Camera
              ref={cameraRef}
              center={selectedCoord || DEFAULT_CENTER}
              zoom={selectedCoord ? 14 : 6}
            />
            {selectedCoord && (
              <Marker
                id="selected-marker"
                lngLat={selectedCoord}
              >
                <View style={styles.marker}>
                  <Ionicons name="location" size={24} color="#E63946" />
                </View>
              </Marker>
            )}
          </Map>

          {/* Crosshair overlay */}
          <View style={styles.crosshair} pointerEvents="none">
            <View style={styles.crosshairDot} />
          </View>
        </View>

        {/* Bottom Panel */}
        <View style={styles.bottomPanel}>
          {selectedCoord ? (
            <View style={styles.coordCard}>
              <View style={styles.coordRow}>
                <Ionicons name="location-outline" size={16} color="#2E86AB" />
                <Text style={styles.coordLabel}>Selected Location</Text>
              </View>
              <View style={styles.coordValues}>
                <View style={styles.coordItem}>
                  <Text style={styles.coordKey}>Latitude</Text>
                  <Text style={styles.coordVal}>{selectedCoord[1].toFixed(6)}</Text>
                </View>
                <View style={styles.coordDivider} />
                <View style={styles.coordItem}>
                  <Text style={styles.coordKey}>Longitude</Text>
                  <Text style={styles.coordVal}>{selectedCoord[0].toFixed(6)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.hintCard}>
              <Ionicons name="finger-print-outline" size={20} color="#94A3B8" />
              <Text style={styles.hintText}>Tap anywhere on the map to select a location</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleMyLocation} style={styles.locateBtn}>
              <Ionicons name="locate-outline" size={18} color="#2E86AB" />
              <Text style={styles.locateBtnText}>Use Default</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedCoord}
              style={[styles.confirmBtn, !selectedCoord && styles.confirmBtnDisabled]}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
              <Text style={styles.confirmBtnText}>Use This Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  crosshair: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -16, marginLeft: -16,
  },
  crosshairDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#E63946',
    backgroundColor: 'rgba(230,57,70,0.15)',
  },
  marker: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  bottomPanel: {
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34,
  },
  coordCard: {
    backgroundColor: '#F8F9FB', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  coordLabel: { fontSize: 12, fontWeight: '600', color: '#2E86AB' },
  coordValues: { flexDirection: 'row', gap: 12 },
  coordItem: { flex: 1 },
  coordKey: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
  coordVal: { fontSize: 15, fontWeight: '700', color: '#111', fontVariant: ['tabular-nums'] },
  coordDivider: { width: 1, backgroundColor: '#E2E8F0' },
  hintCard: {
    backgroundColor: '#F8F9FB', borderRadius: 12, padding: 16, marginBottom: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  hintText: { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  locateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  locateBtnText: { fontSize: 13, fontWeight: '600', color: '#2E86AB' },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2E86AB',
  },
  confirmBtnDisabled: { backgroundColor: '#CBD5E1' },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
});
