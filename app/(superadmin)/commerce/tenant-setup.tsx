import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { createTenant } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from "@/constants/portal-theme";

const SUPERADMIN = '#8E44AD';

export default function TenantSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Tenant / brand name is required."); return; }
    setLoading(true);
    try {
      await createTenant({ brand_name: name.trim() });
      router.push("/(superadmin)/commerce");
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to create tenant."); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.card}>
        <View style={s.iconWrap}>
          <IconSymbol name="hotel" size={24} color={SUPERADMIN} />
        </View>
        <Text style={s.title}>Name your brand</Text>
        <Text style={s.sub}>This will be your tenant name for managing properties</Text>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Tenant / Brand name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Sunset Hospitality"
            placeholderTextColor={GRAY[300]} style={s.input} />
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[s.submitBtn, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY[50], justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 16, padding: 32, ...SHADOWS.modal, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: SUPERADMIN + '15', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  title: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: 4, textAlign: 'center' },
  sub: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 24, textAlign: 'center' },
  field: { width: '100%', marginBottom: 16 },
  fieldLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { width: '100%', borderBottomWidth: 1.5, borderBottomColor: GRAY[200], paddingVertical: 7, fontSize: 14, color: SRS.navy },
  errorText: { color: SRS.red, fontSize: 12, marginBottom: 10, alignSelf: 'flex-start' },
  submitBtn: { width: '100%', backgroundColor: SRS.navy, paddingVertical: 11, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
