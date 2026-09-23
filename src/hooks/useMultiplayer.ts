import { useState, useEffect, useCallback, useRef } from 'react';
import { p2pManager } from '../utils/peerService';
import type { P2PMessage, PeerUser, MapToken, FogShape, BattleMapConfig } from '../types/vtt';
import type { DiceRollResult } from '../types/dnd5e';
import type { ChatMessage, ChatMessageType } from '../types/chat';
import type { MonsterSpawnAction, MapMoveAction, AiLootReward } from '../types/aiDm';
import { getLocalDirectMessages, saveLocalDirectMessages } from '../firebase/presenceAndFriends';

export interface UseMultiplayerOptions {
  onRemoteDiceRoll?: (roll: DiceRollResult) => void;
  onRemoteTokenMove?: (tokens: MapToken[]) => void;
  onRemoteFogUpdate?: (shapes: FogShape[]) => void;
  onRemoteMapConfig?: (config: Partial<BattleMapConfig>) => void;
  onRemoteChatMessage?: (msg: ChatMessage, rawPayload?: any) => void;
  onRemoteRoomSync?: (syncData: {
    mapConfig?: BattleMapConfig;
    tokens?: MapToken[];
    chatLog?: ChatMessage[];
    encounter?: any;
  }) => void;
  onRequestRoomState?: (requesterPeerId?: string) => void;
  onRemoteDirectMessage?: (msg: any) => void;
  onRemoteGameInvite?: (invite: any) => void;
}

