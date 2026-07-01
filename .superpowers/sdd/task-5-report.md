# Task 5 Report: Folio / Invoice Breakdown (BK-020)

## Status: DONE

## Commits

| SHA | Subject |
|-----|---------|
| `75b83a7` | feat(BK-020): add folio breakdown and dynamic cancellation policy |

## Files Created

- `components/feature/folio-breakdown.tsx` — Reusable price breakdown component with line items, subtotal, tax, discount, and total display. Exports `FolioItem` interface and `FolioBreakdown` component.

## Files Modified

- `app/booking-confirmation.tsx`:
  - Imported `FolioBreakdown` and `FolioItem` type
  - Replaced simple "Price Breakdown" card (single total line) with `<FolioBreakdown>` showing per-line-item breakdown, subtotal, tax, and total
  - Added dedicated "Cancellation Policy" section with dynamic text (free cancel 24h before check-in, 1 night charge otherwise)

## Test Summary

Metro bundler starts successfully; TypeScript reports no new errors in modified files (pre-existing error in `auth-context.tsx` unrelated to this task).

## Code Style Compliance

- No `className` on `TouchableOpacity` — all inline styles used
- `useColors()` hook used for theme colors
- Component follows existing patterns in `components/feature/`

## Report Path

`/Users/admin/Desktop/Stay_Easy/stayeasy/.superpowers/sdd/task-5-report.md`
