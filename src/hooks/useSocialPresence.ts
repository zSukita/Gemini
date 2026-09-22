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

  const userId = user?.uid || 'local_user';
  const userName = character?.name || user?.displayName || user?.email?.split('@')[0] || 'Aventureiro';
  const userEmail = user?.email || undefined;
  const avatarUrl = character?.avatarUrl || user?.photoURL || undefined;

  const currentRoomRef = useRef(currentRoomCode);
  currentRoomRef.current = currentRoomCode;

  const isConnectedRef = useRef(isConnectedMultiplayer);
  isConnectedRef.current = isConnectedMultiplayer;

  // 1. Atualização periódica de presença (Heartbeat a cada 30 segundos)
  useEffect(() => {
    if (!userId) return;

    const reportPresence = () => {
      updateUserPresence({
        userId,
        name: userName,
        email: userEmail,
        avatarUrl,
        characterName: character?.name,
        characterClass: character?.characterClass,
        characterLevel: character?.level,
        lastSeen: Date.now(),
        status: isConnectedRef.current && currentRoomRef.current ? 'in_game' : 'online',
        currentRoomCode: isConnectedRef.current ? currentRoomRef.current : undefined,
      });
    };

    // Reporta imediatamente
    reportPresence();

    // Heartbeat regular a cada 30 segundos
    const interval = setInterval(reportPresence, 30000);

    // Marca como offline ao fechar a janela
    const handleBeforeUnload = () => {
      setUserOffline(userId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, userName, userEmail, avatarUrl, character?.name, character?.characterClass, character?.level]);

  // 2. Escuta lista de usuários online em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });

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

    const unsubscribe = subscribeToIncomingInvites(userId, (invites) => {
      setPendingInvites(invites);
    });

    return () => unsubscribe();
  }, [userId]);

  // Ação: Adicionar amigo por email, nome ou id
  const handleAddFriend = useCallback(
    async (identifier: string): Promise<{ success: boolean; message: string }> => {
      const clean = identifier.trim();
      if (!clean) return { success: false, message: 'Digite um nome ou email.' };

      // Procura primeiro nos usuários online
      const matched = onlineUsers.find(
        (u) =>
          u.userId !== userId &&
          (u.email?.toLowerCase() === clean.toLowerCase() ||
            u.name.toLowerCase() === clean.toLowerCase() ||
            u.characterName?.toLowerCase() === clean.toLowerCase())
      );

      let targetFriend: Omit<FriendUser, 'addedAt'>;

      if (matched) {
        targetFriend = {
          userId: matched.userId,
          name: matched.name,
          email: matched.email,
          avatarUrl: matched.avatarUrl,
          characterName: matched.characterName,
          characterClass: matched.characterClass,
          characterLevel: matched.characterLevel,
        };
      } else {
        // Se não encontrou online, cria registro de amigo por identificador
        const isEmail = clean.includes('@');
        targetFriend = {
          userId: `friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: isEmail ? clean.split('@')[0] : clean,
          email: isEmail ? clean.toLowerCase() : undefined,
        };
      }

      const ok = await addFriend(userId, targetFriend);
      if (ok) {
        return { success: true, message: `"${targetFriend.name}" foi adicionado aos seus amigos!` };
      } else {
        return { success: false, message: 'Este jogador já está na sua lista de amigos.' };
      }
    },
    [userId, onlineUsers]
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
    ): Promise<{ ok: boolean; inviteId?: string }> => {
      if (!roomCodeToSend) {
        return { ok: false };
      }

      const inviteId = await sendGameInvite({
        fromUserId: userId,
        fromUserName: userName,
        toUserId: friendUserId,
        toUserName: friendName,
        roomCode: roomCodeToSend,
      });

      return { ok: true, inviteId };
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
    handleAddFriend,
    handleRemoveFriend,
    handleSendGameInvite,
    handleAcceptInvite,
    handleDeclineInvite,
  };
}
