# Profile Sub-Pages — Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans.

**Goal:** Split the monolithic profile tab into 6 dedicated sub-pages with stack navigation.

**Architecture:** Stack navigator under `(tabs)/profile/` wrapping 6 screens. Data from existing contexts.

## Global Constraints
- All files use TypeScript
- Follow existing patterns in `app/(tabs)/` — see existing screens for style
- Use existing contexts (booking-context, favorites-context, coupon-context, notification-context, auth-context)
- `npx tsc --noEmit` must pass

---

### Task 1: Create profile stack layout

**Files:**
- Create: `app/(tabs)/profile/_layout.tsx`

```tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="about" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
```

Verify compiles, commit.

---

### Task 2: Create About Me screen

**Files:**
- Create: `app/(tabs)/profile/about.tsx`

Profile card with avatar (initials from name), user info fields (editable), bio textarea with char limit.

---

### Task 3: Create Bookings screen

**Files:**
- Create: `app/(tabs)/profile/bookings.tsx`

Three tabs: Upcoming / Completed / Cancelled. Uses `useBookings()` context. Each booking shows hotel name, dates, status badge, price. "View Details" navigates to booking detail.

---

### Task 4: Create Favorites screen

**Files:**
- Create: `app/(tabs)/profile/favorites.tsx`

Grid of saved hotels from `useFavorites()`. Empty state with heart icon. Each card navigates to hotel detail.

---

### Task 5: Create Coupons screen

**Files:**
- Create: `app/(tabs)/profile/coupons.tsx`

Active / Expired sections. Coupon card with code, description, discount, expiry countdown. Copy button using `expo-clipboard`.

---

### Task 6: Create Reviews screen

**Files:**
- Create: `app/(tabs)/profile/reviews.tsx`

Empty state placeholder. Mock data for future.

---

### Task 7: Create Notifications screen

**Files:**
- Create: `app/(tabs)/profile/notifications.tsx`

Notification list with read/unread indicators. "Mark all read" button.

---

### Task 8: Update profile hub

**Files:**
- Modify: `app/(tabs)/profile.tsx`

Replace inline sections with `router.push` links to sub-pages.
