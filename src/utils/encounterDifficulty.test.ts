import { describe, it, expect } from 'vitest';
import { 
  calculateEncounterDifficulty, 
  getXpForCr, 
  getMonsterMultiplier 
} from './encounterDifficulty';

describe('encounterDifficulty', () => {
  it('deve retornar XP correto para diferentes NDs', () => {
    expect(getXpForCr('1/4')).toBe(50);
    expect(getXpForCr('1')).toBe(200);
    expect(getXpForCr('5')).toBe(1800);
    expect(getXpForCr('10')).toBe(5900);
  });

  it('deve calcular multiplicador de quantidade de monstros', () => {
    expect(getMonsterMultiplier(1, 4)).toBe(1);
    expect(getMonsterMultiplier(2, 4)).toBe(1.5);
    expect(getMonsterMultiplier(4, 4)).toBe(2.0);
    expect(getMonsterMultiplier(8, 4)).toBe(2.5);
  });

  it('deve avaliar dificuldade correta para grupo de 4 personagens nível 1', () => {
    // 4 personagens nível 1: Fácil 100, Médio 200, Difícil 300, Mortal 400
    const party = [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];

    // 1 Goblin (ND 1/4 = 50 XP, mult 1x = 50 XP -> Trivial)
    const encounter1 = calculateEncounterDifficulty(party, [{ cr: '1/4' }]);
    expect(encounter1.difficulty).toBe('trivial');

    // 2 Goblins (ND 1/4 = 100 XP, mult 1.5x = 150 XP -> Fácil)
    const encounter2 = calculateEncounterDifficulty(party, [{ cr: '1/4' }, { cr: '1/4' }]);
    expect(encounter2.difficulty).toBe('easy');

    // 4 Goblins (ND 1/4 = 200 XP, mult 2x = 400 XP -> Mortal)
    const encounter3 = calculateEncounterDifficulty(party, [
      { cr: '1/4' }, { cr: '1/4' }, { cr: '1/4' }, { cr: '1/4' }
    ]);
    expect(encounter3.difficulty).toBe('deadly');
  });

  it('deve calcular XP por jogador corretamente', () => {
    const party = [{ level: 3 }, { level: 3 }, { level: 3 }, { level: 3 }];
    const monsters = [{ cr: '2' }]; // 450 XP
    const result = calculateEncounterDifficulty(party, monsters);
    expect(result.totalMonsterXp).toBe(450);
    expect(result.xpPerPlayer).toBe(Math.round(450 / 4));
  });
});
