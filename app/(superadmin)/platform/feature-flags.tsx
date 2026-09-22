import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { PURPLE, SLATE, STATUS, AMBER, BG, EMERALD } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

export default function FeatureFlagsScreen() {
  const { featureFlags, updateFeatureFlag } = useSuperAdmin();
  const [search, setSearch] = useState('');

  const toggle = async (id: string) => {
    const flag = featureFlags.find(f => f.id === id);
    if (flag) await updateFeatureFlag(id, { enabled: !flag.enabled });
  };
  const filtered = featureFlags.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Feature Flags</Text>
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={SLATE[400]} />
          <TextInput placeholder="Search flags..." placeholderTextColor={SLATE[400]} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        {filtered.map(flag => (
          <View key={flag.id} style={[s.card, { borderLeftColor: flag.enabled ? STATUS.activeGreen : SLATE[300] }]}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.flagName}>{flag.name}</Text>
                <Text style={s.flagDesc}>{flag.description}</Text>
              </View>
              <Switch
                value={flag.enabled}
                onValueChange={() => toggle(flag.id)}
                trackColor={{ false: SLATE[200], true: ACCENT + '50' }}
                thumbColor={flag.enabled ? ACCENT : SLATE[400]}
              />
            </View>
            <View style={s.metaRow}>
              <View style={s.envRow}>
                {(flag.environments || []).map(env => (
                  <View key={env} style={[s.envBadge, { backgroundColor: env === 'Production' ? EMERALD[500] + '12' : AMBER[500] + '12' }]}>
                    <Text style={[s.envText, { color: env === 'Production' ? STATUS.activeGreen : AMBER[500] }]}>{env}</Text>
                  </View>
                ))}
              </View>
              <View style={s.rolloutBar}>
                <View style={[s.rolloutFill, { width: `${flag.rollout ?? (flag.enabled ? 100 : 0)}%`, backgroundColor: flag.enabled ? STATUS.activeGreen : SLATE[300] }]} />
              </View>
              <Text style={s.rolloutLabel}>{flag.rollout ?? (flag.enabled ? 100 : 0)}%</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG.white, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: SLATE[200] },
  searchInput: { flex: 1, fontSize: 15, color: SLATE[900], padding: 0 },
  card: { padding: 16, borderRadius: 14, backgroundColor: BG.white, borderLeftWidth: 4, borderWidth: 1, borderColor: SLATE[100] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flagName: { fontSize: 15, fontWeight: '700', color: SLATE[900] },
  flagDesc: { fontSize: 13, color: SLATE[500], marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  envRow: { flexDirection: 'row', gap: 6 },
  envBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  envText: { fontSize: 11, fontWeight: '700' },
  rolloutBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: SLATE[100], overflow: 'hidden' },
  rolloutFill: { height: '100%', borderRadius: 3 },
  rolloutLabel: { fontSize: 11, fontWeight: '600', color: SLATE[500], width: 32, textAlign: 'right' },
});