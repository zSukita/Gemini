import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  or,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';
import { p2pManager } from '../utils/peerService';

export interface DirectMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromAvatarUrl?: string;
  toUserId: string;
  toUserName: string;
  content: string;
  timestamp: number;
  read: boolean;
}

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
const LOCAL_MESSAGES_KEY = 'arcanasheet_local_direct_messages';

function sanitizeFirestoreDoc<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeFirestoreDoc(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function isPermissionError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = ((err as { code?: string })?.code || '').toLowerCase();
  return code === 'permission-denied' || msg.includes('permission') || msg.includes('permiss');
}

const directMessageListeners = new Set<() => void>();

export function getLocalDirectMessages(): DirectMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalDirectMessages(messages: DirectMessage[]): void {
  try {
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }

  // Notifica subscribers locais em memória
  directMessageListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('arcanasheet_direct_message'));
  }
}

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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('arcanasheet_game_invite'));
  }
}

/**
 * Atualiza a presença do usuário online no Firestore (ou localmente)
 */
export async function updateUserPresence(presence: OnlineUserPresence): Promise<void> {
  // Ignora gravação remota no Firestore se for usuário local/convidado
  if (!presence.userId || presence.userId === 'local_user' || presence.userId.startsWith('local_')) {
    const localData: OnlineUserPresence = {
      ...presence,
      lastSeen: Date.now(),
    };
    const current = getLocalPresenceUsers().filter((u) => u.userId !== presence.userId);
    saveLocalPresenceUsers([...current, localData]);
    return;
  }

  const data: OnlineUserPresence = {
    ...presence,
    lastSeen: Date.now(),
  };

  if (db) {
    try {
      const userRef = doc(db, 'online_users', presence.userId);
      const sanitized = sanitizeFirestoreDoc(data as unknown as Record<string, unknown>);
      await setDoc(userRef, sanitized, { merge: true });
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Erro ao atualizar presença no Firestore, usando fallback local:', e);
      }
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
  if (db && userId && userId !== 'local_user' && !userId.startsWith('local_')) {
    try {
      const userRef = doc(db, 'online_users', userId);
      await deleteDoc(userRef);
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Erro ao remover presença no Firestore:', e);
      }
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
  const activeWindow = 10 * 60 * 1000; // 10 minutos para tolerância a abas em segundo plano e throttling

  const getValidOnlineUsers = (list: OnlineUserPresence[]) => {
    const now = Date.now();
    return list.filter((u) => {
      if (!u || !u.lastSeen) return false;
      const diff = now - u.lastSeen;
      // Aceita presença nos últimos 10 minutos ou com tolerância a relógios adiantados (até 5 min no futuro)
      return diff <= activeWindow && diff >= -5 * 60 * 1000;
    });
  };

  let firestoreUnsub: (() => void) | null = null;

  if (db) {
    try {
      const colRef = collection(db, 'online_users');
      firestoreUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const onlineList: OnlineUserPresence[] = [];
          snapshot.forEach((docSnap) => {
            const u = docSnap.data() as OnlineUserPresence;
            if (u) onlineList.push(u);
          });

          const valid = getValidOnlineUsers(onlineList);
          saveLocalPresenceUsers(valid);
          callback(valid);
        },
        (err) => {
          if (!isPermissionError(err)) {
            console.warn('Erro na assinatura de usuários online do Firestore, usando fallback local:', err);
          }
          callback(getValidOnlineUsers(getLocalPresenceUsers()));
        }
      );
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Falha ao inicializar onSnapshot de usuários online:', e);
      }
    }
  }

  const localHandler = () => {
    callback(getValidOnlineUsers(getLocalPresenceUsers()));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', localHandler);
    window.addEventListener('arcanasheet_presence_change', localHandler);
  }

  // Emissão inicial imediata
  callback(getValidOnlineUsers(getLocalPresenceUsers()));

  return () => {
    if (firestoreUnsub) {
      firestoreUnsub();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', localHandler);
      window.removeEventListener('arcanasheet_presence_change', localHandler);
    }
  };
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
          if (!isPermissionError(err)) {
            console.warn('Erro na assinatura de amigos:', err);
          }
          callback(getLocalFriends(userId));
        }
      );
      return unsubscribe;
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Falha ao inicializar onSnapshot de amigos:', e);
      }
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

  // 1. Salva no cache local e notifica a interface
  const current = getLocalInvites().filter((i) => i.id !== inviteId);
  saveLocalInvites([...current, fullInvite]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('arcanasheet_game_invite', { detail: fullInvite }));
  }

  // 2. Transmite via P2P se conectado
  if (p2pManager.isConnected()) {
    p2pManager.broadcast({
      type: 'GAME_INVITE',
      senderId: p2pManager.getRoomCode(),
      senderName: fullInvite.fromUserName,
      payload: fullInvite,
      timestamp: fullInvite.timestamp,
    });
  }

  // 3. Salva no Firestore
  if (db) {
    try {
      const ref = doc(db, 'game_invites', inviteId);
      const sanitized = sanitizeFirestoreDoc(fullInvite as unknown as Record<string, unknown>);
      await setDoc(ref, sanitized);
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Erro ao criar convite de jogo no Firestore:', e);
      }
    }
  }

  return inviteId;
}

