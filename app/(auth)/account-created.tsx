import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONTS, SRS, RADIUS } from '@/constants/portal-theme';
import { BG, GRAY, NEUTRAL, BORDER } from '@/lib/constants/figma-tokens';

export default function AccountCreatedScreen() {
  const { t } = useTranslation();
  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="checkmark-circle" size={100} color={SRS.green} />
        </View>

        <Text style={s.title}>{t('auth.accountCreated.title')}</Text>
        <Text style={s.subtitle}>{t('auth.accountCreated.message')}</Text>

        <TouchableOpacity style={s.loginBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
          <Text style={s.loginBtnText}>{t('auth.register.login')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.homeBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
          <Text style={s.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  content: { alignItems: 'center', width: '100%' },
  iconWrap: { marginBottom: 24 },
  title: {
    fontSize: 28, fontFamily: FONTS.calistoga, color: SRS.navy, marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, fontFamily: FONTS.inter.regular, color: GRAY[500], textAlign: 'center',
    lineHeight: 22, marginBottom: 40, paddingHorizontal: 16,
  },
  loginBtn: {
    width: '100%', backgroundColor: SRS.navy, borderRadius: RADIUS.button,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  loginBtnText: { fontSize: 20, fontFamily: FONTS.itim, color: NEUTRAL.snow },
  homeBtn: {
    width: '100%', borderWidth: 1.5, borderColor: BORDER.input, borderRadius: RADIUS.button,
    paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: { fontSize: 16, fontFamily: FONTS.inter.semiBold, color: GRAY[500] },
});
