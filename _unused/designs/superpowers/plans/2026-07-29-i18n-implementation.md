# i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full internationalization to the guest portal with 7 languages.

**Architecture:** i18next + react-i18next + expo-localization. Flat JSON files per language. `PreferencesContext.language` persisted as user's language choice. I18nextProvider wraps entire app in `_layout.tsx`.

**Tech Stack:** i18next, react-i18next, expo-localization, AsyncStorage (via PreferencesContext)

## Global Constraints

- Guest portal only (auth, tabs/home/search/profile, booking flow, guest components)
- 7 languages: en, hi, ne, fr, es, ja, zh-CN
- `PreferencesContext.language` is the source of truth for user's language choice
- Fallback chain: user preference → device locale → 'en'
- All `<Text>` strings replaced with `t('key')` calls
- `npx tsc --noEmit` must pass after each task

---

### Task 1: Install deps + create i18n infrastructure + English translations

**Files:**
- Create: `lib/i18n/index.ts`
- Create: `lib/i18n/locales/en.json`
- Modify: `app/_layout.tsx` (add I18nextProvider)
- Modify: `package.json` (add deps)

**Interfaces:**
- Consumes: `PreferencesContext` (for language persistence)
- Produces: `lib/i18n/index.ts` — exports `i18n` instance (used by I18nextProvider)
- Produces: `lib/i18n/locales/en.json` — all translation keys (referenced by t() calls in all later tasks)

- [ ] **Step 1: Install dependencies**

```bash
npm install i18next react-i18next expo-localization
npx tsc --noEmit
```

- [ ] **Step 2: Create `lib/i18n/index.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ne from './locales/ne.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ne: { translation: ne },
    fr: { translation: fr },
    es: { translation: es },
    ja: { translation: ja },
    'zh-CN': { translation: zhCN },
  },
  lng: Localization.getLocales()?.[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
```

- [ ] **Step 3: Create `lib/i18n/locales/en.json`**

Source-of-truth English file with all ~200 keys:

