import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Share, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import { ImageGallery } from '@/components/guest/property/ImageGallery';
import { HotelHeader } from '@/components/guest/property/HotelHeader';
import { HostInfo } from '@/components/guest/property/HostInfo';
import { AmenitiesSection } from '@/components/guest/property/AmenitiesSection';
import { RoomSelectionPanel } from '@/components/guest/property/RoomSelectionPanel';
import { ThingsToKnow } from '@/components/guest/property/ThingsToKnow';
import { RoomDetailModal } from '@/components/guest/property/RoomDetailModal';
import { useAuth } from '@/lib/context/auth-context';
import { RecommendedRooms } from '@/components/guest/property/RecommendedRooms';
import { ContactSection } from '@/components/guest/property/ContactSection';
import { PriceSummary } from '@/components/guest/property/PriceSummary';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { getPropertyById } from '@/lib/api';
import { safeGoBack } from "@/lib/utils";
import type { Hotel } from '@/types/api';
import { BG, SRS, NEUTRAL, SLATE, BRAND } from '@/lib/constants/figma-tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { OSMMap } from '@/components/feature/osm-map';

export default function GuestHotelDetail() {
  const {
    id,
    checkIn: urlCheckIn,
    checkOut: urlCheckOut,
    guests: urlGuests,
    adults: urlAdults,
    children: urlChildren,
  } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { user } = useAuth();

  // No blind fallback to MOCK_PROPERTIES[0] — a real backend UUID must never
  // silently render the Himalayan mock. Start with the id-matched mock (or
  // null) and let the fetch decide; if the fetch fails we show a retry state.
  const [hotel, setHotel] = useState<Hotel | null>(() => MOCK_PROPERTIES.find(h => h.id === id) || null);
  const [isFetching, setIsFetching] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsFetching(true);
      // Reset to a fresh state when navigating between properties so the
      // previous property is never shown while the new one loads.
      setHotel(MOCK_PROPERTIES.find(h => h.id === id) || null);
      const result = await getPropertyById(id as string);
      if (cancelled) return;
      if (result) setHotel(result);
      setIsFetching(false);
    })();
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const getRoomAvailability = useCallback((roomName: string): number => {
    const mt = (hotel?.roomTypes ?? []).find(r => r.name === roomName);
    if (mt && mt.available != null) return mt.available;
    return 3;
  }, [hotel]);

  const relatedHotels = useMemo(
    () => MOCK_PROPERTIES.filter(h => h.city === hotel?.city && h.id !== hotel?.id).slice(0, 3),
    [hotel],
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(urlCheckIn ? new Date(urlCheckIn as string) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(urlCheckOut ? new Date(urlCheckOut as string) : null);
  const [selectedRoom, setSelectedRoom] = useState<Hotel['roomTypes'][number] | null>(null);
  // Guest split: the search modal / search results pass adults + children
  // separately; fall back to the legacy single `guests` total (all adults) when
  // only that is provided.
  const [adultCount, setAdultCount] = useState(
    Math.min(10, Math.max(1, parseInt((urlAdults as string) || (urlGuests as string) || '1', 10) || 1))
  );
  const [childCount, setChildCount] = useState(
    Math.min(6, Math.max(0, parseInt((urlChildren as string) || '0', 10) || 0))
  );
  const guestCount = adultCount + childCount;
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [detailRoom, setDetailRoom] = useState<Hotel['roomTypes'][number] | null>(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [hotelReviews, setHotelReviews] = useState<Review[]>(
    () => (hotel?.reviews ?? []).map(r => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, title: '', comment: r.comment, verified: true }))
  );

  // Re-sync reviews when the loaded property changes (mock → backend or
  // navigating between properties).
  useEffect(() => {
    setHotelReviews(
      (hotel?.reviews ?? []).map(r => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, title: '', comment: r.comment, verified: true }))
    );
  }, [hotel]);

  const nights = useMemo(() => {
    if (checkInDate && checkOutDate) return Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
    return 1;
  }, [checkInDate, checkOutDate]);

  const roomPrice = selectedRoom?.price || hotel?.price || 0;

  if (!hotel) {
    return (
      <View style={s.container}>
        {isFetching ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={s.centerTitle}>Loading property…</Text>
          </View>
        ) : (
          <View style={s.centerBox}>
            <Text style={s.centerIcon}>🏨</Text>
            <Text style={s.centerTitle}>Couldn&apos;t load this property</Text>
            <Text style={s.centerText}>
              It may be offline or no longer listed. Check your connection and try again.
            </Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => setReloadKey(k => k + 1)} activeOpacity={0.85}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => safeGoBack()} activeOpacity={0.7}>
              <Text style={s.backBtnText}>← Go back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} contentInsetAdjustmentBehavior="automatic">
        <ImageGallery
          images={hotel.images}
          selectedImageIndex={selectedImageIndex}
          onSelectImage={setSelectedImageIndex}
          showAllPhotos={showAllPhotos}
          onTogglePhotos={() => setShowAllPhotos(v => !v)}
          onBack={() => safeGoBack()}
          onShare={async () => { try { await Share.share({ message: `Check out ${hotel.name}!`, title: hotel.name }); } catch { /* user cancelled */ } }}
          isFavorite={isFavorite(hotel.id)}
          onToggleFavorite={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id, hotel)}
        />

        {!showAllPhotos && (
          <>
            <HotelHeader hotel={hotel} />

            <View style={s.section}>
              <Text style={s.bodyText}>{hotel.description}</Text>
            </View>

            <View style={s.section}>
              <HostInfo hotelName={hotel.name} />
            </View>

            <View style={s.section}>
              <AmenitiesSection amenities={hotel.amenities} />
            </View>

            <View style={s.section}>
              <TouchableOpacity onPress={() => setShowCalendar(true)} style={s.dateChip}>
                <Text style={s.dateChipText}>
                  {checkInDate && checkOutDate
                    ? `${checkInDate.toLocaleDateString()} — ${checkOutDate.toLocaleDateString()}`
                    : 'Tap to select dates'}
                </Text>
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

            <View style={s.section}>
              <Text style={s.sectionTitle}>Guests</Text>
              <View style={s.guestRows}>
                <View style={s.counterRow}>
                  <Text style={s.guestLabel}>Adults</Text>
                  <View style={s.counterControls}>
                    <TouchableOpacity onPress={() => setAdultCount(Math.max(1, adultCount - 1))} style={s.counterBtn}>
                      <Text style={s.counterVal}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.counterVal}>{adultCount}</Text>
                    <TouchableOpacity onPress={() => setAdultCount(Math.min(10, adultCount + 1))} style={s.counterBtn}>
                      <Text style={s.counterVal}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.counterRow}>
                  <Text style={s.guestLabel}>Children</Text>
                  <View style={s.counterControls}>
                    <TouchableOpacity onPress={() => setChildCount(Math.max(0, childCount - 1))} style={s.counterBtn}>
                      <Text style={s.counterVal}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.counterVal}>{childCount}</Text>
                    <TouchableOpacity onPress={() => setChildCount(Math.min(6, childCount + 1))} style={s.counterBtn}>
                      <Text style={s.counterVal}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text style={s.guestTotal}>
                {adultCount} adult{adultCount > 1 ? 's' : ''}{childCount > 0 ? `, ${childCount} child${childCount > 1 ? 'ren' : ''}` : ''}
              </Text>
            </View>

            <View style={s.section}>
              {isFetching ? (
                <View style={s.roomsLoading}>
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text style={s.roomsLoadingText}>Checking room availability…</Text>
                </View>
              ) : (
                <RoomSelectionPanel
                  roomTypes={hotel.roomTypes}
                  guestCount={guestCount}
                  selectedRoom={selectedRoom}
                  onSelectRoom={setSelectedRoom}
                  hotelCurrency={hotel.currency}
                  getAvailability={getRoomAvailability}
                />
              )}
            </View>

            <View style={s.section}>
              <ThingsToKnow
                checkInTime={hotel.checkInTime}
                checkOutTime={hotel.checkOutTime}
                cancellationPolicy={hotel.cancellationPolicy}
                amenities={hotel.amenities}
              />
            </View>

            {(hotel.latitude || hotel.coordinates?.lat) && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Location</Text>
                <View style={s.mapContainer}>
                  <OSMMap
                    latitude={hotel.latitude || hotel.coordinates?.lat || 27.7172}
                    longitude={hotel.longitude || hotel.coordinates?.lng || 85.324}
                    title={hotel.name}
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <IconSymbol name="location" size={14} color={SRS.teal} />
                  <Text style={{ fontSize: 13, color: SLATE[500], flex: 1 }}>
                    {hotel.address || hotel.location}
                  </Text>
                </View>
              </View>
            )}

            <View style={s.section}>
              <PriceSummary
                currency={hotel.currency}
                roomPrice={roomPrice}
                nights={nights}
                rating={hotel.rating}
                checkInSelected={!!checkInDate}
                checkOutSelected={!!checkOutDate}
                selectedRoomName={selectedRoom?.name}
              />
            </View>

            <View style={s.section}>
              <ReviewList reviews={hotelReviews} onWriteReview={() => setShowReviewModal(true)} />
            </View>

            <View style={s.section}>
              <ContactSection
                phone={hotel.phone}
                email={hotel.email}
                checkInTime={hotel.checkInTime}
                checkOutTime={hotel.checkOutTime}
              />
            </View>

            <View style={s.section}>
              <RecommendedRooms
                hotels={relatedHotels}
                city={hotel.city}
                onHotelPress={(hid) => router.replace({ pathname: '/guest-hotel-detail/[id]', params: { id: hid } })}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.bottomBar}>
        {checkInDate && checkOutDate && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={s.bottomTotal}>{hotel.currency} {(roomPrice * nights + Math.round(roomPrice * 0.15) + Math.round(roomPrice * nights * 0.12)).toLocaleString()}</Text>
              <Text style={s.bottomMeta}>{nights} night{nights > 1 ? 's' : ''}{selectedRoom ? ` · ${selectedRoom.name}` : ''}</Text>
            </View>
            <Text style={s.bottomPerNight}>{hotel.currency} {Math.round(roomPrice * nights + Math.round(roomPrice * 0.15) + Math.round(roomPrice * nights * 0.12) / nights)}/night</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => {
          if (!user) {
            Alert.alert('Login Required', 'Please login to book this property.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => router.push('/(auth)/login') },
            ]);
            return;
          }
          if (!checkInDate || !checkOutDate) { Alert.alert('Select Dates', 'Please choose check-in and check-out dates'); return; }
          if (!selectedRoom) { Alert.alert('Select Room', 'Please select a room type'); return; }
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            router.push({ pathname: '/booking-flow', params: { hotelName: hotel.name, propertyId: hotel.id, checkIn: checkInDate!.toISOString(), checkOut: checkOutDate!.toISOString(), guests: String(guestCount), adults: String(adultCount), children: String(childCount), roomId: selectedRoom!.id, roomName: selectedRoom!.name, roomPrice: String(selectedRoom!.price) } });
          }, 500);
        }} disabled={isLoading} style={[s.bookBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.9}>
          {isLoading ? <ActivityIndicator color={BG.white} /> : (
            <Text style={s.bookBtnText}>{checkInDate && checkOutDate && selectedRoom ? 'Book Now' : 'Select dates to book'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <RoomDetailModal
        visible={showRoomDetail}
        room={detailRoom}
        hotelName={hotel.name}
        onClose={() => { setShowRoomDetail(false); setDetailRoom(null); }}
      />

      <ReviewModal visible={showReviewModal} onClose={() => setShowReviewModal(false)} onSubmit={(review) => {
        setHotelReviews(prev => [{ id: String(prev.length + 1), author: 'You', rating: review.rating, date: new Date().toLocaleDateString(), title: review.title, comment: review.comment, photos: review.photos, verified: true }, ...prev]);
      }} hotelName={hotel.name} />
    </View>
  );
}

const ACCENT = SRS.teal;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  section: { padding: 16, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, marginBottom: 10, letterSpacing: -0.2 },
  bodyText: { fontSize: 13, color: SLATE[500], lineHeight: 22 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] },
  dateChipText: { fontSize: 13, fontWeight: '500', color: BRAND.navyLight, flex: 1 },
  nightsText: { fontSize: 11, color: SLATE[400], marginTop: 4, marginLeft: 2 },
  guestRows: { gap: 12 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(46,134,171,0.1)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight, minWidth: 24, textAlign: 'center' },
  guestLabel: { fontSize: 13, color: SLATE[500] },
  guestTotal: { fontSize: 12, color: SLATE[400], marginTop: 10 },
  roomsLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 28 },
  roomsLoadingText: { fontSize: 13, color: SLATE[500], fontWeight: '500' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  centerIcon: { fontSize: 40, marginBottom: 4 },
  centerTitle: { fontSize: 17, fontWeight: '700', color: BRAND.navyLight, marginTop: 8 },
  centerText: { fontSize: 13, color: SLATE[500], textAlign: 'center', lineHeight: 20, marginTop: 4 },
  retryBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: BG.white },
  backBtn: { marginTop: 14, padding: 6 },
  backBtnText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[100] },
  bottomTotal: { fontSize: 16, fontWeight: '700', color: ACCENT },
  bottomMeta: { fontSize: 11, color: SLATE[400], marginTop: 1 },
  bottomPerNight: { fontSize: 11, color: SLATE[400] },
  bookBtn: { paddingVertical: 15, borderRadius: 12, backgroundColor: BRAND.navyLight, alignItems: 'center', shadowColor: BRAND.navyLight, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  bookBtnText: { fontSize: 14, fontWeight: '700', color: BG.white, letterSpacing: 0.3 },
  mapContainer: { borderRadius: 12, overflow: 'hidden', height: 180 },
  map: { width: '100%', height: '100%' },
});