export function useMultiplayer(options?: UseMultiplayerOptions) {
  const [isConnected, setIsConnected] = useState(p2pManager.isConnected());
  const [isHost, setIsHost] = useState(p2pManager.getIsHost());
  const [roomCode, setRoomCode] = useState(p2pManager.getRoomCode());
  const [connectedPeers, setConnectedPeers] = useState<PeerUser[]>(p2pManager.getConnectedPeers());
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const unsubPeers = p2pManager.onPeerListChange((peers) => {
      setConnectedPeers(peers);
      setIsConnected(p2pManager.isConnected());
      setIsHost(p2pManager.getIsHost());
      setRoomCode(p2pManager.getRoomCode());
    });

    const unsubMessages = p2pManager.onMessage((msg: P2PMessage) => {
      if (msg.type === 'ROOM_SYNC') {
        const payload = msg.payload as any;
        if (payload?.chatLog && Array.isArray(payload.chatLog)) {
          setChatLog(payload.chatLog);
        }
        if (optionsRef.current?.onRemoteRoomSync) {
          optionsRef.current.onRemoteRoomSync(payload);
        }
      }
      if (msg.type === 'REQUEST_ROOM_STATE' && optionsRef.current?.onRequestRoomState) {
        const payload = msg.payload as any;
        optionsRef.current.onRequestRoomState(payload?.targetPeerId || msg.senderId);
      }
      if (msg.type === 'DICE_ROLL' && optionsRef.current?.onRemoteDiceRoll) {
        optionsRef.current.onRemoteDiceRoll(msg.payload as DiceRollResult);
      }
      if (msg.type === 'TOKEN_MOVE' && optionsRef.current?.onRemoteTokenMove) {
        optionsRef.current.onRemoteTokenMove(msg.payload as MapToken[]);
      }
      if (msg.type === 'FOG_UPDATE' && optionsRef.current?.onRemoteFogUpdate) {
        optionsRef.current.onRemoteFogUpdate(msg.payload as FogShape[]);
      }
      if (msg.type === 'MAP_CONFIG' && optionsRef.current?.onRemoteMapConfig) {
        optionsRef.current.onRemoteMapConfig(msg.payload as Partial<BattleMapConfig>);
      }
      if (msg.type === 'DIRECT_MESSAGE') {
        const dm = msg.payload as any;
        if (dm) {
          const locals = getLocalDirectMessages();
          if (!locals.some((m) => m.id === dm.id)) {
            saveLocalDirectMessages([...locals, dm]);
          }
          if (optionsRef.current?.onRemoteDirectMessage) {
            optionsRef.current.onRemoteDirectMessage(dm);
          }
        }
      }
      if (msg.type === 'GAME_INVITE') {
        const invite = msg.payload as any;
        if (invite) {
          if (optionsRef.current?.onRemoteGameInvite) {
            optionsRef.current.onRemoteGameInvite(invite);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('arcanasheet_game_invite', { detail: invite }));
          }
        }
      }
      if (msg.type === 'CHAT_MESSAGE') {
        const payload = msg.payload as any;
        const isObj = typeof payload === 'object' && payload !== null;
        const msgId = isObj && payload.id ? payload.id : `chat-${msg.timestamp || Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const chatMsg: ChatMessage = {
          id: msgId,
          senderId: msg.senderId || 'unknown',
          senderName: msg.senderName,
          text: isObj ? (payload.text || '') : String(payload),
          type: isObj && payload.type ? payload.type : 'PUBLIC',
          recipientName: isObj ? payload.recipientName : undefined,
          diceRoll: isObj ? payload.diceRoll : undefined,
          suggestedActions: isObj ? payload.suggestedActions : undefined,
          requestedRoll: isObj ? payload.requestedRoll : undefined,
          monsterAttack: isObj ? payload.monsterAttack : undefined,
          lootReward: isObj ? payload.lootReward : undefined,
          timestamp: msg.timestamp || Date.now(),
        };
        setChatLog((prev) => {
          if (prev.some((m) => m.id === chatMsg.id)) return prev;
          const isDuplicateRecent = prev.some(
            (m) =>
              m.senderName === chatMsg.senderName &&
              m.text.trim() === chatMsg.text.trim() &&
              Math.abs(m.timestamp - chatMsg.timestamp) < 4000
          );
          if (isDuplicateRecent) return prev;
          return [...prev, chatMsg];
        });
        if (optionsRef.current?.onRemoteChatMessage) {
          optionsRef.current.onRemoteChatMessage(chatMsg, payload);
        }
      }
    });

    return () => {
      unsubPeers();
      unsubMessages();
    };
  }, []);

  const createRoom = useCallback(async (userName: string, customCode?: string, avatarUrl?: string) => {
    setIsConnecting(true);
    try {
      const code = await p2pManager.createRoom(userName, customCode, avatarUrl);
      setRoomCode(code);
      setIsConnected(true);
      setIsHost(true);
      return code;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string, userName: string, avatarUrl?: string) => {
    setIsConnecting(true);
    try {
      const success = await p2pManager.joinRoom(code, userName, avatarUrl);
      if (success) {
        setRoomCode(code);
        setIsConnected(true);
        setIsHost(false);
      }
      return success;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const clearChatLog = useCallback(() => {
    setChatLog([]);
  }, []);

  const disconnect = useCallback(() => {
    p2pManager.disconnect();
    setIsConnected(false);
    setIsHost(false);
    setRoomCode('');
    setConnectedPeers([]);
    setChatLog([]);
  }, []);

  const broadcastDiceRoll = useCallback(
    (roll: DiceRollResult, playerName: string) => {
      if (!p2pManager.isConnected()) return;
      p2pManager.broadcast({
        type: 'DICE_ROLL',
        senderId: p2pManager.getRoomCode(),
        senderName: playerName,
        payload: roll,
        timestamp: Date.now(),
      });
    },
    []
  );

  const broadcastTokenMove = useCallback(
    (tokens: MapToken[], playerName: string) => {
      if (!p2pManager.isConnected()) return;
      p2pManager.broadcast({
        type: 'TOKEN_MOVE',
        senderId: p2pManager.getRoomCode(),
        senderName: playerName,
        payload: tokens,
        timestamp: Date.now(),
      });
    },
    []
  );

  const broadcastFogUpdate = useCallback(
    (shapes: FogShape[]) => {
      if (!p2pManager.isConnected()) return;
      p2pManager.broadcast({
        type: 'FOG_UPDATE',
        senderId: p2pManager.getRoomCode(),
        senderName: 'Mestre',
        payload: shapes,
        timestamp: Date.now(),
      });
    },
    []
  );

  const sendChatMessage = useCallback(
    (
      textOrPayload:
        | string
        | {
            id?: string;
            text: string;
            senderName?: string;
            type?: ChatMessageType;
            recipientName?: string;
            diceRoll?: DiceRollResult;
            suggestedActions?: string[];
            requestedRoll?: {
              skillOrAbility: string;
              dc?: number;
              reason: string;
            };
            monsterAttack?: {
              monsterName: string;
              attackName: string;
              attackBonus: number;
              damageFormula: string;
              target?: string;
              description?: string;
            };
            monsterSpawns?: MonsterSpawnAction[];
            mapMoves?: MapMoveAction[];
            lootReward?: AiLootReward;
            aiHandledBySender?: boolean;
          },
      playerNameFallback?: string
    ) => {
      const isObj = typeof textOrPayload === 'object' && textOrPayload !== null;
      const text = isObj ? textOrPayload.text : textOrPayload;
      const senderName = isObj && textOrPayload.senderName ? textOrPayload.senderName : (playerNameFallback || 'Aventureiro');
      const type: ChatMessageType = isObj && textOrPayload.type ? textOrPayload.type : 'PUBLIC';
      const recipientName = isObj ? textOrPayload.recipientName : undefined;
      const diceRoll = isObj ? textOrPayload.diceRoll : undefined;
      const suggestedActions = isObj ? textOrPayload.suggestedActions : undefined;
      const requestedRoll = isObj ? textOrPayload.requestedRoll : undefined;
      const monsterAttack = isObj ? textOrPayload.monsterAttack : undefined;
      const monsterSpawns = isObj ? textOrPayload.monsterSpawns : undefined;
      const mapMoves = isObj ? textOrPayload.mapMoves : undefined;
      const lootReward = isObj ? textOrPayload.lootReward : undefined;
      const aiHandledBySender = isObj ? textOrPayload.aiHandledBySender : undefined;
      const msgId = isObj && textOrPayload.id ? textOrPayload.id : `chat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const timestamp = Date.now();

      const payload = {
        id: msgId,
        text,
        type,
        recipientName,
        diceRoll,
        suggestedActions,
        requestedRoll,
        monsterAttack,
        monsterSpawns,
        mapMoves,
        lootReward,
        aiHandledBySender,
      };

      if (p2pManager.isConnected()) {
        p2pManager.broadcast({
          type: 'CHAT_MESSAGE',
          senderId: p2pManager.getRoomCode(),
          senderName: senderName,
          payload: payload,
          timestamp,
        });
      }

      // Adiciona localmente ao histórico do chat com verificação de duplicação
      const localMsg: ChatMessage = {
        id: msgId,
        senderId: p2pManager.getRoomCode() || 'local',
        senderName: senderName,
        text,
        type,
        recipientName,
        diceRoll,
        suggestedActions,
        requestedRoll,
        monsterAttack,
        monsterSpawns,
        mapMoves,
        lootReward,
        timestamp,
      };
      setChatLog((prev) => {
        if (prev.some((m) => m.id === localMsg.id)) return prev;
        const isDuplicateRecent = prev.some(
          (m) =>
            m.senderName === localMsg.senderName &&
            m.text.trim() === localMsg.text.trim() &&
            Math.abs(m.timestamp - localMsg.timestamp) < 4000
        );
        if (isDuplicateRecent) return prev;
        return [...prev, localMsg];
      });
    },
    []
  );

  const broadcastAiDm = useCallback(
    (narration: {
      text: string;
      suggestedActions?: string[];
      requestedRoll?: { skillOrAbility: string; dc?: number; reason: string };
    }) => {
      sendChatMessage({
        text: narration.text,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
        suggestedActions: narration.suggestedActions,
        requestedRoll: narration.requestedRoll,
      });
    },
    [sendChatMessage]
  );

  const broadcastMapConfig = useCallback(
    (config: Partial<BattleMapConfig>) => {
      if (!p2pManager.isConnected()) return;
      p2pManager.broadcast({
        type: 'MAP_CONFIG',
        senderId: p2pManager.getRoomCode(),
        senderName: 'Mestre',
        payload: config,
        timestamp: Date.now(),
      });
    },
    []
  );

  const broadcastRoomSync = useCallback(
    (
      roomState: {
        mapConfig: BattleMapConfig;
        tokens: MapToken[];
        chatLog: ChatMessage[];
        encounter?: any;
      },
      targetPeerId?: string
    ) => {
      if (!p2pManager.isConnected()) return;
      const msg: P2PMessage = {
        type: 'ROOM_SYNC',
        senderId: p2pManager.getRoomCode(),
        senderName: 'Mestre',
        payload: roomState,
        timestamp: Date.now(),
      };
      if (targetPeerId) {
        p2pManager.sendToPeer(targetPeerId, msg);
      } else {
        p2pManager.broadcast(msg);
      }
    },
    []
  );

  const requestRoomState = useCallback(() => {
    if (!p2pManager.isConnected()) return;
    p2pManager.broadcast({
      type: 'REQUEST_ROOM_STATE',
      senderId: p2pManager.getRoomCode(),
      senderName: 'Jogador',
      payload: null,
      timestamp: Date.now(),
    });
  }, []);

  const broadcastDirectMessage = useCallback((dm: any) => {
    if (!p2pManager.isConnected()) return;
    p2pManager.broadcast({
      type: 'DIRECT_MESSAGE',
      senderId: p2pManager.getRoomCode(),
      senderName: dm.fromUserName || 'Aventureiro',
      payload: dm,
      timestamp: Date.now(),
    });
  }, []);

  const broadcastGameInvite = useCallback((invite: any) => {
    if (!p2pManager.isConnected()) return;
    p2pManager.broadcast({
      type: 'GAME_INVITE',
      senderId: p2pManager.getRoomCode(),
      senderName: invite.fromUserName || 'Aventureiro',
      payload: invite,
      timestamp: Date.now(),
    });
  }, []);

  return {
    isConnected,
    isConnecting,
    isHost,
    roomCode,
    connectedPeers,
    chatLog,
    setChatLog,
    createRoom,
    joinRoom,
    disconnect,
    clearChatLog,
    broadcastDiceRoll,
    broadcastTokenMove,
    broadcastFogUpdate,
    broadcastMapConfig,
    broadcastRoomSync,
    requestRoomState,
    broadcastDirectMessage,
    broadcastGameInvite,
    sendChatMessage,
    broadcastAiDm,
  };
}
