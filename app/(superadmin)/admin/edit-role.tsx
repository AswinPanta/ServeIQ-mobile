import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { PermissionToggle } from '@/components/superadmin/PermissionToggle';
import { AdminCard } from '@/components/superadmin/AdminCard';
import { PURPLE, SLATE, AMBER, BG, NEUTRAL } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

export default function EditRoleScreen() {
  const { roleId } = useLocalSearchParams<{ roleId: string }>();
  const { roles, updateRole, togglePermission } = useSuperAdmin();
  const role = roles.find(r => r.id === roleId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Derive editable values from role; reset edits when role changes
  const roleName = role?.name ?? '';
  const roleDescription = role?.description ?? '';
  const editName = hasChanges ? name : roleName;
  const editDescription = hasChanges ? description : roleDescription;

  if (!role) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Role not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleNameChange = (val: string) => {
    setName(val);
    setHasChanges(true);
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    setHasChanges(true);
  };

  const handleTogglePerm = (permId: string) => {
    togglePermission(role.id, permId);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Role name is required');
      return;
    }
    updateRole(role.id, { name: editName.trim(), description: editDescription.trim() });
    setHasChanges(false);
    Alert.alert('Saved', `"${editName}" role has been updated.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const allowedCount = role.permissions.filter(p => p.allowed).length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Role</Text>
          {hasChanges && (
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.7}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role Info */}
        <AdminCard title="Role Information">
          <Text style={styles.inputLabel}>Role Name</Text>
          <TextInput
            value={editName}
            onChangeText={handleNameChange}
            style={styles.input}
            placeholder="Role name"
            placeholderTextColor={SLATE[400]}
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            value={editDescription}
            onChangeText={handleDescChange}
            style={styles.input}
            placeholder="Describe this role"
            placeholderTextColor={SLATE[400]}
          />

          {/* Color indicator */}
          <View style={styles.colorSection}>
            <Text style={styles.inputLabel}>Color</Text>
            <View style={[styles.colorPreview, { backgroundColor: role.color }]} />
          </View>

          <View style={styles.permStats}>
            <Text style={styles.permStatsText}>
              {allowedCount} of {role.permissions.length} permissions enabled
            </Text>
          </View>
        </AdminCard>

        {/* Permissions */}
        <AdminCard
          title="Permissions"
          headerRight={
            <TouchableOpacity
              onPress={() => {
                const allAllowed = role.permissions.every(p => p.allowed);
                role.permissions.forEach(p => {
                  if (allAllowed && p.allowed) togglePermission(role.id, p.id);
                  if (!allAllowed && !p.allowed) togglePermission(role.id, p.id);
                });
                setHasChanges(true);
              }}
              style={styles.toggleAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleAllText}>
                {role.permissions.every(p => p.allowed) ? 'Deny All' : 'Allow All'}
              </Text>
            </TouchableOpacity>
          }
        >
          {role.permissions.map(perm => (
            <PermissionToggle
              key={perm.id}
              label={perm.name}
              description={`Grants ${perm.name.toLowerCase()} access`}
              value={perm.allowed}
              onValueChange={() => handleTogglePerm(perm.id)}
              accentColor={role.color}
            />
          ))}
        </AdminCard>

        {/* Warning for system roles */}
        {role.isSystem && (
          <View style={styles.warningCard}>
            <IconSymbol name="warning" size={18} color={AMBER[500]} />
            <Text style={styles.warningText}>
              This is a system role. Editing may affect platform-wide access control.
            </Text>
          </View>
        )}

        {/* Save button (bottom) */}
        {hasChanges && (
          <TouchableOpacity onPress={handleSave} style={styles.bottomSaveBtn} activeOpacity={0.7}>
            <Text style={styles.bottomSaveText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: SLATE[500], marginBottom: 12 },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT + '12' },
  backLinkText: { fontSize: 14, fontWeight: '700', color: ACCENT },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  saveText: { fontSize: 14, fontWeight: '700', color: BG.white },
  inputLabel: { fontSize: 13, fontWeight: '600', color: SLATE[500], marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: SLATE[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: SLATE[900],
    marginBottom: 12,
    backgroundColor: NEUTRAL[50],
  },
  colorSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  colorPreview: { width: 28, height: 28, borderRadius: 14 },
  permStats: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: SLATE[50] },
  permStatsText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  toggleAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: ACCENT + '10' },
  toggleAllText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: AMBER[50],
    borderWidth: 1,
    borderColor: AMBER[200],
  },
  warningText: { flex: 1, fontSize: 13, color: AMBER[800], lineHeight: 18 },
  bottomSaveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSaveText: { fontSize: 16, fontWeight: '700', color: BG.white },
});
