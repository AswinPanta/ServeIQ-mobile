import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useCoupons } from '@/lib/context/coupon-context';
import { safeGoBack } from '@/lib/utils';

const ACCENT = '#E63946';
const GRADIENT_START = '#E63946';
const GRADIENT_END = '#FF6B6B';

type OfferTab = 'coupons' | 'deals' | 'referral';

const SPECIAL_DEALS = [
  { id: 'deal-1', title: 'Early Bird Special', description: 'Book 30+ days ahead and save up to 25%', discount: '25% OFF', code: 'EARLY25', color: '#3B82F6', icon: '🐦' },
  { id: 'deal-2', title: 'Weekend Getaway', description: 'Friday-Sunday stays at discounted rates', discount: '15% OFF', code: 'WEEKEND15', color: '#8B5CF6', icon: '🎉' },
  { id: 'deal-3', title: 'Long Stay Value', description: 'Stay 7+ nights and get exclusive pricing', discount: '20% OFF', code: 'LONGSTAY20', color: '#10B981', icon: '🏡' },
  { id: 'deal-4', title: 'Last Minute Escape', description: 'Book within 3 days and save instantly', discount: '10% OFF', code: 'LASTMIN10', color: '#F59E0B', icon: '⚡' },
  { id: 'deal-5', title: 'Suite Upgrade', description: 'Complimentary upgrade to suite on 3+ night stays', discount: 'FREE UPGRADE', code: 'SUITEUP', color: '#EC4899', icon: '⭐' },
];

const REFERRAL_BENEFITS = [
  { icon: '🎁', title: 'You get NPR 1,000', desc: 'When your friend completes their first booking' },
  { icon: '🎉', title: 'Friend gets NPR 500', desc: 'Applied instantly on their first booking' },
  { icon: '♾️', title: 'No limit', desc: 'Refer as many friends as you like' },
];

