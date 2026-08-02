import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// All VITE_ values are public by design — Firebase web config is not a secret.
// Access control lives in Firestore Security Rules, not in hiding these.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// getAuth() throws synchronously when the API key is missing or malformed.
// Unguarded, that single throw at import time tears down the entire app —
// including the public landing, pricing, and prep-guide pages that never touch
// auth. Initialize defensively so a config problem degrades to "auth
// unavailable" rather than a blank white screen for every visitor.
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let auth = null;
let db = null;

if (firebaseReady) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    // Leave auth/db null; AuthContext treats this as "signed out, no premium".
    console.error('Firebase failed to initialize:', err.message);
  }
} else {
  console.warn('Firebase config missing — auth and premium features are disabled for this build.');
}

export { auth, db };
