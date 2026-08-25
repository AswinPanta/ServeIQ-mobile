import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '@/lib/context/auth-context';
import { mark } from '@/lib/utils/perf';
import { NEUTRAL } from '@/lib/constants/figma-tokens';

// ServeIQ splash video (8s, portrait 720×1280). It already contains the
// "ServeIQ" wordmark and the "Service with Intelligence and Quality" tagline
// baked into its frames, so no extra overlay is rendered on top of it.
const SPLASH_VIDEO = require('@/assets/Splash.animation/ServeIQsplash.mp4');

// How often the player reports playback time, so the end can be caught within
// ~100ms if the playToEnd event is ever missed.
const TIME_UPDATE_INTERVAL_S = 0.1;
// Treat playback as ended once within this many seconds of the video duration.
const END_EPSILON_S = 0.12;

// Absolute safety net only — navigates if the player never ends nor errors
// (should never fire in normal operation; real nav happens at video end).
const MAX_SPLASH_MS = 15000;

export default function SplashScreen() {
  const { isSignedIn, portal } = useAuth();

  // Time of splash mount. Set in an effect (not during render) so the
  // impure Date.now call stays out of the render phase.
  const splashStart = useRef(0);
  const navigated = useRef(false);
  // When the video reached its end, measured in ms since splash mount.
  const endedAtMs = useRef<number | null>(null);

  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = TIME_UPDATE_INTERVAL_S;
    p.play();
  });

  useEffect(() => {
    splashStart.current = Date.now();
    mark('splash mounted');
  }, []);

  // Always hold the latest auth state so the timer can route correctly even
  // when auth is still initializing when it fires.
  const authRef = useRef({ isSignedIn, portal });
  useEffect(() => {
    authRef.current = { isSignedIn, portal };
  }, [isSignedIn, portal]);

  const navigate = () => {
    if (navigated.current) return;
    navigated.current = true;

    const navMs = Date.now() - splashStart.current;
    mark(`navigating away from splash (+${navMs}ms)`);
    const endMs = endedAtMs.current;
    if (endMs != null) {
      const delta = Math.max(0, navMs - endMs);
      console.log(`[splash] video ended at +${endMs}ms, navigating at +${navMs}ms (Δ${delta}ms)`);
    }

    const { isSignedIn: signedIn, portal: activePortal } = authRef.current;
    if (signedIn && activePortal && activePortal !== 'guest') {
      switch (activePortal) {
        case 'host':
          router.replace('/(host)');
          return;
        case 'operations':
          router.replace('/(operations)');
          return;
        case 'superadmin':
          router.replace('/(superadmin)');
          return;
        default:
          router.replace('/(tabs)');
          return;
      }
    }

    router.replace('/(tabs)');
  };

  // Primary trigger: navigate the instant the mp4 finishes.
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      endedAtMs.current = Date.now() - splashStart.current;
      mark('splash video ended (playToEnd)');
      navigate();
    });
    return () => sub.remove();
  }, [player]);

  // Robust fallback: if playToEnd is ever missed, catch the end via playback
  // time so navigation still happens within ~100ms of the true video end.
  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      const duration = player.duration;
      if (!duration || duration <= 0) return;
      if (currentTime >= duration - END_EPSILON_S) {
        if (endedAtMs.current == null) {
          endedAtMs.current = Date.now() - splashStart.current;
          mark('splash video ended (timeUpdate)');
        }
        navigate();
      }
    });
    return () => sub.remove();
  }, [player]);

  // If the player errors, bail out so a broken video never traps the user.
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        mark('splash video error — navigating');
        navigate();
      }
    });
    return () => sub.remove();
  }, [player]);

  // Absolute safety net (never reached in normal operation).
  useEffect(() => {
    const timer = setTimeout(() => {
      mark('splash safety net reached');
      navigate();
    }, MAX_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEUTRAL[50],
  },
});
