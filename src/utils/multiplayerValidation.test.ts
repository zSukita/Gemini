import { describe, it, expect } from 'vitest';
import {
  validateRemoteTokens,
  validateRemoteFog,
  validateRemoteMapConfig,
} from './multiplayerValidation';
import type { MapToken } from '../types/vtt';

describe('multiplayerValidation - validateRemoteTokens', () => {
  const currentTokens: MapToken[] = [
    {
      id: 'token-hero-1',
      name: 'Eldrin',
      x: 100,
      y: 100,
      size: 1,
      color: '#10b981',
      currentHp: 20,
      maxHp: 20,
      tempHp: 0,
      conditions: [],
      type: 'player',
      ownerId: 'peer-player-1',
      version: 5,
      updatedAt: 1000,
    },
    {
      id: 'token-hero-2',
      name: 'Thorin',
      x: 200,
      y: 200,
      size: 1,
      color: '#10b981',
      currentHp: 30,
      maxHp: 30,
      tempHp: 0,
      conditions: [],
      type: 'player',
      ownerId: 'peer-player-2',
      version: 4,
      updatedAt: 1000,
    },
    {
      id: 'token-goblin-1',
      name: 'Goblin Arqueiro',
      x: 500,
      y: 500,
      size: 1,
      color: '#f43f5e',
      currentHp: 7,
      maxHp: 7,
      tempHp: 0,
      conditions: [],
      type: 'monster',
      version: 2,
      updatedAt: 1000,
    },
  ];

  it('permite ao Host mover qualquer token (heróis e monstros)', () => {
    const incoming = [
      { id: 'token-hero-1', x: 150, y: 150, version: 6 },
      { id: 'token-goblin-1', x: 450, y: 400, version: 3 },
    ];

    const result = validateRemoteTokens(incoming, currentTokens, 'Mestre', true, 'host-peer');
    const hero = result.find((t) => t.id === 'token-hero-1');
    const goblin = result.find((t) => t.id === 'token-goblin-1');

    expect(hero?.x).toBe(150);
    expect(hero?.y).toBe(150);
    expect(goblin?.x).toBe(450);
    expect(goblin?.y).toBe(400);
  });

  it('permite a um jogador mover apenas seu próprio token', () => {
    const incoming = [
      { id: 'token-hero-1', x: 160, y: 160, version: 6, ownerId: 'peer-player-1' },
    ];

    const result = validateRemoteTokens(incoming, currentTokens, 'Eldrin', false, 'peer-player-1');
    const hero = result.find((t) => t.id === 'token-hero-1');

    expect(hero?.x).toBe(160);
    expect(hero?.y).toBe(160);
  });

  it('impede um jogador comum de mover monstros', () => {
    const incoming = [
      { id: 'token-goblin-1', x: 300, y: 300, version: 3 },
    ];

    const result = validateRemoteTokens(incoming, currentTokens, 'Eldrin', false, 'peer-player-1');
    const goblin = result.find((t) => t.id === 'token-goblin-1');

    // As coordenadas devem ser rejeitadas e preservadas como 500, 500
    expect(goblin?.x).toBe(500);
    expect(goblin?.y).toBe(500);
  });

  it('impede um jogador de mover o personagem de outro jogador', () => {
    const incoming = [
      { id: 'token-hero-2', x: 999, y: 999, version: 5 },
    ];

    // Jogador 1 tentando mover Thorin (Jogador 2)
    const result = validateRemoteTokens(incoming, currentTokens, 'Eldrin', false, 'peer-player-1');
    const thorin = result.find((t) => t.id === 'token-hero-2');

    // Deve manter coordenadas originais de Thorin
    expect(thorin?.x).toBe(200);
    expect(thorin?.y).toBe(200);
  });

  it('descarta mensagens fora de ordem se a versão recebida for inferior ou igual à versão atual', () => {
    // Caso 1: Versão inferior (3 < 5) deve ser ignorada
    const incomingOlder = [
      { id: 'token-hero-1', x: 50, y: 50, version: 3, ownerId: 'peer-player-1' },
    ];
    const resultOlder = validateRemoteTokens(incomingOlder, currentTokens, 'Eldrin', false, 'peer-player-1');
    const heroOlder = resultOlder.find((t) => t.id === 'token-hero-1');
    expect(heroOlder?.x).toBe(100);
    expect(heroOlder?.y).toBe(100);

    // Caso 2: Versão igual (5 == 5, mensagem duplicada) deve ser ignorada
    const incomingSame = [
      { id: 'token-hero-1', x: 75, y: 75, version: 5, ownerId: 'peer-player-1' },
    ];
    const resultSame = validateRemoteTokens(incomingSame, currentTokens, 'Eldrin', false, 'peer-player-1');
    const heroSame = resultSame.find((t) => t.id === 'token-hero-1');
    expect(heroSame?.x).toBe(100);
    expect(heroSame?.y).toBe(100);
  });

  it('rejeita criação de tokens falsos por jogadores comuns (IDs desconhecidos não são adicionados)', () => {
    const incomingWithFake = [
      {
        id: 'token-infiltrator-fake',
        name: 'Monstro Invasor',
        x: 300,
        y: 300,
        type: 'monster',
        version: 1,
      },
    ];

    const result = validateRemoteTokens(incomingWithFake, currentTokens, 'Eldrin', false, 'peer-player-1');
    expect(result.find((t) => t.id === 'token-infiltrator-fake')).toBeUndefined();
    expect(result.length).toBe(currentTokens.length);
  });

  it('preserva estritamente todos os campos protegidos (PV, condições, nome, tipo, tamanho, etc.) quando o jogador move seu próprio token', () => {
    const maliciousIncoming = [
      {
        id: 'token-hero-1',
        x: 180,
        y: 180,
        version: 6,
        // Tentativas maliciosas de adulteração de campos protegidos:
        name: 'Super Eldrin Imortal',
        type: 'monster',
        ownerId: 'peer-player-999',
        combatantId: 'hacked-id',
        currentHp: 999,
        maxHp: 999,
        tempHp: 100,
        conditions: ['invisible'],
        size: 4,
        color: '#000000',
        avatarUrl: 'https://evil.example.com/exploit.png',
        hasTorch: true,
      },
    ];

    const result = validateRemoteTokens(maliciousIncoming, currentTokens, 'Eldrin', false, 'peer-player-1');
    const hero = result.find((t) => t.id === 'token-hero-1');

    // Apenas posição x, y e versão/updatedAt devem ser aplicados
    expect(hero?.x).toBe(180);
    expect(hero?.y).toBe(180);
    expect(hero?.version).toBe(6);

    // Todos os campos protegidos devem ser rigorosamente preservados do estado anterior:
    expect(hero?.name).toBe('Eldrin');
    expect(hero?.type).toBe('player');
    expect(hero?.ownerId).toBe('peer-player-1');
    expect(hero?.currentHp).toBe(20);
    expect(hero?.maxHp).toBe(20);
    expect(hero?.tempHp).toBe(0);
    expect(hero?.conditions).toEqual([]);
    expect(hero?.size).toBe(1);
    expect(hero?.color).toBe('#10b981');
    expect(hero?.combatantId).toBeUndefined();
  });

  it('não autentica propriedade apenas pelo nome exibido se a identidade de rede (peerId) não conferir', () => {
    // Atacante com peerId 'peer-impostor' se passa por 'Thorin' no nome para mover token de Thorin
    const incoming = [
      { id: 'token-hero-2', x: 800, y: 800, version: 10 },
    ];

    const result = validateRemoteTokens(incoming, currentTokens, 'Thorin', false, 'peer-impostor');
    const thorin = result.find((t) => t.id === 'token-hero-2');

    // O movimento deve ser rejeitado porque peer-impostor !== peer-player-2
    expect(thorin?.x).toBe(200);
    expect(thorin?.y).toBe(200);
  });

  it('rejeita movimentação quando senderUserId é autodeclarado/falsificado sem verificação confiável', () => {
    const tokensWithUserId: MapToken[] = [
      {
        ...currentTokens[0],
        ownerId: 'user-auth-uuid-42',
      },
    ];

    const incoming = [
      { id: 'token-hero-1', x: 190, y: 190, version: 6 },
    ];

    // Peer malicioso ou desconhecido tenta enviar senderUserId sem verificação
    const result = validateRemoteTokens(
      incoming,
      tokensWithUserId,
      'Impostor',
      false,
      'evil-peer-id',
      { senderUserId: 'user-auth-uuid-42', isSenderUserIdVerified: false }
    );
    const hero = result.find((t) => t.id === 'token-hero-1');

    // Movimento REJEITADO: posição original deve ser mantida
    expect(hero?.x).toBe(100);
    expect(hero?.y).toBe(100);
  });

  it('permite autenticar propriedade via senderUserId persistente apenas quando explicitamente verificado', () => {
    const tokensWithUserId: MapToken[] = [
      {
        ...currentTokens[0],
        ownerId: 'user-auth-uuid-42',
      },
    ];

    const incoming = [
      { id: 'token-hero-1', x: 190, y: 190, version: 6 },
    ];

    // PeerId mudou após reconexão, e senderUserId foi verificado por autoridade confiável
    const result = validateRemoteTokens(
      incoming,
      tokensWithUserId,
      'Eldrin',
      false,
      'new-volatile-peer-id',
      { senderUserId: 'user-auth-uuid-42', isSenderUserIdVerified: true }
    );
    const hero = result.find((t) => t.id === 'token-hero-1');

    expect(hero?.x).toBe(190);
    expect(hero?.y).toBe(190);
  });

  it('rejeita reconexão baseada apenas em character.id e nome não autenticados', () => {
    // Token original criado com o ID do personagem do jogador
    const tokensWithCharId: MapToken[] = [
      {
        ...currentTokens[0],
        id: 'token-player-char-gimli-99',
        ownerId: 'char-gimli-99',
        name: 'Gimli',
      },
    ];

    const incoming = [
      { id: 'token-player-char-gimli-99', x: 175, y: 175, version: 6 },
    ];

    // Jogador reconectou com um novo peerId ("peer-reconnected-777"), que diverge de character.id ("char-gimli-99")
    // Um nome e um character.id declarados não são concessão confiável de posse.
    const result = validateRemoteTokens(
      incoming,
      tokensWithCharId,
      'Gimli',
      false,
      'peer-reconnected-777',
      {
        senderUserId: 'char-gimli-99',
        isSenderUserIdVerified: false,
      }
    );
    const gimli = result.find((t) => t.id === 'token-player-char-gimli-99');

    // O movimento é rejeitado; uma concessão de reconexão exige fluxo confiável explícito.
    expect(gimli?.x).toBe(currentTokens[0].x);
    expect(gimli?.y).toBe(currentTokens[0].y);
    // Campos protegidos mantidos intactos
    expect(gimli?.ownerId).toBe('char-gimli-99');
    expect(gimli?.name).toBe('Gimli');
  });

  it('garante que uma mensagem parcial contendo apenas o token movido NÃO apague os outros tokens do mapa', () => {
    // Jogador move apenas seu token (payload com 1 item)
    const singleTokenPayload = [
      { id: 'token-hero-1', x: 120, y: 120, version: 6 },
    ];

    const result = validateRemoteTokens(singleTokenPayload, currentTokens, 'Eldrin', false, 'peer-player-1');

    // A lista retornada DEVE conter todos os 3 tokens
    expect(result.length).toBe(3);
    expect(result.find((t) => t.id === 'token-hero-1')?.x).toBe(120);
    expect(result.find((t) => t.id === 'token-hero-2')?.x).toBe(200); // Thorin mantido
    expect(result.find((t) => t.id === 'token-goblin-1')?.x).toBe(500); // Goblin mantido
  });

  it('rejeita coordenadas fora dos limites ou não finitas (NaN, Infinity) enviadas por jogadores e aceita posições válidas', () => {
    const options = {
      mapWidth: 2000,
      mapHeight: 1500,
      gridSize: 50,
    };

    // 1. Tentativa com coordenadas fora dos limites (negativas ou além da largura/altura do mapa):
    // Deve ser rejeitada para jogadores, mantendo a posição original inalterada
    const incomingOutOfBounds = [
      { id: 'token-hero-1', x: -500, y: 99999, version: 6 },
    ];
    const resultBounds = validateRemoteTokens(
      incomingOutOfBounds,
      currentTokens,
      'Eldrin',
      false,
      'peer-player-1',
      options
    );
    const heroBounds = resultBounds.find((t) => t.id === 'token-hero-1');
    expect(heroBounds?.x).toBe(100);
    expect(heroBounds?.y).toBe(100);

    // 2. Tentativa com NaN ou Infinity: mantém as coordenadas anteriores
    const incomingNaN = [
      { id: 'token-hero-1', x: NaN, y: Infinity, version: 7 },
    ];
    const resultNaN = validateRemoteTokens(
      incomingNaN,
      currentTokens,
      'Eldrin',
      false,
      'peer-player-1',
      options
    );
    const heroNaN = resultNaN.find((t) => t.id === 'token-hero-1');
    expect(heroNaN?.x).toBe(100);
    expect(heroNaN?.y).toBe(100);

    // 3. Coordenadas válidas dentro dos limites: são aplicadas com sucesso
    const incomingValid = [
      { id: 'token-hero-1', x: 450, y: 600, version: 8 },
    ];
    const resultValid = validateRemoteTokens(
      incomingValid,
      currentTokens,
      'Eldrin',
      false,
      'peer-player-1',
      options
    );
    const heroValid = resultValid.find((t) => t.id === 'token-hero-1');
    expect(heroValid?.x).toBe(450);
    expect(heroValid?.y).toBe(600);
    expect(heroValid?.version).toBe(8);
  });

  it('permite ao Host sincronizar a sala completa (isFullRoomSync) com sanitização de todos os tokens', () => {
    const roomSyncPayload = [
      {
        id: 'token-new-dragon',
        name: 'Dragão Vermelho',
        x: 400,
        y: 300,
        type: 'monster',
        size: 3,
        currentHp: 200,
        maxHp: 200,
        version: 1,
      },
    ];

    const result = validateRemoteTokens(
      roomSyncPayload,
      currentTokens,
      'Mestre',
      true,
      'host-peer',
      { isFullRoomSync: true }
    );

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('token-new-dragon');
    expect(result[0].name).toBe('Dragão Vermelho');
    expect(result[0].type).toBe('monster');
    expect(result[0].currentHp).toBe(200);
  });

  it('impede que jogadores comuns usem isFullRoomSync para sobrescrever tokens de outros jogadores ou criar monstros', () => {
    const roomSyncPayload = [
      {
        id: 'token-new-dragon',
        name: 'Dragão Invasor',
        x: 400,
        y: 300,
        type: 'monster',
        version: 1,
      },
      {
        id: 'token-hero-2',
        x: 900,
        y: 900,
        version: 10,
      },
    ];

    const result = validateRemoteTokens(
      roomSyncPayload,
      currentTokens,
      'Eldrin',
      false, // Não é host!
      'peer-player-1',
      { isFullRoomSync: true }
    );

    // O dragão não deve ser adicionado e o Thorin não deve ter sua posição movida pelo player 1
    expect(result.find((t) => t.id === 'token-new-dragon')).toBeUndefined();
    expect(result.find((t) => t.id === 'token-hero-2')?.x).toBe(200);
  });

  it('retorna os tokens atuais inalterados se a entrada não for um array', () => {
    const result = validateRemoteTokens('invalido', currentTokens, 'Host', true);
    expect(result).toBe(currentTokens);
  });
});

