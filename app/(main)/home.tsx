import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Home',
          headerRight: () => (
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable onPress={() => router.push('/(main)/preferences')} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.welcomeTitle}>Clean Plate</Text>
          <Text style={styles.welcomeTagline}>EAT CLEAN, ANYWHERE</Text>
          {user?.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>

        {/* Scan Menu Button */}
        <Pressable
          style={styles.scanButton}
          onPress={() => router.push('/(main)/scan')}
        >
          <Ionicons name="camera" size={36} color="#FFFFFF" />
          <Text style={styles.scanButtonTitle}>Scan Menu</Text>
          <Text style={styles.scanButtonDescription}>
            Take a photo of a restaurant menu to get started
          </Text>
        </Pressable>

        {/* History Button */}
        <Pressable
          style={styles.historyButton}
          onPress={() => router.push('/(main)/history')}
        >
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <Text style={styles.historyButtonText}>Scan History</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </Pressable>
      </View>

      <LoadingOverlay visible={isLoading} message="Logging out..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    ...typography.pageTitle,
    color: Colors.text,
  },
  welcomeTagline: {
    ...typography.badge,
    color: Colors.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scanButtonTitle: {
    ...typography.sectionHeading,
    color: '#FFFFFF',
    marginTop: 12,
  },
  scanButtonDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
  logoutButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 18,
    width: '100%',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  historyButtonText: {
    ...typography.subheading,
    flex: 1,
    color: Colors.text,
  },
});
