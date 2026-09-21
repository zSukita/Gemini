import { describe, it, expect } from 'vitest';
import { generateLoot } from './lootGenerator';

describe('lootGenerator', () => {
  it('deve gerar saque individual para diferentes faixas de ND', () => {
    const loot1 = generateLoot('0-4', 'individual');
    expect(loot1.tier).toBe('0-4');
    expect(loot1.type).toBe('individual');
    expect(loot1.totalGoldValue).toBeGreaterThanOrEqual(0);

    const loot2 = generateLoot('5-10', 'individual');
    expect(loot2.tier).toBe('5-10');
    expect(loot2.totalGoldValue).toBeGreaterThanOrEqual(0);
  });

  it('deve gerar tesouro de covil com moedas, gemas e itens mágicos', () => {
    const hoard = generateLoot('5-10', 'hoard');
    expect(hoard.type).toBe('hoard');
    expect(hoard.coins.gp).toBeGreaterThan(0);
    expect(hoard.gems.length).toBeGreaterThan(0);
    expect(hoard.magicItems.length).toBeGreaterThan(0);
    expect(hoard.totalGoldValue).toBeGreaterThan(100);
    expect(hoard.summaryText.length).toBeGreaterThan(5);
  });

  it('deve calcular valor em ouro equivalente corretamente', () => {
    const hoard = generateLoot('11-16', 'hoard');
    expect(hoard.totalGoldValue).toBeGreaterThan(1000);
    expect(hoard.coins.gp + hoard.coins.pp * 10).toBeLessThanOrEqual(hoard.totalGoldValue);
  });
});
