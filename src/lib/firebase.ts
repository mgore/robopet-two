import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  onSnapshot 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Support active API key override via environment variable if key was rotated
const activeApiKey = ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || firebaseConfig.apiKey;

const effectiveConfig = {
  ...firebaseConfig,
  apiKey: activeApiKey
};

// Initialize Firebase App
const app = initializeApp(effectiveConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with default database or custom ID if specified
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = (customDbId && customDbId !== "(default)")
  ? getFirestore(app, customDbId)
  : getFirestore(app);

// Test connection on boot as mandated by integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('not found')) {
        console.info("Firestore status: database connecting or waiting for initial creation in console.");
      }
    }
  }
}
testConnection();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export interface UserProfileDoc {
  uid: string;
  name: string;
  screenName: string;
  email: string;
  selectedDrawer: any[];
  contingencyDrawer?: any[];
  robotType?: string;
  customGoal?: string;
  budget?: number;
  budgetMargin?: number;
  updatedAt: string;
  createdAt?: string;
}

export type FirestoreUserDocument = UserProfileDoc;

// Save or Update user profile and hardware selection in Firestore
export async function saveUserDataToFirestore(
  uid: string, 
  data: Partial<UserProfileDoc>
) {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);
  
  try {
    const payload: Partial<UserProfileDoc> = {
      ...data,
      uid,
      updatedAt: new Date().toISOString()
    };

    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to real-time user document updates
export function subscribeUserData(
  uid: string, 
  callback: (data: UserProfileDoc | null) => void,
  onError?: (err: any) => void
) {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) {
    return () => {};
  }
  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  return onSnapshot(
    userRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfileDoc);
      } else {
        callback(null);
      }
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.GET, path);
      if (onError) {
        onError(info);
      }
    }
  );
}

// Auth wrappers
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

export async function getIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function getAccessToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile };
export type { User };

