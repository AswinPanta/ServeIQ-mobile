import { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCoupons } from '@/lib/context/coupon-context';
import type { Coupon } from '@/types/coupon';
import { FONTS } from '@/constants/portal-theme';
import type { TFunction } from 'i18next';

const ACCENT = '#E63946';
const NAVY = '#1A3C5E';

function getExpiryText(expiresAt: string, t: TFunction): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return t('profile.coupons.expired');
  const days = Math.ceil(diff / 86400000);
  return t('profile.coupons.expiresIn', { count: days, days });
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const expired = coupon.status === 'expired' || new Date(coupon.expiresAt).getTime() <= Date.now();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={[styles.couponCard, expired && styles.couponCardExpired]}>
      <View style={[styles.couponIcon, expired && styles.couponIconExpired]}>
        <IconSymbol name="discount" size={18} color={expired ? '#94A3B8' : ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.couponCode, expired && { color: '#94A3B8' }]}>{coupon.code}</Text>
        <Text style={[styles.couponDesc, expired && { color: '#CBD5E1' }]}>{coupon.description}</Text>
        <Text style={[styles.expiryText, expired && { color: '#CBD5E1' }]}>
          {getExpiryText(coupon.expiresAt, t)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[styles.couponValue, expired && { color: '#94A3B8' }]}>
          {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `\u20A8 ${coupon.discount}`}
        </Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          {copied ? (
            <Text style={styles.copiedText}>{t('profile.coupons.copied')}</Text>
          ) : (
            <IconSymbol name="content.copy" size={16} color={expired ? '#94A3B8' : ACCENT} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <IconSymbol name="confirmation-number" size={32} color="#E2E8F0" />
      </View>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

export default function CouponsScreen() {
  const { coupons } = useCoupons();
  const { t } = useTranslation();

  const now = Date.now();
  const active = coupons.filter(c => c.status === 'active' && new Date(c.expiresAt).getTime() > now);
  const expired = coupons.filter(c => c.status !== 'active' || new Date(c.expiresAt).getTime() <= now);

  const sections: { title: string; data: Coupon[]; empty: string }[] = [
    { title: t('profile.coupons.active'), data: active, empty: t('profile.coupons.empty') },
    { title: t('profile.coupons.expired'), data: expired, empty: t('profile.coupons.empty') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.coupons.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CouponCard coupon={item} />}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {data.length > 0 && (
              <Text style={styles.sectionCount}>{data.length}</Text>
            )}
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? <EmptyState label={section.empty} /> : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  title: { fontSize: 24, fontWeight: '700', color: NAVY, letterSpacing: -0.5, fontFamily: FONTS.sora },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  sectionCount: { fontSize: 12, fontWeight: '600', color: '#94A3B8', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontFamily: FONTS.inter.semiBold },
  couponCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10,
  },
  couponCardExpired: { opacity: 0.6 },
  couponIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  couponIconExpired: { backgroundColor: '#F1F5F9' },
  couponCode: { fontSize: 14, fontWeight: '700', color: NAVY, letterSpacing: 1, fontFamily: FONTS.inter.bold },
  couponDesc: { fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: FONTS.inter.regular },
  expiryText: { fontSize: 11, color: ACCENT, fontWeight: '600', marginTop: 4, fontFamily: FONTS.inter.semiBold },
  couponValue: { fontSize: 14, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  copyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: ACCENT + '08', alignItems: 'center', justifyContent: 'center' },
  copiedText: { fontSize: 9, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '500', fontFamily: FONTS.inter.medium },
});