```json
{
  "common.ok": "OK",
  "common.cancel": "Cancel",
  "common.back": "Back",
  "common.continue": "Continue",
  "common.save": "Save",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.done": "Done",
  "common.search": "Search",
  "common.close": "Close",

  "auth.login.title": "Welcome back!",
  "auth.login.subtitle": "Please enter your details",
  "auth.login.email": "Email",
  "auth.login.emailPlaceholder": "Enter your email",
  "auth.login.password": "Password",
  "auth.login.passwordPlaceholder": "Set your password",
  "auth.login.remember": "Remember for 30 days",
  "auth.login.forgot": "Forgot password?",
  "auth.login.button": "Log In",
  "auth.login.noAccount": "Don't have an account?",
  "auth.login.signup": "Sign up",

  "auth.register.title": "Create account",
  "auth.register.subtitle": "Start finding your stay today",
  "auth.register.name": "Full name",
  "auth.register.namePlaceholder": "Enter your name",
  "auth.register.phone": "Phone",
  "auth.register.phonePlaceholder": "+977-98XXXXXXXX",
  "auth.register.email": "Email",
  "auth.register.emailPlaceholder": "Enter your email",
  "auth.register.password": "Password",
  "auth.register.passwordPlaceholder": "••••••••",
  "auth.register.passwordHint": "Must be 6+ characters.",
  "auth.register.button": "Create Account",
  "auth.register.hasAccount": "Already have an account?",
  "auth.register.login": "Log in",

  "auth.otp.title": "Verify your email",
  "auth.otp.subtitle": "A verification code was sent to your email",
  "auth.otp.code": "Verification code",
  "auth.otp.verify": "Verify OTP",
  "auth.otp.resend": "Didn't receive the code? Resend",
  "auth.otp.success": "Email verified!",
  "auth.otp.successMessage": "Your account has been created successfully.",
  "auth.otp.next": "Next",

  "auth.forgot.title": "Forgot Password",
  "auth.forgot.subtitle": "Enter your email to receive a reset link",
  "auth.forgot.email": "Email",
  "auth.forgot.send": "Send Reset Link",
  "auth.forgot.backToLogin": "Back to Login",

  "auth.reset.title": "Create New Password",
  "auth.reset.password": "New Password",
  "auth.reset.confirmPassword": "Confirm Password",
  "auth.reset.button": "Reset Password",
  "auth.reset.success": "Password reset successfully!",

  "auth.accountCreated.title": "Account Created!",
  "auth.accountCreated.message": "Your account has been created. Start exploring!",
  "auth.accountCreated.next": "Get Started",

  "auth.splash.title": "StayEasy",
  "auth.splash.subtitle": "Find your perfect stay",
  "auth.splash.getStarted": "Get Started",

  "home.title": "Find Hotels",
  "home.subtitle": "Search and book your perfect stay",
  "home.searchPlaceholder": "City or hotel name",
  "home.trending": "Trending destinations",
  "home.popular": "Popular destinations",
  "home.browseByType": "Browse by property type",
  "home.exploreMore": "Explore More Properties",
  "home.seeAll": "See All",

  "search.title": "Search",
  "search.location": "Location",
  "search.locationPlaceholder": "City or hotel name",
  "search.dates": "Check-in / Check-out",
  "search.datesPlaceholder": "Select dates",
  "search.nights": "night(s)",
  "search.guests": "Guests",
  "search.adults": "Adults",
  "search.children": "Children",
  "search.rooms": "Rooms",
  "search.button": "Search Hotels",
  "search.filters": "Quick Filters",
  "search.budget": "Budget",
  "search.luxury": "Luxury",
  "search.nearMe": "Near Me",
  "search.bestRated": "Best Rated",
  "search.noResults": "No properties found",

  "booking.step.rooms": "Rooms",
  "booking.step.guests": "Guests",
  "booking.step.addons": "Add-ons",
  "booking.step.review": "Review",
  "booking.step.payment": "Payment",
  "booking.sessionExpired": "Session expired — rooms no longer held",
  "booking.selectRooms": "Select Rooms",
  "booking.checkin": "Check-in:",
  "booking.checkout": "Check-out:",
  "booking.perNight": "/night",
  "booking.onlyLeft": "Only {{n}} left",
  "booking.guestInfo": "Guest Information",
  "booking.guestInfoSubtitle": "Fill in your details to continue",
  "booking.firstName": "First Name",
  "booking.lastName": "Last Name",
  "booking.email": "Email",
  "booking.phone": "Phone",
  "booking.specialRequests": "Special Requests",
  "booking.specialRequestsPlaceholder": "Any special requests...",
  "booking.reviewTitle": "Review Your Booking",
  "booking.addons": "Add-ons",
  "booking.subtotal": "Subtotal",
  "booking.tax": "Tax (13%)",
  "booking.discount": "Discount",
  "booking.total": "Total",
  "booking.paymentMethod": "Payment Method",
  "booking.card": "Credit/Debit Card",
  "booking.wallet": "Digital Wallet",
  "booking.bankTransfer": "Bank Transfer",
  "booking.razorpay": "Razorpay",
  "booking.cardNumber": "Card Number",
  "booking.cardName": "Cardholder Name",
  "booking.expiry": "Expiry",
  "booking.cvv": "CVV",
  "booking.agree": "By confirming, you agree to our Terms & Conditions and Privacy Policy",
  "booking.back": "Back",
  "booking.continue": "Continue",
  "booking.confirmPay": "Confirm & Pay",

  "confirmation.title": "Booking Confirmed",
  "confirmation.subtitle": "Your reservation has been successfully confirmed",
  "confirmation.code": "CONFIRMATION CODE",
  "confirmation.saveCode": "Save this code for check-in",
  "confirmation.copyCode": "Copy Code",
  "confirmation.hotelDetails": "HOTEL DETAILS",
  "confirmation.statusConfirmed": "Confirmed",
  "confirmation.stayDetails": "STAY DETAILS",
  "confirmation.checkin": "CHECK-IN",
  "confirmation.checkout": "CHECK-OUT",
  "confirmation.nights_one": "{{count}} Night",
  "confirmation.nights_other": "{{count}} Nights",
  "confirmation.guests_one": "{{count}} Guest",
  "confirmation.guests_other": "{{count}} Guests",
  "confirmation.priceBreakdown": "PRICE BREAKDOWN",
  "confirmation.roomNights": "Room ({{nights}} night)",
  "confirmation.roomNights_plural": "Room ({{nights}} nights)",
  "confirmation.taxes": "Taxes & Fees (13%)",
  "confirmation.importantInfo": "IMPORTANT INFORMATION",
  "confirmation.checkinTime": "Check-in time is 2:00 PM onwards",
  "confirmation.photoId": "A valid government-issued photo ID is required",
  "confirmation.breakfast": "Breakfast is included",
  "confirmation.wifi": "Free WiFi is available",
  "confirmation.cancellationPolicy": "CANCELLATION POLICY",
  "confirmation.freeCancellation": "Free cancellation up to 24 hours before check-in",
  "confirmation.qrCode": "BOOKING QR CODE",
  "confirmation.showQr": "Show this QR code at check-in",
  "confirmation.share": "Share Booking",
  "confirmation.download": "Download Receipt",
  "confirmation.backHome": "Back to Home",

  "profile.title": "Profile",
  "profile.logout": "Logout",
  "profile.loyaltyPoints": "Loyalty Points",
  "profile.platinum": "PLATINUM",
  "profile.gold": "GOLD",
  "profile.silver": "SILVER",
  "profile.bronze": "BRONZE",
  "profile.pointsToNext": "{{n}} to {{tier}}",
  "profile.quickLinks": "Quick Links",
  "profile.myBookings": "My Bookings",
  "profile.savedHotels": "Saved Hotels",
  "profile.myCoupons": "My Coupons",
  "profile.myReviews": "My Reviews",
  "profile.notifications": "Notifications",
  "profile.settings": "Settings",
  "profile.editProfile": "Edit Profile",
  "profile.selfCheckin": "Self Check-in",
  "profile.selfCheckout": "Self Check-out",
  "profile.hotelServices": "Hotel Services",
  "profile.writeReview": "Write a Review",

  "profile.about.title": "About Me",
  "profile.about.edit": "Edit",
  "profile.about.save": "Save",
  "profile.about.bio": "Bio",
  "profile.about.bioPlaceholder": "Tell us about yourself",
  "profile.about.dob": "Date of Birth",
  "profile.about.nationality": "Nationality",

  "profile.bookings.title": "My Bookings",
  "profile.bookings.upcoming": "Upcoming",
  "profile.bookings.completed": "Completed",
  "profile.bookings.cancelled": "Cancelled",
  "profile.bookings.empty": "No {{tab}} bookings",
  "profile.bookings.emptyDesc": "You have no {{tab}} reservations",
  "profile.bookings.viewDetails": "View Details",

  "profile.favorites.title": "Favourites",
  "profile.favorites.empty": "No favorites yet",
  "profile.favorites.emptyCTA": "Start exploring",
  "profile.favorites.perNight": "/night",

  "profile.coupons.title": "My Coupons",
  "profile.coupons.active": "Active",
  "profile.coupons.expired": "Expired",
  "profile.coupons.empty": "No coupons",
  "profile.coupons.copied": "Copied!",

  "profile.reviews.title": "My Reviews",
  "profile.reviews.empty": "No reviews yet",
  "profile.reviews.emptyDesc": "Your reviews will appear here after you complete a stay",

  "profile.notifications.title": "Notifications",
  "profile.notifications.markAllRead": "Mark all read",
  "profile.notifications.empty": "No notifications",

  "searchResults.title": "Search Results",
  "searchResults.perNight": "/night",
  "searchResults.bookNow": "Book Now",
  "searchResults.filters": "Filters",
  "searchResults.sort": "Sort by",

  "property.detail.title": "Hotel Details",
  "property.detail.about": "About this property",
  "property.detail.amenities": "Amenities",
  "property.detail.reviews": "Reviews",
  "property.detail.price": "Price",
  "property.detail.rating": "Rating",
  "property.detail.relatedHotels": "Related Hotels",
  "property.detail.bookNow": "Book Now",

  "roomSelect.title": "Select Rooms",
  "roomSelect.chooseRooms": "Choose your rooms",
  "roomSelect.maxGuests": "Max {{n}} guests",
  "roomSelect.perNight": "/night",
  "roomSelect.total": "Total",
  "roomSelect.addToBooking": "Add to Booking",
  "roomSelect.unavailable": "Unavailable",

  "components.whyStayEasy.title": "Why StayEasy?",
  "components.whyStayEasy.subtitle": "We make travel simple and memorable",
  "components.whyStayEasy.secureBooking": "Secure Booking",
  "components.whyStayEasy.support": "24/7 Support",
  "components.whyStayEasy.bestPrice": "Best Price Guarantee",
  "components.whyStayEasy.curated": "Curated Properties",

  "components.testimonials.title": "What travelers say",

  "components.otherHotels.title": "Explore More Properties",
  "components.otherHotels.seeAll": "See All",

  "components.newsletter.title": "Ready for your next adventure?",
  "components.newsletter.subtitle": "Sign up now and receive exclusive deals",
  "components.newsletter.cta": "Get started →",
  "components.newsletter.agree": "I agree to receive email updates",

  "components.propertyType.title": "Browse by property type",
  "components.propertyType.hotels": "Hotels",
  "components.propertyType.apartments": "Apartments",
  "components.propertyType.villa": "Villa",
  "components.propertyType.resort": "Resort",
  "components.propertyType.others": "Others",

  "components.destinations.popular": "Popular destinations",
  "components.destinations.viewAll": "View all →",
  "components.destinations.properties": "{{n}} properties",
  "components.destinations.trending": "Trending destinations",
  "components.destinations.perNight": "/night",

  "components.footer.support": "Support",
  "components.footer.hosting": "Hosting",
  "components.footer.company": "StayEasy",
  "components.footer.legal": "Legal",
  "components.footer.copyright": "© 2026 StayEasy, Inc. All rights reserved.",
  "components.footer.language": "English (US)",
  "components.footer.currency": "$ USD",

  "dining.title": "Dining Reservations",
  "dining.empty": "No dining reservations",
  "dining.cancel": "Cancel reservation?",
  "dining.cancelConfirm": "Cancel your table?",

  "services.title": "Hotel Services",
  "services.empty": "No services available",
  "services.request": "Request Service",

  "country.title": "Explore {{name}}",
  "country.capital": "Capital",
  "country.topAttraction": "Top Attraction",
  "country.cuisine": "Cuisine",
  "country.bestTime": "Best Time to Visit",
  "country.exploreCities": "Explore Cities",
  "country.hotels": "Hotels in {{name}}",
  "country.perNight": "/night",

  "destinations.title": "Destinations",
  "destinations.searchPlaceholder": "Search destinations..."
}
```

