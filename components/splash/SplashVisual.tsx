import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  G,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

const LOGO = require('@/assets/images/logo1.png');
const GLOW = require('@/assets/images/logo-glow-aura.png');

// ─── Brand palette ───────────────────────────────────────────────────────────
const BLUE = '#2563EB';
const GOLD = '#F59E0B';
const INK = '#1E293B';
const GRAY = '#64748B';
const BG = '#FAFAFA';
const ROUTE_BLUE = '#93C5FD';

// ─── Master clock: 0 → 1 over 8s (JS-driven so SVG props animate) ───────────
// Shared with app/index.tsx so the splash and its navigation stay in sync.
export const SPLASH_TOTAL = 8000;
const SPLASH_MS = SPLASH_TOTAL;

// Storyboard (8 frames)
// F1 0–1s logo bloom · F2 1–2s S/E split → wordmark + map appears ·
// F3 2–2.5s map alive · F4–F7 2.5–6.3s KTM→PKR→CTW→NGK journey ·
// F8 6.3–7.5s zoom-out + LUM/MUS/EBC pins · F9 7.5–8s lockup + subtitle
const P = {
  logoIn: 0.14,      // F2 wordmark begins
  mapIn: 0.16,
  journey: 0.315,
  zoom: 0.8,
  lockup: 0.94,
};

// ─── Stage geometry (viewBox 320×280) ───────────────────────────────────────
interface Dest {
  key: string;
  label: string;
  x: number;
  y: number;
  path: string;      // single-path line-art landmark (48×48) that self-draws
  draw: [number, number]; // self-draw progress window
}

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

// Extra pins revealed at the zoom-out
const EXTRA_PINS = [
  { key: 'LUM', label: 'Lumbini', x: 30, y: 175 },
  { key: 'MUS', label: 'Mustang', x: 85, y: 45 },
  { key: 'EBC', label: 'Everest', x: 215, y: 50 },
];

// Nepal silhouette (viewBox 0 0 100 80) — traced from geographic outline
const NEPAL_MAP =
  // Western protrusion (Mahakali zone — the "nose" of Nepal)
  'M8 22 L4 18 L3 14 L5 10 L8 8 L12 6 L16 8 L18 12 L16 16 L14 18 '
  // Northern border — jagged Himalayan ridge (west → east)
  + 'L18 14 L22 10 L26 12 L30 8 L34 10 L38 6 L42 9 L46 5 L50 8 '
  + 'L54 4 L58 7 L62 5 L66 8 L70 4 L74 7 L78 5 L82 8 L86 6 L90 10 '
  // Eastern tip
  + 'L93 14 L94 18 L93 22 '
  // Southern border — smooth Terai plains (east → west)
  + 'L90 26 L86 30 L82 34 L78 38 L74 42 L70 46 L66 50 L62 54 L58 57 '
  + 'L54 60 L50 63 L46 65 L42 67 L38 69 L34 70 L30 71 L26 72 L22 72 '
  + 'L18 71 L14 69 L10 66 L8 62 L6 56 L5 50 L5 44 L6 38 L7 32 L8 26 L8 22 Z';

// Route segments drawn in real time behind the plane
const ROUTE_SEGMENTS = [
  { d: 'M-34 224 L95 150', draw: [0.315, 0.35], len: 200 },
  { d: 'M95 150 L55 100', draw: [0.44, 0.47], len: 100 },
  { d: 'M55 100 L110 195', draw: [0.565, 0.6], len: 150 },
  { d: 'M110 195 L165 95', draw: [0.68, 0.71], len: 150 },
  { d: 'M165 95 L160 140', draw: [0.79, 0.88], len: 80 },
];

// Paper airplane (viewBox centered on 0,0 so translate = position)
const PLANE = 'M-13 0 L12 -5 L6 0 L12 5 L-13 0 Z';

// Plane keyframes (holds at each destination while it self-draws)
const FLIGHT_PTS = [0.315, 0.35, 0.44, 0.47, 0.565, 0.6, 0.68, 0.71, 0.79, 0.88, 0.94];
const PLANE_X = [-34, 95, 95, 55, 55, 110, 110, 165, 165, 160, 160];
const PLANE_Y = [224, 150, 150, 100, 100, 195, 195, 95, 95, 140, 140];
const ROT_PTS = [0.315, 0.35, 0.44, 0.47, 0.565, 0.6, 0.68, 0.71, 0.79, 0.88];
const ROT_ANGLES = [-29.8, -29.8, -128.7, -128.7, 60, 60, -61.2, -61.2, 96.3, 96.3];

type Props = {
  splashStart: number;
};

