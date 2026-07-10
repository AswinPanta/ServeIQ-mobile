import React from 'react';
import { View, ViewProps } from 'react-native';
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
  const variantStyles = {
    default: 'bg-card border border-border',
    elevated: 'bg-card shadow-sm',
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
        'rounded-xl overflow-hidden',
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

export function CardHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('px-5 py-4 border-b border-border', className)}>
      {children}
    </View>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('px-5 py-4', className)}>
      {children}
    </View>
  );
}
