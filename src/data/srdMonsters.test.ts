import { describe, it, expect } from 'vitest';
import { SRD_MONSTERS } from './srdMonsters';

describe('srdMonsters catalog', () => {
  it('contains at least 15 monsters including diverse challenge ratings', () => {
    expect(SRD_MONSTERS.length).toBeGreaterThanOrEqual(15);
  });

  it('includes iconic monsters with full stats and actions', () => {
    const dragon = SRD_MONSTERS.find((m) => m.id === 'srd-young-red-dragon');
    expect(dragon).toBeDefined();
    expect(dragon?.armorClass).toBe(18);
    expect(dragon?.actions.length).toBeGreaterThanOrEqual(2);

    const lich = SRD_MONSTERS.find((m) => m.id === 'srd-lich');
    expect(lich).toBeDefined();
    expect(lich?.challengeRating).toBe('21');
  });

  it('ensures each monster has valid abilities and hit points', () => {
    SRD_MONSTERS.forEach((m) => {
      expect(m.name).toBeTruthy();
      expect(m.hitPoints).toBeGreaterThan(0);
      expect(m.abilities.str).toBeGreaterThan(0);
      expect(m.abilities.dex).toBeGreaterThan(0);
      expect(m.abilities.con).toBeGreaterThan(0);
      expect(m.actions.length).toBeGreaterThan(0);
    });
  });
});
