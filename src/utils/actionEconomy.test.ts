import { describe, expect, it } from 'vitest';
import { classifyCastingTime, makeTurnActionUseKey } from './actionEconomy';

describe('controle de ações de conjuração', () => {
  it('classifica ação, ação bônus e reação', () => {
    expect(classifyCastingTime('1 ação')).toBe('ação');
    expect(classifyCastingTime('1 ação bônus')).toBe('ação bônus');
    expect(classifyCastingTime('1 reação, quando sofrer dano')).toBe('reação');
  });

  it('não cobra ação por tempos sem ação de combate explícita', () => {
    expect(classifyCastingTime('1 minuto')).toBeNull();
    expect(classifyCastingTime('')).toBeNull();
  });

  it('separa o uso por combate, rodada, personagem e tipo', () => {
    expect(makeTurnActionUseKey('mesa-1', 2, 'hero-1', 'ação'))
      .not.toBe(makeTurnActionUseKey('mesa-1', 2, 'hero-1', 'ação bônus'));
  });
});
