import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

export function NewsletterCTA() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  return (
    <LinearGradient
      colors={['#0F172A', '#1A3C5E', '#2E86AB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <View style={s.inner}>
        <View style={s.textBlock}>
          <Text style={s.title}>{t('components.newsletter.title')}</Text>
          <Text style={s.subtitle}>{t('components.newsletter.subtitle')}</Text>
        </View>
        <View style={s.inputBlock}>
          <TextInput
            style={s.input}
            placeholder={t('components.newsletter.emailPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.btn} activeOpacity={0.85}>
            <Text style={s.btnText}>{t('components.newsletter.cta')}</Text>
          </TouchableOpacity>
          <View style={s.checkboxRow}>
            <View style={s.checkbox} />
            <Text style={s.disclaimer}>{t('components.newsletter.agree')}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  inner: {
    gap: 24,
  },
  textBlock: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  inputBlock: {
    gap: 10,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1A3C5E',
  },
  btn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3C5E',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
