import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/context/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationBell } from '@/components/ui/notification-bell';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import type { SuperAdminProfile } from '@/types/api';

const SUPERADMIN = '#8E44AD';

export function SuperAdminHeader({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const admin = user as SuperAdminProfile | null;
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.replace('/');
  };

  return (
    <View style={s.header}>
      <View style={s.topRow}>
        <View style={s.titleSection}>
          <Text style={s.title}>{title || 'SuperAdmin'}</Text>
          <Text style={s.subtitle}>{admin?.name || 'Platform Admin'}</Text>
        </View>

        <View style={s.actions}>
          <NotificationBell color={SUPERADMIN} />
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={s.avatarBtn}>
            <Text style={s.avatarText}>{admin?.name?.[0] || 'A'}</Text>
          </TouchableOpacity>
        </View>

        {showMenu && (
          <View style={s.dropdown}>
            <TouchableOpacity onPress={() => setShowMenu(false)} style={s.dropdownItem}>
              <IconSymbol name="person.fill" size={14} color={GRAY[600]} />
              <Text style={s.dropdownText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(false); router.push('/(superadmin)/admin/settings'); }} style={s.dropdownItem}>
              <IconSymbol name="settings" size={14} color={GRAY[600]} />
              <Text style={s.dropdownText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(false); logout(); router.replace('/'); }} style={s.dropdownItem}>
              <IconSymbol name="refresh" size={14} color={GRAY[600]} />
              <Text style={s.dropdownText}>Switch portal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[s.dropdownItem, s.dropdownLast]}>
              <IconSymbol name="logout" size={14} color={SRS.red} />
              <Text style={[s.dropdownText, { color: SRS.red }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={s.searchRow}>
        <View style={s.searchInput}>
          <IconSymbol name="search" size={16} color={GRAY[400]} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tenants, tickets..."
            placeholderTextColor={GRAY[400]}
            style={s.searchField}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 12 },
  titleSection: { flex: 1 },
  title: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  subtitle: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: SUPERADMIN + '18', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, color: SUPERADMIN, fontWeight: '700' },
  dropdown: { position: 'absolute', top: 52, right: SPACING.lg, backgroundColor: '#FFF', borderRadius: RADIUS.modal, borderWidth: 1, borderColor: GRAY[200], ...SHADOWS.dropdown, zIndex: 100, minWidth: 160 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  dropdownLast: { borderBottomWidth: 0 },
  dropdownText: { ...TYPOGRAPHY.body, color: GRAY[600] },
  searchRow: { paddingHorizontal: SPACING.lg, paddingBottom: 10 },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: GRAY[100], borderRadius: 10, paddingHorizontal: 10, height: 36, gap: 6 },
  searchField: { flex: 1, fontSize: 13, color: SRS.navy, paddingVertical: 0 },
});
