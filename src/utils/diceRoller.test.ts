import { describe, it, expect, vi } from 'vitest';
import { rollDie, rollD20, rollFormula } from './diceRoller';

// Mock confetti e áudio para ambiente Node
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Rolador de Dados (Dice Roller)', () => {
  it('rollDie deve retornar valores dentro do intervalo de faces', () => {
    for (let i = 0; i < 50; i++) {
      const d6 = rollDie(6);
      expect(d6).toBeGreaterThanOrEqual(1);
      expect(d6).toBeLessThanOrEqual(6);

      const d20 = rollDie(20);
      expect(d20).toBeGreaterThanOrEqual(1);
      expect(d20).toBeLessThanOrEqual(20);
    }
  });

  it('rollD20 deve aplicar modificadores e retornar estrutura correta', () => {
    const res = rollD20('Teste de Força', 3, 'normal');
    expect(res.label).toBe('Teste de Força');
    expect(res.modifier).toBe(3);
    expect(res.total).toBe(res.selectedRoll + 3);
    expect(res.dieType).toBe('d20');
    expect(res.rolls.length).toBe(1);
  });

  it('rollD20 com Vantagem deve rolar 2 dados e escolher o maior', () => {
    const res = rollD20('Ataque com Vantagem', 2, 'advantage');
    expect(res.rolls.length).toBe(2);
    expect(res.selectedRoll).toBe(Math.max(res.rolls[0], res.rolls[1]));
    expect(res.total).toBe(res.selectedRoll + 2);
  });

  it('rollD20 com Desvantagem deve rolar 2 dados e escolher o menor', () => {
    const res = rollD20('Furtividade com Desvantagem', 0, 'disadvantage');
    expect(res.rolls.length).toBe(2);
    expect(res.selectedRoll).toBe(Math.min(res.rolls[0], res.rolls[1]));
    expect(res.total).toBe(res.selectedRoll);
  });

  it('rollFormula deve processar fórmulas compostas como 2d6 + 4', () => {
    const res = rollFormula('2d6 + 4', 'Dano de Espada');
    expect(res.rolls.length).toBe(2);
    const sum = res.rolls[0] + res.rolls[1];
    expect(res.total).toBe(sum + 4);
  });

  it('rollFormula com acerto crítico deve dobrar o número de dados', () => {
    const normal = rollFormula('1d8 + 3', 'Dano Normal', false);
    expect(normal.rolls.length).toBe(1);

    const crit = rollFormula('1d8 + 3', 'Dano Crítico', true);
    expect(crit.rolls.length).toBe(2); // 1d8 dobrado para 2d8
  });
});
