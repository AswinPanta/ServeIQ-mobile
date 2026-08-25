import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Share } from 'react-native';
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
import { safeGoBack } from "@/lib/utils";
import { TEAL, PURPLE, AMBER, SLATE, BG, TEXT, RED } from '@/lib/constants/figma-tokens';
;
;

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: '💳', color: STATUS_COLORS.card },
  { id: 'cash', label: 'Cash', icon: '💵', color: STATUS_COLORS.cash },
  { id: 'upi', label: 'UPI', icon: '📱', color: STATUS_COLORS.upi },
  { id: 'wallet', label: 'Wallet', icon: '👛', color: STATUS_COLORS.wallet },
  { id: 'room_charge', label: 'Room Charge', icon: '🏨', color: TEAL[600] },
  { id: 'loyalty', label: 'Loyalty Points', icon: '⭐', color: PURPLE[500] },
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

  // PO-008/PO-009 — share a plaintext receipt via the OS share sheet.
  // The native share sheet offers AirPrint (Print) and Mail app (Email),
  // so the same path covers both without bundling a PDF generator.
  const buildReceiptText = (finalTotal: number) => {
    const now = new Date();
    const lines = cart.map(
      (i) => `${i.name}${i.modifiers ? ` (${i.modifiers})` : ''} × ${i.quantity}   ₹${(i.unit_price * i.quantity).toLocaleString()}`
    );
    return [
      'SERVEIQ RESTAURANT',
      `Table: ${table?.number || tableId}`,
      `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      `Payment: ${paymentMethod.toUpperCase()}${paymentMethod === 'room_charge' && selectedGuest ? ` — ${selectedGuest.name} (Room ${selectedGuest.room})` : ''}`,
      '----------------------------------',
      ...lines,
      '----------------------------------',
      `Subtotal:           ₹${subtotal.toLocaleString()}`,
      discountAmount > 0 ? `Discount:           -₹${discountAmount.toLocaleString()}` : null,
      appliedPointsDiscount > 0 ? `Loyalty:            -₹${appliedPointsDiscount.toLocaleString()}` : null,
      `Tax (10%):          ₹${tax.toLocaleString()}`,
      `GRAND TOTAL:        ₹${finalTotal.toLocaleString()}`,
      '',
      'Thank you for dining with us!',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        message: buildReceiptText(grandTotal),
        title: `Receipt_Table_${table?.number || tableId}`,
      });
    } catch (e) {
      // user cancelled or share failed — silently ignore
    }
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

    addActivity({ type: 'payment', title: `Payment received — Table ${table?.number || tableId}`, description: `₹${completed.total.toLocaleString()} via ${paymentMethod}`, icon: '💳', color: AMBER[500], property_id: operator?.property_id || 'prop-1' });
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
      <View style={{ flex: 1, backgroundColor: SLATE[50] }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ padding: 20, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: SLATE[800], letterSpacing: 1 }}>SERVEIQ RESTAURANT</Text>
              <Text style={{ fontSize: 12, color: SLATE[400], marginTop: 4 }}>Table {table?.number || tableId} · {now.toLocaleDateString()} {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: SLATE[200], paddingTop: 12, gap: 8 }}>
              {cart.map((item, idx) => (
                <View key={`${item.menu_item_id}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: SLATE[800] }}>{item.name}</Text>
                    {item.modifiers ? <Text style={{ fontSize: 11, color: SLATE[400] }}>{item.modifiers}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 12, color: SLATE[500], marginHorizontal: 8 }}>×{item.quantity}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800], width: 80, textAlign: 'right' }}>₹{(item.unit_price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: SLATE[200], marginTop: 12, paddingTop: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: SLATE[500] }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: SLATE[800] }}>₹{receipt.subtotal.toLocaleString()}</Text>
              </View>
              {receipt.discount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: SLATE[500] }}>Discount</Text>
                  <Text style={{ fontSize: 13, color: RED[500] }}>-₹{receipt.discount.toLocaleString()}</Text>
                </View>
              )}
              {appliedPointsDiscount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: SLATE[500] }}>Loyalty Points</Text>
                  <Text style={{ fontSize: 13, color: PURPLE[500] }}>-₹{appliedPointsDiscount.toLocaleString()}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: SLATE[500] }}>Tax (10%)</Text>
                <Text style={{ fontSize: 13, color: SLATE[800] }}>₹{receipt.tax.toLocaleString()}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: SLATE[200], paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: SLATE[800] }}>Grand Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>₹{receipt.total.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: getAccentColor(0.06), alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>{paymentMethod.toUpperCase()} · {receipt.paymentMethod === 'room_charge' && selectedGuest ? `${selectedGuest.name} (${selectedGuest.room})` : ''}</Text>
            </View>
            <Text style={{ fontSize: 12, color: SLATE[400], textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>Thank you!</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity onPress={handleShareReceipt}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: BG.white, borderWidth: 1.5, borderColor: SLATE[200] }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: SLATE[600] }}>🖨️ Print</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareReceipt}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: BG.white, borderWidth: 1.5, borderColor: SLATE[200] }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: SLATE[600] }}>✉️ Email</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => safeGoBack()}
            style={{ marginTop: 12, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: ACCENT }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: BG.white }}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: SLATE[50] }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => safeGoBack()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: SLATE[600] }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: SLATE[800] }}>Checkout</Text>
              <Text style={{ fontSize: 13, color: SLATE[500] }}>Table {table?.number || tableId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 12 }}>Order Summary</Text>
            {cart.length === 0 ? (
              <Text style={{ fontSize: 13, color: SLATE[400] }}>No items in current order</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {cart.map((item, idx) => (
                  <View key={`${item.menu_item_id}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: SLATE[800] }}>{item.name}</Text>
                      {item.modifiers ? <Text style={{ fontSize: 11, color: SLATE[400] }}>{item.modifiers}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: SLATE[800], marginLeft: 8 }}>×{item.quantity}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: SLATE[800], width: 80, textAlign: 'right' }}>₹{(item.unit_price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 10 }}>Discount</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['none', 'percentage', 'fixed'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => { setDiscountType(t); setDiscountValue(''); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: discountType === t ? ACCENT : SLATE[100],
                    borderWidth: 1, borderColor: discountType === t ? ACCENT : SLATE[200],
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: discountType === t ? BG.white : SLATE[600] }}>
                    {t === 'none' ? 'None' : t === 'percentage' ? '%' : '₹ Fixed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {discountType !== 'none' && (
              <TextInput
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                placeholderTextColor={SLATE[400]}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
                style={{ fontSize: 14, color: SLATE[800], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] }}
              />
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 10 }}>Split Bill</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {(['none', 'equal', 'percentage', 'byItem'] as const).map((method) => (
                <TouchableOpacity key={method} onPress={() => { setSplitMethod(method); if (method !== 'none' && splitMethod === 'none') { setSplitPercentages(Array.from({ length: splitGuests }, (_, i) => Math.round(100 / splitGuests))); } }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: splitMethod === method ? ACCENT : SLATE[100],
                    borderWidth: 1, borderColor: splitMethod === method ? ACCENT : SLATE[200],
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: splitMethod === method ? BG.white : SLATE[600] }}>
                    {method === 'none' ? 'No Split' : method === 'equal' ? 'Equal' : method === 'percentage' ? '% Split' : 'By Item'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {splitMethod !== 'none' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: SLATE[500] }}>Number of guests</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleSplitGuestsChange(-1)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getAccentColor(0.12), alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800] }}>{splitGuests}</Text>
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
                        <Text style={{ fontSize: 12, color: SLATE[500], width: 80 }}>Person {i + 1}</Text>
                        <View style={{ flex: 1, height: 24, borderRadius: 6, backgroundColor: SLATE[100], overflow: 'hidden' }}>
                          <View style={{ width: `${pct}%`, height: '100%', borderRadius: 6, backgroundColor: ACCENT }} />
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: SLATE[800], width: 40, textAlign: 'right' }}>{pct}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {splitMethod === 'byItem' && (
                  <View style={{ gap: 6, marginBottom: 10 }}>
                    {cart.map((item) => (
                      <View key={item.menu_item_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: SLATE[800], flex: 1 }} numberOfLines={1}>{item.name} ×{item.quantity}</Text>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {Array.from({ length: splitGuests }, (_, i) => (
                            <TouchableOpacity key={i} onPress={() => toggleItemAssignment(item.menu_item_id, i)}
                              style={{
                                width: 24, height: 24, borderRadius: 6,
                                backgroundColor: (splitItems[item.menu_item_id] || [0]).includes(i) ? ACCENT : SLATE[200],
                                alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: (splitItems[item.menu_item_id] || [0]).includes(i) ? BG.white : SLATE[400] }}>{i + 1}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {splitPortions.length > 0 && (
                  <View style={{ padding: 12, borderRadius: 10, backgroundColor: getAccentColor(0.06), gap: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: SLATE[500], marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Split Amounts</Text>
                    {splitPortions.map((p, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, color: SLATE[800] }}>{p.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>₹{p.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          <View style={{ padding: 16, borderRadius: 16, backgroundColor: getAccentColor(0.04), borderWidth: 1, borderColor: getAccentColor(0.12) }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 12 }}>Total Breakdown</Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: SLATE[500] }}>Subtotal</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>₹{subtotal.toLocaleString()}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: SLATE[500] }}>Discount</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: RED[500] }}>-₹{discountAmount.toLocaleString()}</Text>
                </View>
              )}
              {appliedPointsDiscount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: SLATE[500] }}>Loyalty Points</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: PURPLE[500] }}>-₹{appliedPointsDiscount.toLocaleString()}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: SLATE[500] }}>Tax (10%)</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>₹{tax.toLocaleString()}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: getAccentColor(0.15), paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: SLATE[800] }}>Grand Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>₹{grandTotal.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 12 }}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity key={pm.id} onPress={() => setPaymentMethod(pm.id)}
                  style={{
                    padding: 14, borderRadius: 14, alignItems: 'center', minWidth: 90,
                    backgroundColor: paymentMethod === pm.id ? pm.color + '12' : BG.white,
                    borderWidth: 1.5, borderColor: paymentMethod === pm.id ? pm.color : SLATE[200],
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{pm.icon}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: paymentMethod === pm.id ? pm.color : SLATE[600] }}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {paymentMethod === 'room_charge' && (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800], marginBottom: 10 }}>🏨 Room Charge</Text>
              <TextInput
                placeholder="Search guest by name/phone"
                placeholderTextColor={SLATE[400]}
                value={rcGuestQuery}
                onChangeText={(t) => { setRcGuestQuery(t); setSelectedGuest(null); }}
                style={{ fontSize: 14, color: SLATE[800], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] }}
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
                        style={{ padding: 10, borderRadius: 8, backgroundColor: SLATE[100] }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>{g.name}</Text>
                        <Text style={{ fontSize: 11, color: SLATE[500] }}>{g.phone} · Room {folio?.room_number || 'N/A'} · {folio?.booking_ref || 'N/A'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {selectedGuest && (
                <View style={{ marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: getAccentColor(0.06) }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>{selectedGuest.name}</Text>
                  <Text style={{ fontSize: 12, color: SLATE[500] }}>Room {selectedGuest.room} · Ref: {selectedGuest.bookingRef}</Text>
                </View>
              )}
            </View>
          )}

          {paymentMethod === 'loyalty' && (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: BG.white, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <TouchableOpacity onPress={() => setUseLoyalty(!useLoyalty)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: SLATE[800] }}>⭐ Use Loyalty Points</Text>
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: useLoyalty ? PURPLE[500] : SLATE[200], alignItems: useLoyalty ? 'flex-end' : 'flex-start', justifyContent: 'center', padding: 2 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: BG.white }} />
                </View>
              </TouchableOpacity>
              {useLoyalty && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TextInput
                    placeholder="Search guest by name/phone"
                    placeholderTextColor={SLATE[400]}
                    value={lpGuestQuery}
                    onChangeText={(t) => { setLpGuestQuery(t); setLpGuest(null); }}
                    style={{ fontSize: 14, color: SLATE[800], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] }}
                  />
                  {!lpGuest && lpGuestQuery.trim().length > 0 && (
                    <View style={{ gap: 4 }}>
                      {useGuestStore.getState().findGuest(lpGuestQuery).slice(0, 5).map((g) => (
                        <TouchableOpacity key={g.id} onPress={() => { setLpGuest({ id: g.id, name: g.name, points: g.loyaltyPoints }); setLpGuestQuery(g.name); }}
                          style={{ padding: 10, borderRadius: 8, backgroundColor: SLATE[100] }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>{g.name}</Text>
                          <Text style={{ fontSize: 11, color: SLATE[500] }}>{g.loyaltyPoints} points · {g.loyaltyTier}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {lpGuest && (
                    <>
                      <View style={{ padding: 10, borderRadius: 8, backgroundColor: SLATE[100] }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: SLATE[800] }}>{lpGuest.name}</Text>
                        <Text style={{ fontSize: 12, color: PURPLE[500], fontWeight: '700' }}>{lpGuest.points} points available (≈ ₹{lpGuest.points})</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          placeholder="Points to redeem"
                          placeholderTextColor={SLATE[400]}
                          value={pointsToRedeem}
                          onChangeText={setPointsToRedeem}
                          keyboardType="numeric"
                          style={{ flex: 1, fontSize: 14, color: SLATE[800], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] }}
                        />
                        <TouchableOpacity onPress={handleApplyLoyalty}
                          style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: PURPLE[500] }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: BG.white }}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                      {appliedPointsDiscount > 0 && (
                        <View style={{ padding: 10, borderRadius: 8, backgroundColor: PURPLE[500] + '15' }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: PURPLE[500] }}>✅ {pointsToRedeem} points applied — ₹{appliedPointsDiscount} discount</Text>
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: BG.white }}>Process Payment — ₹{grandTotal.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}