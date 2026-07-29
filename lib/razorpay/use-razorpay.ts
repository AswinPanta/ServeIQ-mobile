import { useCallback } from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import type { RazorpayCheckoutOptions, RazorpayPaymentResponse } from './types';

export function useRazorpay() {
  const openCheckout = useCallback(
    (options: RazorpayCheckoutOptions): Promise<RazorpayPaymentResponse> => {
      return new Promise((resolve, reject) => {
        RazorpayCheckout.open(options)
          .then((data: any) => {
            resolve({
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature,
            });
          })
          .catch((error: any) => {
            if (error?.code === 0) {
              reject(new Error('Payment cancelled'));
            } else {
              reject(new Error(error?.description || 'Payment failed'));
            }
          });
      });
    },
    []
  );

  return { openCheckout };
}
