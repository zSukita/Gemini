import { describe, it, expect } from 'vitest';
import { AI_ADVENTURE_SCENARIOS } from './aiAdventureScenarios';
import { DEFAULT_MAP_PRESETS } from './defaultMaps';
import { SRD_MONSTERS } from './srdMonsters';

describe('aiAdventureScenarios', () => {
  it('deve conter cenários prontos com todas as propriedades necessárias', () => {
    expect(AI_ADVENTURE_SCENARIOS.length).toBeGreaterThan(0);

    AI_ADVENTURE_SCENARIOS.forEach((scenario) => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.initialPrompt).toBeTruthy();
      expect(scenario.suggestedActions.length).toBeGreaterThanOrEqual(2);
      expect(['day', 'dusk', 'night']).toContain(scenario.ambientLight);
    });
  });

  it('todos os cenários devem apontar para presets de mapa válidos', () => {
    const mapIds = new Set(DEFAULT_MAP_PRESETS.map((m) => m.id));

    AI_ADVENTURE_SCENARIOS.forEach((scenario) => {
      expect(mapIds.has(scenario.mapPresetId)).toBe(true);
    });
  });

  it('todos os monstros dos cenários devem existir no catálogo SRD', () => {
    const monsterIds = new Set(SRD_MONSTERS.map((m) => m.id));

    AI_ADVENTURE_SCENARIOS.forEach((scenario) => {
      scenario.monsters.forEach((m) => {
        expect(monsterIds.has(m.monsterId)).toBe(true);
        expect(m.count).toBeGreaterThan(0);
      });
    });
  });
});
