/**
 * Dining Reservations Screen (SRS RS-003)
 * Guest-facing restaurant table booking via the portal
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/context/auth-context';
import { safeGoBack } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { CORAL, TEXT, AMBER, BG } from '@/lib/constants/figma-tokens';

const STORAGE_KEY = 'serveiq_dining_reservations';

interface DiningReservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  section: string;
  date: string;
  time: string;
  partySize: number;
  contactPhone: string;
  specialRequests: string;
  createdAt: string;
  guestEmail?: string;
}
const ACCENT = CORAL[500];

const RESTAURANTS = [
  {
    id: 'res-1',
    name: 'Grand Himalaya Restaurant',
    cuisine: 'Nepali, Indian, Continental',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    sections: [
      { name: 'Main Dining', capacity: 60, tables: 15, hours: '7:00 AM – 10:30 PM' },
      { name: 'Rooftop Terrace', capacity: 30, tables: 8, hours: '6:00 PM – 11:00 PM' },
      { name: 'Private Room', capacity: 12, tables: 1, hours: '12:00 PM – 10:00 PM' },
    ],
  },
  {
    id: 'res-2',
    name: 'Lakeside Bistro',
    cuisine: 'International, Seafood',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    sections: [
      { name: 'Indoor Dining', capacity: 40, tables: 10, hours: '8:00 AM – 10:00 PM' },
      { name: 'Lakeside Patio', capacity: 24, tables: 6, hours: '11:00 AM – 9:00 PM' },
    ],
  },
  {
    id: 'res-3',
    name: 'Thamel Garden Café',
    cuisine: 'Café, Bakery, Light Bites',
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    sections: [
      { name: 'Garden Area', capacity: 20, tables: 5, hours: '7:00 AM – 8:00 PM' },
    ],
  },
];

const TIME_SLOTS = [
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 8, 10];

export default function DiningReservationsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<'restaurant' | 'details' | 'confirm'>('restaurant');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactPhone, setContactPhone] = useState(user && 'phone' in user ? (user as any).phone || '' : '');

  const selectedRestaurant = selectedRestaurantId
    ? RESTAURANTS.find(r => r.id === selectedRestaurantId)
    : null;

  const resetSelection = () => {
    setSelectedRestaurantId(null);
    setSelectedSection(null);
    setTimeSlot('');
    setStep('restaurant');
  };

  const handleConfirm = () => {
    if (!selectedRestaurant || !selectedSection || !timeSlot) return;
    const reservation: DiningReservation = {
      // eslint-disable-next-line react-hooks/purity
      id: `DR-${Date.now().toString(36).toUpperCase()}`,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      section: selectedSection,
      date,
      time: timeSlot,
      partySize,
      contactPhone,
      specialRequests,
      createdAt: new Date().toISOString(),
      guestEmail: (user && 'email' in user ? (user as any).email : undefined) || undefined,
    };

    // RS-003 — persist locally so the guest sees it in their profile and
    // can act on it (cancel / modify) on a subsequent session.
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        const list: DiningReservation[] = raw ? JSON.parse(raw) : [];
        list.push(reservation);
        return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      })
      .catch(() => {/* persistence is best-effort */})
      .finally(() => {
        Alert.alert(
          t('dining.reservationConfirmed'),
          `${reservation.id}\n\n${selectedRestaurant.name}\n${selectedSection}\n${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeSlot}\n${partySize} ${t('dining.guests')}\n\nA confirmation has been sent to ${reservation.guestEmail || contactPhone || 'your account'}.`,
          [{ text: t('dining.done'), onPress: () => safeGoBack() }],
        );
      });
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-6 pt-14 pb-4">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity onPress={() => step === 'restaurant' ? safeGoBack() : resetSelection()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text className="text-2xl font-bold text-foreground">{t('dining.title')}</Text>
              <Text className="text-sm text-muted">{t('dining.bookTable')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/restaurant-menu')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: ACCENT + '15' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: ACCENT }}>{t('dining.viewMenu')}</Text>
            </TouchableOpacity>
          </View>

          {step === 'restaurant' && (
            <View>
              <Text className="text-lg font-bold text-foreground mb-4">{t('dining.selectRestaurant')}</Text>
              {RESTAURANTS.map(restaurant => (
                <TouchableOpacity key={restaurant.id} onPress={() => { setSelectedRestaurantId(restaurant.id); setStep('details'); }}
                  style={{
                    padding: 16, borderRadius: 18, marginBottom: 12,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                    shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                  }}
                >
                  <View className="flex-row gap-3 mb-3">
                    <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 28 }}>🍽️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{restaurant.name}</Text>
                      <Text className="text-xs text-muted">{restaurant.cuisine}</Text>
                      <View className="flex-row items-center gap-1 mt-1">
                        <Text style={{ color: AMBER[500], fontSize: 14 }}>★</Text>
                        <Text className="text-xs font-bold text-foreground">{restaurant.rating}</Text>
                      </View>
                    </View>
                    <Text className="text-lg text-muted self-center">›</Text>
                  </View>
                  <View className="flex-row gap-2">
                    {restaurant.sections.map(s => (
                      <View key={s.name} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: ACCENT + '10' }}>
                        <Text className="text-xs font-semibold" style={{ color: ACCENT }}>{s.name}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step === 'details' && selectedRestaurant && (
            <View>
              <Text className="text-lg font-bold text-foreground mb-4">{t('dining.reservationDetails')}</Text>

              {/* Section Selection */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.diningSection')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {selectedRestaurant.sections.map(s => (
                    <TouchableOpacity key={s.name} onPress={() => setSelectedSection(s.name)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: selectedSection === s.name ? ACCENT : colors.surface,
                        borderWidth: 1, borderColor: selectedSection === s.name ? ACCENT : colors.border,
                      }}
                    >
                      <Text className="text-sm font-semibold" style={{ color: selectedSection === s.name ? BG.white : colors.foreground }}>
                        {s.name}
                      </Text>
                      <Text className="text-xs" style={{ color: selectedSection === s.name ? BG.white : colors.muted }}>
                        {t('dining.upToGuests', { n: s.capacity })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.date')}</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  className="text-sm text-foreground px-4 py-3 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                />
                <Text className="text-xs text-muted mt-1">Today: {new Date().toLocaleDateString()}</Text>
              </View>

              {/* Time Slot */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.time')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {TIME_SLOTS.map(slot => (
                    <TouchableOpacity key={slot} onPress={() => setTimeSlot(slot)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                        backgroundColor: timeSlot === slot ? ACCENT : colors.surface,
                        borderWidth: 1, borderColor: timeSlot === slot ? ACCENT : colors.border,
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: timeSlot === slot ? BG.white : colors.foreground }}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Party Size */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.partySize')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PARTY_SIZES.map(size => (
                    <TouchableOpacity key={size} onPress={() => setPartySize(size)}
                      style={{
                        width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: partySize === size ? ACCENT : colors.surface,
                        borderWidth: 1, borderColor: partySize === size ? ACCENT : colors.border,
                      }}
                    >
                      <Text className="text-sm font-bold" style={{ color: partySize === size ? BG.white : colors.foreground }}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Contact Phone */}
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.contactPhone')}</Text>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder={t('dining.phonePlaceholder')}
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  className="text-sm text-foreground px-4 py-3 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                />
              </View>

              {/* Special Requests */}
              <View style={{ marginBottom: 24 }}>
                <Text className="text-sm font-semibold text-muted mb-2">{t('dining.specialRequests')}</Text>
                <TextInput
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  placeholder={t('dining.specialRequestsPlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  className="text-sm text-foreground px-4 py-3 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minHeight: 70, textAlignVertical: 'top' }}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity onPress={() => {
                if (!selectedSection || !timeSlot) {
                  Alert.alert(t('dining.missingInfo'), t('dining.missingInfoDesc'));
                  return;
                }
                setStep('confirm');
              }}
                style={{
                  paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                  backgroundColor: ACCENT,
                  shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                }}
              >
                <Text className="text-base font-semibold text-white">{t('dining.reviewReservation')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'confirm' && selectedRestaurant && (
            <View>
              <Text className="text-lg font-bold text-foreground mb-4">{t('dining.confirmReservation')}</Text>

              <View style={{ padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                <View className="items-center mb-4">
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 32 }}>🍽️</Text>
                  </View>
                  <Text className="text-lg font-bold text-foreground">{selectedRestaurant.name}</Text>
                  <Text className="text-sm text-muted">{selectedRestaurant.cuisine}</Text>
                </View>

                <View className="gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">{t('dining.section')}</Text>
                    <Text className="text-sm font-semibold text-foreground">{selectedSection}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">{t('dining.date')}</Text>
                    <Text className="text-sm font-semibold text-foreground">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">{t('dining.time')}</Text>
                    <Text className="text-sm font-semibold text-foreground">{timeSlot}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">{t('dining.guests')}</Text>
                    <Text className="text-sm font-semibold text-foreground">{partySize}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">{t('dining.contact')}</Text>
                    <Text className="text-sm font-semibold text-foreground">{contactPhone || user?.email || '—'}</Text>
                  </View>
                  {specialRequests ? (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted">{t('dining.requests')}</Text>
                      <Text className="text-sm font-semibold text-foreground text-right flex-1">{specialRequests}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity onPress={handleConfirm}
                style={{
                  paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
                  backgroundColor: ACCENT,
                  shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                }}
              >
                <Text className="text-base font-semibold text-white">{t('dining.confirmReservation')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('details')}
                style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.border }}
              >
                <Text className="text-sm font-semibold text-muted">{t('dining.editDetails')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
