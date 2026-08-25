import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { SettingSectionTitle } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface LogEntry {
  action: string;
  detail: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityLogsSection() {
  const { properties, activePropertyId, bookings, rooms, staff, discountCodes, specialOffers } = useHost();

  const property = properties.find(p => p.id === activePropertyId);

  const logs = useMemo<LogEntry[]>(() => {
    const entries: LogEntry[] = [];

    // Property creation/update
    if (property) {
      entries.push({
        action: 'Property created',
        detail: `"${property.name}" was set up`,
        time: property.created_at,
        icon: 'business-outline',
        color: SRS.teal,
      });
      if (property.updated_at !== property.created_at) {
        entries.push({
          action: 'Property updated',
          detail: 'Settings were modified',
          time: property.updated_at,
          icon: 'create-outline',
          color: '#2E86AB',
        });
      }
    }

    // Bookings from backend
    const allBookings = bookings.filter((b: any) => b.property_id === activePropertyId);
    allBookings.slice(0, 10).forEach((b: any) => {
      const status = (b.status || '').toLowerCase();
      if (status === 'confirmed' || status === 'checked_in' || status === 'checked_out') {
        entries.push({
          action: `Booking ${status.replace('_', ' ')}`,
          detail: `${b.guest_name || 'Guest'} · ${b.room_name || ''}`,
          time: b.created_at || b.check_in || new Date().toISOString(),
          icon: status === 'checked_out' ? 'log-out-outline' : status === 'checked_in' ? 'log-in-outline' : 'calendar-outline',
          color: status === 'checked_out' ? '#10B981' : status === 'checked_in' ? '#2E86AB' : ACCENT,
        });
      }
      if (status === 'cancelled') {
        entries.push({
          action: 'Booking cancelled',
          detail: `${b.guest_name || 'Guest'}`,
          time: b.created_at || new Date().toISOString(),
          icon: 'close-circle-outline',
          color: '#EF4444',
        });
      }
    });

    // Room status changes
    const activeRooms = rooms.filter(r => r.property_id === activePropertyId);
    const occupied = activeRooms.filter(r => r.status === 'OCCUPIED').length;
    const dirty = activeRooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING').length;
    if (occupied > 0) {
      entries.push({
        action: 'Room occupancy',
        detail: `${occupied} of ${activeRooms.length} rooms occupied`,
        time: new Date().toISOString(),
        icon: 'bed-outline',
        color: '#2E86AB',
      });
    }
    if (dirty > 0) {
      entries.push({
        action: 'Rooms need cleaning',
        detail: `${dirty} room${dirty > 1 ? 's' : ''} pending`,
        time: new Date().toISOString(),
        icon: 'sparkles-outline',
        color: '#F59E0B',
      });
    }

    // Staff changes
    const propStaff = staff.filter(s => s.property_id === activePropertyId);
    if (propStaff.length > 0) {
      entries.push({
        action: 'Staff roster',
        detail: `${propStaff.length} team member${propStaff.length > 1 ? 's' : ''} active`,
        time: new Date().toISOString(),
        icon: 'people-outline',
        color: '#8B5CF6',
      });
    }

    // Discount codes
    const propCodes = discountCodes.filter(dc => dc.property_id === activePropertyId);
    propCodes.slice(0, 3).forEach(dc => {
      entries.push({
        action: 'Discount code',
        detail: `"${dc.code}" — ${dc.type === 'PERCENTAGE' ? `${dc.discount_value}% off` : `${dc.discount_value} off`}`,
        time: dc.created_at,
        icon: 'pricetag-outline',
        color: '#10B981',
      });
    });

    // Special offers
    const propOffers = specialOffers.filter(o => o.property_id === activePropertyId);
    propOffers.slice(0, 3).forEach(o => {
      entries.push({
        action: 'Special offer',
        detail: `"${o.title}" — ${o.discount_percentage}% off`,
        time: o.created_at,
        icon: 'gift-outline',
        color: '#F59E0B',
      });
    });

    // Sort by time (newest first)
    return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [property, bookings, activePropertyId, rooms, staff, discountCodes, specialOffers]);

  if (!property) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', marginTop: 40 }}>
          Select a property first
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Activity Logs</SettingSectionTitle>

      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={40} color={GRAY[300]} />
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptyHint}>Activity will appear as bookings and changes are made</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {logs.map((log, i) => (
            <View key={i} style={[styles.logRow, i < logs.length - 1 && styles.logRowBorder]}>
              <View style={[styles.logIcon, { backgroundColor: log.color + '15' }]}>
                <Ionicons name={log.icon} size={16} color={log.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logDetail}>{log.detail}</Text>
              </View>
              <Text style={styles.logTime}>{timeAgo(log.time)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden', ...SHADOWS.card },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  emptyHint: { ...TYPOGRAPHY.small, color: GRAY[400] },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  logRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] },
  logIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logAction: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[900] },
  logDetail: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  logTime: { ...TYPOGRAPHY.caption, color: GRAY[400] },
});
