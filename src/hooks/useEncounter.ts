import { useState, useEffect, useCallback } from 'react';
import type { Combatant, ConditionKey, Encounter, Monster } from '../types/combat';
import type { Character } from '../types/dnd5e';
import { getAbilityModifier } from '../utils/calculations';
import { rollDie } from '../utils/diceRoller';
import { broadcastSyncMessage, subscribeToSync } from '../utils/syncChannel';

export const STORAGE_KEY_ENCOUNTER = 'arcanasheet_encounter_state';

export const VALID_CONDITIONS: ConditionKey[] = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
];

export const INCAPACITATING_CONDITIONS: ConditionKey[] = [
  'incapacitated',
  'paralyzed',
  'petrified',
  'stunned',
  'unconscious',
];

export const DEFAULT_ENCOUNTER: Encounter = {
  id: 'encounter-main',
  name: 'Combate Atual',
  round: 1,
  activeCombatantId: undefined,
  activeCombatantIndex: 0,
  combatants: [],
  isRunning: false,
  skipDefeatedMonsters: false,
};

/**
 * Valida e migra com segurança dados antigos ou corrompidos do encontro salvos no navegador.
 */
export function sanitizeEncounter(data: unknown): Encounter {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_ENCOUNTER };
  }
  const obj = data as Record<string, unknown>;

  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : DEFAULT_ENCOUNTER.id;
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : DEFAULT_ENCOUNTER.name;
  const round =
    typeof obj.round === 'number' && Number.isFinite(obj.round) && obj.round >= 1
      ? Math.floor(obj.round)
      : 1;
  const isRunning = Boolean(obj.isRunning);
  const skipDefeatedMonsters = typeof obj.skipDefeatedMonsters === 'boolean' ? obj.skipDefeatedMonsters : false;

  const rawCombatants = Array.isArray(obj.combatants) ? obj.combatants : [];
  const combatants: Combatant[] = [];

  for (let i = 0; i < rawCombatants.length; i++) {
    const raw = rawCombatants[i];
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;

    const cId = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `combatant-${Date.now()}-${i}`;
    const cName = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : `Combatente ${i + 1}`;
    const cType: 'player' | 'monster' | 'npc' =
      c.type === 'player' || c.type === 'monster' || c.type === 'npc' ? c.type : 'monster';
    const maxHp =
      typeof c.maxHp === 'number' && Number.isFinite(c.maxHp) && c.maxHp > 0
        ? Math.floor(c.maxHp)
        : 10;
    const currentHp =
      typeof c.currentHp === 'number' && Number.isFinite(c.currentHp)
        ? Math.max(0, Math.min(maxHp, Math.floor(c.currentHp)))
        : maxHp;
    const tempHp =
      typeof c.tempHp === 'number' && Number.isFinite(c.tempHp)
        ? Math.max(0, Math.floor(c.tempHp))
        : 0;
    const armorClass =
      typeof c.armorClass === 'number' && Number.isFinite(c.armorClass)
        ? Math.max(0, Math.floor(c.armorClass))
        : 10;
    const initiative =
      typeof c.initiative === 'number' && Number.isFinite(c.initiative)
        ? Math.floor(c.initiative)
        : 10;
    const avatarUrl = typeof c.avatarUrl === 'string' ? c.avatarUrl : undefined;
    const playerId = typeof c.playerId === 'string' && c.playerId.trim() ? c.playerId.trim() : undefined;
    const notes = typeof c.notes === 'string' ? c.notes : undefined;

    const rawConditions = Array.isArray(c.conditions) ? c.conditions : [];
    const conditions = rawConditions.filter((cond): cond is ConditionKey =>
      typeof cond === 'string' && VALID_CONDITIONS.includes(cond as ConditionKey)
    );

    const monsterData =
      c.monsterData && typeof c.monsterData === 'object' ? (c.monsterData as Monster) : undefined;

    combatants.push({
      id: cId,
      name: cName,
      type: cType,
      avatarUrl,
      initiative,
      armorClass,
      maxHp,
      currentHp,
      tempHp,
      conditions,
      monsterData,
      playerId,
      notes,
    });
  }

  let activeCombatantId: string | undefined =
    typeof obj.activeCombatantId === 'string' && obj.activeCombatantId ? obj.activeCombatantId : undefined;
  let activeCombatantIndex =
    typeof obj.activeCombatantIndex === 'number' && Number.isFinite(obj.activeCombatantIndex)
      ? Math.floor(obj.activeCombatantIndex)
      : 0;

  if (combatants.length > 0) {
    if (activeCombatantId) {
      const idx = combatants.findIndex((c) => c.id === activeCombatantId);
      if (idx >= 0) {
        activeCombatantIndex = idx;
      } else {
        activeCombatantIndex = Math.max(0, Math.min(activeCombatantIndex, combatants.length - 1));
        activeCombatantId = combatants[activeCombatantIndex].id;
      }
    } else {
      activeCombatantIndex = Math.max(0, Math.min(activeCombatantIndex, combatants.length - 1));
      activeCombatantId = combatants[activeCombatantIndex].id;
    }
  } else {
    activeCombatantIndex = 0;
    activeCombatantId = undefined;
  }

  return {
    id,
    name,
    round,
    activeCombatantId,
    activeCombatantIndex,
    combatants,
    isRunning,
    skipDefeatedMonsters,
    actionLog: Array.isArray(obj.actionLog)
      ? (obj.actionLog as Encounter['actionLog'])?.slice(0, 50)
      : undefined,
    lastHpChange:
      obj.lastHpChange && typeof obj.lastHpChange === 'object'
        ? (obj.lastHpChange as Encounter['lastHpChange'])
        : undefined,
  };
}

