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
import { TEAL, PURPLE, BLUE, STATUS, AMBER, ORANGE, RED, GRAY, BG, EMERALD, SLATE } from '@/lib/constants/figma-tokens';
import { setStaffMustChange } from '@/lib/context/host-utils';
import { validateEmail, validatePhone, validateRequired, validateNumber, validateDate, parseBackendError } from '@/lib/utils/validation';

const ACCENT = TEAL[600];

const ROLE_COLORS: Record<StaffRole, string> = {
  manager: PURPLE[500],
  front_desk: BLUE[500],
  housekeeping: STATUS.activeGreen,
  waiter: AMBER[500],
  kitchen: ORANGE[500],
  maintenance: RED[500],
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

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  salary?: string;
  joiningDate?: string;
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
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [emailModalStaff, setEmailModalStaff] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    role: StaffRole;
    department: string;
    position: string;
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
    setSalary('');
    setJoiningDate(new Date().toISOString().slice(0, 10));
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};

    const fnErr = validateRequired(firstName, 'First name');
    if (fnErr) errs.firstName = fnErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;

    const salaryErr = validateNumber(salary, { min: 0, max: 10_000_000, label: 'Salary', required: true });
    if (salaryErr) errs.salary = salaryErr;

    const dateErr = validateDate(joiningDate, { label: 'Joining date', required: true, notPast: false });
    if (dateErr) errs.joiningDate = dateErr;

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateStaff = async () => {
    if (!validate()) return;

    const fullName = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    const now = new Date().toISOString();

    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      tenant_id: 'demo-host-1',
      email: email.trim().toLowerCase(),
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

    const created = await addStaff(newStaff);
    if (!created) {
      Alert.alert('Error', 'Failed to create staff member. Check your connection and try again.');
      return;
    }

    // The backend emails the staff member a temporary password. Track them as
    // needing a forced password change on their first sign-in.
    setStaffMustChange(newStaff.email);

    setEmailModalStaff({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      role,
      department,
      position: position.trim() || ROLE_LABELS[role],
    });

    resetForm();
    setShowForm(false);
  };

  const handleToggleActive = (id: string, current: boolean) => {
    updateStaff(id, { is_active: !current });
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
          <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginTop: 2 }]}>
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
                  onChangeText={(t) => { setFirstName(t); clearFieldError('firstName'); }}
                  placeholder="John"
                  placeholderTextColor={GRAY[400]}
                  style={[styles.input, fieldErrors.firstName && styles.inputError, { borderColor: colors.border, color: colors.foreground }]}
                />
                {fieldErrors.firstName ? <Text style={styles.fieldError}>{fieldErrors.firstName}</Text> : null}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor={GRAY[400]}
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            </View>

            {/* Email */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
                placeholder="staff@serveiq.com"
                placeholderTextColor={GRAY[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, fieldErrors.email && styles.inputError, { borderColor: colors.border, color: colors.foreground }]}
              />
              {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
            </View>

            {/* Phone */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => { setPhone(t); clearFieldError('phone'); }}
                placeholder="+977-9841234567"
                placeholderTextColor={GRAY[400]}
                keyboardType="phone-pad"
                style={[styles.input, fieldErrors.phone && styles.inputError, { borderColor: colors.border, color: colors.foreground }]}
              />
              {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
            </View>

            {/* Role */}
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Role *</Text>
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
                    <Text style={{ fontSize: 12, fontWeight: '600', color: role === r ? BG.white : colors.foreground }}>
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
                <IconSymbol name="chevron.down" size={16} color={GRAY[400]} />
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
                placeholderTextColor={GRAY[400]}
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {/* Monthly Salary (required by backend) */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Monthly Salary (NPR) *</Text>
              <TextInput
                value={salary}
                onChangeText={(t) => { setSalary(t); clearFieldError('salary'); }}
                placeholder="e.g. 25000"
                placeholderTextColor={GRAY[400]}
                keyboardType="numeric"
                style={[styles.input, fieldErrors.salary && styles.inputError, { borderColor: colors.border, color: colors.foreground }]}
              />
              {fieldErrors.salary ? <Text style={styles.fieldError}>{fieldErrors.salary}</Text> : null}
            </View>

            {/* Joining Date (required by backend) */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Joining Date *</Text>
              <TextInput
                value={joiningDate}
                onChangeText={(t) => { setJoiningDate(t); clearFieldError('joiningDate'); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={GRAY[400]}
                style={[styles.input, fieldErrors.joiningDate && styles.inputError, { borderColor: colors.border, color: colors.foreground }]}
              />
              {fieldErrors.joiningDate ? <Text style={styles.fieldError}>{fieldErrors.joiningDate}</Text> : null}
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
              <IconSymbol name="check" size={16} color={BG.white} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: BG.white }}>Create & Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Staff List */}
      <View style={{ marginTop: showForm ? SPACING.lg : 0 }}>
        {filteredStaff.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.fill" size={48} color={GRAY[300]} />
            <Text style={[TYPOGRAPHY.body, { color: GRAY[400], marginTop: SPACING.md }]}>
              No staff members yet
            </Text>
            <Text style={[TYPOGRAPHY.small, { color: GRAY[300], marginTop: 4 }]}>
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
                      backgroundColor: s.is_active ? STATUS.activeGreen : RED[500],
                    }} />
                  </View>
                  <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginTop: 2 }]}>
                    {s.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[s.role] + '18' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: ROLE_COLORS[s.role] }}>
                        {ROLE_LABELS[s.role]}
                      </Text>
                    </View>
                    <Text style={[TYPOGRAPHY.caption, { color: GRAY[400] }]}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleActive(s.id, s.is_active)}
                  style={[styles.toggleBtn, { backgroundColor: s.is_active ? RED[100] : EMERALD[100] }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: s.is_active ? RED[500] : STATUS.activeGreen }}>
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
    backgroundColor: SLATE[100],
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
    color: GRAY[500],
  },
  input: {
    padding: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    fontSize: 13,
  },
  inputError: {
    borderColor: RED[500],
  },
  fieldError: {
    fontSize: 11,
    color: RED[500],
    marginTop: 2,
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
    borderBottomColor: SLATE[100],
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
