import type { CancellationPolicy } from '@/types/api';

export const CANCELLATION_POLICY_DEFAULTS: Record<Exclude<CancellationPolicy, 'CUSTOM'>, { title: string; description: string }> = {
  FLEXIBLE: {
    title: 'Flexible Cancellation',
    description: 'Full refund if cancelled up to 24 hours before check-in.',
  },
  MODERATE: {
    title: 'Moderate Cancellation',
    description: 'Full refund if cancelled up to 5 days before check-in.',
  },
  STRICT: {
    title: 'Strict Cancellation',
    description: '50% refund if cancelled up to 1 week before check-in; no refund after that.',
  },
  NON_REFUNDABLE: {
    title: 'Non-Refundable',
    description: 'No refund at any time after the booking is confirmed.',
  },
};

export const CANCELLATION_OPTIONS: { label: string; value: CancellationPolicy; description: string }[] = [
  { label: CANCELLATION_POLICY_DEFAULTS.FLEXIBLE.title, value: 'FLEXIBLE', description: CANCELLATION_POLICY_DEFAULTS.FLEXIBLE.description },
  { label: CANCELLATION_POLICY_DEFAULTS.MODERATE.title, value: 'MODERATE', description: CANCELLATION_POLICY_DEFAULTS.MODERATE.description },
  { label: CANCELLATION_POLICY_DEFAULTS.STRICT.title, value: 'STRICT', description: CANCELLATION_POLICY_DEFAULTS.STRICT.description },
  { label: CANCELLATION_POLICY_DEFAULTS.NON_REFUNDABLE.title, value: 'NON_REFUNDABLE', description: CANCELLATION_POLICY_DEFAULTS.NON_REFUNDABLE.description },
  { label: 'Custom', value: 'CUSTOM', description: 'Define your own cancellation terms' },
];
