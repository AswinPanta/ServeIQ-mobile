import { View, Text, TouchableOpacity, Modal as RNModal, Pressable } from 'react-native';
import { BG, SLATE } from '@/lib/constants/figma-tokens';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ visible, onClose, title, children, actions }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: BG.white, borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '80%', overflow: 'hidden' }}
        >
          {title && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: SLATE[100] }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: SLATE[800] }}>{title}</Text>
            </View>
          )}
          <View style={{ padding: 20 }}>{children}</View>
          {actions && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: SLATE[100], flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              {actions}
            </View>
          )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
