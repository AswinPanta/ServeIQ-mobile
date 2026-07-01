import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface DatePickerCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDates: (checkIn: Date, checkOut: Date) => void;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}

export function DatePickerCalendar({
  visible,
  onClose,
  onSelectDates,
  initialCheckIn,
  initialCheckOut,
}: DatePickerCalendarProps) {
  const colors = useColors();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(initialCheckIn || null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(initialCheckOut || null);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (!selectingCheckOut) {
      setSelectedCheckIn(selectedDate);
      setSelectingCheckOut(true);
    } else {
      if (selectedDate <= selectedCheckIn!) {
        setSelectedCheckIn(selectedDate);
        setSelectingCheckOut(false);
      } else {
        setSelectedCheckOut(selectedDate);
        onSelectDates(selectedCheckIn!, selectedDate);
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

  const handleReset = () => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    setSelectingCheckOut(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} className="h-10" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isCheckIn = selectedCheckIn?.toDateString() === date.toDateString();
      const isCheckOut = selectedCheckOut?.toDateString() === date.toDateString();
      const isBetween =
        selectedCheckIn &&
        selectedCheckOut &&
        date > selectedCheckIn &&
        date < selectedCheckOut;
      const isPast = date < new Date();

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => !isPast && handleDateSelect(day)}
          disabled={isPast}
          className={cn(
            'h-10 items-center justify-center rounded',
            isCheckIn || isCheckOut ? 'bg-primary' : isBetween ? 'bg-primary/20' : '',
            isPast ? 'opacity-30' : ''
          )}
        >
          <Text
            className={cn(
              'text-sm font-semibold',
              isCheckIn || isCheckOut ? 'text-white' : 'text-foreground',
              isToday && !isCheckIn && !isCheckOut ? 'text-primary' : ''
            )}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl max-h-[90%]">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Select Dates</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-2xl text-foreground">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            <View className="bg-surface rounded-lg p-4 mb-6">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xs text-muted mb-1">Check-in</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {selectedCheckIn ? selectedCheckIn.toLocaleDateString() : 'Select date'}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Check-out</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {selectedCheckOut ? selectedCheckOut.toLocaleDateString() : 'Select date'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={handlePrevMonth}
                className="px-4 py-2 rounded-lg bg-surface border border-border"
              >
                <Text className="text-lg font-bold text-foreground">←</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-foreground">{monthName}</Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                className="px-4 py-2 rounded-lg bg-surface border border-border"
              >
                <Text className="text-lg font-bold text-foreground">→</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-surface rounded-lg p-4 mb-6">
              <View className="flex-row justify-between mb-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} className="text-xs font-semibold text-muted text-center flex-1">
                    {day}
                  </Text>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {renderCalendarDays().map((day, index) => (
                  <View key={index} className="w-1/7">
                    {day}
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-primary/10 rounded-lg p-3 mb-6">
              <Text className="text-xs text-primary font-semibold">
                {!selectedCheckIn
                  ? 'Select check-in date'
                  : !selectedCheckOut
                  ? 'Select check-out date'
                  : 'Dates selected! Tap Apply to confirm'}
              </Text>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 px-6 py-4 border-t border-border">
            <TouchableOpacity
              onPress={handleReset}
              className="flex-1 py-3 px-4 rounded-lg bg-surface border border-border"
            >
              <Text className="text-base font-semibold text-foreground text-center">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              disabled={!selectedCheckIn || !selectedCheckOut}
              className="flex-1 py-3 px-4 rounded-lg bg-primary"
            >
              <Text className="text-base font-semibold text-white text-center">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
