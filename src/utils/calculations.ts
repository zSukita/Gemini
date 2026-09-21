import type { Character, AbilityKey, SkillKey } from '../types/dnd5e';
import { SKILLS } from '../types/dnd5e';

/**
 * Calcula o modificador de um atributo segundo as regras de D&D 5e:
 * Math.floor((score - 10) / 2)
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Formata um modificador com sinal positivo ou negativo (ex: +3 ou -1 ou +0)
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Calcula o Bônus de Proficiência pelo nível (1 a 20):
 * Nível 1-4: +2
 * Nível 5-8: +3
 * Nível 9-12: +4
 * Nível 13-16: +5
 * Nível 17-20: +6
 */
export function getProficiencyBonus(level: number): number {
  const safeLevel = Math.max(1, Math.min(20, level || 1));
  return Math.floor((safeLevel - 1) / 4) + 2;
}

/**
 * Calcula o modificador de uma Salvaguarda (Saving Throw)
 */
export function getSavingThrowModifier(character: Character, ability: AbilityKey): number {
  const abilityMod = getAbilityModifier(character.abilities[ability]?.score ?? 10);
  const isProficient = character.abilities[ability]?.saveProficient ?? false;
  const profBonus = getProficiencyBonus(character.level);

  return abilityMod + (isProficient ? profBonus : 0);
}

/**
 * Calcula o modificador de uma perícia específica
 */
export function getSkillModifier(character: Character, skillKey: SkillKey): number {
  const skillDef = SKILLS[skillKey];
  if (!skillDef) return 0;

  const abilityMod = getAbilityModifier(character.abilities[skillDef.ability]?.score ?? 10);
  const profLevel = character.skills[skillKey]?.proficiency ?? 'none';
  const profBonus = getProficiencyBonus(character.level);

  if (profLevel === 'expertise') {
    return abilityMod + profBonus * 2;
  }
  if (profLevel === 'proficient') {
    return abilityMod + profBonus;
  }
  return abilityMod;
}

/**
 * Percepção Passiva (10 + modificador de percepção)
 */
export function getPassivePerception(character: Character): number {
  return 10 + getSkillModifier(character, 'perception');
}

/**
 * Intuição Passiva (10 + modificador de intuição)
 */
export function getPassiveInsight(character: Character): number {
  return 10 + getSkillModifier(character, 'insight');
}

/**
 * Investigação Passiva (10 + modificador de investigação)
 */
export function getPassiveInvestigation(character: Character): number {
  return 10 + getSkillModifier(character, 'investigation');
}

/**
 * CD de Salvaguarda de Magia: 8 + bônus de proficiência + modificador do atributo de conjuração + bônus extras
 */
export function getSpellSaveDC(character: Character): number {
  const prof = getProficiencyBonus(character.level);
  const abilityMod = getAbilityModifier(
    character.abilities[character.spellcasting.ability]?.score ?? 10
  );
  return 8 + prof + abilityMod + (character.spellcasting.spellSaveDcBonus || 0);
}

/**
 * Bônus de Ataque de Magia: bônus de proficiência + modificador do atributo de conjuração + bônus extras
 */
export function getSpellAttackBonus(character: Character): number {
  const prof = getProficiencyBonus(character.level);
  const abilityMod = getAbilityModifier(
    character.abilities[character.spellcasting.ability]?.score ?? 10
  );
  return prof + abilityMod + (character.spellcasting.spellAttackBonusMod || 0);
}

/**
 * Capacidade de carga em quilogramas (7,5 kg por ponto de Força)
 */
export function getCarryingCapacity(strengthScore: number): {
  maxWeight: number;
  encumberedWeight: number;
  heavilyEncumberedWeight: number;
} {
  const maxWeight = Math.round(strengthScore * 7.5 * 10) / 10;
  const encumberedWeight = Math.round(strengthScore * 2.5 * 10) / 10;
  const heavilyEncumberedWeight = Math.round(strengthScore * 5.0 * 10) / 10;
  return { maxWeight, encumberedWeight, heavilyEncumberedWeight };
}

/**
 * Calcula o peso total atual do inventário (incluindo moedas - 50 moedas = ~0.5kg)
 */
export function getTotalInventoryWeight(character: Character): number {
  const itemsWeight = character.inventory.reduce(
    (total, item) => total + (item.quantity || 1) * (item.weight || 0),
    0
  );

  const totalCoins =
    (character.currency.cp || 0) +
    (character.currency.sp || 0) +
    (character.currency.ep || 0) +
    (character.currency.gp || 0) +
    (character.currency.pp || 0);

  const coinsWeight = Math.round((totalCoins / 100) * 10) / 10; // ~1kg para cada 100 moedas

  return Math.round((itemsWeight + coinsWeight) * 10) / 10;
}
