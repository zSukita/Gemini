import type { Character } from '../types/dnd5e';

export function createBlankCharacter(): Character {
  return {
    id: `char-${Date.now()}`,
    name: '',
    characterClass: '',
    level: 1,
    race: '',
    background: '',
    alignment: '',
    experience: 0,
    inspiration: false,

    armorClass: 10,
    speed: 9,
    initiativeBonus: 0,
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDice: {
      total: 1,
      current: 1,
      dieType: 'd8',
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },

    abilities: {
      str: { score: 10, saveProficient: false },
      dex: { score: 10, saveProficient: false },
      con: { score: 10, saveProficient: false },
      int: { score: 10, saveProficient: false },
      wis: { score: 10, saveProficient: false },
      cha: { score: 10, saveProficient: false },
    },

    skills: {
      acrobatics: { proficiency: 'none' },
      animal_handling: { proficiency: 'none' },
      arcana: { proficiency: 'none' },
      athletics: { proficiency: 'none' },
      deception: { proficiency: 'none' },
      history: { proficiency: 'none' },
      insight: { proficiency: 'none' },
      intimidation: { proficiency: 'none' },
      investigation: { proficiency: 'none' },
      medicine: { proficiency: 'none' },
      nature: { proficiency: 'none' },
      perception: { proficiency: 'none' },
      performance: { proficiency: 'none' },
      persuasion: { proficiency: 'none' },
      religion: { proficiency: 'none' },
      sleight_of_hand: { proficiency: 'none' },
      stealth: { proficiency: 'none' },
      survival: { proficiency: 'none' },
    },

    attacks: [],
    inventory: [],
    currency: {
      cp: 0,
      sp: 0,
      ep: 0,
      gp: 0,
      pp: 0,
    },

    spellcasting: {
      ability: 'int',
      spellSaveDcBonus: 0,
      spellAttackBonusMod: 0,
      slots: [
        { level: 1, max: 0, used: 0 },
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

    features: [],
    proficienciesAndLanguages: '',
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    notes: '',
  };
}

export function createEmptyCharacter(): Character {
  return {
    id: `char-${Date.now()}`,
    name: 'Novo Herói',
    characterClass: 'Guerreiro',
    level: 1,
    race: 'Humano',
    background: 'Soldado',
    alignment: 'Neutro e Bom',
    experience: 0,
    inspiration: false,

    armorClass: 16,
    speed: 9,
    initiativeBonus: 0,
    maxHp: 12,
    currentHp: 12,
    tempHp: 0,
    hitDice: {
      total: 1,
      current: 1,
      dieType: 'd10',
    },
    deathSaves: {
      successes: 0,
      failures: 0,
    },

    abilities: {
      str: { score: 16, saveProficient: true },
      dex: { score: 12, saveProficient: false },
      con: { score: 14, saveProficient: true },
      int: { score: 10, saveProficient: false },
      wis: { score: 12, saveProficient: false },
      cha: { score: 8, saveProficient: false },
    },

    skills: {
      acrobatics: { proficiency: 'none' },
      animal_handling: { proficiency: 'none' },
      arcana: { proficiency: 'none' },
      athletics: { proficiency: 'proficient' },
      deception: { proficiency: 'none' },
      history: { proficiency: 'none' },
      insight: { proficiency: 'none' },
      intimidation: { proficiency: 'proficient' },
      investigation: { proficiency: 'none' },
      medicine: { proficiency: 'none' },
      nature: { proficiency: 'none' },
      perception: { proficiency: 'proficient' },
      performance: { proficiency: 'none' },
      persuasion: { proficiency: 'none' },
      religion: { proficiency: 'none' },
      sleight_of_hand: { proficiency: 'none' },
      stealth: { proficiency: 'none' },
      survival: { proficiency: 'proficient' },
    },

    attacks: [
      {
        id: 'atk-1',
        name: 'Espada Longa',
        attackBonus: 5,
        damage: '1d8 + 3',
        damageType: 'Cortante',
        range: 'Corpo a corpo (1,5m)',
        notes: 'Versátil (1d10)'
      },
      {
        id: 'atk-2',
        name: 'Besta Pesada',
        attackBonus: 3,
        damage: '1d10 + 1',
        damageType: 'Perfurante',
        range: '30m / 120m',
        notes: 'Munição, Recarga, Duas Mãos'
      }
    ],

    inventory: [
      { id: 'item-1', name: 'Cota de Malha', quantity: 1, weight: 25, equipped: true },
      { id: 'item-2', name: 'Escudo', quantity: 1, weight: 3, equipped: true },
      { id: 'item-3', name: 'Mochila de Aventureiro', quantity: 1, weight: 5 },
      { id: 'item-4', name: 'Tochas', quantity: 5, weight: 2.5 },
      { id: 'item-5', name: 'Rações de Viagem', quantity: 10, weight: 5 },
      { id: 'item-6', name: 'Poção de Cura', quantity: 2, weight: 0.5, notes: 'Cura 2d4 + 2 HP' }
    ],

    currency: {
      cp: 24,
      sp: 18,
      ep: 0,
      gp: 45,
      pp: 0,
    },

    spellcasting: {
      ability: 'int',
      spellSaveDcBonus: 0,
      spellAttackBonusMod: 0,
      slots: [
        { level: 1, max: 0, used: 0 },
        { level: 2, max: 0, used: 0 },
        { level: 3, max: 0, used: 0 },
        { level: 4, max: 0, used: 0 },
        { level: 5, max: 0, used: 0 },
        { level: 6, max: 0, used: 0 },
        { level: 7, max: 0, used: 0 },
        { level: 8, max: 0, used: 0 },
        { level: 9, max: 0, used: 0 },
      ],
      spells: []
    },

    features: [
      {
        id: 'feat-1',
        name: 'Estilo de Luta: Defesa',
        source: 'Guerreiro 1',
        description: 'Enquanto estiver usando armadura, você ganha +1 de bônus na CA.'
      },
      {
        id: 'feat-2',
        name: 'Retomar o Fôlego (Second Wind)',
        source: 'Guerreiro 1',
        description: 'Em seu turno, você pode usar uma Ação Bônus para recuperar 1d10 + seu nível de guerreiro de PV (1x por descanso curto ou longo).'
      }
    ],

    proficienciesAndLanguages: 'Todas as armaduras, escudos, armas simples e marciais. Idiomas: Comum, Anão.',
    personalityTraits: 'Enfrento perigos de cabeça erguida e nunca abandono um aliado ferido.',
    ideals: 'Honra: O cumprimento da palavra e a lealdade são a bússola de um guerreiro.',
    bonds: 'Minha antiga unidade militar foi traída; procuro os responsáveis para restaurar nossa reputação.',
    flaws: 'Tenho dificuldade em confiar em estranhos e sou teimoso quando tomo uma decisão.',
    backstory: 'Nascido nos limites do reino, serviu como capitão da infantaria antes de decidir viajar pelo mundo como mercenário aventureiro.',
    notes: 'Preciso comprar mais corda de seda e tochas na próxima cidade.'
  };
}

export const VALEROS_HERO: Character = {
  id: 'char-valeros-sample',
  name: 'Valeros Martelo-de-Ferro',
  characterClass: 'Guerreiro (Campeão)',
  level: 3,
  race: 'Humano Variante',
  background: 'Soldado Veterano',
  alignment: 'Leal e Bom',
  experience: 900,
  inspiration: true,

  armorClass: 18,
  speed: 9,
  initiativeBonus: 0,
  maxHp: 28,
  currentHp: 24,
  tempHp: 5,
  hitDice: {
    total: 3,
    current: 2,
    dieType: 'd10',
  },
  deathSaves: {
    successes: 0,
    failures: 0,
  },

  abilities: {
    str: { score: 16, saveProficient: true },
    dex: { score: 12, saveProficient: false },
    con: { score: 15, saveProficient: true },
    int: { score: 10, saveProficient: false },
    wis: { score: 13, saveProficient: false },
    cha: { score: 10, saveProficient: false },
  },

  skills: {
    acrobatics: { proficiency: 'none' },
    animal_handling: { proficiency: 'none' },
    arcana: { proficiency: 'none' },
    athletics: { proficiency: 'proficient' },
    deception: { proficiency: 'none' },
    history: { proficiency: 'none' },
    insight: { proficiency: 'none' },
    intimidation: { proficiency: 'proficient' },
    investigation: { proficiency: 'none' },
    medicine: { proficiency: 'none' },
    nature: { proficiency: 'none' },
    perception: { proficiency: 'proficient' },
    performance: { proficiency: 'none' },
    persuasion: { proficiency: 'none' },
    religion: { proficiency: 'none' },
    sleight_of_hand: { proficiency: 'none' },
    stealth: { proficiency: 'none' },
    survival: { proficiency: 'proficient' },
  },

  attacks: [
    {
      id: 'atk-1',
      name: 'Espada Longa de Aço Forjado',
      attackBonus: 5,
      damage: '1d8 + 3',
      damageType: 'Cortante',
      range: 'Corpo a corpo (1,5m)',
      notes: 'Versátil (1d10 + 3 empunhadura dupla)'
    },
    {
      id: 'atk-2',
      name: 'Escudo com Espinhos (Bash)',
      attackBonus: 5,
      damage: '1d4 + 3',
      damageType: 'Contundente',
      range: 'Corpo a corpo (1,5m)',
      notes: 'Pode tentar derrubar o alvo como Ação Bônus'
    },
    {
      id: 'atk-3',
      name: 'Javelin (Dardo de Arremesso)',
      attackBonus: 5,
      damage: '1d6 + 3',
      damageType: 'Perfurante',
      range: '9m / 36m',
      notes: 'Arremesso'
    }
  ],

  inventory: [
    { id: 'item-1', name: 'Armadura de Placas Parciais', quantity: 1, weight: 20, equipped: true },
    { id: 'item-2', name: 'Escudo Reforçado (+2 CA)', quantity: 1, weight: 3, equipped: true },
    { id: 'item-3', name: 'Poção de Cura Maior (4d4 + 4)', quantity: 1, weight: 0.5 },
    { id: 'item-4', name: 'Corda de Seda (15m)', quantity: 1, weight: 2.5 },
    { id: 'item-5', name: 'Kit de Primeiros Socorros', quantity: 1, weight: 1.5 },
    { id: 'item-6', name: 'Pedra de Amolar e Manutenção', quantity: 1, weight: 0.5 },
    { id: 'item-7', name: 'Rações de Viagem (7 dias)', quantity: 7, weight: 3.5 }
  ],

  currency: {
    cp: 35,
    sp: 42,
    ep: 0,
    gp: 120,
    pp: 2,
  },

  spellcasting: {
    ability: 'int',
    spellSaveDcBonus: 0,
    spellAttackBonusMod: 0,
    slots: [
      { level: 1, max: 0, used: 0 },
      { level: 2, max: 0, used: 0 },
      { level: 3, max: 0, used: 0 },
      { level: 4, max: 0, used: 0 },
      { level: 5, max: 0, used: 0 },
      { level: 6, max: 0, used: 0 },
      { level: 7, max: 0, used: 0 },
      { level: 8, max: 0, used: 0 },
      { level: 9, max: 0, used: 0 },
    ],
    spells: []
  },

  features: [
    {
      id: 'feat-1',
      name: 'Crítico Aprimorado (Improved Critical)',
      source: 'Guerreiro (Campeão) 3',
      description: 'Seus ataques com armas marcam um acerto crítico em rolagens de 19 ou 20 no d20.'
    },
    {
      id: 'feat-2',
      name: 'Surto de Ação (Action Surge)',
      source: 'Guerreiro 2',
      description: 'Você pode realizar uma ação adicional no seu turno além da sua ação normal. Recarrega com Descanso Curto ou Longo.'
    },
    {
      id: 'feat-3',
      name: 'Retomar o Fôlego (Second Wind)',
      source: 'Guerreiro 1',
      description: 'Como ação bônus, recupere 1d10 + nível de PV (1d10 + 3). Recarrega em descanso curto/longo.'
    }
  ],

  proficienciesAndLanguages: 'Todas as armaduras, escudos, armas simples e marciais, veículos terrestres. Idiomas: Comum, Élfico, Anão.',
  personalityTraits: 'Mantenho a calma mesmo diante do perigo mortal. Gosto de liderar na vanguarda.',
  ideals: 'Dever: Quando faço uma promessa a um camponês ou a um lorde, eu a cumpro até o fim.',
  bonds: 'A espada que carrego pertenceu ao meu mentor, que caiu defendendo a passagem de Phandalin.',
  flaws: 'Às vezes superestimo minha resistência e demoro a recuar quando necessário.',
  backstory: 'Veterano das guerras de fronteira, Valeros agora oferece sua espada e escudo àqueles que não podem se defender.',
  notes: 'O ferreiro da vila ficou de reparar o virote do elmo até a próxima lua cheia.'
};
