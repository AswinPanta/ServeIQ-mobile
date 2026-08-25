/**
 * Ambient types for `react-native-razorpay` (v3 — the package ships no
 * bundled typings). Covers the subset used by the SDK payment checkout.
 */
declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id?: string;
    amount?: string | number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: unknown;
  }

  export interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayPaymentError {
    code: number | string;
    description: string;
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayCheckoutOptions,
      successCallback?: (data: RazorpayPaymentResponse) => void,
      errorCallback?: (error: RazorpayPaymentError) => void,
    ): Promise<RazorpayPaymentResponse>;
  };

  export default RazorpayCheckout;
}
