import { describe, it, expect } from 'vitest';
import {
  roll4d6DropLowest,
  buildCharacterFromWizard,
  STANDARD_ARRAY,
} from './characterCreation';

describe('characterCreation utils', () => {
  it('roll4d6DropLowest deve rolar 4 dados, descartar o menor e somar os 3 maiores', () => {
    for (let i = 0; i < 20; i++) {
      const res = roll4d6DropLowest();
      expect(res.rolls).toHaveLength(4);
      expect(res.total).toBeGreaterThanOrEqual(3);
      expect(res.total).toBeLessThanOrEqual(18);

      const droppedVal = res.rolls[res.droppedIndex];
      res.rolls.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(droppedVal);
      });

      const calculatedSum = res.rolls.reduce((acc, v, idx) => (idx === res.droppedIndex ? acc : acc + v), 0);
      expect(res.total).toBe(calculatedSum);
    }
  });

  it('STANDARD_ARRAY deve conter os valores canônicos do D&D 5e', () => {
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('buildCharacterFromWizard deve criar Bárbaro Anão com PV, dado e salvaguardas corretas', () => {
    const char = buildCharacterFromWizard({
      name: 'Krag Thorgrim',
      classId: 'barbarian',
      raceId: 'dwarf',
      background: 'Soldado',
      alignment: 'Caótico e Bom',
      baseAbilities: {
        str: 15,
        dex: 13,
        con: 14, // Anão ganha +2 CON -> 16 (+3)
        int: 10,
        wis: 12,
        cha: 8,
      },
    });

    expect(char.name).toBe('Krag Thorgrim');
    expect(char.characterClass).toBe('Bárbaro');
    expect(char.race).toBe('Anão');
    expect(char.hitDice.dieType).toBe('d12');

    // CON final deve ser 14 + 2 = 16 (Mod +3)
    expect(char.abilities.con.score).toBe(16);
    // FOR final deve ser 15 + 2 = 17 (Mod +3)
    expect(char.abilities.str.score).toBe(17);

    // PV inicial = Dado d12 (12) + Mod CON (+3) = 15
    expect(char.maxHp).toBe(15);
    expect(char.currentHp).toBe(15);

    // Salvaguardas de Bárbaro: FOR e CON
    expect(char.abilities.str.saveProficient).toBe(true);
    expect(char.abilities.con.saveProficient).toBe(true);
    expect(char.abilities.wis.saveProficient).toBe(false);

    // Velocidade de Anão = 7.5m
    expect(char.speed).toBe(7.5);

    // Traços raciais e de classe devem estar nas features
    const featureNames = char.features.map((f) => f.name);
    expect(featureNames).toContain('Resiliência Anã');
    expect(featureNames).toContain('Fúria (Rage)');
  });

  it('buildCharacterFromWizard deve criar Mago Elfo com grimório e espaços de magia', () => {
    const char = buildCharacterFromWizard({
      name: 'Eldrin Silversight',
      classId: 'wizard',
      raceId: 'elf',
      background: 'Sábio',
      alignment: 'Neutro e Bom',
      baseAbilities: {
        str: 8,
        dex: 14, // Elfo +2 -> 16 (+3)
        con: 12, // CON 12 (+1)
        int: 15, // Elfo +1 -> 16 (+3)
        wis: 13,
        cha: 10,
      },
    });

    expect(char.characterClass).toBe('Mago');
    expect(char.race).toBe('Elfo');
    expect(char.hitDice.dieType).toBe('d6');

    // INT deve ser 15 + 1 = 16
    expect(char.abilities.int.score).toBe(16);
    // DES deve ser 14 + 2 = 16
    expect(char.abilities.dex.score).toBe(16);

    // PV inicial = 6 (d6) + 1 (CON) = 7
    expect(char.maxHp).toBe(7);

    // Salvaguardas de Mago: INT e SAB
    expect(char.abilities.int.saveProficient).toBe(true);
    expect(char.abilities.wis.saveProficient).toBe(true);
    expect(char.abilities.str.saveProficient).toBe(false);

    // Mago tem 2 espaços de magia de 1º círculo
    expect(char.spellcasting.slots[0].max).toBe(2);
    expect(char.spellcasting.ability).toBe('int');

    // Percepção de Elfo deve estar proficiente
    expect(char.skills.perception.proficiency).toBe('proficient');
  });
});
