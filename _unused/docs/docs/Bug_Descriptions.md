# ServeIQ — Bug Descriptions

Real bugs we encountered and fixed during development. Each description includes the symptoms, root cause, and fix.

---

## Bug 1: Back Button Crash on Auth Screens

**Reported:** July 30, 2026  
**Severity:** High  
**Component:** Auth screens (login, register, OTP, forgot-password, create-new-password)

### Symptoms

Users tapping the back arrow on auth screens would see the app freeze or crash. This happened when the auth screen was the first screen in the navigation stack (e.g., after a deep link or when the app launched directly to login).

### Root Cause

The back button handler called `router.back()` unconditionally. On Expo Router, if there's no navigation history, `router.back()` throws an error or does nothing — but in our case, it caused the screen to become unresponsive because the navigation state was invalid.

### Fix

We added a guard to check `router.canGoBack()` before calling `router.back()`. If there's no history, we redirect to the home screen instead.

```tsx
// Before
<TouchableOpacity onPress={() => router.back()}>

// After
<TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
```

**Commit:** `6834cc4`

---

## Bug 2: Booking Discount Applied After Payment

**Reported:** August 2, 2026  
**Severity:** High  
**Component:** Booking flow, booking API

### Symptoms

When a guest applied a discount code during booking, the discount wasn't reflected in the final charge. The backend received the payment confirmation before the discount was applied, so the full price was charged.

### Root Cause

The booking flow executed steps in the wrong order. We were confirming the payment (step 3) before applying the discount (step 4). The backend requires discounts to be applied before payment confirmation.

Additionally, the `applyDiscount` function was sending the coupon code in the request body, but the backend expects it as a query parameter.

### Fix

We reordered the steps so discount application happens before payment confirmation. We also fixed the query parameter format.

```typescript
// Before: payment first, then discount
await bookingApi.confirmPayment(ref, payload);
await bookingApi.applyDiscount(ref, code);

// After: discount first, then payment
await bookingApi.applyDiscount(ref, code);
await bookingApi.confirmPayment(ref, payload);
```

**Commit:** `30ced0f`

---

## Bug 3: Profile Screen Hidden Behind Tab Bar

**Reported:** August 4, 2026  
**Severity:** Medium  
**Component:** Guest profile screen

### Symptoms

On the profile screen, the "Sign Out" button and booking history were hidden behind the bottom tab bar. Users had to scroll up to see them, but there was no visual indication that more content existed below.

### Root Cause

The profile screen used a `ScrollView` with `paddingBottom: 300` to push content above the tab bar. This was a brute-force approach that didn't account for the actual tab bar height. The padding was too large on some devices and too small on others.

### Fix

We replaced the large padding with a fixed-height spacer `View` at the bottom of the scroll content. This ensures the content clears the tab bar consistently across device sizes.

```tsx
// Before
<ScrollView contentContainerStyle={{ paddingBottom: 300 }}>

// After
<ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
  {/* ... content ... */}
  <View style={{ height: 100 }} /> {/* Bottom spacer */}
</ScrollView>
```

**Commit:** `4d85565`

---

## Bug 4: Guest Portal Showing Old Session Data

**Reported:** August 3, 2026  
**Severity:** Medium  
**Component:** Guest portal, auth context

### Symptoms

When a guest logged out and a new user logged in, the home screen still showed properties from the previous session. The new user would see someone else's bookings and saved properties.

### Root Cause

The guest portal was restoring the previous session from AsyncStorage on app launch. Unlike the host/operations portals (which should persist sessions), the guest portal should always start fresh because guests don't have persistent accounts — they use OTP-based auth.

### Fix

We modified the `initializeAuth` function to clear guest session keys on launch, while preserving host/operations/superadmin sessions.

```typescript
// Clear guest session on launch (guests don't persist)
if (activePortal === 'guest') {
  await Promise.all([
    AsyncStorage.removeItem(keys.AUTH_TOKEN),
    AsyncStorage.removeItem(keys.REFRESH_TOKEN),
    AsyncStorage.removeItem(keys.USER_PROFILE),
  ]);
}
```

**Commit:** `790b04a`

---

## Bug 5: Splash Screen SVG NaN Error

**Reported:** August 4, 2026  
**Severity:** Low  
**Component:** Splash screen animation