/**
 * Escuta convites de jogo recebidos pelo usuário em tempo real
 */
export function subscribeToIncomingInvites(
  userId: string,
  callback: (invites: GameInvite[]) => void,
  currentUserName?: string
): () => void {
  const isTargetForUser = (inv: GameInvite) => {
    if (!inv || inv.status !== 'pending') return false;
    if (inv.toUserId === userId) return true;
    if (
      currentUserName &&
      inv.toUserName &&
      (inv.toUserName.trim().toLowerCase() === currentUserName.trim().toLowerCase() ||
        inv.toUserName.trim().toLowerCase().includes(currentUserName.trim().toLowerCase()) ||
        currentUserName.trim().toLowerCase().includes(inv.toUserName.trim().toLowerCase()))
    ) {
      return true;
    }
    return false;
  };

  let firestoreUnsub: (() => void) | null = null;

  if (db) {
    try {
      const colRef = collection(db, 'game_invites');
      const q = query(colRef, where('status', '==', 'pending'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          const list: GameInvite[] = [];
          snapshot.forEach((d) => {
            const inv = d.data() as GameInvite;
            if (isTargetForUser(inv)) {
              list.push(inv);
            }
          });

          // Mescla com locais para consistência
          const locals = getLocalInvites().filter(isTargetForUser);
          const map = new Map<string, GameInvite>();
          locals.forEach((i) => map.set(i.id, i));
          list.forEach((i) => map.set(i.id, i));
          const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
          callback(merged);
        },
        (err) => {
          if (!isPermissionError(err)) {
            console.warn('Erro na assinatura de convites de jogo no Firestore, usando fallback:', err);
          }
          callback(getLocalInvites().filter(isTargetForUser));
        }
      );
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Falha ao inicializar onSnapshot de convites:', e);
      }
    }
  }

  const localHandler = () => {
    callback(getLocalInvites().filter(isTargetForUser));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', localHandler);
    window.addEventListener('arcanasheet_game_invite', localHandler);
  }

  // Emissão inicial imediata
  callback(getLocalInvites().filter(isTargetForUser));

  return () => {
    if (firestoreUnsub) {
      firestoreUnsub();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', localHandler);
      window.removeEventListener('arcanasheet_game_invite', localHandler);
    }
  };
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
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Erro ao responder convite no Firestore:', e);
      }
    }
  }

  const current = getLocalInvites().map((i) => (i.id === inviteId ? { ...i, status: newStatus } : i));
  saveLocalInvites(current);
}

/**
 * Envia uma mensagem direta (sussurro) para outro usuário ou amigo
 */
