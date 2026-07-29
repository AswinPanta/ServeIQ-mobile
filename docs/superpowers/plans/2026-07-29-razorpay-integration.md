# Razorpay Payment Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement task-by-task.

**Goal:** Add real Razorpay payment to the guest booking flow using `react-native-razorpay` v3.0.0 native SDK.

**Architecture:** Native Razorpay checkout sheet opened via `react-native-razorpay`'s `RazorpayCheckout.open()`. The existing booking flow already has Stripe/credit-card placeholders; we add Razorpay as a first-class option.

**Tech Stack:** `react-native-razorpay@3.0.0`, Expo SDK 57, existing booking-api.

## Global Constraints

- All files use TypeScript
- `npx tsc --noEmit` must pass
- Follow existing patterns in `lib/` and hooks/ — see `lib/api/booking-api.ts` for API call patterns
- Don't remove existing Stripe card placeholders

---

### Task 1: Install react-native-razorpay

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install the package**

```bash
npx expo install react-native-razorpay@3.0.0
```

- [ ] **Step 2: Install types**

```bash
npm install --save-dev @types/react-native-razorpay
```

- [ ] **Step 3: Verify install**

Check `package.json` contains `"react-native-razorpay": "^3.0.0"` and `"@types/react-native-razorpay"` in devDependencies.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install react-native-razorpay v3.0.0"
```

---

### Task 2: Create Razorpay types

**Files:**
- Create: `lib/razorpay/types.ts`

- [ ] **Step 1: Create types file**

```typescript
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit`
Expected: zero errors from this file

- [ ] **Step 3: Commit**

```bash
git add lib/razorpay/types.ts
git commit -m "feat: add Razorpay payment types"
```

---

### Task 3: Create useRazorpay hook

**Files:**
- Create: `lib/razorpay/use-razorpay.ts`

- [ ] **Step 1: Create the hook**

```typescript
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
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add lib/razorpay/use-razorpay.ts
git commit -m "feat: add useRazorpay hook wrapping native SDK"
```

---

### Task 4: Wire Razorpay into booking-flow.tsx

**Files:**
- Modify: `app/booking-flow.tsx`
- Modify: `.env` (create if not exists)

This is the main task. The booking flow currently has 5 steps (Rooms → Guests → Add-ons → Review → Payment). The Payment step (step 5) offers Credit/Debit Card, Digital Wallet, Bank Transfer. We add Razorpay as a fourth option with sub-methods.

- [ ] **Step 1: Read the current file**

Read `app/booking-flow.tsx` to understand the exact payment step structure.

- [ ] **Step 2: Add imports and hook usage**

```typescript
import RazorpayCheckout from 'react-native-razorpay';
import { useRazorpay } from '@/lib/razorpay/use-razorpay';
```

Inside the component:
```typescript
const { openCheckout } = useRazorpay();
```

- [ ] **Step 3: Add Razorpay payment method option**

In the payment method selection UI, add a fourth option:
```typescript
const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'creditcard' },
  { id: 'wallet', label: 'Digital Wallet', icon: 'wallet' },
  { id: 'bank', label: 'Bank Transfer', icon: 'building' },
  { id: 'razorpay', label: 'Razorpay', icon: 'rupee' },
];
```

When `selectedMethod === 'razorpay'`, show three sub-methods:
- UPI — Text input for UPI ID, "Pay via UPI" button
- Card — Same as Stripe card flow
- Net Banking — Bank selector (SBI, HDFC, ICICI, Axis, etc.)

- [ ] **Step 4: Wire Razorpay payment flow**

Create a `handleRazorpayPayment` async function:

```typescript
async function handleRazorpayPayment() {
  try {
    // 1. Create payment intent
    const intent = await bookingApi.createPaymentIntent(bookingRef, {
      payment_gateway: 'razorpay',
      amount: total,
      currency: 'INR',
    });

    if (!intent) {
      Alert.alert('Error', 'Failed to initialize payment');
      return;
    }

    // 2. Open Razorpay checkout
    const response = await openCheckout({
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: intent.amount,
      currency: intent.currency,
      order_id: intent.order_id,
      name: 'StayEasy',
      description: `Booking for ${hotelName}`,
      prefill: {
        name: `${firstName} ${lastName}`,
        email: email,
        contact: phone,
      },
      theme: { color: '#0071c2' },
    });

    // 3. Confirm booking
    const confirmed = await bookingApi.confirmPayment(bookingRef, {
      gateway_payload: response,
    });

    if (confirmed) {
      router.push({
        pathname: '/booking-confirmation',
        params: { ref: bookingRef, paymentGateway: 'razorpay' },
      });
    }
  } catch (error: any) {
    Alert.alert('Payment Failed', error.message || 'Something went wrong');
  }
}
```

- [ ] **Step 5: Add EXPO_PUBLIC_RAZORPAY_KEY_ID to .env**

Create or modify `.env`:
```
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

- [ ] **Step 6: Verify compiles**

Run: `npx tsc --noEmit`
Expected: zero errors (or only pre-existing errors from earlier)

- [ ] **Step 7: Commit**

```bash
git add app/booking-flow.tsx .env
git commit -m "feat: add Razorpay payment option to booking flow"
```
