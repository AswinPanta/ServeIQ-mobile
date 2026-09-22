import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useAppLanguage } from '@/hooks/use-app-language';
import { useAppCurrency } from '@/hooks/use-app-currency';
import { NEUTRAL, SLATE, BRAND, BG, TEXT, CORAL } from '@/lib/constants/figma-tokens';

export function GuestFooter() {
  const { language, setLanguage, availableLanguages } = useAppLanguage();
  const { currency, setCurrency, availableCurrencies } = useAppCurrency();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const currencySymbol = (code: string) =>
    availableCurrencies.find(c => c.code === code)?.label.match(/\((.+)\)/)?.[1] ?? '';

  return (
    <View style={s.container}>
      {/* Divider */}
      <View style={s.divider} />

      {/* Bottom Row */}
      <View style={s.bottomRow}>
        <Text style={s.copyright}>© 2026 ServeIQ, Inc. All rights reserved.</Text>
        <View style={s.bottomActions}>
          <Pressable style={s.actionBtn} onPress={() => setShowLangPicker(true)}>
            <Text style={s.actionIcon}>🌐</Text>
            <Text style={s.actionText}>
              {availableLanguages.find(l => l.code === language)?.label ?? 'English'}
            </Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => setShowCurrPicker(true)}>
            <Text style={s.actionText}>{currencySymbol(currency)} {currency}</Text>
          </Pressable>
        </View>
      </View>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowLangPicker(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={s.modalTitle}>Select Language</Text>
            <ScrollView>
              {availableLanguages.map(lang => (
                <Pressable
                  key={lang.code}
                  style={s.langRow}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                >
                  <Text style={[s.langLabel, language === lang.code && s.langLabelActive]}>
                    {lang.label}
                  </Text>
                  {language === lang.code && <Text style={s.langCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrPicker} transparent animationType="slide" onRequestClose={() => setShowCurrPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowCurrPicker(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={s.modalTitle}>Select Currency</Text>
            <ScrollView>
              {availableCurrencies.map(c => (
                <Pressable
                  key={c.code}
                  style={s.langRow}
                  onPress={() => {
                    setCurrency(c.code);
                    setShowCurrPicker(false);
                  }}
                >
                  <Text style={[s.langLabel, currency === c.code && s.langLabelActive]}>
                    {c.label}
                  </Text>
                  {currency === c.code && <Text style={s.langCheck}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: NEUTRAL[50],
    borderTopWidth: 1,
    borderTopColor: SLATE[100],
  },
  divider: {
    height: 1,
    backgroundColor: SLATE[200],
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyright: {
    fontSize: 11,
    color: SLATE[400],
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: SLATE[600],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: BG.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  langLabel: {
    fontSize: 15,
    color: SLATE[700],
  },
  langLabelActive: {
    color: CORAL[500],
    fontWeight: '600',
  },
  langCheck: {
    fontSize: 16,
    color: CORAL[500],
    fontWeight: '700',
  },
});
