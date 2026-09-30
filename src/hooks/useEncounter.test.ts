// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounter, sanitizeEncounter } from './useEncounter';

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

  it('registra a alteração de PV e desfaz exatamente dano absorvido por PV temporários', () => {
    const { result } = renderHook(() => useEncounter());
    act(() => result.current.addCustomCombatant({
      name: 'Paladino', type: 'player', initiative: 12, armorClass: 18,
      maxHp: 20, currentHp: 20, tempHp: 4, conditions: [],
    }));
    const id = result.current.encounter.combatants[0].id;
    act(() => result.current.applyCombatantHpDelta(id, -6));
    expect(result.current.encounter.combatants[0]).toMatchObject({ currentHp: 18, tempHp: 0 });
    expect(result.current.encounter.actionLog?.[0].message).toContain('Paladino');
    act(() => result.current.undoLastHpChange());
    expect(result.current.encounter.combatants[0]).toMatchObject({ currentHp: 20, tempHp: 4 });
    expect(result.current.encounter.lastHpChange).toBeUndefined();
    expect(result.current.encounter.actionLog?.[0].message).toContain('Correção');
  });

  it('preserva o combatente ativo por ID quando novos combatentes são adicionados durante o combate', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Guerreiro',
        type: 'player',
        initiative: 20,
        armorClass: 16,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Mago',
        type: 'player',
        initiative: 15,
        armorClass: 12,
        maxHp: 12,
        currentHp: 12,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Ladino',
        type: 'player',
        initiative: 10,
        armorClass: 14,
        maxHp: 14,
        currentHp: 14,
        tempHp: 0,
        conditions: [],
      });
      result.current.startEncounter();
    });

    // Avança para o turno do Mago
    act(() => {
      result.current.nextTurn();
    });

    const activeIdBefore = result.current.encounter.activeCombatantId;
    const activeNameBefore = result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name;
    expect(activeNameBefore).toBe('Mago');

    // Adiciona reforço de monstros durante o combate ativo
    act(() => {
      result.current.addCustomCombatant({
        name: 'Goblin Emboscador',
        type: 'monster',
        initiative: 25,
        armorClass: 13,
        maxHp: 8,
        currentHp: 8,
        tempHp: 0,
        conditions: [],
      });
    });

    // O turno ativo deve permanecer com o Mago!
    expect(result.current.encounter.activeCombatantId).toBe(activeIdBefore);
    const activeNameAfter = result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name;
    expect(activeNameAfter).toBe('Mago');
  });

  it('quando um combatente não-ativo é removido, o turno do combatente ativo permanece inalterado', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Aventureiro 1',
        type: 'player',
        initiative: 20,
        armorClass: 15,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Aventureiro 2',
        type: 'player',
        initiative: 15,
        armorClass: 15,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Aventureiro 3',
        type: 'player',
        initiative: 10,
        armorClass: 15,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.startEncounter();
      // Avança para o segundo combatente (Aventureiro 2)
      result.current.nextTurn();
    });

    expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Aventureiro 2');
    const firstId = result.current.encounter.combatants[0].id;

    // Remove o primeiro combatente (Aventureiro 1)
    act(() => {
      result.current.removeCombatant(firstId);
    });

    // O combatente ativo ainda deve ser o Aventureiro 2!
    expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Aventureiro 2');
    expect(result.current.encounter.activeCombatantIndex).toBe(0); // agora é o primeiro da lista
  });

  it('quando o combatente ativo é removido, avança previsivelmente para o próximo combatente', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Guerreiro',
        type: 'player',
        initiative: 20,
        armorClass: 16,
        maxHp: 20,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Ladino',
        type: 'player',
        initiative: 15,
        armorClass: 14,
        maxHp: 15,
        currentHp: 15,
        tempHp: 0,
        conditions: [],
      });
      result.current.startEncounter();
    });

    const activeId = result.current.encounter.activeCombatantId!;
    expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Guerreiro');

    // Remove o combatente ativo atual
    act(() => {
      result.current.removeCombatant(activeId);
    });

    // Agora o turno deve ter passado para o Ladino
    expect(result.current.encounter.combatants.length).toBe(1);
    expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Ladino');
  });

  it('desempata iniciativa de forma estável usando Destreza, prioridade de jogador e ID estável', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      // Monstro com DES 14 (+2) e Iniciativa 15
      result.current.addCustomCombatant({
        name: 'Lobo Alfa',
        type: 'monster',
        initiative: 15,
        armorClass: 13,
        maxHp: 18,
        currentHp: 18,
        tempHp: 0,
        conditions: [],
        monsterData: {
          id: 'wolf',
          name: 'Lobo Alfa',
          size: 'Médio',
          type: 'Fera',
          alignment: 'Neutro',
          armorClass: 13,
          hitPoints: 18,
          hitDice: '3d8',
          speed: '12m',
          abilities: { str: 12, dex: 16, con: 12, int: 3, wis: 12, cha: 6 },
          challengeRating: '1',
          xp: 200,
          senses: 'Faro',
          languages: 'Nenhum',
          actions: [],
        },
      });
      // Jogador com Iniciativa 15
      result.current.addCustomCombatant({
        name: 'Arqueiro Elfo',
        type: 'player',
        initiative: 15,
        armorClass: 14,
        maxHp: 16,
        currentHp: 16,
        tempHp: 0,
        conditions: [],
      });
      // Monstro com DES 10 e Iniciativa 15
      result.current.addCustomCombatant({
        name: 'Zumbi',
        type: 'monster',
        initiative: 15,
        armorClass: 8,
        maxHp: 22,
        currentHp: 22,
        tempHp: 0,
        conditions: [],
        monsterData: {
          id: 'zombie',
          name: 'Zumbi',
          size: 'Médio',
          type: 'Morto-vivo',
          alignment: 'Neutro e Mau',
          armorClass: 8,
          hitPoints: 22,
          hitDice: '3d8+9',
          speed: '6m',
          abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
          challengeRating: '1/4',
          xp: 50,
          senses: 'Visão no Escuro',
          languages: 'Compreende Comum',
          actions: [],
        },
      });
    });

    act(() => {
      result.current.sortCombatantsByInitiative();
    });

    const names = result.current.encounter.combatants.map((c) => c.name);
    // Lobo Alfa tem DES 16 (maior que default 12 do jogador e DES 6 do zumbi) -> age primeiro
    // Arqueiro Elfo tem prioridade sobre zumbi (DES default 12 vs 6) -> age segundo
    // Zumbi age por último
    expect(names[0]).toBe('Lobo Alfa');
    expect(names[1]).toBe('Arqueiro Elfo');
    expect(names[2]).toBe('Zumbi');
  });

  it('não pula silenciosamente jogadores com 0 PV e registra aviso para salvaguarda de morte', () => {
    const { result } = renderHook(() => useEncounter());

    act(() => {
      result.current.addCustomCombatant({
        name: 'Bárbaro',
        type: 'player',
        initiative: 20,
        armorClass: 14,
        maxHp: 30,
        currentHp: 20,
        tempHp: 0,
        conditions: [],
      });
      result.current.addCustomCombatant({
        name: 'Clérigo Caído',
        type: 'player',
        initiative: 10,
        armorClass: 16,
        maxHp: 22,
        currentHp: 0, // 0 PV!
        tempHp: 0,
        conditions: ['unconscious'],
      });
      result.current.startEncounter();
    });

    // Avança o turno: DEVE ir para o Clérigo Caído mesmo com 0 PV para a Salvaguarda de Morte
    act(() => {
      result.current.nextTurn();
    });

    expect(result.current.encounter.activeCombatantIndex).toBe(1);
    expect(result.current.encounter.combatants[1].name).toBe('Clérigo Caído');
    expect(result.current.encounter.actionLog?.[0].message).toContain('Salvaguarda contra a Morte pendente');
  });

  it('opera com segurança com lista vazia, combate parado ou índice fora de alcance', () => {
    const { result } = renderHook(() => useEncounter());

    expect(() => {
      act(() => {
        result.current.nextTurn();
        result.current.previousTurn();
        result.current.sortCombatantsByInitiative();
        result.current.removeCombatant('non-existent');
      });
    }).not.toThrow();

    expect(result.current.encounter.combatants).toHaveLength(0);
    expect(result.current.encounter.activeCombatantIndex).toBe(0);
  });

  it('valida e migra dados legados e corrompidos de encontro com sanitizeEncounter', () => {
    // Caso 1: entrada nula ou indefinida
    const emptyResult = sanitizeEncounter(null);
    expect(emptyResult.id).toBe('encounter-main');
    expect(emptyResult.round).toBe(1);
    expect(emptyResult.combatants).toEqual([]);

    // Caso 2: dados parciais com valores inválidos (PV negativo, round inválido, etc.)
    const dirtyData = {
      id: 'enc-123',
      name: 'Caverna dos Goblins',
      round: -5,
      activeCombatantIndex: 99,
      isRunning: true,
      combatants: [
        {
          id: 'c-1',
          name: 'Goblin 1',
          type: 'invalid_type',
          maxHp: 15,
          currentHp: -10, // deve ser limitado a 0
          tempHp: -4, // deve ser limitado a 0
          conditions: ['poisoned', 'invalid_condition_xyz'],
        },
      ],
    };

    const sanitized = sanitizeEncounter(dirtyData);
    expect(sanitized.id).toBe('enc-123');
    expect(sanitized.round).toBe(1);
    expect(sanitized.isRunning).toBe(true);
    expect(sanitized.combatants).toHaveLength(1);
    expect(sanitized.combatants[0].currentHp).toBe(0);
    expect(sanitized.combatants[0].tempHp).toBe(0);
    expect(sanitized.combatants[0].type).toBe('monster');
    expect(sanitized.combatants[0].conditions).toEqual(['poisoned']);
    expect(sanitized.activeCombatantId).toBe('c-1');
    expect(sanitized.activeCombatantIndex).toBe(0);
  });
});

