import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { DietaryRestriction, HealthGoal, UserPreferences } from '../../types';
import { loadPreferences, savePreferences } from '../../services/firestore';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScanButton from '../../components/ScanButton';

const DIETARY_OPTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: DietaryRestriction.Vegan, label: 'Vegan' },
  { value: DietaryRestriction.Vegetarian, label: 'Vegetarian' },
  { value: DietaryRestriction.GlutenFree, label: 'Gluten-Free' },
  { value: DietaryRestriction.DairyFree, label: 'Dairy-Free' },
  { value: DietaryRestriction.Keto, label: 'Keto' },
  { value: DietaryRestriction.LowCarb, label: 'Low Carb' },
];

const GOAL_OPTIONS: { value: HealthGoal; label: string }[] = [
  { value: HealthGoal.WeightLoss, label: 'Weight Loss' },
  { value: HealthGoal.MuscleGain, label: 'Muscle Gain' },
  { value: HealthGoal.LowSugar, label: 'Low Sugar' },
  { value: HealthGoal.LowSodium, label: 'Low Sodium' },
  { value: HealthGoal.HighProtein, label: 'High Protein' },
];

export default function PreferencesScreen() {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPreferences(user.id)
      .then((prefs) => {
        setRestrictions(prefs.dietaryRestrictions);
        setGoals(prefs.goals);
        setAvoidIngredients(prefs.avoidIngredients);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load preferences.');
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const toggleRestriction = (value: DietaryRestriction) => {
    setRestrictions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const toggleGoal = (value: HealthGoal) => {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  };

  const addIngredient = () => {
    const trimmed = ingredientInput.trim().toLowerCase();
    if (!trimmed || avoidIngredients.includes(trimmed)) {
      setIngredientInput('');
      return;
    }
    setAvoidIngredients((prev) => [...prev, trimmed]);
    setIngredientInput('');
  };

  const removeIngredient = (ingredient: string) => {
    setAvoidIngredients((prev) => prev.filter((i) => i !== ingredient));
  };

  const handleDeleteRequest = () => {
    const subject = encodeURIComponent('Account Deletion Request');
    const body = encodeURIComponent(
      `Hi,\n\nI would like to request the deletion of my account and all associated data.\n\nAccount email: ${user?.email ?? 'N/A'}\nUser ID: ${user?.id ?? 'N/A'}\n\nThank you.`
    );
    Linking.openURL(`mailto:support@cleanplate.app?subject=${subject}&body=${body}`);
  };

  const handleSave = async () => {
    if (!user) return;
    Alert.alert(
      'Update Preferences?',
      'These changes will only apply to new scans. Your existing scan history will keep its original scores.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setIsSaving(true);
            try {
              const prefs: UserPreferences = {
                dietaryRestrictions: restrictions,
                goals,
                avoidIngredients,
              };
              await savePreferences(user.id, prefs);
              Alert.alert('Saved', 'Your preferences have been updated.');
            } catch {
              Alert.alert('Error', 'Failed to save preferences. Please try again.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Preferences' }} />

      {isLoading ? (
        <LoadingOverlay visible message="Loading preferences..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Info banner about preferences scope */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Changes apply to future scans only. Previous scans in your history won't be reanalyzed.
            </Text>
          </View>

          {/* Dietary Restrictions */}
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.sectionDescription}>
            Dishes that don't match will be flagged and scored lower.
          </Text>
          <View style={styles.chipContainer}>
            {DIETARY_OPTIONS.map((opt) => {
              const active = restrictions.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleRestriction(opt.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Health Goals */}
          <Text style={styles.sectionTitle}>Health Goals</Text>
          <Text style={styles.sectionDescription}>
            Scoring will favor dishes that align with your goals.
          </Text>
          <View style={styles.chipContainer}>
            {GOAL_OPTIONS.map((opt) => {
              const active = goals.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleGoal(opt.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Avoid Ingredients */}
          <Text style={styles.sectionTitle}>Ingredients to Avoid</Text>
          <Text style={styles.sectionDescription}>
            Dishes containing these will get a warning.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. peanuts"
              placeholderTextColor={Colors.textLight}
              value={ingredientInput}
              onChangeText={setIngredientInput}
              onSubmitEditing={addIngredient}
              returnKeyType="done"
            />
            <Pressable style={styles.addButton} onPress={addIngredient}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          {avoidIngredients.length > 0 && (
            <View style={styles.chipContainer}>
              {avoidIngredients.map((ing) => (
                <Pressable
                  key={ing}
                  style={[styles.chip, styles.chipIngredient]}
                  onPress={() => removeIngredient(ing)}
                >
                  <Text style={styles.chipTextIngredient}>{ing}</Text>
                  <Ionicons name="close" size={14} color={Colors.error} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Save Button */}
          <View style={styles.saveContainer}>
            <ScanButton
              onPress={handleSave}
              label="Save Preferences"
              icon="checkmark-circle"
              isLoading={isSaving}
            />
          </View>

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable
            style={styles.manageRow}
            onPress={() => {
              const url =
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions';
              Linking.openURL(url);
            }}
          >
            <Ionicons name="card-outline" size={20} color={Colors.primary} />
            <Text style={styles.manageText}>Manage subscription</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textLight} style={{ marginLeft: 'auto' }} />
          </Pressable>
          <Text style={styles.manageDescription}>
            View, change, or cancel your subscription in {Platform.OS === 'ios' ? 'the App Store' : 'Google Play'}.
          </Text>

          <Pressable style={styles.deleteRow} onPress={handleDeleteRequest}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.deleteText}>Request account deletion</Text>
          </Pressable>
          <Text style={styles.deleteDescription}>
            Opens an email to request deletion of your account and all associated data.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...typography.sectionHeading,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionDescription: {
    ...typography.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  chipIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3F3',
    borderColor: '#FFCDD2',
  },
  chipTextIngredient: {
    fontSize: 14,
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    color: Colors.text,
  },
  saveContainer: {
    marginTop: 32,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.error,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
  manageText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  },
  manageDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
    marginLeft: 28,
    marginBottom: 12,
  },
  deleteDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -4,
    marginLeft: 28,
  },
});
