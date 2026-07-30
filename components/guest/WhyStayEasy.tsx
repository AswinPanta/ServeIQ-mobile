import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';

const FEATURE_ICONS = ['🔒', '🤝', '✅', '🌟'];
const FEATURE_KEYS: Array<{ titleKey: string; descKey: string }> = [
  { titleKey: 'components.whyStayEasy.secureBooking', descKey: 'components.whyStayEasy.secureBookingDesc' },
  { titleKey: 'components.whyStayEasy.support', descKey: 'components.whyStayEasy.supportDesc' },
  { titleKey: 'components.whyStayEasy.bestPrice', descKey: 'components.whyStayEasy.bestPriceDesc' },
  { titleKey: 'components.whyStayEasy.curated', descKey: 'components.whyStayEasy.curatedDesc' },
];

export function WhyStayEasy() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View className="py-8 px-6">
      <Text className="text-2xl font-bold text-foreground mb-2">{t('components.whyStayEasy.title')}</Text>
      <Text className="text-sm text-muted mb-6">{t('components.whyStayEasy.subtitle')}</Text>

      <View className="gap-3">
        {FEATURE_KEYS.map((f, i) => (
          <View key={i} style={{
            flexDirection: 'row', padding: 16, borderRadius: 16,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 22 }}>{FEATURE_ICONS[i]}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground mb-1">{t(f.titleKey)}</Text>
              <Text className="text-sm text-muted leading-5">{t(f.descKey)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
