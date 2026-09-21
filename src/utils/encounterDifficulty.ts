// Calculadora de Dificuldade de Encontros D&D 5e Oficial (SRD 5.1)

export interface PartyMemberInfo {
  level: number;
}

export interface MonsterCombatantInfo {
  cr: string;
  xp?: number;
}

export type EncounterDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface EncounterDifficultyResult {
  totalMonsterXp: number;
  adjustedXp: number;
  partyThresholds: {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
  };
  difficulty: EncounterDifficulty;
  difficultyLabel: string;
  xpPerPlayer: number;
  monsterCount: number;
  playerCount: number;
}

// Tabela de XP por Nível (SRD 5.1)
export const XP_THRESHOLDS_PER_LEVEL: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

// Conversão oficial de ND (CR) para XP
export const CR_TO_XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '30': 155000,
};

export function getXpForCr(cr: string): number {
  const normalized = cr.trim();
  return CR_TO_XP[normalized] || 50;
}

const MULTIPLIERS = [
  { count: 1, mult: 1 },
  { count: 2, mult: 1.5 },
  { count: 6, mult: 2.0 },
  { count: 10, mult: 2.5 },
  { count: 14, mult: 3.0 },
  { count: Infinity, mult: 4.0 },
];

export function getMonsterMultiplier(monsterCount: number, partySize: number): number {
  if (monsterCount === 0) return 1;

  let baseIndex = MULTIPLIERS.findIndex((m) => monsterCount <= m.count);
  if (baseIndex === -1) baseIndex = MULTIPLIERS.length - 1;

  // Ajuste por tamanho do grupo
  if (partySize < 3 && baseIndex < MULTIPLIERS.length - 1) {
    baseIndex += 1;
  } else if (partySize > 5 && baseIndex > 0) {
    baseIndex -= 1;
  }

  return MULTIPLIERS[baseIndex].mult;
}

export function calculateEncounterDifficulty(
  party: PartyMemberInfo[],
  monsters: MonsterCombatantInfo[]
): EncounterDifficultyResult {
  const partySize = Math.max(1, party.length);
  const monsterCount = monsters.length;

  // 1. Somar os limites de XP do grupo
  const partyThresholds = party.reduce(
    (acc, member) => {
      const lvl = Math.min(20, Math.max(1, member.level || 1));
      const t = XP_THRESHOLDS_PER_LEVEL[lvl] || XP_THRESHOLDS_PER_LEVEL[1];
      return {
        easy: acc.easy + t.easy,
        medium: acc.medium + t.medium,
        hard: acc.hard + t.hard,
        deadly: acc.deadly + t.deadly,
      };
    },
    { easy: 0, medium: 0, hard: 0, deadly: 0 }
  );

  // 2. Somar XP dos monstros
  const totalMonsterXp = monsters.reduce((sum, m) => {
    const xp = typeof m.xp === 'number' && m.xp > 0 ? m.xp : getXpForCr(m.cr);
    return sum + xp;
  }, 0);

  // 3. Multiplicador ajustado
  const multiplier = getMonsterMultiplier(monsterCount, partySize);
  const adjustedXp = Math.round(totalMonsterXp * multiplier);

  // 4. Determinar dificuldade
  let difficulty: EncounterDifficulty = 'trivial';
  let difficultyLabel = 'Trivial';

  if (adjustedXp === 0 || monsterCount === 0) {
    difficulty = 'trivial';
    difficultyLabel = 'Nenhum Inimigo';
  } else if (adjustedXp >= partyThresholds.deadly) {
    difficulty = 'deadly';
    difficultyLabel = 'Mortal 💀';
  } else if (adjustedXp >= partyThresholds.hard) {
    difficulty = 'hard';
    difficultyLabel = 'Difícil ⚔️';
  } else if (adjustedXp >= partyThresholds.medium) {
    difficulty = 'medium';
    difficultyLabel = 'Médio 🛡️';
  } else if (adjustedXp >= partyThresholds.easy) {
    difficulty = 'easy';
    difficultyLabel = 'Fácil ✨';
  } else {
    difficulty = 'trivial';
    difficultyLabel = 'Trivial 💤';
  }

  const xpPerPlayer = partySize > 0 ? Math.round(totalMonsterXp / partySize) : totalMonsterXp;

  return {
    totalMonsterXp,
    adjustedXp,
    partyThresholds,
    difficulty,
    difficultyLabel,
    xpPerPlayer,
    monsterCount,
    playerCount: partySize,
  };
}
