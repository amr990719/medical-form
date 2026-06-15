import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // FormContext registers its resetForm here on mount via registerResetForm()
  const resetFormRef = useRef(null);
  const registerResetForm = (fn) => { resetFormRef.current = fn; };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Clear form state BEFORE signing out so the cleared state
      // is visible before onAuthStateChanged fires.
      if (typeof resetFormRef.current === 'function') {
        resetFormRef.current();
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authInitialized, logout, registerResetForm }}>
      {children}
    </AuthContext.Provider>
  );
};