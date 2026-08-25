import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FONTS, SRS, RADIUS } from '@/constants/portal-theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TEXT, BG, NEUTRAL, BORDER } from '@/lib/constants/figma-tokens';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.replace('/')}
      >
        <Ionicons name="arrow-back" size={24} color={TEXT.black} />
      </Pressable>

      <View style={styles.imagePlaceholder} />

      <Text style={styles.welcomeText}>{t('auth.splash.subtitle')}</Text>

      <View style={styles.buttonFrame}>
        <Pressable
          style={[styles.button, styles.loginButton]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginText}>{t('auth.login.button')}</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.signupButton]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.signupText}>{t('auth.login.signup')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG.white,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 51,
    left: 16,
    width: 51,
    height: 51,
    borderRadius: 25.5,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imagePlaceholder: {
    marginTop: 64,
    width: 390,
    height: 280,
    borderRadius: 24,
    backgroundColor: SRS.navy,
    overflow: 'hidden',
  },
  welcomeText: {
    marginTop: 32,
    fontFamily: FONTS.abhayaLibre,
    fontSize: 20,
    fontStyle: 'italic',
    color: SRS.navy,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonFrame: {
    marginTop: 40,
    width: 370,
    height: 112,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 306,
    height: 48,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: SRS.navy,
  },
  loginText: {
    fontFamily: FONTS.itim,
    fontSize: 20,
    color: NEUTRAL.snow,
  },
  signupButton: {
    backgroundColor: BORDER.input,
  },
  signupText: {
    fontFamily: FONTS.itim,
    fontSize: 20,
    color: SRS.navy,
  },
});
