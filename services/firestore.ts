import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserPreferences, ScanResult, DishAnalysis } from '../types';

const DEFAULT_PREFERENCES: UserPreferences = {
  dietaryRestrictions: [],
  avoidIngredients: [],
  goals: [],
};

/**
 * Save user preferences to Firestore (overwrites existing).
 */
export async function savePreferences(
  userId: string,
  prefs: UserPreferences
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'preferences', 'main'), prefs);
}

/**
 * Load user preferences from Firestore. Returns defaults if none saved.
 */
export async function loadPreferences(
  userId: string
): Promise<UserPreferences> {
  const snap = await getDoc(doc(db, 'users', userId, 'preferences', 'main'));
  if (!snap.exists()) return { ...DEFAULT_PREFERENCES };
  const data = snap.data();
  return {
    dietaryRestrictions: data.dietaryRestrictions ?? [],
    avoidIngredients: data.avoidIngredients ?? [],
    goals: data.goals ?? [],
  };
}

/**
 * Save a scan result to Firestore. Returns the generated document ID.
 */
export async function saveScanResult(
  userId: string,
  result: Omit<ScanResult, 'id' | 'userId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'users', userId, 'scans'), {
    ...result,
    userId,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Load all scan history for a user, newest first.
 */
export async function loadScanHistory(
  userId: string
): Promise<ScanResult[]> {
  const q = query(
    collection(db, 'users', userId, 'scans'),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      restaurantName: data.restaurantName ?? 'Menu Scan',
      menuText: data.menuText ?? '',
      dishes: (data.dishes ?? []) as DishAnalysis[],
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(),
      imageURL: data.imageURL,
    };
  });
}

/**
 * Rename a scan result in Firestore.
 */
export async function updateScanName(
  userId: string,
  scanId: string,
  restaurantName: string
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'scans', scanId), { restaurantName });
}

/**
 * Delete a single scan result from Firestore.
 */
export async function deleteScanResult(
  userId: string,
  scanId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'scans', scanId));
}
