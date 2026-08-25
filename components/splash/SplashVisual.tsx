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
  path: string;      // line-art landmark scene (100×70 viewBox) that self-draws
  draw: [number, number]; // self-draw progress window
}

const DESTINATIONS: Dest[] = [
  {
    key: 'KTM', label: 'Kathmandu', x: 95, y: 150, draw: [0.35, 0.44],
    // Dharahara tower + Durbar Square pagoda temples + birds
    path:
      // Ground line
      'M0 68 H100 '
      // Dharahara tower (tall, detailed)
      + 'M72 68 V52 M72 52 L68 48 H76 L72 52 '
      + 'M70 52 V44 H74 V52 M70 44 V36 H74 V44 M70 36 V28 H74 V36 '
      + 'M70 28 L72 22 L74 28 M72 22 V16 '
      + 'M69 48 H75 M69 40 H75 M69 32 H75 '
      // Pagoda temple 1 (large, 3-tier)
      + 'M20 68 L20 58 M20 58 L14 54 H26 L20 58 '
      + 'M16 54 L16 50 H24 L24 54 M16 50 L12 46 H28 L24 50 '
      + 'M14 46 L14 42 H26 L26 46 M14 42 L10 38 H30 L26 42 '
      + 'M18 38 L18 34 H22 L22 38 M20 34 V30 '
      // Pagoda temple 2 (smaller, 2-tier)
      + 'M40 68 L40 60 M40 60 L36 57 H44 L40 60 '
      + 'M38 57 L38 54 H42 L42 57 M38 54 L35 51 H45 L42 54 '
      + 'M40 51 L40 48 H40 M40 48 V45 '
      // Pagoda temple 3 (tiny)
      + 'M52 68 L52 62 M52 62 L50 60 H54 L52 62 M52 60 V58 '
      // Stupa dome
      + 'M84 68 V60 Q84 56 88 56 Q92 56 92 60 V68 '
      + 'M86 58 a2 2 0 1 0 0.01 0 M90 58 a2 2 0 1 0 0.01 0 '
      // Birds
      + 'M8 20 Q10 18 12 20 M14 16 Q16 14 18 16 M30 22 Q32 20 34 22',
  },
  {
    key: 'PKR', label: 'Pokhara', x: 55, y: 100, draw: [0.48, 0.56],
    // Machhapuchhre (Fishtail) + mountain range + Phewa Lake + boat + trees + clouds
    path:
      // Clouds
      'M10 12 Q14 8 18 12 Q22 8 26 12 Q30 8 34 12 '
      + 'M60 10 Q64 6 68 10 Q72 6 76 10 '
      // Mountain range (back)
      + 'M0 50 L8 32 L14 38 L20 24 L26 34 L32 18 L38 28 L44 14 L50 26 '
      + 'L56 20 L62 30 L68 22 L74 34 L80 28 L86 36 L92 30 L100 50 '
      // Fishtail double-peak
      + 'M44 14 L46 20 L48 10 L50 20 L50 26 '
      // Tree line along shore
      + 'M6 56 V50 M6 50 L4 46 L8 46 L6 50 '
      + 'M16 56 V52 M16 52 L14 48 L18 48 L16 52 '
      + 'M80 56 V50 M80 50 L78 46 L82 46 L80 50 '
      + 'M90 56 V52 M90 52 L88 48 L92 48 L90 52 '
      // Lake shoreline
      + 'M0 56 H100 '
      // Lake ripples
      + 'M10 60 Q16 58 22 60 Q28 58 34 60 '
      + 'M40 62 Q46 60 52 62 Q58 60 64 62 '
      + 'M66 58 Q72 56 78 58 Q84 56 90 58 '
      // Boat on lake
      + 'M38 58 L44 54 L50 58 L44 62 Z M44 54 V50 L50 52 '
      // Boat reflection
      + 'M40 64 Q44 62 48 64',
  },
  {
    key: 'CTW', label: 'Chitwan', x: 110, y: 195, draw: [0.61, 0.68],
    // Rhinoceros + safari watchtower + trees + grass
    path:
      // Ground
      'M0 68 H100 '
      // Rhino body (detailed)
      + 'M18 52 Q14 46 20 42 Q28 38 36 40 Q42 42 46 48 Q48 52 50 50 '
      + 'Q52 46 56 44 L58 40 Q60 36 64 36 L66 40 '
      // Rhino head + horn
      + 'M18 52 L14 50 L10 46 Q8 42 12 40 L16 38 '
      + 'M12 40 L10 34 L14 36 '
      // Rhino ear
      + 'M14 40 L10 36 L16 38 '
      // Rhino legs
      + 'M24 52 V58 M32 52 V58 M44 50 V56 M50 50 V56 '
      // Rhino tail
      + 'M56 44 L58 42 L60 44 '
      // Safari watchtower
      + 'M74 68 V44 L78 40 L82 44 V68 M74 50 H82 M78 40 V36 '
      + 'M72 44 H84 '
      // Trees
      + 'M4 68 V54 M4 54 L1 50 L7 50 L4 54 M4 50 L2 46 L6 46 L4 50 '
      + 'M62 68 V56 M62 56 L60 52 L64 52 L62 56 '
      + 'M92 68 V54 M92 54 L90 50 L94 50 L92 54 '
      // Tall grass
      + 'M20 68 V60 M20 60 L18 56 M20 62 L22 58 '
      + 'M38 68 V62 M38 62 L36 58 M38 64 L40 60 '
      + 'M68 68 V62 M68 62 L66 58 M68 64 L70 60',
  },
  {
    key: 'NGK', label: 'Nagarkot', x: 165, y: 95, draw: [0.72, 0.79],
    // Sunrise + mountain ridges + pine trees + viewpoint pavilion + clouds + birds
    path:
      // Clouds
      'M10 14 Q14 10 18 14 Q22 10 26 14 '
      + 'M68 12 Q72 8 76 12 Q80 8 84 12 '
      // Sun with rays
      + 'M44 20 a8 8 0 0 1 16 0 M52 10 V6 M46 14 L42 10 M58 14 L62 10 '
      + 'M44 16 L40 14 M60 16 L64 14 M44 24 L40 26 M60 24 L64 26 '
      // Mountain ridge 1 (foreground)
      + 'M0 52 L8 40 L16 46 L24 34 L32 42 L40 30 L48 38 L56 26 L64 36 '
      + 'L72 28 L80 38 L88 32 L96 42 L100 52 '
      // Mountain ridge 2 (background)
      + 'M0 56 L10 48 L20 52 L30 42 L40 48 L50 38 L60 44 L70 36 L80 42 L90 38 L100 48 '
      // Pine trees
      + 'M12 68 V58 L8 52 L16 52 L12 58 M12 52 L9 46 L15 46 L12 52 '
      + 'M34 68 V60 L31 55 L37 55 L34 60 '
      + 'M72 68 V58 L69 53 L75 53 L72 58 M72 53 L70 48 L74 48 L72 53 '
      // Viewpoint pavilion
      + 'M82 68 V56 L80 54 H88 L86 56 V68 '
      + 'M80 54 L84 50 L88 54 M84 50 V48 '
      // Birds
      + 'M30 18 Q32 16 34 18 M38 14 Q40 12 42 14 M74 20 Q76 18 78 20',
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
  { d: 'M-34 224 L95 150', draw: [0.31, 0.35], len: 200 },
  { d: 'M95 150 L55 100', draw: [0.44, 0.48], len: 100 },
  { d: 'M55 100 L110 195', draw: [0.57, 0.61], len: 150 },
  { d: 'M110 195 L165 95', draw: [0.69, 0.72], len: 150 },
  { d: 'M165 95 L160 140', draw: [0.79, 0.87], len: 80 },
];

// Paper airplane (viewBox centered on 0,0 so translate = position)
const PLANE = 'M-13 0 L12 -5 L6 0 L12 5 L-13 0 Z';

// Plane keyframes (holds at each destination while it self-draws)
const FLIGHT_PTS = [0.31, 0.35, 0.44, 0.48, 0.57, 0.61, 0.69, 0.72, 0.79, 0.87, 0.93];
const PLANE_X = [-34, 95, 95, 55, 55, 110, 110, 165, 165, 160, 160];
const PLANE_Y = [224, 150, 150, 100, 100, 195, 195, 95, 95, 140, 140];
const ROT_PTS = [0.31, 0.35, 0.44, 0.48, 0.57, 0.61, 0.69, 0.72, 0.79, 0.87];
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
    inputRange: [0.03, 0.12, P.logoIn, P.lockup, 0.99],
    outputRange: [0, 0.45, 0.45, 0, 0.35],
    extrapolate: 'clamp',
  });

  // ─── F2: S/E split → ServeIQ (fixed at top for the whole journey) ────────
  const wordmarkOpacity = progress.interpolate({ inputRange: [0.13, 0.16], outputRange: [0, 1], extrapolate: 'clamp' });
  const sX = progress.interpolate({ inputRange: [0.15, 0.24], outputRange: [72, 0], extrapolate: 'clamp' });
  const eX = progress.interpolate({ inputRange: [0.15, 0.24], outputRange: [-72, 0], extrapolate: 'clamp' });
  const seScale = progress.interpolate({ inputRange: [0.15, 0.22], outputRange: [1.25, 1], extrapolate: 'clamp' });
  const tayOpacity = progress.interpolate({ inputRange: [0.175, 0.24], outputRange: [0, 1], extrapolate: 'clamp' });
  const tayY = progress.interpolate({ inputRange: [0.175, 0.24], outputRange: [10, 0], extrapolate: 'clamp' });
  const asyOpacity = progress.interpolate({ inputRange: [0.19, 0.26], outputRange: [0, 1], extrapolate: 'clamp' });
  const asyY = progress.interpolate({ inputRange: [0.19, 0.26], outputRange: [10, 0], extrapolate: 'clamp' });
  const subtitleOpacity = progress.interpolate({ inputRange: [0.93, 0.97], outputRange: [0, 1], extrapolate: 'clamp' });

  // ─── F9: wordmark moves to center ────────────────────────────────────────
  const wordmarkOffsetY = progress.interpolate({
    inputRange: [P.lockup - 0.04, P.lockup + 0.02],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });
  const decorativeOpacity = progress.interpolate({
    inputRange: [P.lockup, P.lockup + 0.04],
    outputRange: [0, 0.15],
    extrapolate: 'clamp',
  });

  // ─── Stage: map + route + landmarks (zoom out at F8, fade to 15% at F9) ───
  const stageOpacity = progress.interpolate({
    inputRange: [P.mapIn, 0.3, P.lockup - 0.04, P.lockup],
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
    inputRange: [P.journey - 0.005, P.journey, P.lockup - 0.02, P.lockup],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(37,99,235,0.05)', 'rgba(37,99,235,0.015)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top brand: SE logo (F1) → ServeIQ wordmark (F2+) */}
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
        style={[styles.brandWrap, {
          opacity: wordmarkOpacity,
          transform: [{ scale: seScale }, { translateY: wordmarkOffsetY }],
        }]}
      >
        <View style={styles.wordmarkRow}>
          <Animated.Text style={[styles.wordmark, styles.wordmarkBlue, { transform: [{ translateX: sX }] }]}>S</Animated.Text>
          <Animated.Text style={[styles.wordmarkMid, styles.wordmarkBlue, { opacity: tayOpacity, transform: [{ translateY: tayY }] }]}>erve</Animated.Text>
          <Animated.Text style={[styles.wordmark, styles.wordmarkGold, { transform: [{ translateX: eX }] }]}>I</Animated.Text>
          <Animated.Text style={[styles.wordmarkMid, styles.wordmarkGold, { opacity: asyOpacity, transform: [{ translateY: asyY }] }]}>Q</Animated.Text>
        </View>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Service with Intelligence and Quality
        </Animated.Text>
      </Animated.View>

      {/* Decorative mountain/tree silhouettes (F9) */}
      <Animated.View
        pointerEvents="none"
        style={[styles.decorativeWrap, { opacity: decorativeOpacity }]}
      >
        <Svg width={280} height={50} viewBox="0 0 280 50">
          <G>
            <Path
              d="M0 45 L30 20 L50 32 L80 12 L110 28 L140 8 L170 25 L200 15 L230 30 L260 22 L280 45"
              stroke={BLUE}
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="none"
            />
            <Path d="M35 45 V36 L30 30 L40 30 L35 36 M35 30 L32 25 L38 25 L35 30" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M85 45 V38 L81 33 L89 33 L85 38" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M145 45 V34 L140 28 L150 28 L145 34 M145 28 L142 23 L148 23 L145 28" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M205 45 V36 L201 31 L209 31 L205 36" stroke={BLUE} strokeWidth={1.2} fill="none" />
            <Path d="M250 45 V38 L246 33 L254 33 L250 38 M250 33 L247 28 L253 28 L250 33" stroke={BLUE} strokeWidth={1.2} fill="none" />
          </G>
        </Svg>
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

          {/* Faint mountain/temple silhouettes inside map (F3) */}
          <AnimatedG opacity={faintOpacity}>
            <G transform={[{ translateX: 50 }, { translateY: 30 }, { scale: 2.2 }]}>
              <Path d="M0 40 L10 25 L20 35 L30 15 L40 30 L50 10 L60 28 L70 18 L80 38" stroke={BLUE} strokeWidth={1} fill="none" opacity={0.3} />
              <Path d="M20 42 L22 38 H26 L28 42 M23 38 V35 H25 V38" stroke={BLUE} strokeWidth={0.8} fill="none" opacity={0.25} />
              <Path d="M55 42 L57 36 H61 L63 42 M58 36 V33 H60 V36" stroke={BLUE} strokeWidth={0.8} fill="none" opacity={0.25} />
            </G>
          </AnimatedG>

          {/* Faint pre-markers (F3) */}
          <AnimatedG opacity={faintOpacity}>
            {[...DESTINATIONS, ...EXTRA_PINS].map((d) => (
              <Circle key={`f-${d.key}`} cx={d.x} cy={d.y} r={3} fill={BLUE} />
            ))}
          </AnimatedG>

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

          {/* Journey landmarks (self-drawing) + pins */}
          {DESTINATIONS.map((d) => {
            const drawOffset = progress.interpolate({
              inputRange: d.draw,
              outputRange: [1200, 0],
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
              <G key={d.key} transform={[{ translateX: d.x - 50 }, { translateY: d.y - 35 }]}>
                <AnimatedPath
                  d={d.path}
                  stroke={BLUE}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={1200}
                  strokeDashoffset={drawOffset}
                />
                <AnimatedCircle cx={50} cy={68} r={pinR} fill={GOLD} opacity={pinOpacity} />
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
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 320,
    height: 320,
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
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 3,
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
  decorativeWrap: {
    position: 'absolute',
    bottom: '8%',
    width: '100%',
    alignItems: 'center',
  },
});
