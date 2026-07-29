import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import { StaffCreatedEmailModal } from '@/components/operations/StaffCreatedEmailModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/portal-theme';
import type { StaffRole, StaffMember } from '@/types/api';
import { safeGoBack } from "@/lib/utils";

const ACCENT = '#0D9488';

const ROLE_COLORS: Record<StaffRole, string> = {
  manager: '#8B5CF6',
  front_desk: '#3B82F6',
  housekeeping: '#10B981',
  waiter: '#F59E0B',
  kitchen: '#F97316',
  maintenance: '#EF4444',
};

const ROLE_LABELS: Record<StaffRole, string> = {
  manager: 'Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  maintenance: 'Maintenance',
};

const DEPARTMENTS = ['Front Office', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Management', 'Security'];

function generateTempPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function StaffManagementScreen() {
  const colors = useColors();
  const { staff, activePropertyId, addStaff, updateStaff } = useHost();

  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('front_desk');
  const [department, setDepartment] = useState('Front Office');
  const [position, setPosition] = useState('');
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const [emailModalStaff, setEmailModalStaff] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    role: StaffRole;
    department: string;
    position: string;
    temporaryPassword: string;
  } | null>(null);

  const filteredStaff = staff.filter(s => s.property_id === activePropertyId);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('front_desk');
    setDepartment('Front Office');
    setPosition('');
  };

  const handleCreateStaff = () => {
    if (!firstName.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'First name and email are required.');
      return;
    }

    const tempPassword = generateTempPassword();
    const now = new Date().toISOString();

    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      tenant_id: 'demo-host-1',
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || '',
      role,
      property_id: activePropertyId || 'prop-1',
      is_active: true,
      pos_discount_limit: role === 'manager' ? 20 : role === 'front_desk' ? 10 : 0,
      created_at: now,
      updated_at: now,
    };

    addStaff(newStaff);

    setEmailModalStaff({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      role,
      department,
      position: position.trim() || ROLE_LABELS[role],
      temporaryPassword: tempPassword,
    });

    resetForm();
    setShowForm(false);
  };

  const handleToggleActive = (id: string, current: boolean) => {
    updateStaff(id, { is_active: !current });
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[TYPOGRAPHY.h2, { color: SRS.navy }]}>Staff Management</Text>
          <Text style={[TYPOGRAPHY.small, { color: '#6B7280', marginTop: 2 }]}>
            {filteredStaff.length} staff members
          </Text>
        </View>
      </View>

      {/* Add Staff Button */}
      {!showForm && (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={[styles.addBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '08' }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="person.add" size={20} color={ACCENT} />
          <Text style={[styles.addBtnText, { color: ACCENT }]}>Add New Staff Member</Text>
        </TouchableOpacity>
      )}

      {/* Staff Creation Form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.card]}>
          <Text style={[TYPOGRAPHY.subtitle, { color: SRS.navy, marginBottom: SPACING.lg, fontWeight: '700' }]}>
            New Staff Member
          </Text>

          <View style={{ gap: SPACING.md }}>
            {/* Name Row */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="staff@stayeasy.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {/* Phone */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+977-9841234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {/* Role */}
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: role === r ? ROLE_COLORS[r] : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: role === r ? '#FFF' : colors.foreground }}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Department */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Department</Text>
              <TouchableOpacity
                onPress={() => setShowDeptPicker(!showDeptPicker)}
                style={[styles.input, { borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              >
                <Text style={{ fontSize: 13, color: colors.foreground }}>{department}</Text>
                <IconSymbol name="chevron.down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {showDeptPicker && (
                <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {DEPARTMENTS.map(dept => (
                    <TouchableOpacity
                      key={dept}
                      onPress={() => { setDepartment(dept); setShowDeptPicker(false); }}
                      style={[
                        styles.dropdownItem,
                        { backgroundColor: department === dept ? ACCENT + '10' : 'transparent' },
                      ]}
                    >
                      <Text style={{ fontSize: 13, color: department === dept ? ACCENT : colors.foreground, fontWeight: department === dept ? '600' : '400' }}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Position */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Position</Text>
              <TextInput
                value={position}
                onChangeText={setPosition}
                placeholder={ROLE_LABELS[role]}
                placeholderTextColor="#9CA3AF"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>

          {/* Form Actions */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl }}>
            <TouchableOpacity
              onPress={() => { setShowForm(false); resetForm(); }}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateStaff}
              style={[styles.createBtn, { backgroundColor: ACCENT }]}
            >
              <IconSymbol name="check" size={16} color="#FFF" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>Create & Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Staff List */}
      <View style={{ marginTop: showForm ? SPACING.lg : 0 }}>
        {filteredStaff.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.fill" size={48} color="#D1D5DB" />
            <Text style={[TYPOGRAPHY.body, { color: '#9CA3AF', marginTop: SPACING.md }]}>
              No staff members yet
            </Text>
            <Text style={[TYPOGRAPHY.small, { color: '#D1D5DB', marginTop: 4 }]}>
              Add your first staff member to get started
            </Text>
          </View>
        ) : (
          filteredStaff.map(s => (
            <View
              key={s.id}
              style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.card]}
            >
              <View style={styles.staffRow}>
                <View style={[styles.staffAvatar, { backgroundColor: ROLE_COLORS[s.role] + '18' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: ROLE_COLORS[s.role] }}>
                    {s.first_name[0]}{s.last_name?.[0] || ''}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[TYPOGRAPHY.body, { fontWeight: '700', color: SRS.navy }]}>
                      {s.first_name} {s.last_name}
                    </Text>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: s.is_active ? '#10B981' : '#EF4444',
                    }} />
                  </View>
                  <Text style={[TYPOGRAPHY.small, { color: '#6B7280', marginTop: 2 }]}>
                    {s.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[s.role] + '18' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: ROLE_COLORS[s.role] }}>
                        {ROLE_LABELS[s.role]}
                      </Text>
                    </View>
                    <Text style={[TYPOGRAPHY.caption, { color: '#9CA3AF' }]}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleActive(s.id, s.is_active)}
                  style={[styles.toggleBtn, { backgroundColor: s.is_active ? '#FEE2E2' : '#D1FAE5' }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: s.is_active ? '#EF4444' : '#10B981' }}>
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Email Preview Modal */}
      {emailModalStaff && (
        <StaffCreatedEmailModal
          visible={!!emailModalStaff}
          onClose={() => setEmailModalStaff(null)}
          staff={emailModalStaff}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.card,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  input: {
    padding: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    fontSize: 13,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    marginRight: 8,
  },
  dropdown: {
    borderRadius: RADIUS.button,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  createBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.huge,
  },
  staffCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
  },
});
