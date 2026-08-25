import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from '@/lib/utils';
import { CORAL, BRAND, BG, NEUTRAL, SLATE } from '@/lib/constants/figma-tokens';

const ACCENT = CORAL[500];
const NAVY = BRAND.navyLight;

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
}

const MENU_DATA: Record<string, MenuItem[]> = {
  'Starters': [
    { id: 's1', name: 'Spring Rolls', price: 350, description: 'Crispy vegetable rolls with sweet chili sauce' },
    { id: 's2', name: 'Chicken Wings', price: 450, description: 'Spicy buffalo wings with blue cheese dip' },
    { id: 's3', name: 'Bruschetta', price: 300, description: 'Toasted bread with tomato and basil' },
    { id: 's4', name: 'Soup of the Day', price: 250, description: 'Ask your server for today\u2019s selection' },
  ],
  'Mains': [
    { id: 'm1', name: 'Grilled Salmon', price: 850, description: 'With lemon butter sauce and seasonal vegetables' },
    { id: 'm2', name: 'Chicken Steak', price: 750, description: 'Grilled with peppercorn sauce' },
    { id: 'm3', name: 'Vegetable Curry', price: 550, description: 'Traditional Nepali vegetable curry with rice' },
    { id: 'm4', name: 'Pasta Carbonara', price: 650, description: 'Classic Italian pasta with bacon and egg' },
    { id: 'm5', name: 'Momos (8 pcs)', price: 350, description: 'Steamed dumplings with tomato achar' },
  ],
  'Desserts': [
    { id: 'd1', name: 'Chocolate Cake', price: 350, description: 'Rich dark chocolate layer cake' },
    { id: 'd2', name: 'Ice Cream Sundae', price: 250, description: 'Three scoops with hot fudge and nuts' },
    { id: 'd3', name: 'Fruit Platter', price: 300, description: 'Fresh seasonal fruits' },
  ],
  'Beverages': [
    { id: 'b1', name: 'Fresh Lime Soda', price: 120 },
    { id: 'b2', name: 'Masala Chai', price: 60 },
    { id: 'b3', name: 'Coffee', price: 80 },
    { id: 'b4', name: 'Soft Drink', price: 80 },
    { id: 'b5', name: 'Mineral Water', price: 40 },
  ],
};

const CATEGORIES = Object.keys(MENU_DATA);

export default function RestaurantMenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const items = MENU_DATA[selectedCategory] || [];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={NAVY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Restaurant Menu</Text>
          <Text style={s.sub}>Browse our delicious offerings</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[s.categoryTab, selectedCategory === cat && s.categoryTabActive]}
          >
            <Text style={[s.categoryText, selectedCategory === cat && s.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu Items */}
      <View style={s.menuList}>
        {items.map(item => (
          <View key={item.id} style={s.menuItem}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={s.itemDesc}>{item.description}</Text>
              )}
            </View>
            <Text style={s.itemPrice}>Rs {item.price}</Text>
          </View>
        ))}
      </View>

      {/* Call to Action */}
      <View style={s.ctaSection}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/dining-reservations')} style={s.ctaBtn}>
          <IconSymbol name="restaurant" size={18} color={BG.white} />
          <Text style={s.ctaBtnText}>Reserve a Table</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SLATE[100] },
  title: { fontSize: 22, fontWeight: '700', color: NAVY, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: SLATE[400], marginTop: 2 },
  categoryRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: BG.white, borderWidth: 1.5, borderColor: SLATE[200] },
  categoryTabActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  categoryText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  categoryTextActive: { color: BG.white },
  menuList: { paddingHorizontal: 16, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  itemName: { fontSize: 14, fontWeight: '600', color: NAVY },
  itemDesc: { fontSize: 11, color: SLATE[400], marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: ACCENT },
  ctaSection: { paddingHorizontal: 16, paddingTop: 24 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: ACCENT },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
});
