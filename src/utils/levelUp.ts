export interface ClassMilestone {
  level: number;
  features: string[];
}

export const CLASS_MILESTONES: Record<string, Record<number, string[]>> = {
  Guerreiro: {
    2: ['Surto de Ação (1 uso por descanso curto)'],
    3: ['Escolha de Arquétipo Marcial (ex: Campeão, Mestre da Batalha, Cavaleiro Arcano)'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Ataque Extra (2 ataques ao usar a ação Atacar)'],
    6: ['Aumento no Valor de Habilidade adicional do Guerreiro'],
  },
  Ladino: {
    2: ['Ação Ardilosa (Correr, Desengajar ou Esconder como Ação Bônus)'],
    3: ['Escolha de Arquétipo Ladino (ex: Ladrão, Assassino, Trapaceiro Arcano)', 'Ataque Furtivo aumenta para 2d6'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Esquiva Sobrenatural (metade do dano de um ataque visível como Reação)', 'Ataque Furtivo aumenta para 3d6'],
  },
  Mago: {
    2: ['Escolha da Tradição Arcana / Escola de Especialização (ex: Evocação, Abjuração)'],
    3: ['Acesso a Magias de 2º Círculo'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Acesso a Magias de 3º Círculo (ex: Bola de Fogo, Contra-Mágica)'],
  },
  Clérigo: {
    2: ['Canalizar Divindade (1 uso por descanso)', 'Expulsar Mortos-Vivos'],
    3: ['Acesso a Magias de 2º Círculo', 'Habilidades de Domínio Divino'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Destruir Mortos-Vivos (ND 1/2 ou menor)', 'Acesso a Magias de 3º Círculo (Revivificar)'],
  },
  Bárbaro: {
    2: ['Ataque Imprudente (vantagem em ataques com Força)', 'Sentido de Perigo (vantagem em saves de DES)'],
    3: ['Caminho Primitivo (ex: Berserker, Totêmico)', '+1 uso de Fúria (3/dia)'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Ataque Extra', 'Movimento Rápido (+3m de deslocamento)'],
  },
  Paladino: {
    2: ['Estilo de Luta', 'Conjuração de Magias de Paladino', 'Destruição Divina (Divine Smite)'],
    3: ['Juramento Sagrado (ex: Devoção, Vingança)', 'Saúde Divina (imunidade a doenças)'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Ataque Extra', 'Acesso a Magias de 2º Círculo'],
  },
  Bardo: {
    2: ['Pau pra Toda Obra (metade da proficiência em testes sem proficiência)', 'Canção de Descanso (1d6 extra)'],
    3: ['Colégio de Bardo (ex: Bravura, Conhecimento)', 'Especialização em 2 Perícias'],
    4: ['Aumento no Valor de Habilidade (ASI) ou Talento'],
    5: ['Fonte de Inspiração (recupera dados de inspiração no descanso curto)', 'Dado de Inspiração sobe para d8', 'Magias de 3º Círculo'],
  },
};

// Tabela padrão de slots de magia para Full Casters (Mago, Clérigo, Druida, Feiticeiro, Bardo)
const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Half Casters (Paladino, Patrulheiro)
const HALF_CASTER_SLOTS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  6: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  8: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  9: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  10: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  11: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  12: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  13: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  14: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  15: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  16: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  17: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  18: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  19: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  20: [4, 3, 3, 3, 2, 0, 0, 0, 0],
};

export function getSpellSlotsForLevel(className: string, level: number): number[] {
  const normClass = className.trim().toLowerCase();
  const clampedLvl = Math.max(1, Math.min(20, level));

  const fullCasters = ['mago', 'clérigo', 'clerigo', 'druida', 'feiticeiro', 'bardo'];
  if (fullCasters.includes(normClass)) {
    return FULL_CASTER_SLOTS[clampedLvl] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  const halfCasters = ['paladino', 'patrulheiro'];
  if (halfCasters.includes(normClass)) {
    return HALF_CASTER_SLOTS[clampedLvl] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  // Bruxo (Warlock) usa Pact Magic: 2 a 4 slots todos do mesmo nível
  if (normClass === 'bruxo') {
    const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (clampedLvl === 1) slots[0] = 1;
    else if (clampedLvl === 2) slots[0] = 2;
    else if (clampedLvl <= 4) slots[1] = 2;
    else if (clampedLvl <= 6) slots[2] = 2;
    else if (clampedLvl <= 8) slots[3] = 2;
    else if (clampedLvl <= 10) slots[4] = 2;
    else if (clampedLvl <= 16) slots[4] = 3;
    else slots[4] = 4;
    return slots;
  }

  return [0, 0, 0, 0, 0, 0, 0, 0, 0];
}

export function getAverageHpGain(dieType: 'd6' | 'd8' | 'd10' | 'd12', conMod: number): number {
  const dieAvg: Record<'d6' | 'd8' | 'd10' | 'd12', number> = {
    d6: 4,
    d8: 5,
    d10: 6,
    d12: 7,
  };
  const base = dieAvg[dieType] || 5;
  return Math.max(1, base + conMod);
}

export function rollHpGain(dieType: 'd6' | 'd8' | 'd10' | 'd12', conMod: number): { roll: number; total: number } {
  const dieMax: Record<'d6' | 'd8' | 'd10' | 'd12', number> = {
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
  };
  const sides = dieMax[dieType] || 8;
  const roll = Math.floor(Math.random() * sides) + 1;
  const total = Math.max(1, roll + conMod);
  return { roll, total };
}

export function isAsiLevel(className: string, level: number): boolean {
  const normClass = className.trim().toLowerCase();
  if (normClass === 'guerreiro') {
    return [4, 6, 8, 12, 14, 16, 19].includes(level);
  }
  if (normClass === 'ladino') {
    return [4, 8, 10, 12, 16, 19].includes(level);
  }
  return [4, 8, 12, 16, 19].includes(level);
}

export function getClassMilestones(className: string, level: number): string[] {
  const milestones = CLASS_MILESTONES[className];
  if (!milestones) return [];
  return milestones[level] || [];
}
