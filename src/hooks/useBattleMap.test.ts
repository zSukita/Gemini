import { describe, it, expect } from 'vitest';
import { sanitizeBattleMapConfig, sanitizeTokens } from './useBattleMap';
import { DEFAULT_MAP_PRESETS } from '../data/defaultMaps';

describe('useBattleMap - sanitizeBattleMapConfig', () => {
  it('deve retornar predefinição padrão com valores seguros quando a entrada for nula ou inválida', () => {
    const fallback = sanitizeBattleMapConfig(null);
    expect(fallback.id).toBe(DEFAULT_MAP_PRESETS[0].id);
    expect(fallback.title).toBe(DEFAULT_MAP_PRESETS[0].title);
    expect(fallback.width).toBe(DEFAULT_MAP_PRESETS[0].width);
    expect(fallback.height).toBe(DEFAULT_MAP_PRESETS[0].height);
    expect(fallback.gridSize).toBe(DEFAULT_MAP_PRESETS[0].gridSize);
    expect(fallback.revealedShapes).toEqual([]);
  });

  it('deve sanitizar e limitar dimensões aberrantes do mapa e da grade', () => {
    const corrupted = {
      id: 'custom-map',
      title: 'Mapa Gigante',
      width: 99999999, // ultra exagerado
      height: -50,     // negativo inválido
      gridSize: 2,     // grid minúsculo inválido
      gridOpacity: 5,  // fora de 0..1
      revealedShapes: 'invalido',
    };

    const sanitized = sanitizeBattleMapConfig(corrupted);
    expect(sanitized.width).toBe(10000);
    expect(sanitized.height).toBe(200);
    expect(sanitized.gridSize).toBe(15);
    expect(sanitized.gridOpacity).toBe(1);
    expect(sanitized.revealedShapes).toEqual([]);
  });

  it('deve sanitizar e limitar formas de névoa de guerra salvas', () => {
    const raw = {
      revealedShapes: [
        { id: 'fog-1', x: -20, y: 50, width: 200, height: 100, type: 'rect', isRevealed: true },
        { id: 'fog-2', x: 100, y: 100, width: 80, height: 80, type: 'circle', isRevealed: false },
        { invalid: true }, // deve ser ignorado
      ],
      width: 1200,
      height: 800,
    };

    const sanitized = sanitizeBattleMapConfig(raw);
    expect(sanitized.revealedShapes.length).toBe(2);
    expect(sanitized.revealedShapes[0].x).toBe(0); // clamp min 0
    expect(sanitized.revealedShapes[0].type).toBe('rect');
    expect(sanitized.revealedShapes[1].type).toBe('circle');
  });
});

describe('useBattleMap - sanitizeTokens', () => {
  it('deve retornar array vazio para dados corrompidos ou não-array', () => {
    expect(sanitizeTokens(null)).toEqual([]);
    expect(sanitizeTokens('invalid')).toEqual([]);
    expect(sanitizeTokens({})).toEqual([]);
  });

  it('deve sanitizar dados de token e manter coordenadas dentro dos limites considerando o tamanho do token', () => {
    const limits = { width: 1000, height: 800, gridSize: 50 };
    const rawTokens = [
      {
        id: 'tok-1',
        name: 'Mago Elfico',
        size: 1, // 1 * 50 = 50px -> maxX = 950, maxY = 750
        x: 1200, // ultrapassa largura
        y: -100, // negativo
        currentHp: 22,
        maxHp: 22,
        tempHp: 5,
        type: 'player',
        combatantId: 'comb-123',
        ownerId: 'player-peer-1',
        version: 3,
      },
      {
        id: 'tok-2',
        name: 'Dragao Jovem',
        size: 2, // 2 * 50 = 100px -> maxX = 900, maxY = 700
        x: 950, // deve ser limitado a 900
        y: 750, // deve ser limitado a 700
        currentHp: 150,
        maxHp: 150,
        type: 'monster',
      },
    ];

    const sanitized = sanitizeTokens(rawTokens, limits);
    expect(sanitized.length).toBe(2);

    // tok-1
    expect(sanitized[0].id).toBe('tok-1');
    expect(sanitized[0].x).toBe(950);
    expect(sanitized[0].y).toBe(0);
    expect(sanitized[0].tempHp).toBe(5);
    expect(sanitized[0].combatantId).toBe('comb-123');
    expect(sanitized[0].ownerId).toBe('player-peer-1');
    expect(sanitized[0].version).toBe(3);

    // tok-2
    expect(sanitized[1].id).toBe('tok-2');
    expect(sanitized[1].x).toBe(900);
    expect(sanitized[1].y).toBe(700);
    expect(sanitized[1].tempHp).toBe(0);
  });

  it('deve ignorar tokens sem id válido e sanitizar PV inválidos', () => {
    const raw = [
      { id: '' },
      { id: 'valid-id', name: 'Guerreiro', currentHp: 'vinte', maxHp: -5 },
    ];
    const sanitized = sanitizeTokens(raw);
    expect(sanitized.length).toBe(1);
    expect(sanitized[0].id).toBe('valid-id');
    expect(sanitized[0].currentHp).toBe(10);
    expect(sanitized[0].maxHp).toBe(10);
  });
});