describe('multiplayerValidation - validateRemoteFog', () => {
  it('valida e sanitiza formas de névoa recebidas pela rede', () => {
    const raw = [
      { id: 'fog-1', x: 50, y: 50, width: 200, height: 150, type: 'rect', isRevealed: true },
      { id: 'fog-2', x: -500, y: 99999, width: 100, height: 100, type: 'circle', isRevealed: false },
      { notAShape: true },
    ];

    const validated = validateRemoteFog(raw, 2000, 1500);
    expect(validated.length).toBe(2);
    expect(validated[0].id).toBe('fog-1');
    expect(validated[0].isRevealed).toBe(true);

    expect(validated[1].x).toBe(0); // clamp min 0
    expect(validated[1].y).toBe(1500); // clamp max height
    expect(validated[1].type).toBe('circle');
  });

  it('retorna array vazio para entradas não-array', () => {
    expect(validateRemoteFog(null)).toEqual([]);
    expect(validateRemoteFog(123)).toEqual([]);
  });
});

describe('multiplayerValidation - validateRemoteMapConfig', () => {
  it('valida e limita campos de configuração de mapa recebidos', () => {
    const raw = {
      title: 'Templo Antigo '.repeat(20), // string longa
      width: 15000,                       // acima de 10000
      height: 50,                         // abaixo de 200
      gridSize: 500,                      // acima de 250
      gridOpacity: 2.5,                   // acima de 1
      showGrid: true,
      snapToGrid: true,
      fogOfWarEnabled: true,
      ambientLight: 'dusk',
    };

    const config = validateRemoteMapConfig(raw);
    expect(config.title?.length).toBeLessThanOrEqual(100);
    expect(config.width).toBe(10000);
    expect(config.height).toBe(200);
    expect(config.gridSize).toBe(250);
    expect(config.gridOpacity).toBe(1);
    expect(config.showGrid).toBe(true);
    expect(config.fogOfWarEnabled).toBe(true);
    expect(config.ambientLight).toBe('dusk');
  });

  it('retorna objeto vazio para entradas nulas ou inválidas', () => {
    expect(validateRemoteMapConfig(null)).toEqual({});
    expect(validateRemoteMapConfig('config')).toEqual({});
  });
});
