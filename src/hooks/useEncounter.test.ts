// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounter } from './useEncounter';

describe('useEncounter hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicializa com estado de encontro padrão', () => {
    const { result } = renderHook(() => useEncounter());

    expect(result.current.encounter.round).toBe(1);
    expect(result.current.encounter.combatants).toEqual([]);
    expect(result.current.encounter.isRunning).toBe(false);
  });

  it('adiciona combatentes ao combate com addCustomCombatant', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Goblin Espião',
        type: 'monster',
        initiative: 14,
        armorClass: 15,
        maxHp: 7,
        currentHp: 7,
        tempHp: 0,
        conditions: [],
      });
    });

    expect(result.current.encounter.combatants.length).toBe(1);
    expect(result.current.encounter.combatants[0].name).toBe('Goblin Espião');
  });

  it('inicia o combate e avança os turnos e rodadas corretamente', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Guerreiro',
        type: 'player',
        initiative: 18,
        armorClass: 16,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Orc',
        type: 'monster',
        initiative: 10,
        armorClass: 13,
        maxHp: 15,
        currentHp: 15,
        tempHp: 0,
        conditions: [],
      });
    });

    act(() => {
      result.current.startEncounter();
    });

    expect(result.current.encounter.isRunning).toBe(true);
    expect(result.current.encounter.activeCombatantIndex).toBe(0);
    expect(result.current.encounter.round).toBe(1);

    // Próximo turno (vai para o segundo combatente)
    act(() => {
      result.current.nextTurn();
    });
    expect(result.current.encounter.activeCombatantIndex).toBe(1);
    expect(result.current.encounter.round).toBe(1);

    // Próximo turno (volta para o primeiro combatente e incrementa rodada)
    act(() => {
      result.current.nextTurn();
    });
    expect(result.current.encounter.activeCombatantIndex).toBe(0);
    expect(result.current.encounter.round).toBe(2);
  });

  it('aplica e remove condições dos combatentes com toggleCombatantCondition', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Mago',
        type: 'player',
        initiative: 12,
        armorClass: 12,
        maxHp: 14,
        currentHp: 14,
        tempHp: 0,
        conditions: [],
      });
    });

    const combatantId = result.current.encounter.combatants[0].id;

    // Adiciona condição 'poisoned'
    act(() => {
      result.current.toggleCombatantCondition(combatantId, 'poisoned');
    });
    expect(result.current.encounter.combatants[0].conditions).toContain('poisoned');

    // Remove condição 'poisoned'
    act(() => {
      result.current.toggleCombatantCondition(combatantId, 'poisoned');
    });
    expect(result.current.encounter.combatants[0].conditions).not.toContain('poisoned');
  });

  it('atualiza o HP de um combatente com applyCombatantHpDelta', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Lobo',
        type: 'monster',
        initiative: 15,
        armorClass: 13,
        maxHp: 11,
        currentHp: 11,
        tempHp: 0,
        conditions: [],
      });
    });

    const combatantId = result.current.encounter.combatants[0].id;

    act(() => {
      // Aplica dano de 5
      result.current.applyCombatantHpDelta(combatantId, -5);
    });

    expect(result.current.encounter.combatants[0].currentHp).toBe(6);
  });
});
