import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SRS, RADIUS, SHADOWS, FIGMA_COLORS, GRAY } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

interface RoomType {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  bedInfo: string;
  amenities: string[];
  image: string;
}

const MOCK_ROOMS: RoomType[] = [
  {
    id: 'room-1',
    name: 'Resort View Deluxe Room',
    description: 'Spacious room with panoramic resort views, modern amenities, and a private balcony.',
    price: 150,
    capacity: 2,
    bedInfo: '1 King Bed',
    amenities: ['Free Wi-Fi', 'Air Conditioning', 'Breakfast', 'Balcony', 'Room Service'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=400&fit=crop',
  },
  {
    id: 'room-2',
    name: 'Lake View Suite',
    description: 'Elegant suite with stunning lake views, separate living area, and premium furnishings.',
    price: 250,
    capacity: 3,
    bedInfo: '1 King Bed + Sofa',
    amenities: ['Lake View', 'Balcony', 'Free Wi-Fi', 'Mini Bar', 'Bathtub'],
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=400&fit=crop',
  },
  {
    id: 'room-3',
    name: 'Standard Twin Room',
    description: 'Comfortable room with twin beds, ideal for friends or colleagues traveling together.',
    price: 100,
    capacity: 2,
    bedInfo: '2 Twin Beds',
    amenities: ['Free Wi-Fi', 'Air Conditioning', 'Work Desk', 'TV'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=400&fit=crop',
  },
];

export default function RoomSelectScreen() {
  const params = useLocalSearchParams<{
    hotelName?: string;
    hotelLocation?: string;
    propertyId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>();

  const hotelName = params.hotelName || 'ServeIQ Resort';
  const propertyId = params.propertyId || '';
  const hotelLocation = params.hotelLocation || 'Pokhara, Nepal';
  const checkIn = params.checkIn || '';
  const checkOut = params.checkOut || '';
  const guests = parseInt(params.guests || '1', 10);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diff = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    );
    return Math.max(1, diff);
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    let total = 0;
    MOCK_ROOMS.forEach((room) => {
      const qty = quantities[room.id] || 0;
      total += room.price * qty * nights;
    });
    if (selectedRoomId && !quantities[selectedRoomId]) {
      const room = MOCK_ROOMS.find((r) => r.id === selectedRoomId);
      if (room) total += room.price * nights;
    }
    return total;
  }, [quantities, nights, selectedRoomId]);

  const handleSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setQuantities((prev) => ({ ...prev, [roomId]: prev[roomId] || 1 }));
  };

  const handleQuantity = (roomId: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[roomId] || 0) + delta);
      if (next === 0) {
        setSelectedRoomId((s) => (s === roomId ? null : s));
        const { [roomId]: _, ...rest } = prev;
        return rest;
      }
      setSelectedRoomId(roomId);
      return { ...prev, [roomId]: next };
    });
  };

  const handleContinue = () => {
    const selectedRoom = MOCK_ROOMS.find((r) => r.id === selectedRoomId);
    const qty = quantities[selectedRoomId || ''] || 1;
    router.push({
      pathname: '/booking-flow',
      params: {
        hotelName,
        propertyId,
        checkIn,
        checkOut,
        guests: String(guests),
        roomId: selectedRoomId || '',
        roomName: selectedRoom?.name || '',
        roomPrice: String(selectedRoom?.price || 0),
        quantity: String(qty),
        nights: String(nights),
      },
    });
  };

  const formatDate = (d: string) => {
    if (!d) return 'Select date';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderAmenityPill = (amenity: string) => (
    <View key={amenity} style={styles.amenityPill}>
      <Text style={styles.amenityText}>{amenity}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={BG.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Room</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{hotelName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={FIGMA_COLORS.secondaryText} />
            <Text style={styles.locationText}>{hotelLocation}</Text>
          </View>
        </View>

        {/* Date Selector Card */}
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
            <Text style={styles.nightCount}>
              {nights} {nights === 1 ? 'night' : 'nights'}
            </Text>
          )}
        </View>

        {/* Guest Count */}
        <View style={styles.guestCard}>
          <View style={styles.guestRow}>
            <Ionicons name="people-outline" size={18} color={SRS.navy} />
            <Text style={styles.guestLabel}>Guests</Text>
          </View>
          <Text style={styles.guestValue}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</Text>
        </View>

        {/* Room Type Cards */}
        <Text style={styles.sectionTitle}>Available Rooms</Text>
        {MOCK_ROOMS.map((room) => {
          const isSelected = selectedRoomId === room.id;
          const qty = quantities[room.id] || 0;
          const hasQuantity = qty > 0;

          return (
            <TouchableOpacity
              key={room.id}
              activeOpacity={0.9}
              onPress={() => handleSelect(room.id)}
              style={[
                styles.roomCard,
                isSelected && styles.roomCardSelected,
              ]}
            >
              {/* Room Image */}
              <View style={styles.roomImageContainer}>
                <Image source={{ uri: room.image }} style={styles.roomImage} />
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>NPR {room.price}</Text>
                  <Text style={styles.priceBadgeSub}>/night</Text>
                </View>
              </View>

              {/* Room Details */}
              <View style={styles.roomDetails}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomDesc}>{room.description}</Text>

                {/* Bed & Capacity Info */}
                <View style={styles.roomMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="bed-outline" size={14} color={FIGMA_COLORS.secondaryText} />
                    <Text style={styles.metaText}>{room.bedInfo}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={FIGMA_COLORS.secondaryText} />
                    <Text style={styles.metaText}>Up to {room.capacity} guests</Text>
                  </View>
                </View>

                {/* Amenities */}
                <View style={styles.amenitiesContainer}>
                  {room.amenities.map(renderAmenityPill)}
                </View>

                {/* Bottom Row: Price + Select/Quantity */}
                <View style={styles.roomBottom}>
                  <Text style={styles.roomPrice}>
                    NPR {room.price} <Text style={styles.pricePerNight}>/ night</Text>
                  </Text>

                  {hasQuantity ? (
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleQuantity(room.id, -1); }}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={SRS.teal} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{qty}</Text>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleQuantity(room.id, 1); }}
                        style={[styles.qtyBtn, styles.qtyBtnActive]}
                      >
                        <Ionicons name="add" size={16} color={BG.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); handleSelect(room.id); }}
                      style={[
                        styles.selectBtn,
                        isSelected && styles.selectBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectBtnText,
                          isSelected && styles.selectBtnTextActive,
                        ]}
                      >
                        Select
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Bar */}
      {totalPrice > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>NPR {totalPrice}</Text>
            <Text style={styles.totalSub}>
              {nights} {nights === 1 ? 'night' : 'nights'} · {Object.values(quantities).reduce((a, b) => a + b, 0)}{' '}
              {Object.values(quantities).reduce((a, b) => a + b, 0) === 1 ? 'room' : 'rooms'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FIGMA_COLORS.pageBg,
  },
  header: {
    backgroundColor: SRS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 20,
    color: BG.white,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  propertyInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  propertyName: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 18,
    color: SRS.navy,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontFamily: FONTS.inter.regular,
    fontSize: 13,
    color: FIGMA_COLORS.secondaryText,
  },
  dateCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    padding: 16,
    ...SHADOWS.card,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: FIGMA_COLORS.mutedText,
    marginBottom: 4,
  },
  dateValue: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
    color: SRS.navy,
  },
  dateDivider: {
    width: 1,
    height: 36,
    backgroundColor: GRAY[200],
    marginHorizontal: 16,
  },
  nightCount: {
    fontFamily: FONTS.inter.medium,
    fontSize: 12,
    color: SRS.teal,
    marginTop: 10,
    textAlign: 'center',
  },
  guestCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guestLabel: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
    color: SRS.navy,
  },
  guestValue: {
    fontFamily: FONTS.inter.medium,
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
  },
  sectionTitle: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 16,
    color: SRS.navy,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  roomCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  roomCardSelected: {
    borderColor: SRS.teal,
    backgroundColor: 'rgba(46, 134, 171, 0.04)',
  },
  roomImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    backgroundColor: GRAY[200],
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: SRS.navy,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBadgeText: {
    fontFamily: FONTS.inter.bold,
    fontSize: 16,
    color: BG.white,
  },
  priceBadgeSub: {
    fontFamily: FONTS.inter.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  roomDetails: {
    padding: 16,
  },
  roomName: {
    fontFamily: FONTS.playfairDisplay.bold,
    fontSize: 16,
    color: SRS.navy,
    marginBottom: 6,
  },
  roomDesc: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: GRAY[500],
    lineHeight: 18,
    marginBottom: 10,
  },
  roomMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: FIGMA_COLORS.secondaryText,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  amenityPill: {
    backgroundColor: FIGMA_COLORS.infoBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.infoBorder,
  },
  amenityText: {
    fontFamily: FONTS.inter.medium,
    fontSize: 11,
    color: SRS.teal,
  },
  roomBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomPrice: {
    fontFamily: FONTS.inter.bold,
    fontSize: 14,
    color: SRS.navy,
  },
  pricePerNight: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: GRAY[500],
    fontWeight: '400',
  },
  selectBtn: {
    backgroundColor: SRS.teal,
    borderRadius: RADIUS.button,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  selectBtnActive: {
    backgroundColor: SRS.navy,
  },
  selectBtnText: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 13,
    color: BG.white,
  },
  selectBtnTextActive: {
    color: BG.white,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GRAY[50],
    borderRadius: RADIUS.button,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
  },
  qtyBtnActive: {
    backgroundColor: SRS.teal,
    borderColor: SRS.teal,
  },
  qtyValue: {
    fontFamily: FONTS.inter.bold,
    fontSize: 14,
    color: SRS.navy,
    minWidth: 20,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: GRAY[200],
    ...SHADOWS.dropdown,
  },
  bottomInfo: {
    flex: 1,
  },
  totalLabel: {
    fontFamily: FONTS.inter.regular,
    fontSize: 12,
    color: FIGMA_COLORS.mutedText,
  },
  totalPrice: {
    fontFamily: FONTS.inter.bold,
    fontSize: 20,
    color: SRS.navy,
    marginTop: 2,
  },
  totalSub: {
    fontFamily: FONTS.inter.regular,
    fontSize: 11,
    color: FIGMA_COLORS.secondaryText,
    marginTop: 2,
  },
  continueBtn: {
    backgroundColor: SRS.navy,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  continueBtnText: {
    fontFamily: FONTS.inter.semiBold,
    fontSize: 15,
    color: BG.white,
  },
});
