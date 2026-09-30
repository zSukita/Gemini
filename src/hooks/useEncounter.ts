import { useState, useEffect, useCallback } from 'react';
import type { Combatant, ConditionKey, Encounter, Monster, MonsterAction, MonsterTrait, CombatLogEntry } from '../types/combat';
import type { Character, AbilityKey } from '../types/dnd5e';
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

export const MAX_ENCOUNTER_COMBATANTS = 100;
export const MAX_ACTION_LOG_ENTRIES = 50;

export const VALID_ACTION_LOG_KINDS: CombatLogEntry['kind'][] = [
  'turn',
  'hp',
  'condition',
  'initiative',
  'roll',
  'attack',
];

export const VALID_MONSTER_SIZES: Monster['size'][] = [
  'Miúdo',
  'Pequeno',
  'Médio',
  'Grande',
  'Enorme',
  'Imenso',
  'Gargantuesco',
];

export const VALID_MONSTER_ACTION_TYPES: MonsterAction['type'][] = [
  'melee',
  'ranged',
  'spell',
  'special',
];

/**
 * Valida e sanitiza profundamente dados de monstros (MonsterData),
 * garantindo propriedades tipadas, limites seguros e valores padrão.
 */
export function sanitizeMonsterData(raw: unknown): Monster | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim().slice(0, 80) : `monster-${Date.now()}`;
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 100) : 'Monstro';
  const size: Monster['size'] =
    typeof obj.size === 'string' && VALID_MONSTER_SIZES.includes(obj.size as Monster['size'])
      ? (obj.size as Monster['size'])
      : 'Médio';
  const type = typeof obj.type === 'string' && obj.type.trim() ? obj.type.trim().slice(0, 80) : 'Monstro';
  const alignment = typeof obj.alignment === 'string' && obj.alignment.trim() ? obj.alignment.trim().slice(0, 80) : 'Neutro';
  const armorClass =
    typeof obj.armorClass === 'number' && Number.isFinite(obj.armorClass)
      ? Math.max(0, Math.min(99, Math.floor(obj.armorClass)))
      : 10;
  const armorType =
    typeof obj.armorType === 'string' && obj.armorType.trim() ? obj.armorType.trim().slice(0, 50) : undefined;
  const hitPoints =
    typeof obj.hitPoints === 'number' && Number.isFinite(obj.hitPoints) && obj.hitPoints > 0
      ? Math.min(99999, Math.floor(obj.hitPoints))
      : 10;
  const hitDice = typeof obj.hitDice === 'string' && obj.hitDice.trim() ? obj.hitDice.trim().slice(0, 30) : '1d8';
  const speed = typeof obj.speed === 'string' && obj.speed.trim() ? obj.speed.trim().slice(0, 80) : '9m';

  const rawAbilities = (obj.abilities && typeof obj.abilities === 'object' ? obj.abilities : {}) as Record<string, unknown>;
  const abilities: Record<AbilityKey, number> = {
    str: typeof rawAbilities.str === 'number' && Number.isFinite(rawAbilities.str) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.str))) : 10,
    dex: typeof rawAbilities.dex === 'number' && Number.isFinite(rawAbilities.dex) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.dex))) : 10,
    con: typeof rawAbilities.con === 'number' && Number.isFinite(rawAbilities.con) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.con))) : 10,
    int: typeof rawAbilities.int === 'number' && Number.isFinite(rawAbilities.int) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.int))) : 10,
    wis: typeof rawAbilities.wis === 'number' && Number.isFinite(rawAbilities.wis) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.wis))) : 10,
    cha: typeof rawAbilities.cha === 'number' && Number.isFinite(rawAbilities.cha) ? Math.max(1, Math.min(30, Math.floor(rawAbilities.cha))) : 10,
  };

  const challengeRating =
    typeof obj.challengeRating === 'string' && obj.challengeRating.trim() ? obj.challengeRating.trim().slice(0, 10) : '1';
  const xp = typeof obj.xp === 'number' && Number.isFinite(obj.xp) && obj.xp >= 0 ? Math.min(1000000, Math.floor(obj.xp)) : 10;
  const senses = typeof obj.senses === 'string' ? obj.senses.slice(0, 200) : '';
  const languages = typeof obj.languages === 'string' ? obj.languages.slice(0, 200) : '';

  let avatarUrl: string | undefined = undefined;
  if (typeof obj.avatarUrl === 'string' && obj.avatarUrl.length <= 2000) {
    if (/^(https?:\/\/|data:image\/)/i.test(obj.avatarUrl)) {
      avatarUrl = obj.avatarUrl;
    }
  }

  const rawTraits = Array.isArray(obj.traits) ? obj.traits.slice(0, 20) : [];
  const traits: MonsterTrait[] = [];
  for (const t of rawTraits) {
    if (!t || typeof t !== 'object') continue;
    const tName = typeof (t as any).name === 'string' ? (t as any).name.slice(0, 80).trim() : '';
    const tDesc = typeof (t as any).description === 'string' ? (t as any).description.slice(0, 1000).trim() : '';
    if (tName || tDesc) {
      traits.push({ name: tName || 'Traço', description: tDesc });
    }
  }

  const sanitizeActions = (actionsRaw: unknown, maxCount = 20): MonsterAction[] => {
    if (!Array.isArray(actionsRaw)) return [];
    const list: MonsterAction[] = [];
    for (const a of actionsRaw.slice(0, maxCount)) {
      if (!a || typeof a !== 'object') continue;
      const aName = typeof (a as any).name === 'string' ? (a as any).name.slice(0, 80).trim() : 'Ação';
      const aType: MonsterAction['type'] =
        typeof (a as any).type === 'string' && VALID_MONSTER_ACTION_TYPES.includes((a as any).type)
          ? (a as any).type
          : 'melee';
      const aDesc = typeof (a as any).description === 'string' ? (a as any).description.slice(0, 1000).trim() : '';
      const aBonus =
        typeof (a as any).attackBonus === 'number' && Number.isFinite((a as any).attackBonus)
          ? Math.max(-20, Math.min(50, Math.floor((a as any).attackBonus)))
          : undefined;
      const aFormula =
        typeof (a as any).damageFormula === 'string' && (a as any).damageFormula.trim()
          ? (a as any).damageFormula.trim().slice(0, 40)
          : undefined;
      const aDmgType =
        typeof (a as any).damageType === 'string' && (a as any).damageType.trim()
          ? (a as any).damageType.trim().slice(0, 40)
          : undefined;
      const aRange =
        typeof (a as any).range === 'string' && (a as any).range.trim()
          ? (a as any).range.trim().slice(0, 40)
          : undefined;

      list.push({
        name: aName,
        type: aType,
        description: aDesc,
        attackBonus: aBonus,
        damageFormula: aFormula,
        damageType: aDmgType,
        range: aRange,
      });
    }
    return list;
  };

  const actions = sanitizeActions(obj.actions, 20);
  const reactions = obj.reactions ? sanitizeActions(obj.reactions, 10) : undefined;
  const legendaryActions = obj.legendaryActions ? sanitizeActions(obj.legendaryActions, 10) : undefined;

  return {
    id,
    name,
    size,
    type,
    alignment,
    armorClass,
    armorType,
    hitPoints,
    hitDice,
    speed,
    abilities,
    challengeRating,
    xp,
    senses,
    languages,
    avatarUrl,
    traits: traits.length > 0 ? traits : undefined,
    actions,
    reactions: reactions && reactions.length > 0 ? reactions : undefined,
    legendaryActions: legendaryActions && legendaryActions.length > 0 ? legendaryActions : undefined,
  };
}

