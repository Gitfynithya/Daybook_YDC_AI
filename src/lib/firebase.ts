import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { AuthUser, JournalEntry, JournalInteraction } from '../types';

// Initialize Firebase safely
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID from config
const dbId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, dbId);

// Test Firestore connection on boot as recommended in skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore notice: Client is offline or initializing connection.');
    }
  }
}
testFirestoreConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_PREFIX = 'daybook_local_entries_';

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

// Convert Firebase user to application AuthUser model
export function formatAuthUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    photoURL: user.photoURL || null,
  };
}

// Auth methods
export async function loginWithGoogle(): Promise<AuthUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = formatAuthUser(result.user);
  if (!user) throw new Error('Authentication succeeded but user profile was null');
  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// User-Isolated Firestore operations: paths under /users/{userId}/entries
export async function saveJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, 'userId'>
): Promise<JournalEntry> {
  if (!userId) throw new Error('User ID is required for isolation.');
  
  const fullEntry: JournalEntry = {
    ...entry,
    userId,
    updatedAt: Date.now(),
  };

  // If user is not authenticated with Firebase (e.g. sandbox explorer mode), persist locally
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${userId}`;
      const existing: JournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter((e) => e.id !== fullEntry.id);
      const updated = [fullEntry, ...filtered];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Local vault storage notice:', err);
    }
    return fullEntry;
  }

  // Authenticated Firestore session
  const docPath = `users/${userId}/entries/${entry.id}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entry.id);
    const cleanData = sanitizeForFirestore({
      ...fullEntry,
      _serverTimestamp: serverTimestamp(),
    });

    await setDoc(entryRef, cleanData, { merge: true });
    return fullEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  // If there is no active Firebase Auth session matching userId, load from local sandbox vault
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Notice loading local entries:', err);
    }
    return [];
  }

  // Authenticated Firestore query
  const pathForList = `users/${userId}/entries`;
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const entries: JournalEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as JournalEntry;
      entries.push({
        ...data,
        id: docSnap.id,
      });
    });

    return entries;
  } catch (error: any) {
    // If the error is index related, try fallback without orderBy
    if (error?.message && !error.message.includes('permission') && !error.message.includes('PERMISSION_DENIED')) {
      try {
        const entriesRef = collection(db, 'users', userId, 'entries');
        const snapshot = await getDocs(entriesRef);
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalEntry;
          entries.push({
            ...data,
            id: docSnap.id,
          });
        });
        return entries.sort((a, b) => b.updatedAt - a.updatedAt);
      } catch (fallbackError: any) {
        handleFirestoreError(fallbackError, OperationType.LIST, pathForList);
      }
    }

    handleFirestoreError(error, OperationType.LIST, pathForList);
  }
}

export async function removeJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    try {
      const key = `${LOCAL_STORAGE_PREFIX}${userId}`;
      const existing: JournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.filter((e) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
      console.warn('Local vault remove notice:', err);
    }
    return;
  }

  const docPath = `users/${userId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

