# Task 3 Report: Bookings screen

**Status**: Complete

**Created**: `app/(tabs)/profile/bookings.tsx` (187 lines)

**Summary**:
- Three tabs (Upcoming/Completed/Cancelled) using `'upcoming' | 'completed' | 'cancelled'` state
- Filters `bookings` from `useBookings()` context by active tab
- Booking cards show hotel name, check-in/check-out dates, color-coded status badge, total price
- "View Details" button pushes to `/(tabs)/profile/bookings/[id]`
- Empty state with calendar/xmark icon + contextual message per tab
- Pull-to-refresh via `RefreshControl` with Coral (#E63946) tint
- Header with "My Bookings" title and back arrow
- Styling follows guest portal conventions (Coral #E63946 accent, NAVY #1A3C5E headings)
- `npx tsc --noEmit` — zero errors