/**
 * Valida individualmente entradas do histórico de combate (actionLog).
 */
export function sanitizeActionLog(raw: unknown): CombatLogEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const validEntries: CombatLogEntry[] = [];
  const safeList = raw.slice(0, MAX_ACTION_LOG_ENTRIES);

  for (let idx = 0; idx < safeList.length; idx++) {
    const entry = safeList[idx];
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;

    const message = typeof e.message === 'string' ? e.message.trim().slice(0, 500) : '';
    if (!message) continue;

    const id = typeof e.id === 'string' && e.id.trim() ? e.id.trim().slice(0, 80) : `log-${Date.now()}-${idx}`;
    const timestamp =
      typeof e.timestamp === 'number' && Number.isFinite(e.timestamp) && e.timestamp > 0
        ? e.timestamp
        : Date.now();
    const round =
      typeof e.round === 'number' && Number.isFinite(e.round) && e.round >= 1
        ? Math.min(10000, Math.floor(e.round))
        : 1;
    const actor = typeof e.actor === 'string' && e.actor.trim() ? e.actor.trim().slice(0, 100) : 'Desconhecido';
    const kind: CombatLogEntry['kind'] =
      typeof e.kind === 'string' && VALID_ACTION_LOG_KINDS.includes(e.kind as CombatLogEntry['kind'])
        ? (e.kind as CombatLogEntry['kind'])
        : 'roll';

    validEntries.push({
      id,
      timestamp,
      round,
      actor,
      message,
      kind,
    });
  }

  return validEntries.length > 0 ? validEntries : undefined;
}

