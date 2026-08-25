# Splash Screen Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing 8-second animated splash screen to match the reference storyboard — better map detail, richer landmarks, dashed routes, polished final lockup, and refined colors/glows.

**Architecture:** Single-file change to `components/splash/SplashVisual.tsx`. All modifications are constant data replacements (paths, timing) and interpolation adjustments. No new dependencies, no new files.

**Tech Stack:** React Native `Animated` API (JS driver), `react-native-svg`, `expo-image`, `expo-linear-gradient`

## Global Constraints

- File: `components/splash/SplashVisual.tsx` only
- No new npm packages
- `npx tsc --noEmit` must pass with zero errors after each task
- SVG viewBox stays 320×280, map transform stays (translateX 30, translateY 22, scale 2.6)
- `SPLASH_TOTAL = 8000` (8s) unchanged
- All animations use `useNativeDriver: false` (JS driver for SVG props)

---

### Task 1: Replace Nepal Map Outline

**Files:**
- Modify: `components/splash/SplashVisual.tsx:99-102` (the `NEPAL_MAP` constant)

**Interfaces:**
- Consumes: nothing (standalone constant)
- Produces: `NEPAL_MAP` string used by `AnimatedPath` at line 234

- [ ] **Step 1: Replace the NEPAL_MAP constant**

Replace lines 99-102 with a higher-fidelity Nepal boundary path. The new path uses ~40 points to capture the country's actual geography — the western Terai bulge, mid-western hills, northern Himalayan border, eastern Mechi strip, and southern flat border.

```typescript
// Stylized Nepal silhouette (viewBox 0 0 100 90) — higher fidelity
const NEPAL_MAP =
  'M18 12 L22 8 L28 10 L32 6 L38 8 L44 4 L50 7 L56 5 L62 8 L68 5 '
  + 'L74 9 L80 6 L86 10 L90 14 L88 20 L92 26 L88 32 L91 38 L86 44 '
  + 'L82 50 L78 56 L72 62 L66 68 L60 72 L54 76 L48 80 L42 78 L36 82 '
  + 'L30 80 L24 84 L18 78 L14 70 L10 62 L7 52 L5 44 L8 36 L5 28 '
  + 'L10 20 L16 16 L18 12 Z';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: replace Nepal map outline with higher-fidelity path"
```

---

### Task 2: Replace Landmark Illustrations

**Files:**
- Modify: `components/splash/SplashVisual.tsx:61-90` (the `DESTINATIONS` array)

**Interfaces:**
- Consumes: nothing (standalone constants)
- Produces: `DESTINATIONS[].path` strings used by `AnimatedPath` at line 307, `DESTINATIONS[].draw` timing used for self-draw interpolation

- [ ] **Step 1: Replace DESTINATIONS array with detailed landmarks**

Replace lines 61-90. Each landmark gets a richer path. The `draw` timing windows are updated per the spec's timing table. Positions (x, y) stay the same.

