import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { getPortalStorageKeys } from '@/constants/api-config';
import type { HostProfile } from '@/types/api';
import { safeGoBack } from '@/lib/utils';
import { SRS, TYPOGRAPHY } from '@/constants/portal-theme';
import { SLATE, BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

export default function HostProfileScreen() {
  const { user, setUser, portal } = useAuth();
  const host = user as HostProfile | null;
  const [name, setName] = useState(host?.name || '');
  const [email, setEmail] = useState(host?.email || '');
  const [phone, setPhone] = useState(host?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const nameTrim = name.trim();
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    if (!nameTrim) { Alert.alert('Missing name', 'Please enter your full name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) { Alert.alert('Invalid email', 'Please enter a valid email address.'); return; }
    if (phoneTrim && phoneTrim.replace(/\D/g, '').length < 10) { Alert.alert('Invalid phone', 'Phone number must be at least 10 digits.'); return; }
    if (!host) { Alert.alert('Error', 'You are not signed in. Please log in first.'); return; }

    const nameParts = nameTrim.split(/\s+/);
    setSaving(true);
    try {
      const updated: HostProfile = {
        ...host,
        name: nameTrim,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        email: emailTrim,
        phone: phoneTrim,
        updated_at: new Date().toISOString(),
      };
      setUser(updated);
      if (portal) {
        await AsyncStorage.setItem(getPortalStorageKeys(portal).USER_PROFILE, JSON.stringify(updated));
      }
      Alert.alert('Saved', 'Your contact details have been updated.', [{ text: 'OK', onPress: () => safeGoBack() }]);
    } catch {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (host?.firstName || host?.name || 'H').charAt(0).toUpperCase();

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>My Profile</Text>
            <Text style={s.headerSub}>Update your host account contact details</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.avatarName}>{host?.name || 'Host'}</Text>
          <Text style={s.avatarEmail}>{host?.email || ''}</Text>
        </View>

        <View style={s.card}>
          <View style={s.field}>
            <Text style={s.label}>FULL NAME</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={SLATE[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={SLATE[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>PHONE NUMBER</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9841234567"
              placeholderTextColor={SLATE[400]}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={BG.white} />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900] },
  headerSub: { ...TYPOGRAPHY.small, color: SLATE[400], marginTop: 2 },

  card: {
    backgroundColor: BG.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: BG.white },
  avatarName: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  avatarEmail: { fontSize: 13, color: SLATE[400], marginTop: 2 },

  field: { marginBottom: 16, alignSelf: 'stretch' },
  label: { fontSize: 11, fontWeight: '600', color: SLATE[500], textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  input: {
    backgroundColor: SLATE[50],
    borderWidth: 1, borderColor: SLATE[200],
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, color: SLATE[900],
  },

  saveBtn: {
    alignSelf: 'stretch',
    marginTop: 4,
    paddingVertical: 15,
    backgroundColor: ACCENT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },
});
