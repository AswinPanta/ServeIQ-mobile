import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { getStripePublishableKey } from '@/lib/payment/payment-config';

export interface StripeSheetResult {
  status: 'completed' | 'canceled' | 'failed' | 'unsupported';
  message?: string;
}

export async function presentStripePaymentSheet(
  clientSecret: string,
  merchantDisplayName: string,
): Promise<StripeSheetResult> {
  const publishableKey = await getStripePublishableKey();
  if (!publishableKey) {
    return { status: 'failed', message: 'Stripe is not configured. Add a publishable key on the server.' };
  }

  await initStripe({ publishableKey });

  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName,
  });
  if (initError) return { status: 'failed', message: initError.message };

  const { error: presentError } = await presentPaymentSheet();
  if (presentError) {
    return {
      status: presentError.code === 'Canceled' ? 'canceled' : 'failed',
      message: presentError.message,
    };
  }
  return { status: 'completed' };
}