### Symptoms

The splash screen animation would sometimes show a blank frame or crash on certain devices. The React Native error boundary caught a "NaN" error in the SVG path rendering.

### Root Cause

One of the SVG paths for the Nagarkot landmark illustration had a leading concatenation operator that produced a `NaN` value in the path data. The SVG parser couldn't handle the invalid path and threw an error.

### Fix

We removed the leading concatenation operator from the SVG path data and verified the path rendered correctly on all target devices.

**Commit:** `93fd1a9`

---

## Bug 6: Unhandled Promise Rejections in Host Context

**Reported:** August 2, 2026  
**Severity:** Medium  
**Component:** Host context, data fetching

### Symptoms

In development mode, the console showed multiple "Unhandled Promise Rejection" warnings when the app started. These came from five parallel API fetches (rooms, discounts, offers, staff, bookings) that had no error handling.

### Root Cause

The host context fires off multiple API calls on mount. Each call has a fallback pattern (try API, catch → return mock data), but the `.then()` chains didn't have `.catch()` handlers. When the backend was slow or unreachable, the promises would reject without being caught.

### Fix

We added `.catch()` handlers with `console.warn` to each API fetch chain.

```typescript
// Before
hostApi.getRooms(pid, () => []).then(apiRooms => {
  if (apiRooms.length > 0) setRooms(apiRooms.map(mapApiRoom));
});

// After
hostApi.getRooms(pid, () => []).then(apiRooms => {
  if (apiRooms.length > 0) setRooms(apiRooms.map(mapApiRoom));
}).catch(e => console.warn('Failed to fetch rooms:', e));
```

**Commit:** `b24114f`

---

## Bug 7: Silent Property Deletion Failure

**Reported:** August 2, 2026  
**Severity:** Medium  
**Component:** Host property management

### Symptoms

When a host deleted a property, the UI showed it disappearing, but on the next refresh it would reappear. The property wasn't actually deleted from the backend.

### Root Cause

The `removeProperty` function called `hostApi.deleteProperty()` without `await`. The function returned before the API call completed, so the local state was updated (property removed from UI) but the backend call might have failed silently.

### Fix

We added `await` to the delete call and wrapped it in a try/catch with an error alert.

```typescript
// Before
hostApi.deleteProperty(id); // fire and forget

// After
try {
  await hostApi.deleteProperty(id);
} catch (e) {
  Alert.alert('Delete Failed', 'Could not delete the property from the server.');
}
```

**Commit:** `b24114f`

---

## Bug 8: Auth Screen Redundant Footer

**Reported:** August 2, 2026  
**Severity:** Low  
**Component:** Auth screens

### Symptoms

The login and register screens showed a footer with "Don't have an account?" / "Already have an account?" links. This footer was redundant because the same links were already in the main form area, causing visual confusion.

### Root Cause

The auth screen component included both a form-level link and a footer-level link to the same destination. When we tried to remove the footer, it broke the layout on some screens.

### Fix

We removed the redundant footer from auth screens, then had to revert because it affected the layout.最终 we kept the footer but made it less prominent.

**Commit:** `d2b23ac` (fix), `dba39d2` (revert)

---

## Bug 9: Invalid Icon Names in Empty States

**Reported:** July 29, 2026  
**Severity:** Low  
**Component:** Various empty state screens

### Symptoms

Some empty state screens showed blank icons instead of the expected illustration. The Ionicons library was throwing warnings about invalid icon names.

### Root Cause

We used icon names that don't exist in Ionicons (e.g., `bed-outline` vs `bed`, `sparkles-outline` vs `sparkles`). The icon component silently failed and rendered nothing.

### Fix

We verified each icon name against the Ionicons documentation and replaced invalid names with valid ones.

**Commit:** `fd87be5`

---

## Bug 10: Chinese Language Auto-Detection Failed

**Reported:** July 29, 2026  
**Severity:** Low  
**Component:** i18n, language detection

### Symptoms

Chinese users saw the app in English instead of Chinese, even though their device language was set to Chinese.

### Root Cause

React Native's `Localization.locale` returns `zh-Hans` or `zh-Hant` for Chinese, but our i18n configuration only recognized `zh-CN`. The language detection failed because the codes didn't match.

### Fix

