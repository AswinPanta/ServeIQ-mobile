import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className={cn('relative', className)}>
      <TouchableOpacity onPress={() => setOpen(v => !v)}>
        {trigger}
      </TouchableOpacity>
      {open && (
        <>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }}
            onPress={() => setOpen(false)}
          />
          <View
            className={cn(
              'absolute z-50 mt-1.5 min-w-[160px] bg-card rounded-xl border border-border shadow-lg py-1',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { item.onClick(); setOpen(false); }}
                disabled={item.disabled}
                className={cn(
                  'flex-row items-center gap-2.5 px-3 py-2',
                  item.danger ? 'text-destructive' : 'text-foreground',
                  item.disabled && 'opacity-40'
                )}
              >
                {item.icon && <View className="w-4 h-4 items-center justify-center">{item.icon}</View>}
                <Text className={cn('text-sm', item.danger ? 'text-destructive' : 'text-foreground')}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
