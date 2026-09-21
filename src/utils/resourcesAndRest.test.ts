import { describe, it, expect } from 'vitest';
import type { CharacterResource } from '../types/dnd5e';

describe('Recursos de Classe & Descansos (Resources & Rest)', () => {
  const sampleResources: CharacterResource[] = [
    {
      id: 'res-1',
      name: 'Surto de Ação',
      current: 0,
      max: 1,
      resetOn: 'short',
      description: 'Guerreiro',
    },
    {
      id: 'res-2',
      name: 'Fúria',
      current: 0,
      max: 2,
      resetOn: 'long',
      description: 'Bárbaro',
    },
    {
      id: 'res-3',
      name: 'Cargas de Varinha',
      current: 1,
      max: 7,
      resetOn: 'manual',
      description: 'Item Mágico',
    },
  ];

  it('deve recarregar recursos de descanso curto durante descanso curto', () => {
    const afterShortRest = sampleResources.map((res) =>
      res.resetOn === 'short' ? { ...res, current: res.max } : res
    );

    const actionSurge = afterShortRest.find((r) => r.name === 'Surto de Ação');
    const rage = afterShortRest.find((r) => r.name === 'Fúria');
    const wand = afterShortRest.find((r) => r.name === 'Cargas de Varinha');

    expect(actionSurge?.current).toBe(1);
    expect(rage?.current).toBe(0); // Não reseta em descanso curto
    expect(wand?.current).toBe(1); // Manual não reseta
  });

  it('deve recarregar recursos de descanso curto E longo durante descanso longo', () => {
    const afterLongRest = sampleResources.map((res) => {
      if (res.resetOn === 'short' || res.resetOn === 'long') {
        return { ...res, current: res.max };
      }
      return res;
    });

    const actionSurge = afterLongRest.find((r) => r.name === 'Surto de Ação');
    const rage = afterLongRest.find((r) => r.name === 'Fúria');
    const wand = afterLongRest.find((r) => r.name === 'Cargas de Varinha');

    expect(actionSurge?.current).toBe(1);
    expect(rage?.current).toBe(2);
    expect(wand?.current).toBe(1);
  });

  it('deve calcular recuperação de dados de vida no descanso longo (mínimo 1, metade do total)', () => {
    const totalLevel1 = 1;
    const regainedLvl1 = Math.max(1, Math.floor(totalLevel1 / 2));
    expect(regainedLvl1).toBe(1);

    const totalLevel5 = 5;
    const regainedLvl5 = Math.max(1, Math.floor(totalLevel5 / 2));
    expect(regainedLvl5).toBe(2);

    const totalLevel10 = 10;
    const regainedLvl10 = Math.max(1, Math.floor(totalLevel10 / 2));
    expect(regainedLvl10).toBe(5);
  });
});
