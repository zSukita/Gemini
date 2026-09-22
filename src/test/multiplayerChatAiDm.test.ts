import { describe, it, expect, beforeEach, vi } from 'vitest';
import { p2pManager } from '../utils/peerService';
import type { ChatMessage } from '../types/chat';
import type { PeerUser } from '../types/vtt';

describe('Multiplayer & AI DM Integration', () => {
  beforeEach(() => {
    p2pManager.disconnect();
  });

  it('deve ter o tipo AI_DM suportado na estrutura de mensagens de chat', () => {
    const aiMessage: ChatMessage = {
      id: 'ai-test-1',
      senderId: 'gemini-ai',
      senderName: '✨ Mestre Supremo (IA)',
      text: 'O portão de ferro geme ao ser empurrado, revelando uma cripta silenciosa...',
      type: 'AI_DM',
      suggestedActions: [
        'Acender uma tocha e investigar os túmulos',
        'Fazer um teste de Furtividade para avançar em silêncio',
        'Recuar e trancar o portão'
      ],
      requestedRoll: {
        skillOrAbility: 'Percepção (Sabedoria)',
        dc: 14,
        reason: 'Ouvir passos ou sussurros nas sombras da cripta'
      },
      timestamp: Date.now(),
    };

    expect(aiMessage.type).toBe('AI_DM');
    expect(aiMessage.suggestedActions).toHaveLength(3);
    expect(aiMessage.requestedRoll?.dc).toBe(14);
    expect(aiMessage.requestedRoll?.skillOrAbility).toContain('Percepção');
  });

  it('deve deduplicar mensagens de chat pelo ID único', () => {
    const chatLog: ChatMessage[] = [];
    const addMessage = (msg: ChatMessage) => {
      if (chatLog.some((m) => m.id === msg.id)) return;
      chatLog.push(msg);
    };

    const msgA: ChatMessage = {
      id: 'msg-unique-123',
      senderId: 'player-1',
      senderName: 'Sukita',
      text: 'Avanço com o escudo erguido.',
      type: 'PUBLIC',
      timestamp: 1000,
    };

    // Primeira adição
    addMessage(msgA);
    expect(chatLog).toHaveLength(1);

    // Tentativa de adicionar mensagem com mesmo ID (duplicação de rede ou eco local)
    addMessage(msgA);
    expect(chatLog).toHaveLength(1);

    // Mensagem com ID diferente
    const msgB: ChatMessage = {
      id: 'msg-unique-124',
      senderId: 'dm-ai',
      senderName: '✨ Mestre Supremo (IA)',
      text: 'O chão treme sob seus passos.',
      type: 'AI_DM',
      timestamp: 1001,
    };
    addMessage(msgB);
    expect(chatLog).toHaveLength(2);
  });

  it('deve registrar ouvintes de peer list e mensagens no p2pManager', () => {
    const msgListener = vi.fn();
    const peerListener = vi.fn();

    const unsubMsg = p2pManager.onMessage(msgListener);
    const unsubPeers = p2pManager.onPeerListChange(peerListener);

    expect(typeof unsubMsg).toBe('function');
    expect(typeof unsubPeers).toBe('function');

    unsubMsg();
    unsubPeers();
  });

  it('deve manter lista de peers participantes com papéis corretos', () => {
    const peers: PeerUser[] = [
      { peerId: 'host-123', name: 'Sukita', role: 'dm', joinedAt: 1000 },
      { peerId: 'player-456', name: 'Valeros', role: 'player', joinedAt: 1005 },
    ];

    expect(peers.filter(p => p.role === 'dm')).toHaveLength(1);
    expect(peers.filter(p => p.role === 'player')).toHaveLength(1);
    expect(peers[0].name).toBe('Sukita');
    expect(peers[1].name).toBe('Valeros');
  });
});
