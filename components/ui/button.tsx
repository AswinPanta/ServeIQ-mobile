import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { BG } from '@/lib/constants/figma-tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
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

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border border-border bg-card',
    ghost: 'bg-transparent',
    danger: 'bg-destructive',
    accent: 'bg-accent',
  };

  const variantTextStyles: Record<ButtonVariant, string> = {
    primary: 'text-primary-foreground',
    secondary: 'text-secondary-foreground',
    outline: 'text-foreground',
    ghost: 'text-muted-foreground',
    danger: 'text-destructive-foreground',
    accent: 'text-accent-foreground',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3.5',
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      className={cn(
        'flex-row items-center justify-center rounded-xl font-medium',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.foreground : BG.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View className="mr-1.5">{icon}</View>}
          <Text className={cn('font-semibold', variantTextStyles[variant], textSizeStyles[size])}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && <View className="ml-1.5">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
