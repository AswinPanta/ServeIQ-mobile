/**
 * Hotel Detail Screen
 * Full hotel information with image gallery, room types, reviews, and booking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function HotelDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock hotel data
  const hotel = {
    id: id || '1',
    name: 'Grand Hotel Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    rating: 4.8,
    review_count: 342,
    currency: 'NPR',
    check_in_time: '14:00',
    check_out_time: '11:00',
    description:
      'Experience luxury and comfort at our 5-star hotel in the heart of Kathmandu. With world-class amenities and exceptional service, we offer the perfect destination for business and leisure travelers.',
    address: '123 Main Street, Kathmandu',
    phone: '+977-1-4123456',
    email: 'info@grandhotel.com',
    website: 'www.grandhotel.com',
    photos: [
      { url: 'https://via.placeholder.com/600x400?text=Hotel+Main', caption: 'Main Entrance' },
      { url: 'https://via.placeholder.com/600x400?text=Hotel+Lobby', caption: 'Lobby' },
      { url: 'https://via.placeholder.com/600x400?text=Hotel+Room', caption: 'Room' },
      { url: 'https://via.placeholder.com/600x400?text=Hotel+Pool', caption: 'Pool' },
    ],
    amenities: [
      { id: 'wifi', name: 'Free WiFi', icon: '📶', category: 'room' },
      { id: 'pool', name: 'Swimming Pool', icon: '🏊', category: 'facility' },
      { id: 'gym', name: 'Fitness Center', icon: '💪', category: 'facility' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', category: 'facility' },
      { id: 'parking', name: 'Free Parking', icon: '🅿️', category: 'facility' },
      { id: 'spa', name: 'Spa', icon: '✨', category: 'facility' },
    ],
    cancellation_policy: 'Free cancellation up to 24 hours before check-in',
    room_types: [
      {
        id: '1',
        name: 'Standard Room',
        description: 'Comfortable room with basic amenities',
        price: 5000,
        occupancy: 2,
        bed: 'Double Bed',
        photos: [{ url: 'https://via.placeholder.com/400x300?text=Standard' }],
      },
      {
        id: '2',
        name: 'Deluxe Room',
        description: 'Spacious room with premium amenities',
        price: 8000,
        occupancy: 2,
        bed: 'King Bed',
        photos: [{ url: 'https://via.placeholder.com/400x300?text=Deluxe' }],
      },
      {
        id: '3',
        name: 'Suite',
        description: 'Luxury suite with separate living area',
        price: 12000,
        occupancy: 4,
        bed: 'King Bed + Sofa',
        photos: [{ url: 'https://via.placeholder.com/400x300?text=Suite' }],
      },
    ],
    reviews: [
      {
        id: '1',
        author: 'John Doe',
        rating: 5,
        date: '2024-01-15',
        comment: 'Excellent hotel with great service and comfortable rooms!',
      },
      {
        id: '2',
        author: 'Jane Smith',
        rating: 4,
        date: '2024-01-10',
        comment: 'Good location and friendly staff. Would recommend!',
      },
      {
        id: '3',
        author: 'Mike Johnson',
        rating: 5,
        date: '2024-01-05',
        comment: 'Best hotel in Kathmandu. Highly recommended!',
      },
    ],
  };

  const handleBooking = (roomType: any) => {
    Alert.alert('Booking', `Book ${roomType.name} for NPR ${roomType.price}/night`);
  };

  const toggleFavorite = () => {
    if (isFavorite(hotel.id)) {
      removeFavorite(hotel.id);
    } else {
      addFavorite(hotel.id);
    }
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View className="relative w-full h-64 bg-surface">
          <Image
            source={{ uri: hotel.photos[currentImageIndex].url }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Image Counter */}
          <View className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1">
            <Text className="text-white text-sm font-semibold">
              {currentImageIndex + 1}/{hotel.photos.length}
            </Text>
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            onPress={toggleFavorite}
            className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/90 items-center justify-center"
          >
            <Text className={cn('text-2xl', isFavorite(hotel.id) ? 'text-error' : 'text-muted')}>
              {isFavorite(hotel.id) ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Image Navigation */}
          {hotel.photos.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-2">
              {hotel.photos.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentImageIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  )}
                />
              ))}
            </View>
          )}
        </View>

        {/* Hotel Info */}
        <View className="px-6 py-6 gap-4">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">{hotel.name}</Text>
                <Text className="text-sm text-muted">
                  {hotel.city}, {hotel.country}
                </Text>
              </View>
              <View className="bg-primary/90 rounded-full px-3 py-1 flex-row items-center gap-1">
                <Text className="text-yellow-300 font-bold">★</Text>
                <Text className="text-white font-semibold">{hotel.rating}</Text>
              </View>
            </View>
            <Text className="text-xs text-muted">{hotel.review_count} reviews</Text>
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">About</Text>
            <Text className="text-sm text-muted leading-relaxed">{hotel.description}</Text>
          </View>

          {/* Amenities */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Amenities</Text>
            <View className="flex-row gap-2 flex-wrap">
              {hotel.amenities.map((amenity) => (
                <View key={amenity.id} className="bg-surface rounded-full px-3 py-2">
                  <Text className="text-xs text-foreground">
                    {amenity.icon} {amenity.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cancellation Policy */}
          <Card variant="outlined" padding="md">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Cancellation Policy</Text>
              <Text className="text-sm text-muted">{hotel.cancellation_policy}</Text>
            </View>
          </Card>

          {/* Check-in/Check-out */}
          <View className="flex-row gap-4">
            <Card variant="default" padding="md" className="flex-1">
              <View className="gap-1">
                <Text className="text-xs text-muted">Check-in</Text>
                <Text className="text-base font-semibold text-foreground">{hotel.check_in_time}</Text>
              </View>
            </Card>
            <Card variant="default" padding="md" className="flex-1">
              <View className="gap-1">
                <Text className="text-xs text-muted">Check-out</Text>
                <Text className="text-base font-semibold text-foreground">{hotel.check_out_time}</Text>
              </View>
            </Card>
          </View>

          {/* Room Types */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Available Rooms</Text>
            {hotel.room_types.map((room) => (
              <Card key={room.id} variant="elevated" padding="md" className="gap-3">
                <View className="flex-row items-start gap-3">
                  <Image
                    source={{ uri: room.photos[0].url }}
                    className="w-20 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-foreground">{room.name}</Text>
                    <Text className="text-xs text-muted">{room.description}</Text>
                    <Text className="text-xs text-muted">
                      {room.bed} • Up to {room.occupancy} guests
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between pt-2 border-t border-border">
                  <Text className="text-lg font-bold text-primary">
                    {hotel.currency} {room.price}
                  </Text>
                  <Button
                    onPress={() => handleBooking(room)}
                    variant="primary"
                    size="sm"
                  >
                    Book Now
                  </Button>
                </View>
              </Card>
            ))}
          </View>

          {/* Reviews */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Guest Reviews</Text>
            {hotel.reviews.map((review) => (
              <Card key={review.id} variant="default" padding="md" className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-foreground">{review.author}</Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-yellow-400">★</Text>
                    <Text className="font-semibold text-foreground">{review.rating}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted">{review.date}</Text>
                <Text className="text-sm text-muted">{review.comment}</Text>
              </Card>
            ))}
          </View>

          {/* Contact */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Contact</Text>
            <View className="gap-2">
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: colors.surface }}>
                <Text className="text-xl">📞</Text>
                <Text className="text-sm text-primary font-semibold">{hotel.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: colors.surface }}>
                <Text className="text-xl">✉️</Text>
                <Text className="text-sm text-primary font-semibold">{hotel.email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
