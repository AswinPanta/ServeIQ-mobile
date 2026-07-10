import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const PLANS = [
  { name: 'Free', price: { monthly: 0, annual: 0 }, features: ['Up to 1 property', 'Up to 2 users', 'Basic reporting', 'Email support'], subscribers: 3, color: '#6B7280' },
  { name: 'Basic', price: { monthly: 25000, annual: 270000 }, features: ['Up to 3 properties', 'Up to 10 users', 'Revenue reports', 'Chat support', 'Basic API access'], subscribers: 2, color: '#3B82F6' },
  { name: 'Pro', price: { monthly: 75000, annual: 810000 }, features: ['Up to 10 properties', 'Up to 50 users', 'Advanced analytics', 'Priority support', 'Full API access', 'Custom branding'], subscribers: 2, color: SUPERADMIN, isCurrent: true },
  { name: 'Enterprise', price: { monthly: null, annual: null }, features: ['Unlimited properties', 'Unlimited users', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', '24/7 phone support'], subscribers: 1, color: '#F59E0B' },
];

export default function SubscriptionsScreen() {
  const [annual, setAnnual] = useState(false);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Subscription Plans</Text>
        </View>

        <View style={s.toggleContainer}>
          {['Monthly', 'Annual'].map(label => {
            const isMonthly = label === 'Monthly';
            return (
              <TouchableOpacity key={label} onPress={() => setAnnual(!isMonthly)}
                style={[s.toggleBtn, { backgroundColor: (isMonthly ? !annual : annual) ? SUPERADMIN : 'transparent' }]}>
                <Text style={[s.toggleText, { color: (isMonthly ? !annual : annual) ? '#FFF' : GRAY[500] }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {PLANS.map(plan => {
          const price = plan.price.monthly === null ? 'Custom' : annual ? `NPR ${(plan.price.annual / 1000).toFixed(0)}K/yr` : `NPR ${(plan.price.monthly / 1000).toFixed(0)}K/mo`;
          const isFree = plan.price.monthly === 0;
          return (
            <View key={plan.name} style={[s.planCard, { borderColor: plan.isCurrent ? SUPERADMIN : GRAY[100], borderWidth: plan.isCurrent ? 2 : 1 }]}>
              <View style={s.planHead}>
                <Text style={s.planName}>{plan.name}</Text>
                <View style={s.badges}>
                  {plan.isCurrent && <View style={[s.badge, { backgroundColor: SUPERADMIN + '15' }]}><Text style={[s.badgeText, { color: SUPERADMIN }]}>Current</Text></View>}
                  <View style={[s.badge, { backgroundColor: '#10B98115' }]}><Text style={[s.badgeText, { color: '#10B981' }]}>{plan.subscribers} active</Text></View>
                </View>
              </View>
              <Text style={s.price}>{price}</Text>
              <View style={s.divider} />
              {plan.features.map((feat, i) => (
                <View key={i} style={s.featureRow}>
                  <IconSymbol name="check" size={14} color={SUPERADMIN} />
                  <Text style={s.featureText}>{feat}</Text>
                </View>
              ))}
              {!isFree && (
                <TouchableOpacity disabled={plan.isCurrent} style={[s.ctaBtn, { backgroundColor: plan.isCurrent ? GRAY[100] : SUPERADMIN }]} activeOpacity={0.7}>
                  <Text style={[s.ctaText, { color: plan.isCurrent ? GRAY[500] : '#FFF' }]}>{plan.isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}</Text>
                </TouchableOpacity>
              )}
              {isFree && <View style={[s.ctaBtn, { backgroundColor: GRAY[100] }]}><Text style={[s.ctaText, { color: GRAY[500] }]}>Current Plan</Text></View>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  toggleContainer: { flexDirection: 'row', backgroundColor: GRAY[100], borderRadius: 12, padding: 4, alignSelf: 'center' },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
  toggleText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  planCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planName: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  badgeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  price: { ...TYPOGRAPHY.h1, color: SRS.navy, marginBottom: SPACING.lg },
  divider: { height: 1, backgroundColor: GRAY[100], marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { ...TYPOGRAPHY.body, color: SRS.navy },
  ctaBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
