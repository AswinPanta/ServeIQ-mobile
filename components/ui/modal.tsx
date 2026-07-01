import { Modal as RNModal, View, StyleSheet } from 'react-native';

export function Modal({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) {
  return (
    <RNModal visible={visible} transparent animationType='slide'>
      <View style={styles.overlay}>
        <View style={styles.content}>{children}</View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 }
});