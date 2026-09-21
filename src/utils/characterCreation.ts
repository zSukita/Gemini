import type {
  Character,
  AbilityKey,
  SkillKey,
  WeaponAttack,
  InventoryItem,
  CharacterFeature,
} from '../types/dnd5e';
import { getAbilityModifier } from './calculations';
import { SRD_CLASSES, type SrdClassDefinition } from '../data/srdClasses';
import { SRD_RACES, type SrdRaceDefinition } from '../data/srdRaces';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export interface Dice4d6Result {
  rolls: [number, number, number, number];
  droppedIndex: number;
  total: number;
}

/**
 * Rola 4d6 e descarta o menor resultado (Método Oficial D&D 5e para atributos).
 */
export function roll4d6DropLowest(): Dice4d6Result {
  const rolls: [number, number, number, number] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];

  let minVal = rolls[0];
  let minIdx = 0;
  for (let i = 1; i < 4; i++) {
    if (rolls[i] < minVal) {
      minVal = rolls[i];
      minIdx = i;
    }
  }

  const sum = rolls.reduce((acc, val, i) => (i === minIdx ? acc : acc + val), 0);

  return {
    rolls,
    droppedIndex: minIdx,
    total: sum,
  };
}

export interface CharacterWizardData {
  name: string;
  classId: string;
  raceId: string;
  background: string;
  alignment: string;
  baseAbilities: Record<AbilityKey, number>;
  selectedSkills?: SkillKey[];
}

/**
 * Constrói uma ficha de personagem D&D 5e completa e calibrada a partir
 * das escolhas feitas no Assistente (Wizard).
 */
