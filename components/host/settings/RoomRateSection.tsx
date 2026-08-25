import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useHost } from '@/lib/context/host-context';
import { SettingRow, SettingSectionTitle, SettingSubSectionTitle } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

export function RoomRateSection() {
  const { roomTypes, rooms, activePropertyId, properties } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  const propRoomTypes = roomTypes.filter(rt => rt.property_id === activePropertyId);
  const propRooms = rooms.filter(r => r.property_id === activePropertyId);

  const rates = propRoomTypes.map(rt => ({
    name: rt.room_type_name,
    rate: rt.base_rate,
    rooms: propRooms.filter(r => r.room_type_id === rt.id).length,
    maxOccupancy: rt.max_occupancy,
  }));

  const totalRooms = propRooms.length;
  const avgRate = rates.length > 0
    ? Math.round(rates.reduce((sum, r) => sum + r.rate, 0) / rates.length)
    : 0;
  const minRate = rates.length > 0 ? Math.min(...rates.map(r => r.rate)) : 0;
  const maxRate = rates.length > 0 ? Math.max(...rates.map(r => r.rate)) : 0;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Room & Rate Settings</SettingSectionTitle>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rate Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{property?.currency || 'NPR'}</Text>
            <Text style={styles.summaryLabel}>Currency</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalRooms}</Text>
            <Text style={styles.summaryLabel}>Total Rooms</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgRate.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Avg Rate</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{propRoomTypes.length}</Text>
            <Text style={styles.summaryLabel}>Room Types</Text>
          </View>
        </View>
      </View>

      {/* Room Types & Rates */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Room Types & Rates</Text>
        {rates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No room types configured yet</Text>
            <Text style={styles.emptyHint}>Add room types from the property wizard or room management</Text>
          </View>
        ) : (
          rates.map((rate, i) => (
            <View key={i} style={[styles.rateRow, i < rates.length - 1 && styles.rateRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rateName}>{rate.name}</Text>
                <Text style={styles.rateSub}>
                  {rate.rooms} room{rate.rooms !== 1 ? 's' : ''} · Max {rate.maxOccupancy} guests
                </Text>
              </View>
              <View style={styles.ratePrice}>
                <Text style={styles.rateValue}>{property?.currency || 'NPR'} {rate.rate.toLocaleString()}</Text>
                <Text style={styles.ratePer}>/night</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Rate Range */}
      {rates.length > 0 && (
        <View style={[styles.card, { marginTop: 12 }]}>
          <SettingSubSectionTitle>Rate Range</SettingSubSectionTitle>
          <SettingRow label="Lowest Rate" value={`${property?.currency || 'NPR'} ${minRate.toLocaleString()}/night`} />
          <SettingRow label="Highest Rate" value={`${property?.currency || 'NPR'} ${maxRate.toLocaleString()}/night`} />
          <SettingRow label="Cancellation" value={property?.cancellation_policy || 'MODERATE'} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, ...SHADOWS.card },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  summaryItem: { width: '50%', alignItems: 'center', paddingVertical: 12 },
  summaryValue: { ...TYPOGRAPHY.h2, color: ACCENT, fontWeight: '800' },
  summaryLabel: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  emptyHint: { ...TYPOGRAPHY.small, color: GRAY[400] },
  rateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rateRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] },
  rateName: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  rateSub: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  ratePrice: { alignItems: 'flex-end' },
  rateValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: ACCENT },
  ratePer: { ...TYPOGRAPHY.caption, color: GRAY[400] },
});
