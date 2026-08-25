import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { safeGoBack } from '@/lib/utils';
import { CORAL } from '@/lib/constants/figma-tokens';
const CURRENCIES = [
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'Nepali' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

const THEMES = [
  { id: 'system', label: 'System Default', desc: 'Follow your device settings' },
  { id: 'light', label: 'Light', desc: 'Always use light mode' },
  { id: 'dark', label: 'Dark', desc: 'Always use dark mode' },
];

export default function PreferencesScreen() {
  const colors = useColors();
  const [currency, setCurrency] = useState('NPR');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('system');

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-14 pb-8">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity onPress={() => safeGoBack()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Preferences</Text>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">Currency</Text>
            <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
              {CURRENCIES.map((c, index) => (
                <TouchableOpacity key={c.code} onPress={() => setCurrency(c.code)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                    borderBottomWidth: index < CURRENCIES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  activeOpacity={0.6}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{c.symbol} {c.name}</Text>
                    <Text className="text-xs text-muted">{c.code}</Text>
                  </View>
                  {currency === c.code && <Text style={{ fontSize: 16, color: CORAL[500] }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">Language</Text>
            <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
              {LANGUAGES.map((l, index) => (
                <TouchableOpacity key={l.code} onPress={() => setLanguage(l.code)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                    borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  activeOpacity={0.6}
                >
                  <Text className="flex-1 text-sm text-foreground">{l.name}</Text>
                  {language === l.code && <Text style={{ fontSize: 16, color: CORAL[500] }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">Theme</Text>
            <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
              {THEMES.map((t, index) => (
                <TouchableOpacity key={t.id} onPress={() => setTheme(t.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                    borderBottomWidth: index < THEMES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  activeOpacity={0.6}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{t.label}</Text>
                    <Text className="text-xs text-muted">{t.desc}</Text>
                  </View>
                  {theme === t.id && <Text style={{ fontSize: 16, color: CORAL[500] }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
