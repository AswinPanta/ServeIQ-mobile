import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/superadmin/StatusBadge';

const ACCENT = '#7C3AED';

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
  { id: '4', name: 'Enterprise', price: 200000, billing_cycle: 'yearly', features: ['Unlimited properties', 'Unlimited users', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'], status: 'Coming Soon' },
  { id: '5', name: 'Starter', price: 10000, billing_cycle: 'monthly', features: ['Up to 2 properties', 'Up to 5 users', 'Basic reporting', 'Standard support'], status: 'Inactive' },
];

const PLAN_COLORS: Record<string, string> = {
  Free: '#6B7280', Basic: '#3B82F6', Pro: ACCENT, Enterprise: '#F59E0B', Starter: '#10B981',
};

const emptyPlan: Plan = { id: '', name: '', price: 0, billing_cycle: 'monthly', features: [], status: 'Active' };

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan>({ ...emptyPlan });
  const [isEdit, setIsEdit] = useState(false);
  const [featuresText, setFeaturesText] = useState('');

  const openAdd = () => {
    setEditing({ ...emptyPlan, id: String(Date.now()) });
    setFeaturesText(''); setIsEdit(false); setShowModal(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing({ ...plan }); setFeaturesText(plan.features.join('\n')); setIsEdit(true); setShowModal(true);
  };

  const save = () => {
    const featureList = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const updated = { ...editing, features: featureList };
    if (isEdit) setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    else setPlans(prev => [...prev, updated]);
    setShowModal(false);
    Alert.alert('Saved', `Plan "${updated.name}" ${isEdit ? 'updated' : 'created'}.`);
  };

  const deletePlan = (id: string) => {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setPlans(prev => prev.filter(p => p.id !== id)) },
    ]);
  };

  const toggleStatus = (id: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next: Record<PlanStatus, PlanStatus> = { 'Active': 'Inactive', 'Inactive': 'Active', 'Coming Soon': 'Active' };
      return { ...p, status: next[p.status] };
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Plans</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color="#FFF" />
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
                <TouchableOpacity onPress={() => toggleStatus(plan.id)} style={styles.toggleBtn} activeOpacity={0.7}>
                  <Text style={styles.toggleText}>{plan.status === 'Active' ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deletePlan(plan.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <IconSymbol name="delete" size={14} color="#EF4444" />
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
                <IconSymbol name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Plan Name</Text>
                <TextInput value={editing.name} onChangeText={t => setEditing(p => ({ ...p, name: t }))} placeholder="e.g. Premium" placeholderTextColor="#94A3B8" style={styles.input} />
              </View>
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Price (NPR)</Text>
                  <TextInput value={String(editing.price)} onChangeText={t => setEditing(p => ({ ...p, price: Number(t) || 0 }))} placeholder="0" placeholderTextColor="#94A3B8" keyboardType="number-pad" style={styles.input} />
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
                <TextInput value={featuresText} onChangeText={setFeaturesText} placeholder="Up to 10 properties&#10;24/7 support" placeholderTextColor="#94A3B8" multiline numberOfLines={4} textAlignVertical="top" style={[styles.input, { minHeight: 100 }]} />
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  addText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  card: { padding: 18, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  price: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  checkCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: '#475569' },
  moreText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT + '10' },
  editText: { fontSize: 13, fontWeight: '700', color: ACCENT },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: { fontSize: 14, color: '#0F172A', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleOpt: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F1F5F9' },
  toggleOptActive: { backgroundColor: ACCENT },
  toggleOptText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  toggleOptTextActive: { color: '#FFF' },
  saveBtn: { paddingVertical: 16, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