/**
 * Valida lastHpChange contra os combatentes sanitizados, conferindo tipos, limites e integridade.
 */
export function sanitizeLastHpChange(
  raw: unknown,
  combatants: Combatant[]
): Encounter['lastHpChange'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.combatantId !== 'string' || !obj.combatantId.trim()) return undefined;
  const combatantId = obj.combatantId.trim();

  // Valide lastHpChange contra um combatente existente na lista
  const targetCombatant = combatants.find((c) => c.id === combatantId);
  if (!targetCombatant) {
    return undefined; // Descarte se o combatente não existe na lista sanitizada
  }

  if (typeof obj.currentHp !== 'number' || !Number.isFinite(obj.currentHp)) return undefined;
  if (typeof obj.tempHp !== 'number' || !Number.isFinite(obj.tempHp)) return undefined;

  const currentHp = Math.max(0, Math.min(targetCombatant.maxHp, Math.floor(obj.currentHp)));
  const tempHp = Math.max(0, Math.min(99999, Math.floor(obj.tempHp)));
  const name =
    typeof obj.name === 'string' && obj.name.trim()
      ? obj.name.trim().slice(0, 100)
      : targetCombatant.name;
  const actor =
    typeof obj.actor === 'string' && obj.actor.trim()
      ? obj.actor.trim().slice(0, 100)
      : 'Desconhecido';

  return {
    combatantId,
    currentHp,
    tempHp,
    name,
    actor,
  };
}

/**
 * Valida profundamente e migra com segurança todo o estado de Encounter.
 * Garante IDs únicos, limites coerentes em PV/CA/Iniciativa, sanitização
 * de condições, monsterData, actionLog, lastHpChange e coerência de índices.
 */
export function sanitizeEncounter(data: unknown): Encounter {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_ENCOUNTER, combatants: [] };
  }
  const obj = data as Record<string, unknown>;

  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim().slice(0, 80) : DEFAULT_ENCOUNTER.id;
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 100) : DEFAULT_ENCOUNTER.name;
  const round =
    typeof obj.round === 'number' && Number.isFinite(obj.round) && obj.round >= 1
      ? Math.min(10000, Math.floor(obj.round))
      : 1;
  const isRunning = Boolean(obj.isRunning);
  const skipDefeatedMonsters = typeof obj.skipDefeatedMonsters === 'boolean' ? obj.skipDefeatedMonsters : false;

  const rawCombatants = Array.isArray(obj.combatants) ? obj.combatants.slice(0, MAX_ENCOUNTER_COMBATANTS) : [];
  const combatants: Combatant[] = [];
  const seenCombatantIds = new Set<string>();

  for (let i = 0; i < rawCombatants.length; i++) {
    const raw = rawCombatants[i];
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;

    // IDs únicos: Se o ID for duplicado, vazio ou inválido, gera um ID único seguro
    let cId = typeof c.id === 'string' && c.id.trim() ? c.id.trim().slice(0, 80) : `combatant-${Date.now()}-${i}`;
    if (seenCombatantIds.has(cId)) {
      cId = `${cId}-dup-${i + 1}`;
    }
    seenCombatantIds.add(cId);

    const cName = typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 100) : `Combatente ${i + 1}`;
    const cType: 'player' | 'monster' | 'npc' =
      c.type === 'player' || c.type === 'monster' || c.type === 'npc' ? c.type : 'monster';

    const maxHp =
      typeof c.maxHp === 'number' && Number.isFinite(c.maxHp) && c.maxHp > 0
        ? Math.min(99999, Math.floor(c.maxHp))
        : 10;
    const currentHp =
      typeof c.currentHp === 'number' && Number.isFinite(c.currentHp)
        ? Math.max(0, Math.min(maxHp, Math.floor(c.currentHp)))
        : maxHp;
    const tempHp =
      typeof c.tempHp === 'number' && Number.isFinite(c.tempHp) && c.tempHp >= 0
        ? Math.min(99999, Math.floor(c.tempHp))
        : 0;
    const armorClass =
      typeof c.armorClass === 'number' && Number.isFinite(c.armorClass)
        ? Math.max(0, Math.min(99, Math.floor(c.armorClass)))
        : 10;
    const initiative =
      typeof c.initiative === 'number' && Number.isFinite(c.initiative)
        ? Math.max(-50, Math.min(100, Math.floor(c.initiative)))
        : 10;

    let avatarUrl: string | undefined = undefined;
    if (typeof c.avatarUrl === 'string' && c.avatarUrl.length <= 2000) {
      if (/^(https?:\/\/|data:image\/)/i.test(c.avatarUrl)) {
        avatarUrl = c.avatarUrl;
      }
    }

    const playerId = typeof c.playerId === 'string' && c.playerId.trim() ? c.playerId.trim().slice(0, 80) : undefined;
    const notes = typeof c.notes === 'string' ? c.notes.slice(0, 2000) : undefined;

    // Condições: validar contra VALID_CONDITIONS e descartar duplicatas/inválidas
    const rawConditions = Array.isArray(c.conditions) ? c.conditions : [];
    const conditionSet = new Set<ConditionKey>();
    for (const cond of rawConditions) {
      if (typeof cond === 'string' && VALID_CONDITIONS.includes(cond as ConditionKey)) {
        conditionSet.add(cond as ConditionKey);
      }
    }
    const conditions = Array.from(conditionSet);

    // Validação profunda de monsterData (não apenas cast)
    const monsterData = sanitizeMonsterData(c.monsterData);

    const dexterity =
      typeof c.dexterity === 'number' && Number.isFinite(c.dexterity)
        ? Math.max(1, Math.min(30, Math.floor(c.dexterity)))
        : typeof monsterData?.abilities?.dex === 'number' && Number.isFinite(monsterData.abilities.dex)
        ? Math.max(1, Math.min(30, Math.floor(monsterData.abilities.dex)))
        : undefined;

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
      dexterity,
    });
  }

  // Coerência estrita de activeCombatantId e activeCombatantIndex
  let activeCombatantId: string | undefined =
    typeof obj.activeCombatantId === 'string' && obj.activeCombatantId ? obj.activeCombatantId.trim() : undefined;
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

  const actionLog = sanitizeActionLog(obj.actionLog);
  const lastHpChange = sanitizeLastHpChange(obj.lastHpChange, combatants);

  return {
    id,
    name,
    round,
    activeCombatantId,
    activeCombatantIndex,
    combatants,
    isRunning,
    skipDefeatedMonsters,
    actionLog,
    lastHpChange,
  };
}