We added normalization logic to map `zh-Hans` and `zh-Hant` to `zh-CN` during language detection.

```typescript
// Before
const lang = Localization.locale; // "zh-Hans"

// After
let lang = Localization.locale;
if (lang.startsWith('zh')) lang = 'zh-CN';
```

**Commit:** `2c439f5`

---

## Bug 11: TouchableOpacity className Error

**Reported:** July 1, 2026  
**Severity:** Medium  
**Component:** Tab navigation

### Symptoms

Tapping tab buttons sometimes did nothing. The console showed a warning about `className` being an invalid prop on `TouchableOpacity`.

### Root Cause

We were using Tailwind CSS `className` on React Native `TouchableOpacity` components, but `TouchableOpacity` doesn't support `className` — it only supports `style`. The prop was being ignored, and in some cases the touch handler wasn't registered properly.

### Fix

We replaced `className` with `style` on all `TouchableOpacity` components in the tab navigation.

**Commit:** `2f7de87`

---

## Bug 12: TypeScript Error in Profile Screen

**Reported:** August 2, 2026  
**Severity:** High  
**Component:** Guest profile screen

### Symptoms

The app wouldn't compile. TypeScript threw an error about a duplicate variable declaration in the profile screen.

### Root Cause

The profile screen had two blocks of hooks and derived values — one before an early return and one after. When we added the `if (!user)` guard, the second block created a duplicate declaration that TypeScript rejected.

### Fix

We deleted the duplicate block and kept only the canonical block above the guard.

**Commit:** `b24114f`

---

## Bug 13: Keyboard Covering Form Inputs

**Reported:** July 2026  
**Severity:** High  
**Component:** Listing wizard, auth screens

### Symptoms

On both iOS and Android, tapping a text field brought up the keyboard but the form didn't scroll up. The keyboard covered the input field, making it impossible to see what was being typed.

### Root Cause

The form screens didn't use `KeyboardAvoidingView`. React Native doesn't automatically scroll content when the keyboard appears — you need to explicitly handle it.

### Fix

We wrapped form screens in `KeyboardAvoidingView` with platform-specific behavior:

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}>
  {content}
</KeyboardAvoidingView>
```

**Commit:** `2e0ec5d`

---

## Bug 14: Khalti Payment Stuck in Expo Go

**Reported:** August 5, 2026  
**Severity:** High  
**Component:** Booking flow, Khalti payment

### Symptoms

When testing in Expo Go, selecting Khalti as the payment method would open a WebView but the payment would never complete. The user was stuck on the Khalti checkout page with no way to proceed.

### Root Cause

The backend sometimes doesn't return a `payment_url` in the payment intent response. The native Khalti SDK can't run in Expo Go, so there was no fallback path. The app would try to open the SDK, fail, and leave the user stranded.

### Fix

We built the hosted checkout URL from the `pidx` value when the backend omits `payment_url`. The URL format is `https://test.khalti.com/#/payment/{pidx}` for the sandbox environment.

```typescript
const khaltiHostedBase = KHALTI_ENVIRONMENT === PROD
  ? "https://khalti.com/#/payment"
  : "https://test.khalti.com/#/payment";
const checkoutUrl = paymentIntent.payment_url
  || `${khaltiHostedBase}/${paymentIntent.pidx}`;
```

**Commit:** `2e0ec5d`

---

## Bug 15: Property Creation Failing Silently

**Reported:** August 9, 2026  
**Severity:** High  
**Component:** Listing wizard, host API

### Symptoms

When a host created a property through the wizard, the property wouldn't appear in the backend database. The wizard showed success, but the property was only stored locally.

### Root Cause

The `createGeneralInfo` function was catching backend validation errors and returning a local fallback ID. The backend requires `total_rooms >= 1` but the wizard defaulted to 0. It also requires `phone_number` to be exactly 10 digits, but the wizard allowed any format.

### Fix

We fixed the wizard to send `total_rooms: 1` minimum, normalize phone numbers to 10 digits, and added `rethrowOnServerError: true` to surface backend validation errors.

```typescript
// Before
total_rooms: propData.totalRooms, // could be 0

// After
total_rooms: Math.max(propData.totalRooms || 0, 1), // backend requires >= 1
```

**Commit:** `32caf2c`

---

*Document last updated: August 2026*
