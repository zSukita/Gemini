import { useState, useEffect, useCallback } from 'react';
import { p2pManager } from '../utils/peerService';
import type { P2PMessage, PeerUser, MapToken, FogShape, BattleMapConfig } from '../types/vtt';
import type { DiceRollResult } from '../types/dnd5e';
import type { ChatMessage, ChatMessageType } from '../types/chat';

export function useMultiplayer(options?: {
  onRemoteDiceRoll?: (roll: DiceRollResult) => void;
  onRemoteTokenMove?: (tokens: MapToken[]) => void;
  onRemoteFogUpdate?: (shapes: FogShape[]) => void;
  onRemoteMapConfig?: (config: Partial<BattleMapConfig>) => void;
}) {
  const [isConnected, setIsConnected] = useState(p2pManager.isConnected());
  const [isHost, setIsHost] = useState(p2pManager.getIsHost());
  const [roomCode, setRoomCode] = useState(p2pManager.getRoomCode());
  const [connectedPeers, setConnectedPeers] = useState<PeerUser[]>(p2pManager.getConnectedPeers());
  const [isConnecting, setIsConnecting] = useState(false);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubPeers = p2pManager.onPeerListChange((peers) => {
      setConnectedPeers(peers);
      setIsConnected(p2pManager.isConnected());
      setIsHost(p2pManager.getIsHost());
      setRoomCode(p2pManager.getRoomCode());
    });

    const unsubMessages = p2pManager.onMessage((msg: P2PMessage) => {
      if (msg.type === 'DICE_ROLL' && options?.onRemoteDiceRoll) {
        options.onRemoteDiceRoll(msg.payload as DiceRollResult);
      }
      if (msg.type === 'TOKEN_MOVE' && options?.onRemoteTokenMove) {
        options.onRemoteTokenMove(msg.payload as MapToken[]);
      }
      if (msg.type === 'FOG_UPDATE' && options?.onRemoteFogUpdate) {
        options.onRemoteFogUpdate(msg.payload as FogShape[]);
      }
      if (msg.type === 'MAP_CONFIG' && options?.onRemoteMapConfig) {
        options.onRemoteMapConfig(msg.payload as Partial<BattleMapConfig>);
      }
      if (msg.type === 'CHAT_MESSAGE') {
        const payload = msg.payload as any;
        const isObj = typeof payload === 'object' && payload !== null;
        const chatMsg: ChatMessage = {
          id: `chat-${Date.now()}-${Math.random()}`,
          senderId: msg.senderId || 'unknown',
          senderName: msg.senderName,
          text: isObj ? (payload.text || '') : String(payload),
          type: isObj && payload.type ? payload.type : 'PUBLIC',
          recipientName: isObj ? payload.recipientName : undefined,
          diceRoll: isObj ? payload.diceRoll : undefined,
          timestamp: msg.timestamp || Date.now(),
        };
        setChatLog((prev) => [...prev, chatMsg]);
      }
    });

    return () => {
      unsubPeers();
      unsubMessages();
    };
  }, [options]);

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
      textOrPayload: string | { text: string; senderName?: string; type?: ChatMessageType; recipientName?: string; diceRoll?: DiceRollResult },
      playerNameFallback?: string
    ) => {
      const isObj = typeof textOrPayload === 'object' && textOrPayload !== null;
      const text = isObj ? textOrPayload.text : textOrPayload;
      const senderName = isObj && textOrPayload.senderName ? textOrPayload.senderName : (playerNameFallback || 'Aventureiro');
      const type: ChatMessageType = isObj && textOrPayload.type ? textOrPayload.type : 'PUBLIC';
      const recipientName = isObj ? textOrPayload.recipientName : undefined;
      const diceRoll = isObj ? textOrPayload.diceRoll : undefined;

      const payload = {
        text,
        type,
        recipientName,
        diceRoll,
      };

      if (p2pManager.isConnected()) {
        p2pManager.broadcast({
          type: 'CHAT_MESSAGE',
          senderId: p2pManager.getRoomCode(),
          senderName: senderName,
          payload: payload,
          timestamp: Date.now(),
        });
      }

      // Adiciona localmente ao histórico do chat
      const localMsg: ChatMessage = {
        id: `chat-${Date.now()}-${Math.random()}`,
        senderId: p2pManager.getRoomCode() || 'local',
        senderName: senderName,
        text,
        type,
        recipientName,
        diceRoll,
        timestamp: Date.now(),
      };
      setChatLog((prev) => [...prev, localMsg]);
    },
    []
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
  };
}