```typescript
const DESTINATIONS: Dest[] = [
  {
    key: 'KTM', label: 'Kathmandu', x: 95, y: 150, draw: [0.35, 0.44],
    // Multi-tier pagoda temples + stupa with eyes + Dharahara tower
    path:
      // Base platform
      'M2 44 H22 M4 44 L4 42 H20 V44 '
      // Pagoda tier 1 (large)
      + 'M6 42 L10 38 H14 L18 42 M10 38 V36 H14 V38 '
      // Pagoda tier 2 (medium)
      + 'M8 36 L10 33 H14 L16 36 M10 33 V31 H14 V33 '
      // Pagoda tier 3 (small) + finial
      + 'M10 31 L11 29 H13 L14 31 M12 29 V27 '
      // Stupa (Swayambhunath)
      + 'M26 44 V38 Q26 34 30 34 Q34 34 34 38 V44 '
      + 'M28 36 a2 2 0 1 0 0.01 0 M32 36 a2 2 0 1 0 0.01 0 '
      // Dharahara tower
      + 'M38 44 V30 L40 26 H42 L44 30 V44 M40 26 V20 '
      + 'M39 36 H43 M39 32 H43',
  },
  {
    key: 'PKR', label: 'Pokhara', x: 55, y: 100, draw: [0.48, 0.56],
    // Machhapuchhre (Fishtail) double-peak + Phewa Lake + boat + tree
    path:
      // Mountain range
      'M2 34 L8 18 L12 24 L16 12 L20 20 L24 8 L28 18 L32 14 L38 34 '
      // Fishtail double-peak emphasis
      + 'M16 12 L18 16 L20 8 L22 16 L24 8 '
      // Lake shoreline
      + 'M2 42 H42 '
      // Lake ripples
      + 'M8 44 q4 -2 8 0 M20 44 q4 -2 8 0 M32 44 q4 -2 6 0 '
      // Boat on lake
      + 'M18 40 L22 38 L26 40 L22 42 Z M22 38 V35 L26 37 '
      // Lakeside tree
      + 'M36 42 V34 M36 34 L33 30 M36 34 L39 30 M36 30 L34 26 L36 24 L38 26 L36 30',
  },
  {
    key: 'CTW', label: 'Chitwan', x: 110, y: 195, draw: [0.61, 0.68],
    // One-horned rhino + tall grass + safari watchtower + jungle canopy
    path:
      // Rhino body
      'M6 34 Q4 30 8 28 Q12 26 16 28 Q20 30 22 34 Q24 36 26 34 '
      // Rhino head + horn
      + 'M6 34 L4 32 Q3 30 5 28 L7 26 '
      // Rhino legs
      + 'M10 34 V38 M16 34 V38 M22 34 V38 M26 34 L26 38 '
      // Rhino ear
      + 'M7 28 L5 26 L8 27 '
      // Tall grass/reeds
      + 'M30 42 V32 M30 32 L28 28 M30 32 L32 28 M30 34 L27 30 M30 34 L33 30 '
      + 'M36 42 V30 M36 30 L34 26 M36 30 L38 26 '
      // Safari watchtower
      + 'M40 42 V28 L44 24 L48 28 V42 M40 32 H48 M44 24 V20 '
      // Jungle canopy
      + 'M2 42 H28 M36 42 H48',
  },
  {
    key: 'NGK', label: 'Nagarkot', x: 165, y: 95, draw: [0.72, 0.79],
    // Sunrise + layered mountain ridges + pine cluster + viewpoint
    path:
      // Sun
      'M22 22 a6 6 0 0 1 12 0 M28 14 V10 M20 18 L17 15 M36 18 L39 15 '
      + 'M22 18 L18 16 M34 18 L38 16 '
      // Mountain ridge 1 (foreground)
      + 'M2 36 L8 28 L14 32 L20 24 L26 30 L32 22 L38 28 L44 24 L48 30 '
      // Mountain ridge 2 (background)
      + 'M0 40 L6 34 L12 38 L18 30 L24 36 L30 28 L36 34 L42 30 L48 36 '
      // Pine trees
      + 'M8 42 V34 L5 30 L11 30 L8 34 M8 30 L6 26 L10 26 L8 30 '
      + 'M38 42 V36 L36 32 L40 32 L38 36 '
      // Ground
      + 'M2 42 H48',
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: replace landmark illustrations with detailed line art"
```

---

### Task 3: Refine Route Lines and Journey Timing

**Files:**
- Modify: `components/splash/SplashVisual.tsx:104-121` (ROUTE_SEGMENTS, FLIGHT_PTS, PLANE_X/Y, ROT_PTS/ANGLES)
- Modify: `components/splash/SplashVisual.tsx:253-286` (route rendering in JSX)

**Interfaces:**
- Consumes: `progress` Animated.Value
- Produces: updated route segment draw timing, dashed rendering

- [ ] **Step 1: Update ROUTE_SEGMENTS timing and distances**

Replace lines 104-111. Adjusted timing per the spec's timing table, with corrected segment lengths.

```typescript
// Route segments drawn in real time behind the plane
const ROUTE_SEGMENTS = [
  { d: 'M-34 224 L95 150', draw: [0.31, 0.35], len: 200 },
  { d: 'M95 150 L55 100', draw: [0.44, 0.48], len: 100 },
  { d: 'M55 100 L110 195', draw: [0.57, 0.61], len: 150 },
  { d: 'M110 195 L165 95', draw: [0.69, 0.72], len: 150 },
  { d: 'M165 95 L160 140', draw: [0.79, 0.87], len: 80 },
];
```

- [ ] **Step 2: Update plane keyframes to match new timing**

Replace lines 117-121 with updated flight points and rotation angles matching the new segment timing.

