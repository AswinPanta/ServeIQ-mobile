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
    key: 'KTM', label: 'Kathmandu', x: 95, y: 150, draw: [0.35, 0.43],
    // Temple cluster + Dharahara tower
    path: 'M4 42 H24 M6 42 L11 36 H19 L24 42 M11 36 L11 31 H19 L19 36 M15 31 V24 '
      + 'M26 42 L28 39 H32 L34 42 M28 39 V36 H32 L32 39 '
      + 'M34 42 V28 L37 22 H41 L44 28 V42 M41 22 V15 M36 34 H42 M39 31 a2 2 0 1 0 0.01 0',
  },
  {
    key: 'PKR', label: 'Pokhara', x: 55, y: 100, draw: [0.48, 0.55],
    // Machhapuchhre + Phewa Lake + boat + ripples + lakeside tree
    path: 'M4 28 L14 6 L18 14 L22 6 L32 28 M18 14 L22 6 M6 42 H42 M14 42 q5 -4 10 0 '
      + 'M19 42 V36 L24 40 L19 42 M16 45 q3 -2 6 0 M28 45 q3 -2 6 0 '
      + 'M38 42 V34 M38 36 L35 32 M38 34 L41 30 M33 30 Q36 26 38 28 Q40 26 43 30',
  },
  {
    key: 'CTW', label: 'Chitwan', x: 110, y: 195, draw: [0.61, 0.67],
    // One-horned rhino + grass + safari watchtower
    path: 'M7 32 Q5 28 9 27 Q14 25 18 29 Q24 31 26 34 L26 39 M26 34 L28 30 Q30 27 34 27 L36 30 '
      + 'Q33 31 32 34 L32 39 M7 32 L7 39 M20 40 H14 M34 27 L33 23 M14 25 L15 22 L17 24 '
      + 'M4 41 H30 M36 41 H44 M8 43 h6 M24 43 h8 M40 40 V26 L44 22 L48 26 V40 M40 30 H48 M44 22 V18',
  },
  {
    key: 'NGK', label: 'Nagarkot', x: 165, y: 95, draw: [0.72, 0.78],
    // Sunrise + mountain ridges + pines + viewpoint
    path: 'M18 30 a8 8 0 0 1 16 0 M26 20 V14 M20 24 L17 21 M32 24 L35 21 '
      + 'M4 38 L12 30 L18 35 L26 27 L34 34 L42 28 L46 32 '
      + 'M14 42 V34 M14 34 L11 30 L17 30 L14 34 M14 30 L12 26 L16 26 L14 30 M34 42 V38 L37 42',
  },
];

// Extra pins revealed at the zoom-out
const EXTRA_PINS = [
  { key: 'LUM', label: 'Lumbini', x: 30, y: 175 },
  { key: 'MUS', label: 'Mustang', x: 85, y: 45 },
  { key: 'EBC', label: 'Everest', x: 215, y: 50 },
];

// Stylized Nepal silhouette (viewBox 0 0 100 90) — higher fidelity
const NEPAL_MAP =
  'M18 12 L22 8 L28 10 L32 6 L38 8 L44 4 L50 7 L56 5 L62 8 L68 5 '
  + 'L74 9 L80 6 L86 10 L90 14 L88 20 L92 26 L88 32 L91 38 L86 44 '
  + 'L82 50 L78 56 L72 62 L66 68 L60 72 L54 76 L48 80 L42 78 L36 82 '
  + 'L30 80 L24 84 L18 78 L14 70 L10 62 L7 52 L5 44 L8 36 L5 28 '
  + 'L10 20 L16 16 L18 12 Z';

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
