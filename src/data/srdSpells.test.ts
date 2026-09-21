import { describe, it, expect } from 'vitest';
import { SRD_SPELLS } from './srdSpells';

describe('D&D 5e SRD Spells Catalog', () => {
  it('should have spells across all circles from 0 (cantrip) to 9', () => {
    const levels = new Set(SRD_SPELLS.map((s) => s.level));
    for (let i = 0; i <= 9; i++) {
      expect(levels.has(i)).toBe(true);
    }
  });

  it('should include iconic spells like Fireball, Cure Wounds and Wish', () => {
    const fireball = SRD_SPELLS.find((s) => s.id === 'fireball');
    expect(fireball).toBeDefined();
    expect(fireball?.name).toBe('Bola de Fogo');
    expect(fireball?.level).toBe(3);
    expect(fireball?.school).toBe('Evocação');
    expect(fireball?.damageOrHealing).toContain('8d6');

    const cureWounds = SRD_SPELLS.find((s) => s.id === 'cure-wounds');
    expect(cureWounds).toBeDefined();
    expect(cureWounds?.name).toBe('Curar Ferimentos');

    const wish = SRD_SPELLS.find((s) => s.id === 'wish');
    expect(wish).toBeDefined();
    expect(wish?.name).toBe('Desejo');
    expect(wish?.level).toBe(9);
  });

  it('should have valid properties and casting classes for all spells', () => {
    SRD_SPELLS.forEach((spell) => {
      expect(spell.name.length).toBeGreaterThan(0);
      expect(spell.classes.length).toBeGreaterThan(0);
      expect(spell.castingTime.length).toBeGreaterThan(0);
      expect(spell.range.length).toBeGreaterThan(0);
      expect(spell.description.length).toBeGreaterThan(10);
    });
  });
});
