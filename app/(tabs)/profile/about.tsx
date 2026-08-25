import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { PHONE_CODES } from '@/lib/mock/phone-codes';
import { COUNTRIES } from '@/lib/mock/countries';
import { FONTS } from '@/constants/portal-theme';
import type { GuestProfile } from '@/types/api';
import { CORAL as CORALTokens, BRAND, BLUE, BG, SLATE, NEUTRAL } from '@/lib/constants/figma-tokens';

const CORAL = CORALTokens[500];
const NAVY = BRAND.navyLight;

export default function AboutScreen() {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const user = authUser as GuestProfile | null;

  const initials = (user?.name || 'U').slice(0, 2).toUpperCase();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedDial, setSelectedDial] = useState('+977');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [bio, setBio] = useState('');
  const [showPhonePicker, setShowPhonePicker] = useState(false);
  const [showNationalityPicker, setShowNationalityPicker] = useState(false);

  const phoneNumber = phone.replace(selectedDial, '');

  const handleSave = () => {
    Alert.alert(t('profile.about.saved'), t('profile.about.savedMessage'));
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.about.title')}</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile/bookings')} style={s.actionBtn}>
            <IconSymbol name="calendar" size={18} color={BLUE[600]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={s.settingsBtn}>
            <IconSymbol name="settings" size={18} color={NAVY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={s.editOverlay}>
              <IconSymbol name="edit" size={14} color={BG.white} />
            </TouchableOpacity>
          </View>
          <Text style={s.profileName}>{user?.name || t('profile.userLabel')}</Text>
        </View>

        <View style={s.formSection}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.about.fullName')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('profile.about.namePlaceholder')}
              placeholderTextColor={SLATE[400]}
              style={s.input}
            />
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.about.email')}</Text>
            <View style={[s.input, s.readOnlyInput]}>
              <Text style={s.readOnlyText}>{email}</Text>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.about.phone')}</Text>
            <View style={s.phoneRow}>
              <TouchableOpacity style={s.dialPicker} onPress={() => setShowPhonePicker(true)}>
                <Text style={s.dialText}>{selectedDial}</Text>
                <IconSymbol name="chevron.down" size={12} color={SLATE[500]} />
              </TouchableOpacity>
              <TextInput
                value={phoneNumber}
                onChangeText={(v) => setPhone(selectedDial + v)}
                placeholder={t('profile.about.phonePlaceholder')}
                placeholderTextColor={SLATE[400]}
                keyboardType="phone-pad"
                style={[s.input, s.phoneInput]}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.about.dob')}</Text>
            <TextInput
              value={dob}
              onChangeText={setDob}
              placeholder={t('profile.about.dobPlaceholder')}
              placeholderTextColor={SLATE[400]}
              style={s.input}
            />
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>{t('profile.about.nationality')}</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setShowNationalityPicker(true)}>
              <Text style={[s.pickerText, !nationality && s.pickerPlaceholder]}>
                {nationality || t('profile.about.nationalityPlaceholder')}
              </Text>
              <IconSymbol name="chevron.down" size={14} color={SLATE[400]} />
            </TouchableOpacity>
          </View>

          <View style={s.field}>
            <View style={s.bioHeader}>
              <Text style={s.fieldLabel}>{t('profile.about.bio')}</Text>
              <Text style={s.charCount}>{bio.length}/500</Text>
            </View>
            <TextInput
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, 500))}
              placeholder={t('profile.about.bioPlaceholder')}
              placeholderTextColor={SLATE[400]}
              multiline
              numberOfLines={4}
              style={[s.input, s.bioInput]}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={s.saveBtnText}>{t('profile.about.save')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showPhonePicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('profile.about.selectCountryCode')}</Text>
              <TouchableOpacity onPress={() => setShowPhonePicker(false)}>
                <IconSymbol name="close" size={20} color={NAVY} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PHONE_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.pickerItem}
                  onPress={() => { setSelectedDial(item.dial); setShowPhonePicker(false); }}
                >
                  <Text style={s.flag}>{item.flag}</Text>
                  <Text style={s.countryName}>{item.name}</Text>
                  <Text style={s.dialCode}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showNationalityPicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('profile.about.selectNationality')}</Text>
              <TouchableOpacity onPress={() => setShowNationalityPicker(false)}>
                <IconSymbol name="close" size={20} color={NAVY} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, nationality === item.name && s.pickerItemActive]}
                  onPress={() => { setNationality(item.name); setShowNationalityPicker(false); }}
                >
                  <Text style={s.flag}>{item.flag}</Text>
                  <Text style={s.countryName}>{item.name}</Text>
                  {nationality === item.name && <IconSymbol name="checkmark" size={16} color={CORAL} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SLATE[100] },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BLUE[100] },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BLUE[100] },
  title: { fontSize: 20, fontWeight: '700', color: NAVY, letterSpacing: -0.5, fontFamily: FONTS.sora },
  profileCard: { alignItems: 'center', marginHorizontal: 16, padding: 24, borderRadius: 16, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], marginBottom: 12, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: CORAL + '15', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: CORAL, fontFamily: FONTS.inter.bold },
  editOverlay: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG.white },
  profileName: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  formSection: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: NAVY, fontFamily: FONTS.inter.semiBold },
  input: { backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: SLATE[900], fontFamily: FONTS.inter.regular },
  readOnlyInput: { backgroundColor: SLATE[50], justifyContent: 'center' },
  readOnlyText: { fontSize: 14, color: SLATE[400], fontFamily: FONTS.inter.regular },
  phoneRow: { flexDirection: 'row', gap: 8 },
  dialPicker: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: SLATE[200], borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: BG.white },
  dialText: { fontSize: 14, color: SLATE[900], fontFamily: FONTS.inter.medium },
  phoneInput: { flex: 1 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: SLATE[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: BG.white },
  pickerText: { fontSize: 14, color: SLATE[900], fontFamily: FONTS.inter.regular, flex: 1 },
  pickerPlaceholder: { color: SLATE[400] },
  bioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  charCount: { fontSize: 11, color: SLATE[400], fontFamily: FONTS.inter.regular },
  bioInput: { minHeight: 100, paddingTop: 13 },
  saveBtn: { marginHorizontal: 16, marginTop: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: BG.white, fontFamily: FONTS.inter.semiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: BG.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  modalTitle: { fontSize: 16, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: SLATE[50] },
  pickerItemActive: { backgroundColor: CORAL + '06' },
  flag: { fontSize: 20 },
  countryName: { fontSize: 14, color: NAVY, flex: 1, fontFamily: FONTS.inter.regular },
  dialCode: { fontSize: 14, color: SLATE[500], fontFamily: FONTS.inter.regular },
});
