import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
// Firebase web config is public by design (it identifies the project, it is not a secret).
// Access control is enforced by firestore.rules (Cloud Storage is not used).
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Local testing only: `VITE_FIREBASE_EMULATOR=1 npm run dev` talks to the Firebase emulators instead of the real project.
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
