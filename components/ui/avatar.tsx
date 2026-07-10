import { View, Text, Image } from 'react-native';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
} as const;

const fontSizes = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
} as const;

interface AvatarProps {
  src?: string;
  initials?: string;
  alt?: string;
  size?: keyof typeof sizes;
  online?: boolean;
  className?: string;
}

export function Avatar({ src, initials, alt = '', size = 'md', online, className }: AvatarProps) {
  return (
    <View className={cn('relative', className)}>
      {src ? (
        <Image source={{ uri: src }} className={cn('rounded-full', sizes[size])} accessibilityLabel={alt} />
      ) : (
        <View className={cn('rounded-full bg-primary items-center justify-center', sizes[size])}>
          <Text className={cn('font-semibold text-primary-foreground', fontSizes[size])}>
            {initials?.[0] || '?'}
          </Text>
        </View>
      )}
      {online && (
        <View className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </View>
  );
}
