import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { useFavorites } from '@/lib/context/favorites-context';
import { cn } from '@/lib/utils';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function HotelDetailFullScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const hotel = useMemo(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0], [id]);

  const relatedHotels = useMemo(
    () => MOCK_PROPERTIES.filter(h => h.city === hotel.city && h.id !== hotel.id).slice(0, 3),
    [hotel]
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<typeof hotel.roomTypes[0] | null>(null);
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

  const handleDateSelect = (checkIn: Date, checkOut: Date) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setShowDatePicker(false);
  };

  const handleSelectRoom = (room: typeof hotel.roomTypes[0]) => {
    setSelectedRoom(room);
  };

  const handleBookNow = () => {
    if (!checkInDate || !checkOutDate || !selectedRoom) {
      Alert.alert('Missing Information', 'Please select dates and a room type');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/booking-flow',
        params: {
          hotelName: hotel.name,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          guests: '1',
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          roomPrice: String(selectedRoom.price),
        },
      });
    }, 500);
  };

  const toggleFavorite = () => {
    if (isFavorite(hotel.id)) {
      removeFavorite(hotel.id);
    } else {
      addFavorite(hotel.id);
    }
  };

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

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="relative">
          <Image
            source={{ uri: hotel.images.length > 0 ? hotel.images[selectedImageIndex] : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop' }}
            className="w-full h-64 bg-surface"
          />
          <View className="absolute top-4 left-4 flex-row gap-2">
            <View className="bg-black/60 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">
                {hotel.images.length > 0 ? `${selectedImageIndex + 1}/${hotel.images.length}` : '1/1'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleFavorite}
              className="bg-white rounded-full w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl">{isFavorite(hotel.id) ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {hotel.images.length > 0 && (
            <View className="flex-row gap-2 px-4 py-3 bg-surface">
              {hotel.images.map((img: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  className={cn(
                    'w-16 h-16 rounded-lg overflow-hidden border-2',
                    selectedImageIndex === index ? 'border-primary' : 'border-border'
                  )}
                >
                  <Image source={{ uri: img }} className="w-full h-full bg-surface" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{hotel.name}</Text>
              <Text className="text-sm text-muted">{hotel.city}, {hotel.country}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-foreground">★ {hotel.rating}</Text>
            <Text className="text-sm text-muted">({hotel.review_count} reviews)</Text>
          </View>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-sm text-foreground leading-relaxed">{hotel.description}</Text>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Contact Information</Text>
          <View className="gap-2">
            <Text className="text-sm text-foreground">📍 {hotel.address}</Text>
            <Text className="text-sm text-foreground">📞 {hotel.phone}</Text>
            <Text className="text-sm text-foreground">✉️ {hotel.email}</Text>
            <View className="flex-row gap-4 mt-2">
              <Text className="text-xs text-muted">Check-in: {hotel.checkInTime}</Text>
              <Text className="text-xs text-muted">Check-out: {hotel.checkOutTime}</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Amenities</Text>
          <View className="flex-row flex-wrap gap-2">
            {hotel.amenities.map((amenity) => (
              <View key={amenity.name} className="bg-surface rounded-full px-3 py-2 flex-row items-center gap-1">
                <Text className="text-sm">{amenity.icon}</Text>
                <Text className="text-xs text-foreground font-semibold">{amenity.name}</Text>
              </View>
            ))}
          </View>
        </View>

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
                  : 'Select dates'}
              </Text>
            </View>
            <Text className="text-xl">📅</Text>
          </TouchableOpacity>
        </View>

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
                <Image source={{ uri: room.image }} className="w-20 h-20 rounded-lg bg-surface" />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{room.name}</Text>
                  <Text className="text-xs text-muted mb-1">
                    {room.bed} • Up to {room.occupancy} guests
                  </Text>
                  <Text className="text-xs text-foreground mb-2">{room.amenities.join(', ')}</Text>
                  <Text className="text-lg font-bold text-primary">NPR {room.price.toLocaleString()}</Text>
                  {room.available > 0 && room.available <= 3 && (
                    <Text className="text-xs text-error font-semibold">Only {room.available} left</Text>
                  )}
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

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground mb-2">Cancellation Policy</Text>
          <View className="bg-warning/10 rounded-lg p-3">
            <Text className="text-xs text-foreground">{hotel.cancellationPolicy}</Text>
          </View>
        </View>

        {/* Related Hotels */}
        {relatedHotels.length > 0 && (
          <View className="px-6 py-4 border-b border-border">
            <Text className="text-lg font-bold text-foreground mb-3">More in {hotel.city}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {relatedHotels.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => router.push({ pathname: '/hotel-detail-full/[id]', params: { id: h.id } })}
                    className="w-44 rounded-xl border border-border overflow-hidden bg-surface"
                  >
                    <Image source={{ uri: h.images[0] }} className="w-full h-28 bg-surface" resizeMode="cover" />
                    <View className="p-3 gap-1">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{h.name}</Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-yellow-400 text-xs">★</Text>
                        <Text className="text-xs text-muted">{h.rating} ({h.review_count})</Text>
                      </View>
                      <Text className="text-sm font-bold text-primary">NPR {h.price.toLocaleString()} <Text className="text-[10px] font-normal text-muted">night</Text></Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View className="px-6 py-4">
          <ReviewList
            reviews={hotelReviews}
            onWriteReview={() => setShowReviewModal(true)}
          />
        </View>

        <View className="h-8" />
      </ScrollView>

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
