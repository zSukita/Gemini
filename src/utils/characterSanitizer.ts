import type {
  Character,
  AbilityKey,
  SkillKey,
  SkillProficiency,
  WeaponAttack,
  InventoryItem,
  Spell,
  SpellSlot,
  CharacterFeature,
  CharacterResource,
  Currency,
  HitDice,
  DeathSaves,
  CampaignJournal,
  CampaignNpc,
  Quest,
  SharedLootItem,
} from '../types/dnd5e';
import { ABILITIES, SKILLS } from '../types/dnd5e';
import { createBlankCharacter } from './defaultCharacter';

export interface CharacterValidationResult {
  success: boolean;
  character?: Character;
  error?: string;
  warnings?: string[];
}

/**
 * Sanitiza números garantindo que sejam finitos e estejam dentro dos limites [min, max].
 */
function clampNumber(val: unknown, min: number, max: number, defaultVal: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.trim());
      if (Number.isFinite(parsed) && !Number.isNaN(parsed)) {
        return Math.max(min, Math.min(max, Math.round(parsed)));
      }
    }
    return defaultVal;
  }
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * Sanitiza strings cortando espaços e limitando o tamanho máximo.
 */
function sanitizeString(val: unknown, maxLen: number, defaultVal = ''): string {
  if (typeof val !== 'string') return defaultVal;
  // Remove caracteres nulos ou de controle perigosos
  const clean = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) : clean;
}

/**
 * Valida se uma URL é segura (http, https ou data:image)
 */
function sanitizeAvatarUrl(val: unknown): string | undefined {
  if (typeof val !== 'string' || !val.trim()) return undefined;
  const trimmed = val.trim();
  if (trimmed.length > 50000) return undefined;
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }
  return undefined;
}

const VALID_DIE_TYPES = new Set(['d6', 'd8', 'd10', 'd12']);
const VALID_PROFICIENCIES = new Set(['none', 'proficient', 'expertise']);
const VALID_RESET_TYPES = new Set(['short', 'long', 'manual']);
const VALID_ABILITY_KEYS = new Set(['str', 'dex', 'con', 'int', 'wis', 'cha']);

/**
 * Sanitiza qualquer objeto ou dado recebido (JSON, Firestore, localStorage, P2P)
 * e devolve uma estrutura de Character 100% válida e à prova de quebras no React.
 */
