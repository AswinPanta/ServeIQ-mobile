import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTableStore } from '@/stores/useTableStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuth } from '@/lib/context/auth-context';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { ACCENT, getAccentColor } from '@/constants/portal-theme';
import { Modal } from '@/components/ui/modal';
import type { MenuItem } from '@/types/api';

const TBL_COLORS: Record<string, string> = {
  available: '#22C55E',
  occupied: '#EF4444',
  reserved: '#F59E0B',
  cleaning: '#06B6D4',
};

const CATEGORIES = ['All', 'Food', 'Beverages', 'Desserts'];

export default function TableOrderScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const setTablePropertyId = useTableStore((s) => s.setPropertyId);
  const setOrderPropertyId = useOrderStore((s) => s.setPropertyId);

  useEffect(() => {
    const pid = operator?.property_id || 'prop-1';
    setTablePropertyId(pid);
    setOrderPropertyId(pid);
  }, [operator?.property_id, setTablePropertyId, setOrderPropertyId]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = id || '';

  const tables = useTableStore((s) => s.tables);
  const table = useMemo(() => tables.find((t) => t.id === tableId), [tables, tableId]);
  const items = useMenuStore((s) => s.items);
  const toggleAvailability = useMenuStore((s) => s.toggleAvailability);
  const cart = useOrderStore((s) => s.carts[tableId] || []);
  const tickets = useOrderStore((s) => s.tickets);
  const notifications = useNotificationStore((s) => s.notifications);

  const [activeCategory, setActiveCategory] = useState('All');
  const [notes, setNotes] = useState('');
  const [modifierModal, setModifierModal] = useState<{ item: MenuItem } | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, string>>({});
  const [dismissedReady, setDismissedReady] = useState(false);

  const isHappyHour = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 17 && hour < 19;
  }, []);

  const isHappyHourItem = useCallback((item: MenuItem) => {
    return isHappyHour && item.tags.some((t) => ['drink', 'coffee', 'juice'].includes(t));
  }, [isHappyHour]);

  const happyHourPrice = useCallback((item: MenuItem) => {
    return isHappyHourItem(item) ? Math.round(item.price * 0.8) : item.price;
  }, [isHappyHourItem]);

  if (!table) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#EF4444' }}>Table not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: ACCENT, borderRadius: 10 }}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tableStatus = table.status;
  const existingTickets = tickets.filter((t) => t.table_number === table.number && t.status !== 'ready');
  const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const mealPeriod = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return { label: 'Breakfast', icon: '🌅' };
    if (hour >= 11 && hour < 15) return { label: 'Lunch', icon: '☀️' };
    if (hour >= 15 && hour < 18) return { label: 'Evening', icon: '🍵' };
    if (hour >= 18 && hour < 23) return { label: 'Dinner', icon: '🌙' };
    return { label: 'Late Night', icon: '🌃' };
  }, []);

  function isItemAvailableForMeal(item: MenuItem): boolean {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      return item.tags.some((tag) => ['coffee', 'juice', 'sandwich'].includes(tag));
    }
    return true;
  }

  const filteredItems = (activeCategory === 'All'
    ? items
    : items.filter((i) => i.category === activeCategory)
  ).filter(isItemAvailableForMeal);

  const handleItemPress = (item: MenuItem) => {
    if (!item.is_available) return;
    if (item.modifiers && item.modifiers.length > 0) {
      const defaults: Record<string, string> = {};
      item.modifiers.forEach((m) => { defaults[m.id] = m.options[0].label; });
      setSelectedMods(defaults);
      setModifierModal({ item });
    } else {
      const { addToCart } = useOrderStore.getState();
      addToCart(tableId, {
        menu_item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.price,
        modifiers: '',
      });
    }
  };

  const confirmModifiers = () => {
    if (!modifierModal) return;
    const { item } = modifierModal;
    const modLabels: string[] = [];
    let extraPrice = 0;
    item.modifiers?.forEach((m) => {
      const label = selectedMods[m.id] || m.options[0].label;
      const opt = m.options.find((o) => o.label === label);
      modLabels.push(label);
      if (opt) extraPrice += opt.price;
    });
    const { addToCart } = useOrderStore.getState();
    addToCart(tableId, {
      menu_item_id: item.id,
      name: item.name,
      quantity: 1,
      unit_price: item.price + extraPrice,
      modifiers: modLabels.join(', '),
    });
    setModifierModal(null);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'Add items before placing an order');
      return;
    }
    const { placeOrder, clearCart } = useOrderStore.getState();
    const { addActivity } = useActivityStore.getState();
    const { addNotification } = useNotificationStore.getState();
    placeOrder(tableId, table.number, notes.trim() || undefined);
    useTableStore.getState().updateTableStatus(tableId, 'occupied');
    addActivity({ type: 'order', title: `Order placed for Table ${table.number}`, description: `${cart.length} items`, icon: '🍽️', color: ACCENT, property_id: operator?.property_id || 'prop-1' });
    addNotification({ type: 'new_order', title: `New Order — Table ${table.number}`, message: `${cart.length} items sent to kitchen`, data: { tableId } });
    setNotes('');
    Alert.alert('Order Placed', `Order sent to kitchen for Table ${table.number}`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleSplitBill = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'Add items before splitting the bill');
      return;
    }
    router.push(`/(operations)/pos/checkout?id=${tableId}&total=${cartTotal}`);
  };

  const handleLongPress = (item: MenuItem) => {
    const label = item.is_available ? 'Mark as Unavailable' : 'Mark as Available';
    Alert.alert(label, `${item.name}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: label, onPress: () => toggleAvailability(item.id) },
    ]);
  };

  const readyItems = useMemo(() => {
    const tableTickets = tickets.filter(
      (t) => t.status === 'ready' && t.table_number === table.number
    );
    const kitchenNotifs = notifications.filter(
      (n) => n.type === 'kitchen_ready' && n.data?.tableId === tableId
    );
    const readyCount = tableTickets.reduce((sum, t) => sum + t.items.filter((i) => i.item_status === 'ready' || i.item_status === 'pending').length, 0);
    return { count: readyCount, tickets: tableTickets, notifCount: kitchenNotifs.length };
  }, [tickets, notifications, table?.number, tableId]);

  useEffect(() => {
    setDismissedReady(false);
  }, [readyItems.count]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: '#475569' }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B' }}>Table {table.number}</Text>
                <Text style={{ fontSize: 13, color: '#64748B' }}>Capacity: {table.capacity} · {table.shape}</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: (TBL_COLORS[tableStatus] || ACCENT) + '18' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: TBL_COLORS[tableStatus] || ACCENT, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {tableStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: getAccentColor(0.1) }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>{mealPeriod.icon} {mealPeriod.label}</Text>
            </View>
          </View>
          {!dismissedReady && readyItems.count > 0 && (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#D97706' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#B45309', flex: 1 }}>🍽️ ORDER READY — {readyItems.count} items ready for pickup!</Text>
                <TouchableOpacity onPress={() => setDismissedReady(true)}
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#D97706' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {isHappyHour && (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: '#FFD70020', borderWidth: 1, borderColor: '#FFD700' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#B8860B' }}>🎉 Happy Hour! 20% off selected items</Text>
            </View>
          )}
          {existingTickets.length > 0 && (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: '#F59E0B15', borderWidth: 1, borderColor: '#F59E0B30' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706' }}>⚠ {existingTickets.length} order(s) already in kitchen for this table</Text>
            </View>
          )}

          {cart.length > 0 && (
            <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Current Order</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
              </View>
              {cart.map((item, idx) => (
                <View key={`${item.menu_item_id}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: idx < cart.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B' }}>{item.name}</Text>
                    {item.modifiers ? <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{item.modifiers}</Text> : null}
                    <Text style={{ fontSize: 12, color: '#64748B' }}>₹{item.unit_price} ea</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => { useOrderStore.getState().updateCartQty(tableId, item.menu_item_id, item.quantity - 1); }}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', width: 20, textAlign: 'center' }}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => { useOrderStore.getState().updateCartQty(tableId, item.menu_item_id, item.quantity + 1); }}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getAccentColor(0.12), alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Total</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>₹{cartTotal.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 }}>Menu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: activeCategory === cat ? ACCENT : '#FFF',
                      borderWidth: 1, borderColor: activeCategory === cat ? ACCENT : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: activeCategory === cat ? '#FFF' : '#475569' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ gap: 8 }}>
              {filteredItems.map((item) => {
                const cartItem = cart.find((c) => c.menu_item_id === item.id);
                const hhPrice = happyHourPrice(item);
                const isHH = isHappyHourItem(item);
                return (
                  <TouchableOpacity key={item.id}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={500}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                      backgroundColor: '#FFF', borderWidth: 1, borderColor: cartItem ? getAccentColor(0.3) : '#F1F5F9',
                      opacity: item.is_available ? 1 : 0.4,
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.is_veg ? '#22C55E' : '#EF4444', marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B' }}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {isHH ? (
                          <>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>₹{hhPrice}</Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through' }}>₹{item.price}</Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 13, fontWeight: '700', color: ACCENT }}>₹{item.price}</Text>
                        )}
                      </View>
                    </View>
                    {!item.is_available && (
                      <View style={{ marginRight: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>OUT OF STOCK</Text>
                      </View>
                    )}
                    {cartItem && item.is_available && (
                      <View style={{ marginRight: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: getAccentColor(0.1) }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>×{cartItem.quantity}</Text>
                      </View>
                    )}
                    {item.is_available && (
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {cart.length > 0 && (
            <TextInput
              placeholder="Order notes (e.g., Extra spicy, No onions)"
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              style={{
                fontSize: 14, color: '#1E293B', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
              }}
            />
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handlePlaceOrder}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                backgroundColor: existingTickets.length > 0 ? '#D97706' : ACCENT,
                shadowColor: existingTickets.length > 0 ? '#D97706' : ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>{existingTickets.length > 0 ? 'Send as Supplement' : 'Place Order'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSplitBill}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                backgroundColor: '#FFF', borderWidth: 1.5, borderColor: getAccentColor(0.3),
              }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>Split Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modifierModal !== null}
        onClose={() => setModifierModal(null)}
        title={modifierModal?.item?.name || 'Select Options'}
        actions={
          <TouchableOpacity onPress={confirmModifiers}
            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Done</Text>
          </TouchableOpacity>
        }
      >
        {modifierModal?.item?.modifiers?.map((mod) => (
          <View key={mod.id} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8 }}>{mod.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {mod.options.map((opt) => {
                const isSelected = selectedMods[mod.id] === opt.label;
                return (
                  <TouchableOpacity key={opt.label} onPress={() => setSelectedMods((prev) => ({ ...prev, [mod.id]: opt.label }))}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: isSelected ? ACCENT : '#F1F5F9',
                      borderWidth: 1, borderColor: isSelected ? ACCENT : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#FFF' : '#475569' }}>
                      {opt.label}{opt.price > 0 ? ` (+₹${opt.price})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </Modal>
    </View>
  );
}
