import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { safeGoBack } from '@/lib/utils';import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { PURPLE, GRAY, BLUE, AMBER, STATUS, BG, RED, SLATE, TEXT } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

type PlanStatus = 'Active' | 'Inactive' | 'Coming Soon';
type BillingCycle = 'monthly' | 'yearly';

const PLAN_COLORS: Record<string, string> = {
  Free: GRAY[500], Basic: BLUE[500], Pro: ACCENT, Enterprise: AMBER[500], Starter: STATUS.activeGreen,
};

const emptyPlan = { id: '', name: '', price: 0, billing_cycle: 'monthly' as BillingCycle, features: [] as string[], is_active: true };

export default function PlansScreen() {
  const { plans: ctxPlans, createPlan, updatePlan, deletePlan } = useSuperAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(emptyPlan);
  const [isEdit, setIsEdit] = useState(false);
  const [featuresText, setFeaturesText] = useState('');

  const openAdd = () => {
    setEditing({ ...emptyPlan, id: String(Date.now()) });
    setFeaturesText(''); setIsEdit(false); setShowModal(true);
  };

  const openEdit = (plan: typeof ctxPlans[0]) => {
    setEditing({ ...plan, billing_cycle: 'monthly' });
    setFeaturesText(plan.features.join('\n')); setIsEdit(true); setShowModal(true);
  };

  const save = async () => {
    const featureList = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const updated = { ...editing, features: featureList, is_active: editing.is_active ?? true };
    if (isEdit) {
      await updatePlan(editing.id, { name: updated.name, price: updated.price, features: updated.features, is_active: updated.is_active });
    } else {
      await createPlan({ name: updated.name, price: updated.price, features: updated.features, is_active: updated.is_active });
    }
    setShowModal(false);
    Alert.alert('Saved', `Plan "${updated.name}" ${isEdit ? 'updated' : 'created'}.`);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Plan', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePlan(id) },
    ]);
  };

  const toggleStatus = async (plan: typeof ctxPlans[0]) => {
    await updatePlan(plan.id, { is_active: !plan.is_active });
  };

  const plans = ctxPlans.map(p => ({
    ...p,
    status: (p.is_active ? 'Active' : 'Inactive') as PlanStatus,
    billing_cycle: 'monthly' as BillingCycle,
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Plans</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color={BG.white} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        {plans.map(plan => {
          const color = PLAN_COLORS[plan.name] || ACCENT;
          return (
            <View key={plan.id} style={[styles.card, { borderLeftColor: color }]}>
              <View style={styles.cardHead}>
                <View style={styles.planNameRow}>
                  <View style={[styles.planDot, { backgroundColor: color }]} />
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                <StatusBadge status={plan.status} />
              </View>

              <Text style={styles.price}>
                {plan.price === 0 ? 'Free' : `NPR ${(plan.price / 1000).toFixed(0)}K/${plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}`}
              </Text>

              <View style={styles.divider} />

              {plan.features.slice(0, 4).map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.checkCircle, { backgroundColor: color + '15' }]}>
                    <IconSymbol name="check" size={10} color={color} />
                  </View>
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
              {plan.features.length > 4 && (
                <Text style={styles.moreText}>+{plan.features.length - 4} more</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(plan)} style={styles.editBtn} activeOpacity={0.7}>
                  <IconSymbol name="settings" size={14} color={ACCENT} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleStatus(plan)} style={styles.toggleBtn} activeOpacity={0.7}>
                  <Text style={styles.toggleText}>{plan.is_active ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(plan.id, plan.name)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <IconSymbol name="delete" size={14} color={RED[500]} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{isEdit ? 'Edit Plan' : 'Add Plan'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <IconSymbol name="close" size={16} color={SLATE[400]} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Plan Name</Text>
                <TextInput value={editing.name} onChangeText={t => setEditing(p => ({ ...p, name: t }))} placeholder="e.g. Premium" placeholderTextColor={SLATE[400]} style={styles.input} />
              </View>
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Price (NPR)</Text>
                  <TextInput value={String(editing.price)} onChangeText={t => setEditing(p => ({ ...p, price: Number(t) || 0 }))} placeholder="0" placeholderTextColor={SLATE[400]} keyboardType="number-pad" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Billing</Text>
                  <View style={styles.toggleRow}>
                    {(['monthly', 'yearly'] as BillingCycle[]).map(bc => (
                      <TouchableOpacity key={bc} onPress={() => setEditing(p => ({ ...p, billing_cycle: bc }))}
                        style={[styles.toggleOpt, editing.billing_cycle === bc && styles.toggleOptActive]}>
                        <Text style={[styles.toggleOptText, editing.billing_cycle === bc && styles.toggleOptTextActive]}>{bc.charAt(0).toUpperCase() + bc.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.toggleRow}>
                  {(['Active', 'Inactive', 'Coming Soon'] as PlanStatus[]).map(st => (
                    <TouchableOpacity key={st} onPress={() => setEditing(p => ({ ...p, status: st }))}
                      style={[styles.toggleOpt, editing.status === st && styles.toggleOptActive]}>
                      <Text style={[styles.toggleOptText, editing.status === st && styles.toggleOptTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Features (one per line)</Text>
                <TextInput value={featuresText} onChangeText={setFeaturesText} placeholder="Up to 10 properties&#10;24/7 support" placeholderTextColor={SLATE[400]} multiline numberOfLines={4} textAlignVertical="top" style={[styles.input, { minHeight: 100 }]} />
              </View>
              <TouchableOpacity onPress={save} style={styles.saveBtn} activeOpacity={0.8}>
                <Text style={styles.saveText}>{isEdit ? 'Update Plan' : 'Create Plan'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  addText: { fontSize: 14, fontWeight: '700', color: BG.white },
  card: { padding: 18, borderRadius: 16, backgroundColor: BG.white, borderLeftWidth: 4, borderWidth: 1, borderColor: SLATE[100], shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  price: { fontSize: 22, fontWeight: '800', color: SLATE[900], marginBottom: 12 },
  divider: { height: 1, backgroundColor: SLATE[100], marginBottom: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  checkCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: SLATE[600] },
  moreText: { fontSize: 12, color: SLATE[400], marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: SLATE[100] },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT + '10' },
  editText: { fontSize: 13, fontWeight: '700', color: ACCENT },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: SLATE[100] },
  toggleText: { fontSize: 13, fontWeight: '700', color: SLATE[500] },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: RED[50], alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: BG.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: SLATE[500], marginBottom: 6 },
  input: { fontSize: 14, color: SLATE[900], paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] },
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleOpt: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: SLATE[100] },
  toggleOptActive: { backgroundColor: ACCENT },
  toggleOptText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  toggleOptTextActive: { color: BG.white },
  saveBtn: { paddingVertical: 16, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveText: { fontSize: 16, fontWeight: '700', color: BG.white },
});
