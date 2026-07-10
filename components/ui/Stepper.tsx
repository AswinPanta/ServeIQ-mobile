import { View, Text, TouchableOpacity } from 'react-native';
import { ACCENT, getAccentColor } from '@/constants/portal-theme';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepPress?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepPress }: StepperProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = (index <= currentStep || isCompleted) && onStepPress;

          return (
            <View key={index} style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                disabled={!isClickable}
                onPress={() => isClickable && onStepPress?.(index)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isCompleted ? ACCENT : isCurrent ? '#FFF' : '#E2E8F0',
                  borderWidth: isCurrent ? 2.5 : 0,
                  borderColor: ACCENT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isCompleted || isCurrent ? (isCurrent ? ACCENT : '#FFF') : '#94A3B8' }}>
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isCurrent ? '700' : '500',
                  color: isCurrent ? ACCENT : isCompleted ? '#475569' : '#94A3B8',
                  textAlign: 'center',
                  marginTop: 6,
                  maxWidth: 64,
                }}
                numberOfLines={1}
              >
                {step.label}
              </Text>
              {index < steps.length - 1 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 13,
                    left: '50%',
                    right: -10,
                    height: 2,
                    backgroundColor: isCompleted ? ACCENT : '#E2E8F0',
                    zIndex: -1,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
