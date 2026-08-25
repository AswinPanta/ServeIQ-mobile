# Splash Screen Refinement Design

**Date:** 2026-08-04
**Component:** `components/splash/SplashVisual.tsx`
**Reference:** User-provided storyboard image (9 frames, 8s animation)

## Goal

Refine the existing 8-second animated splash screen to better match the reference design across 5 areas: map detail, landmark illustrations, journey timing, final lockup, and color/glow polish.

## Scope

Single file change: `components/splash/SplashVisual.tsx` (currently 450 lines).
No new dependencies. No changes to `app/index.tsx` or `app/_layout.tsx`.

---

## 1. Nepal Map Outline

**Current:** Stylized 16-point path (`NEPAL_MAP`), scale 2.6, opacity 0.22
**Target:** Higher-fidelity ~40-point outline matching Nepal's actual geography

Replace `NEPAL_MAP` constant with a more detailed SVG path that captures:
- Western Terai bulge (Kailali/Kanchanpur)
- Mid-western hills (Jumla/SHumla)
- Northern border following the Great Himalayan range
- Eastern Mechi strip (Taplejung/Panchthar)
- Southern Terai flat border

Keep the same viewBox (0 0 100 90) and transform (translateX 30, translateY 22, scale 2.6). The strokeDasharray/offset animation remains unchanged — only the path data changes.

---

## 2. Landmark Illustrations

Expand each of the 4 destination landmarks from compact ~48×48 single-path art to more detailed, recognizable line drawings.

### Kathmandu (KTM) — x:95, y:150
**Current:** Basic temple cluster + Dharahara tower
**Target:** Multiple tiered pagoda roofs (3-layer), ornate finials, window details, stupa with eyes (Swayambhunath reference), more architectural detail

### Pokhara (PKR) — x:55, y:100
**Current:** Mountain + lake + boat + ripples
**Target:** Machhapuchhre (Fishtail) double-peak, Phewa Lake with rowing boat, lakeside tree, ripple lines, more mountain texture

### Chitwan (CTW) — x:110, y:195
**Current:** Rhino + grass + watchtower
**Target:** Detailed one-horned rhino with horn and ear, tall grass/reeds, safari watchtower with person, jungle tree canopy

### Nagarkot (NGK) — x:165, y:95
**Current:** Sunrise + mountain ridges + pines
**Target:** Layered mountain ridges (3 layers), rising sun with rays, pine tree cluster, viewpoint platform

Each landmark keeps `draw: [start, end]` timing windows. The `strokeDasharray: 600` and `strokeDashoffset` self-draw animation is preserved — only the `path` data strings change.

---

## 3. Airplane Journey Timing

### Route Lines
**Current:** Solid blue lines with gold glow behind
**Target:** Dashed blue lines matching the reference

Change route segment rendering:
- Main stroke: `ROUTE_BLUE` (#93C5FD), strokeWidth 2
- `strokeDasharray="8 5"` (8px dash, 5px gap) — visible, dashed appearance
- Remove the gold glow behind routes (reference doesn't show it)
- Keep the strokeDashoffset self-draw animation

### Timing Adjustments
Current timing per destination draw window is ~0.07-0.08 progress units (~560-640ms). Adjust to be more evenly paced:

| Segment | Current | Proposed |
|---|---|---|
| Off-screen → KTM | 0.315–0.35 (280ms) | 0.31–0.35 (320ms) |
| KTM draw | 0.35–0.43 (640ms) | 0.35–0.44 (720ms) |
| KTM → PKR | 0.44–0.47 (240ms) | 0.44–0.48 (320ms) |
| PKR draw | 0.48–0.55 (560ms) | 0.48–0.56 (640ms) |
| PKR → CTW | 0.565–0.6 (280ms) | 0.57–0.61 (320ms) |
| CTW draw | 0.61–0.67 (480ms) | 0.61–0.68 (560ms) |
| CTW → NGK | 0.68–0.71 (240ms) | 0.69–0.72 (240ms) |
| NGK draw | 0.72–0.78 (480ms) | 0.72–0.79 (560ms) |
| NGK → settle | 0.79–0.88 (720ms) | 0.79–0.87 (640ms) |

Total journey remains ~5s (0.31–0.87). Slightly longer draw times give each landmark more visual presence.

### Plane
- No changes to plane shape or rotation logic
- Plane opacity: fade out earlier at F9 (0.93 instead of 0.96) to clear for final lockup

---

## 4. Final Lockup Screen (F9)

**Current:** Stage fades to 15% opacity, subtitle appears at top
**Target:** Centered final layout with decorative bottom edge

### Changes at progress >= P.lockup (0.94):

1. **Stage (map/journey):** Fade to 0 opacity (not 15%) — clean transition
2. **Wordmark:** Animate from top position to vertical center
   - `top` interpolates from '11%' to '32%' over 0.94–0.98
   - Scale stays at 1
3. **Subtitle:** Change color from gray (#64748B) to gold (#F59E0B)
   - Keep same fade-in timing (0.93–0.97)
   - Increase font size from 12 to 13
   - Increase letter-spacing from 2.2 to 3
4. **Decorative bottom edge:** Add SVG mountain/tree silhouettes
   - New SVG element below the wordmark
   - Simple line-art: 3 mountain peaks + 5 pine trees
   - Color: BLUE at 0.15 opacity (very subtle)
   - Fades in at 0.95–0.99

### New constant for decorative bottom edge:
```
const DECORATIVE_BOTTOM = {
  mountains: 'M0 40 L30 15 L50 30 L80 5 L110 25 L140 10 L170 35 L200 20 L230 40',
  trees: [x positions for 5 pine trees],
  viewBox: '0 0 230 45',
};
```

---

## 5. Colors and Glow Effects

### Subtitle Color
- **Current:** `GRAY = '#64748B'`
- **Target:** `GOLD = '#F59E0B'` (matches "Easy" wordmark color, matches reference)
- Only affects the subtitle text ("Hospitality Management Platform")

### Logo Glow (F1)
- **Current:** glowOpacity peaks at 0.6, holds until P.lockup then fades to 0, then 0.5 at 0.99
- **Target:** Softer bloom — peak at 0.45, longer ramp-up (0.03–0.12), smoother fade
- New interpolation:
  ```
  inputRange:  [0.03, 0.12, P.logoIn, P.lockup, 0.99]
  outputRange: [0,   0.45, 0.45,  0,      0.35]
  ```

### Route Glow
- **Remove** the gold glow layer behind route segments (6px gold stroke)
- Keep only the dashed blue route line
- simplifies the route rendering G element

### Final Frame Glow
- Add subtle radial glow behind wordmark at F9:
  - Reuse `GLOW` image with `glowOpacity` interpolating to 0.35 at 0.99
  - This is already partially in place — just ensure it shows at the end

---

## Files Changed

| File | Change |
|---|---|
| `components/splash/SplashVisual.tsx` | Replace NEPAL_MAP path, replace 4 DESTINATIONS[].path, adjust timing constants, add dashed routes, add decorative bottom SVG, adjust subtitle color, soften glow, adjust stage fade at F9 |

## Verification

1. `npx tsc --noEmit` — zero errors
2. Visual: Run on iOS simulator, confirm 8s animation plays smoothly
3. Visual: Confirm each frame matches reference storyboard
4. Performance: No frame drops (JS-driven SVG animation is already the bottleneck — no regression expected)
