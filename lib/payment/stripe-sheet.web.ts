export interface StripeSheetResult {
  status: 'completed' | 'canceled' | 'failed' | 'unsupported';
  message?: string;
}

export async function presentStripePaymentSheet(): Promise<StripeSheetResult> {
  return { status: 'unsupported' };
}
