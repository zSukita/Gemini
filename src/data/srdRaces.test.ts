import { describe, it, expect } from 'vitest';
import { SRD_RACES } from './srdRaces';

describe('SRD Races catalog', () => {
  it('deve conter as 9 raças oficiais do D&D 5e', () => {
    expect(SRD_RACES).toHaveLength(9);

    const names = SRD_RACES.map((r) => r.name);
    expect(names).toContain('Humano');
    expect(names).toContain('Elfo');
    expect(names).toContain('Anão');
    expect(names).toContain('Halfling');
    expect(names).toContain('Draconato');
    expect(names).toContain('Gnomo');
    expect(names).toContain('Meio-Elfo');
    expect(names).toContain('Meio-Orc');
    expect(names).toContain('Tiefling');
  });

  it('cada raça deve ter velocidade, tamanho, idiomas e traços definidos', () => {
    SRD_RACES.forEach((race) => {
      expect(race.id).toBeTruthy();
      expect(race.name).toBeTruthy();
      expect(race.speed).toBeGreaterThan(0);
      expect(['Médio', 'Pequeno']).toContain(race.size);
      expect(race.traits.length).toBeGreaterThanOrEqual(1);
      expect(race.languages.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(race.abilityBonuses).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Anão deve possuir bônus de CON e velocidade 7.5m', () => {
    const dwarf = SRD_RACES.find((r) => r.id === 'dwarf');
    expect(dwarf).toBeDefined();
    expect(dwarf?.abilityBonuses.con).toBe(2);
    expect(dwarf?.speed).toBe(7.5);
    expect(dwarf?.darkvision).toBe(18);
  });

  it('Humano deve possuir +1 em todos os 6 atributos', () => {
    const human = SRD_RACES.find((r) => r.id === 'human');
    expect(human).toBeDefined();
    expect(human?.abilityBonuses).toEqual({
      str: 1,
      dex: 1,
      con: 1,
      int: 1,
      wis: 1,
      cha: 1,
    });
  });
});
