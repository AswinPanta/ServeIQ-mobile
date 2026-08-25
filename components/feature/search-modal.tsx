import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchModal({ visible, onClose }: SearchModalProps) {
  const colors = useColors();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const totalGuests = adults + children;

  // Backend wants "YYYY-MM-DD". Date#toISOString() is UTC, so slicing it
  // shifts the date BACKWARD in positive-offset timezones (Nepal +5:45) and
  // the backend rejects it as "in the past" — format from local components.
  const toLocalDate = (d: Date | null): string => {
    if (!d) return '';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const handleSearch = () => {
    const checkInStr = toLocalDate(checkIn);
    const checkOutStr = toLocalDate(checkOut);
    onClose();
    router.push({
      pathname: '/guest-search-results',
      params: {
        location: location || 'Hotels',
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: String(totalGuests),
        adults: String(adults),
        children: String(children),
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
        <View style={s.backdrop}>
          <Pressable style={s.backdropPress} onPress={onClose} />
          <SafeAreaView edges={['bottom']} style={s.safeArea}>
            <View style={s.sheet}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>Search</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false}>
                {/* Location */}
                <View style={s.field}>
                  <Text style={s.fieldLabel}>Destination</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Where are you going?"
                    placeholderTextColor={colors.muted}
                    style={s.textInput}
                  />
                </View>

                {/* Date Range */}
                <View style={s.field}>
                  <Text style={s.fieldLabel}>Dates</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={s.dateRow}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 18 }}>📅</Text>
                      <Text style={s.dateText}>
                        {checkIn && checkOut
                          ? `${formatDate(checkIn)} — ${formatDate(checkOut)}`
                          : 'Add dates'}
                      </Text>
                    </View>
                    <Text style={s.nightsText}>
                      {checkIn && checkOut
                        ? `${Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights`
                        : ''}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Guests */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={s.fieldLabel}>Guests</Text>

                  <View style={s.guestsCard}>
                    <StepperRow label="Adults" value={adults} min={1} max={10} onChange={setAdults} />
                    <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
                    <StepperRow label="Children" value={children} min={0} max={6} onChange={setChildren} />
                  </View>

                  <Text style={s.guestCount}>
                    {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
                  </Text>
                </View>
              </ScrollView>

              {/* Bottom Bar */}
              <View style={s.bottomBar}>
                <View style={s.bottomRow}>
                  <TouchableOpacity onPress={() => {
                    setLocation('');
                    setCheckIn(null);
                    setCheckOut(null);
                    setAdults(2);
                    setChildren(0);
                  }}>
                    <Text style={s.clearBtn}>Clear all</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSearch}
                    style={s.searchBtn}
                  >
                    <Text style={s.searchBtnText}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }, value <= min && { opacity: 0.3 }]}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>−</Text>
        </TouchableOpacity>
        <Text style={{ width: 24, textAlign: 'center', fontWeight: '700', color: '#111827', fontSize: 16 }}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' }, value >= max && { opacity: 0.3 }]}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  safeArea: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 22,
    color: '#111827',
  },
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    color: '#111827',
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
  },
  nightsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  guestsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 16,
  },
  guestCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 4,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  searchBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  searchBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
