import { useState, useEffect, useCallback } from 'react';
import type { Combatant, ConditionKey, Encounter, Monster } from '../types/combat';
import type { Character } from '../types/dnd5e';
import { getAbilityModifier } from '../utils/calculations';
import { rollDie } from '../utils/diceRoller';
import { broadcastSyncMessage, subscribeToSync } from '../utils/syncChannel';

const STORAGE_KEY_ENCOUNTER = 'arcanasheet_encounter_state';

const DEFAULT_ENCOUNTER: Encounter = {
  id: 'encounter-main',
  name: 'Combate Atual',
  round: 1,
  activeCombatantIndex: 0,
  combatants: [],
  isRunning: false,
};

export function useEncounter() {
  const [encounter, setEncounter] = useState<Encounter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENCOUNTER);
      if (saved) {
        return JSON.parse(saved);
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
            c.playerId === payload.playerId
              ? { ...c, initiative: payload.initiative }
              : c
          ),
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Ordenar combatentes por Iniciativa decrescente
  const sortCombatantsByInitiative = useCallback(() => {
    setEncounter((prev) => {
      const sorted = [...prev.combatants].sort((a, b) => b.initiative - a.initiative);
      return {
        ...prev,
        combatants: sorted,
        activeCombatantIndex: 0,
      };
    });
  }, []);

  // Adicionar monstros do bestiário (com opção de múltiplas cópias nomeadas)
  const addMonsterCombatant = (monster: Monster, count = 1) => {
    setEncounter((prev) => {
      const newCombatants: Combatant[] = [];
      const dexMod = getAbilityModifier(monster.abilities.dex);

      for (let i = 1; i <= count; i++) {
        // Se houver mais de um, nomeia como "Goblin 1", "Goblin 2", etc.
        const displayName = count > 1 ? `${monster.name} ${i}` : monster.name;
        const initialInit = rollDie(20) + dexMod;

        newCombatants.push({
          id: `combatant-monster-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name: displayName,
          type: 'monster',
          initiative: initialInit,
          armorClass: monster.armorClass,
          maxHp: monster.hitPoints,
          currentHp: monster.hitPoints,
          tempHp: 0,
          conditions: [],
          monsterData: monster,
        });
      }

      return {
        ...prev,
        combatants: [...prev.combatants, ...newCombatants],
      };
    });
  };

  // Importar personagens salvos do jogador para o combate
  const importPlayerCharacters = (characters: Character[]) => {
    setEncounter((prev) => {
      const existingPlayerIds = new Set(
        prev.combatants.filter((c) => c.playerId).map((c) => c.playerId)
      );

      const toAdd: Combatant[] = characters
        .filter((char) => !existingPlayerIds.has(char.id))
        .map((char) => {
          const dexMod = getAbilityModifier(char.abilities.dex.score);
          const init = dexMod + (char.initiativeBonus || 0);

          return {
            id: `combatant-player-${char.id}`,
            name: char.name,
            type: 'player',
            initiative: init,
            armorClass: char.armorClass,
            maxHp: char.maxHp,
            currentHp: char.currentHp,
            tempHp: char.tempHp,
            conditions: [],
            playerId: char.id,
          };
        });

      return {
        ...prev,
        combatants: [...prev.combatants, ...toAdd],
      };
    });
  };

  // Adicionar Combatente Customizado
  const addCustomCombatant = (combatant: Omit<Combatant, 'id'>) => {
    const newEntry: Combatant = {
      ...combatant,
      id: `combatant-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setEncounter((prev) => ({
      ...prev,
      combatants: [...prev.combatants, newEntry],
    }));
  };

  // Remover combatente
  const removeCombatant = (id: string) => {
    setEncounter((prev) => {
      const filtered = prev.combatants.filter((c) => c.id !== id);
      const newIndex = Math.min(prev.activeCombatantIndex, Math.max(0, filtered.length - 1));
      return {
        ...prev,
        combatants: filtered,
        activeCombatantIndex: newIndex,
      };
    });
  };

  // Rolar iniciativa para todos os monstros
  const rollAllMonstersInitiative = () => {
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

      // Ordena por iniciativa
      updated.sort((a, b) => b.initiative - a.initiative);

      return {
        ...prev,
        combatants: updated,
        activeCombatantIndex: 0,
      };
    });
  };

  // Iniciar combate
  const startEncounter = () => {
    sortCombatantsByInitiative();
    setEncounter((prev) => ({
      ...prev,
      isRunning: true,
      round: 1,
      activeCombatantIndex: 0,
    }));
  };

  // Próximo Turno
  const nextTurn = () => {
    setEncounter((prev) => {
      if (prev.combatants.length === 0) return prev;

      const nextIndex = prev.activeCombatantIndex + 1;
      if (nextIndex >= prev.combatants.length) {
        // Nova rodada!
        return {
          ...prev,
          round: prev.round + 1,
          activeCombatantIndex: 0,
        };
      }
      return {
        ...prev,
        activeCombatantIndex: nextIndex,
      };
    });
  };

  // Turno Anterior
  const previousTurn = () => {
    setEncounter((prev) => {
      if (prev.combatants.length === 0) return prev;

      const prevIndex = prev.activeCombatantIndex - 1;
      if (prevIndex < 0) {
        if (prev.round > 1) {
          return {
            ...prev,
            round: prev.round - 1,
            activeCombatantIndex: prev.combatants.length - 1,
          };
        }
        return prev;
      }
      return {
        ...prev,
        activeCombatantIndex: prevIndex,
      };
    });
  };

  // Ajustar HP do combatente (+ cura / - dano)
  const applyCombatantHpDelta = (id: string, delta: number) => {
    setEncounter((prev) => {
      const target = prev.combatants.find((c) => c.id === id);
      if (!target) return prev;

      let newCurrent = target.currentHp;
      let newTemp = target.tempHp;

      if (delta < 0) {
        // Dano
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
        // Cura
        newCurrent = Math.min(target.maxHp, newCurrent + delta);
      }

      // Se for jogador, notifica a ficha dele em tempo real!
      if (target.playerId) {
        broadcastSyncMessage({
          type: 'DM_COMBATANT_UPDATE',
          payload: {
            playerId: target.playerId,
            currentHp: newCurrent,
            tempHp: newTemp,
          },
        });
      }

      return {
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id === id
            ? { ...c, currentHp: newCurrent, tempHp: newTemp }
            : c
        ),
      };
    });
  };

  // Alternar Condição / Status
  const toggleCombatantCondition = (id: string, condition: ConditionKey) => {
    setEncounter((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) => {
        if (c.id !== id) return c;
        const exists = c.conditions.includes(condition);
        const newConditions = exists
          ? c.conditions.filter((cond) => cond !== condition)
          : [...c.conditions, condition];
        return { ...c, conditions: newConditions };
      }),
    }));
  };

  // Atualizar iniciativa diretamente
  const updateCombatantInitiative = (id: string, initiative: number) => {
    setEncounter((prev) => ({
      ...prev,
      combatants: prev.combatants.map((c) =>
        c.id === id ? { ...c, initiative } : c
      ),
    }));
  };

  // Resetar combate
  const resetEncounter = () => {
    setEncounter({
      ...DEFAULT_ENCOUNTER,
      id: `encounter-${Date.now()}`,
    });
  };

  return {
    encounter,
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
    resetEncounter,
  };
}
