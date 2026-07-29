# Profile Sub-Pages — Design

## Summary

Split the monolithic profile tab into dedicated sub-pages: Bookings, Favorites, Coupons, Reviews, Notifications, and About Me. Each accessed via stack navigation from the existing profile hub.

## Architecture

```
(tabs)/profile.tsx (hub — existing, linked to sub-pages)
  └── (tabs)/profile/_layout.tsx (stack navigator)
        ├── about.tsx — profile card + bio editor + API integration
        ├── bookings.tsx — Upcoming / Completed / Cancelled tabs
        ├── favorites.tsx — grid of saved hotels
        ├── coupons.tsx — active / expired coupons with copy button
        ├── reviews.tsx — review list (placeholder)
        └── notifications.tsx — notification list with read/unread
```

## Data Sources

All data pulled from existing contexts — no new API calls:
- `booking-context` — bookings list
- `favorites-context` — saved hotels
- `coupon-context` — coupons
- `notification-context` — notifications (already has push token, unread count)
- `auth-context` — user profile for About Me

## Files to create
- `app/(tabs)/profile/_layout.tsx`
- `app/(tabs)/profile/about.tsx`
- `app/(tabs)/profile/bookings.tsx`
- `app/(tabs)/profile/favorites.tsx`
- `app/(tabs)/profile/coupons.tsx`
- `app/(tabs)/profile/reviews.tsx`
- `app/(tabs)/profile/notifications.tsx`

## Files to modify
- `app/(tabs)/profile.tsx` — update navigation links to push to sub-pages
