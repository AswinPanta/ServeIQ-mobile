import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Share, Linking, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { getPropertyById } from '@/lib/api';
import { safeGoBack } from "@/lib/utils";
import type { Hotel } from '@/types/api';
import { FONTS } from '@/constants/portal-theme';

const ACCENT = '#2E86AB';

export default function GuestHotelDetail() {
  const { id, checkIn: urlCheckIn, checkOut: urlCheckOut, guests: urlGuests } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [hotel, setHotel] = useState<Hotel>(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsFetching(true);
      const result = await getPropertyById(id as string);
      if (!cancelled && result) {
        setHotel(result);
      }
      if (!cancelled) setIsFetching(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

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
  const [showCalendar, setShowCalendar] = useState(false);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} contentInsetAdjustmentBehavior="automatic">
        {/* Photo Gallery */}
        <View style={s.gallery}>
          <Image source={{ uri: hotel.images[selectedImageIndex] }} style={s.mainImage} resizeMode="cover" />
          {hotel.images.length > 1 && (
            <>
              <TouchableOpacity onPress={() => setSelectedImageIndex(p => p === 0 ? hotel.images.length - 1 : p - 1)} style={[s.galleryNav, { left: 12 }]}>
                <IconSymbol name="chevron.left" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedImageIndex(p => p === hotel.images.length - 1 ? 0 : p + 1)} style={[s.galleryNav, { right: 12 }]}>
                <IconSymbol name="chevron.right" size={18} color="#FFF" />
              </TouchableOpacity>
              <View style={s.dotRow}>
                {hotel.images.map((_, i) => (
                  <View key={i} style={[s.dot, { backgroundColor: i === selectedImageIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
                ))}
              </View>
            </>
          )}

          {/* Top Actions */}
          <View style={s.topActions}>
            <TouchableOpacity onPress={() => safeGoBack()} style={s.actionBtn}>
              <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={async () => { try { await Share.share({ message: `Check out ${hotel.name}!`, title: hotel.name }); } catch {} }} style={s.actionBtn}>
                <IconSymbol name="share" size={18} color="#1A3C5E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id)} style={s.actionBtn}>
                <IconSymbol name="heart.fill" size={18} color={isFavorite(hotel.id) ? '#EF4444' : '#94A3B8'} />
              </TouchableOpacity>
            </View>
          </View>

          {hotel.images.length > 1 && (
            <TouchableOpacity onPress={() => setShowAllPhotos(!showAllPhotos)} style={s.photoCount}>
              <IconSymbol name="photo" size={12} color="#1A3C5E" />
              <Text style={s.photoCountText}>{showAllPhotos ? 'Collapse' : `${hotel.images.length} photos`}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAllPhotos && (
          <View style={{ padding: 16, gap: 12 }}>
            {hotel.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={s.fullImg} resizeMode="cover" />
            ))}
          </View>
        )}

        {!showAllPhotos && (
          <>
            {/* Hotel Info */}
            <View style={s.infoSection}>
              <Text style={s.hotelName}>{hotel.name}</Text>
              <View style={s.ratingRow}>
                <View style={s.starBadge}><IconSymbol name="star" size={12} color="#FFF" /><Text style={s.starText}>{hotel.rating}</Text></View>
                <Text style={s.reviewCount}>({hotel.review_count} reviews)</Text>
                <Text style={s.dotSep}>·</Text>
                <Text style={s.locationText}>{hotel.city}, {hotel.country}</Text>
              </View>
              <Text style={s.metaText}>{hotel.roomTypes.length} rooms · Up to {Math.max(...hotel.roomTypes.map(r => r.occupancy))} guests</Text>
            </View>

            {/* Description */}
            <View style={s.section}>
              <Text style={s.bodyText}>{hotel.description}</Text>
            </View>

            {/* Host Info */}
            <View style={s.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.hostAvatar}><IconSymbol name="person.fill" size={20} color={ACCENT} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.hostName}>Hosted by {hotel.name.split(' ')[0]}</Text>
                  <Text style={s.hostMeta}>2 years hosting · Verified</Text>
                </View>
                <View style={s.superhostBadge}><Text style={s.superhostText}>★ Superhost</Text></View>
              </View>
            </View>

            {/* Amenities */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Amenities</Text>
              <View style={{ gap: 2 }}>
                {(showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 8)).map(a => (
                  <View key={a.name} style={s.amenityRow}>
                    <IconSymbol name={(a.icon || 'wifi') as any} size={16} color="#1A3C5E" />
                    <Text style={s.amenityText}>{a.name}</Text>
                  </View>
                ))}
              </View>
              {hotel.amenities.length > 8 && (
                <TouchableOpacity onPress={() => setShowAllAmenities(v => !v)} style={s.showMoreBtn}>
                  <Text style={s.showMoreText}>{showAllAmenities ? 'Show less' : `Show all ${hotel.amenities.length}`}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Dates */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Dates</Text>
              <TouchableOpacity onPress={() => setShowCalendar(true)} style={s.dateChip}>
                <IconSymbol name="calendar" size={18} color={ACCENT} />
                <Text style={s.dateChipText}>
                  {checkInDate && checkOutDate
                    ? `${checkInDate.toLocaleDateString()} — ${checkOutDate.toLocaleDateString()}`
                    : 'Tap to select dates'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {checkInDate && checkOutDate && (
                <Text style={s.nightsText}>{nights} night{nights > 1 ? 's' : ''}</Text>
              )}
            </View>

            <DatePickerCalendar
              visible={showCalendar}
              onClose={() => setShowCalendar(false)}
              onSelectDates={(inDate, outDate) => { setCheckInDate(inDate); setCheckOutDate(outDate); }}
              initialCheckIn={checkInDate || undefined}
              initialCheckOut={checkOutDate || undefined}
            />

            {/* Guests */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Guests</Text>
              <View style={s.counterRow}>
                <TouchableOpacity onPress={() => setGuestCount(Math.max(1, guestCount - 1))} style={s.counterBtn}>
                  <IconSymbol name="minus" size={14} color="#1A3C5E" />
                </TouchableOpacity>
                <Text style={s.counterVal}>{guestCount}</Text>
                <TouchableOpacity onPress={() => setGuestCount(Math.min(10, guestCount + 1))} style={s.counterBtn}>
                  <IconSymbol name="add" size={14} color="#1A3C5E" />
                </TouchableOpacity>
                <Text style={s.guestLabel}>{guestCount} guest{guestCount > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Rooms */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Room Type</Text>
              {guestCount > Math.max(...hotel.roomTypes.map(r => r.occupancy)) && (
                <View style={s.warningBox}>
                  <Text style={s.warningText}>⚠️ {guestCount} guests selected — some rooms may not fit. Consider adding another room.</Text>
                </View>
              )}
              <View style={{ gap: 12 }}>
                {hotel.roomTypes.map(room => {
                  const fitsGuests = room.occupancy >= guestCount;
                  const isDisabled = !fitsGuests;
                  return (
                    <TouchableOpacity key={room.id} onPress={() => {
                      if (isDisabled) { Alert.alert('Room Too Small', `This room fits up to ${room.occupancy} guests.`); return; }
                      setSelectedRoom(room);
                    }}
                      activeOpacity={isDisabled ? 0.6 : 0.8}
                      style={[s.roomCard, {
                        borderColor: selectedRoom?.id === room.id ? ACCENT : '#E2E8F0',
                        backgroundColor: selectedRoom?.id === room.id ? 'rgba(46,134,171,0.04)' : '#FFF',
                        opacity: isDisabled ? 0.55 : 1,
                      }]}
                    >
                      <Image source={{ uri: room.image }} style={s.roomCardImg} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.roomCardName, isDisabled && { color: '#94A3B8' }]}>{room.name}</Text>
                        <Text style={s.roomCardMeta}>{room.bed} · Up to {room.occupancy} guests</Text>
                        {isDisabled && <Text style={s.roomDisabledNote}>✕ Fits {room.occupancy} guests only</Text>}
                        <Text style={s.roomCardPrice}>{hotel.currency} {room.price.toLocaleString()}<Text style={s.perNight}>/night</Text></Text>
                        <ScarcityBadge count={getRoomAvailability(room.name)} maxThreshold={3} position="relative" />
                      </View>
                      <View style={[s.radioCircle, { borderColor: selectedRoom?.id === room.id ? ACCENT : '#CBD5E1', backgroundColor: selectedRoom?.id === room.id ? ACCENT : 'transparent' }]}>
                        {selectedRoom?.id === room.id && <IconSymbol name="check" size={10} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cancellation */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Cancellation</Text>
              <View style={s.policyBox}>
                <IconSymbol name="info" size={14} color="#D35400" />
                <Text style={{ fontSize: 12, color: '#1A3C5E', flex: 1 }}>{hotel.cancellationPolicy}</Text>
              </View>
            </View>

            {/* Price Summary */}
            <View style={[s.section, { backgroundColor: 'rgba(46, 134, 171, 0.04)', borderWidth: 1, borderColor: 'rgba(46,134,171,0.12)' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={s.priceTitle}>{hotel.currency} {roomPrice.toLocaleString()} <Text style={{ fontSize: 12, color: '#94A3B8' }}>/night</Text></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IconSymbol name="star" size={12} color="#FFD700" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A3C5E' }}>{hotel.rating}</Text>
                </View>
              </View>
              {checkInDate && checkOutDate && selectedRoom ? (
                <View style={{ gap: 4 }}>
                  <PriceRow label={`${hotel.currency} ${roomPrice.toLocaleString()} × ${nights} night${nights > 1 ? 's' : ''}`} value={`${hotel.currency} ${subtotal.toLocaleString()}`} />
                  <PriceRow label="Cleaning fee" value={`${hotel.currency} ${Math.round(roomPrice * 0.15).toLocaleString()}`} />
                  <PriceRow label="Service fee (12%)" value={`${hotel.currency} ${Math.round(subtotal * 0.12).toLocaleString()}`} />
                  <View style={[s.priceTotalRow, { borderTopColor: 'rgba(46,134,171,0.2)' }]}>
                    <Text style={s.totalLabel}>Total</Text>
                    <Text style={s.totalVal}>{hotel.currency} {total.toLocaleString()}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingVertical: 8 }}>Select dates and room to see pricing</Text>
              )}
            </View>

            {/* Reviews */}
            <ReviewList reviews={hotelReviews} onWriteReview={() => setShowReviewModal(true)} />

            {/* Contact */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Contact</Text>
              <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`tel:${hotel.phone}`)}>
                <IconSymbol name="phone" size={16} color={ACCENT} /><Text style={s.contactText}>{hotel.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`mailto:${hotel.email}`)}>
                <IconSymbol name="email" size={16} color={ACCENT} /><Text style={s.contactText}>{hotel.email}</Text>
              </TouchableOpacity>
              <Text style={s.checkText}>Check-in: {hotel.checkInTime} · Check-out: {hotel.checkOutTime}</Text>
            </View>

            {/* Related */}
            {relatedHotels.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>More in {hotel.city}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {relatedHotels.map(h => (
                      <TouchableOpacity key={h.id} onPress={() => router.replace({ pathname: '/guest-hotel-detail/[id]', params: { id: h.id } })} style={s.relatedCard}>
                        <Image source={{ uri: h.images[0] }} style={s.relatedImg} resizeMode="cover" />
                        <View style={{ padding: 10, gap: 2 }}>
                          <Text style={s.relatedName} numberOfLines={1}>{h.name}</Text>
                          <Text style={s.relatedPrice}>{h.currency} {h.price.toLocaleString()}<Text style={{ fontSize: 10, color: '#94A3B8' }}> night</Text></Text>
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

      {/* Sticky Bottom */}
      <View style={s.bottomBar}>
        {checkInDate && checkOutDate && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
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
        }} disabled={isLoading} style={[s.bookBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.9}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={s.bookBtnText}>{checkInDate && checkOutDate && selectedRoom ? 'Book Now' : 'Select dates to book'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ReviewModal visible={showReviewModal} onClose={() => setShowReviewModal(false)} onSubmit={(review) => {
        setHotelReviews(prev => [{ id: String(prev.length + 1), author: 'You', rating: review.rating, date: new Date().toLocaleDateString(), title: review.title, comment: review.comment, photos: review.photos, verified: true }, ...prev]);
      }} hotelName={hotel.name} />
    </View>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 12, color: '#64748B' }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A3C5E' }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  gallery: { position: 'relative', backgroundColor: '#000', height: 320 },
  mainImage: { width: '100%', height: '100%' },
  galleryNav: { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dotRow: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  topActions: { position: 'absolute', top: 48, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  photoCount: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  photoCountText: { fontSize: 11, fontWeight: '600', color: '#1A3C5E' },
  fullImg: { width: '100%', height: 180, borderRadius: 12 },
  infoSection: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 6 },
  hotelName: { fontSize: 22, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.5, fontFamily: FONTS.playfairDisplay.bold },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  starText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  reviewCount: { fontSize: 11, color: '#94A3B8' },
  dotSep: { color: '#CBD5E1' },
  locationText: { fontSize: 11, color: '#94A3B8' },
  metaText: { fontSize: 11, color: '#94A3B8' },
  section: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10, letterSpacing: -0.2, fontFamily: FONTS.sora },
  bodyText: { fontSize: 13, color: '#64748B', lineHeight: 22, fontFamily: FONTS.inter.regular },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(46,134,171,0.1)', alignItems: 'center', justifyContent: 'center' },
  hostName: { fontSize: 13, fontWeight: '600', color: '#1A3C5E' },
  hostMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  superhostBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(46,134,171,0.1)' },
  superhostText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  amenityText: { fontSize: 13, color: '#1A3C5E' },
  showMoreBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1A3C5E', alignItems: 'center' },
  showMoreText: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  dateChipText: { fontSize: 13, fontWeight: '500', color: '#1A3C5E', flex: 1 },
  nightsText: { fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(46,134,171,0.1)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', minWidth: 24, textAlign: 'center' },
  guestLabel: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  warningBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(211, 84, 0, 0.08)', borderWidth: 1, borderColor: 'rgba(211, 84, 0, 0.2)', marginBottom: 12 },
  warningText: { fontSize: 11, color: '#D35400', fontWeight: '500', lineHeight: 16 },
  roomCard: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  roomCardImg: { width: 72, height: 72, borderRadius: 10 },
  roomCardName: { fontSize: 13, fontWeight: '700', color: '#1A3C5E' },
  roomCardMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  roomDisabledNote: { fontSize: 10, color: '#D35400', fontWeight: '600', marginTop: 1 },
  roomCardPrice: { fontSize: 14, fontWeight: '700', color: ACCENT, marginTop: 4, fontFamily: FONTS.inter.bold },
  perNight: { fontSize: 10, fontWeight: '400', color: '#94A3B8' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  policyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: 'rgba(211, 84, 0, 0.08)' },
  priceTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.bold },
  priceTotalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', fontFamily: FONTS.inter.bold },
  totalVal: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: ACCENT, fontWeight: '500' },
  checkText: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  relatedCard: { width: 160, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  relatedImg: { width: '100%', height: 100 },
  relatedName: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
  relatedPrice: { fontSize: 12, fontWeight: '700', color: ACCENT, marginTop: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bottomTotal: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  bottomMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  bottomPerNight: { fontSize: 11, color: '#94A3B8' },
  bookBtn: { paddingVertical: 15, borderRadius: 12, backgroundColor: '#1A3C5E', alignItems: 'center', shadowColor: '#1A3C5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  bookBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: 0.3, fontFamily: FONTS.inter.semiBold },
});
