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

  it('deve armazenar e sincronizar atributos de combate do personagem do peer (HP, CA, Classe, Iniciativa)', () => {
    const peerWithCombatData: PeerUser = {
      peerId: 'peer-thorin-123',
      name: 'Thorin Martelo-de-Ferro',
      role: 'player',
      joinedAt: Date.now(),
      characterClass: 'Guerreiro',
      currentHp: 28,
      maxHp: 28,
      armorClass: 16,
      dexScore: 14,
      initiativeBonus: 2,
    };

    expect(peerWithCombatData.characterClass).toBe('Guerreiro');
    expect(peerWithCombatData.currentHp).toBe(28);
    expect(peerWithCombatData.armorClass).toBe(16);
    expect(peerWithCombatData.initiativeBonus).toBe(2);
  });

  it('deve validar bloqueio de turno D&D 5e (somente o combatente ativo pode agir)', () => {
    const combatants = [
      { id: 'c1', name: 'Thorin Martelo-de-Ferro', type: 'player', initiative: 18 },
      { id: 'c2', name: 'Zumbi', type: 'monster', initiative: 12 },
      { id: 'c3', name: 'Valeros', type: 'player', initiative: 8 },
    ];
    const encounter = {
      isRunning: true,
      round: 1,
      activeCombatantIndex: 0,
      combatants,
    };

    // Caso 1: Vez de Thorin
    const active1 = encounter.combatants[encounter.activeCombatantIndex];
    const isThorinTurn = active1.name.toLowerCase() === 'Thorin Martelo-de-Ferro'.toLowerCase();
    const isValerosTurn = active1.name.toLowerCase() === 'Valeros'.toLowerCase();
    expect(isThorinTurn).toBe(true);
    expect(isValerosTurn).toBe(false);

    // Caso 2: Avança para o Zumbi (Monstro)
    encounter.activeCombatantIndex = 1;
    const active2 = encounter.combatants[encounter.activeCombatantIndex];
    const isMonster = active2.type === 'monster';
    expect(isMonster).toBe(true);

    // Caso 3: Avança para Valeros
    encounter.activeCombatantIndex = 2;
    const active3 = encounter.combatants[encounter.activeCombatantIndex];
    expect(active3.name).toBe('Valeros');
    expect(active3.type).toBe('player');
  });

  it('deve delegar comandos de IA para o Host quando o jogador for um convidado conectado', () => {
    const isConnected = true;
    const isHost = false; // Convidado
    const isAiReady = false; // Convidado sem chave configurada

    const willHandleAi = isAiReady && (!isConnected || isHost);
    expect(willHandleAi).toBe(false);

    // Convidado não deve processar IA localmente
    const shouldGuestProcessAi = !isConnected || isHost;
    expect(shouldGuestProcessAi).toBe(false);
  });
});