/**
 * Ordenação de iniciativa estável e previsível conforme regras do D&D 5e:
 * 1. Iniciativa (decrescente)
 * 2. Destreza (desempate)
 * 3. Jogador antes de monstro
 * 4. ID (ordem estável)
 */
export function sortCombatantsByInitiativeOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    const aDex = a.monsterData?.abilities?.dex ?? (a.type === 'player' ? 12 : 10);
    const bDex = b.monsterData?.abilities?.dex ?? (b.type === 'player' ? 12 : 10);
    if (bDex !== aDex) {
      return bDex - aDex;
    }
    if (a.type !== b.type) {
      if (a.type === 'player') return -1;
      if (b.type === 'player') return 1;
    }
    return a.id.localeCompare(b.id);
  });
}

export function useEncounter() {
  const [encounter, setEncounter] = useState<Encounter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENCOUNTER);
      if (saved) {
        return sanitizeEncounter(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return DEFAULT_ENCOUNTER;
  });

  // Salvar no localStorage sempre que o encontro for alterado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENCOUNTER, JSON.stringify(encounter));
    } catch {
      // ignore
    }
  }, [encounter]);

  // Ouvir atualizações da ficha do jogador em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'PLAYER_UPDATE' && msg.payload) {
        const payload = msg.payload as {
          playerId: string;
          name: string;
          currentHp: number;
          maxHp: number;
          tempHp: number;
          armorClass: number;
        };

        setEncounter((prev) => {
          const hasPlayer = prev.combatants.some((c) => c.playerId === payload.playerId);
          if (!hasPlayer) return prev;

          return {
            ...prev,
            combatants: prev.combatants.map((c) =>
              c.playerId === payload.playerId
                ? {
                    ...c,
                    name: payload.name || c.name,
                    currentHp: payload.currentHp,
                    maxHp: payload.maxHp,
                    tempHp: payload.tempHp,
                    armorClass: payload.armorClass,
                  }
                : c
            ),
          };
        });
      }

      if (msg.type === 'PLAYER_INITIATIVE_ROLLED' && msg.payload) {
        const payload = msg.payload as {
          playerId: string;
          initiative: number;
        };

        setEncounter((prev) => ({
          ...prev,
          combatants: prev.combatants.map((c) =>
            c.playerId === payload.playerId ? { ...c, initiative: payload.initiative } : c
          ),
        }));
      }
    });

    return unsubscribe;
  }, []);

  // D&D 5e: todos os combatentes agem em ordem decrescente de iniciativa.
  const sortCombatantsByInitiative = useCallback(() => {
    setEncounter((prev) => {
      const sorted = sortCombatantsByInitiativeOrder(prev.combatants);
      let activeId = prev.activeCombatantId;
      let activeIndex = 0;
      if (activeId) {
        const found = sorted.findIndex((c) => c.id === activeId);
        if (found >= 0) {
          activeIndex = found;
        } else {
          activeId = sorted[0]?.id;
          activeIndex = 0;
        }
      } else {
        activeId = sorted[0]?.id;
        activeIndex = 0;
      }

      return {
        ...prev,
        combatants: sorted,
        activeCombatantId: activeId,
        activeCombatantIndex: activeIndex,
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor: 'Mestre',
            kind: 'initiative' as const,
            message: `Ordem de iniciativa: ${sorted.map((c) => `${c.name} (${c.initiative})`).join(', ')}.`,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
      };
    });
  }, []);

  // Adicionar monstros do bestiário (com numeração sequencial estável)
  const addMonsterCombatant = useCallback((monster: Monster, count = 1) => {
    setEncounter((prev) => {
      const newCombatants: Combatant[] = [];
      const dexMod = getAbilityModifier(monster.abilities.dex);
      const baseCleanName = monster.name.replace(/\s*\([^)]*\)/g, '').trim();

      const existingSameType = prev.combatants.filter((c) => {
        const cBase = c.name
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*\d+$/, '')
          .trim()
          .toLowerCase();
        return cBase === baseCleanName.toLowerCase();
      });
      const startIdx = existingSameType.length;

      for (let i = 1; i <= count; i++) {
        const num = startIdx + i;
        const displayName = count > 1 || startIdx > 0 ? `${baseCleanName} ${num}` : baseCleanName;
        const initialInit = rollDie(20) + dexMod;

        newCombatants.push({
          id: `combatant-monster-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: displayName,
          type: 'monster',
          avatarUrl: monster.avatarUrl,
          initiative: initialInit,
          armorClass: monster.armorClass,
          maxHp: monster.hitPoints,
          currentHp: monster.hitPoints,
          tempHp: 0,
          conditions: [],
          monsterData: monster,
        });
      }

      const updated = [...prev.combatants, ...newCombatants];
      const activeId = prev.activeCombatantId || updated[0]?.id;
      const activeIndex = activeId ? Math.max(0, updated.findIndex((c) => c.id === activeId)) : 0;

      return {
        ...prev,
        combatants: updated,
        activeCombatantId: activeId,
        activeCombatantIndex: activeIndex,
      };
    });
  }, []);

  // Importar personagens salvos do jogador para o combate
  const importPlayerCharacters = useCallback((characters: Character[]) => {
    setEncounter((prev) => {
      const existingPlayerIds = new Set(
        prev.combatants.filter((c) => c.playerId).map((c) => c.playerId)
      );

      const updatedExisting = prev.combatants.map((c) => {
        if (!c.playerId) return c;
        const matchingChar = characters.find((ch) => ch.id === c.playerId);
        if (!matchingChar) return c;
        return {
          ...c,
          name: matchingChar.name,
          avatarUrl: matchingChar.avatarUrl || c.avatarUrl,
          currentHp: matchingChar.currentHp,
          maxHp: matchingChar.maxHp,
          armorClass: matchingChar.armorClass,
        };
      });

      const toAdd: Combatant[] = characters
        .filter((char) => !existingPlayerIds.has(char.id))
        .map((char) => {
          const dexMod = getAbilityModifier(char.abilities.dex.score);
          const roll = rollDie(20);
          const init = roll + dexMod + (char.initiativeBonus || 0);

          return {
            id: `combatant-player-${char.id}`,
            name: char.name,
            type: 'player',
            avatarUrl: char.avatarUrl,
            initiative: init,
            armorClass: char.armorClass,
            maxHp: char.maxHp,
            currentHp: char.currentHp,
            tempHp: char.tempHp,
            conditions: [],
            playerId: char.id,
          };
        });

      const combined = [...updatedExisting, ...toAdd];
      const activeId = prev.activeCombatantId || combined[0]?.id;
      const activeIndex = activeId ? Math.max(0, combined.findIndex((c) => c.id === activeId)) : 0;

      return {
        ...prev,
        combatants: combined,
        activeCombatantId: activeId,
        activeCombatantIndex: activeIndex,
      };
    });
  }, []);

  // Adicionar Combatente Customizado
  const addCustomCombatant = useCallback((combatant: Omit<Combatant, 'id'>) => {
    setEncounter((prev) => {
      const newEntry: Combatant = {
        ...combatant,
        id: `combatant-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const updated = [...prev.combatants, newEntry];
      const activeId = prev.activeCombatantId || updated[0]?.id;
      const activeIndex = activeId ? Math.max(0, updated.findIndex((c) => c.id === activeId)) : 0;

      return {
        ...prev,
        combatants: updated,
        activeCombatantId: activeId,
        activeCombatantIndex: activeIndex,
      };
    });
  }, []);

  // Remover combatente mantendo a integridade do turno ativo
  const removeCombatant = useCallback((id: string) => {
    setEncounter((prev) => {
      const removingActive =
        prev.activeCombatantId === id || prev.combatants[prev.activeCombatantIndex]?.id === id;
      const oldIndex = prev.combatants.findIndex((c) => c.id === id);
      const filtered = prev.combatants.filter((c) => c.id !== id);

      if (filtered.length === 0) {
        return {
          ...prev,
          combatants: [],
          activeCombatantId: undefined,
          activeCombatantIndex: 0,
        };
      }

      let newActiveId = prev.activeCombatantId;
      let newIndex = prev.activeCombatantIndex;

      if (removingActive) {
        const nextIdx = oldIndex >= filtered.length ? 0 : oldIndex;
        newIndex = nextIdx;
        newActiveId = filtered[nextIdx]?.id;
      } else {
        newIndex = filtered.findIndex((c) => c.id === newActiveId);
        if (newIndex < 0) {
          newIndex = Math.min(prev.activeCombatantIndex, filtered.length - 1);
          newActiveId = filtered[newIndex]?.id;
        }
      }

      return {
        ...prev,
        combatants: filtered,
        activeCombatantId: newActiveId,
        activeCombatantIndex: newIndex,
      };
    });
  }, []);

  // Rolar iniciativa para todos os monstros com ordenação estável
  const rollAllMonstersInitiative = useCallback(() => {
    setEncounter((prev) => {
      const updated = prev.combatants.map((c) => {
        if (c.type === 'monster' && c.monsterData) {
          const dexMod = getAbilityModifier(c.monsterData.abilities.dex);
          return {
            ...c,
            initiative: rollDie(20) + dexMod,
          };
        }
        return c;
      });

      const sorted = sortCombatantsByInitiativeOrder(updated);
      let activeId = prev.activeCombatantId;
      let activeIndex = 0;
      if (activeId) {
        const found = sorted.findIndex((c) => c.id === activeId);
        if (found >= 0) {
          activeIndex = found;
        } else {
          activeId = sorted[0]?.id;
          activeIndex = 0;
        }
      } else {
        activeId = sorted[0]?.id;
        activeIndex = 0;
      }

      return {
        ...prev,
        combatants: sorted,
        activeCombatantId: activeId,
        activeCombatantIndex: activeIndex,
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor: 'Mestre',
            kind: 'initiative' as const,
            message: `Iniciativas roladas: ${sorted
              .filter((c) => c.type === 'monster')
              .map((c) => `${c.name} (${c.initiative})`)
              .join(', ')}.`,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
      };
    });
  }, []);

  // Iniciar combate respeitando a iniciativa rolada por todos os combatentes
  const startEncounter = useCallback(() => {
    setEncounter((prev) => {
      const sorted = sortCombatantsByInitiativeOrder(prev.combatants);
      return {
        ...prev,
        combatants: sorted,
        isRunning: true,
        round: 1,
        activeCombatantId: sorted[0]?.id,
        activeCombatantIndex: 0,
      };
    });
  }, []);

  // Próximo Turno
  const nextTurn = useCallback(() => {
    setEncounter((prev) => {
      if (prev.combatants.length === 0) return prev;

      let currentIndex = prev.activeCombatantId
        ? prev.combatants.findIndex((c) => c.id === prev.activeCombatantId)
        : prev.activeCombatantIndex;
      if (currentIndex < 0 || currentIndex >= prev.combatants.length) currentIndex = 0;

      let nextIndex = currentIndex + 1;
      let nextRound = prev.round;
      if (nextIndex >= prev.combatants.length) {
        nextRound += 1;
        nextIndex = 0;
      }

      // Se configurado para pular monstros derrotados (0 PV), busca a próxima criatura viva.
      // Heróis (jogadores) NUNCA são pulados automaticamente para poderem fazer Salvaguardas de Morte.
      if (prev.skipDefeatedMonsters) {
        let attempts = 0;
        while (
          attempts < prev.combatants.length &&
          prev.combatants[nextIndex].type !== 'player' &&
          prev.combatants[nextIndex].currentHp <= 0
        ) {
          attempts++;
          nextIndex++;
          if (nextIndex >= prev.combatants.length) {
            nextRound += 1;
            nextIndex = 0;
          }
        }
      }

      const nextActor = prev.combatants[nextIndex];
      let notice = '';
      if (nextActor.type === 'player' && nextActor.currentHp <= 0) {
        notice = ' (0 PV — Salvaguarda contra a Morte pendente!)';
      } else if (nextActor.currentHp <= 0) {
        notice = ' (0 PV — Criatura caída/derrotada)';
      }
      const activeIncapacitating = nextActor.conditions.filter((cond) =>
        INCAPACITATING_CONDITIONS.includes(cond)
      );
      if (activeIncapacitating.length > 0) {
        notice += ` [Condições: ${activeIncapacitating.join(', ')} — incapaz de realizar ações/reações]`;
      }

      const isNewRound = nextRound > prev.round;
      const logMessages = isNewRound
        ? [
            {
              id: `log-round-${Date.now()}`,
              timestamp: Date.now(),
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Começou a rodada ${nextRound}.`,
            },
            {
              id: `log-turn-${Date.now()}`,
              timestamp: Date.now() + 1,
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Turno de ${nextActor.name}${notice}.`,
            },
          ]
        : [
            {
              id: `log-turn-${Date.now()}`,
              timestamp: Date.now(),
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Turno de ${nextActor.name}${notice}.`,
            },
          ];

      return {
        ...prev,
        round: nextRound,
        activeCombatantId: nextActor.id,
        activeCombatantIndex: nextIndex,
        actionLog: [...logMessages, ...(prev.actionLog || [])].slice(0, 50),
      };
    });
  }, []);

  // Turno Anterior
  const previousTurn = useCallback(() => {
    setEncounter((prev) => {
      if (prev.combatants.length === 0) return prev;

      let currentIndex = prev.activeCombatantId
        ? prev.combatants.findIndex((c) => c.id === prev.activeCombatantId)
        : prev.activeCombatantIndex;
      if (currentIndex < 0 || currentIndex >= prev.combatants.length) currentIndex = 0;

      let prevIndex = currentIndex - 1;
      let prevRound = prev.round;

      if (prevIndex < 0) {
        if (prevRound > 1) {
          prevRound -= 1;
          prevIndex = prev.combatants.length - 1;
        } else {
          return prev;
        }
      }

      const prevActor = prev.combatants[prevIndex];

      return {
        ...prev,
        round: prevRound,
        activeCombatantId: prevActor.id,
        activeCombatantIndex: prevIndex,
      };
    });
  }, []);

  // Ajustar HP do combatente (+ cura / - dano) com efeitos colaterais ISOLADOS fora do updater React
  const applyCombatantHpDelta = useCallback(
    (
      id: string,
      delta: number,
      actor = 'Mestre',
      options: { critical?: boolean; restore?: boolean } = {}
    ) => {
      let syncPayload: {
        playerId: string;
        currentHp: number;
        tempHp: number;
        damageAmount?: number;
        healingAmount?: number;
        criticalDamage?: boolean;
        restoreHp?: boolean;
      } | null = null;

      setEncounter((prev) => {
        const target = prev.combatants.find((c) => c.id === id);
        if (!target) return prev;

        let newCurrent = target.currentHp;
        let newTemp = target.tempHp;

        if (delta < 0) {
          // Dano: absorve primeiro de PV temporários
          const damageAmount = Math.abs(delta);
          if (newTemp > 0) {
            if (newTemp >= damageAmount) {
              newTemp -= damageAmount;
            } else {
              const rem = damageAmount - newTemp;
              newTemp = 0;
              newCurrent = Math.max(0, newCurrent - rem);
            }
          } else {
            newCurrent = Math.max(0, newCurrent - damageAmount);
          }
        } else {
          // Cura: limitada ao maxHp
          newCurrent = Math.min(target.maxHp, newCurrent + delta);
        }

        if (target.playerId) {
          syncPayload = {
            playerId: target.playerId,
            currentHp: newCurrent,
            tempHp: newTemp,
            ...(options.restore
              ? { restoreHp: true }
              : delta < 0
              ? { damageAmount: Math.abs(delta), criticalDamage: Boolean(options.critical) }
              : delta > 0
              ? { healingAmount: delta }
              : {}),
          };
        }

        return {
          ...prev,
          lastHpChange: {
            combatantId: id,
            currentHp: target.currentHp,
            tempHp: target.tempHp,
            name: target.name,
            actor,
          },
          actionLog: [
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              round: prev.round,
              actor,
              kind: 'hp' as const,
              message: `${target.name}: ${
                delta < 0 ? `${Math.abs(delta)} de dano` : `${delta} PV de cura`
              } (PV ${target.currentHp}→${newCurrent}; temporários ${target.tempHp}→${newTemp}).`,
            },
            ...(prev.actionLog || []),
          ].slice(0, 50),
          combatants: prev.combatants.map((c) =>
            c.id === id ? { ...c, currentHp: newCurrent, tempHp: newTemp } : c
          ),
        };
      });

      // Emissão externa de broadcast (executada exatamente UMA vez, fora do updater de estado)
      if (syncPayload) {
        broadcastSyncMessage({
          type: 'DM_COMBATANT_UPDATE',
          payload: syncPayload,
        });
      }
    },
    []
  );

  const undoLastHpChange = useCallback((actor = 'Mestre') => {
    let syncPayload: {
      playerId: string;
      currentHp: number;
      tempHp: number;
      restoreHp: boolean;
    } | null = null;

    setEncounter((prev) => {
      const change = prev.lastHpChange;
      if (!change) return prev;
      const combatant = prev.combatants.find((item) => item.id === change.combatantId);
      if (!combatant) return { ...prev, lastHpChange: undefined };

      if (combatant.playerId) {
        syncPayload = {
          playerId: combatant.playerId,
          currentHp: change.currentHp,
          tempHp: change.tempHp,
          restoreHp: true,
        };
      }

      return {
        ...prev,
        lastHpChange: undefined,
        combatants: prev.combatants.map((item) =>
          item.id === change.combatantId
            ? { ...item, currentHp: change.currentHp, tempHp: change.tempHp }
            : item
        ),
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor,
            kind: 'hp' as const,
            message: `Correção: PV de ${change.name} restaurados para ${change.currentHp} (temporários: ${change.tempHp}).`,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
      };
    });

    if (syncPayload) {
      broadcastSyncMessage({
        type: 'DM_COMBATANT_UPDATE',
        payload: syncPayload,
      });
    }
  }, []);

  // Alternar Condição / Status
  const toggleCombatantCondition = useCallback((id: string, condition: ConditionKey) => {
    setEncounter((prev) => {
      const target = prev.combatants.find((c) => c.id === id);
      const isRemoving = target?.conditions.includes(condition) || false;
      return {
        ...prev,
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor: 'Mestre',
            kind: 'condition' as const,
            message: `${target?.name || 'Combatente'}: condição ${
              isRemoving ? 'removida' : 'aplicada'
            } (${condition}).`,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
        combatants: prev.combatants.map((c) => {
          if (c.id !== id) return c;
          const exists = c.conditions.includes(condition);
          const newConditions = exists
            ? c.conditions.filter((cond) => cond !== condition)
            : [...c.conditions, condition];
          return { ...c, conditions: newConditions };
        }),
      };
    });
  }, []);

  // Atualizar iniciativa diretamente preservando o activeCombatantId
  const updateCombatantInitiative = useCallback((id: string, initiative: number) => {
    setEncounter((prev) => {
      const updated = prev.combatants.map((c) => (c.id === id ? { ...c, initiative } : c));
      const targetName = prev.combatants.find((c) => c.id === id)?.name || 'Combatente';
      return {
        ...prev,
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor: 'Mestre',
            kind: 'initiative' as const,
            message: `${targetName}: iniciativa ajustada para ${initiative}.`,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
        combatants: updated,
      };
    });
  }, []);

  const recordCombatAction = useCallback(
    (
      message: string,
      kind: 'roll' | 'attack' | 'initiative' | 'condition' = 'roll',
      actor = 'Mestre'
    ) => {
      setEncounter((prev) => ({
        ...prev,
        actionLog: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            round: prev.round,
            actor,
            kind,
            message,
          },
          ...(prev.actionLog || []),
        ].slice(0, 50),
      }));
    },
    []
  );

  // Alternar se monstros derrotados são pulados automaticamente
  const toggleSkipDefeatedMonsters = useCallback(() => {
    setEncounter((prev) => ({
      ...prev,
      skipDefeatedMonsters: !prev.skipDefeatedMonsters,
    }));
  }, []);

  // Resetar combate
  const resetEncounter = useCallback(() => {
    setEncounter({
      ...DEFAULT_ENCOUNTER,
      id: `encounter-${Date.now()}`,
    });
  }, []);

  return {
    encounter,
    setEncounter,
    addMonsterCombatant,
    importPlayerCharacters,
    addCustomCombatant,
    removeCombatant,
    rollAllMonstersInitiative,
    sortCombatantsByInitiative,
    startEncounter,
    nextTurn,
    previousTurn,
    applyCombatantHpDelta,
    toggleCombatantCondition,
    updateCombatantInitiative,
    toggleSkipDefeatedMonsters,
    undoLastHpChange,
    recordCombatAction,
    resetEncounter,
  };
}
