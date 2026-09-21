import { describe, it, expect } from 'vitest';
import { metersToPixels, generateConePath, createAoETemplate, AOE_PRESETS } from './aoeTemplates';

describe('aoeTemplates utilities', () => {
  it('converts meters to pixels accurately based on 1 cell = 1.5m', () => {
    const gridSize = 50;
    expect(metersToPixels(1.5, gridSize)).toBe(50);
    expect(metersToPixels(6, gridSize)).toBe(200); // 4 células
    expect(metersToPixels(9, gridSize)).toBe(300); // 6 células
  });

  it('generates a valid SVG cone path', () => {
    const path = generateConePath(100, 100, 200, 0);
    expect(path).toContain('M 100 100');
    expect(path).toContain('L');
    expect(path).toContain('A 200 200');
  });

  it('creates an AoE template from a preset', () => {
    const fireballPreset = AOE_PRESETS.find((p) => p.id === 'fireball')!;
    const template = createAoETemplate(fireballPreset, 250, 300);
    expect(template.id).toMatch(/^aoe-/);
    expect(template.type).toBe('circle');
    expect(template.sizeMeters).toBe(6);
    expect(template.x).toBe(250);
    expect(template.y).toBe(300);
    expect(template.color).toBe('#ef4444');
  });
});
