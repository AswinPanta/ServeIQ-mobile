/**
 * Country & Currency Picker Component
 * Modal for selecting country and currency preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface CountryCurrency {
  code: string;
  name: string;
  currency: string;
  currencyCode: string;
  flag: string;
}

const COUNTRIES: CountryCurrency[] = [
  { code: 'NP', name: 'Nepal', currency: 'Nepalese Rupee', currencyCode: 'NPR', flag: '🇳🇵' },
  { code: 'IN', name: 'India', currency: 'Indian Rupee', currencyCode: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'US Dollar', currencyCode: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'British Pound', currencyCode: 'GBP', flag: '🇬🇧' },
  { code: 'EU', name: 'Europe', currency: 'Euro', currencyCode: 'EUR', flag: '🇪🇺' },
  { code: 'JP', name: 'Japan', currency: 'Japanese Yen', currencyCode: 'JPY', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', currency: 'Australian Dollar', currencyCode: 'AUD', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'Canadian Dollar', currencyCode: 'CAD', flag: '🇨🇦' },
];

interface CountryCurrencyPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryCurrency) => void;
  selectedCountry?: CountryCurrency;
}

export function CountryCurrencyPicker({
  visible,
  onClose,
  onSelect,
  selectedCountry,
}: CountryCurrencyPickerProps) {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(text.toLowerCase()) ||
        country.currencyCode.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCountries(filtered);
  };

  const handleSelectCountry = (country: CountryCurrency) => {
    onSelect(country);
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl">
          {/* Header */}
          <View className="px-6 py-6 border-b border-border flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Select Country & Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl text-muted">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-6 py-4">
            <View className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface">
              <Text className="text-xl mr-2">🔍</Text>
              <TextInput
                placeholder="Search country or currency"
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={handleSearch}
                className="flex-1 text-base text-foreground"
              />
            </View>
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectCountry(item)}
                className={cn(
                  'px-6 py-4 border-b border-border flex-row items-center justify-between',
                  selectedCountry?.code === item.code && 'bg-primary/10'
                )}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className="text-3xl">{item.flag}</Text>
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-sm text-muted">
                      {item.currency} ({item.currencyCode})
                    </Text>
                  </View>
                </View>
                {selectedCountry?.code === item.code && (
                  <Text className="text-xl text-primary">✓</Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-base text-muted">No countries found</Text>
              </View>
            }
          />

          {/* Close Button */}
          <View className="px-6 py-4 border-t border-border">
            <Button
              onPress={onClose}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Country Selector Button Component
 */
interface CountrySelectorProps {
  selectedCountry?: CountryCurrency;
  onPress: () => void;
}

export function CountrySelector({ selectedCountry, onPress }: CountrySelectorProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-3 rounded-lg border border-border bg-surface flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{selectedCountry?.flag || '🌍'}</Text>
        <View className="gap-1">
          <Text className="text-xs text-muted">Country & Currency</Text>
          <Text className="text-sm font-semibold text-foreground">
            {selectedCountry?.name || 'Select'}
          </Text>
        </View>
      </View>
      <Text className="text-lg text-muted">›</Text>
    </TouchableOpacity>
  );
}
