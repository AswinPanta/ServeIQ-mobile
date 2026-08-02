import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function HotelDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hotel = useMemo(() => MOCK_PROPERTIES.find(h => h.id === id) || MOCK_PROPERTIES[0], [id]);

  const relatedHotels = useMemo(
    () => MOCK_PROPERTIES.filter(h => h.city === hotel.city && h.id !== hotel.id).slice(0, 3),
    [hotel]
  );

  const handleBooking = (room: { id: string; name: string; price: number }) => {
    router.push({
      pathname: '/booking-flow',
      params: {
        hotelName: hotel.name,
        checkIn: '',
        checkOut: '',
        guests: '1',
        roomId: room.id,
        roomName: room.name,
        roomPrice: String(room.price),
      },
    });
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
        <View className="relative w-full h-72 bg-surface">
          <Image
            source={{ uri: hotel.images[currentImageIndex] }}
            className="w-full h-full"
            resizeMode="cover"
          />
          {hotel.logoUrl && (
            <View style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <Image source={{ uri: hotel.logoUrl }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.95)' }} resizeMode="contain" />
            </View>
          )}
          <View className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1">
            <Text className="text-white text-sm font-semibold">
              {currentImageIndex + 1}/{hotel.images.length}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleFavorite}
            className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/90 items-center justify-center"
          >
            <Text className={cn('text-2xl', isFavorite(hotel.id) ? 'text-error' : 'text-muted')}>
              {isFavorite(hotel.id) ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          {hotel.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-2">
              {hotel.images.map((_: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentImageIndex(index)}
                  className={cn(
                    'w-3 h-3 rounded-full',
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                  )}
                />
              ))}
            </View>
          )}
        </View>

        {/* Hotel Info */}
        <View className="px-6 py-6 gap-5">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground">{hotel.name}</Text>
                <Text className="text-sm text-muted">{hotel.city}, {hotel.country}</Text>
              </View>
              <View style={{ backgroundColor: (hotel.brandColor || '#E63946') + 'E6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
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
                <View key={amenity.name} className="bg-surface rounded-full px-3 py-2">
                  <Text className="text-xs text-foreground">
                    {amenity.icon} {amenity.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Contact Hotel */}
          {(hotel.phone || hotel.email) && (
            <Card variant="outlined" padding="md">
              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">Contact Hotel</Text>
                {hotel.phone ? (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`tel:${hotel.phone}`)}
                    className="flex-row items-center gap-3"
                  >
                    <Text className="text-lg">📞</Text>
                    <Text className="text-sm text-foreground flex-1">{hotel.phone}</Text>
                    <Text className="text-xs font-semibold" style={{ color: hotel.brandColor || '#E63946' }}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {hotel.phone && hotel.email ? (
                  <View className="h-px bg-border" />
                ) : null}
                {hotel.email ? (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`mailto:${hotel.email}`)}
                    className="flex-row items-center gap-3"
                  >
                    <Text className="text-lg">✉️</Text>
                    <Text className="text-sm text-foreground flex-1">{hotel.email}</Text>
                    <Text className="text-xs font-semibold" style={{ color: hotel.brandColor || '#E63946' }}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          )}

          {/* Cancellation Policy */}
          <Card variant="outlined" padding="md">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Cancellation Policy</Text>
              <Text className="text-sm text-muted">{hotel.cancellationPolicy}</Text>
            </View>
          </Card>

          {/* Check-in/Check-out */}
          <View className="flex-row gap-4">
            <Card variant="default" padding="md" className="flex-1">
              <View className="gap-1">
                <Text className="text-xs text-muted">Check-in</Text>
                <Text className="text-base font-semibold text-foreground">{hotel.checkInTime}</Text>
              </View>
            </Card>
            <Card variant="default" padding="md" className="flex-1">
              <View className="gap-1">
                <Text className="text-xs text-muted">Check-out</Text>
                <Text className="text-base font-semibold text-foreground">{hotel.checkOutTime}</Text>
              </View>
            </Card>
          </View>

          {/* Room Types */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Available Rooms</Text>
            {hotel.roomTypes.map((room) => (
              <Card key={room.id} variant="elevated" padding="md" className="gap-3">
                <View className="flex-row items-start gap-3">
                  <Image
                    source={{ uri: room.image }}
                    className="w-20 h-20 rounded-lg bg-surface"
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
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: hotel.brandColor || '#E63946' }}>
                      NPR {room.price.toLocaleString()}
                    </Text>
                    {room.available > 0 && room.available <= 3 && (
                      <Text className="text-xs text-error font-semibold">
                        Only {room.available} left
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleBooking(room)}
                    style={{ backgroundColor: hotel.brandColor || '#E63946', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                  >
                    <Text className="text-white font-semibold text-sm">Book Now</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>

          {/* Reviews */}
          {hotel.reviews.length > 0 && (
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
          )}

          {/* Related Hotels */}
          {relatedHotels.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">More in {hotel.city}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                <View className="flex-row gap-3">
                  {relatedHotels.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => router.push({ pathname: '/[id]', params: { id: h.id } })}
                      className="w-44 rounded-xl border border-border overflow-hidden bg-surface"
                    >
                      <Image
                        source={{ uri: h.images[0] }}
                        className="w-full h-28 bg-surface"
                        resizeMode="cover"
                      />
                      <View className="p-3 gap-1">
                        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{h.name}</Text>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-yellow-400 text-xs">★</Text>
                          <Text className="text-xs text-muted">{h.rating} ({h.review_count})</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: h.brandColor || '#E63946' }}>NPR {h.price.toLocaleString()} <Text className="text-[10px] font-normal text-muted">night</Text></Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Contact */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Contact</Text>
            <View className="gap-2">
              <TouchableOpacity
                className="flex-row items-center gap-2 p-3 rounded-lg bg-surface"
                onPress={() => Linking.openURL(`tel:${hotel.phone}`)}
              >
                <Text className="text-xl">📞</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: hotel.brandColor || '#E63946' }}>{hotel.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-2 p-3 rounded-lg bg-surface"
                onPress={() => Linking.openURL(`mailto:${hotel.email}`)}
              >
                <Text className="text-xl">✉️</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: hotel.brandColor || '#E63946' }}>{hotel.email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
