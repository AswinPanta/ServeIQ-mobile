import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { useColors } from '@/hooks/use-colors';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { useFavorites } from '@/lib/context/favorites-context';
import { useRoomStore } from '@/stores/useRoomStore';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { getPropertyById } from '@/lib/api';
import type { Hotel } from '@/types/api';
import { cn, safeGoBack } from '@/lib/utils';

export default function HotelDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [hotel, setHotel] = useState<Hotel>(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPropertyById(id as string);
      if (!cancelled && result) setHotel(result);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const roomStoreRooms = useRoomStore((s) => s.rooms);

  const getRoomAvailability = useCallback((roomName: string): number => {
    // First check the mock data 'available' field
    const mtRoom = hotel.roomTypes.find(r => r.name === roomName);
    if (mtRoom && mtRoom.available != null) return mtRoom.available;
    // Fall back to room store count
    const nameLower = roomName.toLowerCase();
    const count = roomStoreRooms.filter(
      r => r.status === 'available' && r.room_type.toLowerCase().includes(nameLower)
    ).length;
    return count > 0 ? count : Math.max(1, 5 - Math.floor(Math.random() * 3));
  }, [hotel, roomStoreRooms]);

  const relatedHotels = useMemo(
    () => MOCK_PROPERTIES.filter(h => h.city === hotel.city && h.id !== hotel.id).slice(0, 3),
    [hotel]
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<typeof hotel.roomTypes[0] | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hotelReviews, setHotelReviews] = useState<Review[]>(
    () => hotel.reviews.map(r => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date,
      title: '',
      comment: r.comment,
      verified: true,
    }))
  );

  const nights = useMemo(() => {
    if (checkInDate && checkOutDate) {
      return Math.max(1, Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
    }
    return 1;
  }, [checkInDate, checkOutDate]);

  const roomPrice = selectedRoom?.price || hotel.price;
  const subtotal = roomPrice * nights;
  const cleaningFee = Math.round(roomPrice * 0.15);
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaningFee + serviceFee;

  const toggleFavorite = () => {
    if (isFavorite(hotel.id)) {
      removeFavorite(hotel.id);
    } else {
      addFavorite(hotel.id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${hotel.name} in ${hotel.city}, Nepal!\n${hotel.description}`,
        title: hotel.name,
      });
    } catch {}
  };

  const handleDateSelect = (inDate: Date, outDate: Date) => {
    setCheckInDate(inDate);
    setCheckOutDate(outDate);
    setShowDatePicker(false);
  };

  const handleSelectRoom = (room: typeof hotel.roomTypes[0]) => {
    setSelectedRoom(room);
  };

  const handleBookNow = () => {
    if (!checkInDate || !checkOutDate) {
      Alert.alert('Select Dates', 'Please choose check-in and check-out dates');
      return;
    }
    if (!selectedRoom) {
      Alert.alert('Select Room', 'Please select a room type');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/booking-flow',
        params: {
          hotelName: hotel.name,
          id: hotel.id,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          guests: String(guestCount),
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          roomPrice: String(selectedRoom.price),
        },
      });
    }, 500);
  };

  const handleSubmitReview = (review: { rating: number; title: string; comment: string; photos: string[] }) => {
    const newReview: Review = {
      id: String(hotelReviews.length + 1),
      author: 'You',
      rating: review.rating,
      date: new Date().toLocaleDateString(),
      title: review.title,
      comment: review.comment,
      photos: review.photos,
      verified: true,
    };
    setHotelReviews([newReview, ...hotelReviews]);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? hotel.images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === hotel.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-border">
          <TouchableOpacity onPress={() => safeGoBack()}>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground flex-1">Hotel Details</Text>
          <TouchableOpacity onPress={handleShare} className="px-3 py-2">
            <Text className="text-lg">📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite}>
            <Text className={cn('text-2xl', isFavorite(hotel.id) ? '' : 'opacity-60')}>
              {isFavorite(hotel.id) ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAllPhotos ? (
          <View className="px-6 py-4">
            <TouchableOpacity
              onPress={() => setShowAllPhotos(false)}
              className="flex-row items-center gap-1.5 mb-4"
            >
              <Text className="text-base">←</Text>
              <Text className="text-sm font-semibold text-foreground">Back</Text>
            </TouchableOpacity>
            <View className="gap-3">
              {hotel.images.map((img: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri: img }}
                  className="w-full h-48 rounded-xl bg-surface"
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        ) : (
          <View className="relative">
            <Image
              source={{ uri: hotel.images.length > 0 ? hotel.images[selectedImageIndex] : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop' }}
              className="w-full h-64 bg-surface"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
            >
              <Text className="text-lg font-bold text-foreground">‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
            >
              <Text className="text-lg font-bold text-foreground">›</Text>
            </TouchableOpacity>
            {hotel.images.length > 1 && (
              <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex-row gap-1.5">
                {hotel.images.map((_: string, i: number) => (
                  <View
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full',
                      i === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </View>
            )}
            {hotel.images.length > 1 && (
              <TouchableOpacity
                onPress={() => setShowAllPhotos(true)}
                className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-full"
              >
                <Text className="text-xs font-semibold text-foreground">Show all photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!showAllPhotos && (
          <>
            {/* Hotel Info */}
            <View className="px-6 py-4 border-b border-border gap-2">
              <Text className="text-2xl font-bold text-foreground">{hotel.name}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground">★ {hotel.rating}</Text>
                <Text className="text-sm text-muted">({hotel.review_count} reviews)</Text>
                <View className="w-1 h-1 rounded-full bg-border mx-1" />
                <Text className="text-sm text-muted">{hotel.city}, {hotel.country}</Text>
              </View>
              <View className="flex-row flex-wrap gap-4 mt-1">
                <Text className="text-sm text-foreground">🛏️ {hotel.roomTypes.length} rooms</Text>
                <Text className="text-sm text-foreground">👥 Up to {hotel.roomTypes.length > 0 ? Math.max(...hotel.roomTypes.map(r => r.occupancy)) : '—'} guests</Text>
              </View>
            </View>

            {/* Description */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-sm text-foreground leading-relaxed">{hotel.description}</Text>
            </View>

            {/* Amenities */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-4">What this place offers</Text>
              <View className="gap-3">
                {hotel.amenities.map((amenity) => (
                  <View key={amenity.name} className="flex-row items-center gap-3">
                    <Text className="text-lg">{amenity.icon}</Text>
                    <Text className="text-sm text-foreground">{amenity.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Select Dates */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Select Dates</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-surface border border-border rounded-lg p-4 flex-row justify-between items-center"
              >
                <View>
                  <Text className="text-xs text-muted mb-1">Check-in → Check-out</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {checkInDate && checkOutDate
                      ? `${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}`
                      : 'Add dates'}
                  </Text>
                </View>
                <Text className="text-xl">📅</Text>
              </TouchableOpacity>
              {checkInDate && checkOutDate && (
                <Text className="text-xs text-muted mt-2">{nights} night{nights > 1 ? 's' : ''}</Text>
              )}
            </View>

            {/* Guest Count */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Guests</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="w-8 h-8 rounded-full border border-border items-center justify-center"
                >
                  <Text className="text-lg font-bold text-foreground">−</Text>
                </TouchableOpacity>
                <Text className="text-base font-semibold text-foreground w-8 text-center">
                  {guestCount}
                </Text>
                <TouchableOpacity
                  onPress={() => setGuestCount(Math.min(10, guestCount + 1))}
                  className="w-8 h-8 rounded-full border border-border items-center justify-center"
                >
                  <Text className="text-lg font-bold text-foreground">+</Text>
                </TouchableOpacity>
                <Text className="text-sm text-muted ml-2">
                  {guestCount} guest{guestCount > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Select Room */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Select Room Type</Text>
              <View className="gap-3">
                {hotel.roomTypes.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    onPress={() => handleSelectRoom(room)}
                    className={cn(
                      'border-2 rounded-lg p-4 flex-row gap-3',
                      selectedRoom?.id === room.id ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                    )}
                  >
                    <Image source={{ uri: room.image }} className="w-20 h-20 rounded-lg bg-surface" resizeMode="cover" />
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{room.name}</Text>
                      <Text className="text-xs text-muted mb-1">
                        {room.bed} • Up to {room.occupancy} guests
                      </Text>
                      {room.amenities.length > 0 && (
                        <Text className="text-xs text-foreground mb-2" numberOfLines={1}>
                          {room.amenities.join(', ')}
                        </Text>
                      )}
                      <Text className="text-lg font-bold text-primary">
                        {hotel.currency} {room.price.toLocaleString()}
                      </Text>
                      <ScarcityBadge count={getRoomAvailability(room.name)} maxThreshold={3} position="relative" />
                    </View>
                    <View className="items-center justify-center">
                      <View
                        className={cn(
                          'w-6 h-6 rounded-full border-2 items-center justify-center',
                          selectedRoom?.id === room.id ? 'border-primary bg-primary' : 'border-border'
                        )}
                      >
                        {selectedRoom?.id === room.id && <Text className="text-white text-xs">✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cancellation Policy */}
            <View className="px-6 py-4 border-b border-border">
              <Text className="text-lg font-bold text-foreground mb-2">Cancellation Policy</Text>
              <View className="bg-warning/10 rounded-lg p-3">
                <Text className="text-xs text-foreground">{hotel.cancellationPolicy}</Text>
              </View>
            </View>

            {/* Price Card */}
            <View className="mx-6 my-4 border border-border rounded-2xl p-6 bg-surface">
              <View className="flex-row items-baseline justify-between mb-4">
                <View>
                  <Text className="text-2xl font-bold text-foreground">
                    {hotel.currency} {roomPrice.toLocaleString()}
                  </Text>
                  <Text className="text-sm text-muted">/ night</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-bold text-foreground">★ {hotel.rating}</Text>
                  <Text className="text-xs text-muted">({hotel.review_count})</Text>
                </View>
              </View>

              {checkInDate && checkOutDate && selectedRoom && (
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted underline">
                      {hotel.currency} {roomPrice.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}
                    </Text>
                    <Text className="text-sm text-foreground">
                      {hotel.currency} {subtotal.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted underline">Cleaning fee</Text>
                    <Text className="text-sm text-foreground">
                      {hotel.currency} {cleaningFee.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted underline">Service fee</Text>
                    <Text className="text-sm text-foreground">
                      {hotel.currency} {serviceFee.toLocaleString()}
                    </Text>
                  </View>
                  <View className="border-t border-border pt-3 flex-row justify-between">
                    <Text className="text-base font-bold text-foreground">Total</Text>
                    <Text className="text-base font-bold text-primary">
                      {hotel.currency} {total.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {(!checkInDate || !checkOutDate || !selectedRoom) && (
                <Text className="text-xs text-muted text-center mt-2">
                  Select dates and room to see pricing
                </Text>
              )}
            </View>

            {/* Reviews */}
            <View className="px-6 py-4">
              <ReviewList
                reviews={hotelReviews}
                onWriteReview={() => setShowReviewModal(true)}
              />
            </View>

            {/* Contact */}
            <View className="px-6 py-4 gap-3">
              <Text className="text-lg font-bold text-foreground">Contact</Text>
              <View className="gap-2">
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={() => Linking.openURL(`tel:${hotel.phone}`)}
                >
                  <Text className="text-lg">📞</Text>
                  <Text className="text-sm text-primary font-semibold">{hotel.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  onPress={() => Linking.openURL(`mailto:${hotel.email}`)}
                >
                  <Text className="text-lg">📧</Text>
                  <Text className="text-sm text-primary font-semibold">{hotel.email}</Text>
                </TouchableOpacity>
                <Text className="text-xs text-muted mt-1">
                  Check-in: {hotel.checkInTime} • Check-out: {hotel.checkOutTime}
                </Text>
              </View>
            </View>

            {/* Related Hotels */}
            {relatedHotels.length > 0 && (
              <View className="px-6 py-4 border-t border-border">
                <Text className="text-lg font-bold text-foreground mb-3">More in {hotel.city}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                  <View className="flex-row gap-3">
                    {relatedHotels.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        onPress={() => router.replace({ pathname: '/hotel-detail/[id]', params: { id: h.id } })}
                        className="w-44 rounded-xl border border-border overflow-hidden bg-surface"
                      >
                        <Image source={{ uri: h.images[0] }} className="w-full h-28 bg-surface" resizeMode="cover" />
                        <View className="p-3 gap-1">
                          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{h.name}</Text>
                          <View className="flex-row items-center gap-1">
                            <Text className="text-yellow-400 text-xs">★</Text>
                            <Text className="text-xs text-muted">{h.rating} ({h.review_count})</Text>
                          </View>
                          <Text className="text-sm font-bold text-primary">
                            {h.currency} {h.price.toLocaleString()}
                            <Text className="text-[10px] font-normal text-muted"> night</Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="px-6 pt-3 pb-6 border-t border-border bg-background shadow-sm">
        {checkInDate && checkOutDate && (
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xl font-bold text-foreground">
                {hotel.currency} {total.toLocaleString()}
              </Text>
              <Text className="text-sm text-muted">
                <Text className="font-medium text-foreground">{nights}</Text> {nights === 1 ? 'night' : 'nights'}
                {selectedRoom ? <Text className="text-muted"> · {selectedRoom.name}</Text> : null}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">{hotel.currency} {(total / nights).toFixed(0)}/night</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={handleBookNow}
          disabled={isLoading || !checkInDate || !checkOutDate || !selectedRoom}
          className={cn(
            'py-4 rounded-xl items-center justify-center',
            isLoading || !checkInDate || !checkOutDate || !selectedRoom
              ? 'bg-primary/50'
              : 'bg-primary'
          )}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-bold text-white">
              {checkInDate && checkOutDate && selectedRoom ? 'Book Now' : 'Select dates to book'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <DatePickerCalendar
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDates={handleDateSelect}
        initialCheckIn={checkInDate || undefined}
        initialCheckOut={checkOutDate || undefined}
      />

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        hotelName={hotel.name}
      />
    </ScreenContainer>
  );
}
