import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const ROLES = [
  { name: 'SuperAdmin', users: 1, permissions: [
    { name: 'Manage Tenants', allowed: true }, { name: 'View Billing', allowed: true },
    { name: 'Manage Platform', allowed: true }, { name: 'Manage Roles', allowed: true },
    { name: 'View Reports', allowed: true }, { name: 'System Config', allowed: true },
  ], color: SUPERADMIN, description: 'Full platform access with all permissions' },
  { name: 'Admin', users: 3, permissions: [
    { name: 'Manage Tenants', allowed: true }, { name: 'View Billing', allowed: true },
    { name: 'Manage Platform', allowed: false }, { name: 'Manage Roles', allowed: false },
    { name: 'View Reports', allowed: true }, { name: 'System Config', allowed: false },
  ], color: '#3B82F6', description: 'Operational access with limited platform management' },
  { name: 'Manager', users: 5, permissions: [
    { name: 'Manage Tenants', allowed: true }, { name: 'View Billing', allowed: true },
    { name: 'Manage Platform', allowed: false }, { name: 'Manage Roles', allowed: false },
    { name: 'View Reports', allowed: true }, { name: 'System Config', allowed: false },
  ], color: '#10B981', description: 'Tenant management and billing view access' },
  { name: 'Support', users: 4, permissions: [
    { name: 'Manage Tenants', allowed: false }, { name: 'View Billing', allowed: false },
    { name: 'Manage Platform', allowed: false }, { name: 'Manage Roles', allowed: false },
    { name: 'View Reports', allowed: false }, { name: 'System Config', allowed: false },
  ], color: '#F59E0B', description: 'Support ticket access only' },
  { name: 'Read-Only', users: 2, permissions: [
    { name: 'Manage Tenants', allowed: false }, { name: 'View Billing', allowed: true },
    { name: 'Manage Platform', allowed: false }, { name: 'Manage Roles', allowed: false },
    { name: 'View Reports', allowed: true }, { name: 'System Config', allowed: false },
  ], color: '#EC4899', description: 'View-only access to reports and billing' },
];

export default function RolesScreen() {
  const handleCreateRole = () => Alert.alert('Create Role', 'Role creation form would open here.');

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Roles & Permissions</Text>
          <TouchableOpacity onPress={handleCreateRole} style={s.addBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color="#FFF" />
            <Text style={s.addBtnText}>Role</Text>
          </TouchableOpacity>
        </View>

        {ROLES.map(role => (
          <View key={role.name} style={[s.roleCard, { borderLeftColor: role.color }]}>
            <View style={s.roleHead}>
              <Text style={s.roleName}>{role.name}</Text>
              <View style={[s.userBadge, { backgroundColor: role.color + '15' }]}>
                <Text style={[s.userText, { color: role.color }]}>{role.users} user{role.users > 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Text style={s.roleDesc}>{role.description}</Text>
            <View style={s.divider} />
            {role.permissions.map(perm => (
              <View key={perm.name} style={s.permRow}>
                <Text style={s.permName}>{perm.name}</Text>
                <View style={[s.permBadge, { backgroundColor: perm.allowed ? '#10B98115' : '#EF444415' }]}>
                  <Text style={[s.permText, { color: perm.allowed ? '#10B981' : '#EF4444' }]}>{perm.allowed ? 'Allowed' : 'Denied'}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[s.editBtn, { backgroundColor: role.color + '10', borderColor: role.color + '20' }]} activeOpacity={0.7}>
              <Text style={[s.editBtnText, { color: role.color }]}>Edit Permissions</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: 14, borderRadius: 12, backgroundColor: SUPERADMIN },
  addBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#FFF' },
  roleCard: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  roleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  roleName: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  userBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  userText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  roleDesc: { ...TYPOGRAPHY.small, color: GRAY[500], marginBottom: SPACING.lg },
  divider: { height: 1, backgroundColor: GRAY[100], marginBottom: 12 },
  permRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  permName: { ...TYPOGRAPHY.body, color: SRS.navy },
  permBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  permText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  editBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  editBtnText: { ...TYPOGRAPHY.body, fontWeight: '700' },
});
