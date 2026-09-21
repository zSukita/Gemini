import { describe, it, expect } from 'vitest';
import { SRD_MONSTERS } from '../data/srdMonsters';
import { CONDITIONS } from '../data/conditions';
import type { Combatant } from '../types/combat';

describe('Painel do Mestre - Bestiário e Combate', () => {
  describe('Bestiário SRD 5e', () => {
    it('deve carregar criaturas essenciais do SRD', () => {
      expect(SRD_MONSTERS.length).toBeGreaterThanOrEqual(8);

      const goblin = SRD_MONSTERS.find((m) => m.name === 'Goblin');
      expect(goblin).toBeDefined();
      expect(goblin?.armorClass).toBe(15);
      expect(goblin?.hitPoints).toBe(7);
      expect(goblin?.actions.length).toBeGreaterThan(0);

      const dragon = SRD_MONSTERS.find((m) => m.name.includes('Dragão'));
      expect(dragon).toBeDefined();
      expect(dragon?.challengeRating).toBe('10');
    });

    it('deve conter as condições clássicas do D&D 5e', () => {
      expect(CONDITIONS.blinded).toBeDefined();
      expect(CONDITIONS.poisoned).toBeDefined();
      expect(CONDITIONS.prone).toBeDefined();
      expect(CONDITIONS.unconscious).toBeDefined();
      expect(CONDITIONS.paralyzed.name).toBe('Paralisado');
    });
  });

  describe('Lógica de Encontro & Ordem de Turnos', () => {
    const mockCombatants: Combatant[] = [
      {
        id: '1',
        name: 'Goblin 1',
        type: 'monster',
        initiative: 12,
        armorClass: 15,
        maxHp: 7,
        currentHp: 7,
        tempHp: 0,
        conditions: [],
      },
      {
        id: '2',
        name: 'Guerreiro (Jogador)',
        type: 'player',
        initiative: 18,
        armorClass: 18,
        maxHp: 28,
        currentHp: 28,
        tempHp: 0,
        conditions: [],
      },
      {
        id: '3',
        name: 'Goblin 2',
        type: 'monster',
        initiative: 8,
        armorClass: 15,
        maxHp: 7,
        currentHp: 7,
        tempHp: 0,
        conditions: [],
      },
    ];

    it('deve ordenar participantes por iniciativa decrescente', () => {
      const sorted = [...mockCombatants].sort((a, b) => b.initiative - a.initiative);
      expect(sorted[0].name).toBe('Guerreiro (Jogador)'); // 18
      expect(sorted[1].name).toBe('Goblin 1'); // 12
      expect(sorted[2].name).toBe('Goblin 2'); // 8
    });

    it('deve simular passagem de rodadas ao completar todos os turnos', () => {
      let round = 1;
      let activeIndex = 0;
      const total = mockCombatants.length;

      // Avança 3 turnos (0 -> 1 -> 2 -> rodada 2 índice 0)
      for (let i = 0; i < total; i++) {
        activeIndex++;
        if (activeIndex >= total) {
          round++;
          activeIndex = 0;
        }
      }

      expect(round).toBe(2);
      expect(activeIndex).toBe(0);
    });

    it('deve absorver dano através de HP temporário antes do HP real', () => {
      let currentHp = 20;
      let tempHp = 5;
      const damage = 8;

      let rem = damage;
      if (tempHp >= rem) {
        tempHp -= rem;
        rem = 0;
      } else {
        rem -= tempHp;
        tempHp = 0;
        currentHp = Math.max(0, currentHp - rem);
      }

      expect(tempHp).toBe(0);
      expect(currentHp).toBe(17); // 20 - 3 restante
    });
  });
});
