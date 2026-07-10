/**
 * Toast/Snackbar Component
 * Temporary notification messages
 */

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss?.();
      });
    }
  }, [visible, duration, opacity, onDismiss]);

  if (!visible) return null;

  const typeStyles = {
    success: { bg: 'bg-success/20', text: 'text-success', icon: '✓' },
    error: { bg: 'bg-error/20', text: 'text-error', icon: '✕' },
    info: { bg: 'bg-primary/20', text: 'text-primary', icon: 'ℹ' },
    warning: { bg: 'bg-warning/20', text: 'text-warning', icon: '⚠' },
  };

  const style = typeStyles[type];

  return (
    <Animated.View
      style={[
        {
          opacity,
          position: 'absolute',
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
        },
      ]}
    >
      <View className={cn('rounded-lg p-4 flex-row items-center gap-3', style.bg)}>
        <Text className={cn('text-lg font-bold', style.text)}>{style.icon}</Text>
        <Text className={cn('flex-1 font-semibold', style.text)}>{message}</Text>
        <TouchableOpacity onPress={onDismiss}>
          <Text className={cn('text-lg', style.text)}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface ToastContextType {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 600);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    show(message, 'success', duration);
  }, [show]);

  const error = useCallback((message: string, duration?: number) => {
    show(message, 'error', duration);
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    show(message, 'info', duration);
  }, [show]);

  const warning = useCallback((message: string, duration?: number) => {
    show(message, 'warning', duration);
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          visible={true}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
