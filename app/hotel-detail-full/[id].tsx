import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import { ReviewModal } from '@/components/feature/review-modal';
import { ReviewList, type Review } from '@/components/feature/review-list';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface Room {
  id: string;
  type: string;
  bedType: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  image: string;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  review_count: number;
  description: string;
  address: string;
  phone: string;
  email: string;
  check_in_time: string;
  check_out_time: string;
  photos: Array<{ url: string; caption: string }>;
  amenities: Array<{ id: string; name: string; icon: string }>;
  cancellation_policy: string;
  rooms: Room[];
  reviews: Review[];
}

export default function HotelDetailFullScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hotelReviews, setHotelReviews] = useState<Review[]>([]);

  const mockHotel: Hotel = {
    id: id || '1',
    name: 'Grand Hotel Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    rating: 4.8,
    review_count: 342,
    description:
      'Experience luxury and comfort at our 5-star hotel in the heart of Kathmandu. Featuring world-class amenities, exceptional service, and stunning views of the Himalayas.',
    address: '123 Durbar Marg, Kathmandu, Nepal',
    phone: '+977-1-4123456',
    email: 'info@grandhotel.com.np',
    check_in_time: '14:00',
    check_out_time: '11:00',
    photos: [
      { url: 'https://via.placeholder.com/400x300?text=Hotel+Lobby', caption: 'Main Lobby' },
      { url: 'https://via.placeholder.com/400x300?text=Hotel+Room', caption: 'Room View' },
      { url: 'https://via.placeholder.com/400x300?text=Hotel+Restaurant', caption: 'Restaurant' },
    ],
    amenities: [
      { id: 'wifi', name: 'Free WiFi', icon: '📶' },
      { id: 'pool', name: 'Swimming Pool', icon: '🏊' },
      { id: 'gym', name: 'Fitness Center', icon: '💪' },
      { id: 'spa', name: 'Spa & Wellness', icon: '💆' },
      { id: 'restaurant', name: 'Restaurant & Bar', icon: '🍽️' },
      { id: 'parking', name: 'Free Parking', icon: '🅿️' },
      { id: 'concierge', name: '24/7 Concierge', icon: '🔔' },
      { id: 'business', name: 'Business Center', icon: '💼' },
    ],
    cancellation_policy:
      'Free cancellation up to 48 hours before check-in. After that, one night will be charged.',
    rooms: [
      {
        id: 'room1',
        type: 'Standard Room',
        bedType: 'Queen Bed',
        capacity: 2,
        basePrice: 8500,
        amenities: ['WiFi', 'AC', 'TV', 'Bathroom'],
        image: 'https://via.placeholder.com/300x200?text=Standard+Room',
      },
      {
        id: 'room2',
        type: 'Deluxe Room',
        bedType: 'King Bed',
        capacity: 2,
        basePrice: 12500,
        amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Mini Bar', 'Balcony'],
        image: 'https://via.placeholder.com/300x200?text=Deluxe+Room',
      },
      {
        id: 'room3',
        type: 'Suite',
        bedType: 'King Bed',
        capacity: 4,
        basePrice: 18500,
        amenities: ['WiFi', 'AC', 'TV', 'Bathroom', 'Mini Bar', 'Balcony', 'Living Area'],
        image: 'https://via.placeholder.com/300x200?text=Suite',
      },
    ],
    reviews: [
      {
        id: '1',
        author: 'John Doe',
        rating: 5,
        date: '2024-06-15',
        title: 'Excellent stay!',
        comment: 'Excellent hotel with great service and beautiful views! Highly recommend for anyone visiting Kathmandu.',
        photos: ['https://via.placeholder.com/300x300?text=Room+Photo'],
        verified: true,
      },
      {
        id: '2',
        author: 'Jane Smith',
        rating: 4,
        date: '2024-06-10',
        title: 'Good location and comfortable',
        comment: 'Good location and comfortable rooms. Highly recommended. The staff was very helpful.',
        photos: ['https://via.placeholder.com/300x300?text=Lobby+Photo', 'https://via.placeholder.com/300x300?text=Restaurant+Photo'],
        verified: true,
      },
    ] as Review[],
  };

  const handleDateSelect = (checkIn: Date, checkOut: Date) => {
    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setShowDatePicker(false);
  };

  const handleSelectRoom = (room: Room) => {
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
        pathname: '/booking-form',
        params: {
          hotelId: mockHotel.id,
          hotelName: mockHotel.name,
          roomId: selectedRoom.id,
          roomType: selectedRoom.type,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          price: selectedRoom.basePrice,
        },
      });
    }, 500);
  };

  const isFav = isFavorite(mockHotel.id);

  React.useEffect(() => {
    setHotelReviews(mockHotel.reviews);
  }, []);

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
            source={{ uri: mockHotel.photos[selectedImageIndex].url }}
            className="w-full h-64 bg-surface"
          />

          <View className="absolute top-4 right-4 flex-row gap-2">
            <View className="bg-black/60 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">
                {selectedImageIndex + 1}/{mockHotel.photos.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (isFav) {
                  removeFavorite(mockHotel.id);
                } else {
                  addFavorite(mockHotel.id);
                }
              }}
              className="bg-white rounded-full w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl">{isFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2 px-4 py-3 bg-surface">
            {mockHotel.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImageIndex(index)}
                className={cn(
                  'w-16 h-16 rounded-lg overflow-hidden border-2',
                  selectedImageIndex === index ? 'border-primary' : 'border-border'
                )}
              >
                <Image
                  source={{ uri: photo.url }}
                  className="w-full h-full bg-surface"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{mockHotel.name}</Text>
              <Text className="text-sm text-muted">
                {mockHotel.city}, {mockHotel.country}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-foreground">⭐ {mockHotel.rating}</Text>
            <Text className="text-sm text-muted">({mockHotel.review_count} reviews)</Text>
          </View>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-sm text-foreground leading-relaxed">{mockHotel.description}</Text>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Contact Information</Text>
          <View className="gap-2">
            <Text className="text-sm text-foreground">📍 {mockHotel.address}</Text>
            <Text className="text-sm text-foreground">📞 {mockHotel.phone}</Text>
            <Text className="text-sm text-foreground">✉️ {mockHotel.email}</Text>
            <View className="flex-row gap-4 mt-2">
              <Text className="text-xs text-muted">Check-in: {mockHotel.check_in_time}</Text>
              <Text className="text-xs text-muted">Check-out: {mockHotel.check_out_time}</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground mb-3">Amenities</Text>
          <View className="flex-row flex-wrap gap-2">
            {mockHotel.amenities.map((amenity) => (
              <View key={amenity.id} className="bg-surface rounded-full px-3 py-2 flex-row items-center gap-1">
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
            {mockHotel.rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                onPress={() => handleSelectRoom(room)}
                className={cn(
                  'border-2 rounded-lg p-4 flex-row gap-3',
                  selectedRoom?.id === room.id ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                )}
              >
                <Image
                  source={{ uri: room.image }}
                  className="w-20 h-20 rounded-lg bg-surface"
                />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{room.type}</Text>
                  <Text className="text-xs text-muted mb-1">
                    {room.bedType} • Up to {room.capacity} guests
                  </Text>
                  <Text className="text-xs text-foreground mb-2">
                    {room.amenities.join(', ')}
                  </Text>
                  <Text className="text-lg font-bold text-primary">NPR {room.basePrice}</Text>
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
            <Text className="text-xs text-foreground">{mockHotel.cancellation_policy}</Text>
          </View>
        </View>

        <View className="px-6 py-4">
          <ReviewList
            reviews={hotelReviews}
            onWriteReview={() => setShowReviewModal(true)}
          />
        </View>

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 py-4 border-t border-border bg-background">
        <TouchableOpacity
          onPress={handleBookNow}
          disabled={isLoading || !checkInDate || !checkOutDate || !selectedRoom}
          className={cn(
            'flex-row items-center justify-center py-4 rounded-lg',
            isLoading || !checkInDate || !checkOutDate || !selectedRoom
              ? 'bg-primary/50'
              : 'bg-primary'
          )}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-bold text-white">Book Now</Text>
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
        hotelName={mockHotel.name}
      />
    </ScreenContainer>
  );
}
