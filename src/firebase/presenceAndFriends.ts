import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';

export interface OnlineUserPresence {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  characterName?: string;
  characterClass?: string;
  characterLevel?: number;
  lastSeen: number;
  status: 'online' | 'in_game';
  currentRoomCode?: string;
}

export interface FriendUser {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  characterName?: string;
  characterClass?: string;
  characterLevel?: number;
  addedAt: number;
}

export interface GameInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName?: string;
  roomCode: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

const LOCAL_PRESENCE_KEY = 'arcanasheet_local_presence_users';
const LOCAL_FRIENDS_PREFIX = 'arcanasheet_local_friends_';
const LOCAL_INVITES_KEY = 'arcanasheet_local_game_invites';

function getLocalPresenceUsers(): OnlineUserPresence[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRESENCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPresenceUsers(users: OnlineUserPresence[]): void {
  try {
    localStorage.setItem(LOCAL_PRESENCE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getLocalFriends(userId: string): FriendUser[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_FRIENDS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFriends(userId: string, friends: FriendUser[]): void {
  try {
    localStorage.setItem(`${LOCAL_FRIENDS_PREFIX}${userId}`, JSON.stringify(friends));
  } catch {
    // ignore
  }
}

function getLocalInvites(): GameInvite[] {
  try {
    const raw = localStorage.getItem(LOCAL_INVITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInvites(invites: GameInvite[]): void {
  try {
    localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(invites));
  } catch {
    // ignore
  }
}

/**
 * Atualiza a presença do usuário online no Firestore (ou localmente)
 */
export async function updateUserPresence(presence: OnlineUserPresence): Promise<void> {
  const data: OnlineUserPresence = {
    ...presence,
    lastSeen: Date.now(),
  };

  if (db) {
    try {
      const userRef = doc(db, 'online_users', presence.userId);
      await setDoc(userRef, data, { merge: true });
    } catch (e) {
      console.warn('Erro ao atualizar presença no Firestore, usando fallback local:', e);
    }
  }

  // Atualiza cache local
  const current = getLocalPresenceUsers().filter((u) => u.userId !== presence.userId);
  saveLocalPresenceUsers([...current, data]);
}

/**
 * Marca o usuário como offline ao sair ou deslogar
 */
export async function setUserOffline(userId: string): Promise<void> {
  if (db) {
    try {
      const userRef = doc(db, 'online_users', userId);
      await deleteDoc(userRef);
    } catch (e) {
      console.warn('Erro ao remover presença no Firestore:', e);
    }
  }

  const current = getLocalPresenceUsers().filter((u) => u.userId !== userId);
  saveLocalPresenceUsers(current);
}

/**
 * Escuta em tempo real os usuários online no site
 */
export function subscribeToOnlineUsers(
  callback: (users: OnlineUserPresence[]) => void
): () => void {
  if (db) {
    try {
      const colRef = collection(db, 'online_users');
      // Escuta todos os usuários na coleção e filtra no cliente quem esteve ativo nos últimos 2 minutos
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const now = Date.now();
          const activeWindow = 2 * 60 * 1000; // 2 minutos
          const onlineList: OnlineUserPresence[] = [];

          snapshot.forEach((docSnap) => {
            const u = docSnap.data() as OnlineUserPresence;
            if (u && now - (u.lastSeen || 0) <= activeWindow) {
              onlineList.push(u);
            }
          });

          // Salva no cache local
          saveLocalPresenceUsers(onlineList);
          callback(onlineList);
        },
        (err) => {
          console.warn('Erro na assinatura de usuários online do Firestore, usando fallback:', err);
          callback(getLocalPresenceUsers());
        }
      );

      return unsubscribe;
    } catch (e) {
      console.warn('Falha ao inicializar onSnapshot de usuários online:', e);
    }
  }

  // Fallback local: chama uma vez com o cache local
  callback(getLocalPresenceUsers());
  return () => {};
}

/**
 * Obtém a lista de amigos de um usuário
 */
export async function getFriendsList(userId: string): Promise<FriendUser[]> {
  if (db) {
    try {
      const ref = doc(db, 'user_friends', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as { friends?: FriendUser[] };
        return data.friends || [];
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de amigos no Firestore:', e);
    }
  }

  return getLocalFriends(userId);
}

/**
 * Adiciona um amigo à lista de amigos do usuário
 */
export async function addFriend(
  userId: string,
  friend: Omit<FriendUser, 'addedAt'>
): Promise<boolean> {
  const newFriend: FriendUser = {
    ...friend,
    addedAt: Date.now(),
  };

  const existing = await getFriendsList(userId);
  if (existing.some((f) => f.userId === friend.userId || (friend.email && f.email === friend.email))) {
    return false; // Já é amigo
  }

  const updated = [...existing, newFriend];

  if (db) {
    try {
      const ref = doc(db, 'user_friends', userId);
      await setDoc(ref, { friends: updated }, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar amigo no Firestore:', e);
    }
  }

  saveLocalFriends(userId, updated);
  return true;
}

/**
 * Remove um amigo da lista de amigos do usuário
 */
export async function removeFriend(userId: string, friendUserId: string): Promise<boolean> {
  const existing = await getFriendsList(userId);
  const updated = existing.filter((f) => f.userId !== friendUserId);

  if (db) {
    try {
      const ref = doc(db, 'user_friends', userId);
      await setDoc(ref, { friends: updated }, { merge: true });
    } catch (e) {
      console.warn('Erro ao remover amigo no Firestore:', e);
    }
  }

  saveLocalFriends(userId, updated);
  return true;
}

/**
 * Escuta em tempo real as atualizações na lista de amigos do usuário
 */
export function subscribeToFriends(
  userId: string,
  callback: (friends: FriendUser[]) => void
): () => void {
  if (db) {
    try {
      const ref = doc(db, 'user_friends', userId);
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as { friends?: FriendUser[] };
            const friends = data.friends || [];
            saveLocalFriends(userId, friends);
            callback(friends);
          } else {
            callback(getLocalFriends(userId));
          }
        },
        (err) => {
          console.warn('Erro na assinatura de amigos:', err);
          callback(getLocalFriends(userId));
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Falha ao inicializar onSnapshot de amigos:', e);
    }
  }

  callback(getLocalFriends(userId));
  return () => {};
}

/**
 * Envia um convite de jogo para um amigo ("Chamar para Jogar")
 */
export async function sendGameInvite(
  invite: Omit<GameInvite, 'id' | 'timestamp' | 'status'>
): Promise<string> {
  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fullInvite: GameInvite = {
    ...invite,
    id: inviteId,
    timestamp: Date.now(),
    status: 'pending',
  };

  if (db) {
    try {
      const ref = doc(db, 'game_invites', inviteId);
      await setDoc(ref, fullInvite);
    } catch (e) {
      console.warn('Erro ao criar convite de jogo no Firestore:', e);
    }
  }

  // Salva no cache local
  const current = getLocalInvites().filter((i) => i.id !== inviteId);
  saveLocalInvites([...current, fullInvite]);

  return inviteId;
}

/**
 * Escuta convites de jogo recebidos pelo usuário em tempo real
 */
export function subscribeToIncomingInvites(
  userId: string,
  callback: (invites: GameInvite[]) => void
): () => void {
  if (db) {
    try {
      const colRef = collection(db, 'game_invites');
      const q = query(colRef, where('toUserId', '==', userId), where('status', '==', 'pending'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: GameInvite[] = [];
          snapshot.forEach((d) => {
            const inv = d.data() as GameInvite;
            if (inv && inv.status === 'pending') {
              list.push(inv);
            }
          });
          callback(list);
        },
        (err) => {
          console.warn('Erro na assinatura de convites de jogo:', err);
          const locals = getLocalInvites().filter((i) => i.toUserId === userId && i.status === 'pending');
          callback(locals);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Falha ao inicializar onSnapshot de convites:', e);
    }
  }

  const locals = getLocalInvites().filter((i) => i.toUserId === userId && i.status === 'pending');
  callback(locals);
  return () => {};
}

/**
 * Responde a um convite de jogo (Aceitar ou Recusar)
 */
export async function respondToGameInvite(inviteId: string, accept: boolean): Promise<void> {
  const newStatus: 'accepted' | 'declined' = accept ? 'accepted' : 'declined';

  if (db) {
    try {
      const ref = doc(db, 'game_invites', inviteId);
      await updateDoc(ref, { status: newStatus });
    } catch (e) {
      console.warn('Erro ao responder convite no Firestore:', e);
    }
  }

  const current = getLocalInvites().map((i) => (i.id === inviteId ? { ...i, status: newStatus } : i));
  saveLocalInvites(current);
}
