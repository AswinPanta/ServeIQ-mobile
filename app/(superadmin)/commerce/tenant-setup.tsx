import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { createTenant } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ACCENT = '#7C3AED';

const STEPS = [
  { title: 'Brand Name', subtitle: 'What should we call your tenant?', icon: 'hotel' },
  { title: 'Confirm', subtitle: 'Review and create your tenant', icon: 'check' },
];

export default function TenantSetup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Tenant / brand name is required."); return; }

    if (step === 0) {
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      await createTenant({ brand_name: name.trim() });
      Alert.alert('Success', `"${name}" has been created.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create tenant.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 0 ? router.back() : setStep(0)} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tenant</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.progressItem}>
            <View style={[styles.progressDot, i <= step && { backgroundColor: ACCENT }]}>
              {i < step ? (
                <IconSymbol name="check" size={12} color="#FFF" />
              ) : (
                <Text style={[styles.progressNum, i <= step && { color: '#FFF' }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i <= step && { color: ACCENT, fontWeight: '600' }]}>{s.title}</Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 0 ? (
          <>
            <View style={styles.iconWrap}>
              <IconSymbol name="hotel" size={28} color={ACCENT} />
            </View>
            <Text style={styles.stepTitle}>Name your brand</Text>
            <Text style={styles.stepDesc}>This will be your tenant name for managing properties</Text>

            <Text style={styles.inputLabel}>Tenant / Brand name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              placeholder="e.g. Sunset Hospitality"
              placeholderTextColor="#94A3B8"
              style={[styles.input, error ? styles.inputError : null]}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <IconSymbol name="check" size={28} color="#10B981" />
            </View>
            <Text style={styles.stepTitle}>Review your tenant</Text>
            <Text style={styles.stepDesc}>Confirm the details below</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Brand Name</Text>
                <Text style={styles.reviewValue}>{name}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Plan</Text>
                <View style={[styles.planBadge, { backgroundColor: ACCENT + '12' }]}>
                  <Text style={[styles.planText, { color: ACCENT }]}>Free (Trial)</Text>
                </View>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Properties</Text>
                <Text style={styles.reviewValue}>Up to 1</Text>
              </View>
              <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reviewLabel}>Users</Text>
                <Text style={styles.reviewValue}>Up to 2</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Text style={styles.submitText}>{step === 0 ? 'Continue' : 'Create Tenant'}</Text>
            <IconSymbol name="arrow.forward" size={18} color="#FFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  progressItem: { alignItems: 'center', gap: 6 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  progressNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  progressLabel: { fontSize: 12, color: '#94A3B8' },
  content: { flex: 1, paddingHorizontal: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFF',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 6 },
  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewLabel: { fontSize: 14, color: '#64748B' },
  reviewValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  planText: { fontSize: 13, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
