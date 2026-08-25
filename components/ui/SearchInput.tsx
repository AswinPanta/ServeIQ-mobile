import { View, TextInput, Text } from 'react-native';
import { SLATE } from '@/lib/constants/figma-tokens';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  resultCount?: number;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search...', autoFocus = false, resultCount }: SearchInputProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SLATE[100], borderRadius: 12, paddingHorizontal: 12, height: 40 }}>
        <Text style={{ fontSize: 15, marginRight: 8, color: SLATE[400] }}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={SLATE[400]}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 14, color: SLATE[800] }}
        />
        {resultCount !== undefined && (
          <View style={{ backgroundColor: SLATE[200], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: SLATE[500] }}>{resultCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
