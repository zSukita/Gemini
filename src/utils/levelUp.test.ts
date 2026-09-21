import { describe, it, expect } from 'vitest';
import { 
  getSpellSlotsForLevel, 
  getAverageHpGain, 
  isAsiLevel, 
  getClassMilestones 
} from './levelUp';

describe('Level Up Mechanics (D&D 5e)', () => {
  it('should calculate correct average HP gain based on hit die and constitution', () => {
    // d6 + 2 con = 4 + 2 = 6
    expect(getAverageHpGain('d6', 2)).toBe(6);
    // d10 + 3 con = 6 + 3 = 9
    expect(getAverageHpGain('d10', 3)).toBe(9);
    // d12 - 1 con = 7 - 1 = 6
    expect(getAverageHpGain('d12', -1)).toBe(6);
    // minimum HP gain is always 1
    expect(getAverageHpGain('d6', -5)).toBe(1);
  });

  it('should calculate full caster spell slots for Wizard progressing levels', () => {
    // Level 1: 2 1st-level slots
    const lvl1 = getSpellSlotsForLevel('Mago', 1);
    expect(lvl1[0]).toBe(2);
    expect(lvl1[1]).toBe(0);

    // Level 3: 4 1st-level, 2 2nd-level slots
    const lvl3 = getSpellSlotsForLevel('Mago', 3);
    expect(lvl3[0]).toBe(4);
    expect(lvl3[1]).toBe(2);
    expect(lvl3[2]).toBe(0);

    // Level 5: 4 1st-level, 3 2nd-level, 2 3rd-level (Fireball level!)
    const lvl5 = getSpellSlotsForLevel('Mago', 5);
    expect(lvl5[0]).toBe(4);
    expect(lvl5[1]).toBe(3);
    expect(lvl5[2]).toBe(2);
  });

  it('should correctly identify ASI / Feat levels', () => {
    expect(isAsiLevel('Mago', 4)).toBe(true);
    expect(isAsiLevel('Mago', 5)).toBe(false);
    expect(isAsiLevel('Guerreiro', 6)).toBe(true); // Guerreiro ganha no 6!
    expect(isAsiLevel('Ladino', 10)).toBe(true); // Ladino ganha no 10!
  });

  it('should return class milestones for archetype levels', () => {
    const fighterLvl3 = getClassMilestones('Guerreiro', 3);
    expect(fighterLvl3.length).toBeGreaterThan(0);
    expect(fighterLvl3[0]).toContain('Arquétipo Marcial');
  });
});
