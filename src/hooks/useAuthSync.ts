import { useState, useEffect, useCallback, useRef } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  auth,
  googleProvider,
  saveUserDataToFirestore,
  subscribeUserData,
  FirestoreUserDocument
} from "../lib/firebase";
import { HardwareComponent, RobotProfile } from "../types";

export interface UseAuthSyncOptions {
  activeDrawer: HardwareComponent[];
  setActiveDrawer: (drawer: HardwareComponent[]) => void;
  contingencyList: HardwareComponent[];
  setContingencyList: (list: HardwareComponent[]) => void;
  robotType: RobotProfile["type"];
  setRobotType: (type: RobotProfile["type"]) => void;
  customGoal: string;
  setCustomGoal: (goal: string) => void;
  budget: number;
  setBudget: (budget: number) => void;
  onNotify?: (message: string) => void;
}

export interface UseAuthSyncReturn {
  authUser: User | null;
  userDoc: FirestoreUserDocument | null;
  initialAuthChecked: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  syncStatus: "synced" | "syncing" | "local_only" | "offline";
  handleGoogleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = "ai_robopet_local_project_v1";
const LEGACY_STORAGE_KEY = "roboarchitect_local_project_v1";

export function useAuthSync({
  activeDrawer,
  setActiveDrawer,
  contingencyList,
  setContingencyList,
  robotType,
  setRobotType,
  customGoal,
  setCustomGoal,
  budget,
  setBudget,
  onNotify
}: UseAuthSyncOptions): UseAuthSyncReturn {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<FirestoreUserDocument | null>(null);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "local_only" | "offline">("local_only");

  const isInitialMount = useRef(true);

  // 1. Load saved build from local browser storage on initial mount ($0 Cloud Cost)
  useEffect(() => {
    try {
      const savedData =
        localStorage.getItem(LOCAL_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed.activeDrawer) && parsed.activeDrawer.length > 0) {
          setActiveDrawer(parsed.activeDrawer);
        }
        if (Array.isArray(parsed.contingencyList)) {
          setContingencyList(parsed.contingencyList);
        }
        if (parsed.robotType) setRobotType(parsed.robotType);
        if (parsed.customGoal) setCustomGoal(parsed.customGoal);
        if (typeof parsed.budget === "number") setBudget(parsed.budget);
      }
    } catch (e) {
      console.warn("Could not load from local storage:", e);
    }
  }, [setActiveDrawer, setContingencyList, setRobotType, setCustomGoal, setBudget]);

  // 2. Auto-save build state to local browser storage whenever changed ($0 Cloud Cost)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      const payload = {
        activeDrawer,
        contingencyList,
        robotType,
        customGoal,
        budget,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save to local storage:", e);
    }
  }, [activeDrawer, contingencyList, robotType, customGoal, budget]);

  // 3. Listen to Firebase Auth state
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (user) {
        setSyncStatus("syncing");
        unsubDoc = subscribeUserData(user.uid, (docData) => {
          if (docData) {
            setUserDoc(docData);
            if (Array.isArray(docData.selectedDrawer) && docData.selectedDrawer.length > 0) {
              setActiveDrawer(docData.selectedDrawer);
            }
            if (Array.isArray(docData.contingencyDrawer)) {
              setContingencyList(docData.contingencyDrawer);
            }
            if (docData.robotType) setRobotType(docData.robotType as any);
            if (docData.customGoal) setCustomGoal(docData.customGoal);
            if (typeof docData.budget === "number") setBudget(docData.budget);
            setSyncStatus("synced");
          }
        });
      } else {
        setUserDoc(null);
        setSyncStatus("local_only");
      }
      setInitialAuthChecked(true);
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, [setActiveDrawer, setContingencyList, setRobotType, setCustomGoal, setBudget]);

  // 4. Sync hardware components and settings to Firestore ONLY IF logged in
  useEffect(() => {
    if (authUser && initialAuthChecked) {
      setSyncStatus("syncing");
      saveUserDataToFirestore(authUser.uid, {
        uid: authUser.uid,
        selectedDrawer: activeDrawer,
        contingencyDrawer: contingencyList,
        robotType,
        customGoal,
        budget
      })
        .then(() => { setSyncStatus("synced"); })
        .catch((err) => {
          console.error("Auto sync drawer to Firestore failed:", err);
          setSyncStatus("offline");
        });
    }
  }, [activeDrawer, contingencyList, robotType, customGoal, budget, authUser, initialAuthChecked]);

  // 5. Auth Handlers
  const handleGoogleSignIn = useCallback(async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onNotify?.("Logged in successfully! Synced hardware build with Firestore cloud.");
    } catch (err: unknown) {
      const e = err as any;
      console.warn("Sign-in popup notification:", e?.message);
      setLoginError(e?.message || "Sign-in could not be completed.");
      onNotify?.("Sign in was cancelled or requires a pop-up allowance.");
    } finally {
      setIsLoggingIn(false);
    }
  }, [onNotify]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      setUserDoc(null);
      setSyncStatus("local_only");
      onNotify?.("Signed out. Switched to offline local storage ($0 cloud cost).");
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  }, [onNotify]);

  return {
    authUser,
    userDoc,
    initialAuthChecked,
    isLoggingIn,
    loginError,
    syncStatus,
    handleGoogleSignIn,
    handleSignOut
  };
}