export async function sendDirectMessage(
  msg: Omit<DirectMessage, 'id' | 'timestamp' | 'read'>
): Promise<DirectMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullMessage: DirectMessage = {
    ...msg,
    id,
    timestamp: Date.now(),
    read: false,
  };

  // 1. Atualiza cache local e notifica subscribers imediatamente (otimista)
  const current = getLocalDirectMessages();
  saveLocalDirectMessages([...current, fullMessage]);

  // 2. Se P2P estiver conectado, transmite via P2P para entrega em tempo real
  if (p2pManager.isConnected()) {
    p2pManager.broadcast({
      type: 'DIRECT_MESSAGE',
      senderId: p2pManager.getRoomCode(),
      senderName: fullMessage.fromUserName,
      payload: fullMessage,
      timestamp: fullMessage.timestamp,
    });
  }

  // 3. Salva no Firestore
  if (db) {
    try {
      const ref = doc(db, 'direct_messages', id);
      const sanitized = sanitizeFirestoreDoc(fullMessage as unknown as Record<string, unknown>);
      await setDoc(ref, sanitized);
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Erro ao salvar mensagem direta no Firestore:', e);
      }
    }
  }

  return fullMessage;
}

/**
 * Escuta em tempo real todas as mensagens diretas recebidas ou enviadas pelo usuário
 */
export function subscribeToDirectMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
): () => void {
  const filterForUser = (all: DirectMessage[]) => {
    return all.filter((m) => m.toUserId === userId || m.fromUserId === userId);
  };

  let firestoreUnsub: (() => void) | null = null;

  if (db) {
    try {
      const colRef = collection(db, 'direct_messages');
      const q = query(
        colRef,
        or(where('toUserId', '==', userId), where('fromUserId', '==', userId))
      );
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          const list: DirectMessage[] = [];
          snapshot.forEach((d) => {
            const m = d.data() as DirectMessage;
            if (m) list.push(m);
          });
          list.sort((a, b) => a.timestamp - b.timestamp);

          // Mescla com locais para consistência
          const locals = getLocalDirectMessages();
          const mergedMap = new Map<string, DirectMessage>();
          locals.forEach((m) => mergedMap.set(m.id, m));
          list.forEach((m) => mergedMap.set(m.id, m));
          const merged = Array.from(mergedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
          saveLocalDirectMessages(merged);
          callback(filterForUser(merged));
        },
        (err) => {
          if (!isPermissionError(err)) {
            console.warn('Erro na assinatura de mensagens diretas no Firestore, usando fallback local:', err);
          }
          callback(filterForUser(getLocalDirectMessages()));
        }
      );
    } catch (e: unknown) {
      if (!isPermissionError(e)) {
        console.warn('Falha ao inicializar onSnapshot de mensagens diretas:', e);
      }
    }
  }

  const handler = () => {
    callback(filterForUser(getLocalDirectMessages()));
  };

  directMessageListeners.add(handler);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handler);
    window.addEventListener('arcanasheet_direct_message', handler);
  }

  // Emissão inicial imediata
  callback(filterForUser(getLocalDirectMessages()));

  return () => {
    if (firestoreUnsub) {
      firestoreUnsub();
    }
    directMessageListeners.delete(handler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handler);
      window.removeEventListener('arcanasheet_direct_message', handler);
    }
  };
}

/**
 * Marca como lidas todas as mensagens diretas de uma conversa
 */
export async function markDirectMessagesAsRead(
  currentUserId: string,
  partnerUserId: string
): Promise<void> {
  const all = getLocalDirectMessages();
  const toUpdate: string[] = [];
  const updated = all.map((m) => {
    if (m.toUserId === currentUserId && m.fromUserId === partnerUserId && !m.read) {
      toUpdate.push(m.id);
      return { ...m, read: true };
    }
    return m;
  });

  saveLocalDirectMessages(updated);

  const firestore = db;
  if (firestore && toUpdate.length > 0) {
    try {
      await Promise.all(
        toUpdate.map((id) => updateDoc(doc(firestore, 'direct_messages', id), { read: true }))
      );
    } catch (e) {
      console.warn('Erro ao marcar mensagens como lidas no Firestore:', e);
    }
  }
}
