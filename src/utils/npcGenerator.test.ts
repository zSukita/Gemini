import { describe, it, expect } from 'vitest';
import { generateNpc } from './npcGenerator';

describe('npcGenerator', () => {
  it('deve gerar NPC completo com todos os campos preenchidos', () => {
    const npc = generateNpc();
    expect(npc.id).toContain('npc-');
    expect(npc.name.length).toBeGreaterThan(3);
    expect(npc.race.length).toBeGreaterThan(2);
    expect(npc.occupation.length).toBeGreaterThan(3);
    expect(npc.appearance.length).toBeGreaterThan(10);
    expect(npc.mannerism.length).toBeGreaterThan(10);
    expect(npc.secret.length).toBeGreaterThan(10);
    expect(npc.rumor.length).toBeGreaterThan(10);
    expect(npc.quote.length).toBeGreaterThan(10);
  });

  it('deve respeitar a raça escolhida', () => {
    const dwarf = generateNpc('Anão');
    expect(dwarf.race).toBe('Anão');

    const elf = generateNpc('Elfo');
    expect(elf.race).toBe('Elfo');
  });

  it('deve respeitar o gênero especificado', () => {
    const female = generateNpc('Humano', 'feminino');
    expect(female.gender).toBe('feminino');

    const male = generateNpc('Humano', 'masculino');
    expect(male.gender).toBe('masculino');
  });
});
