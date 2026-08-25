# StickySearchHeader + ScrollRestoration — Design

## Summary

Two small React Native features ported from `Thadaw/ServeIQ2.0` that improve navigation UX: a persistent search bar and automatic scroll-to-top/restore on route changes.

## StickySearchHeader

**What it does:** A thin wrapper component that renders a fixed-position container at the top of a screen, always visible above the scrollable content.

**Implementation (Option B — recommended):**

```tsx
// components/StickySearchHeader.tsx
export function StickySearchHeader({ children }: { children: React.ReactNode }) {
  return (
    <View className="sticky top-0 z-40 w-full px-4 pt-3 bg-background">
      {children}
    </View>
  );
}
```

In React Native `sticky` class won't work natively, but we use it as a shared wrapper via `stickyHeaderIndices` on `ScrollView` on iOS, or via absolute positioning outside `ScrollView` for cross-platform consistency.

**Usage:** Wrap the search bar on search results pages and home screen hero search:

```tsx
<StickySearchHeader>
  <SearchBar />
</StickySearchHeader>
```

**Trade-offs considered:**
- Option A (`stickyHeaderIndices` on ScrollView) — iOS only, no Android support
- **Option B (recommended):** Fixed View outside ScrollView — works on all platforms, CSS-like feel with flex layout

## ScrollRestoration

**What it does:** Saves and restores scroll position per route when navigating back/forward in the stack.

**Implementation:**

```tsx
// hooks/use-scroll-restoration.ts
const scrollPositions: Record<string, number> = {}

export function useScrollRestoration(
  scrollRef: React.RefObject<ScrollView>,
  routeKey: string
) {
  useEffect(() => {
    if (scrollPositions[routeKey] !== undefined) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: scrollPositions[routeKey], animated: false })
      })
    }
    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions[routeKey] = e.nativeEvent.contentOffset.y
    }
    const scrollView = scrollRef.current
    scrollView?.addListener('scroll', handleScroll)
    return () => {
      scrollView?.removeListener('scroll', handleScroll)
    }
  }, [routeKey])
}
```

**Where applied:**
- `app/(tabs)/index.tsx` (home scroll)
- `app/guest-search-results.tsx` (search results)
- `app/search-results.tsx` (alt search results)
- `app/(tabs)/search.tsx` (search form)

## Files to create
- `components/StickySearchHeader.tsx`
- `hooks/use-scroll-restoration.ts`

## Files to modify
- `app/guest-search-results.tsx` — wrap search bar with `StickySearchHeader`, apply `useScrollRestoration`
- `app/search-results.tsx` — same
- `app/(tabs)/search.tsx` — same
- `app/(tabs)/index.tsx` — apply `useScrollRestoration`
