import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal as RNModal } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  error,
  className,
}: SelectProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={cn(
          'flex-row items-center h-11 px-3.5 bg-card border rounded-xl',
          error ? 'border-destructive' : 'border-border'
        )}
      >
        <Text className={cn(
          'flex-1 text-sm',
          selected ? 'text-foreground' : 'text-muted-foreground/70'
        )}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-muted-foreground text-xs">▼</Text>
      </TouchableOpacity>
      {error && <Text className="mt-1 text-xs text-destructive">{error}</Text>}

      <RNModal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View
            className="bg-card rounded-2xl max-h-64 overflow-hidden"
            onStartShouldSetResponder={() => true}
          >
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    'px-4 py-3 border-b border-border',
                    opt.value === value ? 'bg-primary/10' : ''
                  )}
                >
                  <Text className={cn(
                    'text-sm',
                    opt.value === value ? 'text-primary font-semibold' : 'text-foreground'
                  )}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
}
