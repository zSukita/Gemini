import { describe, it, expect } from 'vitest';
import { CONDITIONS } from '../data/conditions';
import { EXHAUSTION_LEVELS } from '../components/ConditionsTracker';

describe('conditions and exhaustion rules', () => {
  it('defines all 14 core D&D 5e conditions with descriptive mechanical rules', () => {
    const keys = Object.keys(CONDITIONS);
    expect(keys.length).toBe(14);
    expect(CONDITIONS.poisoned.name).toBe('Envenenado');
    expect(CONDITIONS.poisoned.description).toContain('Desvantagem');
    expect(CONDITIONS.blinded.name).toBe('Cego');
    expect(CONDITIONS.prone.name).toBe('Caído');
  });

  it('provides 6 standard levels of exhaustion with accurate progressive effects', () => {
    expect(EXHAUSTION_LEVELS.length).toBe(6);
    expect(EXHAUSTION_LEVELS[0].level).toBe(1);
    expect(EXHAUSTION_LEVELS[0].effect).toContain('Desvantagem em todos os testes');
    expect(EXHAUSTION_LEVELS[5].level).toBe(6);
    expect(EXHAUSTION_LEVELS[5].effect).toContain('Morte');
  });
});