/**
 * Ordenação de iniciativa estável e previsível conforme regras do D&D 5e:
 * 1. Total de Iniciativa (decrescente): O combatente com maior iniciativa total age primeiro.
 *    (A iniciativa salva no combatente já inclui d20 rolado, modificador de Destreza e bônus de iniciativa;
 *    portanto, bônus de iniciativa NÃO é reaplicado como critério avulso para evitar dupla contagem).
 * 2. Destreza Efetiva (desempate D&D 5e): Em empate de iniciativa, maior Destreza desempata
 *    (campo dexterity do combatente ou monsterData.abilities.dex, com valor neutro padrão 10).
 * 3. Prioridade de Tipo: Em empate de iniciativa e Destreza, jogadores têm prioridade sobre monstros/NPCs.
 * 4. Identificador Único Estável (ID): Desempate determinístico via localeCompare no ID do combatente,
 *    garantindo que ordenações sucessivas da mesma lista sejam 100% estáveis e idempotentes.
 */
export function sortCombatantsByInitiativeOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => {
    // 1. Iniciativa total decrescente
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    // 2. Destreza efetiva (desempate oficial D&D 5e)
    const aDex = a.dexterity ?? a.monsterData?.abilities?.dex ?? 10;
    const bDex = b.dexterity ?? b.monsterData?.abilities?.dex ?? 10;
    if (bDex !== aDex) {
      return bDex - aDex;
    }
    // 3. Jogador age antes de monstro ou NPC
    if (a.type !== b.type) {
      if (a.type === 'player') return -1;
      if (b.type === 'player') return 1;
    }
    // 4. Critério estável e determinístico por ID único
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
                    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim().slice(0, 100) : c.name,
                    maxHp:
                      typeof payload.maxHp === 'number' && Number.isFinite(payload.maxHp) && payload.maxHp > 0
                        ? Math.min(99999, Math.floor(payload.maxHp))
                        : c.maxHp,
                    currentHp:
                      typeof payload.currentHp === 'number' && Number.isFinite(payload.currentHp)
                        ? Math.max(0, Math.min(payload.maxHp || c.maxHp, Math.floor(payload.currentHp)))
                        : Math.min(c.currentHp, c.maxHp),
                    tempHp:
                      typeof payload.tempHp === 'number' && Number.isFinite(payload.tempHp) && payload.tempHp >= 0
                        ? Math.min(99999, Math.floor(payload.tempHp))
                        : c.tempHp,
                    armorClass:
                      typeof payload.armorClass === 'number' && Number.isFinite(payload.armorClass)
                        ? Math.max(0, Math.min(99, Math.floor(payload.armorClass)))
                        : c.armorClass,
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
            c.playerId === payload.playerId && typeof payload.initiative === 'number' && Number.isFinite(payload.initiative)
              ? { ...c, initiative: Math.max(-50, Math.min(100, Math.floor(payload.initiative))) }
              : c
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
          dexterity: monster.abilities?.dex ?? 10,
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
          dexterity: matchingChar.abilities.dex.score,
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
            dexterity: char.abilities.dex.score,
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
        dexterity: combatant.dexterity ?? combatant.monsterData?.abilities?.dex ?? 10,
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

      // Se há exatamente 1 combatente: completa a rodada e avança de turno
      if (prev.combatants.length === 1) {
        const actor = prev.combatants[0];
        const nextRound = prev.round + 1;
        let notice = '';
        if (actor.type === 'player' && actor.currentHp <= 0) {
          notice = ' (0 PV — Salvaguarda contra a Morte pendente!)';
        } else if (actor.currentHp <= 0) {
          notice = ' (0 PV — Criatura caída/derrotada)';
        }
        const activeIncapacitating = actor.conditions.filter((cond) =>
          INCAPACITATING_CONDITIONS.includes(cond)
        );
        if (activeIncapacitating.length > 0) {
          notice += ` [Condições: ${activeIncapacitating.join(', ')} — incapaz de realizar ações/reações]`;
        }

        return {
          ...prev,
          round: nextRound,
          activeCombatantId: actor.id,
          activeCombatantIndex: 0,
          actionLog: [
            {
              id: `log-round-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Começou a rodada ${nextRound}.`,
            },
            {
              id: `log-turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now() + 1,
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Turno de ${actor.name}${notice}.`,
            },
            ...(prev.actionLog || []),
          ].slice(0, 50),
        };
      }

      let currentIndex = prev.activeCombatantId
        ? prev.combatants.findIndex((c) => c.id === prev.activeCombatantId)
        : prev.activeCombatantIndex;
      if (currentIndex < 0 || currentIndex >= prev.combatants.length) currentIndex = 0;

      // Encontra o próximo índice na ordem de iniciativa.
      // Se skipDefeatedMonsters estiver ativo, monstros derrotados (<= 0 PV) são pulados.
      // Jogadores com 0 PV NUNCA são pulados para que possam realizar Salvaguardas de Morte.
      let targetIndex = (currentIndex + 1) % prev.combatants.length;
      let crossedRoundBoundary = (currentIndex + 1) >= prev.combatants.length;

      if (prev.skipDefeatedMonsters) {
        let found = false;
        for (let step = 0; step < prev.combatants.length; step++) {
          const idx = (currentIndex + 1 + step) % prev.combatants.length;
          if (step > 0 && idx === 0) {
            crossedRoundBoundary = true;
          }
          const candidate = prev.combatants[idx];
          // Heróis (jogadores) nunca são pulados. Monstros só entram se tiverem PV > 0.
          if (candidate.type === 'player' || candidate.currentHp > 0) {
            targetIndex = idx;
            found = true;
            break;
          }
        }
        // Se todas as criaturas da lista forem monstros derrotados, avança sequencialmente
        // sem incrementar rodadas múltiplas.
        if (!found) {
          targetIndex = (currentIndex + 1) % prev.combatants.length;
          crossedRoundBoundary = (currentIndex + 1) >= prev.combatants.length;
        }
      }

      const nextRound = crossedRoundBoundary ? prev.round + 1 : prev.round;
      const nextActor = prev.combatants[targetIndex];

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
              id: `log-round-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Começou a rodada ${nextRound}.`,
            },
            {
              id: `log-turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now() + 1,
              round: nextRound,
              actor: 'Mestre',
              kind: 'turn' as const,
              message: `Turno de ${nextActor.name}${notice}.`,
            },
          ]
        : [
            {
              id: `log-turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
        activeCombatantIndex: targetIndex,
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