export function sanitizeCharacter(raw: unknown): Character {
  const fallback = createBlankCharacter();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallback;
  }

  const obj = raw as Record<string, any>;

  // 1. Identificação e Metadados Básicos
  const id = sanitizeString(obj.id, 100, `char-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const name = sanitizeString(obj.name, 100, 'Personagem Sem Nome');
  const characterClass = sanitizeString(obj.characterClass, 50, 'Aventureiro');
  const level = clampNumber(obj.level, 1, 30, 1);
  const race = sanitizeString(obj.race, 50, '');
  const background = sanitizeString(obj.background, 50, '');
  const alignment = sanitizeString(obj.alignment, 50, '');
  const experience = clampNumber(obj.experience, 0, 10000000, 0);
  const inspiration = Boolean(obj.inspiration);

  // 2. Combate & Pontos de Vida
  const armorClass = clampNumber(obj.armorClass, 0, 99, 10);
  const speed = clampNumber(obj.speed, 0, 999, 9);
  const initiativeBonus = clampNumber(obj.initiativeBonus, -50, 50, 0);
  const maxHp = clampNumber(obj.maxHp, 1, 9999, 10);
  const currentHp = clampNumber(obj.currentHp, -100, 9999, maxHp);
  const tempHp = clampNumber(obj.tempHp, 0, 9999, 0);

  // Hit Dice
  let hitDice: HitDice = {
    total: level,
    current: level,
    dieType: 'd8',
  };
  if (obj.hitDice && typeof obj.hitDice === 'object') {
    const rawTotal = clampNumber(obj.hitDice.total, 1, 30, level);
    const rawCurrent = clampNumber(obj.hitDice.current, 0, rawTotal, rawTotal);
    const dieType = VALID_DIE_TYPES.has(obj.hitDice.dieType) ? obj.hitDice.dieType : 'd8';
    hitDice = { total: rawTotal, current: rawCurrent, dieType };
  }

  // Death Saves
  let deathSaves: DeathSaves = { successes: 0, failures: 0 };
  if (obj.deathSaves && typeof obj.deathSaves === 'object') {
    deathSaves = {
      successes: clampNumber(obj.deathSaves.successes, 0, 3, 0),
      failures: clampNumber(obj.deathSaves.failures, 0, 3, 0),
    };
  }

  const deathStatus = obj.deathStatus === 'stable' || obj.deathStatus === 'dead' ? obj.deathStatus : undefined;

  // 3. Atributos (Abilities)
  const abilities: Record<AbilityKey, { score: number; saveProficient: boolean }> = {} as any;
  const rawAbilities = obj.abilities && typeof obj.abilities === 'object' ? obj.abilities : {};
  for (const key of Object.keys(ABILITIES) as AbilityKey[]) {
    const abilityData = rawAbilities[key];
    if (abilityData && typeof abilityData === 'object') {
      abilities[key] = {
        score: clampNumber(abilityData.score, 1, 30, 10),
        saveProficient: Boolean(abilityData.saveProficient),
      };
    } else {
      abilities[key] = { score: 10, saveProficient: false };
    }
  }

  // 4. Perícias (Skills)
  const skills: Record<SkillKey, { proficiency: SkillProficiency }> = {} as any;
  const rawSkills = obj.skills && typeof obj.skills === 'object' ? obj.skills : {};
  for (const key of Object.keys(SKILLS) as SkillKey[]) {
    const skillData = rawSkills[key];
    const prof = skillData?.proficiency;
    skills[key] = {
      proficiency: VALID_PROFICIENCIES.has(prof) ? (prof as SkillProficiency) : 'none',
    };
  }

  // 5. Ataques (Weapon Attacks) — Capped em 50 para evitar Denial of Service
  const attacks: WeaponAttack[] = [];
  const rawAttacks = Array.isArray(obj.attacks) ? obj.attacks : [];
  for (const atk of rawAttacks.slice(0, 50)) {
    if (atk && typeof atk === 'object') {
      attacks.push({
        id: sanitizeString(atk.id, 50, `atk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        name: sanitizeString(atk.name, 100, 'Ataque'),
        attackBonus: clampNumber(atk.attackBonus, -50, 50, 0),
        damage: sanitizeString(atk.damage, 50, '1d6'),
        damageType: sanitizeString(atk.damageType, 50, 'Contusão'),
        range: sanitizeString(atk.range, 50, '1,5m'),
        notes: atk.notes ? sanitizeString(atk.notes, 200) : undefined,
      });
    }
  }

  // 6. Inventário — Capped em 200 itens
  const inventory: InventoryItem[] = [];
  const rawInventory = Array.isArray(obj.inventory) ? obj.inventory : [];
  for (const item of rawInventory.slice(0, 200)) {
    if (item && typeof item === 'object') {
      inventory.push({
        id: sanitizeString(item.id, 50, `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        name: sanitizeString(item.name, 100, 'Item'),
        quantity: clampNumber(item.quantity, 0, 99999, 1),
        weight: clampNumber(item.weight, 0, 99999, 0),
        notes: item.notes ? sanitizeString(item.notes, 500) : undefined,
        equipped: Boolean(item.equipped),
      });
    }
  }

  // 7. Moedas (Currency)
  const rawCurrency = obj.currency && typeof obj.currency === 'object' ? obj.currency : {};
  const currency: Currency = {
    cp: clampNumber(rawCurrency.cp, 0, 999999999, 0),
    sp: clampNumber(rawCurrency.sp, 0, 999999999, 0),
    ep: clampNumber(rawCurrency.ep, 0, 999999999, 0),
    gp: clampNumber(rawCurrency.gp, 0, 999999999, 0),
    pp: clampNumber(rawCurrency.pp, 0, 999999999, 0),
  };

  // 8. Magias & Espaços (Spellcasting)
  const rawSpellcasting = obj.spellcasting && typeof obj.spellcasting === 'object' ? obj.spellcasting : {};
  const spellAbility: AbilityKey = VALID_ABILITY_KEYS.has(rawSpellcasting.ability)
    ? rawSpellcasting.ability
    : 'int';
  const spellSaveDcBonus = clampNumber(rawSpellcasting.spellSaveDcBonus, -50, 50, 0);
  const spellAttackBonusMod = clampNumber(rawSpellcasting.spellAttackBonusMod, -50, 50, 0);

  // Espaços de Magia (Círculos 1 a 9)
  const rawSlots = Array.isArray(rawSpellcasting.slots) ? rawSpellcasting.slots : [];
  const slots: SpellSlot[] = [];
  for (let lvl = 1; lvl <= 9; lvl++) {
    const foundSlot = rawSlots.find((s: any) => s && s.level === lvl);
    const maxVal = clampNumber(foundSlot?.max, 0, 99, 0);
    const usedVal = clampNumber(foundSlot?.used, 0, maxVal, 0);
    slots.push({ level: lvl, max: maxVal, used: usedVal });
  }

  // Magias aprendidas/preparadas — Capped em 150
  const spells: Spell[] = [];
  const rawSpells = Array.isArray(rawSpellcasting.spells) ? rawSpellcasting.spells : [];
  for (const sp of rawSpells.slice(0, 150)) {
    if (sp && typeof sp === 'object') {
      spells.push({
        id: sanitizeString(sp.id, 50, `spell-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        name: sanitizeString(sp.name, 100, 'Magia'),
        level: clampNumber(sp.level, 0, 9, 0),
        school: sanitizeString(sp.school, 50, 'Evocação'),
        castingTime: sanitizeString(sp.castingTime, 50, '1 ação'),
        range: sanitizeString(sp.range, 50, '9m'),
        components: sanitizeString(sp.components, 50, 'V, S'),
        duration: sanitizeString(sp.duration, 50, 'Instantânea'),
        description: sanitizeString(sp.description, 2000, ''),
        prepared: Boolean(sp.prepared),
      });
    }
  }

  // 9. Características (Features) — Capped em 100
  const features: CharacterFeature[] = [];
  const rawFeatures = Array.isArray(obj.features) ? obj.features : [];
  for (const ft of rawFeatures.slice(0, 100)) {
    if (ft && typeof ft === 'object') {
      features.push({
        id: sanitizeString(ft.id, 50, `feat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        name: sanitizeString(ft.name, 100, 'Característica'),
        source: sanitizeString(ft.source, 100, 'Geral'),
        description: sanitizeString(ft.description, 2000, ''),
      });
    }
  }

  // 10. Recursos de Classe (Resources) — Capped em 50
  let resources: CharacterResource[] | undefined;
  if (Array.isArray(obj.resources)) {
    resources = [];
    for (const res of obj.resources.slice(0, 50)) {
      if (res && typeof res === 'object') {
        const maxVal = clampNumber(res.max, 1, 9999, 1);
        const curVal = clampNumber(res.current, 0, maxVal, maxVal);
        const resetOn = VALID_RESET_TYPES.has(res.resetOn) ? res.resetOn : 'long';
        resources.push({
          id: sanitizeString(res.id, 50, `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          name: sanitizeString(res.name, 100, 'Recurso'),
          current: curVal,
          max: maxVal,
          resetOn,
          description: res.description ? sanitizeString(res.description, 500) : undefined,
        });
      }
    }
  }

  // 11. Condições Ativas
  let activeConditions: string[] | undefined;
  if (Array.isArray(obj.activeConditions)) {
    activeConditions = obj.activeConditions
      .filter((c: unknown) => typeof c === 'string' && c.trim().length > 0)
      .map((c: string) => sanitizeString(c, 50))
      .slice(0, 30);
  }

  // 12. Diário de Campanha (Journal)
  let journal: CampaignJournal | undefined;
  if (obj.journal && typeof obj.journal === 'object') {
    const npcs: CampaignNpc[] = [];
    if (Array.isArray(obj.journal.npcs)) {
      for (const npc of obj.journal.npcs.slice(0, 100)) {
        if (npc && typeof npc === 'object') {
          npcs.push({
            id: sanitizeString(npc.id, 50, `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            name: sanitizeString(npc.name, 100, 'NPC'),
            role: sanitizeString(npc.role || npc.occupation, 100, ''),
            location: sanitizeString(npc.location, 100, ''),
            notes: sanitizeString(npc.notes, 1000, ''),
            attitude: sanitizeString(npc.attitude || npc.relationship, 50, 'Neutro'),
          });
        }
      }
    }
    const quests: Quest[] = Array.isArray(obj.journal.quests) ? obj.journal.quests.slice(0, 50) : [];
    const sharedLoot: SharedLootItem[] = Array.isArray(obj.journal.sharedLoot) ? obj.journal.sharedLoot.slice(0, 100) : [];
    const loreNotes: string = sanitizeString(obj.journal.loreNotes, 20000, '');
    journal = { quests, npcs, loreNotes, sharedLoot };
  }

  return {
    id,
    name,
    characterClass,
    level,
    race,
    background,
    alignment,
    experience,
    inspiration,

    armorClass,
    speed,
    initiativeBonus,
    maxHp,
    currentHp,
    tempHp,
    hitDice,
    deathSaves,
    deathStatus,

    abilities,
    skills,

    attacks,
    inventory,
    currency,

    spellcasting: {
      ability: spellAbility,
      spellSaveDcBonus,
      spellAttackBonusMod,
      slots,
      spells,
    },

    features,
    proficienciesAndLanguages: sanitizeString(obj.proficienciesAndLanguages, 10000),
    personalityTraits: sanitizeString(obj.personalityTraits, 5000),
    ideals: sanitizeString(obj.ideals, 5000),
    bonds: sanitizeString(obj.bonds, 5000),
    flaws: sanitizeString(obj.flaws, 5000),
    backstory: sanitizeString(obj.backstory, 15000),
    notes: sanitizeString(obj.notes, 15000),

    avatarUrl: sanitizeAvatarUrl(obj.avatarUrl),
    activeConditions,
    journal,
    resources,
    quickActions: Array.isArray(obj.quickActions) ? obj.quickActions.slice(0, 20) : undefined,
  };
}

/**
 * Validador e parser seguro de JSON de ficha de personagem.
 * Detecta JSON truncado, tipos errados, dados inválidos ou não-objetos
 * e fornece mensagens de erro claras sem jogar exceção na UI.
 */
export function parseAndValidateCharacterJson(rawJson: string): CharacterValidationResult {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return {
      success: false,
      error: 'O arquivo ou texto fornecido está vazio.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `JSON corrompido ou truncado: ${errMsg}`,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'O conteúdo JSON precisa ser um objeto de ficha de personagem válido.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Verifica se se parece com uma ficha de personagem D&D 5e
  const hasName = typeof obj.name === 'string' && obj.name.trim().length > 0;
  const hasAbilities = obj.abilities && typeof obj.abilities === 'object';
  const hasClassOrLevel = typeof obj.characterClass === 'string' || typeof obj.level === 'number';

  if (!hasName && !hasAbilities && !hasClassOrLevel) {
    return {
      success: false,
      error: 'O arquivo JSON não possui os campos essenciais de uma ficha de personagem de D&D 5e.',
    };
  }

  const warnings: string[] = [];
  if (!hasName) {
    warnings.push('Nome ausente. Nomeado como "Personagem Importado".');
  }

  const sanitized = sanitizeCharacter(obj);
  return {
    success: true,
    character: sanitized,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
