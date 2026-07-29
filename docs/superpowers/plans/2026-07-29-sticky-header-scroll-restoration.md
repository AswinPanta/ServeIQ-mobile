# StickySearchHeader + ScrollRestoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent search header wrapper and scroll-position restoration across guest-facing screens.

**Architecture:** Two independent modules — a presentational wrapper component (`StickySearchHeader`) that positions children at the top of a screen, and a React hook (`useScrollRestoration`) with module-level scroll-position state that saves/restores scroll offset per route key.

**Tech Stack:** React Native, Expo Router (file-based routing), no new npm dependencies.

## Global Constraints

- All files use TypeScript
- Follow existing patterns in `hooks/` (see `hooks/use-network-status.ts`) and `components/` (see `components/screen-container.tsx`)
- Use NativeWind / Tailwind `className` where possible
- No new npm packages
- `npx tsc --noEmit` must pass after all tasks

---

### Task 1: Create StickySearchHeader component

**Files:**
- Create: `components/StickySearchHeader.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `StickySearchHeader({ children: React.ReactNode })` — a View wrapper that stays at the top of its parent

- [ ] **Step 1: Create the component**

```tsx
import { View } from 'react-native';

interface StickySearchHeaderProps {
  children: React.ReactNode;
}

export function StickySearchHeader({ children }: StickySearchHeaderProps) {
  return (
    <View className="sticky top-0 z-40 w-full px-4 pt-3 bg-background">
      {children}
    </View>
  );
}
```

Note: `sticky` is a placeholder class (NativeWind won't process it for RN). The actual sticky behavior comes from positioning outside ScrollView — this component is a semantic wrapper for consistency.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add components/StickySearchHeader.tsx
git commit -m "feat: add StickySearchHeader wrapper component"
```

---

### Task 2: Create useScrollRestoration hook

**Files:**
- Create: `hooks/use-scroll-restoration.ts`

**Interfaces:**
- Consumes: `scrollRef` (RefObject of ScrollView), `routeKey` (string)
- Produces: `useScrollRestoration(scrollRef, routeKey): void`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect, useCallback, RefObject } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const scrollPositions: Record<string, number> = {};

export function useScrollRestoration(
  scrollRef: RefObject<ScrollView>,
  routeKey: string
) {
  useEffect(() => {
    if (scrollPositions[routeKey] !== undefined) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: scrollPositions[routeKey],
          animated: false,
        });
      });
    }
  }, [routeKey, scrollRef]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions[routeKey] = e.nativeEvent.contentOffset.y;
    },
    [routeKey]
  );

  return handleScroll;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add hooks/use-scroll-restoration.ts
git commit -m "feat: add useScrollRestoration hook with module-level state"
```

---

### Task 3: Wire into guest-search-results.tsx

**Files:**
- Modify: `app/guest-search-results.tsx`

**Interfaces:**
- Consumes: `StickySearchHeader`, `useScrollRestoration`
- Produces: main ScrollView gets scroll restoration

- [ ] **Step 1: Add imports**

```typescript
import { useRef } from 'react';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
```

- [ ] **Step 2: Add ref and hook call inside the component**

```typescript
const scrollRef = useRef<ScrollView>(null);
const routeKey = '/guest-search-results';
const handleScroll = useScrollRestoration(scrollRef, routeKey);
```

- [ ] **Step 3: Assign ref and onScroll to the main ScrollView**

Find the main `<ScrollView>` (wrapping the results list) and add `ref={scrollRef}` and `onScroll={handleScroll}`:

```diff
- <ScrollView style={styles.resultsContainer}>
+ <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16} style={styles.resultsContainer}>
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add app/guest-search-results.tsx
git commit -m "feat: add scroll restoration to guest search results"
```

---

### Task 4: Wire into search-results.tsx

**Files:**
- Modify: `app/search-results.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useRef } from 'react';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
```

- [ ] **Step 2: Add ref and hook**

```typescript
const scrollRef = useRef<FlatList>(null);
const routeKey = '/search-results';
const handleScroll = useScrollRestoration(scrollRef as any, routeKey);
```

Note: `useScrollRestoration` expects `RefObject<ScrollView>`. `FlatList` uses `ScrollView` internally and its ref is compatible with `scrollTo()`. The `as any` cast is acceptable here.

- [ ] **Step 3: Assign ref and onScroll to FlatList**

```diff
- <FlatList
+ <FlatList ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add app/search-results.tsx
git commit -m "feat: add scroll restoration to alt search results"
```

---

### Task 5: Wire into (tabs)/search.tsx

**Files:**
- Modify: `app/(tabs)/search.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useRef } from 'react';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
```

- [ ] **Step 2: Add ref and hook**

```typescript
const scrollRef = useRef<ScrollView>(null);
const routeKey = '/(tabs)/search';
const handleScroll = useScrollRestoration(scrollRef, routeKey);
```

- [ ] **Step 3: Assign ref and onScroll to main ScrollView**

```diff
- <ScrollView
+ <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/search.tsx
git commit -m "feat: add scroll restoration to search tab"
```

---

### Task 6: Wire into (tabs)/index.tsx (HomeScreen)

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { useRef } from 'react';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
```

- [ ] **Step 2: Add ref and hook**

```typescript
const scrollRef = useRef<ScrollView>(null);
const routeKey = '/(tabs)/home';
const handleScroll = useScrollRestoration(scrollRef, routeKey);
```

- [ ] **Step 3: Assign ref and onScroll to main ScrollView**

Find the main `<ScrollView>` and add `ref={scrollRef}` and `onScroll={handleScroll}` with `scrollEventThrottle={16}`.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: add scroll restoration to home screen"
```