- [ ] **Step 4: Add I18nextProvider to `app/_layout.tsx`**

Add imports:
```tsx
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
```

Wrap provider tree — add `I18nextProvider` as outermost provider inside `GestureHandlerRootView`:

```tsx
const content = (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        ...
      </AuthProvider>
    </I18nextProvider>
  </GestureHandlerRootView>
);
```

- [ ] **Step 5: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add lib/i18n/ package.json package-lock.json app/_layout.tsx
git commit -m "feat: add i18n infrastructure with i18next + 7 languages"
```

---

### Task 2: Language switching UI + sync PreferencesContext with i18next

**Files:**
- Create: `hooks/use-app-language.ts`
- Modify: `components/guest/GuestFooter.tsx` (wire language selector)

**Interfaces:**
- Consumes: `lib/i18n/index.ts` (i18n instance), `PreferencesContext` (language state)
- Produces: `hooks/use-app-language.ts`

- [ ] **Step 1: Create `hooks/use-app-language.ts`**

```ts
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/lib/context/preferences-context';
import { useCallback, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
] as const;

export function useAppLanguage() {
  const { i18n } = useTranslation();
  const { preferences, updatePreferences } = usePreferences();

  useEffect(() => {
    const prefLang = preferences.language;
    const currentLang = i18n.language;
    if (prefLang && prefLang !== currentLang && prefLang !== 'en') {
      i18n.changeLanguage(prefLang);
    }
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await i18n.changeLanguage(lang);
    await updatePreferences({ language: lang });
  }, [i18n, updatePreferences]);

  return {
    language: preferences.language || 'en',
    setLanguage,
    availableLanguages: LANGUAGES,
  };
}
```

- [ ] **Step 2: Wire language selector in `GuestFooter.tsx`**

Read the file. Find the language button (currently hardcoded "English (US)").
Replace with:
```tsx
import { useAppLanguage } from '@/hooks/use-app-language';
const { language, setLanguage, availableLanguages } = useAppLanguage();
```

Replace static "English (US)" text with a tappable row that shows current language label.
On press, show an ActionSheet/Modal listing all `availableLanguages`. Selecting one calls `setLanguage(code)`.

Simple inline modal approach:
```tsx
const [showLangPicker, setShowLangPicker] = useState(false);

