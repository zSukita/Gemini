import { useState, useEffect, useCallback, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Character } from '../types/dnd5e';
import {
  type OnlineUserPresence,
  type FriendUser,
  type GameInvite,
  updateUserPresence,
  setUserOffline,
  subscribeToOnlineUsers,
  subscribeToFriends,
  addFriend,
  removeFriend,
  sendGameInvite,
  subscribeToIncomingInvites,
  respondToGameInvite,
  findUserByUidOrOnlineName,
} from '../firebase/presenceAndFriends';

interface UseSocialPresenceProps {
  user: FirebaseUser | null;
  character?: Character | null;
  currentRoomCode?: string;
  isConnectedMultiplayer?: boolean;
}

export function useSocialPresence({
  user,
  character,
  currentRoomCode,
  isConnectedMultiplayer,
}: UseSocialPresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserPresence[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<GameInvite[]>([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const userId = user?.uid || 'local_user';
  const userName = character?.name || user?.displayName || user?.email?.split('@')[0] || 'Aventureiro';
  const avatarUrl = character?.avatarUrl || user?.photoURL || undefined;

  const currentRoomRef = useRef(currentRoomCode);
  currentRoomRef.current = currentRoomCode;

  const isConnectedRef = useRef(isConnectedMultiplayer);
  isConnectedRef.current = isConnectedMultiplayer;

  // Armazena em ref os dados mais recentes para evitar reiniciar o heartbeat a cada tecla digitada
  const latestPresenceRef = useRef({
    userId,
    name: userName,
    avatarUrl,
    characterName: character?.name,
    characterClass: character?.characterClass,
    characterLevel: character?.level,
  });
  latestPresenceRef.current = {
    userId,
    name: userName,
    avatarUrl,
    characterName: character?.name,
    characterClass: character?.characterClass,
    characterLevel: character?.level,
  };

  // 1. Atualização periódica de presença com Heartbeat estável a cada 30s
  useEffect(() => {
    if (!userId) return;

    const reportPresence = () => {
      const cur = latestPresenceRef.current;
      updateUserPresence({
        userId: cur.userId,
        name: cur.name,
        avatarUrl: cur.avatarUrl,
        characterName: cur.characterName,
        characterClass: cur.characterClass,
        characterLevel: cur.characterLevel,
        lastSeen: Date.now(),
        status: isConnectedRef.current && currentRoomRef.current ? 'in_game' : 'online',
        currentRoomCode: isConnectedRef.current ? currentRoomRef.current : undefined,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('arcanasheet_presence_change'));
      }
    };

    // Reporta imediatamente ao montar
    reportPresence();

    // Heartbeat regular estável
    const interval = setInterval(reportPresence, 30000);

    // Marca como offline ao fechar a janela
    const handleUnload = () => {
      setUserOffline(userId);
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(interval);
      // Limpa presença no Firestore ao desmontar o fluxo autenticado/logout
      setUserOffline(userId);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [userId]);

  // 2. Escuta lista de usuários online em tempo real e monitora status do Firestore
  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers(
      (users) => {
        setOnlineUsers(users);
      },
      (isFallback) => {
        setIsUsingFallback(isFallback);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Escuta lista de amigos do usuário em tempo real
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToFriends(userId, (fList) => {
      setFriends(fList);
    });

    return () => unsubscribe();
  }, [userId]);

  // 4. Escuta convites de jogo recebidos
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToIncomingInvites(
      userId,
      (invites) => {
        setPendingInvites(invites);
      },
      userName
    );

    return () => unsubscribe();
  }, [userId, userName]);

  // Ação: Adicionar amigo por UID ou pelo nome exato de alguém online
  const handleAddFriend = useCallback(
    async (identifier: string): Promise<{ success: boolean; message: string }> => {
      const clean = identifier.trim();
      if (!clean) return { success: false, message: 'Digite um UID ou o nome exato de alguém online.' };

      // Busca conta real e autenticada (online ou offline)
      const matched = await findUserByUidOrOnlineName(clean);

      if (!matched || matched.userId === userId) {
        if (clean.includes('@')) {
          return {
            success: false,
            message: 'Por privacidade, a busca por e-mail foi desativada. Use o UID do usuário ou adicione alguém pela lista de jogadores online.',
          };
        }
        if (matched?.userId === userId) {
          return { success: false, message: 'Você não pode adicionar a si mesmo como amigo.' };
        }
        return {
          success: false,
          message:
            'Não foi possível confirmar o usuário com este e-mail ou identificador. Certifique-se de que a conta está cadastrada e o dado digitado está correto.',
        };
      }

      const targetFriend: Omit<FriendUser, 'addedAt'> = {
        userId: matched.userId,
        name: matched.name,
        avatarUrl: matched.avatarUrl,
      };

      try {
        const ok = await addFriend(userId, targetFriend);
        if (ok) {
          return { success: true, message: `"${targetFriend.name}" foi adicionado aos seus amigos!` };
        } else {
          return { success: false, message: 'Este jogador já está na sua lista de amigos.' };
        }
      } catch (err: unknown) {
        return {
          success: false,
          message: (err as Error).message || 'Falha ao salvar amigo no Firestore. Verifique sua conexão.',
        };
      }
    },
    [userId]
  );

  // Ação: Remover amigo
  const handleRemoveFriend = useCallback(
    async (friendUserId: string) => {
      await removeFriend(userId, friendUserId);
    },
    [userId]
  );

  // Ação: Enviar convite de jogo para um amigo ("Chamar para Jogar")
  const handleSendGameInvite = useCallback(
    async (
      friendUserId: string,
      friendName: string,
      roomCodeToSend: string
    ): Promise<{ ok: boolean; inviteId?: string; error?: string }> => {
      if (!roomCodeToSend) {
        return { ok: false, error: 'Código de sala inválido.' };
      }

      if (!friendUserId || friendUserId.startsWith('friend_') || friendUserId === 'local_user') {
        return {
          ok: false,
          error: 'Não é possível enviar convite para um identificador provisório não autenticado.',
        };
      }

      try {
        const inviteId = await sendGameInvite({
          fromUserId: userId,
          fromUserName: userName,
          toUserId: friendUserId,
          toUserName: friendName,
          roomCode: roomCodeToSend,
        });

        return { ok: true, inviteId };
      } catch (err) {
        return {
          ok: false,
          error: (err as Error).message || 'Falha ao registrar convite no Firestore.',
        };
      }
    },
    [userId, userName]
  );

  // Ação: Aceitar convite de jogo
  const handleAcceptInvite = useCallback(
    async (invite: GameInvite): Promise<string> => {
      await respondToGameInvite(invite.id, true);
      setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
      return invite.roomCode;
    },
    []
  );

  // Ação: Recusar convite de jogo
  const handleDeclineInvite = useCallback(async (inviteId: string) => {
    await respondToGameInvite(inviteId, false);
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }, []);

  return {
    onlineUsers,
    friends,
    pendingInvites,
    isUsingFallback,
    handleAddFriend,
    handleRemoveFriend,
    handleSendGameInvite,
    handleAcceptInvite,
    handleDeclineInvite,
  };
}
