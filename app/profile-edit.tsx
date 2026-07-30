import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { getPortalStorageKeys } from '@/constants/api-config';
import type { GuestProfile } from '@/types/api';
import { safeGoBack } from '@/lib/utils';

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const { user: authUser, setUser, portal } = useAuth();
  const user = authUser as GuestProfile | null;
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profile_photo || null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nationality, setNationality] = useState(user?.nationality || '');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('profileEdit.permissionTitle'), t('profileEdit.permissionMessage')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setProfilePhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { Alert.alert(t('common.error'), t('profileEdit.nameEmailRequired')); return; }
    if (!user) { Alert.alert(t('common.error'), t('profileEdit.noUser')); return; }
    try {
      const updatedUser: GuestProfile = {
        ...user, name, email, phone, nationality,
        profile_photo: profilePhoto ?? undefined,
      };
      setUser(updatedUser);
      if (portal) {
        const keys = getPortalStorageKeys(portal);
        await AsyncStorage.setItem(keys.USER_PROFILE, JSON.stringify(updatedUser));
      }
      Alert.alert(t('common.ok'), t('profileEdit.saved'), [
        { text: t('common.ok'), onPress: () => safeGoBack() },
      ]);
    } catch { Alert.alert(t('common.error'), t('profileEdit.failedSave')); }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()}>
          <Text style={s.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('profileEdit.title')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={s.saveText}>{t('profileEdit.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Photo */}
        <View style={s.photoSection}>
          <TouchableOpacity onPress={pickImage} style={s.photoWrap}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={s.photo} />
            ) : (
              <View style={s.photoPlaceholder}>
                <Text style={s.photoInitial}>{name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <View style={s.cameraBadge}>
              <IconSymbol name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={s.photoHint}>{t('profileEdit.photoHint')}</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {[
            { label: t('profileEdit.fullName'), val: name, set: setName, placeholder: t('profileEdit.namePlaceholder') },
            { label: t('profileEdit.email'), val: email, set: setEmail, placeholder: t('profileEdit.emailPlaceholder'), keyboard: 'email-address' as const },
            { label: t('profileEdit.phone'), val: phone, set: setPhone, placeholder: t('profileEdit.phonePlaceholder'), keyboard: 'phone-pad' as const },
            { label: t('profileEdit.nationality'), val: nationality, set: setNationality, placeholder: t('profileEdit.nationalityPlaceholder') },
          ].map(f => (
            <View key={f.label} style={s.field}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <TextInput
                value={f.val}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={(f as any).keyboard || 'default'}
                autoCapitalize="none"
                style={s.input}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cancelText: { fontSize: 14, color: '#94A3B8' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#2E86AB' },
  photoSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  photoWrap: { position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(46, 134, 171, 0.15)', alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 28, fontWeight: '700', color: '#2E86AB' },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E86AB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  photoHint: { fontSize: 12, color: '#94A3B8' },
  form: { paddingHorizontal: 16, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#0F172A' },
});
