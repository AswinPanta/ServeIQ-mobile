import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchModal({ visible, onClose }: SearchModalProps) {
  const colors = useColors();

  const [searchMode, setSearchMode] = useState<'stays' | 'experiences'>('stays');
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const totalGuests = adults + children;

  const handleSearch = () => {
    const checkInStr = checkIn?.toISOString().split('T')[0] || '';
    const checkOutStr = checkOut?.toISOString().split('T')[0] || '';
    onClose();
    router.push({
      pathname: '/guest-search-results',
      params: {
        location: location || 'Hotels',
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: String(totalGuests),
      },
    });
  };

  const formatDate = (d: Date | null) => {
    if (!d) return 'Add dates';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-auto bg-background rounded-t-3xl max-h-[90%]">
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Search</Text>
              <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center">
                <Text className="text-2xl text-foreground">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* Stays / Experiences Toggle */}
              <View className="flex-row bg-surface rounded-full p-1 mb-6 border border-border">
                {(['stays', 'experiences'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setSearchMode(mode)}
                    className={cn(
                      'flex-1 py-2.5 rounded-full items-center',
                      searchMode === mode ? 'bg-foreground' : ''
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm font-semibold',
                        searchMode === mode ? 'text-background' : 'text-muted'
                      )}
                    >
                      {mode === 'stays' ? '🏠 Stays' : '🎉 Experiences'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Destination</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder={searchMode === 'stays' ? 'Where are you going?' : 'Find experiences...'}
                  placeholderTextColor={colors.muted}
                  className="px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground text-base"
                />
              </View>

              {/* Date Range */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Dates</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-surface"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-lg">📅</Text>
                    <Text className="text-sm text-foreground">
                      {checkIn && checkOut
                        ? `${formatDate(checkIn)} — ${formatDate(checkOut)}`
                        : 'Add dates'}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    {checkIn && checkOut
                      ? `${Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights`
                      : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Guests */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Guests</Text>

                <View className="bg-surface rounded-xl border border-border p-4 gap-4">
                  <StepperRow label="Adults" value={adults} min={1} max={10} onChange={setAdults} />
                  <View className="h-px bg-border" />
                  <StepperRow label="Children" value={children} min={0} max={6} onChange={setChildren} />
                  <View className="h-px bg-border" />
                  <StepperRow label="Infants" value={infants} min={0} max={4} onChange={setInfants} />
                </View>

                <Text className="text-xs text-muted mt-2 ml-1">
                  {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                  {infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View className="px-6 py-4 border-t border-border gap-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={() => {
                  setLocation('');
                  setCheckIn(null);
                  setCheckOut(null);
                  setAdults(2);
                  setChildren(0);
                  setInfants(0);
                }}>
                  <Text className="text-sm font-semibold text-muted">Clear all</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSearch}
                  className="px-8 py-3 rounded-xl bg-foreground"
                >
                  <Text className="text-base font-bold text-background">Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerCalendar
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDates={(inDate, outDate) => {
          setCheckIn(inDate);
          setCheckOut(outDate);
        }}
        initialCheckIn={checkIn || undefined}
        initialCheckOut={checkOut || undefined}
      />
    </>
  );
}

function StepperRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full items-center justify-center border border-border"
          style={{ opacity: value <= min ? 0.3 : 1 }}
        >
          <Text className="text-lg font-bold text-foreground">−</Text>
        </TouchableOpacity>
        <Text className="w-6 text-center font-bold text-foreground text-base">{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full items-center justify-center border border-border"
          style={{ opacity: value >= max ? 0.3 : 1 }}
        >
          <Text className="text-lg font-bold text-foreground">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
