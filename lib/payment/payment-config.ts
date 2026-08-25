let configPromise: Promise<string> | null = null;

export function getStripePublishableKey(): Promise<string> {
  if (!configPromise) {
    const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    configPromise = Promise.resolve(key);
  }
  return configPromise;
}

export function resetPaymentConfig(): void {
  configPromise = null;
}
