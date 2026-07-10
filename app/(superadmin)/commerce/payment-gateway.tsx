/**
 * Payment Gateway Configuration Screen (SRS SA-009)
 * SuperAdmin can configure and manage global payment gateway credentials (Stripe, Razorpay)
 * and allow Admins to use their own accounts.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { safeGoBack } from '@/lib/utils';
const ACCENT = '#7C3AED';

interface GatewayConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  globalCredentials: boolean;
  allowOwnCredentials: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
}

const INITIAL_GATEWAYS: GatewayConfig[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    enabled: true,
    globalCredentials: true,
    allowOwnCredentials: true,
    publicKey: 'pk_test_************',
    secretKey: 'sk_test_************',
    webhookSecret: 'whsec_************',
    testMode: true,
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: '🏦',
    enabled: true,
    globalCredentials: true,
    allowOwnCredentials: true,
    publicKey: 'rzp_test_************',
    secretKey: 'rzp_test_secret_************',
    webhookSecret: 'whsec_rzp_************',
    testMode: true,
  },
];

const CONNECTED_TENANTS = [
  { name: 'Himalayan Heights Hotels', gateway: 'Stripe', status: 'Connected', live: false },
  { name: 'Pokhara Lake Resort', gateway: 'Razorpay', status: 'Connected', live: false },
  { name: 'Everest Base Camp Lodges', gateway: 'Stripe', status: 'Connected', live: true },
  { name: 'Buddha B&B Chain', gateway: 'Stripe', status: 'Pending Setup', live: false },
];

export default function PaymentGatewayScreen() {
  const colors = useColors();
  const [gateways, setGateways] = useState<GatewayConfig[]>(INITIAL_GATEWAYS);
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null);

  const updateGateway = (id: string, updates: Partial<GatewayConfig>) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleSave = (gateway: GatewayConfig) => {
    Alert.alert('Saved', `${gateway.name} configuration updated successfully.`);
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-14 pb-4">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity onPress={() => safeGoBack()}
              style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-lg" style={{ color: ACCENT }}>←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">Payment Gateways</Text>
          </View>

          <View style={{ padding: 16, borderRadius: 20, backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B20', marginBottom: 20 }}>
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontSize: 18 }}>ℹ️</Text>
              <Text className="text-sm font-bold text-foreground">Global Credentials</Text>
            </View>
            <Text className="text-xs text-muted leading-5">
              Configure global gateway credentials that apply to all tenants by default. 
              Admins can override with their own Stripe Connect or Razorpay accounts per property.
            </Text>
          </View>

          {gateways.map((gateway) => (
            <View key={gateway.id} style={{
              padding: 18, borderRadius: 20, marginBottom: 14,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
            }}>
              <TouchableOpacity onPress={() => setExpandedGateway(expandedGateway === gateway.id ? null : gateway.id)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{gateway.icon}</Text>
                  </View>
                  <View>
                    <Text className="text-base font-bold text-foreground">{gateway.name}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: gateway.enabled ? '#10B981' : '#6B7280' }} />
                      <Text className="text-xs text-muted">{gateway.enabled ? 'Enabled' : 'Disabled'}</Text>
                      {gateway.testMode && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#F59E0B15' }}>
                          <Text className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>Test Mode</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <Text className="text-lg text-muted">{expandedGateway === gateway.id ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expandedGateway === gateway.id && (
                <View className="mt-5 pt-4 border-t border-border">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm font-semibold text-foreground">Enable Gateway</Text>
                    <Switch
                      value={gateway.enabled}
                      onValueChange={(v) => updateGateway(gateway.id, { enabled: v })}
                      trackColor={{ false: colors.border, true: ACCENT + '60' }}
                      thumbColor={gateway.enabled ? ACCENT : '#9CA3AF'}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm font-semibold text-foreground">Allow Own Credentials</Text>
                    <Switch
                      value={gateway.allowOwnCredentials}
                      onValueChange={(v) => updateGateway(gateway.id, { allowOwnCredentials: v })}
                      trackColor={{ false: colors.border, true: ACCENT + '60' }}
                      thumbColor={gateway.allowOwnCredentials ? ACCENT : '#9CA3AF'}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-sm font-semibold text-foreground">Test Mode</Text>
                    <Switch
                      value={gateway.testMode}
                      onValueChange={(v) => updateGateway(gateway.id, { testMode: v })}
                      trackColor={{ false: colors.border, true: '#F59E0B' + '60' }}
                      thumbColor={gateway.testMode ? '#F59E0B' : '#9CA3AF'}
                    />
                  </View>

                  <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">API Credentials</Text>

                  {[
                    { key: 'publicKey', label: 'Publishable Key', placeholder: 'pk_...' },
                    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_...', secure: true },
                    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', secure: true },
                  ].map(field => (
                    <View key={field.key} className="mb-3">
                      <Text className="text-xs text-muted mb-1.5">{field.label}</Text>
                      <TextInput
                        value={(gateway as any)[field.key]}
                        onChangeText={(t) => updateGateway(gateway.id, { [field.key]: t } as any)}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.muted}
                        secureTextEntry={field.secure}
                        className="text-sm text-foreground px-4 py-3 rounded-xl"
                        style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                      />
                    </View>
                  ))}

                  <TouchableOpacity onPress={() => handleSave(gateway)}
                    style={{
                      marginTop: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center',
                      shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
                    }}
                  >
                    <Text className="text-base font-bold text-white">Save {gateway.name} Configuration</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {/* Connected Tenants */}
          <View className="mt-4">
            <Text className="text-lg font-bold text-foreground mb-4">Connected Tenants</Text>
            {CONNECTED_TENANTS.map((t, i) => (
              <View key={t.name} style={{
                padding: 14, borderRadius: 16, marginBottom: 8,
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
              }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{t.name}</Text>
                    <Text className="text-xs text-muted">{t.gateway}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {t.live && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#10B98115' }}>
                        <Text className="text-[10px] font-bold text-green-500">Live</Text>
                      </View>
                    )}
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: t.status === 'Connected' ? '#10B98115' : '#F59E0B15' }}>
                      <Text className="text-xs font-bold" style={{ color: t.status === 'Connected' ? '#10B981' : '#F59E0B' }}>{t.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
