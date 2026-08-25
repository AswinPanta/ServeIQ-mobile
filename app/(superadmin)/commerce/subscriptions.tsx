import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatCard } from '@/components/superadmin/StatCard';
import { PURPLE, GRAY, BLUE, AMBER, STATUS, SLATE, BG, TEXT, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = PURPLE[700];

const PLANS = [
  { name: 'Free', price: { monthly: 0, annual: 0 }, features: ['Up to 1 property', 'Up to 2 users', 'Basic reporting', 'Email support'], subscribers: 3, color: GRAY[500], highlighted: false },
  { name: 'Basic', price: { monthly: 25000, annual: 270000 }, features: ['Up to 3 properties', 'Up to 10 users', 'Revenue reports', 'Chat support', 'Basic API access'], subscribers: 2, color: BLUE[500], highlighted: false },
  { name: 'Pro', price: { monthly: 75000, annual: 810000 }, features: ['Up to 10 properties', 'Up to 50 users', 'Advanced analytics', 'Priority support', 'Full API access', 'Custom branding'], subscribers: 2, color: ACCENT, highlighted: true },
  { name: 'Enterprise', price: { monthly: null, annual: null }, features: ['Unlimited properties', 'Unlimited users', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', '24/7 phone support'], subscribers: 1, color: AMBER[500], highlighted: false },
];

const totalSubscribers = PLANS.reduce((s, p) => s + p.subscribers, 0);

export default function SubscriptionsScreen() {
  const [annual, setAnnual] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total Subscribers" value={totalSubscribers} color={STATUS.activeGreen} icon="person" />
        <StatCard label="Active Plans" value={PLANS.filter(p => p.subscribers > 0).length} color={ACCENT} icon="check" />
      </View>

      {/* Billing Toggle */}
      <View style={styles.toggleWrap}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setAnnual(false)}
            style={[styles.toggleBtn, !annual && styles.toggleActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, !annual && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAnnual(true)}
            style={[styles.toggleBtn, annual && styles.toggleActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, annual && styles.toggleTextActive]}>Annual</Text>
            {annual && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save 10%</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan Cards */}
      {PLANS.map(plan => {
        const price = plan.price.monthly === null
          ? 'Custom'
          : annual
            ? `NPR ${(plan.price.annual / 1000).toFixed(0)}K/yr`
            : `NPR ${(plan.price.monthly / 1000).toFixed(0)}K/mo`;
        const isFree = plan.price.monthly === 0;

        return (
          <View
            key={plan.name}
            style={[
              styles.planCard,
              plan.highlighted && { borderColor: ACCENT, borderWidth: 2 },
            ]}
          >
            {/* Plan header */}
            <View style={styles.planHead}>
              <View style={styles.planNameRow}>
                <View style={[styles.planDot, { backgroundColor: plan.color }]} />
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              <View style={styles.badgeRow}>
                {plan.highlighted && (
                  <View style={[styles.badge, { backgroundColor: ACCENT + '12' }]}>
                    <Text style={[styles.badgeText, { color: ACCENT }]}>Popular</Text>
                  </View>
                )}
                <View style={[styles.badge, { backgroundColor: EMERALD[500] + '12' }]}>
                  <Text style={[styles.badgeText, { color: STATUS.activeGreen }]}>{plan.subscribers}</Text>
                </View>
              </View>
            </View>

            {/* Price */}
            <Text style={styles.price}>{price}</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Features */}
            {plan.features.map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.checkCircle, { backgroundColor: plan.color + '15' }]}>
                  <IconSymbol name="check" size={12} color={plan.color} />
                </View>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}

            {/* CTA */}
            <TouchableOpacity
              disabled={plan.highlighted || isFree}
              style={[
                styles.ctaBtn,
                { backgroundColor: plan.highlighted ? SLATE[100] : plan.color },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctaText, { color: plan.highlighted ? SLATE[500] : BG.white }]}>
                {plan.highlighted ? 'Current Plan' : isFree ? 'Free Plan' : `Upgrade to ${plan.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  statsRow: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  toggleWrap: { alignItems: 'center', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', backgroundColor: SLATE[100], borderRadius: 12, padding: 3 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  toggleActive: { backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: SLATE[400] },
  toggleTextActive: { color: SLATE[900] },
  saveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: EMERALD[500] + '15' },
  saveText: { fontSize: 10, fontWeight: '700', color: STATUS.activeGreen },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 28, fontWeight: '800', color: SLATE[900], letterSpacing: -0.5, marginBottom: 14 },
  divider: { height: 1, backgroundColor: SLATE[100], marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: SLATE[600], flex: 1 },
  ctaBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
});