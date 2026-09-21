import { describe, it, expect } from 'vitest';
import { DEFAULT_MAP_PRESETS, RECOMMENDED_MAP_SOURCES } from './defaultMaps';

describe('defaultMaps presets', () => {
  it('deve conter mapas pré-definidos com propriedades válidas', () => {
    expect(DEFAULT_MAP_PRESETS.length).toBeGreaterThan(3);

    DEFAULT_MAP_PRESETS.forEach((map) => {
      expect(map.id).toBeTruthy();
      expect(map.title).toBeTruthy();
      expect(map.category).toBeTruthy();
      expect(map.gridSize).toBeGreaterThan(0);
      expect(map.width).toBeGreaterThan(0);
      expect(map.height).toBeGreaterThan(0);
      expect(map.imageUrl).toBeTruthy();
    });
  });

  it('deve conter mapas da internet (isOnline)', () => {
    const onlineMaps = DEFAULT_MAP_PRESETS.filter((m) => m.isOnline);
    expect(onlineMaps.length).toBeGreaterThanOrEqual(2);

    onlineMaps.forEach((map) => {
      expect(map.imageUrl).toMatch(/^https?:\/\//);
      expect(map.author).toBeTruthy();
    });
  });

  it('deve conter fontes e repositórios recomendados de mapas da internet', () => {
    expect(RECOMMENDED_MAP_SOURCES.length).toBeGreaterThanOrEqual(3);
    RECOMMENDED_MAP_SOURCES.forEach((source) => {
      expect(source.name).toBeTruthy();
      expect(source.url).toMatch(/^https?:\/\//);
      expect(source.description).toBeTruthy();
    });
  });
});
