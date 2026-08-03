# Calendar Redesign: Airbnb-Style Date Picker

**Date:** 2026-07-06
**Status:** Approved

## Objective

Redesign the mobile guest-facing date range picker (`DatePickerCalendar`) to match the visual style of Airbnb / modern web booking calendars — circular selection, cleaner typography, better visual hierarchy, and a more premium feel.

## Component to Modify

- **File:** `components/ui/date-picker-calendar.tsx`
- **Exported as:** `DatePickerCalendar`
- **Used in:** `app/(tabs)/search.tsx`, `app/hotel-detail/[id].tsx`, `app/hotel-detail-full/[id].tsx`, `app/guest-hotel-detail/[id].tsx`, `components/feature/search-modal.tsx`

## Design Changes

### 1. Circular Selection
- Selected dates render as **fully filled circles** (not rounded rectangles)
- Check-in: filled circle with primary color (`bg-primary`)
- Check-out: filled circle with dark color (`bg-foreground` / `#111827`)
- Each day cell uses `aspect-ratio: 1` for perfect square → circle fitting

### 2. Range Highlight
- Dates between check-in and check-out get a subtle tinted background (`bg-primary/10`)
- Background connects edge-to-edge between the two circles
- No background on the check-in/check-out circles themselves (they're fully filled)

### 3. Premium Typography
- Day-of-week headers: single uppercase letter (S M T W T F S) in muted color
- Month/year header: `font-semibold text-base`
- Check-in/Check-out labels: uppercase with `text-[10px]` tracking
- Selected dates shown as `"Jun 20"` format (abbreviated month + day)
- Past dates: `text-muted` with `opacity-40`

### 4. Compact Header / Date Summary Bar
- Replace the separate check-in/check-out info card with an inline summary bar at the top
- Layout: `CHECK-IN` | `→` | `CHECK-OUT`
- Shows selected dates inline when chosen, or placeholder text

### 5. Minimum Viable Legend
- Tiny colored circles at the bottom of the calendar: Check-in (blue), Check-out (dark), Night (light blue)
- Small muted label next to each

### 6. Navigation
- Month arrows: minimal `‹` `›` styled as text buttons (no border/rounded containers)
- Day-of-week: single-letter abbreviations for compact layout

### 7. Clear Dates Link
- Replace the "Reset" button with an underlined "Clear dates" text link
- Styled similarly to Airbnb: small, muted, no border

### 8. Auto-apply on Check-out Selection
- When user taps a check-out date (2nd selection), auto-invoke `onSelectDates` and close
- "Apply" button remains at bottom as a fallback for manual close
- Keeps the component easy to dismiss while matching the web flow

## Non-Goals
- No horizontal swipe for month navigation (stays as arrow buttons)
- No dual-month side-by-side layout (mobile single-column only)
- No backend/API integration changes
- No changes to the `DatePickerCalendar` props interface or callers

## Props Interface (Unchanged)

```typescript
interface DatePickerCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDates: (checkIn: Date, checkOut: Date) => void;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
}
```

## Verification
- `npx tsc --noEmit` — zero errors
- Visual check on the 5 consuming screens to confirm rendering
