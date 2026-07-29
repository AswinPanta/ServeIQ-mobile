# Task 4: Wire Razorpay into booking-flow.tsx — Report

## Status: DONE

## Changes Made

### Modified
- `app/booking-flow.tsx`:
  - Added `import { useRazorpay } from '@/lib/razorpay/use-razorpay'`
  - Extended `paymentMethod` state type to include `'razorpay'`
  - Added `razorpaySubMethod`, `upiId`, `selectedBank` state variables
  - Added `const { openCheckout } = useRazorpay()` hook
  - Added Razorpay as 4th payment method option with `id: 'razorpay'`
  - Added Razorpay sub-methods UI: UPI (text input), Card (card fields), Net Banking (bank selector: SBI, HDFC, ICICI, Axis, Yes Bank) — each with a Pay button
  - Modified `handleCompleteBooking` to branch on Razorpay: creates booking → opens Razorpay checkout via `openCheckout()` → confirms payment via `confirmPayment({ gateway_payload: response })`
  - Updated bottom button text to "Pay with Razorpay" when that method is selected
  - Added sub-method-related styles: `subMethodCard`, `subMethodHeader`, `subPayBtn`, `bankOption`, etc.

- `.env`:
  - Added `EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx`

## Verification
- `npx tsc --noEmit` — zero errors in booking-flow.tsx
- Build passes with only 3 pre-existing errors in `search-results.tsx` (unrelated)

## Notes
- Sub-method Pay buttons and bottom "Pay with Razorpay" button both trigger `handleCompleteBooking`
- Razorpay flow falls back to `order_id: ''` if `intent.order_id` is undefined
- `gateway_payload` cast through `unknown` to satisfy `Record<string, unknown>` constraint