export function buildCharacterFromWizard(data: CharacterWizardData): Character {
  const charClass: SrdClassDefinition =
    SRD_CLASSES.find((c) => c.id === data.classId) || SRD_CLASSES[4]; // Default: Guerreiro

  const charRace: SrdRaceDefinition =
    SRD_RACES.find((r) => r.id === data.raceId) || SRD_RACES[0]; // Default: Humano

  // 1. Aplica os bônus raciais aos atributos base
  const finalAbilities: Record<AbilityKey, { score: number; saveProficient: boolean }> = {
    str: {
      score: (data.baseAbilities.str || 10) + (charRace.abilityBonuses.str || 0),
      saveProficient: charClass.savingThrows.includes('str'),
    },
    dex: {
      score: (data.baseAbilities.dex || 10) + (charRace.abilityBonuses.dex || 0),
      saveProficient: charClass.savingThrows.includes('dex'),
    },
    con: {
      score: (data.baseAbilities.con || 10) + (charRace.abilityBonuses.con || 0),
      saveProficient: charClass.savingThrows.includes('con'),
    },
    int: {
      score: (data.baseAbilities.int || 10) + (charRace.abilityBonuses.int || 0),
      saveProficient: charClass.savingThrows.includes('int'),
    },
    wis: {
      score: (data.baseAbilities.wis || 10) + (charRace.abilityBonuses.wis || 0),
      saveProficient: charClass.savingThrows.includes('wis'),
    },
    cha: {
      score: (data.baseAbilities.cha || 10) + (charRace.abilityBonuses.cha || 0),
      saveProficient: charClass.savingThrows.includes('cha'),
    },
  };

  const conMod = getAbilityModifier(finalAbilities.con.score);
  const dexMod = getAbilityModifier(finalAbilities.dex.score);
  const strMod = getAbilityModifier(finalAbilities.str.score);

  // 2. PV Inicial = Máximo do Dado de Vida + Modificador de CON (mínimo 1)
  const maxHp = Math.max(1, charClass.hitDieValue + conMod);

  // 3. Classe de Armadura Base
  let armorClass = 10 + dexMod;
  if (charClass.id === 'barbarian') {
    armorClass = 10 + dexMod + conMod; // Defesa sem armadura de Bárbaro
  } else if (charClass.id === 'monk') {
    const wisMod = getAbilityModifier(finalAbilities.wis.score);
    armorClass = 10 + dexMod + wisMod; // Defesa sem armadura de Monge
  } else if (charClass.id === 'fighter' || charClass.id === 'paladin') {
    armorClass = 16 + 2; // Cota de Malha (16) + Escudo (+2)
  } else if (charClass.id === 'cleric') {
    armorClass = 14 + Math.min(2, Math.max(0, dexMod)) + 2; // Brunea + Escudo
  } else if (charClass.id === 'rogue' || charClass.id === 'bard' || charClass.id === 'warlock') {
    armorClass = 11 + dexMod; // Couro leve
  }

  // 4. Perícias iniciais
  const profSkills = data.selectedSkills && data.selectedSkills.length > 0
    ? data.selectedSkills
    : charClass.suggestedSkills.slice(0, 4);

  // Adiciona Percepção se for Elfo
  if (charRace.id === 'elf' && !profSkills.includes('perception')) {
    profSkills.push('perception');
  }
  // Adiciona Intimidação se for Meio-Orc
  if (charRace.id === 'half-orc' && !profSkills.includes('intimidation')) {
    profSkills.push('intimidation');
  }

  const allSkills: Character['skills'] = {
    acrobatics: { proficiency: profSkills.includes('acrobatics') ? 'proficient' : 'none' },
    animal_handling: { proficiency: profSkills.includes('animal_handling') ? 'proficient' : 'none' },
    arcana: { proficiency: profSkills.includes('arcana') ? 'proficient' : 'none' },
    athletics: { proficiency: profSkills.includes('athletics') ? 'proficient' : 'none' },
    deception: { proficiency: profSkills.includes('deception') ? 'proficient' : 'none' },
    history: { proficiency: profSkills.includes('history') ? 'proficient' : 'none' },
    insight: { proficiency: profSkills.includes('insight') ? 'proficient' : 'none' },
    intimidation: { proficiency: profSkills.includes('intimidation') ? 'proficient' : 'none' },
    investigation: { proficiency: profSkills.includes('investigation') ? 'proficient' : 'none' },
    medicine: { proficiency: profSkills.includes('medicine') ? 'proficient' : 'none' },
    nature: { proficiency: profSkills.includes('nature') ? 'proficient' : 'none' },
    perception: { proficiency: profSkills.includes('perception') ? 'proficient' : 'none' },
    performance: { proficiency: profSkills.includes('performance') ? 'proficient' : 'none' },
    persuasion: { proficiency: profSkills.includes('persuasion') ? 'proficient' : 'none' },
    religion: { proficiency: profSkills.includes('religion') ? 'proficient' : 'none' },
    sleight_of_hand: { proficiency: profSkills.includes('sleight_of_hand') ? 'proficient' : 'none' },
    stealth: { proficiency: profSkills.includes('stealth') ? 'proficient' : 'none' },
    survival: { proficiency: profSkills.includes('survival') ? 'proficient' : 'none' },
  };

  // 5. Características & Habilidades (Classe + Raça)
  const features: CharacterFeature[] = [
    ...charRace.traits.map((t) => ({
      id: `trait-${Math.random().toString(36).substr(2, 6)}`,
      name: t.name,
      source: `Raça: ${charRace.name}`,
      description: t.description,
    })),
    ...charClass.features.map((f) => ({
      id: `feat-${Math.random().toString(36).substr(2, 6)}`,
      name: f.name,
      source: `Classe: ${charClass.name} Nvl 1`,
      description: f.description,
    })),
  ];

  // 6. Armas e Ataques Iniciais
  const attacks: WeaponAttack[] = charClass.startingEquipment
    .filter((eq) => eq.damage)
    .map((eq, i) => {
      // Ajusta bônus de ataque (+2 proficiência + mod atributo)
      const usesDex = eq.name.includes('Arco') || eq.name.includes('Besta') || eq.name.includes('Rapieira') || eq.name.includes('Adaga') || eq.name.includes('Curta');
      const mod = usesDex ? dexMod : strMod;
      const attackBonus = 2 + mod;

      let damageFormula = eq.damage || '1d6';
      if (damageFormula.includes('+ FOR')) {
        damageFormula = damageFormula.replace('+ FOR', strMod >= 0 ? `+ ${strMod}` : `- ${Math.abs(strMod)}`);
      } else if (damageFormula.includes('+ DES')) {
        damageFormula = damageFormula.replace('+ DES', dexMod >= 0 ? `+ ${dexMod}` : `- ${Math.abs(dexMod)}`);
      } else if (!damageFormula.includes('+') && !damageFormula.includes('-')) {
        damageFormula = `${damageFormula} ${mod >= 0 ? `+ ${mod}` : `- ${Math.abs(mod)}`}`;
      }

      return {
        id: `atk-${Date.now()}-${i}`,
        name: eq.name,
        attackBonus,
        damage: damageFormula,
        damageType: eq.damageType || 'Dano',
        range: eq.range || 'Corpo a corpo 1,5m',
        notes: eq.notes || '',
      };
    });

  // 7. Inventário Inicial
  const inventory: InventoryItem[] = [
    ...charClass.startingEquipment.map((eq, i) => ({
      id: `item-${Date.now()}-${i}`,
      name: eq.name,
      quantity: eq.quantity || 1,
      weight: 1.5,
      notes: eq.notes || '',
      equipped: true,
    })),
    {
      id: `item-${Date.now()}-pack`,
      name: 'Mochila de Aventureiro',
      quantity: 1,
      weight: 5,
      notes: 'Saco de dormir, rações (10 dias), tochas (10), pederneira e cantil',
      equipped: false,
    },
  ];

  // 8. Espaços de Magia (se conjurador de 1º nível)
  const isCaster = Boolean(charClass.spellcastingAbility);
  const casterAbility = charClass.spellcastingAbility || 'int';

  return {
    id: `char-${Date.now()}`,
    name: data.name.trim() || 'Aventureiro Sem Nome',
    characterClass: charClass.name,
    level: 1,
    race: charRace.name,
    background: data.background.trim() || 'Aventureiro',
    alignment: data.alignment.trim() || 'Neutro e Bom',
    experience: 0,
    inspiration: false,

    armorClass,
    speed: charRace.speed,
    initiativeBonus: 0,
    maxHp,
    currentHp: maxHp,
    tempHp: 0,
    hitDice: {
      total: 1,
      current: 1,
      dieType: charClass.hitDie,
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },

    abilities: finalAbilities,
    skills: allSkills,
    attacks,
    inventory,
    currency: {
      cp: 0,
      sp: 0,
      ep: 0,
      gp: 15,
      pp: 0,
    },

    spellcasting: {
      ability: casterAbility,
      spellSaveDcBonus: 0,
      spellAttackBonusMod: 0,
      slots: [
        { level: 1, max: isCaster ? 2 : 0, used: 0 },
        { level: 2, max: 0, used: 0 },
        { level: 3, max: 0, used: 0 },
        { level: 4, max: 0, used: 0 },
        { level: 5, max: 0, used: 0 },
        { level: 6, max: 0, used: 0 },
        { level: 7, max: 0, used: 0 },
        { level: 8, max: 0, used: 0 },
        { level: 9, max: 0, used: 0 },
      ],
      spells: [],
    },

    features,
    proficienciesAndLanguages: `Armaduras: ${charClass.armorProficiencies}.\nArmas: ${charClass.weaponProficiencies}.\nIdiomas: ${charRace.languages.join(', ')}.`,
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    notes: `Personagem criado via Assistente D&D 5e.\nVisão no Escuro: ${charRace.darkvision > 0 ? `${charRace.darkvision} metros` : 'Nenhuma'}.\nTamanho: ${charRace.size}.`,
  };
}
