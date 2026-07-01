import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useColors } from "@/hooks/use-colors";

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  title: string;
  selectedDate?: string;
  minDate?: string;
}

export function DatePickerModal({
  visible,
  onClose,
  onSelect,
  title,
  selectedDate,
  minDate,
}: DatePickerModalProps) {
  const colors = useColors();
  const [tempDate, setTempDate] = useState(selectedDate || "");

  const handleDayPress = useCallback((day: DateData) => {
    setTempDate(day.dateString);
  }, []);

  const handleConfirm = useCallback(() => {
    if (tempDate) {
      onSelect(tempDate);
    }
    onClose();
  }, [tempDate, onSelect, onClose]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 16,
            paddingBottom: 32,
            maxHeight: "80%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 16, color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            current={tempDate || today}
            onDayPress={handleDayPress}
            minDate={minDate || today}
            markedDates={
              tempDate
                ? {
                    [tempDate]: {
                      selected: true,
                      selectedColor: colors.primary,
                    },
                  }
                : {}
            }
            theme={{
              backgroundColor: colors.background,
              calendarBackground: colors.background,
              textSectionTitleColor: colors.muted,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: "#ffffff",
              todayTextColor: colors.primary,
              dayTextColor: colors.foreground,
              textDisabledColor: colors.muted,
              monthTextColor: colors.foreground,
              arrowColor: colors.primary,
              textMonthFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 16,
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              marginHorizontal: 16,
            }}
          />

          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!tempDate}
              style={{
                backgroundColor: tempDate ? colors.primary : colors.muted,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                opacity: tempDate ? 1 : 0.5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                {tempDate ? `Select ${tempDate}` : "Pick a date"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
