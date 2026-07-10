/**
 * Split Bill Modal (SRS PO-007)
 * Allows splitting a restaurant bill by items, by percentage, or equally
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import type { CartItem } from '@/lib/context/restaurant-context';

const ACCENT = '#0D9488';

interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  onApplySplit: (parts: { items: CartItem[]; total: number }[]) => void;
}

type SplitMode = 'equal' | 'by_item' | 'by_amount';

export function SplitBillModal({ visible, onClose, items, subtotal, onApplySplit }: SplitBillModalProps) {
  const colors = useColors();
  const [mode, setMode] = useState<SplitMode>('equal');
  const [numParts, setNumParts] = useState(2);
  const [customParts, setCustomParts] = useState<{ label: string; amount: string }[]>([
    { label: 'Person 1', amount: '' },
    { label: 'Person 2', amount: '' },
  ]);

  const handleNumPartsChange = (n: number) => {
    setNumParts(n);
    setCustomParts(prev => {
      const updated = [...prev];
      while (updated.length < n) updated.push({ label: `Person ${updated.length + 1}`, amount: '' });
      return updated.slice(0, n);
    });
  };

  const perPersonEqual = Math.round(subtotal / numParts);

  const handleApply = () => {
    if (mode === 'equal') {
      const parts = Array.from({ length: numParts }, () => ({ items, total: perPersonEqual }));
      onApplySplit(parts);
    } else if (mode === 'by_item') {
      // Distribute items equally among parts
      const partSize = Math.ceil(items.length / numParts);
      const parts = [];
      for (let i = 0; i < numParts; i++) {
        const partItems = items.slice(i * partSize, (i + 1) * partSize);
        const total = partItems.reduce((s, it) => s + it.price * it.qty, 0);
        parts.push({ items: partItems, total });
      }
      onApplySplit(parts);
    } else {
      // By custom amount
      const parts = customParts.map(cp => ({
        items,
        total: parseInt(cp.amount) || 0,
      }));
      onApplySplit(parts);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          <View className="px-6 py-4 border-b border-border flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base text-muted">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Split Bill</Text>
            <TouchableOpacity onPress={handleApply}>
              <Text className="text-base font-semibold" style={{ color: ACCENT }}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 pt-4" style={{ maxHeight: 400 }}>
            {/* Split Mode Selector */}
            <View className="flex-row gap-2 mb-5">
              {(['equal', 'by_item', 'by_amount'] as SplitMode[]).map(m => (
                <TouchableOpacity key={m} onPress={() => setMode(m)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: mode === m ? ACCENT : colors.background,
                    borderWidth: 1, borderColor: mode === m ? ACCENT : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: mode === m ? '#fff' : colors.text }}>
                    {m === 'equal' ? 'Equal' : m === 'by_item' ? 'By Item' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'equal' && (
              <View>
                <Text className="text-sm font-semibold text-foreground mb-3">Number of People</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6].map(n => (
                    <TouchableOpacity key={n} onPress={() => handleNumPartsChange(n)}
                      style={{
                        width: 52, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: numParts === n ? ACCENT : colors.background,
                        borderWidth: 1.5, borderColor: numParts === n ? ACCENT : colors.border,
                      }}
                    >
                      <Text className="text-sm font-bold" style={{ color: numParts === n ? '#fff' : colors.foreground }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ padding: 16, borderRadius: 14, backgroundColor: ACCENT + '08', marginTop: 16 }}>
                  <Text className="text-sm text-muted">Each person pays</Text>
                  <Text className="text-2xl font-bold" style={{ color: ACCENT }}>₹{perPersonEqual.toLocaleString()}</Text>
                  <Text className="text-xs text-muted mt-1">Total: ₹{subtotal.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {mode === 'by_item' && (
              <View>
                <Text className="text-sm font-semibold text-foreground mb-3">Split Items Among</Text>
                <View className="flex-row gap-2 flex-wrap mb-4">
                  {[2, 3, 4].map(n => (
                    <TouchableOpacity key={n} onPress={() => handleNumPartsChange(n)}
                      style={{
                        width: 52, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: numParts === n ? ACCENT : colors.background,
                        borderWidth: 1.5, borderColor: numParts === n ? ACCENT : colors.border,
                      }}
                    >
                      <Text className="text-sm font-bold" style={{ color: numParts === n ? '#fff' : colors.foreground }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="gap-2">
                  {items.map(item => (
                    <View key={item.id} className="flex-row justify-between py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text className="text-sm text-foreground">{item.name}</Text>
                      <Text className="text-sm font-semibold text-foreground">₹{item.price * item.qty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {mode === 'by_amount' && (
              <View>
                <Text className="text-sm font-semibold text-foreground mb-3">Custom Amounts</Text>
                {customParts.map((part, i) => (
                  <View key={i} className="flex-row items-center gap-3 mb-3">
                    <Text className="text-sm text-muted w-20">{part.label}</Text>
                    <TextInput
                      value={part.amount}
                      onChangeText={t => {
                        const updated = [...customParts];
                        updated[i] = { ...updated[i], amount: t.replace(/[^0-9]/g, '') };
                        setCustomParts(updated);
                      }}
                      placeholder="Amount"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      className="flex-1 text-sm text-foreground px-3 py-2 rounded-lg"
                      style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
