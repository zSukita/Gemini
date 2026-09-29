import { describe, it, expect } from 'vitest';
import { parseAiResponse } from './responseParser';

describe('parseAiResponse', () => {
  it('should parse suggested actions properly with various prefixes', () => {
    const raw = `
A criatura ruge diante de você. O que você faz?

[AÇÕES]
1. Sacar a espada longa e avançar
2️⃣ Lançar Mísseis Mágicos
- Tentar se esconder atrás da pilastra
[/AÇÕES]
`;
    const result = parseAiResponse(raw);
    expect(result.cleanText).toContain('A criatura ruge diante de você.');
    expect(result.cleanText).not.toContain('[AÇÕES]');
    expect(result.suggestedActions).toHaveLength(3);
    expect(result.suggestedActions?.[0]).toBe('Sacar a espada longa e avançar');
    expect(result.suggestedActions?.[1]).toBe('Lançar Mísseis Mágicos');
    expect(result.suggestedActions?.[2]).toBe('Tentar se esconder atrás da pilastra');
  });

  it('should parse requested roll', () => {
    const raw = `
O piso de pedra desmorona sob seus pés!
[TESTE: Destreza | CD 14 | Para não cair no fosso]
`;
    const result = parseAiResponse(raw);
    expect(result.cleanText).toContain('O piso de pedra desmorona sob seus pés!');
    expect(result.requestedRoll).toBeDefined();
    expect(result.requestedRoll?.skillOrAbility).toBe('Destreza');
    expect(result.requestedRoll?.dc).toBe(14);
    expect(result.requestedRoll?.reason).toBe('Para não cair no fosso');
  });

  it('should parse monster attack action', () => {
    const raw = `
O Goblin salta das sombras com sua adaga enferrujada!
[ATAQUE_MONSTRO: Goblin | Adaga | +4 | 1d4+2 | Alden]
`;
    const result = parseAiResponse(raw);
    expect(result.cleanText).toContain('O Goblin salta das sombras');
    expect(result.monsterAttack).toEqual({
      monsterName: 'Goblin',
      attackName: 'Adaga',
      attackBonus: 4,
      damageFormula: '1d4+2',
      target: 'Alden',
    });
  });

  it('should parse monster spawns and moves', () => {
    const raw = `
Duas sombras emergem dos cantos da cripta!
[SPAWN_MONSTRO: Esqueleto | 2]
[MOVER: Esqueleto | avança em direção ao grupo | 3]
`;
    const result = parseAiResponse(raw);
    expect(result.monsterSpawns).toHaveLength(1);
    expect(result.monsterSpawns?.[0]).toEqual({ monsterName: 'Esqueleto', count: 2 });
    expect(result.mapMoves).toHaveLength(1);
    expect(result.mapMoves?.[0]).toEqual({
      tokenName: 'Esqueleto',
      actionOrTarget: 'avança em direção ao grupo',
      distanceSquares: 3,
    });
  });

  it('should parse loot rewards with coins and items', () => {
    const raw = `
Você abre o baú reforçado de ferro.
[LOOT: 50 PO | 120 PP | Poção de Cura | Anel de Prata]
`;
    const result = parseAiResponse(raw);
    expect(result.lootReward).toBeDefined();
    expect(result.lootReward?.coins?.gp).toBe(50);
    expect(result.lootReward?.coins?.pp).toBe(120);
    expect(result.lootReward?.items).toHaveLength(2);
    expect(result.lootReward?.items?.[0].name).toBe('Poção de Cura');
  });
});
