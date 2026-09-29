import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGE_STORAGE_KEY } from '@/lib/i18n';
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

// Codes must match the resources registered in lib/i18n/index.ts.
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'नेपाली (Nepali)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ar', name: 'العربية (Arabic)' },
];

const THEMES = [
  { id: 'system', label: 'System Default', desc: 'Follow your device settings' },
  { id: 'light', label: 'Light', desc: 'Always use light mode' },
  { id: 'dark', label: 'Dark', desc: 'Always use dark mode' },
];

export default function PreferencesScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const [currency, setCurrency] = useState('NPR');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [theme, setTheme] = useState('system');

  // Restore the saved language on mount so the checkmark matches reality.
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => { if (saved) setLanguage(saved); })
      .catch(() => {});
  }, []);

  const handleChangeLanguage = async (code: string) => {
    setLanguage(code);
    try {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // i18n or storage failure — keep the UI responsive either way.
    }
  };

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
            <Text className="text-2xl font-bold text-foreground">{t('settings.preferences', 'Preferences')}</Text>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">{t('settings.currency', 'Currency')}</Text>
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
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">{t('settings.language', 'Language')}</Text>
            <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
              {LANGUAGES.map((l, index) => (
                <TouchableOpacity key={l.code} onPress={() => handleChangeLanguage(l.code)}
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
            <Text className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">{t('settings.theme', 'Theme')}</Text>
            <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
              {THEMES.map((th, index) => (
                <TouchableOpacity key={th.id} onPress={() => setTheme(th.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
                    borderBottomWidth: index < THEMES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  activeOpacity={0.6}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{th.label}</Text>
                    <Text className="text-xs text-muted">{th.desc}</Text>
                  </View>
                  {theme === th.id && <Text style={{ fontSize: 16, color: CORAL[500] }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
