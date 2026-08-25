import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, SPACING, RADIUS, GRAY, TYPOGRAPHY } from '@/constants/portal-theme';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useHousekeepingStore } from '@/stores/useHousekeepingStore';
import { BG } from '@/lib/constants/figma-tokens';

interface SyncIndicatorProps {
  compact?: boolean;
}

export function SyncIndicator({ compact = false }: SyncIndicatorProps) {
  const { isOffline } = useNetworkStatus();
  const syncPendingCount = useHousekeepingStore((s) => s.syncPendingCount);
  const isSyncing = useHousekeepingStore((s) => s.isSyncing);
  const syncPendingChanges = useHousekeepingStore((s) => s.syncPendingChanges);

  // Auto-sync when network comes back online
  useEffect(() => {
    if (!isOffline && syncPendingCount > 0 && !isSyncing) {
      syncPendingChanges();
    }
  }, [isOffline, syncPendingCount, isSyncing, syncPendingChanges]);

  if (syncPendingCount === 0 && !isOffline) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {isOffline ? (
          <View style={[styles.statusDot, { backgroundColor: SRS.red }]} />
        ) : isSyncing ? (
          <ActivityIndicator size={12} color={SRS.teal} />
        ) : syncPendingCount > 0 ? (
          <View style={[styles.statusDot, { backgroundColor: SRS.orange }]} />
        ) : null}
        <Text style={styles.compactText}>
          {isOffline ? 'Offline' : isSyncing ? 'Syncing...' : `${syncPendingCount} pending`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOffline && styles.offlineContainer]}>
      <View style={styles.indicator}>
        {isOffline ? (
          <IconSymbol name="warning" size={16} color={BG.white} />
        ) : isSyncing ? (
          <ActivityIndicator size={16} color={BG.white} />
        ) : (
          <IconSymbol name="check" size={16} color={BG.white} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>
            {isOffline
              ? 'Offline Mode'
              : isSyncing
              ? 'Syncing changes...'
              : `${syncPendingCount} change${syncPendingCount !== 1 ? 's' : ''} pending sync`}
          </Text>
          <Text style={styles.statusSubtext}>
            {isOffline
              ? 'Changes will sync when online'
              : isSyncing
              ? 'Please wait...'
              : 'Tap to sync now'}
          </Text>
        </View>
      </View>
      {!isOffline && !isSyncing && syncPendingCount > 0 && (
        <TouchableOpacity style={styles.syncButton} onPress={syncPendingChanges}>
          <IconSymbol name="check" size={14} color={SRS.teal} />
          <Text style={styles.syncButtonText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SRS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  offlineContainer: {
    backgroundColor: SRS.red,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: TYPOGRAPHY.small.fontSize,
    fontWeight: '600',
    color: BG.white,
  },
  statusSubtext: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BG.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: SRS.teal,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.badge,
    backgroundColor: GRAY[100],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
    color: GRAY[600],
  },
});
