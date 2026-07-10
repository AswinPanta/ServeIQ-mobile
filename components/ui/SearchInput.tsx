import { View, TextInput, Text } from 'react-native';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 40 }}>
        <Text style={{ fontSize: 15, marginRight: 8, color: '#94A3B8' }}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 14, color: '#1E293B' }}
        />
        {resultCount !== undefined && (
          <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>{resultCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
