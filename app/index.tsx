import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SRS, RADIUS } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';

export default function SplashScreen() {
  const { isSignedIn, portal } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (isSignedIn && portal) {
        switch (portal) {
          case 'guest': router.replace('/(tabs)'); break;
          case 'host': router.replace('/(host)'); break;
          case 'operations': router.replace('/(operations)'); break;
          case 'superadmin': router.replace('/(superadmin)'); break;
          default: router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSignedIn, portal]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoInner}>
            <Ionicons name="star" size={32} color="#FFF" />
          </View>
        </View>
        <Text style={styles.brand}>StayEasy</Text>
        <Text style={styles.tagline}>Your hospitality platform</Text>
      </Animated.View>

      <Text style={styles.footer}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: SRS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
