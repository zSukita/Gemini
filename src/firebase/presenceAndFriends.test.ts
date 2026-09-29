import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./config', () => ({
  db: null,
}));

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
// @ts-expect-error - node environment polyfill
globalThis.localStorage = localStorageMock;

const windowListeners: Record<string, Function[]> = {};
// @ts-expect-error - node environment polyfill
globalThis.window = {
  addEventListener: (type: string, fn: Function) => {
    windowListeners[type] = windowListeners[type] || [];
    windowListeners[type].push(fn);
  },
  removeEventListener: (type: string, fn: Function) => {
    windowListeners[type] = (windowListeners[type] || []).filter((f) => f !== fn);
  },
  dispatchEvent: (ev: any) => {
    (windowListeners[ev.type] || []).forEach((fn) => fn(ev));
    return true;
  },
};
// @ts-expect-error - node environment polyfill
globalThis.Event = class Event {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
};

import {
  updateUserPresence,
  setUserOffline,
  subscribeToOnlineUsers,
  isPresenceUsingLocalFallback,
  addFriend,
  removeFriend,
  getFriendsList,
  sendGameInvite,
  respondToGameInvite,
  sendDirectMessage,
  subscribeToDirectMessages,
  markDirectMessagesAsRead,
  findUserByEmailOrId,
  type OnlineUserPresence,
  type FriendUser,
  type DirectMessage,
} from './presenceAndFriends';
import { p2pManager } from '../utils/peerService';

