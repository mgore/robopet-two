import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { deleteUser, reauthenticateWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "../lib/firebase";

const LOCAL_KEYS = ["ai_robopet_local_project_v1", "roboarchitect_local_project_v1"];

async function deleteAuthoredDocs(collectionName: string, uid: string) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where("authorUid", "==", uid))
  );
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}

/**
 * Permanently deletes the signed-in user's account and the data they own:
 * published showcase projects, community posts, their profile document,
 * locally cached builds, and finally the Firebase Auth account itself.
 * Required for Google Play's account deletion policy.
 */
export async function deleteAccountAndData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in to delete your account.");
  const uid = user.uid;

  await deleteAuthoredDocs("showcaseProjects", uid);
  await deleteAuthoredDocs("communityPosts", uid);
  await deleteDoc(doc(db, "users", uid));

  for (const key of LOCAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable; nothing to clear.
    }
  }

  try {
    await deleteUser(user);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== "auth/requires-recent-login") throw err;

    const usesGoogle = user.providerData.some((p) => p.providerId === "google.com");
    if (!usesGoogle) {
      throw new Error(
        "Your data was deleted, but Firebase needs a fresh sign-in to remove the login itself. Sign out, sign back in, and choose Delete account again."
      );
    }
    await reauthenticateWithPopup(user, googleProvider);
    await deleteUser(user);
  }
}