export default function PromotionsScreen() {
  const colors = useColors();
  const { activeCoupons, usedCoupons } = useCoupons();
  const [activeTab, setActiveTab] = useState<OfferTab>('coupons');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const tabs: { key: OfferTab; label: string; icon: string }[] = [
    { key: 'coupons', label: 'My Coupons', icon: '🎟️' },
    { key: 'deals', label: 'Special Deals', icon: '🏷️' },
    { key: 'referral', label: 'Refer & Earn', icon: '🤝' },
  ];

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Code Copied!', `Promo code "${code}" has been copied to your clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: '🏨 StayEasy — Book amazing hotels with exclusive discounts! Use my referral link: https://stayeasy.com/refer/guest-1',
      });
    } catch {}
  };

  const renderCouponsTab = () => (
    <View className="gap-4">
      {/* Hero Banner */}
      <View style={{
        padding: 24, borderRadius: 24,
        backgroundColor: ACCENT,
        shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 }}>Your Offers</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 22 }}>
          You have {activeCoupons.length} active coupon{activeCoupons.length !== 1 ? 's' : ''} waiting
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{activeCoupons.length} Active</Text>
          </View>
          <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{usedCoupons.length} Used</Text>
          </View>
        </View>
      </View>

      {/* Active Coupons */}
      <Text className="text-lg font-bold text-foreground mt-2">Active Coupons</Text>
      {activeCoupons.length === 0 ? (
        <View style={{ padding: 32, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🎫</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 6 }}>No active coupons</Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>Check the Special Deals tab to find available promotions</Text>
        </View>
      ) : (
        activeCoupons.map((coupon, idx) => {
          const expiresDays = Math.max(0, Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const isUrgent = expiresDays <= 7;
          return (
            <View key={coupon.id} style={{
              padding: 20, borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: isUrgent ? '#EF444430' : colors.border,
              borderLeftWidth: 4, borderLeftColor: isUrgent ? '#EF4444' : ACCENT,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
            }}>
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text style={{ fontSize: 20, fontWeight: '800', color: ACCENT, letterSpacing: 1 }}>{coupon.code}</Text>
                    {isUrgent && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#EF444415' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>Expiring</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{coupon.description}</Text>
                </View>
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                  backgroundColor: '#10B98115',
                }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981' }}>
                    {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `रू${coupon.discount}`}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: '#10B981', textAlign: 'center', textTransform: 'uppercase' }}>OFF</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: expiresDays <= 3 ? '#EF4444' : expiresDays <= 7 ? '#F59E0B' : '#10B981' }} />
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {expiresDays === 0 ? 'Expires today!' : `${expiresDays} day${expiresDays !== 1 ? 's' : ''} left`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCopyCode(coupon.code)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: copiedCode === coupon.code ? '#10B981' : ACCENT,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
                    {copiedCode === coupon.code ? '✓ Copied' : 'Copy Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Used Coupons */}
      {usedCoupons.length > 0 && (
        <>
          <Text className="text-lg font-bold text-foreground mt-4">Used / Expired</Text>
          {usedCoupons.map(coupon => (
            <View key={coupon.id} style={{
              padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: 0.6,
            }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#6B728020', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#6B7280' }}>✓</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }}>{coupon.code}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{coupon.status === 'used' ? 'Used' : 'Expired'}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted }}>{coupon.discount}%</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderDealsTab = () => (
    <View className="gap-4">
      <View style={{
        padding: 20, borderRadius: 20, backgroundColor: GRADIENT_START,
        shadowColor: GRADIENT_START, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
      }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Exclusive Deals</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          Limited-time offers curated just for you
        </Text>
      </View>

      {SPECIAL_DEALS.map((deal, idx) => (
        <View key={deal.id} style={{
          padding: 20, borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.border,
          borderLeftWidth: 4, borderLeftColor: deal.color,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        }}>
          <View className="flex-row items-start gap-3">
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: deal.color + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{deal.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{deal.title}</Text>
              <Text className="text-sm text-muted mt-1">{deal.description}</Text>
              <View className="flex-row items-center gap-2 mt-3">
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: deal.color + '20' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: deal.color }}>{deal.discount}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCopyCode(deal.code)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: copiedCode === deal.code ? '#10B981' : ACCENT,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                    {copiedCode === deal.code ? '✓ Copied' : `Use ${deal.code}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {idx < SPECIAL_DEALS.length - 1 && (
            <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16 }} />
          )}
        </View>
      ))}
    </View>
  );

  const renderReferralTab = () => (
    <View className="gap-4">
      <View style={{
        padding: 28, borderRadius: 24,
        backgroundColor: '#1E293B',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 }}>Refer & Earn</Text>
        <Text style={{ fontSize: 15, color: '#94A3B8', lineHeight: 22 }}>
          Share StayEasy with your friends and earn rewards for every booking they make
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {REFERRAL_BENEFITS.map((benefit, idx) => (
          <View key={idx} style={{
            padding: 18, borderRadius: 18,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{benefit.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{benefit.title}</Text>
              <Text className="text-sm text-muted">{benefit.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleShareReferral}
        style={{
          paddingVertical: 18, borderRadius: 18, marginTop: 8,
          backgroundColor: ACCENT, alignItems: 'center',
          shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>📤 Share Your Referral Link</Text>
      </TouchableOpacity>

      <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', marginTop: 4 }}>
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>
            Your referral link is unique to you. Share it via WhatsApp, Messenger, or any social app to start earning!
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-14 pb-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity onPress={() => safeGoBack()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-lg" style={{ color: ACCENT }}>←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">Promotions</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: ACCENT + '15' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{activeCoupons.length} New</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row gap-2">
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20,
                    backgroundColor: activeTab === tab.key ? ACCENT : colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 14, fontWeight: '700',
                    color: activeTab === tab.key ? '#fff' : colors.foreground,
                  }}>
                    {tab.icon} {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Tab Content */}
          {activeTab === 'coupons' && renderCouponsTab()}
          {activeTab === 'deals' && renderDealsTab()}
          {activeTab === 'referral' && renderReferralTab()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
