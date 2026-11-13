import { useEffect, useState } from 'react';
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, facebookProvider, googleProvider } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { clearContactCache } from './db';

export interface AuthState {
  /** Firebase Auth user (null = signed out). */
  firebaseUser: User | null;
  /** Firestore profile (null = signed in but onboarding not finished). */
  profile: UserProfile | null;
  /** True if a document admins/{uid} exists. Create it manually in the Firebase console. */
  isAdmin: boolean;
  /** Role used by the UI. */
  role: UserRole;
  /** False until auth + profile + admin status are known. */
  ready: boolean;
  /** Signed in but no profile yet and not an admin → onboarding must be completed. */
  needsOnboarding: boolean;
}

export function useAuthState(): AuthState {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Each state remembers which uid it belongs to, so a stale value from a previous
  // account (or from "signed out") is never mistaken for the current one.
  const [profileState, setProfileState] = useState<{ uid: string | null; profile: UserProfile | null }>({
    uid: null,
    profile: null,
  });
  const [adminState, setAdminState] = useState<{ uid: string | null; isAdmin: boolean }>({ uid: null, isAdmin: false });

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        clearContactCache();
        setFirebaseUser(u);
        setAuthReady(true);
      }),
    []
  );

  const currentUid = firebaseUser?.uid ?? null;

  useEffect(() => {
    if (!currentUid) return;

    const unsub = onSnapshot(
      doc(db, 'users', currentUid),
      (snap) => setProfileState({ uid: currentUid, profile: snap.exists() ? (snap.data() as UserProfile) : null }),
      (err) => {
        console.error('[users]', err);
        setProfileState({ uid: currentUid, profile: null });
      }
    );

    let cancelled = false;
    getDoc(doc(db, 'admins', currentUid))
      .then((snap) => !cancelled && setAdminState({ uid: currentUid, isAdmin: snap.exists() }))
      .catch(() => !cancelled && setAdminState({ uid: currentUid, isAdmin: false }));

    return () => {
      cancelled = true;
      unsub();
    };
  }, [currentUid]);

  const profileReady = !currentUid || profileState.uid === currentUid;
  const adminReady = !currentUid || adminState.uid === currentUid;
  const profile = currentUid && profileState.uid === currentUid ? profileState.profile : null;
  const isAdmin = !!currentUid && adminState.uid === currentUid && adminState.isAdmin;

  const ready = authReady && profileReady && adminReady;
  // Admin rights come ONLY from admins/{uid} (same check as firestore.rules). A legacy users/{uid}.role == 'admin'
  // from an older version is ignored, otherwise the admin panel would open without the data it needs.
  const profileRole = profile?.role === 'imam' || profile?.role === 'mosque' ? profile.role : 'visitor';
  const role: UserRole = !firebaseUser || !ready ? 'visitor' : isAdmin ? 'admin' : profileRole;

  return {
    firebaseUser,
    profile,
    isAdmin,
    role,
    ready,
    needsOnboarding: ready && !!firebaseUser && !isAdmin && !profile,
  };
}

export async function signInWith(provider: 'google' | 'facebook') {
  return signInWithPopup(auth, provider === 'google' ? googleProvider : facebookProvider);
}

export async function signOutUser() {
  clearContactCache();
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// E-mail + password
// ---------------------------------------------------------------------------

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

/** Creates the account and sends a verification e-mail (the account works right away). */
export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  auth.languageCode = 'ar';
  await sendEmailVerification(cred.user).catch(() => {});
  return cred;
}

export async function resetPassword(email: string) {
  auth.languageCode = 'ar';
  await sendPasswordResetEmail(auth, email.trim());
}

// ---------------------------------------------------------------------------
// Phone (SMS code). Needs an invisible reCAPTCHA attached to an element on the page.
// ---------------------------------------------------------------------------

let recaptcha: RecaptchaVerifier | null = null;

export async function sendPhoneCode(phoneE164: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
  recaptcha?.clear();
  recaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  auth.languageCode = 'ar';
  try {
    return await signInWithPhoneNumber(auth, phoneE164, recaptcha);
  } catch (err) {
    recaptcha.clear();
    recaptcha = null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Re-authentication before account deletion
// ---------------------------------------------------------------------------

const RECENT_LOGIN_MS = 5 * 60 * 1000;

/**
 * Confirms the user's identity again (Firebase requires a recent sign-in before deleting an account).
 * Throws BEFORE anything is deleted if it cannot be confirmed.
 */
export async function reauthenticate() {
  const user = auth.currentUser;
  if (!user) throw new Error('not signed in');
  const providers = user.providerData.map((p) => p.providerId);

  if (providers.includes('password') && user.email) {
    const password = window.prompt('لتأكيد حذف الحساب، أدخل كلمة المرور:');
    if (!password) throw Object.assign(new Error('cancelled'), { code: 'auth/cancelled-popup-request' });
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return;
  }
  if (providers.includes('phone')) {
    // Re-sending an SMS here would need a second code form; ask for a fresh sign-in instead.
    const { authTime } = await user.getIdTokenResult();
    if (Date.now() - Date.parse(authTime) > RECENT_LOGIN_MS) {
      throw Object.assign(new Error('requires recent login'), { code: 'auth/requires-recent-login' });
    }
    return;
  }
  const isFacebook = providers.some((p) => p.includes('facebook'));
  await reauthenticateWithPopup(user, isFacebook ? facebookProvider : googleProvider);
}
