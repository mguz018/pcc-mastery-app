import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { trackLogin, trackSignUp } from './analytics';
import { startSync, stopSync } from './sync';

// Comped accounts. Kept here rather than in Firestore so you can grant access
// without touching the database; move to Firestore if the list grows.
const MANUAL_ACCESS = [
  'drnancyauge@gmail.com',
  'huda.ayyub@gmail.com',
  'mcsguzman1@gmail.com',
  'aufdemarke@gmail.com'
];

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshPremium = useCallback(async (u = auth?.currentUser) => {
    if (!u || !db) { setPremium(null); return null; }

    if (MANUAL_ACCESS.includes((u.email || '').toLowerCase())) {
      const comped = { isPremium: true, expiryDate: Date.now() + 3.15e10, comped: true };
      setPremium(comped);
      return comped;
    }

    try {
      const snap = await getDoc(doc(db, 'users', u.uid));
      const data = snap.exists() ? snap.data() : null;
      const active = data && data.isPremium && data.expiryDate > Date.now();
      setPremium(active ? data : null);
      return active ? data : null;
    } catch (e) {
      console.error('Premium check failed:', e.message);
      setPremium(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // No auth instance means Firebase isn't configured — render as signed-out
    // instead of crashing on onAuthStateChanged(null, ...).
    if (!auth) { setLoading(false); return; }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await refreshPremium(u);
        startSync(u); // pull cloud progress + mirror future changes
      } else {
        setPremium(null);
        stopSync();
      }
      setLoading(false);
    });
    // Don't let a hung auth request block the whole app.
    const t = setTimeout(() => setLoading(false), 4000);
    return () => { unsub(); clearTimeout(t); };
  }, [refreshPremium]);

  // Surfaced to the user by Login.jsx's friendly() fallback if auth is down.
  const requireAuth = () => {
    if (!auth) throw new Error('Sign-in is temporarily unavailable. Please try again shortly.');
  };

  const login = async (email, password) => {
    requireAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    trackLogin('password');
    await refreshPremium(cred.user);
    return cred.user;
  };

  const register = async (email, password) => {
    requireAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    trackSignUp('password');
    return cred.user;
  };

  const resetPassword = (email) => { requireAuth(); return sendPasswordResetEmail(auth, email); };
  const logout = () => { requireAuth(); return signOut(auth); };

  const isPremium = Boolean(premium && premium.expiryDate > Date.now());

  return (
    <AuthContext.Provider
      value={{ user, premium, isPremium, loading, login, register, resetPassword, logout, refreshPremium }}
    >
      {children}
    </AuthContext.Provider>
  );
}
