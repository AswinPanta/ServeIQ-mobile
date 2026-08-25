import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHost } from '@/lib/context/host-context';
import { useAuth } from '@/lib/context/auth-context';
import { isApiPropertyId } from '@/lib/context/host-utils';
import { RADIUS } from '@/constants/portal-theme';
import { AMBER, BG } from '@/lib/constants/figma-tokens';
import type { Property } from '@/types/api';

interface Props {
  property: Property;
}

/**
 * Shown only for local-only properties (id is NOT a backend UUID). Tells the
 * host that the property is saved on this device only and offers a one-tap
 * "Sync to server" so it lands in the database. On demo accounts it explains
 * that demo credentials can't publish to the server.
 *
 * The button is disabled while a global auto-sync is running (syncingToServer)
 * to avoid concurrent duplicate creates for the same property.
 */
export function PropertySyncBanner({ property }: Props) {
  const { syncPropertyToServer, syncingToServer } = useHost();
  const { tokens } = useAuth();
  const [syncing, setSyncing] = useState(false);

  if (isApiPropertyId(property.id)) return null;

  const isDemoAccount = !!tokens.accessToken?.startsWith('demo-');
  const busy = syncing || syncingToServer;

  const handleSync = async () => {
    if (busy) return;
    setSyncing(true);
    try {
      const { property: synced, warnings } = await syncPropertyToServer(property);
      // The property now has a backend UUID — re-point this route at it so the
      // screen re-resolves the synced property instead of showing "not found".
      if (synced.id !== property.id) {
        router.setParams({ id: synced.id });
      }
      if (warnings.length > 0) {
        Alert.alert(
          'Synced to server',
          `This property is now in the database, but some details couldn't be uploaded:\n\n• ${warnings.join('\n• ')}\n\nYou can retry them from the property edit screen.`
        );
      } else {
        Alert.alert('Synced to server', 'This property is now saved to the server.');
      }
    } catch (e) {
      Alert.alert(
        'Sync Failed',
        e instanceof Error ? e.message : 'Could not sync this property to the server. Please try again.'
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={AMBER[700]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          {isDemoAccount
            ? 'You are signed in with a demo account, so this property is saved on this device only. Sign in with a registered host account to save it to the server.'
            : 'This property is saved on this device only — it has not been saved to the database yet. Sync it now to publish it to the server.'}
        </Text>
        {!isDemoAccount && (
          <TouchableOpacity
            onPress={handleSync}
            disabled={busy}
            style={[styles.syncBtn, busy && { opacity: 0.6 }]}
            activeOpacity={0.7}
          >
            {busy ? (
              <ActivityIndicator size="small" color={BG.white} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={14} color={BG.white} />
                <Text style={styles.syncBtnText}>Sync to Server</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: AMBER[100],
    borderWidth: 1,
    borderColor: AMBER[200],
    borderRadius: RADIUS.input,
    padding: 10,
  },
  text: { flex: 1, fontSize: 12, lineHeight: 17, color: AMBER[800] },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: AMBER[700], paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.button,
  },
  syncBtnText: { color: BG.white, fontSize: 12, fontWeight: '700' },
});
