import { describe, it, expect } from 'vitest';
import {
  getAbilityModifier,
  getProficiencyBonus,
  formatModifier,
  getSavingThrowModifier,
  getSkillModifier,
  getPassivePerception,
  getSpellSaveDC,
  getSpellAttackBonus,
  getCarryingCapacity,
  getTotalInventoryWeight,
} from './calculations';
import { VALEROS_HERO, createEmptyCharacter } from './defaultCharacter';

describe('Cálculos do D&D 5e (SRD 5.1)', () => {
  describe('Modificadores de Atributo', () => {
    it('deve calcular corretamente os modificadores de 1 a 20+', () => {
      expect(getAbilityModifier(1)).toBe(-5);
      expect(getAbilityModifier(8)).toBe(-1);
      expect(getAbilityModifier(9)).toBe(-1);
      expect(getAbilityModifier(10)).toBe(0);
      expect(getAbilityModifier(11)).toBe(0);
      expect(getAbilityModifier(12)).toBe(1);
      expect(getAbilityModifier(14)).toBe(2);
      expect(getAbilityModifier(16)).toBe(3);
      expect(getAbilityModifier(18)).toBe(4);
      expect(getAbilityModifier(20)).toBe(5);
      expect(getAbilityModifier(30)).toBe(10);
    });

    it('deve formatar modificadores com sinal positivo e negativo', () => {
      expect(formatModifier(3)).toBe('+3');
      expect(formatModifier(0)).toBe('+0');
      expect(formatModifier(-2)).toBe('-2');
    });
  });

  describe('Bônus de Proficiência por Nível', () => {
    it('deve retornar +2 para níveis 1 a 4', () => {
      expect(getProficiencyBonus(1)).toBe(2);
      expect(getProficiencyBonus(4)).toBe(2);
    });

    it('deve retornar +3 para níveis 5 a 8', () => {
      expect(getProficiencyBonus(5)).toBe(3);
      expect(getProficiencyBonus(8)).toBe(3);
    });

    it('deve retornar +4 para níveis 9 a 12', () => {
      expect(getProficiencyBonus(9)).toBe(4);
      expect(getProficiencyBonus(12)).toBe(4);
    });

    it('deve retornar +5 para níveis 13 a 16', () => {
      expect(getProficiencyBonus(13)).toBe(5);
      expect(getProficiencyBonus(16)).toBe(5);
    });

    it('deve retornar +6 para níveis 17 a 20', () => {
      expect(getProficiencyBonus(17)).toBe(6);
      expect(getProficiencyBonus(20)).toBe(6);
    });
  });

  describe('Salvaguardas (Saving Throws)', () => {
    it('soma bônus de proficiência quando treinado', () => {
      // Valeros tem FOR 16 (mod +3), proficiente (+2 no nvl 3) => 5
      expect(getSavingThrowModifier(VALEROS_HERO, 'str')).toBe(5);
      // Valeros tem DES 12 (mod +1), não proficiente => 1
      expect(getSavingThrowModifier(VALEROS_HERO, 'dex')).toBe(1);
    });
  });

  describe('Perícias (Skills) e Especialização (Expertise)', () => {
    it('calcula perícia com treinamento normal', () => {
      // Atletismo (FOR): FOR 16 (+3) + prof (+2) = +5
      expect(getSkillModifier(VALEROS_HERO, 'athletics')).toBe(5);
    });

    it('calcula perícia não treinada', () => {
      // Acrobacia (DES): DES 12 (+1) + 0 = +1
      expect(getSkillModifier(VALEROS_HERO, 'acrobatics')).toBe(1);
    });

    it('calcula perícia com Especialização (Expertise = dobro do bônus de proficiência)', () => {
      const char = {
        ...VALEROS_HERO,
        skills: {
          ...VALEROS_HERO.skills,
          stealth: { proficiency: 'expertise' as const },
        },
      };
      // Furtividade (DES 12 = +1) + 2 * (+2) = +5
      expect(getSkillModifier(char, 'stealth')).toBe(5);
    });
  });

  describe('Sentidos Passivos', () => {
    it('calcula Percepção Passiva corretamente (10 + modificador)', () => {
      // Valeros: SAB 13 (+1), Percepção proficiente (+2) => mod = +3 => passiva = 13
      expect(getPassivePerception(VALEROS_HERO)).toBe(13);
    });
  });

  describe('Conjuração de Magia', () => {
    it('calcula CD de Magia e Bônus de Ataque Mágico', () => {
      const wizard = {
        ...createEmptyCharacter(),
        level: 5, // prof = +3
        abilities: {
          ...createEmptyCharacter().abilities,
          int: { score: 18, saveProficient: true }, // mod = +4
        },
        spellcasting: {
          ability: 'int' as const,
          spellSaveDcBonus: 0,
          spellAttackBonusMod: 0,
          slots: [],
          spells: [],
        },
      };

      // CD: 8 + 3 (prof) + 4 (INT) = 15
      expect(getSpellSaveDC(wizard)).toBe(15);
      // Ataque: 3 (prof) + 4 (INT) = +7
      expect(getSpellAttackBonus(wizard)).toBe(7);
    });
  });

  describe('Capacidade de Carga & Peso do Inventário', () => {
    it('calcula capacidade de carga em kg baseada na Força', () => {
      // FOR 16: max = 16 * 7.5 = 120 kg, sobrecarregado = 16 * 2.5 = 40 kg
      const cap = getCarryingCapacity(16);
      expect(cap.maxWeight).toBe(120);
      expect(cap.encumberedWeight).toBe(40);
    });

    it('calcula peso total do inventário somando itens e moedas', () => {
      const weight = getTotalInventoryWeight(VALEROS_HERO);
      expect(weight).toBeGreaterThan(0);
    });
  });
});
