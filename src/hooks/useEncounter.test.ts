// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useEncounter,
  sanitizeEncounter,
  sanitizeMonsterData,
  sanitizeActionLog,
  sanitizeLastHpChange,
  sortCombatantsByInitiativeOrder,
} from './useEncounter';
import type { Combatant } from '../types/combat';

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

  it('garante que IDs duplicados de combatentes sejam tornados estritamente únicos', () => {
    const dataWithDuplicates = {
      id: 'enc-dup',
      round: 1,
      combatants: [
        { id: 'same-id', name: 'Goblin Alpha', currentHp: 10, maxHp: 10 },
        { id: 'same-id', name: 'Goblin Beta', currentHp: 10, maxHp: 10 },
        { id: 'same-id', name: 'Goblin Gamma', currentHp: 10, maxHp: 10 },
      ],
    };

    const sanitized = sanitizeEncounter(dataWithDuplicates);
    expect(sanitized.combatants).toHaveLength(3);
    const ids = sanitized.combatants.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    expect(ids[0]).toBe('same-id');
    expect(ids[1]).toBe('same-id-dup-2');
    expect(ids[2]).toBe('same-id-dup-3');
  });

  it('valida e deduplica condições descartando entradas inválidas', () => {
    const dataWithConditions = {
      id: 'enc-cond',
      round: 1,
      combatants: [
        {
          id: 'c-cond-1',
          name: 'Hero',
          currentHp: 20,
          maxHp: 20,
          conditions: ['poisoned', 'prone', 'poisoned', 'invalid_hack', 'blinded', 'prone'],
        },
      ],
    };

    const sanitized = sanitizeEncounter(dataWithConditions);
    const conditions = sanitized.combatants[0].conditions;
    expect(conditions).toHaveLength(3);
    expect(conditions).toContain('poisoned');
    expect(conditions).toContain('prone');
    expect(conditions).toContain('blinded');
    expect(conditions).not.toContain('invalid_hack');
  });

  it('valida profundamente monsterData e aplica valores padrão seguros quando corrompido', () => {
    const dataWithMonster = {
      id: 'enc-monster',
      round: 1,
      combatants: [
        {
          id: 'c-m1',
          name: 'Ogro Corrompido',
          type: 'monster',
          currentHp: 50,
          maxHp: 50,
          monsterData: {
            id: 'ogre-1',
            name: 'Ogro',
            size: 'TamanhoInvalido',
            armorClass: 9999, // deve ser limitado a 99
            hitPoints: -10,   // deve usar fallback 10
            abilities: {
              str: 100, // deve ser limitado a 30
              dex: -5,  // deve ser limitado a 1
              con: 'invalido', // fallback 10
            },
            actions: [
              {
                name: 'Clava Gigante',
                type: 'tipo_invalido', // fallback 'melee'
                attackBonus: 1000,     // limitado a 50
                damageFormula: '2d8+4',
                description: 'Ataque pesado com clava.',
              },
              null, // deve ser ignorado
            ],
          },
        },
      ],
    };

    const sanitized = sanitizeEncounter(dataWithMonster);
    const m = sanitized.combatants[0].monsterData;
    expect(m).toBeDefined();
    expect(m?.size).toBe('Médio');
    expect(m?.armorClass).toBe(99);
    expect(m?.hitPoints).toBe(10);
    expect(m?.abilities.str).toBe(30);
    expect(m?.abilities.dex).toBe(1);
    expect(m?.abilities.con).toBe(10);
    expect(m?.actions).toHaveLength(1);
    expect(m?.actions[0].type).toBe('melee');
    expect(m?.actions[0].attackBonus).toBe(50);
  });

  it('valida actionLog descartando mensagens vazias e tipos de ação inválidos', () => {
    const dataWithLog = {
      id: 'enc-log',
      round: 2,
      actionLog: [
        { id: 'l1', timestamp: 1000, round: 1, actor: 'Eldrin', message: 'Atacou com espada', kind: 'attack' },
        { id: 'l2', message: '', kind: 'hp' }, // Vazio: deve ser descartado
        { id: 'l3', timestamp: 2000, round: 2, actor: 'Thorin', message: 'Curou 10 PV', kind: 'invalido' }, // kind fallback para roll
        null, // deve ser descartado
      ],
      combatants: [{ id: 'c1', name: 'Hero', currentHp: 10, maxHp: 10 }],
    };

    const sanitized = sanitizeEncounter(dataWithLog);
    expect(sanitized.actionLog).toHaveLength(2);
    expect(sanitized.actionLog?.[0].id).toBe('l1');
    expect(sanitized.actionLog?.[0].kind).toBe('attack');
    expect(sanitized.actionLog?.[1].id).toBe('l3');
    expect(sanitized.actionLog?.[1].kind).toBe('roll');
  });

  it('valida lastHpChange contra combatente existente e descarta quando combatente não existir', () => {
    // Caso 1: combatente existe na lista
    const validHpChangeData = {
      id: 'enc-hp-1',
      round: 1,
      combatants: [{ id: 'hero-1', name: 'Eldrin', currentHp: 15, maxHp: 20 }],
      lastHpChange: {
        combatantId: 'hero-1',
        currentHp: 15,
        tempHp: 0,
        name: 'Eldrin',
        actor: 'Mestre',
      },
    };

    const sanitizedValid = sanitizeEncounter(validHpChangeData);
    expect(sanitizedValid.lastHpChange).toBeDefined();
    expect(sanitizedValid.lastHpChange?.combatantId).toBe('hero-1');
    expect(sanitizedValid.lastHpChange?.currentHp).toBe(15);

    // Caso 2: combatente NÃO existe na lista -> lastHpChange deve ser descartado com segurança
    const invalidHpChangeData = {
      id: 'enc-hp-2',
      round: 1,
      combatants: [{ id: 'hero-1', name: 'Eldrin', currentHp: 15, maxHp: 20 }],
      lastHpChange: {
        combatantId: 'combatente-inexistente-ghost',
        currentHp: 5,
        tempHp: 0,
        name: 'Fantasma',
        actor: 'Inimigo',
      },
    };

    const sanitizedInvalid = sanitizeEncounter(invalidHpChangeData);
    expect(sanitizedInvalid.lastHpChange).toBeUndefined();
  });

  it('garante coerência entre activeCombatantId e activeCombatantIndex quando combatente é removido', () => {
    const dataWithRemovedActive = {
      id: 'enc-idx',
      round: 2,
      activeCombatantId: 'removed-combatant-999',
      activeCombatantIndex: 5,
      combatants: [
        { id: 'c-1', name: 'Alpha', currentHp: 10, maxHp: 10 },
        { id: 'c-2', name: 'Beta', currentHp: 10, maxHp: 10 },
      ],
    };

    const sanitized = sanitizeEncounter(dataWithRemovedActive);
    // Deve reajustar activeCombatantIndex para dentro dos limites [0, 1] e apontar activeCombatantId para o combatente correto
    expect(sanitized.activeCombatantIndex).toBe(1);
    expect(sanitized.activeCombatantId).toBe('c-2');
  });

  it('aplica limites de segurança contra payloads excessivos de combatentes e logs de ação', () => {
    const hugeCombatants = Array.from({ length: 150 }, (_, i) => ({
      id: `c-excessive-${i}`,
      name: `Monstro ${i}`,
      currentHp: 10,
      maxHp: 10,
    }));

    const hugeLogs = Array.from({ length: 80 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: Date.now(),
      round: 1,
      actor: 'Actor',
      message: `Ação ${i}`,
      kind: 'roll',
    }));

    const sanitized = sanitizeEncounter({
      id: 'enc-huge',
      round: 1,
      combatants: hugeCombatants,
      actionLog: hugeLogs,
    });

    expect(sanitized.combatants.length).toBeLessThanOrEqual(100);
  });

  describe('funções utilitárias de sanitização profunda', () => {
    it('sanitizeMonsterData retorna undefined para entradas nulas ou não-objeto', () => {
      expect(sanitizeMonsterData(null)).toBeUndefined();
      expect(sanitizeMonsterData('invalid')).toBeUndefined();
      expect(sanitizeMonsterData(123)).toBeUndefined();
    });

    it('sanitizeActionLog retorna undefined para entradas não-array', () => {
      expect(sanitizeActionLog(null)).toBeUndefined();
      expect(sanitizeActionLog({})).toBeUndefined();
    });

    it('sanitizeLastHpChange retorna undefined para entradas nulas ou valores inválidos', () => {
      expect(sanitizeLastHpChange(null, [])).toBeUndefined();
      expect(sanitizeLastHpChange({ combatantId: '' }, [])).toBeUndefined();
      expect(sanitizeLastHpChange({ combatantId: 'c1', currentHp: 'invalido' }, [{ id: 'c1' } as any])).toBeUndefined();
    });
  });

  describe('sortCombatantsByInitiativeOrder', () => {
    it('ordena por total de iniciativa decrescente (Critério 1)', () => {
      const combatants: Combatant[] = [
        {
          id: 'c1',
          name: 'Baixo',
          type: 'player',
          initiative: 5,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'c2',
          name: 'Alto',
          type: 'player',
          initiative: 22,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'c3',
          name: 'Médio',
          type: 'monster',
          initiative: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
      ];

      const sorted = sortCombatantsByInitiativeOrder(combatants);
      expect(sorted.map((c) => c.name)).toEqual(['Alto', 'Médio', 'Baixo']);
    });

    it('desempata pela Destreza efetiva quando as iniciativas são iguais (Critério 2)', () => {
      const combatants: Combatant[] = [
        {
          id: 'c-dex10',
          name: 'Destreza 10',
          type: 'player',
          initiative: 15,
          dexterity: 10,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'c-dex18',
          name: 'Destreza 18',
          type: 'player',
          initiative: 15,
          dexterity: 18,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'c-dex14',
          name: 'Destreza 14',
          type: 'monster',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
      ];

      const sorted = sortCombatantsByInitiativeOrder(combatants);
      expect(sorted.map((c) => c.name)).toEqual(['Destreza 18', 'Destreza 14', 'Destreza 10']);
    });

    it('desempata pelo tipo (jogador antes de monstro) quando iniciativa e destreza são iguais (Critério 3)', () => {
      const combatants: Combatant[] = [
        {
          id: 'monster-a',
          name: 'Monstro Empatado',
          type: 'monster',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'player-a',
          name: 'Jogador Empatado',
          type: 'player',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
      ];

      const sorted = sortCombatantsByInitiativeOrder(combatants);
      expect(sorted[0].name).toBe('Jogador Empatado');
      expect(sorted[1].name).toBe('Monstro Empatado');
    });

    it('desempata deterministicamente por ID estável quando todos os outros critérios empatam (Critério 4)', () => {
      const combatants: Combatant[] = [
        {
          id: 'z-combatant',
          name: 'Combatente Z',
          type: 'player',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'a-combatant',
          name: 'Combatente A',
          type: 'player',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
        {
          id: 'm-combatant',
          name: 'Combatente M',
          type: 'player',
          initiative: 15,
          dexterity: 14,
          armorClass: 10,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          conditions: [],
        },
      ];

      const sorted = sortCombatantsByInitiativeOrder(combatants);
      expect(sorted.map((c) => c.id)).toEqual(['a-combatant', 'm-combatant', 'z-combatant']);
    });

    it('é idempotente: reordenar uma lista já ordenada preserva exatamente a mesma ordem', () => {
      const combatants: Combatant[] = [
        { id: 'c1', name: 'Alpha', type: 'player', initiative: 18, dexterity: 14, armorClass: 10, maxHp: 10, currentHp: 10, tempHp: 0, conditions: [] },
        { id: 'c2', name: 'Beta', type: 'monster', initiative: 18, dexterity: 14, armorClass: 10, maxHp: 10, currentHp: 10, tempHp: 0, conditions: [] },
        { id: 'c3', name: 'Gamma', type: 'monster', initiative: 12, dexterity: 16, armorClass: 10, maxHp: 10, currentHp: 10, tempHp: 0, conditions: [] },
        { id: 'c4', name: 'Delta', type: 'player', initiative: 12, dexterity: 12, armorClass: 10, maxHp: 10, currentHp: 10, tempHp: 0, conditions: [] },
      ];

      const sortedOnce = sortCombatantsByInitiativeOrder(combatants);
      const sortedTwice = sortCombatantsByInitiativeOrder(sortedOnce);
      const sortedThrice = sortCombatantsByInitiativeOrder(sortedTwice);

      expect(sortedTwice.map((c) => c.id)).toEqual(sortedOnce.map((c) => c.id));
      expect(sortedThrice.map((c) => c.id)).toEqual(sortedOnce.map((c) => c.id));
    });
  });

  describe('comportamento de 0 PV e nextTurn', () => {
    it('avança rodadas a cada turno quando há exatamente um combatente', () => {
      const { result } = renderHook(() => useEncounter());

      act(() => {
        result.current.addCustomCombatant({
          name: 'Guerreiro Solitário',
          type: 'player',
          initiative: 15,
          armorClass: 16,
          maxHp: 20,
          currentHp: 20,
          tempHp: 0,
          conditions: [],
        });
        result.current.startEncounter();
      });

      expect(result.current.encounter.round).toBe(1);
      expect(result.current.encounter.activeCombatantIndex).toBe(0);

      act(() => {
        result.current.nextTurn();
      });
      expect(result.current.encounter.round).toBe(2);
      expect(result.current.encounter.activeCombatantIndex).toBe(0);

      act(() => {
        result.current.nextTurn();
      });
      expect(result.current.encounter.round).toBe(3);
      expect(result.current.encounter.activeCombatantIndex).toBe(0);
    });

    it('registra aviso para salvaguarda de morte quando combatente único está com 0 PV', () => {
      const { result } = renderHook(() => useEncounter());

      act(() => {
        result.current.addCustomCombatant({
          name: 'Hero Caído',
          type: 'player',
          initiative: 15,
          armorClass: 14,
          maxHp: 20,
          currentHp: 0,
          tempHp: 0,
          conditions: ['unconscious'],
        });
        result.current.startEncounter();
      });

      act(() => {
        result.current.nextTurn();
      });

      expect(result.current.encounter.round).toBe(2);
      const logsCombined = result.current.encounter.actionLog?.map((l) => l.message).join(' ') || '';
      expect(logsCombined).toContain('Salvaguarda contra a Morte pendente');
      expect(logsCombined).toContain('incapaz de realizar ações/reações');
    });

    it('pula múltiplos monstros derrotados em sequência e incrementa a rodada apenas uma vez na virada', () => {
      const { result } = renderHook(() => useEncounter());

      act(() => {
        // Combatente 0: Jogador A (vivo)
        result.current.addCustomCombatant({
          name: 'Jogador A',
          type: 'player',
          initiative: 25,
          armorClass: 15,
          maxHp: 20,
          currentHp: 20,
          tempHp: 0,
          conditions: [],
        });
        // Combatente 1: Monstro 1 (morto)
        result.current.addCustomCombatant({
          name: 'Monstro 1',
          type: 'monster',
          initiative: 20,
          armorClass: 12,
          maxHp: 15,
          currentHp: 0,
          tempHp: 0,
          conditions: [],
        });
        // Combatente 2: Monstro 2 (morto)
        result.current.addCustomCombatant({
          name: 'Monstro 2',
          type: 'monster',
          initiative: 15,
          armorClass: 12,
          maxHp: 15,
          currentHp: 0,
          tempHp: 0,
          conditions: [],
        });
        // Combatente 3: Jogador B (vivo)
        result.current.addCustomCombatant({
          name: 'Jogador B',
          type: 'player',
          initiative: 10,
          armorClass: 14,
          maxHp: 18,
          currentHp: 18,
          tempHp: 0,
          conditions: [],
        });
      });

      // Ativa skipDefeatedMonsters
      act(() => {
        result.current.toggleSkipDefeatedMonsters();
      });
      expect(result.current.encounter.skipDefeatedMonsters).toBe(true);

      act(() => {
        result.current.startEncounter();
      });

      expect(result.current.encounter.round).toBe(1);
      expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Jogador A');

      // Avança turno: deve pular Monstro 1 e Monstro 2 e ir diretamente para Jogador B (ainda na rodada 1)
      act(() => {
        result.current.nextTurn();
      });

      expect(result.current.encounter.round).toBe(1);
      expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Jogador B');

      // Avança turno: de Jogador B, deve pular o fim da lista e os monstros caídos, retornando a Jogador A
      // A rodada deve avançar para 2 (exatamente um incremento de rodada)
      act(() => {
        result.current.nextTurn();
      });

      expect(result.current.encounter.round).toBe(2);
      expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Jogador A');
    });

    it('NÃO pula monstros derrotados quando skipDefeatedMonsters estiver desativado', () => {
      const { result } = renderHook(() => useEncounter());

      act(() => {
        result.current.addCustomCombatant({
          name: 'Herói',
          type: 'player',
          initiative: 20,
          armorClass: 15,
          maxHp: 20,
          currentHp: 20,
          tempHp: 0,
          conditions: [],
        });
        result.current.addCustomCombatant({
          name: 'Goblin Morto',
          type: 'monster',
          initiative: 10,
          armorClass: 12,
          maxHp: 7,
          currentHp: 0, // Derrotado
          tempHp: 0,
          conditions: [],
        });
        result.current.startEncounter();
      });

      expect(result.current.encounter.skipDefeatedMonsters).toBe(false);
      expect(result.current.encounter.activeCombatantIndex).toBe(0);

      // Com skipDefeatedMonsters = false, o turno de Goblin Morto não é pulado
      act(() => {
        result.current.nextTurn();
      });

      expect(result.current.encounter.activeCombatantIndex).toBe(1);
      expect(result.current.encounter.combatants[1].name).toBe('Goblin Morto');
      expect(result.current.encounter.actionLog?.[0].message).toContain('Criatura caída/derrotada');

      // Alterna a opção para true e no próximo ciclo o monstro derrotado é pulado
      act(() => {
        result.current.toggleSkipDefeatedMonsters();
      });
      expect(result.current.encounter.skipDefeatedMonsters).toBe(true);

      // Avança para o Herói (rodada 2)
      act(() => {
        result.current.nextTurn();
      });
      expect(result.current.encounter.round).toBe(2);
      expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Herói');

      // Agora que skipDefeatedMonsters está true, ao avançar turno deve pular Goblin Morto e continuar no Herói (rodada 3)
      act(() => {
        result.current.nextTurn();
      });
      expect(result.current.encounter.round).toBe(3);
      expect(result.current.encounter.combatants[result.current.encounter.activeCombatantIndex].name).toBe('Herói');
    });

    it('jogadores a 0 PV NUNCA são pulados, mesmo com skipDefeatedMonsters ativo', () => {
      const { result } = renderHook(() => useEncounter());

      act(() => {
        result.current.addCustomCombatant({
          name: 'Orc Guerreiro',
          type: 'monster',
          initiative: 20,
          armorClass: 13,
          maxHp: 15,
          currentHp: 15,
          tempHp: 0,
          conditions: [],
        });
        result.current.addCustomCombatant({
          name: 'Mago Caído',
          type: 'player',
          initiative: 10,
          armorClass: 12,
          maxHp: 14,
          currentHp: 0, // 0 PV!
          tempHp: 0,
          conditions: ['unconscious'],
        });
        result.current.toggleSkipDefeatedMonsters(); // true
        result.current.startEncounter();
      });

      expect(result.current.encounter.skipDefeatedMonsters).toBe(true);

      // Avança o turno: deve ir para o Mago Caído, permitindo sua salvaguarda de morte
      act(() => {
        result.current.nextTurn();
      });

      expect(result.current.encounter.activeCombatantIndex).toBe(1);
      expect(result.current.encounter.combatants[1].name).toBe('Mago Caído');
      expect(result.current.encounter.actionLog?.[0].message).toContain('Salvaguarda contra a Morte pendente');
    });
  });
});

