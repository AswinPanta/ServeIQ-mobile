let configPromise: Promise<string> | null = null;

export function getStripePublishableKey(): Promise<string> {
  if (!configPromise) {
    configPromise = Promise.resolve('');
  }
  return configPromise;
}

export function resetPaymentConfig(): void {
  configPromise = null;
}
