import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBjLg-ApttwXWzH_NtVSloJLzkYcIGi61o",
  authDomain: "medical-form-fe913.firebaseapp.com",
  projectId: "medical-form-fe913",
  storageBucket: "medical-form-fe913.firebasestorage.app",
  messagingSenderId: "671661093717",
  appId: "1:671661093717:web:dfb7365268dbe6d02f75dc"
};

/** Singleton Firebase app instance */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance */
export const auth = getAuth(app);

/** Firestore database instance */
export const db = getFirestore(app);

/** Firebase Storage instance */
export const storage = getStorage(app);

/**
 * Google OAuth provider — forces account selection on every sign-in
 * and sets the UI language to Arabic for a localized experience.
 */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('profile');
googleProvider.addScope('email');
auth.useDeviceLanguage(); // uses browser locale; override with auth.languageCode = 'ar' if needed

export default app;
