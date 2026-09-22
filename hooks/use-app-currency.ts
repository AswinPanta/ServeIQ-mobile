import { useCallback } from 'react';
import { usePreferences } from '@/lib/context/preferences-context';

// ponytail: static rates per 1 NPR; swap for a live FX source when real rates matter
export const CURRENCY_RATES: Record<string, number> = {
  NPR: 1, INR: 0.625, USD: 0.0076, EUR: 0.0085, GBP: 0.0072, JPY: 1.1, CHF: 0.0069,
};

export const CURRENCIES = [
  { code: 'NPR', label: 'Nepali Rupee (रू)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'USD', label: 'US Dollar ($)' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function convertPrice(amount: number, from: string, to: string): number {
  const rf = CURRENCY_RATES[from] ?? 1;
  const rt = CURRENCY_RATES[to] ?? 1;
  return (amount / rf) * rt;
}

export function formatPrice(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

if (__DEV__) {
  const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) < tol;
  if (!(near(convertPrice(300, 'USD', 'USD'), 300) && near(convertPrice(132, 'NPR', 'USD'), 1) && near(convertPrice(1, 'USD', 'NPR'), 132) && near(convertPrice(80, 'INR', 'NPR'), 128))) {
    throw new Error('currency conversion self-check failed');
  }
}

export function useAppCurrency() {
  const { preferences, updatePreferences } = usePreferences();

  const setCurrency = useCallback(async (code: string) => {
    try {
      await updatePreferences({ currency: code });
    } catch (e) {
      console.warn('Failed to set currency:', e);
    }
  }, [updatePreferences]);

  return {
    currency: preferences.currency || 'NPR',
    setCurrency,
    availableCurrencies: CURRENCIES,
  };
}