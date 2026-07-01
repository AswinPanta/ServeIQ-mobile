/**
 * Card Component
 * Reusable card container for displaying content
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const colors = useColors();

  const variantStyles = {
    default: 'bg-surface border border-border',
    elevated: 'bg-surface shadow-sm',
    outlined: 'border-2 border-border bg-transparent',
  };

  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: 'p-0',
  };

  return (
    <View
      className={cn(
        'rounded-lg overflow-hidden',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