```typescript
// Plane keyframes (holds at each destination while it self-draws)
const FLIGHT_PTS = [0.31, 0.35, 0.44, 0.48, 0.57, 0.61, 0.69, 0.72, 0.79, 0.87, 0.93];
const PLANE_X = [-34, 95, 95, 55, 55, 110, 110, 165, 165, 160, 160];
const PLANE_Y = [224, 150, 150, 100, 100, 195, 195, 95, 95, 140, 140];
const ROT_PTS = [0.31, 0.35, 0.44, 0.48, 0.57, 0.61, 0.69, 0.72, 0.79, 0.87];
const ROT_ANGLES = [-29.8, -29.8, -128.7, -128.7, 60, 60, -61.2, -61.2, 96.3, 96.3];
```

- [ ] **Step 3: Update plane opacity to fade out earlier**

In the `planeOpacity` interpolation (line 186-190), change the fade-out from `P.lockup + 0.02` to `P.lockup` so the plane disappears cleanly before the final lockup.

```typescript
  const planeOpacity = progress.interpolate({
    inputRange: [P.journey - 0.005, P.journey, P.lockup - 0.02, P.lockup],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
```

- [ ] **Step 4: Replace route rendering with dashed lines, remove gold glow**

Replace lines 253-286 (the route segments mapping). Change from solid+glow to dashed lines only.

```typescript
          {/* Route segments — dashed blue lines drawn in real time */}
          {ROUTE_SEGMENTS.map((seg, i) => {
            const offset = progress.interpolate({
              inputRange: seg.draw,
              outputRange: [seg.len, 0],
              extrapolate: 'clamp',
            });
            return (
              <AnimatedPath
                key={i}
                d={seg.d}
                stroke={ROUTE_BLUE}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="8 5"
                strokeDashoffset={offset}
              />
            );
          })}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 6: Commit**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: dashed route lines and refined journey timing"
```

---

### Task 4: Refine Final Lockup Screen

**Files:**
- Modify: `components/splash/SplashVisual.tsx:166-176` (wordmark/stage/subtitle interpolations)
- Modify: `components/splash/SplashVisual.tsx:192-223` (JSX: brand wrap positioning, subtitle color)
- Modify: `components/splash/SplashVisual.tsx:378-450` (StyleSheet)

**Interfaces:**
- Consumes: `progress` Animated.Value, `P.lockup`
- Produces: centered wordmark at F9, decorative bottom SVG, gold subtitle

- [ ] **Step 1: Add wordmark centering interpolation**

After line 166 (subtitleOpacity), add a new interpolation to move the wordmark from top to center at F9:

```typescript
  // ─── F9: wordmark moves to center ────────────────────────────────────────
  const wordmarkTop = progress.interpolate({
    inputRange: [P.lockup - 0.04, P.lockup + 0.02],
    outputRange: [11, 32],
    extrapolate: 'clamp',
  });
  const decorativeOpacity = progress.interpolate({
    inputRange: [P.lockup, P.lockup + 0.04],
    outputRange: [0, 0.15],
    extrapolate: 'clamp',
  });
```

- [ ] **Step 2: Update stage opacity to fade completely at F9**

Change line 169-173 — the stage should fade to 0 at F9 (not 0.15):

```typescript
  const stageOpacity = progress.interpolate({
    inputRange: [P.mapIn, 0.3, P.lockup - 0.04, P.lockup],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
```

- [ ] **Step 3: Update brandWrap to use animated top position**

Replace the first brandWrap (line 200-208) — the SE logo bloom — to use `wordmarkTop` for positioning during F9. The logo bloom fades out before F9, so this only affects the wordmark wrap below.

Replace the wordmark `brandWrap` (lines 210-223) to use animated top:

```typescript
      <Animated.View
        pointerEvents="none"
        style={[styles.brandWrap, {
          opacity: wordmarkOpacity,
          top: `${wordmarkTop}%`,
          transform: [{ scale: seScale }],
        }]}
      >
        <View style={styles.wordmarkRow}>
          <Animated.Text style={[styles.wordmark, styles.wordmarkBlue, { transform: [{ translateX: sX }] }]}>S</Animated.Text>
          <Animated.Text style={[styles.wordmarkMid, styles.wordmarkBlue, { opacity: tayOpacity, transform: [{ translateY: tayY }] }]}>tay</Animated.Text>
          <Animated.Text style={[styles.wordmark, styles.wordmarkGold, { transform: [{ translateX: eX }] }]}>E</Animated.Text>
          <Animated.Text style={[styles.wordmarkMid, styles.wordmarkGold, { opacity: asyOpacity, transform: [{ translateY: asyY }] }]}>asy</Animated.Text>
        </View>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Hospitality Management Platform
        </Animated.Text>
      </Animated.View>
```

