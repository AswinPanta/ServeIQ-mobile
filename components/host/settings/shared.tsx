import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { GRAY, TYPOGRAPHY, RADIUS, SRS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

export function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function SettingInput({
  label, value, onChange, placeholder, multiline, keyboard, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboard?: 'default' | 'numeric' | 'email-address'; hint?: string;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={GRAY[300]}
        multiline={multiline}
        keyboardType={keyboard || 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      />
      {hint ? <Text style={inputStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SettingSaveButton({ onPress, saving }: { onPress: () => void; saving?: boolean }) {
  return (
    <TouchableOpacity
      style={[saveBtnStyles.btn, saving && saveBtnStyles.btnDisabled]}
      onPress={onPress}
      disabled={saving}
      activeOpacity={0.8}
    >
      <Text style={saveBtnStyles.text}>{saving ? 'Saving…' : 'Save Changes'}</Text>
    </TouchableOpacity>
  );
}

const saveBtnStyles = StyleSheet.create({
  btn: {
    backgroundColor: SRS.teal, borderRadius: RADIUS.button, paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  text: { ...TYPOGRAPHY.body, fontWeight: '700', color: BG.white },
});

export function SettingSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function SettingSubSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subSectionTitle}>{children}</Text>;
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[500], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: GRAY[50], borderRadius: RADIUS.input, paddingHorizontal: 14, paddingVertical: 12, ...TYPOGRAPHY.body, color: GRAY[900], borderWidth: 1, borderColor: GRAY[200] },
  hint: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 4 },
});

const styles = StyleSheet.create({
  sectionTitle: { ...TYPOGRAPHY.h3, color: GRAY[900], marginBottom: 12 },
  subSectionTitle: {
    ...TYPOGRAPHY.small, fontWeight: '700', color: GRAY[700],
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: GRAY[100], borderBottomWidth: 1, borderBottomColor: GRAY[200],
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: GRAY[200],
  },
  rowLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  rowValue: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[900] },
});