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

  it('descarta mensagens fora de ordem se a versão recebida for inferior à versão atual', () => {
    const incoming = [
      // token-hero-1 já está na versão 5; uma mensagem defasada de versão 3 deve ser ignorada
      { id: 'token-hero-1', x: 50, y: 50, version: 3, ownerId: 'peer-player-1' },
    ];

    const result = validateRemoteTokens(incoming, currentTokens, 'Eldrin', false, 'peer-player-1');
    const hero = result.find((t) => t.id === 'token-hero-1');

    expect(hero?.x).toBe(100);
    expect(hero?.y).toBe(100);
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
