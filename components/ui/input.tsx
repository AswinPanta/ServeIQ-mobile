/**
 * Input Field Component
 * Reusable text input with validation and error states
 */

import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const colors = useColors();

  return (
    <View className={cn('gap-2', containerClassName)}>
      {label && (
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
      )}

      <View
        className={cn(
          'flex-row items-center px-4 py-3 rounded-lg border',
          error
            ? 'border-error bg-error/10'
            : 'border-border bg-surface'
        )}
      >
        {icon && <View className="mr-2">{icon}</View>}
        <TextInput
          placeholderTextColor={colors.muted}
          className={cn(
            'flex-1 text-base text-foreground',
            className
          )}
          {...props}
        />
      </View>

      {error && (
        <Text className="text-xs text-error font-semibold">{error}</Text>
      )}

      {hint && !error && (
        <Text className="text-xs text-muted">{hint}</Text>
      )}
    </View>
  );
}
