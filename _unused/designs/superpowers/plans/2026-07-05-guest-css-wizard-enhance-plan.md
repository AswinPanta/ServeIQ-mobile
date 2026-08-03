# Guest CSS Fix + Host Wizard Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Fix guest booking CSS layout issues, patch expo-router state update warning, and enhance host listing wizard with room-level configuration.

**Architecture:** Three independent tracks: (1) patch-package for expo-router node_modules fix, (2) Tailwind/style fixes across guest screens, (3) form enhancements in host wizard + RoomSetup component.

**Tech Stack:** React Native 0.86, Expo SDK 57, expo-router 57, NativeWind/Tailwind, patch-package

**Global Constraints:**
- All guest screens remain at root of `app/` (not moved into `(guest)/`)
- Guest portal color scheme stays coral (#E63946), host stays blue (#2563EB)
- No backend API changes (mock data only)

---

### Task 1: Patch expo-router NavigationContainer

**Files:**
- Modify: `node_modules/expo-router/build/fork/NavigationContainer.js:43-48`
- Modify: `package.json` (add patch-package + postinstall)

- [ ] **Step 1: Install patch-package**

```bash
npm install --save-dev patch-package
```

- [ ] **Step 2: Add postinstall script to package.json**

Edit `package.json` scripts section:
```json
"scripts": {
  "postinstall": "patch-package",
  ...
}
```

- [ ] **Step 3: Add mount guard in NavigationContainer.js**

Edit `NavigationContainer.js` around lines 43-48:

```js
const [lastUnhandledLink, setLastUnhandledLink] = react_1.default.useState();
const _mounted = react_1.default.useRef(false);
react_1.default.useEffect(() => { _mounted.current = true; return () => { _mounted.current = false; }; }, []);
const { getInitialState } = (0, useLinking_1.useLinking)(refContainer, {
    enabled: isLinkingEnabled,
    prefixes: [],
    ...linking,
}, (link) => { if (_mounted.current) setLastUnhandledLink(link); });
```

- [ ] **Step 4: Create the patch**

```bash
npx patch-package expo-router
```

Verify the patch file exists at `patches/expo-router+*.patch`.

---

### Task 2: Fix CRITICAL ActivityIndicator in Text — booking-flow.tsx

**Files:**
- Modify: `app/booking-flow.tsx:950`

- [ ] **Step 1: Fix ActivityIndicator nested inside Text**

Current:
```tsx
<Text className="font-semibold text-white">
  {isSubmitting ? <ActivityIndicator color="white" /> : currentStep === 'payment' ? 'Complete Booking' : 'Continue'}
</Text>
```
Replace with:
```tsx
{isSubmitting ? (
  <ActivityIndicator color="white" />
) : (
  <Text className="font-semibold text-white">
    {currentStep === 'payment' ? 'Complete Booking' : 'Continue'}
  </Text>
)}
```

- [ ] **Step 2: Verify the change reads correctly**

Read the file to confirm the `ActivityIndicator` is no longer inside `<Text>`.

---

### Task 3: Fix guest-search-results nested ScrollView + FlatList

**Files:**
- Modify: `app/guest-search-results.tsx`

- [ ] **Step 1: Restructure to use single FlatList with ListHeaderComponent**

Wrap header/filter elements into `ListHeaderComponent` instead of nesting FlatList inside ScrollView.

---

### Task 4: Fix iOS-only SF Symbols in Tab Bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add Android-compatible icon fallback**

Replace SF Symbol names with cross-platform alternatives from `@expo/vector-icons` (Ionicons):
- `house.fill` → `home` (Ionicons)
- `paperplane.fill` → `search` (Ionicons)
- `heart.fill` → `heart` (Ionicons)
- `person.fill` → `person` (Ionicons)

Use `Platform.OS` to switch between `IconSymbol` (iOS) and `Ionicons` (Android).

---

### Task 5: Fix inline styles and color tokens across guest screens

**Files:**
- Modify: `app/booking-flow.tsx` (multiple locations)
- Modify: `app/booking-confirmation.tsx` (multiple locations)
- Modify: `app/[id].tsx` (router.replace → router.push)
- Modify: `lib/theme-provider.tsx` (remove debug log)

- [ ] **Step 1: Convert inline styles to Tailwind classes**

In each file, replace static layout properties in `style` with Tailwind `className` equivalents:
- `padding` → `p-*`
- `paddingHorizontal` → `px-*`
- `paddingVertical` → `py-*`
- `borderRadius` → `rounded-*`
- `flexDirection: 'row'` → `flex-row`
- `alignItems: 'center'` → `items-center`
- `justifyContent: 'center'` → `justify-center`
- `gap: N` → `gap-N`

- [ ] **Step 2: Replace text-red-500 with text-error**

In `booking-flow.tsx`, find all `text-red-500` and replace with `text-error`.

- [ ] **Step 3: Fix router.replace → router.push in [id].tsx:221**

Change:
```tsx
onPress={() => router.replace({ pathname: '/[id]', params: { id: h.id } })}
```
To:
```tsx
onPress={() => router.push({ pathname: '/[id]', params: { id: h.id } })}
```

- [ ] **Step 4: Remove debug console.log in theme-provider.tsx:64**

Delete line containing `console.log(value, themeVariables)`.

---

### Task 6: Enhance host wizard — property step

**Files:**
- Modify: `app/(host)/index.tsx`

- [ ] **Step 1: Move check-in/out time fields from facilities to property step**

Add check-in/out TextInput fields after the address section in the `case 'property'` block, before amenities.

- [ ] **Step 2: Add custom amenity input**

Add a TextInput + "Add" button below the existing amenity chips. When user types and taps Add, it appends to `selectedAmenities` and appears as a new chip.

- [ ] **Step 3: Remove check-in/out from facilities step**

Delete the check-in/out time section from the `case 'facilities'` block.

- [ ] **Step 4: Remove property-level cancellation policy from facilities step**

Delete the cancellation policy section from the `case 'facilities'` block (moved per-room).

---

### Task 7: Enhance RoomSetup — add per-room cancellation

**Files:**
- Modify: `components/host/RoomSetup.tsx`

- [ ] **Step 1: Add cancellationPolicy to Room interface**

```tsx
interface Room {
  // ...existing fields
  cancellationPolicy: string;
}
```

- [ ] **Step 2: Add cancellation chip selector in room card UI**

Add a row of chips (Flexible/Moderate/Strict) after the price input, similar to room type/bed type selectors.

- [ ] **Step 3: Update addRoom defaults**

```tsx
addRoom sets cancellationPolicy: 'flexible'
```

---

### Task 8: Update handleSubmit to pass per-room cancellation

**Files:**
- Modify: `app/(host)/index.tsx`

- [ ] **Step 1: Pass cancellationPolicy in room creation**

In `handleSubmit`, change:
```tsx
cancellation_policy: 'FLEXIBLE',
```
To:
```tsx
cancellation_policy: r.cancellationPolicy ? r.cancellationPolicy.toUpperCase() : 'FLEXIBLE',
```

---

### Task 9: Run TypeScript check and verify

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Verify expo starts**

```bash
npx expo start --no-dev --minify 2>&1 | head -20
```
