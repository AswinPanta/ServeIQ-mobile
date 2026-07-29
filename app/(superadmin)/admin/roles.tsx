import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { SectionHeader } from '@/components/superadmin/SectionHeader';
import { EmptyState } from '@/components/superadmin/EmptyState';

const ACCENT = '#7C3AED';

export default function RolesScreen() {
  const { roles, createRole, deleteRole } = useSuperAdmin();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#6366F1');

  const PRESET_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#6366F1', '#8B5CF6'];

  const handleCreate = () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Role name is required');
      return;
    }
    createRole({
      name: newName.trim(),
      description: newDesc.trim() || 'Custom role',
      color: newColor,
      userCount: 0,
      permissions: [
        { id: 'manage_tenants', name: 'Manage Tenants', allowed: false },
        { id: 'view_billing', name: 'View Billing', allowed: false },
        { id: 'manage_platform', name: 'Manage Platform', allowed: false },
        { id: 'manage_roles', name: 'Manage Roles', allowed: false },
        { id: 'view_reports', name: 'View Reports', allowed: false },
        { id: 'system_config', name: 'System Config', allowed: false },
      ],
    });
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleDelete = (roleId: string, roleName: string) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${roleName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRole(roleId) },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Roles & Permissions</Text>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color="#FFF" />
            <Text style={styles.addText}>Role</Text>
          </TouchableOpacity>
        </View>

        {/* Roles List */}
        {roles.length === 0 ? (
          <EmptyState
            icon="shield"
            title="No Roles"
            message="Create your first custom role to get started."
          />
        ) : (
          roles.map(role => {
            const allowedCount = role.permissions.filter(p => p.allowed).length;
            const totalCount = role.permissions.length;

            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => router.push({ pathname: '/(superadmin)/admin/edit-role', params: { roleId: role.id } })}
                style={[styles.card, { borderLeftColor: role.color }]}
                activeOpacity={0.7}
              >
                <View style={styles.cardHead}>
                  <View style={[styles.roleDot, { backgroundColor: role.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleName}>{role.name}</Text>
                    <Text style={styles.roleDesc}>{role.description}</Text>
                  </View>
                  {role.isSystem && <StatusBadge status="System" />}
                </View>

                {/* Permission summary */}
                <View style={styles.permSummary}>
                  <View style={styles.permBar}>
                    <View style={[styles.permBarFill, { width: `${(allowedCount / totalCount) * 100}%`, backgroundColor: role.color }]} />
                  </View>
                  <Text style={styles.permCount}>{allowedCount}/{totalCount} permissions</Text>
                </View>

                {/* Permission chips */}
                <View style={styles.permChips}>
                  {role.permissions.map(p => (
                    <View key={p.id} style={[styles.permChip, { backgroundColor: p.allowed ? '#10B98112' : '#F1F5F9' }]}>
                      <Text style={[styles.permChipText, { color: p.allowed ? '#10B981' : '#94A3B8' }]}>
                        {p.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  <View style={styles.userBadge}>
                    <IconSymbol name="guest" size={12} color={role.color} />
                    <Text style={[styles.userCount, { color: role.color }]}>{role.userCount}</Text>
                  </View>
                  {!role.isSystem && (
                    <TouchableOpacity
                      onPress={() => handleDelete(role.id, role.name)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="delete" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create Role Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Role</Text>

            <Text style={styles.inputLabel}>Role Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Billing Manager"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="What can this role do?"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, newColor === c && styles.colorDotActive]}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.createBtn} activeOpacity={0.7}>
                <Text style={styles.createText}>Create Role</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  addText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  roleDot: { width: 12, height: 12, borderRadius: 6 },
  roleName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  roleDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  permSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  permBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F1F5F9' },
  permBarFill: { height: 6, borderRadius: 3 },
  permCount: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  permChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  permChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  permChipText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userCount: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A', marginBottom: 16 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  createText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
