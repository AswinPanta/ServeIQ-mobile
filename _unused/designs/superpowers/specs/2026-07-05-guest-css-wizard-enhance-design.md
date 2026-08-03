# Guest CSS Fix + Host Wizard Enhancements

## Overview

Three independent changes to the StayEasy app:

1. **Patch expo-router** — Fix "state update on unmounted component" warning in NavigationContainer
2. **Fix guest booking CSS** — Layout, styling, and cross-platform issues across guest screens
3. **Enhance host listing wizard** — Room-level cancellation policies, custom amenities, check-in/out in property step

---

## 1. Expo Router State Update Fix

**File:** `node_modules/expo-router/build/fork/NavigationContainer.js`
**Persist via:** `patch-package`

**Change:** Guard `setLastUnhandledLink` with a `mountedRef` so it only fires after mount. Prevents the React 19 warning about async state updates during initial render.

- Add `const _mounted = React.useRef(false)`
- Add `useEffect(() => { _mounted.current = true; return () => { _mounted.current = false; }; }, [])`
- Wrap the `onUnhandledLinking` callback: `(link) => { if (_mounted.current) setLastUnhandledLink(link); }`

---

## 2. Guest Booking CSS Fixes

### 2.1 Critical: ActivityIndicator in `<Text>` — `booking-flow.tsx:950`
- Extract the submit button into a proper conditional rendering

### 2.2 High: Nested ScrollView + FlatList — `guest-search-results.tsx`
- Replace outer ScrollView + inner FlatList with a single FlatList using `ListHeaderComponent` for the header/filter bar

### 2.3 High: iOS-only SF Symbols — `(tabs)/_layout.tsx`
- Add Android-compatible icon names (material/ionicon equivalents)

### 2.4 Medium: Inline styles → Tailwind — `booking-flow.tsx`, `booking-confirmation.tsx`, `guest-search-results.tsx`
- Convert static layout properties (padding, border radius, flex) from `style` to `className`
- Keep dynamic color values in `style` only

### 2.5 Medium: `text-red-500` → `text-error` — `booking-flow.tsx`
- Replace hardcoded Tailwind colors with theme tokens

### 2.6 Low: Remove debug log — `theme-provider.tsx:64`
- Delete `console.log(value, themeVariables)`

### 2.7 Low: `router.replace` → `router.push` — `[id].tsx:221`
- Fix back-navigation for related hotel links

### 2.8 Info: Clean duplicate `global.css` — remove `styles/global.css`

---

## 3. Host Wizard Enhancements

**File:** `app/(host)/index.tsx` and `components/host/RoomSetup.tsx`

### 3.1 Property step — add check-in/out time pickers
- Move check-in/out `TextInput` fields from facilities step to property step
- Place after address fields, before amenities section

### 3.2 Property step — add custom amenity input
- Keep existing amenity toggle chips
- Add a text input + "Add" button for custom amenities
- Custom amenities appear as chips alongside predefined ones

### 3.3 Rooms step — add per-room cancellation policy
- Extend `Room` interface with `cancellationPolicy` field
- Add a chip selector in each room card (Flexible / Moderate / Strict)
- Remove the property-level cancellation policy from facilities step (rooms control their own)

### 3.4 Rooms step — add max occupancy stepper per room
- Currently `maxOccupancy` is a number; add a visible +/- stepper to the room card

### 3.5 Facilities step — simplified
- Remove check-in/out times (moved to property step)
- Remove cancellation policy (moved per-room)
- Keep: house rules, languages, min/max stay

### 3.6 RoomSetup component updates
- Add `cancellationPolicy` to `Room` interface
- Add cancellation chip selector in room card UI
- Improve room type / bed type selection layout

---

## Files Changed

| File | Change |
|------|--------|
| `node_modules/expo-router/build/fork/NavigationContainer.js` | Mount guard + patch-package |
| `app/booking-flow.tsx` | Fix ActivityIndicator + convert inline styles to Tailwind + fix color tokens |
| `app/booking-confirmation.tsx` | Convert inline styles to Tailwind |
| `app/guest-search-results.tsx` | Fix ScrollView+FlatList nesting + convert inline styles |
| `app/(tabs)/_layout.tsx` | Add Android-compatible tab icons |
| `app/(tabs)/search.tsx` | Convert inline styles |
| `app/(tabs)/profile.tsx` | Convert inline styles |
| `app/(tabs)/favorites.tsx` | Convert inline styles |
| `app/[id].tsx` | router.replace → router.push |
| `app/guest-hotel-detail/[id].tsx` | Convert inline styles |
| `app/index.tsx` | Convert inline styles |
| `lib/theme-provider.tsx` | Remove debug log |
| `styles/global.css` | Delete (duplicate) |
| `app/(host)/index.tsx` | Move check-in/out to property step, add custom amenities, per-room cancellation |
| `components/host/RoomSetup.tsx` | Add cancellation policy selector, improve layout |
| `package.json` | Add patch-package devDep + postinstall script |
