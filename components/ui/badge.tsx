import { View, Text, StyleSheet } from 'react-native';

export function Badge({ label, color = '#007AFF' }: { label: string; color?: string }) {
  return <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.text}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  text: { color: 'white', fontSize: 12 }
});