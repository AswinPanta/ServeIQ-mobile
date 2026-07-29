import { View } from 'react-native';

interface StickySearchHeaderProps {
  children: React.ReactNode;
}

export function StickySearchHeader({ children }: StickySearchHeaderProps) {
  return (
    <View className="sticky top-0 z-40 w-full px-4 pt-3 bg-background">
      {children}
    </View>
  );
}
