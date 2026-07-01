/**
 * Button Component
 * Reusable button with multiple variants and states
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  testID?: string;
}

export function Button({
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  children,
  className,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-surface border border-border',
    tertiary: 'bg-transparent',
    danger: 'bg-error',
  };

  const variantTextStyles = {
    primary: 'text-white',
    secondary: 'text-foreground',
    tertiary: 'text-primary',
    danger: 'text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-60',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : colors.primary} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          <Text
            className={cn(
              'font-semibold',
              variantTextStyles[variant],
              textSizeStyles[size]
            )}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
