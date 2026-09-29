import { describe, expect, it } from 'vitest';
import type { Character } from '../types/dnd5e';
import { applyCharacterDamage, applyCharacterHealing, isCharacterDead, isCharacterStable } from './deathSaves';

const character = (overrides: Partial<Character> = {}) => ({
  currentHp: 10,
  maxHp: 10,
  tempHp: 0,
  deathSaves: { successes: 0, failures: 0 },
  ...overrides,
}) as Character;

describe('regras de PV e salvaguardas contra a morte', () => {
  it('registra uma falha ao sofrer dano com 0 PV e duas em um crítico', () => {
    expect(applyCharacterDamage(character({ currentHp: 0 }), 1).deathSaves.failures).toBe(1);
    expect(applyCharacterDamage(character({ currentHp: 0 }), 1, true).deathSaves.failures).toBe(2);
  });

  it('marca como morto na terceira falha e não permite cura comum', () => {
    const dead = applyCharacterDamage(character({ currentHp: 0, deathSaves: { successes: 0, failures: 2 } }), 1);
    expect(isCharacterDead(dead)).toBe(true);
    expect(applyCharacterHealing(dead, 10)).toBe(dead);
  });

  it('considera morto o personagem que sofre dano massivo ao cair a 0 PV', () => {
    const dead = applyCharacterDamage(character({ currentHp: 5 }), 15);
    expect(isCharacterDead(dead)).toBe(true);
    expect(dead.currentHp).toBe(0);
  });

  it('cura um inconsciente, limpa os contadores e remove a estabilidade', () => {
    const stable = character({ currentHp: 0, deathStatus: 'stable', deathSaves: { successes: 0, failures: 0 } });
    expect(isCharacterStable(stable)).toBe(true);
    const healed = applyCharacterHealing(stable, 3);
    expect(healed.currentHp).toBe(3);
    expect(healed.deathStatus).toBeUndefined();
    expect(healed.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it('permite morte legada baseada nos três contadores de falha', () => {
    expect(isCharacterDead(character({ deathSaves: { successes: 0, failures: 3 } }))).toBe(true);
  });
});