// In the language button:
<Pressable onPress={() => setShowLangPicker(true)}>
  <IconSymbol name="language" size={16} color="#64748B" />
  <Text>{availableLanguages.find(l => l.code === language)?.label ?? 'English'}</Text>
</Pressable>

// Modal with language list:
<Modal visible={showLangPicker} transparent animationType="slide">
  <View style={/* centered white card */}>
    {availableLanguages.map(lang => (
      <Pressable key={lang.code} onPress={() => { setLanguage(lang.code); setShowLangPicker(false); }}>
        <Text>{lang.label}</Text>
        {language === lang.code && <IconSymbol name="check" size={18} color="#E63946" />}
      </Pressable>
    ))}
  </View>
</Modal>
```

- [ ] **Step 3: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add hooks/use-app-language.ts components/guest/GuestFooter.tsx
git commit -m "feat: add useAppLanguage hook + wire language picker in GuestFooter"
```

---

### Task 3: Migrate auth screens

**Files:**
- Modify: `app/(auth)/login.tsx`, `register.tsx`, `otp-verify.tsx`, `forgot-password.tsx`, `create-new-password.tsx`, `account-created.tsx`, `splash.tsx`

**Pattern for each screen:**
1. Add `import { useTranslation } from 'react-i18next';`
2. Add `const { t } = useTranslation();` in component body
3. Replace every hardcoded string `<Text>Some text</Text>` → `<Text>{t('key')}</Text>`
4. Replace placeholder strings, button titles, labels similarly

