import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Share, Linking, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { useFavorites } from '@/lib/context/favorites-context';
import { useRoomStore } from '@/stores/useRoomStore';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function GuestHotelDetail() {
  const { id, checkIn: urlCheckIn, checkOut: urlCheckOut, guests: urlGuests } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const hotel = useMemo(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0], [id]);
  const roomStoreRooms = useRoomStore((s) => s.rooms);

  const getRoomAvailability = useCallback((roomName: string): number => {
    const mt = hotel.roomTypes.find(r => r.name === roomName);
    if (mt && mt.available != null) return mt.available;
    return 3;
  }, [hotel]);

  const relatedHotels = useMemo(() => MOCK_PROPERTIES.filter(h => h.city === hotel.city && h.id !== hotel.id).slice(0, 3), [hotel]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(urlCheckIn ? new Date(urlCheckIn as string) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(urlCheckOut ? new Date(urlCheckOut as string) : null);
  const [selectedRoom, setSelectedRoom] = useState<typeof hotel.roomTypes[0] | null>(null);
  const [guestCount, setGuestCount] = useState(parseInt((urlGuests as string) || '1', 10));
  const [isLoading, setIsLoading] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hotelReviews, setHotelReviews] = useState<Review[]>(
    () => hotel.reviews.map(r => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, title: '', comment: r.comment, verified: true }))
  );

  const nights = useMemo(() => {
    if (checkInDate && checkOutDate) return Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
    return 1;
  }, [checkInDate, checkOutDate]);

  const roomPrice = selectedRoom?.price || hotel.price;
  const subtotal = roomPrice * nights;
  const total = subtotal + Math.round(roomPrice * 0.15) + Math.round(subtotal * 0.12);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <IconSymbol name="arrow.back" size={18} color={SRS.navy} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Hotel Details</Text>
          <TouchableOpacity onPress={async () => { try { await Share.share({ message: `Check out ${hotel.name} in ${hotel.city}!`, title: hotel.name }); } catch {} }} style={s.headerBtn}>
            <IconSymbol name="share" size={18} color={SRS.navy} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id)} style={s.headerBtn}>
            <IconSymbol name={isFavorite(hotel.id) ? 'heart.fill' : 'heart.fill'} size={18} color={isFavorite(hotel.id) ? SRS.red : GRAY[300]} />
          </TouchableOpacity>
        </View>

        {/* Photo Gallery */}
        <View style={s.gallery}>
          <Image source={{ uri: hotel.images[selectedImageIndex] }} style={s.mainImage} resizeMode="cover" />
          {hotel.images.length > 1 && (
            <>
              <TouchableOpacity onPress={() => setSelectedImageIndex(p => p === 0 ? hotel.images.length - 1 : p - 1)} style={[s.galleryNav, { left: SPACING.md }]}>
                <IconSymbol name="chevron.left" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedImageIndex(p => p === hotel.images.length - 1 ? 0 : p + 1)} style={[s.galleryNav, { right: SPACING.md }]}>
                <IconSymbol name="chevron.right" size={18} color="#FFF" />
              </TouchableOpacity>
              <View style={s.dotRow}>
                {hotel.images.map((_, i) => (
                  <View key={i} style={[s.dot, { backgroundColor: i === selectedImageIndex ? '#FFF' : 'rgba(255,255,255,0.5)' }]} />
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowAllPhotos(!showAllPhotos)} style={s.photoCount}>
                <IconSymbol name="photo" size={12} color={SRS.navy} />
                <Text style={s.photoCountText}>{showAllPhotos ? 'Collapse' : `${hotel.images.length} photos`}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {showAllPhotos && (
          <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
            {hotel.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={{ width: '100%', height: 180, borderRadius: RADIUS.card }} resizeMode="cover" />
            ))}
          </View>
        )}

        {!showAllPhotos && (
          <>
            {/* Hotel Info */}
            <View style={s.infoSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.hotelName}>{hotel.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 }}>
                    <View style={s.starBadge}><IconSymbol name="star" size={12} color="#FFF" /><Text style={s.starText}>{hotel.rating}</Text></View>
                    <Text style={s.reviewCount}>({hotel.review_count} reviews)</Text>
                    <Text style={s.dotSep}>·</Text>
                    <Text style={s.locationText}>{hotel.city}, {hotel.country}</Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm }}>
                <Text style={s.metaText}>{hotel.roomTypes.length} rooms</Text>
                <Text style={s.metaText}>Up to {Math.max(...hotel.roomTypes.map(r => r.occupancy))} guests</Text>
              </View>
            </View>

            {/* Description */}
            <View style={s.section}>
              <Text style={s.bodyText}>{hotel.description}</Text>
            </View>

            {/* Host Info */}
            <View style={s.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View style={s.hostAvatar}><IconSymbol name="person.fill" size={20} color={SRS.teal} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy }}>Hosted by {hotel.name.split(' ')[0]}</Text>
                  <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>2 years hosting · Verified</Text>
                </View>
                <View style={s.superhostBadge}><Text style={s.superhostText}>★ Superhost</Text></View>
              </View>
            </View>

            {/* Amenities */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>What this place offers</Text>
              <View style={{ gap: 2 }}>
                {(showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 8)).map(a => (
                  <View key={a.name} style={s.amenityRow}>
                    <IconSymbol name={a.icon as any} size={16} color={SRS.navy} />
                    <Text style={s.amenityText}>{a.name}</Text>
                  </View>
                ))}
              </View>
              {hotel.amenities.length > 8 && (
                <TouchableOpacity onPress={() => setShowAllAmenities(v => !v)} style={s.showMoreBtn}>
                  <Text style={s.showMoreText}>{showAllAmenities ? 'Show less' : `Show all ${hotel.amenities.length} amenities`}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Select Dates */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Select Dates</Text>
              <TouchableOpacity onPress={() => {
                const today = new Date();
                const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                setCheckInDate(checkInDate || today);
                setCheckOutDate(checkOutDate || tomorrow);
              }} style={s.dateChip}>
                <IconSymbol name="calendar" size={18} color={SRS.teal} />
                <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy, flex: 1 }}>
                  {checkInDate && checkOutDate
                    ? `${checkInDate.toLocaleDateString()} — ${checkOutDate.toLocaleDateString()}`
                    : 'Add dates'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={GRAY[400]} />
              </TouchableOpacity>
              {checkInDate && checkOutDate && (
                <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: SPACING.xs }}>{nights} night{nights > 1 ? 's' : ''}</Text>
              )}
            </View>

            {/* Guest Count */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Guests</Text>
              <View style={s.counterRow}>
                <TouchableOpacity onPress={() => setGuestCount(Math.max(1, guestCount - 1))} style={s.counterCircle}>
                  <IconSymbol name="minus" size={14} color={SRS.navy} />
                </TouchableOpacity>
                <Text style={s.counterVal}>{guestCount}</Text>
                <TouchableOpacity onPress={() => setGuestCount(Math.min(10, guestCount + 1))} style={s.counterCircle}>
                  <IconSymbol name="add" size={14} color={SRS.navy} />
                </TouchableOpacity>
                <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500], marginLeft: SPACING.md }}>{guestCount} guest{guestCount > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Select Room */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Select Room Type</Text>
              <View style={{ gap: SPACING.md }}>
                {hotel.roomTypes.map(room => (
                  <TouchableOpacity key={room.id} onPress={() => setSelectedRoom(room)}
                    style={[s.roomCard, { borderColor: selectedRoom?.id === room.id ? SRS.teal : GRAY[200], backgroundColor: selectedRoom?.id === room.id ? SRS.teal + '06' : '#FFF' }]}
                  >
                    <Image source={{ uri: room.image }} style={s.roomImage} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.roomName}>{room.name}</Text>
                      <Text style={s.roomMeta}>{room.bed} · Up to {room.occupancy} guests</Text>
                      <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500], marginVertical: 2 }} numberOfLines={1}>{room.amenities.join(', ')}</Text>
                      <Text style={s.roomPrice}>{hotel.currency} {room.price.toLocaleString()}</Text>
                      <ScarcityBadge count={getRoomAvailability(room.name)} maxThreshold={3} position="relative" />
                    </View>
                    <View style={[s.radioCircle, { borderColor: selectedRoom?.id === room.id ? SRS.teal : GRAY[300], backgroundColor: selectedRoom?.id === room.id ? SRS.teal : 'transparent' }]}>
                      {selectedRoom?.id === room.id && <IconSymbol name="check" size={10} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cancellation */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Cancellation Policy</Text>
              <View style={s.policyBox}>
                <IconSymbol name="info" size={14} color={SRS.orange} />
                <Text style={{ ...TYPOGRAPHY.caption, color: SRS.navy, flex: 1 }}>{hotel.cancellationPolicy}</Text>
              </View>
            </View>

            {/* Price Summary */}
            <View style={[s.section, { backgroundColor: SRS.teal + '06', borderWidth: 1, borderColor: SRS.teal + '16' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                <Text style={s.priceTitle}>{hotel.currency} {roomPrice.toLocaleString()}<Text style={{ fontSize: 12, color: GRAY[400] }}>/night</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IconSymbol name="star" size={12} color="#FFD700" />
                  <Text style={{ ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.navy }}>{hotel.rating}</Text>
                </View>
              </View>
              {checkInDate && checkOutDate && selectedRoom && (
                <View style={{ gap: SPACING.xs }}>
                  <View style={s.priceRow}><Text style={s.priceLabel}>{hotel.currency} {roomPrice.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</Text><Text style={s.priceVal}>{hotel.currency} {subtotal.toLocaleString()}</Text></View>
                  <View style={s.priceRow}><Text style={s.priceLabel}>Cleaning fee</Text><Text style={s.priceVal}>{hotel.currency} {Math.round(roomPrice * 0.15).toLocaleString()}</Text></View>
                  <View style={s.priceRow}><Text style={s.priceLabel}>Service fee (12%)</Text><Text style={s.priceVal}>{hotel.currency} {Math.round(subtotal * 0.12).toLocaleString()}</Text></View>
                  <View style={[s.priceRow, s.priceTotal]}><Text style={s.totalLabel}>Total</Text><Text style={s.totalVal}>{hotel.currency} {total.toLocaleString()}</Text></View>
                </View>
              )}
              {(!checkInDate || !checkOutDate || !selectedRoom) && (
                <Text style={{ ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', marginTop: SPACING.sm }}>Select dates and room to see pricing</Text>
              )}
            </View>

            {/* Reviews */}
            <View style={s.section}>
              <ReviewList reviews={hotelReviews} onWriteReview={() => setShowReviewModal(true)} />
            </View>

            {/* Contact */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Contact</Text>
              <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`tel:${hotel.phone}`)}>
                <IconSymbol name="phone" size={16} color={SRS.teal} /><Text style={s.contactText}>{hotel.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`mailto:${hotel.email}`)}>
                <IconSymbol name="email" size={16} color={SRS.teal} /><Text style={s.contactText}>{hotel.email}</Text>
              </TouchableOpacity>
              <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 }}>Check-in: {hotel.checkInTime} · Check-out: {hotel.checkOutTime}</Text>
            </View>

            {/* Related Hotels */}
            {relatedHotels.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>More in {hotel.city}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                    {relatedHotels.map(h => (
                      <TouchableOpacity key={h.id} onPress={() => router.replace({ pathname: '/guest-hotel-detail/[id]', params: { id: h.id } })}
                        style={s.relatedCard}
                      >
                        <Image source={{ uri: h.images[0] }} style={s.relatedImg} resizeMode="cover" />
                        <View style={{ padding: SPACING.sm, gap: 2 }}>
                          <Text style={s.relatedName} numberOfLines={1}>{h.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <IconSymbol name="star" size={10} color="#FFD700" />
                            <Text style={{ fontSize: 11, color: GRAY[500] }}>{h.rating} ({h.review_count})</Text>
                          </View>
                          <Text style={s.relatedPrice}>{h.currency} {h.price.toLocaleString()}<Text style={{ fontSize: 10, color: GRAY[400] }}> night</Text></Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={s.bottomBar}>
        {checkInDate && checkOutDate && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
            <View>
              <Text style={s.bottomTotal}>{hotel.currency} {total.toLocaleString()}</Text>
              <Text style={s.bottomMeta}>{nights} night{nights > 1 ? 's' : ''}{selectedRoom ? ` · ${selectedRoom.name}` : ''}</Text>
            </View>
            <Text style={s.bottomPerNight}>{hotel.currency} {(total / nights).toFixed(0)}/night</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => {
          if (!checkInDate || !checkOutDate) { Alert.alert('Select Dates', 'Please choose check-in and check-out dates'); return; }
          if (!selectedRoom) { Alert.alert('Select Room', 'Please select a room type'); return; }
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            router.push({ pathname: '/booking-flow', params: { hotelName: hotel.name, id: hotel.id, checkIn: checkInDate!.toISOString(), checkOut: checkOutDate!.toISOString(), guests: String(guestCount), roomId: selectedRoom!.id, roomName: selectedRoom!.name, roomPrice: String(selectedRoom!.price) } });
          }, 500);
        }} disabled={isLoading} style={[s.bookBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.85}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <IconSymbol name="booking" size={16} color="#FFF" />
              <Text style={s.bookBtnText}>{checkInDate && checkOutDate && selectedRoom ? 'Book Now' : 'Select dates to book'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ReviewModal visible={showReviewModal} onClose={() => setShowReviewModal(false)} onSubmit={(review) => {
        setHotelReviews(prev => [{ id: String(prev.length + 1), author: 'You', rating: review.rating, date: new Date().toLocaleDateString(), title: review.title, comment: review.comment, photos: review.photos, verified: true }, ...prev]);
      }} hotelName={hotel.name} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  headerBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, flex: 1 },
  gallery: { position: 'relative', backgroundColor: '#000' },
  mainImage: { width: '100%', height: 300 },
  galleryNav: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: SPACING.md, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  photoCount: { position: 'absolute', bottom: SPACING.md, right: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  photoCountText: { fontSize: 11, fontWeight: '600', color: SRS.navy },
  infoSection: { padding: SPACING.lg, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  hotelName: { ...TYPOGRAPHY.h2, color: SRS.navy },
  starBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.badge },
  starText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  reviewCount: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  dotSep: { color: GRAY[300] },
  locationText: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  metaText: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  section: { padding: SPACING.lg, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  bodyText: { ...TYPOGRAPHY.body, color: GRAY[600], lineHeight: 22 },
  hostAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  superhostBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.badge, backgroundColor: SRS.teal + '10' },
  superhostText: { fontSize: 11, fontWeight: '600', color: SRS.teal },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  amenityText: { ...TYPOGRAPHY.body, color: SRS.navy },
  showMoreBtn: { marginTop: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.card, borderWidth: 1, borderColor: SRS.navy, alignItems: 'center' },
  showMoreText: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200] },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  counterCircle: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 18, fontWeight: '700', color: SRS.navy, minWidth: 28, textAlign: 'center' },
  roomCard: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1.5 },
  roomImage: { width: 72, height: 72, borderRadius: RADIUS.button },
  roomName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  roomMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  roomPrice: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.teal, marginTop: 2 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  policyBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: SRS.orange + '10' },
  priceTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...TYPOGRAPHY.small, color: GRAY[600] },
  priceVal: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  priceTotal: { borderTopWidth: 1, borderTopColor: SRS.teal + '20', paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  totalVal: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  contactText: { ...TYPOGRAPHY.body, color: SRS.teal, fontWeight: '600' },
  relatedCard: { width: 180, borderRadius: RADIUS.card, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[100], overflow: 'hidden' },
  relatedImg: { width: '100%', height: 110 },
  relatedName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  relatedPrice: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: 40, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: GRAY[100] },
  bottomTotal: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.teal },
  bottomMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  bottomPerNight: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.navy },
  bookBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
