import { useState, useEffect, useCallback } from 'react';
import {
  onAuthChange,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  resetPassword,
  getAuthErrorMessage,
  type User,
} from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';
import { saveUserProfile } from '../firebase/characterSync';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirebaseReady: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignup = useCallback(
    async (email: string, password: string, displayName: string) => {
      setError(null);
      setLoading(true);
      try {
        const newUser = await signUpWithEmail(email, password, displayName);
        // Salvar perfil no Firestore
        await saveUserProfile(
          newUser.uid,
          displayName,
          email,
        );
      } catch (err: unknown) {
        const code = (err as { code?: string }).code || '';
        setError(getAuthErrorMessage(code));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      // Salvar perfil no Firestore (merge)
      await saveUserProfile(
        googleUser.uid,
        googleUser.displayName || 'Aventureiro',
        googleUser.email || '',
      );
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await resetPassword(email);
      return true; // sucesso
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(code));
      return false;
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isFirebaseReady: isFirebaseConfigured,
    login: handleLogin,
    signup: handleSignup,
    loginWithGoogle: handleGoogleLogin,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    clearError,
  };
}
