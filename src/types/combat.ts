import type { AbilityKey } from './dnd5e';

export type ConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export interface ConditionInfo {
  key: ConditionKey;
  name: string;
  description: string;
  color: string;
}

export interface MonsterAction {
  name: string;
  type: 'melee' | 'ranged' | 'spell' | 'special';
  attackBonus?: number;
  damageFormula?: string;
  damageType?: string;
  range?: string;
  description: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface Monster {
  id: string;
  name: string;
  size: 'Miúdo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Imenso' | 'Gargantuesco';
  type: string; // ex: "Humanoide (goblinóide)", "Monstruosidade", "Morto-vivo", "Dragão"
  alignment: string;
  armorClass: number;
  armorType?: string;
  hitPoints: number;
  hitDice: string;
  speed: string;
  abilities: Record<AbilityKey, number>;
  challengeRating: string; // ex: "1/4", "1/2", "1", "5", etc.
  xp: number;
  senses: string;
  languages: string;
  avatarUrl?: string;
  traits?: MonsterTrait[];
  actions: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'npc';
  avatarUrl?: string;
  initiative: number;
  armorClass: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  conditions: ConditionKey[];
  monsterData?: Monster;
  playerId?: string;
  notes?: string;
}

export interface Encounter {
  id: string;
  name: string;
  round: number;
  activeCombatantIndex: number;
  combatants: Combatant[];
  isRunning: boolean;
}

export type SyncMessageType =
  | 'PLAYER_UPDATE'
  | 'PLAYER_INITIATIVE_ROLLED'
  | 'DM_COMBATANT_UPDATE'
  | 'ENCOUNTER_SYNC_REQUEST';

export interface SyncMessage {
  type: SyncMessageType;
  payload: unknown;
  timestamp: number;
}
