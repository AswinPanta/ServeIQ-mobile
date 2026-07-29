# Razorpay Payment Integration — Design

## Summary

Integrate Razorpay as a real payment gateway alongside the existing Stripe placeholders in the guest booking flow (`booking-flow.tsx`). Uses `react-native-razorpay` v3.0.0 native SDK which supports RN New Architecture.

## Architecture

```
booking-flow.tsx
  └── User selects "Razorpay" → sub-options (UPI / Card / Net Banking)
  └── POST /bookings/{ref}/payment-intent { payment_gateway: "razorpay" }
        → Response: { order_id, amount, currency }
  └── Open Razorpay checkout sheet (native)
        → On success: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        → On dismiss/failure: show error
  └── POST /bookings/{ref}/confirm { gateway_payload: { razorpay_payment_id, razorpay_order_id, razorpay_signature } }
        → Response: { status: "confirmed", booking_ref }
  └── Navigate to booking-confirmation
```

## Files to create

- `lib/razorpay/types.ts` — `RazorpayOrderResponse`, `RazorpayPaymentResponse`, `RazorpayCheckoutOptions`
- `lib/razorpay/use-razorpay.ts` — Hook wrapping `react-native-razorpay` `RazorpayCheckout.open()`

## Files to modify

- `package.json` — add `react-native-razorpay@3.0.0`, `@types/react-native-razorpay`
- `app/booking-flow.tsx` — add Razorpay payment option with sub-methods (UPI, Card, Net Banking), wire the payment flow
- `lib/api/booking-api.ts` — ensure `createPaymentIntent` and `confirmPayment` handle Razorpay response shapes (already work via `payment_gateway` param)
- `.env` — add `EXPO_PUBLIC_RAZORPAY_KEY_ID`

## Backend endpoints (already exist, no changes needed)

- `POST /bookings/{ref}/payment-intent` — sends `{ payment_gateway: "razorpay" }`, receives `{ order_id, amount, currency }`
- `POST /bookings/{ref}/confirm` — sends `{ gateway_payload }` with Razorpay response, receives `{ status, booking_ref }`
