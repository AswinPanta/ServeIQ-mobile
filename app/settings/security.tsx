import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { safeGoBack } from '@/lib/utils';
import { CORAL, RED } from '@/lib/constants/figma-tokens';

export default function SecurityScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-14 pb-8">
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => safeGoBack()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">Security</Text>
          </View>

          <ChangePasswordForm accent={CORAL[500]} onSuccess={() => safeGoBack()} />

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24, marginTop: 32 }}>
            <Text className="text-sm font-bold text-red-600 mb-2">Danger Zone</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete Account', 'This action is permanent and cannot be undone. All your data will be deleted.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deleted', 'Your account has been scheduled for deletion.') },
                ]);
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: RED[200],
              }}
            >
              <Text className="text-base font-semibold text-red-600">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
});
