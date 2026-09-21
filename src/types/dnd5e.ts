export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityDefinition {
  key: AbilityKey;
  name: string;
  abbr: string;
}

export const ABILITIES: Record<AbilityKey, AbilityDefinition> = {
  str: { key: 'str', name: 'Força', abbr: 'FOR' },
  dex: { key: 'dex', name: 'Destreza', abbr: 'DES' },
  con: { key: 'con', name: 'Constituição', abbr: 'CON' },
  int: { key: 'int', name: 'Inteligência', abbr: 'INT' },
  wis: { key: 'wis', name: 'Sabedoria', abbr: 'SAB' },
  cha: { key: 'cha', name: 'Carisma', abbr: 'CAR' },
};

export type SkillProficiency = 'none' | 'proficient' | 'expertise';

export type SkillKey =
  | 'acrobatics'
  | 'animal_handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight_of_hand'
  | 'stealth'
  | 'survival';

export interface SkillDefinition {
  key: SkillKey;
  name: string;
  ability: AbilityKey;
}

export const SKILLS: Record<SkillKey, SkillDefinition> = {
  acrobatics: { key: 'acrobatics', name: 'Acrobacia', ability: 'dex' },
  animal_handling: { key: 'animal_handling', name: 'Adestrar Animais', ability: 'wis' },
  arcana: { key: 'arcana', name: 'Arcanismo', ability: 'int' },
  athletics: { key: 'athletics', name: 'Atletismo', ability: 'str' },
  deception: { key: 'deception', name: 'Enganação', ability: 'cha' },
  history: { key: 'history', name: 'História', ability: 'int' },
  insight: { key: 'insight', name: 'Intuição', ability: 'wis' },
  intimidation: { key: 'intimidation', name: 'Intimidação', ability: 'cha' },
  investigation: { key: 'investigation', name: 'Investigação', ability: 'int' },
  medicine: { key: 'medicine', name: 'Medicina', ability: 'wis' },
  nature: { key: 'nature', name: 'Natureza', ability: 'int' },
  perception: { key: 'perception', name: 'Percepção', ability: 'wis' },
  performance: { key: 'performance', name: 'Atuação', ability: 'cha' },
  persuasion: { key: 'persuasion', name: 'Persuasão', ability: 'cha' },
  religion: { key: 'religion', name: 'Religião', ability: 'int' },
  sleight_of_hand: { key: 'sleight_of_hand', name: 'Prestidigitação', ability: 'dex' },
  stealth: { key: 'stealth', name: 'Furtividade', ability: 'dex' },
  survival: { key: 'survival', name: 'Sobrevivência', ability: 'wis' },
};

export interface HitDice {
  total: number;
  current: number;
  dieType: 'd6' | 'd8' | 'd10' | 'd12';
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface WeaponAttack {
  id: string;
  name: string;
  attackBonus: number;
  damage: string; // ex: "1d8 + 3"
  damageType: string; // ex: "Cortante", "Perfurante"
  range: string; // ex: "Corpo a corpo 1,5m" ou "9m / 36m"
  notes?: string;
}

export interface SpellSlot {
  level: number;
  max: number;
  used: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = Truque (Cantrip), 1 a 9 = Círculo
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // kg
  notes?: string;
  equipped?: boolean;
}

export interface Currency {
  cp: number; // Cobre
  sp: number; // Prata
  ep: number; // Electro
  gp: number; // Ouro
  pp: number; // Platina
}

export interface CharacterFeature {
  id: string;
  name: string;
  source: string; // ex: "Raça", "Guerreiro Nvl 1"
  description: string;
}

export interface Character {
  id: string;
  name: string;
  characterClass: string;
  level: number;
  race: string;
  background: string;
  alignment: string;
  experience: number;
  inspiration: boolean;

  // Defesas & Combate
  armorClass: number;
  speed: number;
  initiativeBonus: number; // bônus extra além de DES
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDice: HitDice;
  deathSaves: DeathSaves;

  // Atributos base
  abilities: Record<AbilityKey, { score: number; saveProficient: boolean }>;

  // Perícias
  skills: Record<SkillKey, { proficiency: SkillProficiency }>;

  // Ataques & Equipamentos
  attacks: WeaponAttack[];
  inventory: InventoryItem[];
  currency: Currency;

  // Conjuração de Magias
  spellcasting: {
    ability: AbilityKey;
    spellSaveDcBonus: number;
    spellAttackBonusMod: number;
    slots: SpellSlot[];
    spells: Spell[];
  };

  // Características, Habilidades & Anotações
  features: CharacterFeature[];
  proficienciesAndLanguages: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  notes: string;

  // Avatar, Condições Ativas, Recursos de Classe e Diário de Campanha
  avatarUrl?: string;
  activeConditions?: string[];
  journal?: CampaignJournal;
  quickActions?: QuickAction[];
  resources?: CharacterResource[];
}

export type ResourceResetType = 'short' | 'long' | 'manual';

export interface CharacterResource {
  id: string;
  name: string;
  current: number;
  max: number;
  resetOn: ResourceResetType;
  description?: string;
}

export type QuestStatus = 'active' | 'completed' | 'failed';

export interface QuestObjective {
  id: string;
  text: string;
  done: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward?: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  updatedAt: string;
}

export interface CampaignNpc {
  id: string;
  name: string;
  role: string;
  location: string;
  notes: string;
  attitude?: string;
}

export interface SharedLootItem {
  id: string;
  name: string;
  quantity: number;
  value: string;
  notes?: string;
}

export interface CampaignJournal {
  quests: Quest[];
  npcs: CampaignNpc[];
  loreNotes: string;
  sharedLoot: SharedLootItem[];
}

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export interface DiceRollResult {
  id: string;
  label: string;
  dieType: string;
  rolls: number[];
  selectedRoll: number;
  modifier: number;
  total: number;
  advantageMode: AdvantageMode;
  isCriticalSuccess?: boolean;
  isCriticalFailure?: boolean;
  isSecret?: boolean;
  breakdown: string;
  timestamp: string;
}

export type ThemeId = 'default' | 'parchment' | 'crimson' | 'arcane';

export interface QuickAction {
  id: string;
  name: string;
  type: 'attack' | 'spell' | 'initiative' | 'hitdie' | 'custom';
  bonus?: number;
  damageFormula?: string;
  spellLevel?: number;
  subtitle?: string;
}

