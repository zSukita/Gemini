import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Character } from '../types/dnd5e';
import { sanitizeCharacter } from '../utils/characterSanitizer';

/** Map de timers de debounce específicos por usuário */
const saveTimersByUser = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Cancela qualquer sincronização pendente para um usuário específico
 * ou para todos os usuários (útil no logout ou na troca rápida de conta).
 */
export function cancelPendingSync(userId?: string): void {
  if (userId) {
    const timer = saveTimersByUser.get(userId);
    if (timer) {
      clearTimeout(timer);
      saveTimersByUser.delete(userId);
    }
  } else {
    for (const timer of saveTimersByUser.values()) {
      clearTimeout(timer);
    }
    saveTimersByUser.clear();
  }
}

/**
 * Salva a lista de personagens e o ID ativo no Firestore.
 */
export async function saveCharactersToCloud(
  userId: string,
  characters: Character[],
  activeId: string,
): Promise<void> {
  if (!db || !userId) return;
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      characters,
      activeId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Carrega os personagens do Firestore com sanitização estrita.
 * Retorna null se não houver dados salvos ou se o Firestore estiver indisponível.
 */
export async function loadCharactersFromCloud(
  userId: string,
): Promise<{ characters: Character[]; activeId: string } | null> {
  if (!db || !userId) return null;
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data || !data.characters || !Array.isArray(data.characters)) return null;

  // Aplica o sanitizador em cada ficha retornada da nuvem
  const sanitized = data.characters.map((c: unknown) => sanitizeCharacter(c));
  if (sanitized.length === 0) return null;

  const validActiveId =
    typeof data.activeId === 'string' && sanitized.some((c) => c.id === data.activeId)
      ? data.activeId
      : sanitized[0].id;

  return {
    characters: sanitized,
    activeId: validActiveId,
  };
}

/**
 * Salva o perfil do usuário (displayName, email) no Firestore.
 */
export async function saveUserProfile(
  userId: string,
  displayName: string,
  email: string,
): Promise<void> {
  if (!db || !userId) return;
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      profile: { displayName, email },
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Sync debounced específico por usuário — chama saveCharactersToCloud com um atraso.
 * Cancela apenas o timer anterior do próprio usuário, sem interferir em outros.
 */
export function syncOnChange(
  userId: string,
  characters: Character[],
  activeId: string,
  delayMs = 2000,
): void {
  if (!userId) return;

  const existingTimer = saveTimersByUser.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    saveTimersByUser.delete(userId);
    saveCharactersToCloud(userId, characters, activeId).catch((err) =>
      console.error(`[characterSync] Erro ao sincronizar conta ${userId} com a nuvem:`, err),
    );
  }, delayMs);

  saveTimersByUser.set(userId, timer);
}
