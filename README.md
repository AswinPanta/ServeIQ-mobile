# ServeIQ

A multi-tenant property management & booking mobile app built with Expo SDK 57.

## Tech Stack

- **Frontend**: Expo SDK 57, React Native 0.86, Expo Router
- **Backend**: FastAPI (Python) at `https://stay-easy-sizw.onrender.com/api/v1`
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Context + Zustand
- **Payments**: Stripe, Razorpay, Khalti
- **i18n**: 17 languages via i18next

## Portals

| Portal | Target User | Features |
|--------|-------------|----------|
| Guest | Travelers | Search, book, pay, manage reservations |
| Host | Property owners | Property CRUD, rooms, staff, pricing, reports |
| Operations | Hotel staff | Front desk, housekeeping, POS, KDS, analytics |
| SuperAdmin | Platform admins | Tenants, subscriptions, feature flags, system health |

## Quick Start

```bash
npm install
npx expo start
```

## Configuration

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_API_URL=https://stay-easy-sizw.onrender.com/api/v1
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
EXPO_PUBLIC_KHALTI_PUBLIC_KEY=...
```

## Backend

Source: [github.com/anilghatan6/Stay-Easy](https://github.com/anilghatan6/Stay-Easy)

- Swagger: `https://stay-easy-sizw.onrender.com/docs`
- OpenAPI: `https://stay-easy-sizw.onrender.com/api/v1/openapi.json`
