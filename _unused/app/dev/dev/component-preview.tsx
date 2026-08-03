import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { useColors } from '@/hooks/use-colors';
import { safeGoBack } from '@/lib/utils';

type DemoRowProps = {
  label: string;
  badge: React.ReactNode;
  // count is informational for documentation purposes
  count?: number;
};

function DemoSection({
  title,
  subtitle,
  rows,
  colors,
}: {
  title: string;
  subtitle: string;
  rows: DemoRowProps[];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 14 }}>
        {subtitle}
      </Text>
      <View style={{ gap: 12 }}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {row.label}
              </Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#6B728020' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>
                  count={row.count}, maxThreshold=3
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {row.badge}
              {!row.badge && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#6B728020' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>(not rendered)</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function LiveDemo({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [liveCount, setLiveCount] = useState(3);

  return (
    <View
      style={{
        padding: 20,
        borderRadius: 20,
        marginBottom: 28,
        backgroundColor: '#1E293B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
        Live Demo
      </Text>
      <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
        Adjust the count value and watch the badge update in real time
      </Text>

      <View
        style={{
          height: 100,
          borderRadius: 16,
          backgroundColor: '#334155',
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <Text style={{ fontSize: 14, color: '#64748B' }}>
          Room image placeholder
        </Text>
        <ScarcityBadge count={liveCount} maxThreshold={3} position="absolute" />
      </View>

      <View className="flex-row items-center justify-center gap-4">
        <TouchableOpacity
          onPress={() => setLiveCount(Math.max(0, liveCount - 1))}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#FCA5A5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#991B1B' }}>−</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', minWidth: 60, textAlign: 'center' }}>
          {liveCount}
        </Text>

        <TouchableOpacity
          onPress={() => setLiveCount(Math.min(6, liveCount + 1))}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#86EFAC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#166534' }}>+</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center gap-2 mt-4">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setLiveCount(n)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: liveCount === n ? '#3B82F6' : '#475569',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ComponentPreviewScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-14 pb-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-2">
            <TouchableOpacity onPress={() => safeGoBack()} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#3B82F615', alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-lg" style={{ color: '#3B82F6' }}>←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.foreground }}>
                Component Preview
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                Visual states for ScarcityBadge
              </Text>
            </View>
          </View>

          {/* Live Interactive Demo */}
          <LiveDemo colors={colors} />

          {/* Absolute mode (overlay on images) */}
          <DemoSection
            title="Absolute Position (Overlay)"
            subtitle="Use this mode when overlaying badges on room images or cards with position: relative"
            colors={colors}
            rows={[
              {
                label: 'Critical — 1 left',
                count: 1,
                badge: (
                  <View style={{ width: 160, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Room image</Text>
                    <ScarcityBadge count={1} position="absolute" />
                  </View>
                ),
              },
              {
                label: 'Warning — 2 left',
                count: 2,
                badge: (
                  <View style={{ width: 160, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Room image</Text>
                    <ScarcityBadge count={2} position="absolute" />
                  </View>
                ),
              },
              {
                label: 'Low — 3 left',
                count: 3,
                badge: (
                  <View style={{ width: 160, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Room image</Text>
                    <ScarcityBadge count={3} position="absolute" />
                  </View>
                ),
              },
              {
                label: 'Hidden — 0 left (count=0)',
                count: 0,
                badge: (
                  <View style={{ width: 160, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Room image</Text>
                    <ScarcityBadge count={0} position="absolute" />
                  </View>
                ),
              },
              {
                label: 'Hidden — 5 left (above threshold)',
                count: 5,
                badge: (
                  <View style={{ width: 160, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Room image</Text>
                    <ScarcityBadge count={5} position="absolute" />
                  </View>
                ),
              },
            ]}
          />

          {/* Relative mode (inline flow) */}
          <DemoSection
            title="Relative Position (Inline)"
            subtitle="Use this mode inside flex-1 text columns, e.g. hotel detail room cards"
            colors={colors}
            rows={[
              {
                label: 'Critical — 1 left',
                count: 1,
                badge: <ScarcityBadge count={1} position="relative" />,
              },
              {
                label: 'Warning — 2 left',
                count: 2,
                badge: <ScarcityBadge count={2} position="relative" />,
              },
              {
                label: 'Low — 3 left',
                count: 3,
                badge: <ScarcityBadge count={3} position="relative" />,
              },
              {
                label: 'Hidden — 0 left (count=0)',
                count: 0,
                badge: <ScarcityBadge count={0} position="relative" />,
              },
              {
                label: 'Hidden — 4 left (above threshold)',
                count: 4,
                badge: <ScarcityBadge count={4} position="relative" />,
              },
            ]}
          />

          {/* Simulated room card */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 14 }}>
            Simulated Room Card
          </Text>
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>🛏️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>Standard Room</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Queen • Up to 2 guests</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>WiFi, AC, TV, Bathroom</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6', marginTop: 4 }}>NPR 5,000</Text>
                <ScarcityBadge count={1} position="relative" />
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#3B82F6',
                  backgroundColor: '#3B82F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
