import { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounce = 300,
  className,
}: SearchInputProps) {
  const colors = useColors();
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounce);
  };

  return (
    <View className={cn('relative flex-row items-center', className)}>
      <Text className="absolute left-3 text-muted-foreground pointer-events-none text-lg">⌕</Text>
      <TextInput
        value={local}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted + '80'}
        className="flex-1 h-10 pl-9 pr-8 text-sm bg-card border border-border rounded-xl text-foreground"
        style={{ paddingVertical: 0 }}
      />
      {local ? (
        <TouchableOpacity
          onPress={() => { setLocal(''); onChange(''); }}
          className="absolute right-3"
        >
          <Text className="text-muted-foreground text-sm">✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
