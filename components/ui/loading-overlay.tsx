/**
 * Loading Overlay Component
 * Global loading indicator overlay
 */

import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-surface rounded-2xl px-8 py-6 gap-4 items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-base font-semibold text-foreground">{message}</Text>
        </View>
      </View>
    </Modal>
  );
}