**Key mappings for each file:**

- **login.tsx**: `title`→`t('auth.login.title')`, `subtitle`→`'auth.login.subtitle'`, `Email`→`'auth.login.email'`, `Password`→`'auth.login.password'`, `Remember for 30 days`→`'auth.login.remember'`, `Forgot password?`→`'auth.login.forgot'`, `Log In`→`'auth.login.button'`, `Don't have an account?`→`'auth.login.noAccount'`, `Sign up`→`'auth.login.signup'`

- **register.tsx**: `Create account`→`'auth.register.title'`, etc. Map all strings to `auth.register.*` keys.

- **otp-verify.tsx**: All strings → `auth.otp.*` keys.

- **forgot-password.tsx**: All strings → `auth.forgot.*` keys.

- **create-new-password.tsx**: All strings → `auth.reset.*` keys.

- **account-created.tsx**: `Congratulations!`→`'auth.accountCreated.title'`, etc.

- **splash.tsx**: `StayEasy`→`'auth.splash.title'`, `Get Started`→`'auth.splash.getStarted'`

- [ ] **Step 1: Migrate login.tsx**
- [ ] **Step 2: Migrate register.tsx**
- [ ] **Step 3: Migrate otp-verify.tsx**
- [ ] **Step 4: Migrate forgot-password.tsx**
- [ ] **Step 5: Migrate create-new-password.tsx**
- [ ] **Step 6: Migrate account-created.tsx**
- [ ] **Step 7: Migrate splash.tsx**

- [ ] **Step 8: Verify and commit**

```bash
npx tsc --noEmit
git add app/\(auth\)/
git commit -m "feat: i18n auth screens (login, register, otp, forgot, reset, account-created, splash)"
```

---

### Task 4: Migrate booking flow screens

**Files:**
- Modify: `app/booking-flow.tsx`, `app/booking-summary.tsx`, `app/booking-confirmation.tsx`

**Pattern same as Task 3.** Map strings to `booking.*` and `confirmation.*` keys.

- **booking-flow.tsx**: Steps (Rooms/Guests/Add-ons/Review/Payment) → `'booking.step.*'`, all UI text → `'booking.*'`. The session expired timer text → `'booking.sessionExpired'`. Scarcity badge "Only {n} left" → `t('booking.onlyLeft', { n })`. Guest info fields → `'booking.firstName'` etc. Payment method names → `'booking.card'`, `'booking.wallet'`, `'booking.bankTransfer'`, `'booking.razorpay'`.

- **booking-summary.tsx**: Map all strings to `confirmation.*` keys.

- **booking-confirmation.tsx**: Plural nights/guests → `t('confirmation.nights', { count: n })`, `t('confirmation.guests', { count: n })`. Copy code → `'confirmation.copyCode'`.

