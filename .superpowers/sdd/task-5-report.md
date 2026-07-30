# Task 5: Migrate home/tab screens to i18n — Report

## Status
**Complete** — all 6 files migrated to `useTranslation()` + `t()` calls.

## Files modified
| File | Keys used |
|------|-----------|
| `app/(tabs)/index.tsx` | `home.welcome`, `home.welcomeDesc`, `home.getStarted`, `home.becomeHost`, `home.staysNearby`, `home.staysNearbyHint`, `components.destinations.viewAll` |
| `app/(tabs)/search.tsx` | `home.title`, `home.subtitle`, `search.*` (location, dates, nights, adults, children, rooms, button, filters) |
| `app/(tabs)/favorites.tsx` | `profile.favorites.title`, `profile.favorites.count`, `profile.favorites.empty`, `profile.favorites.emptyDesc` |
| `app/(tabs)/dining-reservations.tsx` | `dining.*` (title, bookTable, viewMenu, selectRestaurant, reservationDetails, diningSection, upToGuests, date, time, partySize, contactPhone, specialRequests, reviewReservation, confirmReservation, editDetails, missingInfo, missingInfoDesc, reservationConfirmed, section, guests, contact, requests, done) |
| `app/(tabs)/services.tsx` | `services.*` (title, requestHistory, noRequests, noRequestsDesc, completed, inProgress, pending, pageDesc, activeRequests, additionalDetails, specialInstructions, estimatedTime, submitRequest, selectService, selectServiceDesc, requestSubmitted, requestSubmittedDesc) |
| `app/(tabs)/profile/index.tsx` | `profile.*` + `common.cancel` (title, logout, logoutConfirmMessage, userLabel, platinum/gold/silver/bronze, loyaltyPoints, pointsToNext, quickLinks, myBookings, upcomingCount, savedHotels, savedCount, myCoupons, activeCount, myReviews, upcomingDining, guest/guests, cancelReservation, cancelTable, keep, cancel, notifications, settings, editProfile, selfCheckin, selfCheckout, hotelServices, writeReview, bookingUpdatedTitle, bookingUpdatedMessage) |

## Keys added to `en.json`
- `home.welcome`, `home.welcomeDesc`, `home.getStarted`, `home.becomeHost`, `home.staysNearby`, `home.staysNearbyHint`
- `profile.favorites.emptyDesc`, `profile.favorites.count`, `profile.favorites.count_plural`
- `profile.upcomingCount`, `profile.savedCount`, `profile.activeCount`, `profile.upcomingDining`, `profile.bookingUpdatedTitle`, `profile.bookingUpdatedMessage`, `profile.userLabel`, `profile.logoutConfirmMessage`, `profile.cancelReservation`, `profile.cancelTable`, `profile.keep`, `profile.cancel`, `profile.guest`, `profile.guests`
- `services.requestHistory`, `services.noRequests`, `services.noRequestsDesc`, `services.additionalDetails`, `services.specialInstructions`, `services.estimatedTime`, `services.submitRequest`, `services.pageDesc`, `services.activeRequests`, `services.activeRequests_plural`, `services.selectService`, `services.selectServiceDesc`, `services.requestSubmitted`, `services.requestSubmittedDesc`, `services.completed`, `services.inProgress`, `services.pending`
- `dining.*` (18 new keys: bookTable, viewMenu, selectRestaurant, reservationDetails, diningSection, upToGuests, date, time, partySize, contactPhone, specialRequests, reviewReservation, confirmReservation, editDetails, missingInfo, missingInfoDesc, reservationConfirmed, phonePlaceholder, specialRequestsPlaceholder, section, guests, contact, requests, done)

## tsc
`npx tsc --noEmit` — **zero new errors** (only pre-existing errors in `app/search-results.tsx`).

## Concerns
- `QUICK_FILTERS` in `search.tsx` was moved inside the component function so `t()` could be called (previously file-level const).
- `dining.guests` key is always "Guests" (capitalized) — the singular/plural distinction was removed in favor of a single key; the alert body uses it in lowercase context but this is acceptable for i18n consistency.
- Alert button text "Done" in dining-reservations and "Cancel"/"Keep" in profile now use i18n keys (`dining.done`, `profile.cancel`, `profile.keep`).
- No logic or styling was touched — only string literals inside `<Text>` and `Alert.alert()` were replaced.
