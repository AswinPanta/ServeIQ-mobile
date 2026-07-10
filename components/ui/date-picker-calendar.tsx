import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { cn } from '@/lib/utils';

interface DatePickerCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDates: (checkIn: Date, checkOut: Date) => void;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isPastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function formatDate(date: Date) {
  const month = MONTHS[date.getMonth()].substring(0, 3);
  return `${month} ${date.getDate()}`;
}

export function DatePickerCalendar({
  visible,
  onClose,
  onSelectDates,
  initialCheckIn,
  initialCheckOut,
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(initialCheckIn || null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(initialCheckOut || null);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) return;

    if (!selectingCheckOut || !selectedCheckIn) {
      setSelectedCheckIn(selectedDate);
      setSelectedCheckOut(null);
      setSelectingCheckOut(true);
    } else {
      if (selectedDate <= selectedCheckIn) {
        setSelectedCheckIn(selectedDate);
        setSelectedCheckOut(null);
      } else {
        setSelectedCheckOut(selectedDate);
        onSelectDates(selectedCheckIn, selectedDate);
        onClose();
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleClear = () => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    setSelectingCheckOut(false);
  };

  const screenWidth = Dimensions.get('window').width;
  const dayCellSize = Math.floor((screenWidth - 80) / 7);

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={{ width: dayCellSize, height: dayCellSize }} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const past = date < today;
      const isToday = isSameDay(date, today);
      const checkIn = selectedCheckIn && isSameDay(date, selectedCheckIn);
      const checkOut = selectedCheckOut && isSameDay(date, selectedCheckOut);
      const inRange =
        selectedCheckIn && selectedCheckOut && date > selectedCheckIn && date < selectedCheckOut;

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => !past && handleDateSelect(day)}
          disabled={past}
          activeOpacity={0.6}
          style={{ width: dayCellSize, height: dayCellSize }}
        >
          <View
            style={[
              { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
              inRange && { backgroundColor: '#EFF6FF' },
            ]}
          >
            <View
              style={[
                {
                  width: dayCellSize - 4,
                  height: dayCellSize - 4,
                  borderRadius: (dayCellSize - 4) / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                checkIn && { backgroundColor: '#2563EB' },
                checkOut && { backgroundColor: '#111827' },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: '500' },
                  past && { color: '#D1D5DB' },
                  !past && !checkIn && !checkOut && { color: '#111827' },
                  (checkIn || checkOut) && { color: '#FFFFFF', fontWeight: '600' },
                  isToday && !checkIn && !checkOut && { color: '#2563EB', fontWeight: '600' },
                ]}
              >
                {day}
              </Text>
            </View>
            {isToday && !checkIn && !checkOut && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#2563EB',
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const nights = selectedCheckIn && selectedCheckOut
    ? Math.round((selectedCheckOut.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View
          style={{
            flex: 1,
            marginTop: 'auto',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Select dates
              </Text>
              <TouchableOpacity onPress={onClose} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: '#6B7280' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                  Check-in
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: selectedCheckIn ? '#111827' : '#D1D5DB' }}>
                  {selectedCheckIn ? formatDate(selectedCheckIn) : 'Add date'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 18, color: '#D1D5DB' }}>→</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                  Check-out
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: selectedCheckOut ? '#111827' : '#D1D5DB' }}>
                  {selectedCheckOut ? formatDate(selectedCheckOut) : 'Add date'}
                </Text>
              </View>
            </View>

            {nights && (
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 22, color: '#374151', lineHeight: 24 }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 22, color: '#374151', lineHeight: 24 }}>›</Text>
              </TouchableOpacity>
            </View>

            <View>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <View
                    key={`${day}-${idx}`}
                    style={{ width: dayCellSize, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {renderCalendarDays()}
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 20,
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Check-in</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#111827' }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Check-out</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EFF6FF' }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Night</Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}
          >
            <TouchableOpacity onPress={handleClear} style={{ paddingVertical: 8, paddingRight: 16 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', textDecorationLine: 'underline' }}>
                Clear dates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              disabled={!selectedCheckIn || !selectedCheckOut}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 28,
                borderRadius: 8,
                backgroundColor: selectedCheckIn && selectedCheckOut ? '#111827' : '#F3F4F6',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedCheckIn && selectedCheckOut ? '#FFFFFF' : '#D1D5DB',
                }}
              >
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
