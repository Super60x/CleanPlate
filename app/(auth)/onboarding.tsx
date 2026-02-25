import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const HERO_IMAGE_URL =
  'https://res.cloudinary.com/deqjaohp9/image/upload/v1770553779/screen_jam3xi.png';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hero image area */}
      <View style={styles.heroSection}>
        <View style={styles.heroImageContainer}>
          <Ionicons name="leaf" size={80} color={Colors.primary} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <View style={styles.brandRow}>
          <Ionicons name="leaf" size={28} color={Colors.primary} />
          <Text style={styles.brandName}>Clean Plate</Text>
        </View>

        <Text style={styles.tagline}>EAT CLEAN, ANYWHERE</Text>

        <Text style={styles.subtitle}>Your Personal Health Concierge</Text>

        <Text style={styles.description}>
          Scan any restaurant menu to find the cleanest, most nutritious meals in seconds.
        </Text>

        {/* Get Started button */}
        <Pressable
          style={styles.getStartedButton}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Sign In link */}
        <Pressable
          style={styles.signInRow}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.signInText}>Already have an account? </Text>
          <Text style={styles.signInLink}>Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    flex: 1,
    backgroundColor: Colors.heroSectionBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  brandName: {
    ...typography.pageTitle,
    color: Colors.text,
  },
  tagline: {
    ...typography.badge,
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 20,
  },
  subtitle: {
    ...typography.sectionHeading,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  signInRow: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 8,
  },
  signInText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
