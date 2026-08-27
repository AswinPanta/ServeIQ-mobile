import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SRS, RADIUS, SHADOWS, FIGMA_COLORS, GRAY } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';
import { getAvailableRoomsApi, type AvailableRoom } from '@/lib/api';

interface RoomCard extends AvailableRoom {
  maxQuantity: number;
}

export default function RoomSelectScreen() {
  const params = useLocalSearchParams<{
    hotelName?: string;
    hotelLocation?: string;
    propertyId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    adults?: string;
    children?: string;
    currency?: string;
  }>();

  const hotelName = params.hotelName || 'ServeIQ Resort';
  const propertyId = params.propertyId || '';
  const hotelLocation = params.hotelLocation || 'Pokhara, Nepal';
  const checkIn = params.checkIn || '';
  const checkOut = params.checkOut || '';
  const guests = parseInt(params.guests || '2', 10);
  const adults = parseInt(params.adults || String(guests), 10) || 2;
  const childrenCount = parseInt(params.children || '0', 10) || 0;
  const currency = params.currency || 'NPR';

  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>({});

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  }, [checkIn, checkOut]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!propertyId || !checkIn || !checkOut) {
        setError('Missing property or dates.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAvailableRoomsApi(propertyId, checkIn, checkOut);
        if (cancelled) return;

        const typeCountMap = new Map<string, number>();
        for (const r of data) {
          const t = r.room_type || 'Standard';
          typeCountMap.set(t, (typeCountMap.get(t) || 0) + 1);
        }

        const mapped: RoomCard[] = data.map(r => {
          const roomType = r.room_type || 'Standard';
          return { ...r, maxQuantity: typeCountMap.get(roomType) || 1 };
        });
        setRooms(mapped);
      } catch {
        if (!cancelled) setError('Failed to load rooms. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [propertyId, checkIn, checkOut]);

  const totalSelectedQty = useMemo(() =>
    Object.values(selectedRooms).reduce((a, b) => a + b, 0),
    [selectedRooms]
  );

  const totalPrice = useMemo(() => {
    let total = 0;
    for (const room of rooms) {
      const qty = selectedRooms[room.id] || 0;
      total += (parseFloat(room.base_rate) || 0) * qty * nights;
    }
    return total;
  }, [selectedRooms, rooms, nights]);

  const getTypeTotal = (roomType: string, excludeId?: string) =>
    rooms
      .filter(r => (r.room_type || 'Standard') === roomType && r.id !== excludeId)
      .reduce((sum, r) => sum + (selectedRooms[r.id] || 0), 0);

  const handleQuantity = (room: RoomCard, delta: number) => {
    setSelectedRooms(prev => {
      const current = prev[room.id] || 0;
      const next = current + delta;
      const roomType = room.room_type || 'Standard';
      const typeTotal = getTypeTotal(roomType, room.id) + next;
      const max = room.maxQuantity;

      if (next <= 0) {
        const { [room.id]: _, ...rest } = prev;
        return rest;
      }
      if (typeTotal > max) return prev;
      return { ...prev, [room.id]: next };
    });
  };

  const handleToggle = (room: RoomCard) => {
    setSelectedRooms(prev => {
      if (prev[room.id]) {
        const { [room.id]: _, ...rest } = prev;
        return rest;
      }
      const roomType = room.room_type || 'Standard';
      const typeTotal = getTypeTotal(roomType);
      if (typeTotal >= room.maxQuantity) return prev;
      return { ...prev, [room.id]: 1 };
    });
  };

  const handleContinue = () => {
    const selected = rooms.filter(r => (selectedRooms[r.id] || 0) > 0);
    if (selected.length === 0) return;

    router.push({
      pathname: '/booking-flow',
      params: {
        hotelName,
        propertyId,
        checkIn,
        checkOut,
        guests: String(guests),
        adults: String(adults),
        children: String(childrenCount),
        currency,
        roomId: selected[0].id,
        roomIds: JSON.stringify(selected.map(r => ({ id: r.id, qty: selectedRooms[r.id] || 1 }))),
      },
    });
  };

  const formatDate = (d: string) => {
    if (!d) return 'Select date';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={BG.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Rooms</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{hotelName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={FIGMA_COLORS.secondaryText} />
            <Text style={styles.locationText}>{hotelLocation}</Text>
          </View>
        </View>

        <View style={styles.dateCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Check-out</Text>
              <Text style={styles.dateValue}>{formatDate(checkOut)}</Text>
            </View>
          </View>
          {checkIn && checkOut && (
            <Text style={styles.nightCount}>{nights} {nights === 1 ? 'night' : 'nights'}</Text>
          )}
        </View>

        <View style={styles.guestCard}>
          <View style={styles.guestRow}>
            <Ionicons name="people-outline" size={18} color={SRS.navy} />
            <Text style={styles.guestLabel}>Guests</Text>
          </View>
          <Text style={styles.guestValue}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Available Rooms</Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={SRS.teal} />
            <Text style={styles.loadingText}>Finding available rooms...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={48} color="#E63946" />
            <Text style={[styles.emptyText, { color: '#E63946' }]}>{error}</Text>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bed-outline" size={48} color={SLATE[300]} />
            <Text style={styles.emptyText}>No rooms available for these dates</Text>
          </View>
        ) : (
          rooms.map(room => {
            const qty = selectedRooms[room.id] || 0;
            const hasQuantity = qty > 0;
            const roomType = room.room_type || 'Standard';
            const typeTotal = getTypeTotal(roomType);
            const maxQty = room.maxQuantity;
            const atMax = typeTotal >= maxQty;
            const price = parseFloat(room.base_rate) || 0;

            return (
              <TouchableOpacity
                key={room.id}
                activeOpacity={0.9}
                onPress={() => handleToggle(room)}
                style={[styles.roomCard, hasQuantity && styles.roomCardSelected]}
              >
                <View style={styles.roomImageContainer}>
                  <Image source={{ uri: room.photos?.cover || '' }} style={styles.roomImage} />
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>{currency} {price.toLocaleString()}</Text>
                    <Text style={styles.priceBadgeSub}>/night</Text>
                  </View>
                </View>

                <View style={styles.roomDetails}>
                  <Text style={styles.roomName}>{room.room_name}</Text>
                  <View style={styles.roomMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="bed-outline" size={14} color={FIGMA_COLORS.secondaryText} />
                      <Text style={styles.metaText}>{room.bed_type || 'Standard'} bed</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={14} color={FIGMA_COLORS.secondaryText} />
                      <Text style={styles.metaText}>Up to {room.max_adults} guests</Text>
                    </View>
                  </View>

                  <Text style={[styles.availText, atMax && { color: '#E63946' }]}>
                    {maxQty} {maxQty === 1 ? 'room' : 'rooms'} available
                  </Text>

                  <View style={styles.roomBottom}>
                    <Text style={styles.roomPrice}>
                      {currency} {price.toLocaleString()} <Text style={styles.pricePerNight}>/ night</Text>
                    </Text>

                    {hasQuantity ? (
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); handleQuantity(room, -1); }}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={16} color={SRS.teal} />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); handleQuantity(room, 1); }}
                          style={[styles.qtyBtn, atMax && { opacity: 0.35 }]}
                          disabled={atMax}
                        >
                          <Ionicons name="add" size={16} color={SRS.teal} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleToggle(room); }}
                        style={[styles.selectBtn, atMax && { opacity: 0.35 }]}
                        disabled={atMax}
                      >
                        <Text style={styles.selectBtnText}>Select</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {totalPrice > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{currency} {totalPrice.toLocaleString()}</Text>
            <Text style={styles.totalSub}>
              {nights} {nights === 1 ? 'night' : 'nights'} · {totalSelectedQty}{' '}
              {totalSelectedQty === 1 ? 'room' : 'rooms'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleContinue} style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={BG.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const SLATE = { 300: '#CBD5E1', 500: '#64748B' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FIGMA_COLORS.pageBg },
  header: {
    backgroundColor: SRS.navy, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: FONTS.playfairDisplay.bold, fontSize: 20, color: BG.white, letterSpacing: 0.3 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  propertyInfo: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  propertyName: { fontFamily: FONTS.playfairDisplay.bold, fontSize: 18, color: SRS.navy },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontFamily: FONTS.inter.regular, fontSize: 13, color: FIGMA_COLORS.secondaryText },
  dateCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: BG.white,
    borderRadius: RADIUS.card, padding: 16, ...SHADOWS.card,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: { flex: 1 },
  dateLabel: { fontFamily: FONTS.inter.regular, fontSize: 12, color: FIGMA_COLORS.mutedText, marginBottom: 4 },
  dateValue: { fontFamily: FONTS.inter.semiBold, fontSize: 14, color: SRS.navy },
  dateDivider: { width: 1, height: 36, backgroundColor: GRAY[200], marginHorizontal: 16 },
  nightCount: { fontFamily: FONTS.inter.medium, fontSize: 12, color: SRS.teal, marginTop: 10, textAlign: 'center' },
  guestCard: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: BG.white,
    borderRadius: RADIUS.card, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.card,
  },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestLabel: { fontFamily: FONTS.inter.semiBold, fontSize: 14, color: SRS.navy },
  guestValue: { fontFamily: FONTS.inter.medium, fontSize: 14, color: FIGMA_COLORS.secondaryText },
  sectionTitle: {
    fontFamily: FONTS.playfairDisplay.bold, fontSize: 16, color: SRS.navy,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: FONTS.inter.medium, fontSize: 14, color: SLATE[500], marginTop: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: FONTS.inter.medium, fontSize: 14, color: SLATE[500], marginTop: 8 },
  roomCard: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: BG.white,
    borderRadius: RADIUS.card, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    ...SHADOWS.card,
  },
  roomCardSelected: { borderColor: SRS.teal, backgroundColor: 'rgba(46, 134, 171, 0.04)' },
  roomImageContainer: { width: '100%', height: 200, position: 'relative' },
  roomImage: { width: '100%', height: '100%', backgroundColor: GRAY[200] },
  priceBadge: {
    position: 'absolute', bottom: 12, right: 12, backgroundColor: SRS.navy,
    borderRadius: RADIUS.badge, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'baseline',
  },
  priceBadgeText: { fontFamily: FONTS.inter.bold, fontSize: 16, color: BG.white },
  priceBadgeSub: { fontFamily: FONTS.inter.regular, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 2 },
  roomDetails: { padding: 16 },
  roomName: { fontFamily: FONTS.playfairDisplay.bold, fontSize: 16, color: SRS.navy, marginBottom: 6 },
  roomMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: FONTS.inter.regular, fontSize: 12, color: FIGMA_COLORS.secondaryText },
  availText: { fontFamily: FONTS.inter.medium, fontSize: 12, color: '#6B7280', marginBottom: 12 },
  roomBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomPrice: { fontFamily: FONTS.inter.bold, fontSize: 14, color: SRS.navy },
  pricePerNight: { fontFamily: FONTS.inter.regular, fontSize: 12, color: SLATE[500], fontWeight: '400' },
  selectBtn: { backgroundColor: SRS.teal, borderRadius: RADIUS.button, paddingHorizontal: 20, paddingVertical: 8 },
  selectBtnText: { fontFamily: FONTS.inter.semiBold, fontSize: 13, color: BG.white },
  quantityControls: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: GRAY[50],
    borderRadius: RADIUS.button, paddingHorizontal: 6, paddingVertical: 4,
    borderWidth: 1, borderColor: GRAY[200],
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: BG.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[200],
  },
  qtyValue: { fontFamily: FONTS.inter.bold, fontSize: 14, color: SRS.navy, minWidth: 20, textAlign: 'center' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BG.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: GRAY[200], ...SHADOWS.dropdown,
  },
  bottomInfo: { flex: 1 },
  totalLabel: { fontFamily: FONTS.inter.regular, fontSize: 12, color: FIGMA_COLORS.mutedText },
  totalPrice: { fontFamily: FONTS.inter.bold, fontSize: 20, color: SRS.navy, marginTop: 2 },
  totalSub: { fontFamily: FONTS.inter.regular, fontSize: 11, color: FIGMA_COLORS.secondaryText, marginTop: 2 },
  continueBtn: {
    backgroundColor: SRS.navy, borderRadius: RADIUS.button, flexDirection: 'row',
    alignItems: 'center', gap: 6, paddingHorizontal: 28, paddingVertical: 14,
  },
  continueBtnText: { fontFamily: FONTS.inter.semiBold, fontSize: 15, color: BG.white },
});