describe('presenceAndFriends service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Limpeza de presença
  it('updates, tracks and cleans up user presence in local fallback', async () => {
    const user: OnlineUserPresence = {
      userId: 'test-user-1',
      name: 'Valeros',
      characterName: 'Valeros o Bravo',
      characterClass: 'Guerreiro',
      characterLevel: 3,
      lastSeen: Date.now(),
      status: 'online',
    };

    await updateUserPresence(user);

    const raw = localStorage.getItem('arcanasheet_local_presence_users');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].userId).toBe('test-user-1');
    expect(parsed[0].name).toBe('Valeros');

    // Remove user when setting offline (limpeza de presença)
    await setUserOffline('test-user-1');
    const rawAfter = localStorage.getItem('arcanasheet_local_presence_users');
    const parsedAfter = JSON.parse(rawAfter!);
    expect(parsedAfter.length).toBe(0);
  });

  // 2. Expiração de usuários inativos (> 5 min)
  it('filters out inactive users after timeout (> 5 minutes)', async () => {
    const now = Date.now();
    const activeUser: OnlineUserPresence = {
      userId: 'active-user',
      name: 'Guerreiro Ativo',
      lastSeen: now - 60 * 1000, // 1 minuto atrás (ativo)
      status: 'online',
    };
    const inactiveUser: OnlineUserPresence = {
      userId: 'inactive-user',
      name: 'Mago Ausente',
      lastSeen: now - 6 * 60 * 1000, // 6 minutos atrás (inativo / expirado)
      status: 'online',
    };

    localStorage.setItem(
      'arcanasheet_local_presence_users',
      JSON.stringify([activeUser, inactiveUser])
    );

    let observedUsers: OnlineUserPresence[] = [];
    const unsub = subscribeToOnlineUsers((users) => {
      observedUsers = users;
    });

    // Apenas o usuário ativo (< 5 min) deve permanecer
    expect(observedUsers.some((u) => u.userId === 'active-user')).toBe(true);
    expect(observedUsers.some((u) => u.userId === 'inactive-user')).toBe(false);

    unsub();
  });

  // 3. Adição de amigo online e offline (com ID estável)
  it('adds and retrieves friends with stable IDs', async () => {
    const friend: Omit<FriendUser, 'addedAt'> = {
      userId: 'stable-friend-uid',
      name: 'Merisiel',
      email: 'merisiel@rpg.com',
      characterName: 'Merisiel',
      characterClass: 'Ladino',
      characterLevel: 2,
    };

    const added = await addFriend('my-user-id', friend);
    expect(added).toBe(true);

    const friends = await getFriendsList('my-user-id');
    expect(friends.length).toBe(1);
    expect(friends[0].userId).toBe('stable-friend-uid');
    expect(friends[0].name).toBe('Merisiel');

    // Previne duplicados
    const duplicate = await addFriend('my-user-id', friend);
    expect(duplicate).toBe(false);
  });

  // 4. Falha ao tentar salvar amigo com ID temporário / inválido
  it('rejects adding friend with provisional/temporary IDs or empty ID', async () => {
    const provisionalFriend: Omit<FriendUser, 'addedAt'> = {
      userId: 'friend_123456789_abc', // ID temporário não autenticado
      name: 'Provisional User',
    };

    await expect(addFriend('my-user-id', provisionalFriend)).rejects.toThrow(
      /identificador temporário/i
    );

    const emptyIdFriend: Omit<FriendUser, 'addedAt'> = {
      userId: '',
      name: 'No Id',
    };

    await expect(addFriend('my-user-id', emptyIdFriend)).rejects.toThrow();
  });

  // 5. Envio bem-sucedido de mensagem direta
  it('sends direct messages successfully and marks them as read', async () => {
    let received: DirectMessage[] = [];
    const unsub = subscribeToDirectMessages('user-b', (msgs) => {
      received = msgs;
    });

    const msg = await sendDirectMessage({
      fromUserId: 'user-a',
      fromUserName: 'Aragorn',
      toUserId: 'user-b',
      toUserName: 'Legolas',
      content: 'Eles estão levando os hobbits para Isengard!',
    });

    expect(msg.id).toBeTruthy();
    expect(msg.content).toBe('Eles estão levando os hobbits para Isengard!');
    expect(msg.read).toBe(false);

    expect(received.length).toBe(1);
    expect(received[0].content).toBe('Eles estão levando os hobbits para Isengard!');
    expect(received[0].read).toBe(false);

    // Marca como lida
    await markDirectMessagesAsRead('user-b', 'user-a');
    expect(received[0].read).toBe(true);

    unsub();
  });

  // 6. Falha de envio e validação de destinatário / conteúdo
  it('fails sending when recipient or content is invalid', async () => {
    // Destinatário vazio
    await expect(
      sendDirectMessage({
        fromUserId: 'user-a',
        fromUserName: 'Aragorn',
        toUserId: '',
        toUserName: 'Ninguém',
        content: 'Olá!',
      })
    ).rejects.toThrow(/Destinatário.*inválido/i);

    // Remetente vazio
    await expect(
      sendDirectMessage({
        fromUserId: '',
        fromUserName: 'Desconhecido',
        toUserId: 'user-b',
        toUserName: 'Legolas',
        content: 'Olá!',
      })
    ).rejects.toThrow(/Remetente.*inválido/i);

    // Conteúdo vazio
    await expect(
      sendDirectMessage({
        fromUserId: 'user-a',
        fromUserName: 'Aragorn',
        toUserId: 'user-b',
        toUserName: 'Legolas',
        content: '   ',
      })
    ).rejects.toThrow(/conteúdo.*vazio/i);

    // Conteúdo excessivo (> 2000 caracteres)
    const longText = 'a'.repeat(2001);
    await expect(
      sendDirectMessage({
        fromUserId: 'user-a',
        fromUserName: 'Aragorn',
        toUserId: 'user-b',
        toUserName: 'Legolas',
        content: longText,
      })
    ).rejects.toThrow(/2000 caracteres/i);
  });

  // 7. Deduplicação de mensagens
  it('deduplicates messages arriving multiple times', async () => {
    let received: DirectMessage[] = [];
    const unsub = subscribeToDirectMessages('user-b', (msgs) => {
      received = msgs;
    });

    const msg = await sendDirectMessage({
      fromUserId: 'user-a',
      fromUserName: 'Aragorn',
      toUserId: 'user-b',
      toUserName: 'Legolas',
      content: 'Mensagem única',
    });

    // Injeta a mesma mensagem novamente no localStorage simulando entrega duplicada via P2P + Firestore
    const existing = JSON.parse(
      localStorage.getItem('arcanasheet_local_direct_messages') || '[]'
    );
    existing.push(msg); // insere duplicata idêntica
    localStorage.setItem('arcanasheet_local_direct_messages', JSON.stringify(existing));

    // Despacha evento de sincronização local
    window.dispatchEvent(new Event('storage'));

    // Deduplicação deve manter apenas 1 entrada para o id
    const uniqueIds = new Set(received.map((m) => m.id));
    expect(received.length).toBe(uniqueIds.size);

    unsub();
  });

  // 8. Busca de usuário por email ou ID real
  it('finds users by stable account ID or exact email', async () => {
    const onlineUser: OnlineUserPresence = {
      userId: 'stable-user-456',
      name: 'Gimli',
      email: 'gimli@moria.com',
      lastSeen: Date.now(),
      status: 'online',
    };
    await updateUserPresence(onlineUser);

    const foundById = await findUserByEmailOrId('stable-user-456');
    expect(foundById).toBeTruthy();
    expect(foundById?.userId).toBe('stable-user-456');
    expect(foundById?.name).toBe('Gimli');

    const foundByEmail = await findUserByEmailOrId('gimli@moria.com');
    expect(foundByEmail).toBeTruthy();
    expect(foundByEmail?.userId).toBe('stable-user-456');

    // Não deve encontrar usuário inexistente
    const notFound = await findUserByEmailOrId('naoexiste@dominio.com');
    expect(notFound).toBeNull();
  });

  // 9. Fallback status reporting
  it('reports local fallback status correctly when Firestore is offline', () => {
    // Como mockamos db = null, o fallback deve estar ativo
    expect(isPresenceUsingLocalFallback()).toBe(true);
  });

  // 10. P2P directed delivery - Terceiro participante não recebe mensagem privada
  it('P2P directed delivery sends message only to intended target peer', () => {
    const sentPacketsToB: any[] = [];
    const sentPacketsToC: any[] = [];

    const mockConnB: any = {
      peer: 'peer-b',
      open: true,
      send: (data: any) => sentPacketsToB.push(data),
      close: vi.fn(),
    };

    const mockConnC: any = {
      peer: 'peer-c',
      open: true,
      send: (data: any) => sentPacketsToC.push(data),
      close: vi.fn(),
    };

    // Registrar conexões e peers ativos no p2pManager
    (p2pManager as any).isHost = true;
    (p2pManager as any).activePeers = [
      { peerId: 'peer-b', name: 'User B', userId: 'user-b' },
      { peerId: 'peer-c', name: 'User C', userId: 'user-c' },
    ];
    (p2pManager as any).connections.set('peer-b', mockConnB);
    (p2pManager as any).connections.set('peer-c', mockConnC);

    const success = p2pManager.sendDirected('peer-b', {
      type: 'DIRECT_MESSAGE',
      senderId: 'host-peer',
      senderName: 'Host',
      targetPeerId: 'peer-b',
      payload: {
        id: 'dm-secret-1',
        fromUserId: 'host',
        toUserId: 'user-b',
        content: 'Segredo exclusivo para B',
      },
      timestamp: Date.now(),
    });

    expect(success).toBe(true);
    // Peer B recebeu o pacote
    expect(sentPacketsToB.length).toBe(1);
    expect(sentPacketsToB[0].payload.content).toBe('Segredo exclusivo para B');

    // Terceiro participante (Peer C) NÃO recebeu nada!
    expect(sentPacketsToC.length).toBe(0);

    // Limpar conexões e estado do teste
    (p2pManager as any).connections.clear();
    (p2pManager as any).activePeers = [];
    (p2pManager as any).isHost = false;
  });
});
