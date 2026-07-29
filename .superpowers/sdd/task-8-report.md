# Task 8: Update profile hub to link to sub-pages

**Status: Done**

**Summary:** Replaced inline sections (bookings, favorites, coupons, reviews) in `app/(tabs)/profile/index.tsx` with tappable `SectionRow` components that navigate to their respective sub-pages via `router.push()`. Profile card navigates to `about`, added a "Quick Links" section with rows for Bookings, Saved Hotels, Coupons, Reviews, and Notifications, each with count subtitles where applicable. Dining reservations remain inline (local-only data). `npx tsc --noEmit` passes (zero new errors).
