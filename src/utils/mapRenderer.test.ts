import { describe, it, expect } from 'vitest';
import { snapCoordinateToGrid, calculateMapDistance } from './mapRenderer';
import { DEFAULT_MAP_PRESETS } from '../data/defaultMaps';

describe('Grid Tático VTT & Map Renderer', () => {
  describe('Snap to Grid', () => {
    it('deve alinhar coordenadas ao múltiplo mais próximo da grade', () => {
      const gridSize = 50;
      expect(snapCoordinateToGrid(24, gridSize)).toBe(0);
      expect(snapCoordinateToGrid(26, gridSize)).toBe(50);
      expect(snapCoordinateToGrid(49, gridSize)).toBe(50);
      expect(snapCoordinateToGrid(78, gridSize)).toBe(100);
      expect(snapCoordinateToGrid(150, gridSize)).toBe(150);
    });
  });

  describe('Cálculo de Distância da Régua (Padrão D&D 5e: 1 quad = 1,5m)', () => {
    it('calcula movimento horizontal reto', () => {
      const gridSize = 50;
      // 3 quadrados para a direita (150px)
      const res = calculateMapDistance(0, 0, 150, 0, gridSize);
      expect(res.squares).toBe(3);
      expect(res.meters).toBe(4.5); // 3 * 1.5m
      expect(res.feet).toBe(15);    // 3 * 5ft
    });

    it('calcula movimento vertical reto', () => {
      const gridSize = 50;
      // 4 quadrados para baixo (200px)
      const res = calculateMapDistance(100, 100, 100, 300, gridSize);
      expect(res.squares).toBe(4);
      expect(res.meters).toBe(6);
      expect(res.feet).toBe(20);
    });

    it('calcula movimento diagonal com precisão', () => {
      const gridSize = 50;
      // Triângulo 3-4-5: 3 quadrados X, 4 quadrados Y => hipotenusa 5 quadrados
      const res = calculateMapDistance(0, 0, 150, 200, gridSize);
      expect(res.squares).toBe(5);
      expect(res.meters).toBe(7.5);
      expect(res.feet).toBe(25);
    });
  });

  describe('Presets de Mapas Embutidos', () => {
    it('deve possuir mapas de masmorra, floresta e taverna válidos', () => {
      expect(DEFAULT_MAP_PRESETS.length).toBeGreaterThanOrEqual(3);
      const dungeon = DEFAULT_MAP_PRESETS.find((m) => m.id === 'map-dungeon');
      expect(dungeon).toBeDefined();
      expect(dungeon?.imageUrl).toContain('data:image/svg+xml');
      expect(dungeon?.width).toBeGreaterThan(0);
      expect(dungeon?.height).toBeGreaterThan(0);
    });
  });
});
