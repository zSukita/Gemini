import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Character } from '../types/dnd5e';

/** Debounce timer ref */
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Salva a lista de personagens e o ID ativo no Firestore.
 */
export async function saveCharactersToCloud(
  userId: string,
  characters: Character[],
  activeId: string,
): Promise<void> {
  if (!db) return;
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
 * Carrega os personagens do Firestore.
 * Retorna null se não houver dados salvos.
 */
export async function loadCharactersFromCloud(
  userId: string,
): Promise<{ characters: Character[]; activeId: string } | null> {
  if (!db) return null;
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.characters || !Array.isArray(data.characters)) return null;
  return {
    characters: data.characters as Character[],
    activeId: (data.activeId as string) || data.characters[0]?.id || '',
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
  if (!db) return;
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
 * Sync debounced — chama saveCharactersToCloud com um atraso
 * para não fazer escritas excessivas no Firestore.
 */
export function syncOnChange(
  userId: string,
  characters: Character[],
  activeId: string,
  delayMs = 2000,
): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveCharactersToCloud(userId, characters, activeId).catch((err) =>
      console.error('Erro ao sincronizar com a nuvem:', err),
    );
  }, delayMs);
}
