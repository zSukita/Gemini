import { useState, useEffect, useCallback, useRef } from 'react';
import { p2pManager } from '../utils/peerService';
import type { P2PMessage, PeerUser, MapToken, FogShape, BattleMapConfig } from '../types/vtt';
import type { DiceRollResult } from '../types/dnd5e';
import type { ChatMessage, ChatMessageType } from '../types/chat';

export function useMultiplayer(options?: {
  onRemoteDiceRoll?: (roll: DiceRollResult) => void;
  onRemoteTokenMove?: (tokens: MapToken[]) => void;
  onRemoteFogUpdate?: (shapes: FogShape[]) => void;
  onRemoteMapConfig?: (config: Partial<BattleMapConfig>) => void;
  onRemoteChatMessage?: (msg: ChatMessage, rawPayload?: any) => void;
}) {
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

  const createRoom = useCallback(async (userName: string, customCode?: string) => {
    setIsConnecting(true);
    try {
      const code = await p2pManager.createRoom(userName, customCode);
      setRoomCode(code);
      setIsConnected(true);
      setIsHost(true);
      return code;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string, userName: string) => {
    setIsConnecting(true);
    try {
      const success = await p2pManager.joinRoom(code, userName);
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

  const disconnect = useCallback(() => {
    p2pManager.disconnect();
    setIsConnected(false);
    setIsHost(false);
    setRoomCode('');
    setConnectedPeers([]);
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

  return {
    isConnected,
    isConnecting,
    isHost,
    roomCode,
    connectedPeers,
    chatLog,
    createRoom,
    joinRoom,
    disconnect,
    broadcastDiceRoll,
    broadcastTokenMove,
    broadcastFogUpdate,
    sendChatMessage,
    broadcastAiDm,
  };
}
