import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTableStore } from '@/stores/useTableStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuth } from '@/lib/context/auth-context';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { useFolioStore } from '@/stores/useFolioStore';
import type { CompletedOrder } from '@/stores/useOrderStore';
import { ACCENT, STATUS_COLORS, getAccentColor } from '@/constants/portal-theme';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: '💳', color: STATUS_COLORS.card },
  { id: 'cash', label: 'Cash', icon: '💵', color: STATUS_COLORS.cash },
  { id: 'upi', label: 'UPI', icon: '📱', color: STATUS_COLORS.upi },
  { id: 'wallet', label: 'Wallet', icon: '👛', color: STATUS_COLORS.wallet },
  { id: 'room_charge', label: 'Room Charge', icon: '🏨', color: '#0D9488' },
  { id: 'loyalty', label: 'Loyalty Points', icon: '⭐', color: '#8B5CF6' },
];

type SplitMethod = 'none' | 'equal' | 'percentage' | 'byItem';

export default function POSCheckoutScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const setTablePropertyId = useTableStore((s) => s.setPropertyId);
  const setOrderPropertyId = useOrderStore((s) => s.setPropertyId);

  useEffect(() => {
    const pid = operator?.property_id || 'prop-1';
    setTablePropertyId(pid);
    setOrderPropertyId(pid);
  }, [operator?.property_id, setTablePropertyId, setOrderPropertyId]);

  const { id } = useLocalSearchParams<{ id: string; total?: string }>();
  const tableId = id || '';

  const tables = useTableStore((s) => s.tables);
  const table = useMemo(() => tables.find((t) => t.id === tableId), [tables, tableId]);
  const cart = useOrderStore((s) => s.carts[tableId] || []);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('none');
  const [splitGuests, setSplitGuests] = useState(2);
  const [splitPercentages, setSplitPercentages] = useState<number[]>([50, 50]);
  const [splitItems, setSplitItems] = useState<Record<string, number[]>>({});

  const [rcGuestQuery, setRcGuestQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<{ id: string; name: string; room: string; bookingRef: string } | null>(null);

  const [useLoyalty, setUseLoyalty] = useState(false);
  const [lpGuestQuery, setLpGuestQuery] = useState('');
  const [lpGuest, setLpGuest] = useState<{ id: string; name: string; points: number } | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [appliedPointsDiscount, setAppliedPointsDiscount] = useState(0);

  const [receipt, setReceipt] = useState<CompletedOrder | null>(null);

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discountAmount = discountType === 'percentage'
    ? Math.round(subtotal * (parseFloat(discountValue || '0') / 100))
    : discountType === 'fixed'
    ? parseInt(discountValue || '0')
    : 0;
  const tax = Math.round((subtotal - discountAmount) * 0.1);
  const grandTotal = subtotal - discountAmount + tax - appliedPointsDiscount;

  const rcFilteredGuests = useMemo(() => {
    if (!rcGuestQuery.trim()) return [];
    const q = rcGuestQuery.toLowerCase();
    return useGuestStore.getState().guests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.phone.includes(q)
    ).slice(0, 5);
  }, [rcGuestQuery]);

  const splitPortions = useMemo(() => {
    if (splitMethod === 'none') return [];
    if (splitMethod === 'equal') {
      const perPerson = Math.round(grandTotal / splitGuests);
      const remainder = grandTotal - perPerson * splitGuests;
      return Array.from({ length: splitGuests }, (_, i) => ({
        label: `Person ${i + 1}`,
        amount: i === 0 ? perPerson + remainder : perPerson,
      }));
    }
    if (splitMethod === 'percentage') {
      return splitPercentages.map((pct, i) => ({
        label: `Person ${i + 1} (${pct}%)`,
        amount: Math.round(grandTotal * pct / 100),
      }));
    }
    if (splitMethod === 'byItem') {
      const personTotals = Array.from({ length: splitGuests }, () => 0);
      cart.forEach((item) => {
        const assignment = splitItems[item.menu_item_id] || [0];
        const perPerson = Math.round(item.unit_price * item.quantity / assignment.length);
        assignment.forEach((personIdx) => {
          personTotals[personIdx] += perPerson;
        });
      });
      const totalItems = personTotals.reduce((s, v) => s + v, 0) || 1;
      return personTotals.map((amt, i) => ({
        label: `Person ${i + 1}`,
        amount: amt + Math.round((grandTotal - subtotal) * amt / totalItems),
      }));
    }
    return [];
  }, [splitMethod, splitGuests, splitPercentages, splitItems, grandTotal, subtotal, cart]);

  const toggleItemAssignment = (menuItemId: string, personIdx: number) => {
    setSplitItems((prev) => {
      const current = prev[menuItemId] || [0];
      const next = current.includes(personIdx)
        ? current.filter((p) => p !== personIdx)
        : [...current, personIdx];
      return { ...prev, [menuItemId]: next.length > 0 ? next : [0] };
    });
  };

  const handleSplitGuestsChange = (delta: number) => {
    const next = Math.max(2, Math.min(10, splitGuests + delta));
    setSplitGuests(next);
    const equal = Math.round(100 / next);
    setSplitPercentages(Array.from({ length: next }, (_, i) => (i === next - 1 ? 100 - equal * (next - 1) : equal)));
  };

  const handleApplyLoyalty = () => {
    if (!lpGuest) {
      Alert.alert('No Guest', 'Search and select a guest first');
      return;
    }
    const pts = parseInt(pointsToRedeem || '0');
    if (pts <= 0) {
      Alert.alert('Invalid Points', 'Enter a valid number of points to redeem');
      return;
    }
    if (pts > lpGuest.points) {
      Alert.alert('Insufficient Points', `${lpGuest.name} has ${lpGuest.points} points available`);
      return;
    }
    const discount = Math.round(pts * 1);
    setAppliedPointsDiscount(discount);
    Alert.alert('Points Applied', `${pts} points redeemed for ₹${discount} discount`);
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      Alert.alert('Select Method', 'Please select a payment method');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'No items to process payment for');
      return;
    }
    if (paymentMethod === 'room_charge' && !selectedGuest) {
      Alert.alert('Select Guest', 'Search and select a guest to charge to room');
      return;
    }

    const needsManagerApproval = discountType === 'percentage' && parseFloat(discountValue || '0') > 10;
    const needsManagerApprovalFixed = discountType === 'fixed' && parseInt(discountValue || '0') > 500;

    const proceedWithPayment = () => {
      if (useLoyalty && appliedPointsDiscount > 0 && lpGuest) {
        const { redeemPoints } = useGuestStore.getState();
        const success = redeemPoints(lpGuest.id, parseInt(pointsToRedeem || '0'));
        if (!success) {
          Alert.alert('Error', 'Could not redeem points');
          return;
        }
      }

      const { completePayment } = useOrderStore.getState();
      const { addActivity } = useActivityStore.getState();
      const { addNotification } = useNotificationStore.getState();

      const discount = {
        type: discountType,
        value: discountType === 'none' ? 0 : parseFloat(discountValue || '0'),
      } as { type: 'none' | 'percentage' | 'fixed'; value: number };

      const completed = completePayment(tableId, discount, paymentMethod, 'Waiter', 'Staff');
      useTableStore.getState().updateTableStatus(tableId, 'available');

    if (paymentMethod === 'room_charge' && selectedGuest) {
      const { addCharge } = useFolioStore.getState();
      addCharge(selectedGuest.bookingRef, {
        description: 'Restaurant Bill',
        amount: completed.total,
        category: 'restaurant',
      });
    }

    addActivity({ type: 'payment', title: `Payment received — Table ${table?.number || tableId}`, description: `₹${completed.total.toLocaleString()} via ${paymentMethod}`, icon: '💳', color: '#F59E0B', property_id: operator?.property_id || 'prop-1' });
    addNotification({ type: 'payment', title: 'Payment Completed', message: `Table ${table?.number || tableId} — ₹${completed.total.toLocaleString()}`, data: { tableId } });

    setReceipt(completed);
    };

    if (needsManagerApproval || needsManagerApprovalFixed) {
      Alert.alert(
        'Manager Approval Required',
        'This discount exceeds your limit. Please confirm with manager.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enter Manager Code',
            onPress: () => {
              const promptCode = '1234';
              Alert.prompt
                ? Alert.prompt(
                    'Manager Code',
                    'Enter manager code to approve this discount',
                    (code) => {
                      if (code === promptCode) {
                        proceedWithPayment();
                      } else {
                        Alert.alert('Access Denied', 'Incorrect manager code. Discount not applied.');
                      }
                    },
                    'secure-text'
                  )
                : proceedWithPayment();
            },
          },
        ]
      );
    } else {
      proceedWithPayment();
    }
  };

  if (receipt) {
    const now = new Date();
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ padding: 20, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: 1 }}>STAYEASY RESTAURANT</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Table {table?.number || tableId} · {now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, gap: 8 }}>
              {cart.map((item, idx) => (
                <View key={`${item.menu_item_id}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#1E293B' }}>{item.name}</Text>
                    {item.modifiers ? <Text style={{ fontSize: 11, color: '#94A3B8' }}>{item.modifiers}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748B', marginHorizontal: 8 }}>×{item.quantity}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B', width: 80, textAlign: 'right' }}>₹{(item.unit_price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 12, paddingTop: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: '#1E293B' }}>₹{receipt.subtotal.toLocaleString()}</Text>
              </View>
              {receipt.discount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Discount</Text>
                  <Text style={{ fontSize: 13, color: '#EF4444' }}>-₹{receipt.discount.toLocaleString()}</Text>
                </View>
              )}
              {appliedPointsDiscount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Loyalty Points</Text>
                  <Text style={{ fontSize: 13, color: '#8B5CF6' }}>-₹{appliedPointsDiscount.toLocaleString()}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>Tax (10%)</Text>
                <Text style={{ fontSize: 13, color: '#1E293B' }}>₹{receipt.tax.toLocaleString()}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>Grand Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>₹{receipt.total.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: getAccentColor(0.06), alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>{paymentMethod.toUpperCase()} · {receipt.paymentMethod === 'room_charge' && selectedGuest ? `${selectedGuest.name} (${selectedGuest.room})` : ''}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>Thank you!</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity onPress={() => Alert.alert('Print', 'Print functionality coming soon')}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>🖨️ Print</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Email', 'Email functionality coming soon')}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>📧 Email</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.back()}
            style={{ marginTop: 12, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: ACCENT }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: '#475569' }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Checkout</Text>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Table {table?.number || tableId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Order Summary</Text>
            {cart.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>No items in current order</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {cart.map((item, idx) => (
                  <View key={`${item.menu_item_id}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#1E293B' }}>{item.name}</Text>
                      {item.modifiers ? <Text style={{ fontSize: 11, color: '#94A3B8' }}>{item.modifiers}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginLeft: 8 }}>×{item.quantity}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', width: 80, textAlign: 'right' }}>₹{(item.unit_price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 }}>Discount</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['none', 'percentage', 'fixed'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => { setDiscountType(t); setDiscountValue(''); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: discountType === t ? ACCENT : '#F1F5F9',
                    borderWidth: 1, borderColor: discountType === t ? ACCENT : '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: discountType === t ? '#FFF' : '#475569' }}>
                    {t === 'none' ? 'None' : t === 'percentage' ? '%' : '₹ Fixed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {discountType !== 'none' && (
              <TextInput
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                placeholderTextColor="#94A3B8"
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
                style={{ fontSize: 14, color: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
              />
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 }}>Split Bill</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(['none', 'equal', 'percentage', 'byItem'] as const).map((method) => (
                <TouchableOpacity key={method} onPress={() => { setSplitMethod(method); if (method !== 'none' && splitMethod === 'none') { setSplitPercentages(Array.from({ length: splitGuests }, (_, i) => Math.round(100 / splitGuests))); } }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: splitMethod === method ? ACCENT : '#F1F5F9',
                    borderWidth: 1, borderColor: splitMethod === method ? ACCENT : '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: splitMethod === method ? '#FFF' : '#475569' }}>
                    {method === 'none' ? 'No Split' : method === 'equal' ? 'Equal' : method === 'percentage' ? '% Split' : 'By Item'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {splitMethod !== 'none' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Number of guests</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleSplitGuestsChange(-1)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getAccentColor(0.12), alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>{splitGuests}</Text>
                    <TouchableOpacity onPress={() => handleSplitGuestsChange(1)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getAccentColor(0.12), alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {splitMethod === 'percentage' && (
                  <View style={{ gap: 8, marginBottom: 10 }}>
                    {splitPercentages.map((pct, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748B', width: 80 }}>Person {i + 1}</Text>
                        <View style={{ flex: 1, height: 24, borderRadius: 6, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 6, backgroundColor: ACCENT }} />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B', width: 40, textAlign: 'right' }}>{pct}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {splitMethod === 'byItem' && (
                  <View style={{ gap: 6, marginBottom: 10 }}>
                    {cart.map((item) => (
                      <View key={item.menu_item_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: '#1E293B', flex: 1 }} numberOfLines={1}>{item.name} ×{item.quantity}</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {Array.from({ length: splitGuests }, (_, i) => (
                            <TouchableOpacity key={i} onPress={() => toggleItemAssignment(item.menu_item_id, i)}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                backgroundColor: (splitItems[item.menu_item_id] || [0]).includes(i) ? ACCENT : '#E2E8F0',
                                alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: (splitItems[item.menu_item_id] || [0]).includes(i) ? '#FFF' : '#94A3B8' }}>{i + 1}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {splitPortions.length > 0 && (
                  <View style={{ padding: 12, borderRadius: 10, backgroundColor: getAccentColor(0.06), gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Split Amounts</Text>
                    {splitPortions.map((p, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, color: '#1E293B' }}>{p.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>₹{p.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: getAccentColor(0.04), borderWidth: 1, borderColor: getAccentColor(0.12) }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Total Breakdown</Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>Subtotal</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>₹{subtotal.toLocaleString()}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Discount</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>-₹{discountAmount.toLocaleString()}</Text>
                </View>
              )}
              {appliedPointsDiscount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>Loyalty Points</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B5CF6' }}>-₹{appliedPointsDiscount.toLocaleString()}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>Tax (10%)</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>₹{tax.toLocaleString()}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: getAccentColor(0.15), paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>Grand Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>₹{grandTotal.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
                  style={{
                    padding: 14, borderRadius: 14, alignItems: 'center', minWidth: 90,
                    backgroundColor: paymentMethod === pm.id ? pm.color + '12' : '#FFF',
                    borderWidth: 1.5, borderColor: paymentMethod === pm.id ? pm.color : '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{pm.icon}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: paymentMethod === pm.id ? pm.color : '#475569' }}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {paymentMethod === 'room_charge' && (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 }}>🏨 Room Charge</Text>
              <TextInput
                placeholder="Search guest by name/phone"
                placeholderTextColor="#94A3B8"
                value={rcGuestQuery}
                onChangeText={(t) => { setRcGuestQuery(t); setSelectedGuest(null); }}
                style={{ fontSize: 14, color: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
              />
              {!selectedGuest && rcFilteredGuests.length > 0 && (
                <View style={{ marginTop: 8, gap: 4 }}>
                  {rcFilteredGuests.map((g) => {
                    const folio = Object.values(useFolioStore.getState().folios).find(
                      (f) => f.guest_name.toLowerCase() === g.name.toLowerCase()
                    );
                    return (
                      <TouchableOpacity key={g.id} onPress={() => {
                        setSelectedGuest({ id: g.id, name: g.name, room: folio?.room_number || 'N/A', bookingRef: folio?.booking_ref || 'N/A' });
                        setRcGuestQuery(g.name);
                      }}
                        style={{ padding: 10, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>{g.name}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>{g.phone} · Room {folio?.room_number || 'N/A'} · {folio?.booking_ref || 'N/A'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {selectedGuest && (
                <View style={{ marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: getAccentColor(0.06) }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{selectedGuest.name}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Room {selectedGuest.room} · Ref: {selectedGuest.bookingRef}</Text>
                </View>
              )}
            </View>
          )}

          {paymentMethod === 'loyalty' && (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <TouchableOpacity onPress={() => setUseLoyalty(!useLoyalty)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>⭐ Use Loyalty Points</Text>
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: useLoyalty ? '#8B5CF6' : '#E2E8F0', alignItems: useLoyalty ? 'flex-end' : 'flex-start', justifyContent: 'center', padding: 2 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' }} />
                </View>
              </TouchableOpacity>
              {useLoyalty && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TextInput
                    placeholder="Search guest by name/phone"
                    placeholderTextColor="#94A3B8"
                    value={lpGuestQuery}
                    onChangeText={(t) => { setLpGuestQuery(t); setLpGuest(null); }}
                    style={{ fontSize: 14, color: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                  />
                  {!lpGuest && lpGuestQuery.trim().length > 0 && (
                    <View style={{ gap: 4 }}>
                      {useGuestStore.getState().findGuest(lpGuestQuery).slice(0, 5).map((g) => (
                        <TouchableOpacity key={g.id} onPress={() => { setLpGuest({ id: g.id, name: g.name, points: g.loyaltyPoints }); setLpGuestQuery(g.name); }}
                          style={{ padding: 10, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>{g.name}</Text>
                          <Text style={{ fontSize: 11, color: '#64748B' }}>{g.loyaltyPoints} points · {g.loyaltyTier}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {lpGuest && (
                    <>
                      <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>{lpGuest.name}</Text>
                        <Text style={{ fontSize: 12, color: '#8B5CF6', fontWeight: '700' }}>{lpGuest.points} points available (≈ ₹{lpGuest.points})</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          placeholder="Points to redeem"
                          placeholderTextColor="#94A3B8"
                          value={pointsToRedeem}
                          onChangeText={setPointsToRedeem}
                          keyboardType="numeric"
                          style={{ flex: 1, fontSize: 14, color: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                        />
                        <TouchableOpacity onPress={handleApplyLoyalty}
                          style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#8B5CF6' }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                      {appliedPointsDiscount > 0 && (
                        <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#8B5CF615' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B5CF6' }}>✅ {pointsToRedeem} points applied — ₹{appliedPointsDiscount} discount</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity onPress={handlePayment}
            style={{
              paddingVertical: 16, borderRadius: 16, alignItems: 'center',
              backgroundColor: ACCENT,
              shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>Process Payment — ₹{grandTotal.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