export default function SplashVisual({ splashStart }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const elapsed = Date.now() - splashStart;
    const startAt = Math.min(1, Math.max(0, elapsed / SPLASH_MS));
    progress.setValue(startAt);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_MS * (1 - startAt),
      easing: Easing.linear,
      useNativeDriver: false, // SVG props need the JS driver
    });
    anim.start();
    return () => anim.stop();
  }, [splashStart, progress]);

  // ─── F1: SE logo bloom (wordmark position, top) ───────────────────────────
  const logoOpacity = progress.interpolate({
    inputRange: [0.03, 0.08, P.logoIn, P.logoIn + 0.03],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const logoScale = progress.interpolate({ inputRange: [0.05, 0.1], outputRange: [0.8, 1], extrapolate: 'clamp' });
  const glowOpacity = progress.interpolate({
    inputRange: [0.05, 0.1, P.logoIn, P.lockup, 0.99],
    outputRange: [0, 0.6, 0.6, 0, 0.5],
    extrapolate: 'clamp',
  });

  // ─── F2: S/E split → StayEasy (fixed at top for the whole journey) ────────
  const wordmarkOpacity = progress.interpolate({ inputRange: [0.13, 0.16], outputRange: [0, 1], extrapolate: 'clamp' });
  const sX = progress.interpolate({ inputRange: [0.15, 0.24], outputRange: [72, 0], extrapolate: 'clamp' });
  const eX = progress.interpolate({ inputRange: [0.15, 0.24], outputRange: [-72, 0], extrapolate: 'clamp' });
  const seScale = progress.interpolate({ inputRange: [0.15, 0.22], outputRange: [1.25, 1], extrapolate: 'clamp' });
  const tayOpacity = progress.interpolate({ inputRange: [0.175, 0.24], outputRange: [0, 1], extrapolate: 'clamp' });
  const tayY = progress.interpolate({ inputRange: [0.175, 0.24], outputRange: [10, 0], extrapolate: 'clamp' });
  const asyOpacity = progress.interpolate({ inputRange: [0.19, 0.26], outputRange: [0, 1], extrapolate: 'clamp' });
  const asyY = progress.interpolate({ inputRange: [0.19, 0.26], outputRange: [10, 0], extrapolate: 'clamp' });
  const subtitleOpacity = progress.interpolate({ inputRange: [0.93, 0.97], outputRange: [0, 1], extrapolate: 'clamp' });

  // ─── Stage: map + route + landmarks (zoom out at F8, fade to 15% at F9) ───
  const stageOpacity = progress.interpolate({
    inputRange: [P.mapIn, 0.3, P.lockup, 1],
    outputRange: [0, 1, 1, 0.15],
    extrapolate: 'clamp',
  });
  const stageScale = progress.interpolate({ inputRange: [P.zoom, 0.88], outputRange: [1, 0.9], extrapolate: 'clamp' });
  const mapOffset = progress.interpolate({ inputRange: [P.mapIn, 0.3], outputRange: [600, 0], extrapolate: 'clamp' });
  const faintOpacity = progress.interpolate({ inputRange: [0.28, 0.3], outputRange: [0, 0.2], extrapolate: 'clamp' });

  // ─── Plane (RN Animated.View overlay — avoids SVG rotate crash) ───────────
  const planeX = progress.interpolate({ inputRange: FLIGHT_PTS, outputRange: PLANE_X, extrapolate: 'clamp' });
  const planeY = progress.interpolate({ inputRange: FLIGHT_PTS, outputRange: PLANE_Y, extrapolate: 'clamp' });
  const planeRot = progress.interpolate({
    inputRange: ROT_PTS,
    outputRange: ROT_ANGLES.map((a) => `${a}deg`),
    extrapolate: 'clamp',
  });
  const planeOpacity = progress.interpolate({
    inputRange: [P.journey - 0.005, P.journey, P.lockup, P.lockup + 0.02],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(37,99,235,0.05)', 'rgba(37,99,235,0.015)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top brand: SE logo (F1) → StayEasy wordmark (F2+) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.brandWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <Animated.View style={[styles.glowWrap, { opacity: glowOpacity }]}>
          <Image source={GLOW} style={styles.glow} contentFit="contain" transition={0} />
        </Animated.View>
        <Image source={LOGO} style={styles.logo} contentFit="contain" transition={0} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.brandWrap, { opacity: wordmarkOpacity, transform: [{ scale: seScale }] }]}
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

      {/* Journey stage */}
      <Animated.View
        pointerEvents="none"
        style={[styles.stage, { opacity: stageOpacity, transform: [{ scale: stageScale }] }]}
      >
        <Svg width={320} height={280} viewBox="0 0 320 280">
          {/* Nepal map outline */}
          <G transform={[{ translateX: 30 }, { translateY: 22 }, { scale: 2.6 }]}>
            <AnimatedPath
              d={NEPAL_MAP}
              stroke={BLUE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              opacity={0.22}
              strokeDasharray={600}
              strokeDashoffset={mapOffset}
            />
          </G>

          {/* Faint pre-markers (F3) */}
          <AnimatedG opacity={faintOpacity}>
            {[...DESTINATIONS, ...EXTRA_PINS].map((d) => (
              <Circle key={`f-${d.key}`} cx={d.x} cy={d.y} r={3} fill={BLUE} />
            ))}
          </AnimatedG>

          {/* Route segments drawn in real time, then glowing softly behind the plane */}
          {ROUTE_SEGMENTS.map((seg, i) => {
            const offset = progress.interpolate({
              inputRange: seg.draw,
              outputRange: [seg.len, 0],
              extrapolate: 'clamp',
            });
            const glowOpacity = progress.interpolate({
              inputRange: [seg.draw[1], seg.draw[1] + 0.03],
              outputRange: [0, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <G key={i}>
                <AnimatedPath
                  d={seg.d}
                  stroke={GOLD}
                  strokeWidth={6}
                  strokeLinecap="round"
                  fill="none"
                  opacity={glowOpacity}
                />
                <AnimatedPath
                  d={seg.d}
                  stroke={ROUTE_BLUE}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={seg.len}
                  strokeDashoffset={offset}
                />
              </G>
            );
          })}

          {/* Journey landmarks (self-drawing) + pins */}
          {DESTINATIONS.map((d) => {
            const drawOffset = progress.interpolate({
              inputRange: d.draw,
              outputRange: [600, 0],
              extrapolate: 'clamp',
            });
            const pinR = progress.interpolate({
              inputRange: [d.draw[0] + 0.01, d.draw[0] + 0.03],
              outputRange: [0, 4],
              extrapolate: 'clamp',
            });
            const pinOpacity = progress.interpolate({
              inputRange: [d.draw[0] + 0.005, d.draw[0] + 0.025],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <G key={d.key} transform={[{ translateX: d.x - 24 }, { translateY: d.y - 26 }]}>
                <AnimatedPath
                  d={d.path}
                  stroke={BLUE}
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={600}
                  strokeDashoffset={drawOffset}
                />
                <AnimatedCircle cx={24} cy={26} r={pinR} fill={GOLD} opacity={pinOpacity} />
              </G>
            );
          })}

          {/* Extra pins (F8 zoom-out) */}
          {EXTRA_PINS.map((d) => {
            const pinR = progress.interpolate({
              inputRange: [P.zoom + 0.02, P.zoom + 0.05],
              outputRange: [0, 4],
              extrapolate: 'clamp',
            });
            const pinOpacity = progress.interpolate({
              inputRange: [P.zoom + 0.01, P.zoom + 0.04],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            const labelOpacity = progress.interpolate({
              inputRange: [P.zoom + 0.03, P.zoom + 0.06],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <G key={d.key}>
                <AnimatedCircle cx={d.x} cy={d.y} r={pinR} fill={BLUE} opacity={pinOpacity} />
                <AnimatedSvgText
                  x={d.x}
                  y={d.y + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="700"
                  fill={INK}
                  fontFamily="Sora_700Bold"
                  opacity={labelOpacity}
                >
                  {d.label}
                </AnimatedSvgText>
              </G>
            );
          })}
        </Svg>

        {/* Paper airplane (RN overlay — safe animated rotate) */}
        <Animated.View
          style={[
            styles.planeWrap,
            {
              opacity: planeOpacity,
              transform: [{ translateX: planeX }, { translateY: planeY }, { rotate: planeRot }],
            },
          ]}
        >
          <Svg width={30} height={16} viewBox="-15 -8 30 16">
            <Path d={PLANE} fill="#FFFFFF" stroke={BLUE} strokeWidth={1.6} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    overflow: 'hidden',
  },

  brandWrap: {
    position: 'absolute',
    top: '11%',
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 132,
    height: 132,
  },
  glowWrap: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 260,
    height: 260,
  },

  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wordmark: {
    fontFamily: 'Sora_700Bold',
    fontSize: 44,
    letterSpacing: -1.5,
  },
  wordmarkMid: {
    fontFamily: 'Sora_700Bold',
    fontSize: 36,
    letterSpacing: -1,
    paddingBottom: 4,
  },
  wordmarkBlue: { color: BLUE },
  wordmarkGold: { color: GOLD },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },

  stage: {
    position: 'absolute',
    left: '50%',
    top: '38%',
    marginLeft: -160,
    marginTop: -140,
    width: 320,
    height: 280,
  },
  planeWrap: {
    position: 'absolute',
    left: -15, // centered viewBox → box center sits exactly on the waypoint
    top: -8,
    width: 30,
    height: 16,
  },
});
