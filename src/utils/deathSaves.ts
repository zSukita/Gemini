import type { Character } from '../types/dnd5e';

type DeathState = Pick<Character, 'currentHp' | 'maxHp' | 'tempHp' | 'deathSaves' | 'deathStatus'>;

/** Mantém compatibilidade com fichas antigas que guardavam estabilidade/morte nos contadores. */
export function isCharacterDead(character: Pick<DeathState, 'deathSaves' | 'deathStatus'>): boolean {
  return character.deathStatus === 'dead' || (character.deathSaves?.failures || 0) >= 3;
}

export function isCharacterStable(character: Pick<DeathState, 'deathSaves' | 'deathStatus'>): boolean {
  return !isCharacterDead(character) && (character.deathStatus === 'stable' || (character.deathSaves?.successes || 0) >= 3);
}

/** Aplica dano, salvaguardas por dano a 0 PV e morte por dano massivo. */
export function applyCharacterDamage<T extends DeathState>(character: T, amount: number, isCritical = false): T {
  if (!Number.isFinite(amount) || amount <= 0 || isCharacterDead(character)) return character;

  let remainingDamage = Math.floor(amount);
  const tempHp = Math.max(0, character.tempHp || 0);
  const absorbed = Math.min(tempHp, remainingDamage);
  const nextTempHp = tempHp - absorbed;
  remainingDamage -= absorbed;

  if (remainingDamage <= 0) return { ...character, tempHp: nextTempHp };

  if (character.currentHp <= 0) {
    const failures = Math.min(3, (character.deathSaves?.failures || 0) + (isCritical ? 2 : 1));
    return {
      ...character,
      tempHp: nextTempHp,
      currentHp: 0,
      deathStatus: failures >= 3 ? 'dead' : undefined,
      deathSaves: { successes: 0, failures },
    };
  }

  const nextCurrentHp = Math.max(0, character.currentHp - remainingDamage);
  const massiveDamage = nextCurrentHp === 0 && remainingDamage >= character.currentHp + Math.max(1, character.maxHp);
  return {
    ...character,
    tempHp: nextTempHp,
    currentHp: nextCurrentHp,
    deathStatus: massiveDamage ? 'dead' : undefined,
    deathSaves: { successes: 0, failures: 0 },
  };
}

/** Cura real acorda o inconsciente e zera os contadores; cura comum não ressuscita mortos. */
export function applyCharacterHealing<T extends DeathState>(character: T, amount: number): T {
  if (!Number.isFinite(amount) || amount <= 0 || isCharacterDead(character)) return character;
  const currentHp = Math.min(character.maxHp, Math.max(0, character.currentHp) + Math.floor(amount));
  const recoveredFromZero = character.currentHp <= 0 && currentHp > 0;
  return {
    ...character,
    currentHp,
    ...(recoveredFromZero
      ? { deathStatus: undefined, deathSaves: { successes: 0, failures: 0 } }
      : {}),
  };
}
