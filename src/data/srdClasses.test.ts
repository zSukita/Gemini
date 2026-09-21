import { describe, it, expect } from 'vitest';
import { SRD_CLASSES } from './srdClasses';

describe('SRD Classes catalog', () => {
  it('deve conter as 12 classes oficiais do D&D 5e', () => {
    expect(SRD_CLASSES).toHaveLength(12);

    const names = SRD_CLASSES.map((c) => c.name);
    expect(names).toContain('Bárbaro');
    expect(names).toContain('Bardo');
    expect(names).toContain('Clérigo');
    expect(names).toContain('Druida');
    expect(names).toContain('Guerreiro');
    expect(names).toContain('Monge');
    expect(names).toContain('Paladino');
    expect(names).toContain('Patrulheiro');
    expect(names).toContain('Ladino');
    expect(names).toContain('Feiticeiro');
    expect(names).toContain('Bruxo');
    expect(names).toContain('Mago');
  });

  it('cada classe deve possuir dado de vida, duas salvaguardas e equipamentos iniciais válidos', () => {
    SRD_CLASSES.forEach((cls) => {
      expect(cls.id).toBeTruthy();
      expect(['d6', 'd8', 'd10', 'd12']).toContain(cls.hitDie);
      expect(cls.hitDieValue).toBeGreaterThanOrEqual(6);
      expect(cls.savingThrows).toHaveLength(2);
      expect(cls.primaryAbilities.length).toBeGreaterThanOrEqual(1);
      expect(cls.features.length).toBeGreaterThanOrEqual(1);
      expect(cls.startingEquipment.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Bárbaro deve ter d12 e salvaguardas de Força e Constituição', () => {
    const barbarian = SRD_CLASSES.find((c) => c.id === 'barbarian');
    expect(barbarian).toBeDefined();
    expect(barbarian?.hitDie).toBe('d12');
    expect(barbarian?.savingThrows).toEqual(['str', 'con']);
  });

  it('Mago deve ter d6, salvaguardas de Inteligência e Sabedoria e conjuração baseada em INT', () => {
    const wizard = SRD_CLASSES.find((c) => c.id === 'wizard');
    expect(wizard).toBeDefined();
    expect(wizard?.hitDie).toBe('d6');
    expect(wizard?.savingThrows).toEqual(['int', 'wis']);
    expect(wizard?.spellcastingAbility).toBe('int');
  });
});