- [ ] **Step 1: Migrate booking-flow.tsx**
- [ ] **Step 2: Migrate booking-summary.tsx**
- [ ] **Step 3: Migrate booking-confirmation.tsx**

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add app/booking-flow.tsx app/booking-summary.tsx app/booking-confirmation.tsx
git commit -m "feat: i18n booking flow screens (booking-flow, summary, confirmation)"
```

---

### Task 5: Migrate home/tab screens + profile hub

**Files:**
- Modify: `app/(tabs)/index.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/dining-reservations.tsx`, `app/(tabs)/services.tsx`, `app/(tabs)/profile/index.tsx`

**Pattern same as Task 3.** Map strings to `home.*`, `search.*`, `profile.*`, `dining.*`, `services.*` keys.

- [ ] **Step 1: Migrate (tabs)/index.tsx**
- [ ] **Step 2: Migrate (tabs)/search.tsx**
- [ ] **Step 3: Migrate (tabs)/favorites.tsx**
- [ ] **Step 4: Migrate (tabs)/dining-reservations.tsx**
- [ ] **Step 5: Migrate (tabs)/services.tsx**
- [ ] **Step 6: Migrate (tabs)/profile/index.tsx**

- [ ] **Step 7: Verify and commit**

```bash
npx tsc --noEmit
git add app/\(tabs\)/
git commit -m "feat: i18n tab screens (home, search, favorites, dining, services, profile)"
```

---

### Task 6: Migrate profile sub-pages

**Files:**
- Modify: `app/(tabs)/profile/about.tsx`, `bookings.tsx`, `favorites.tsx`, `coupons.tsx`, `reviews.tsx`, `notifications.tsx`

**Pattern same as Task 3.** Map strings to `profile.about.*`, `profile.bookings.*`, etc.

- [ ] **Step 1: Migrate about.tsx**
- [ ] **Step 2: Migrate bookings.tsx**
- [ ] **Step 3: Migrate favorites.tsx**
- [ ] **Step 4: Migrate coupons.tsx**
- [ ] **Step 5: Migrate reviews.tsx**
- [ ] **Step 6: Migrate notifications.tsx**

- [ ] **Step 7: Verify and commit**

```bash
npx tsc --noEmit
git add app/\(tabs\)/profile/
git commit -m "feat: i18n profile sub-pages (about, bookings, favorites, coupons, reviews, notifications)"
```

---

### Task 7: Migrate guest components

**Files:**
- Modify: `components/guest/WhyStayEasy.tsx`, `Testimonials.tsx`, `OtherHotels.tsx`, `NewsletterCTA.tsx`, `TrustBadges.tsx`, `PropertyTypeBrowser.tsx`, `PopularDestinations.tsx`, `TrendingDestinations.tsx`

**Pattern same as Task 3.** Map strings to `components.*` keys.

- [ ] **Step 1: Migrate WhyStayEasy.tsx**
- [ ] **Step 2: Migrate Testimonials.tsx**
- [ ] **Step 3: Migrate OtherHotels.tsx**
- [ ] **Step 4: Migrate NewsletterCTA.tsx**
- [ ] **Step 5: Migrate TrustBadges.tsx**
- [ ] **Step 6: Migrate PropertyTypeBrowser.tsx**
- [ ] **Step 7: Migrate PopularDestinations.tsx**
- [ ] **Step 8: Migrate TrendingDestinations.tsx**

- [ ] **Step 9: Verify and commit**

```bash
npx tsc --noEmit
git add components/guest/
git commit -m "feat: i18n guest components (WhyStayEasy, Testimonials, etc.)"
```

---

### Task 8: Migrate remaining screens

**Files:**
- Modify: `app/country/[code].tsx`, `app/destinations.tsx`, `app/notifications.tsx`, `app/profile-edit.tsx`

**Pattern same as Task 3.** Map strings to `country.*`, `destinations.*`, `notificationsScreen.*`, `profileEdit.*` keys.

- [ ] **Step 1: Migrate country/[code].tsx**
- [ ] **Step 2: Migrate destinations.tsx**
- [ ] **Step 3: Migrate notifications.tsx**
- [ ] **Step 4: Migrate profile-edit.tsx**

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add app/country/ app/destinations.tsx app/notifications.tsx app/profile-edit.tsx
git commit -m "feat: i18n remaining screens (country, destinations, notifications, profile-edit)"
```

---

### Task 9: Create additional translation files (6 languages)

**Files:**
- Create: `lib/i18n/locales/hi.json`, `ne.json`, `fr.json`, `es.json`, `ja.json`, `zh-CN.json`

**Process:**
1. Copy `en.json` as template for each language
2. Translate all string values to the target language
3. Keep all keys exactly the same

**Note:** For `zh-CN.json` use `zh-CN` as the import key and filename (with hyphen).

- [ ] **Step 1: Create all 6 translation files with translated content**

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add lib/i18n/locales/
git commit -m "feat: add translation files for hi, ne, fr, es, ja, zh-CN"
```
