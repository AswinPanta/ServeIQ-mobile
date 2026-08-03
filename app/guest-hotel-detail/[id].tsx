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

export default function GuestHotelDetail() {
  const { id, checkIn: urlCheckIn, checkOut: urlCheckOut, guests: urlGuests } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { user } = useAuth();

  const [hotel, setHotel] = useState<Hotel>(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsFetching(true);
      const result = await getPropertyById(id as string);
      if (!cancelled && result) setHotel(result);
      if (!cancelled) setIsFetching(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const getRoomAvailability = useCallback((roomName: string): number => {
    const mt = hotel.roomTypes.find(r => r.name === roomName);
    if (mt && mt.available != null) return mt.available;
    return 3;
  }, [hotel]);

  const relatedHotels = useMemo(
    () => MOCK_PROPERTIES.filter(h => h.city === hotel.city && h.id !== hotel.id).slice(0, 3),
    [hotel],
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(urlCheckIn ? new Date(urlCheckIn as string) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(urlCheckOut ? new Date(urlCheckOut as string) : null);
  const [selectedRoom, setSelectedRoom] = useState<typeof hotel.roomTypes[0] | null>(null);
  const [guestCount, setGuestCount] = useState(parseInt((urlGuests as string) || '1', 10));
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [detailRoom, setDetailRoom] = useState<typeof hotel.roomTypes[0] | null>(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [hotelReviews, setHotelReviews] = useState<Review[]>(
    () => hotel.reviews.map(r => ({ id: r.id, author: r.author, rating: r.rating, date: r.date, title: '', comment: r.comment, verified: true }))
  );

  const nights = useMemo(() => {
    if (checkInDate && checkOutDate) return Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
    return 1;
  }, [checkInDate, checkOutDate]);

  const roomPrice = selectedRoom?.price || hotel.price;

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
          onShare={async () => { try { await Share.share({ message: `Check out ${hotel.name}!`, title: hotel.name }); } catch {} }}
          isFavorite={isFavorite(hotel.id)}
          onToggleFavorite={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id)}
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
              <View style={s.counterRow}>
                <TouchableOpacity onPress={() => setGuestCount(Math.max(1, guestCount - 1))} style={s.counterBtn}>
                  <Text style={s.counterVal}>−</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{guestCount}</Text>
                <TouchableOpacity onPress={() => setGuestCount(Math.min(10, guestCount + 1))} style={s.counterBtn}>
                  <Text style={s.counterVal}>+</Text>
                </TouchableOpacity>
                <Text style={s.guestLabel}>{guestCount} guest{guestCount > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={s.section}>
              <RoomSelectionPanel
                roomTypes={hotel.roomTypes}
                guestCount={guestCount}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                hotelCurrency={hotel.currency}
                getAvailability={getRoomAvailability}
              />
            </View>

            <View style={s.section}>
              <ThingsToKnow
                checkInTime={hotel.checkInTime}
                checkOutTime={hotel.checkOutTime}
                cancellationPolicy={hotel.cancellationPolicy}
                amenities={hotel.amenities}
              />
            </View>

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
            router.push({ pathname: '/booking-flow', params: { hotelName: hotel.name, id: hotel.id, checkIn: checkInDate!.toISOString(), checkOut: checkOutDate!.toISOString(), guests: String(guestCount), roomId: selectedRoom!.id, roomName: selectedRoom!.name, roomPrice: String(selectedRoom!.price) } });
          }, 500);
        }} disabled={isLoading} style={[s.bookBtn, { opacity: isLoading ? 0.7 : 1 }]} activeOpacity={0.9}>
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
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

const ACCENT = '#2E86AB';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  section: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10, letterSpacing: -0.2 },
  bodyText: { fontSize: 13, color: '#64748B', lineHeight: 22 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  dateChipText: { fontSize: 13, fontWeight: '500', color: '#1A3C5E', flex: 1 },
  nightsText: { fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(46,134,171,0.1)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1A3C5E', minWidth: 24, textAlign: 'center' },
  guestLabel: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 36, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bottomTotal: { fontSize: 16, fontWeight: '700', color: ACCENT },
  bottomMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  bottomPerNight: { fontSize: 11, color: '#94A3B8' },
  bookBtn: { paddingVertical: 15, borderRadius: 12, backgroundColor: '#1A3C5E', alignItems: 'center', shadowColor: '#1A3C5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  bookBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
});
