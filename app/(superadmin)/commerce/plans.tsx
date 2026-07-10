import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Modal, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

type PlanStatus = 'Active' | 'Inactive' | 'Coming Soon';
type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  id: string; name: string; price: number; billing_cycle: BillingCycle;
  features: string[]; status: PlanStatus;
}

const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Free', price: 0, billing_cycle: 'monthly', features: ['Up to 1 property', 'Up to 2 users', 'Basic reporting', 'Email support'], status: 'Active' },
  { id: '2', name: 'Basic', price: 25000, billing_cycle: 'monthly', features: ['Up to 3 properties', 'Up to 10 users', 'Revenue reports', 'Chat support', 'Basic API access'], status: 'Active' },
  { id: '3', name: 'Pro', price: 75000, billing_cycle: 'monthly', features: ['Up to 10 properties', 'Up to 50 users', 'Advanced analytics', 'Priority support', 'Full API access', 'Custom branding'], status: 'Active' },
  { id: '4', name: 'Enterprise', price: 200000, billing_cycle: 'yearly', features: ['Unlimited properties', 'Unlimited users', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', '24/7 phone support'], status: 'Coming Soon' },
  { id: '5', name: 'Starter', price: 10000, billing_cycle: 'monthly', features: ['Up to 2 properties', 'Up to 5 users', 'Basic reporting', 'Standard support'], status: 'Inactive' },
];

const STATUS_COLORS: Record<PlanStatus, string> = { 'Active': '#10B981', 'Inactive': '#6B7280', 'Coming Soon': '#F59E0B' };
const emptyPlan: Plan = { id: '', name: '', price: 0, billing_cycle: 'monthly', features: [], status: 'Active' };

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan>({ ...emptyPlan });
  const [isEditing, setIsEditing] = useState(false);
  const [featuresText, setFeaturesText] = useState('');

  const openAddModal = () => {
    setEditingPlan({ ...emptyPlan, id: String(Date.now()) });
    setFeaturesText(''); setIsEditing(false); setModalVisible(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan({ ...plan }); setFeaturesText(plan.features.join('\n')); setIsEditing(true); setModalVisible(true);
  };

  const savePlan = () => {
    const featureList = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const updated = { ...editingPlan, features: featureList };
    if (isEditing) setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    else setPlans(prev => [...prev, updated]);
    setModalVisible(false);
    Alert.alert('Saved', `Plan "${updated.name}" ${isEditing ? 'updated' : 'created'} successfully.`);
  };

  const deletePlan = (id: string) => {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setPlans(prev => prev.filter(p => p.id !== id)) },
    ]);
  };

  const togglePlanStatus = (id: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next: Record<PlanStatus, PlanStatus> = { 'Active': 'Inactive', 'Inactive': 'Active', 'Coming Soon': 'Active' };
      return { ...p, status: next[p.status] };
    }));
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Manage Plans</Text>
          <TouchableOpacity onPress={openAddModal} style={s.addBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color="#FFF" />
            <Text style={s.addBtnText}>Add Plan</Text>
          </TouchableOpacity>
        </View>

        {plans.map(plan => (
          <View key={plan.id} style={s.planCard}>
            <View style={s.planHeadRow}>
              <Text style={s.planName}>{plan.name}</Text>
              <StatusBadge label={plan.status} color={STATUS_COLORS[plan.status]} size="md" />
            </View>
            <Text style={s.planPrice}>
              {plan.price === 0 ? 'Free' : `NPR ${(plan.price / 1000).toFixed(0)}K/${plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}`}
            </Text>
            <View style={s.divider} />
            {plan.features.map((feat, i) => (
              <View key={i} style={s.featureRow}>
                <IconSymbol name="check" size={14} color={SUPERADMIN} />
                <Text style={s.featureText}>{feat}</Text>
              </View>
            ))}
            <View style={[s.divider, { marginTop: 12 }]} />
            <View style={s.planActions}>
              <View style={s.actionBtns}>
                <TouchableOpacity onPress={() => openEditModal(plan)} style={[s.actionBtn, { backgroundColor: '#3B82F615' }]} activeOpacity={0.7}>
                  <Text style={[s.actionBtnText, { color: '#3B82F6' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deletePlan(plan.id)} style={[s.actionBtn, { backgroundColor: '#EF444415' }]} activeOpacity={0.7}>
                  <Text style={[s.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => togglePlanStatus(plan.id)} style={[s.actionBtn, { backgroundColor: SUPERADMIN + '12' }]} activeOpacity={0.7}>
                <Text style={[s.actionBtnText, { color: SUPERADMIN }]}>{plan.status === 'Active' ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{isEditing ? 'Edit Plan' : 'Add Plan'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalClose}>
                <IconSymbol name="close" size={16} color={GRAY[400]} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Plan Name</Text>
                <TextInput value={editingPlan.name} onChangeText={t => setEditingPlan(p => ({ ...p, name: t }))} placeholder="e.g. Premium" placeholderTextColor={GRAY[400]} style={s.input} />
              </View>
              <View style={s.fieldRow}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Price (NPR)</Text>
                  <TextInput value={String(editingPlan.price)} onChangeText={t => setEditingPlan(p => ({ ...p, price: Number(t) || 0 }))} placeholder="0" placeholderTextColor={GRAY[400]} keyboardType="number-pad" style={s.input} />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Billing Cycle</Text>
                  <View style={s.toggleRow}>
                    {(['monthly', 'yearly'] as BillingCycle[]).map(bc => (
                      <TouchableOpacity key={bc} onPress={() => setEditingPlan(p => ({ ...p, billing_cycle: bc }))}
                        style={[s.toggleBtn, { backgroundColor: editingPlan.billing_cycle === bc ? SUPERADMIN : GRAY[100] }]}>
                        <Text style={[s.toggleBtnText, { color: editingPlan.billing_cycle === bc ? '#FFF' : GRAY[500] }]}>{bc.charAt(0).toUpperCase() + bc.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Status</Text>
                <View style={s.toggleRow}>
                  {(['Active', 'Inactive', 'Coming Soon'] as PlanStatus[]).map(st => (
                    <TouchableOpacity key={st} onPress={() => setEditingPlan(p => ({ ...p, status: st }))}
                      style={[s.toggleBtn, { backgroundColor: editingPlan.status === st ? SUPERADMIN : GRAY[100] }]}>
                      <Text style={[s.toggleBtnText, { color: editingPlan.status === st ? '#FFF' : GRAY[500] }]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Features (one per line)</Text>
                <TextInput value={featuresText} onChangeText={setFeaturesText} placeholder="Up to 10 properties\n24/7 support" placeholderTextColor={GRAY[400]} multiline numberOfLines={5} textAlignVertical="top" style={[s.input, s.textarea]} />
              </View>
              <TouchableOpacity onPress={savePlan} style={s.saveBtn} activeOpacity={0.8}>
                <Text style={s.saveBtnText}>{isEditing ? 'Update Plan' : 'Create Plan'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: 10, backgroundColor: SUPERADMIN },
  addBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#FFF' },
  planCard: { padding: 18, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], ...SHADOWS.card },
  planHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planName: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  planPrice: { ...TYPOGRAPHY.h2, color: SRS.navy, marginBottom: 12 },
  divider: { height: 1, backgroundColor: GRAY[100], marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { ...TYPOGRAPHY.body, color: SRS.navy },
  planActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingBottom: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  modalTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: SPACING.lg },
  fieldLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 6 },
  input: { fontSize: 14, color: SRS.navy, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderRadius: 12, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200] },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.lg },
  halfField: { flex: 1 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  toggleBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  saveBtn: { paddingVertical: 16, borderRadius: 14, backgroundColor: SUPERADMIN, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
