import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TaxConfig } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

const PRESET_TAXES = [
  { name: 'VAT / GST', rate: 13, type: 'PERCENTAGE' as const, is_inclusive: false },
  { name: 'Service Charge', rate: 10, type: 'PERCENTAGE' as const, is_inclusive: false },
  { name: 'Tourist Tax', rate: 200, type: 'FLAT' as const, is_inclusive: true },
  { name: 'City Tax', rate: 2, type: 'PERCENTAGE' as const, is_inclusive: false },
];

export function TaxesSection() {
  const { taxConfigs, addTaxConfig, updateTaxConfig, removeTaxConfig, properties, activePropertyId, updateProperty } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  const propertyTaxes = taxConfigs.filter(tx => tx.property_id === activePropertyId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [newInclusive, setNewInclusive] = useState(false);
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => {
    setEditingTax(null);
    setNewName('');
    setNewRate('');
    setNewType('PERCENTAGE');
    setNewInclusive(false);
    setShowAddModal(true);
  }, []);

  const openEdit = useCallback((tax: TaxConfig) => {
    setEditingTax(tax);
    setNewName(tax.name);
    setNewRate(String(tax.rate));
    setNewType(tax.type);
    setNewInclusive(tax.is_inclusive);
    setShowAddModal(true);
  }, []);

  const handleSaveTax = useCallback(() => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Tax name is required');
      return;
    }
    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      Alert.alert('Invalid Rate', 'Rate must be a positive number');
      return;
    }

    if (editingTax) {
      updateTaxConfig(editingTax.id, {
        name: newName.trim(),
        rate: parsedRate,
        type: newType,
        is_inclusive: newInclusive,
      });
    } else {
      addTaxConfig({
        id: `tx-${Date.now()}`,
        property_id: activePropertyId || '',
        name: newName.trim(),
        type: newType,
        rate: parsedRate,
        is_inclusive: newInclusive,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    setShowAddModal(false);
  }, [editingTax, newName, newRate, newType, newInclusive, activePropertyId, addTaxConfig, updateTaxConfig]);

  const handleDeleteTax = useCallback((tax: TaxConfig) => {
    Alert.alert(
      'Delete Tax',
      `Remove "${tax.name}" from this property?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeTaxConfig(tax.id) },
      ]
    );
  }, [removeTaxConfig]);

  const handleToggleActive = useCallback((tax: TaxConfig) => {
    updateTaxConfig(tax.id, { is_active: !tax.is_active });
  }, [updateTaxConfig]);

  if (!property) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', marginTop: 40 }}>
          Select a property first
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Taxes & Policies</SettingSectionTitle>

      {/* Tax Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tax Configuration</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={ACCENT} />
            <Text style={styles.addBtnText}>Add Tax</Text>
          </TouchableOpacity>
        </View>

        {propertyTaxes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={32} color={GRAY[300]} />
            <Text style={styles.emptyText}>No taxes configured</Text>
            <Text style={styles.emptyHint}>Add a tax or use a preset below</Text>
          </View>
        ) : (
          propertyTaxes.map(tax => (
            <TouchableOpacity
              key={tax.id}
              style={[styles.taxRow, !tax.is_active && styles.taxRowInactive]}
              onPress={() => openEdit(tax)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.taxName, !tax.is_active && styles.textInactive]}>{tax.name}</Text>
                <Text style={[styles.taxRate, !tax.is_active && styles.textInactive]}>
                  {tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${property.currency || 'NPR'} ${tax.rate}`}
                  {tax.is_inclusive ? ' (included)' : ' (added)'}
                </Text>
              </View>
              <Switch
                value={tax.is_active}
                onValueChange={() => handleToggleActive(tax)}
                trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                thumbColor={tax.is_active ? ACCENT : GRAY[300]}
              />
              <TouchableOpacity onPress={() => handleDeleteTax(tax)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={SRS.red || '#EF4444'} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Preset Taxes */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Quick Add Presets</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}>
          {PRESET_TAXES.map(preset => {
            const alreadyAdded = propertyTaxes.some(t => t.name === preset.name);
            return (
              <TouchableOpacity
                key={preset.name}
                style={[styles.presetChip, alreadyAdded && styles.presetChipDisabled]}
                onPress={() => {
                  if (alreadyAdded) return;
                  addTaxConfig({
                    id: `tx-${Date.now()}`,
                    property_id: activePropertyId || '',
                    name: preset.name,
                    type: preset.type,
                    rate: preset.rate,
                    is_inclusive: preset.is_inclusive,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }}
                disabled={alreadyAdded}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, alreadyAdded && styles.textInactive]}>
                  {alreadyAdded ? '✓ ' : '+ '}{preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Hotel Policies (read-only, informational) */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Hotel Policies</Text>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Check-in Time</Text>
          <Text style={styles.policyValue}>From {property.check_in_time_from || '14:00'}</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Check-out Time</Text>
          <Text style={styles.policyValue}>Until {property.check_out_time_to || '11:00'}</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Cancellation</Text>
          <Text style={styles.policyValue}>{property.cancellation_policy || 'MODERATE'}</Text>
        </View>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTax ? 'Edit Tax' : 'Add Tax'}</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. VAT, Service Charge"
                placeholderTextColor={GRAY[300]}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Type</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['PERCENTAGE', 'FLAT'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, newType === t && styles.typeBtnActive]}
                    onPress={() => setNewType(t)}
                  >
                    <Text style={[styles.typeBtnText, newType === t && styles.typeBtnTextActive]}>
                      {t === 'PERCENTAGE' ? '% Percentage' : '₹ Flat Amount'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Rate {newType === 'PERCENTAGE' ? '(%)' : `(in ${property.currency || 'NPR'})`}</Text>
              <TextInput
                style={styles.modalInput}
                value={newRate}
                onChangeText={setNewRate}
                placeholder="e.g. 13"
                placeholderTextColor={GRAY[300]}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalField}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Included in price?</Text>
                  <Text style={{ ...TYPOGRAPHY.small, color: GRAY[400] }}>
                    {newInclusive ? 'Tax is already included in the room rate' : 'Tax will be added on top of the room rate'}
                  </Text>
                </View>
                <Switch
                  value={newInclusive}
                  onValueChange={setNewInclusive}
                  trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                  thumbColor={newInclusive ? ACCENT : GRAY[300]}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveTax}>
                <Text style={styles.modalSaveText}>{editingTax ? 'Update' : 'Add Tax'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden', ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], padding: 14, paddingBottom: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: ACCENT + '15' },
  addBtnText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  emptyHint: { ...TYPOGRAPHY.small, color: GRAY[400] },
  taxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: GRAY[100] },
  taxRowInactive: { opacity: 0.6 },
  taxName: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  taxRate: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  textInactive: { color: GRAY[400] },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: ACCENT + '12', borderWidth: 1, borderColor: ACCENT + '30' },
  presetChipDisabled: { backgroundColor: GRAY[100], borderColor: GRAY[200] },
  presetText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: GRAY[100] },
  policyLabel: { ...TYPOGRAPHY.small, color: GRAY[500] },
  policyValue: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[900] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: BG.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { ...TYPOGRAPHY.h3, color: GRAY[900], marginBottom: 20 },
  modalField: { marginBottom: 16 },
  modalLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500], marginBottom: 6 },
  modalInput: { backgroundColor: GRAY[50], borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200], paddingHorizontal: 14, paddingVertical: 12, ...TYPOGRAPHY.body, color: GRAY[900] },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.button, borderWidth: 1, borderColor: GRAY[200], alignItems: 'center' },
  typeBtnActive: { backgroundColor: ACCENT + '15', borderColor: ACCENT },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: GRAY[500] },
  typeBtnTextActive: { color: ACCENT },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.button, borderWidth: 1, borderColor: GRAY[200], alignItems: 'center' },
  modalCancelText: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[500] },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.button, backgroundColor: ACCENT, alignItems: 'center' },
  modalSaveText: { ...TYPOGRAPHY.body, fontWeight: '700', color: BG.white },
});
