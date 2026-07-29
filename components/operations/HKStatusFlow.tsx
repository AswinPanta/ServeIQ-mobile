import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HK_COLORS as C } from '@/lib/constants/housekeeping-theme';

const STEPS = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'] as const;

const STEP_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  Dirty: { color: C.dirty, bg: C.badgeRed, icon: 'cleaning' },
  'In Progress': { color: C.inProgress, bg: C.badgeBlue, icon: 'cleaning' },
  Cleaned: { color: C.cleaned, bg: C.badgeGreen, icon: 'check' },
  Inspected: { color: C.inspected, bg: C.badgeBlue, icon: 'check' },
};

interface HKStatusFlowProps {
  currentStatus: string;
  onAdvance: (newStatus: string) => void;
  allowSkip?: boolean;
}

export function HKStatusFlow({ currentStatus, onAdvance, allowSkip = false }: HKStatusFlowProps) {
  const currentIdx = STEPS.indexOf(currentStatus as typeof STEPS[number]);
  if (currentIdx === -1) return null;

  return (
    <View style={s.container}>
      <View style={s.stepsRow}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const canTap = allowSkip ? idx > currentIdx : idx === currentIdx + 1;
          const cfg = STEP_CONFIG[step] || { color: C.textMuted, bg: C.inactive, icon: 'check' };

          return (
            <TouchableOpacity
              key={step}
              disabled={!canTap}
              onPress={() => canTap && onAdvance(step)}
              style={s.stepContainer}
            >
              <View
                style={[
                  s.stepDot,
                  isCurrent && s.stepDotActive,
                  {
                    backgroundColor: isCompleted || isCurrent ? cfg.color : C.inactive,
                    borderWidth: isCurrent ? 3 : 0,
                    borderColor: '#FFF',
                    opacity: canTap ? 1 : (isCompleted || isCurrent ? 1 : 0.5),
                  },
                ]}
              >
                {isCompleted ? (
                  <IconSymbol name="check" size={12} color="#FFF" />
                ) : (
                  <Text style={[s.stepNumber, { color: isCurrent ? '#FFF' : C.textMuted }]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  s.stepLabel,
                  {
                    color: isCurrent ? C.textHeading : isCompleted ? C.textPrimary : C.textMuted,
                    fontWeight: isCurrent ? '700' : '500',
                  },
                ]}
              >
                {step}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={s.progressBarBg}>
        <View
          style={[
            s.progressBarFill,
            {
              width: `${(currentIdx / (STEPS.length - 1)) * 100}%`,
              backgroundColor: C.teal,
            },
          ]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: C.inactive,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
