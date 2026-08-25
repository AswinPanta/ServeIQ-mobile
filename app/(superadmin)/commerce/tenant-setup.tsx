import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { createTenant } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PURPLE, BG, SLATE, STATUS, RED } from '@/lib/constants/figma-tokens';
import { validateName } from '@/lib/utils/validation';

const ACCENT = PURPLE[700];

const STEPS = [
  { title: 'Brand Name', subtitle: 'What should we call your tenant?', icon: 'hotel' },
  { title: 'Confirm', subtitle: 'Review and create your tenant', icon: 'check' },
];

// Backend TenantCreateSchema constraints (Pydantic):
// - name: str, min_length=1, max_length=255, required
const NAME_MIN = 2;
const NAME_MAX = 100;

export default function TenantSetup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const nameErr = validateName(name, { min: NAME_MIN, max: NAME_MAX, label: 'Tenant name' });
    if (nameErr) { setError(nameErr); return false; }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (step === 0) {
      if (!validate()) return;
      setStep(1);
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      await createTenant({ name: name.trim() });
      Alert.alert('Success', `"${name.trim()}" has been created.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      // handleResponse already extracts the backend error message string
      // (e.g. "Field required", "name: ensure this value has at least 2 characters").
      Alert.alert("Error", e?.message || "Failed to create tenant.");
    }
    setLoading(false);
  };

  const charCount = name.length;
  const charWarning = charCount > NAME_MAX * 0.8;

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
                <IconSymbol name="check" size={12} color={BG.white} />
              ) : (
                <Text style={[styles.progressNum, i <= step && { color: BG.white }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i <= step && { color: ACCENT, fontWeight: '600' }]}>{s.title}</Text>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
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
              placeholderTextColor={SLATE[400]}
              style={[styles.input, error ? styles.inputError : null]}
              maxLength={NAME_MAX}
              autoFocus
            />
            {/* Character counter */}
            <View style={styles.charRow}>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={{ flex: 1 }} />
              )}
              <Text style={[styles.charCount, charWarning && { color: RED[500] }]}>
                {charCount}/{NAME_MAX}
              </Text>
            </View>

            {/* Requirements hint */}
            <View style={styles.hints}>
              <Hint icon="checkmark.circle" text={`At least ${NAME_MIN} characters`} ok={name.trim().length >= NAME_MIN} />
              <Hint icon="checkmark.circle" text="No special control characters" ok={!/[\x00-\x08\x0e-\x1f]/.test(name)} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <IconSymbol name="check" size={28} color={STATUS.activeGreen} />
            </View>
            <Text style={styles.stepTitle}>Review your tenant</Text>
            <Text style={styles.stepDesc}>Confirm the details below</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Brand Name</Text>
                <Text style={styles.reviewValue}>{name.trim()}</Text>
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
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={BG.white} />
        ) : (
          <>
            <Text style={styles.submitText}>{step === 0 ? 'Continue' : 'Create Tenant'}</Text>
            <IconSymbol name="arrow.forward" size={18} color={BG.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/** Small inline requirement hint with check icon */
function Hint({ icon, text, ok }: { icon: string; text: string; ok: boolean }) {
  return (
    <View style={styles.hintRow}>
      <IconSymbol name={icon as any} size={14} color={ok ? STATUS.activeGreen : SLATE[400]} />
      <Text style={[styles.hintText, ok && { color: STATUS.activeGreen }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  progressItem: { alignItems: 'center', gap: 6 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: SLATE[200], alignItems: 'center', justifyContent: 'center' },
  progressNum: { fontSize: 12, fontWeight: '700', color: SLATE[400] },
  progressLabel: { fontSize: 12, color: SLATE[400] },
  content: { flex: 1, paddingHorizontal: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: SLATE[900], textAlign: 'center', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: SLATE[500], textAlign: 'center', marginBottom: 28 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: SLATE[500], marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: SLATE[200],
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: SLATE[900],
    backgroundColor: BG.white,
  },
  inputError: { borderColor: RED[500] },
  charRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  errorText: { color: RED[500], fontSize: 13, flex: 1 },
  charCount: { fontSize: 12, color: SLATE[400], fontWeight: '500' },
  hints: { gap: 6, marginTop: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontSize: 12, color: SLATE[400] },
  reviewCard: {
    backgroundColor: BG.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE[100],
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  reviewLabel: { fontSize: 14, color: SLATE[500] },
  reviewValue: { fontSize: 14, fontWeight: '700', color: SLATE[900] },
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
  submitText: { fontSize: 16, fontWeight: '700', color: BG.white },
});
