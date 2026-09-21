import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

export type { User };

/**
 * Cria uma conta com email e senha, define displayName.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  if (!auth) throw new Error('Firebase não configurado');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

/**
 * Faz login com email e senha.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!auth) throw new Error('Firebase não configurado');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Login com Google via popup.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase não configurado');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Deslogar.
 */
export async function logOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Envia email de redefinição de senha.
 */
export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase não configurado');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Listener de mudança de estado de autenticação.
 * Retorna a função para cancelar o listener.
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Traduz erros do Firebase Auth para mensagens em português.
 */
export function getAuthErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este email já está cadastrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/operation-not-allowed': 'Método de login não habilitado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este email.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/popup-blocked': 'Popup bloqueado pelo navegador. Permita popups e tente novamente.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  };
  return messages[errorCode] || 'Ocorreu um erro. Tente novamente.';
}
