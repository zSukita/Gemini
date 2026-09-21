import { describe, it, expect } from 'vitest';
import { SRD_EQUIPMENT } from './srdEquipment';

describe('D&D 5e SRD Equipment Catalog', () => {
  it('should contain all major equipment categories', () => {
    const categories = new Set(SRD_EQUIPMENT.map((i) => i.category));
    expect(categories.has('armas')).toBe(true);
    expect(categories.has('armaduras')).toBe(true);
    expect(categories.has('aventura')).toBe(true);
    expect(categories.has('pocoes')).toBe(true);
    expect(categories.has('magicos')).toBe(true);
  });

  it('should have standard weapon properties for Longsword and Dagger', () => {
    const longsword = SRD_EQUIPMENT.find((i) => i.id === 'longsword');
    expect(longsword).toBeDefined();
    expect(longsword?.damage).toBe('1d8');
    expect(longsword?.damageType).toBe('Cortante');
    expect(longsword?.properties).toContain('Versátil (1d10 com duas mãos)');

    const dagger = SRD_EQUIPMENT.find((i) => i.id === 'dagger');
    expect(dagger).toBeDefined();
    expect(dagger?.damage).toBe('1d4');
    expect(dagger?.damageType).toBe('Perfurante');
    expect(dagger?.properties).toContain('Ágil');
  });

  it('should have correct armor classes for Plate and Shield', () => {
    const plate = SRD_EQUIPMENT.find((i) => i.id === 'plate-armor');
    expect(plate).toBeDefined();
    expect(plate?.baseArmorClass).toBe(18);
    expect(plate?.dexBonus).toBe('none');
    expect(plate?.stealthDisadvantage).toBe(true);

    const shield = SRD_EQUIPMENT.find((i) => i.id === 'shield');
    expect(shield).toBeDefined();
    expect(shield?.baseArmorClass).toBe(2);
  });
});
