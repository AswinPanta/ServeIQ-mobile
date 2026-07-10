import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

const variants = {
  navy: 'bg-primary/10',
  blue: 'bg-blue-50',
  amber: 'bg-amber-50',
  emerald: 'bg-emerald-50',
  red: 'bg-red-50',
  gray: 'bg-muted',
  slate: 'bg-slate-100',
} as const;

const variantText = {
  navy: 'text-primary',
  blue: 'text-blue-700',
  amber: 'text-amber-700',
  emerald: 'text-emerald-700',
  red: 'text-red-700',
  gray: 'text-muted-foreground',
  slate: 'text-slate-700',
} as const;

const sizes = {
  sm: 'px-1.5 py-0.5',
  md: 'px-2.5 py-1',
} as const;

const textSizes = {
  sm: 'text-[10px]',
  md: 'text-xs',
} as const;

type BadgeVariant = keyof typeof variants;
type BadgeSize = keyof typeof sizes;

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, variant = 'gray', size = 'md', dot, className }: BadgeProps) {
  return (
    <View className={cn(
      'inline-flex flex-row items-center gap-1.5 rounded-full',
      variants[variant],
      sizes[size],
      className
    )}>
      {dot && <View className={cn('w-1.5 h-1.5 rounded-full opacity-60', variantText[variant])} />}
      <Text className={cn('font-medium', variantText[variant], textSizes[size])}>{label}</Text>
    </View>
  );
}