- [ ] **Step 4: Add decorative mountain/tree SVG below the wordmark**

After the wordmark `Animated.View` closing tag (line 223), add a decorative bottom edge SVG:

```typescript
      {/* Decorative mountain/tree silhouettes (F9) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.decorativeWrap, { opacity: decorativeOpacity }]}
      >
        <Svg width={280} height={50} viewBox="0 0 280 50">
          <G>
            {/* Mountain ridges */}
            <Path
              d="M0 45 L30 20 L50 32 L80 12 L110 28 L140 8 L170 25 L200 15 L230 30 L260 22 L280 45"
              stroke={BLUE}
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="none"
            />
            {/* Pine trees */}
            <Path d="M35 45 V36 L30 30 L40 30 L35 36 M35 30 L32 25 L38 25 L35 30" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M85 45 V38 L81 33 L89 33 L85 38" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M145 45 V34 L140 28 L150 28 L145 34 M145 28 L142 23 L148 23 L145 28" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M205 45 V36 L201 31 L209 31 L205 36" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M250 45 V38 L246 33 L254 33 L250 38 M250 33 L247 28 L253 28 L250 33" stroke={BLUE} strokeWidth={1.2} fill="none" />
          </G>
        </Svg>
      </Animated.View>
```

- [ ] **Step 5: Update subtitle color from gray to gold**

In the StyleSheet, change the `subtitle` color:

```typescript
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
```

- [ ] **Step 6: Add decorativeWrap style to StyleSheet**

Add to the StyleSheet (after `planeWrap`):

```typescript
  decorativeWrap: {
    position: 'absolute',
    bottom: '8%',
    width: '100%',
    alignItems: 'center',
  },
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 8: Commit**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: centered final lockup with decorative mountains and gold subtitle"
```

---

### Task 5: Polish Colors and Glow Effects

**Files:**
- Modify: `components/splash/SplashVisual.tsx:144-155` (logo/glow interpolations)
- Modify: `components/splash/SplashVisual.tsx:386-406` (brandWrap/glow styles)

**Interfaces:**
- Consumes: `progress` Animated.Value, `P.logoIn`, `P.lockup`
- Produces: softer glow bloom, final frame glow behind wordmark

- [ ] **Step 1: Soften the glow opacity curve**

Replace lines 151-155 with a softer bloom — peak at 0.45, longer ramp-up, smoother fade:

```typescript
  const glowOpacity = progress.interpolate({
    inputRange: [0.03, 0.12, P.logoIn, P.lockup, 0.99],
    outputRange: [0, 0.45, 0.45, 0, 0.35],
    extrapolate: 'clamp',
  });
```

- [ ] **Step 2: Make glow wrap larger for softer bloom**

In the StyleSheet, increase the glow dimensions:

```typescript
  glowWrap: {
    position: 'absolute',
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 320,
    height: 320,
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: soften glow bloom and add final frame glow"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: Visual smoke test on iOS simulator**

Run: `npx expo start --ios`
Verify:
- F1 (0-1s): SE logo appears with soft glow, no harsh edges
- F2 (1-2s): SE splits, "ServeIQ" appears in blue+gold, Nepal map fades in
- F3 (2-2.5s): Map outline visible, faint destination dots
- F4 (2.5-3.5s): Paper airplane enters, dashed route line draws, Kathmandu temples draw
- F5 (3.5-4.5s): Route continues, Pokhara mountains/lake draw
- F6 (4.5-5.4s): Chitwan rhino/watchtower draw
- F7 (5.4-6.3s): Nagarkot sunrise/mountains draw
- F8 (6.3-7.5s): Zoom out, Lumbini/Mustang/Everest pins appear
- F9 (7.5-8s): Map fades, wordmark centers, "HOSPITALITY MANAGEMENT PLATFORM" in gold, decorative mountains at bottom

- [ ] **Step 3: Performance check**

Confirm no frame drops during the 8s animation. The JS-driven SVG is the bottleneck — no regression expected since we only changed path data and interpolation values.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add components/splash/SplashVisual.tsx
git commit -m "splash: final refinement polish"
```
