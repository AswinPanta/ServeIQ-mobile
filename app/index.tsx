import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '@/lib/context/auth-context';
import { mark } from '@/lib/utils/perf';

// Stage 1 asset — Nepal map boot animation (8s, 720x1280)
const MAP_VIDEO = require('@/assets/Splash.animation/ServeIQ_Nepal_map_animation_20260910153912.mp4');

const MAX_SPLASH_MS = 10000;
// Hard cap for the video stage: video is 8s; playToEnd normally fires first.
const MAX_VIDEO_MS = 9500;
const { width: W, height: H } = Dimensions.get('window');

const LOGO = require('@/assets/images/serveiq-logo.png');

type BootStage = 'video' | 'logo';

export default function SplashScreen() {
  const { isSignedIn, portal } = useAuth();
  const [stage, setStage] = useState<BootStage>('video');
  const splashStart = useRef(0);
  const navigated = useRef(false);
  const authRef = useRef({ isSignedIn, portal });

  useEffect(() => {
    authRef.current = { isSignedIn, portal };
  }, [isSignedIn, portal]);

  useEffect(() => {
    splashStart.current = Date.now();
    mark('splash mounted (video stage)');
  }, []);

  const navigate = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    mark(`navigating (+${Date.now() - splashStart.current}ms)`);
    const { isSignedIn: s, portal: p } = authRef.current;
    if (s && p && p !== 'guest') {
      switch (p) {
        case 'host': router.replace('/(host)'); return;
        case 'operations': router.replace('/(operations)'); return;
        case 'superadmin': router.replace('/(superadmin)'); return;
      }
    }
    router.replace('/(tabs)');
  }, []);

  // ── Stage 1: Nepal map video ──────────────────────────────────────────────
  const player = useVideoPlayer(MAP_VIDEO, (p) => {
    p.loop = false;
    p.play();
  });

  const goLogo = useCallback(() => {
    setStage((prev) => {
      if (prev !== 'video') return prev; // never leave the logo stage once entered
      mark('video ended → logo stage');
      return 'logo';
    });
  }, []);

  useEffect(() => {
    if (stage !== 'video') return;
    // Fires when the video plays to its natural end.
    const sub = player.addListener('playToEnd', goLogo);
    // Fallbacks: codec error or a stalled stream must never trap the app on
    // the boot screen — bail to the logo stage.
    const cap = setTimeout(goLogo, MAX_VIDEO_MS);
    return () => {
      sub.remove();
      clearTimeout(cap);
    };
  }, [stage, player, goLogo]);

  // ── Stage 2: the original logo splash ("old pal") ─────────────────────────
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage !== 'logo') return;
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Navigate after 2s — Stack's fade animation crossfades the screens
    const t = setTimeout(() => navigate(), 2000);
    // Hard cap (defense in depth — the 2s timer should always win)
    const cap = setTimeout(() => navigate(), MAX_SPLASH_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(cap);
    };
  }, [stage, navigate, logoOpacity, logoScale, textOpacity]);

  if (stage === 'video') {
    return (
      <View style={s.videoContainer}>
        <VideoView
          player={player}
          style={s.video}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[s.footer, { opacity: textOpacity }]}>
        <Text style={s.footerText}>Service with Intelligence and Quality</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  videoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  video: {
    flex: 1,
    width: W,
    height: H,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logo: {
    width: W * 0.65,
    height: W * 0.65,
    maxWidth: 320,
    maxHeight: 320,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    color: '#2E86AB',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
