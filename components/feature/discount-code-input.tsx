import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { validateDiscountCode, calculateDiscount, type DiscountCode } from '@/lib/mock/discount-codes';

interface DiscountCodeInputProps {
  subtotal: number;
  nights: number;
  roomType: string;
  onApply: (discount: DiscountCode | null, amount: number) => void;
}

export function DiscountCodeInput({ subtotal, nights, roomType, onApply }: DiscountCodeInputProps) {
  const colors = useColors();
  const [code, setCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const handleApply = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }

    setIsChecking(true);

    // Simulate network delay
    setTimeout(() => {
      const result = validateDiscountCode(code.trim(), subtotal, roomType);

      if (result.valid && result.discount) {
        const amount = calculateDiscount(result.discount, subtotal, nights);
        setAppliedDiscount(result.discount);
        setDiscountAmount(amount);
        onApply(result.discount, amount);
        Alert.alert('Success', `Discount applied! You save Rs ${amount.toLocaleString()}`);
      } else {
        setAppliedDiscount(null);
        setDiscountAmount(0);
        onApply(null, 0);
        Alert.alert('Invalid Code', result.error || 'Please check your code and try again');
      }

      setIsChecking(false);
    }, 800);
  };

  const handleRemove = () => {
    setCode('');
    setAppliedDiscount(null);
    setDiscountAmount(0);
    onApply(null, 0);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">Discount Code</Text>

      {appliedDiscount ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.success,
            backgroundColor: `${colors.success}10`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>✓</Text>
            <View>
              <Text style={{ fontWeight: '600', color: colors.success }}>
                {appliedDiscount.code}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {appliedDiscount.description}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleRemove}>
            <Text style={{ color: colors.error, fontWeight: '600' }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="Enter code"
            placeholderTextColor={colors.muted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.foreground,
            }}
          />
          <TouchableOpacity
            onPress={handleApply}
            disabled={isChecking || !code.trim()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: code.trim() ? colors.primary : `${colors.primary}50`,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isChecking ? '...' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {discountAmount > 0 && (
        <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
          You save Rs {discountAmount.toLocaleString()}
        </Text>
      )}
    </View>
  );
}
