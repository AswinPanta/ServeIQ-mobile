import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { FolioBreakdown, type FolioItem } from '@/components/feature/folio-breakdown';

export default function BookingConfirmationScreen() {
  const colors = useColors();
  const params = useLocalSearchParams();

  const bookingId = (params.bookingId as string) || 'BK' + Date.now();
  const hotelName = (params.hotelName as string) || 'Hotel';
  const checkIn = (params.checkIn as string) || 'N/A';
  const checkOut = (params.checkOut as string) || 'N/A';
  const nights = parseInt((params.nights as string) || '1', 10);
  const guests = parseInt((params.guests as string) || '1', 10);
  const rooms = (params.rooms as string) || 'Standard Room';
  const total = parseInt((params.total as string) || '0', 10);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My booking at ${hotelName}: ${bookingId}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}`,
        title: 'Booking Confirmation',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download', 'Receipt download functionality coming soon');
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8 items-center gap-4 border-b border-border">
          <View className="w-16 h-16 rounded-full bg-success/20 items-center justify-center">
            <Text className="text-4xl">✓</Text>
          </View>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-foreground">Booking Confirmed!</Text>
            <Text className="text-sm text-muted">Your reservation has been confirmed</Text>
          </View>
        </View>

        <View className="px-6 py-8 gap-6">
          <View className="bg-primary/10 rounded-xl p-4 items-center gap-2">
            <Text className="text-xs text-muted">Confirmation Code</Text>
            <Text className="text-2xl font-bold text-primary">{bookingId}</Text>
            <Text className="text-xs text-muted">Save this code for your records</Text>
          </View>

          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Hotel Details</Text>
            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground">{hotelName}</Text>
                  <Text className="text-sm text-muted">{rooms}</Text>
                </View>
                <View className="bg-success/20 px-2 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-success">Confirmed</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Stay Details</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border gap-1">
                <Text className="text-xs text-muted">Check-in</Text>
                <Text className="text-base font-semibold text-foreground">{checkIn}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border gap-1">
                <Text className="text-xs text-muted">Check-out</Text>
                <Text className="text-base font-semibold text-foreground">{checkOut}</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border gap-1">
                <Text className="text-xs text-muted">Nights</Text>
                <Text className="text-base font-semibold text-foreground">{nights}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border gap-1">
                <Text className="text-xs text-muted">Guests</Text>
                <Text className="text-base font-semibold text-foreground">{guests}</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border">
            <FolioBreakdown
              items={[
                { label: rooms, quantity: nights, unitPrice: Math.round(total / nights / 1.13), total: Math.round(total / 1.13) },
              ]}
              subtotal={Math.round(total / 1.13)}
              tax={total - Math.round(total / 1.13)}
              total={total}
            />
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-sm font-semibold text-foreground">Important Information</Text>
            <View className="gap-2 mt-2">
              <Text className="text-xs text-muted">
                • A confirmation email has been sent to your email
              </Text>
              <Text className="text-xs text-muted">
                • Please arrive 15 minutes before check-in time
              </Text>
              <Text className="text-xs text-muted">
                • Present this confirmation at the front desk
              </Text>
            </View>
          </View>

          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-sm font-semibold text-foreground">Cancellation Policy</Text>
            <Text className="text-xs text-muted">
              Free cancellation up to 24 hours before check-in. Cancellations made less than 24 hours before check-in will incur a charge of 1 night's stay.
            </Text>
          </View>

          <View className="bg-surface rounded-lg p-4 items-center border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Booking QR Code</Text>
            <View className="w-40 h-40 bg-white rounded-lg items-center justify-center border-2 border-border">
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`,
                }}
                className="w-32 h-32"
              />
            </View>
            <Text className="text-xs text-muted text-center mt-2">
              Show this QR code at check-in
            </Text>
          </View>

          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={handleShare}
              style={{ paddingVertical: 12, borderRadius: 8, backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}20`, alignItems: 'center' }}
            >
              <Text className="font-semibold text-primary">Share Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDownloadReceipt}
              style={{ paddingVertical: 12, borderRadius: 8, backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}20`, alignItems: 'center' }}
            >
              <Text className="font-semibold text-primary">Download Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/')}
              style={{ paddingVertical: 12, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }}
            >
              <Text className="font-semibold text-white">Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
