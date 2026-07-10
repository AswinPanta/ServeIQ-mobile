import { View, Text, TouchableOpacity } from 'react-native';
import { ACCENT } from '@/constants/portal-theme';

const STEPS = ['Dirty', 'In Progress', 'Cleaned', 'Inspected'] as const;
const STEP_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

interface HKStatusFlowProps {
  currentStatus: string;
  onAdvance: (newStatus: string) => void;
  allowSkip?: boolean;
}

export function HKStatusFlow({ currentStatus, onAdvance, allowSkip = false }: HKStatusFlowProps) {
  const currentIdx = STEPS.indexOf(currentStatus as typeof STEPS[number]);
  if (currentIdx === -1) return null;

  return (
    <View style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const canTap = allowSkip ? idx > currentIdx : idx === currentIdx + 1;

          return (
            <TouchableOpacity
              key={step}
              disabled={!canTap}
              onPress={() => canTap && onAdvance(step)}
              style={{ alignItems: 'center', flex: 1 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isCompleted ? STEP_COLORS[idx] : isCurrent ? STEP_COLORS[idx] : '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isCurrent ? 3 : 0,
                  borderColor: '#FFF',
                  shadowColor: isCurrent ? STEP_COLORS[idx] : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: isCurrent ? 4 : 0,
                  opacity: canTap ? 1 : (isCompleted || isCurrent ? 1 : 0.5),
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: isCompleted || isCurrent ? '#FFF' : '#94A3B8' }}>
                  {isCompleted ? '✓' : idx + 1}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isCurrent ? '700' : '500',
                  color: isCurrent ? ACCENT : isCompleted ? '#475569' : '#94A3B8',
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                {step}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: '#E2E8F0, #E2E8F0', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <View
          style={{
            height: '100%',
            width: `${(currentIdx / (STEPS.length - 1)) * 100}%`,
            backgroundColor: ACCENT,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}
