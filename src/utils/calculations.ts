import type { Character, AbilityKey, SkillKey } from '../types/dnd5e';
import { ABILITIES, SKILLS } from '../types/dnd5e';

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

/** Resolve o modificador completo de um teste pedido pelo Mestre de IA. */
export function getDnd5eRollModifier(character: Character, label: string): number {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const target = normalize(label);
  const proficiency = getProficiencyBonus(character.level);

  const findAbility = (): AbilityKey | undefined =>
    (Object.keys(SKILLS) as SkillKey[])
      .map((key) => SKILLS[key].ability)
      .filter((key, index, all) => all.indexOf(key) === index)
      .find((key) => {
        const ability = normalize(ABILITIES[key].name);
        const abbreviation = normalize(ABILITIES[key].abbr);
        return target.includes(ability) || new RegExp(`\\b${abbreviation.toLowerCase()}\\b`).test(target);
      });

  const isAttack = /\b(ataque|attack|golpe)\b/.test(target);
  if (isAttack) {
    const weapon = character.attacks?.find((attack) => target.includes(normalize(attack.name)));
    if (weapon) return weapon.attackBonus;
    if (target.includes('magia') || target.includes('magico') || target.includes('spell')) {
      return getSpellAttackBonus(character);
    }
    const ability = findAbility();
    const usesDexterity = /\b(destreza|des|arco|adaga|rapieira)\b/.test(target);
    const key: AbilityKey = ability || (usesDexterity ? 'dex' : 'str');
    return getAbilityModifier(character.abilities[key]?.score ?? 10) + proficiency;
  }

  if (/salvaguarda|saving throw|resistencia/.test(target)) {
    const ability = findAbility();
    return ability ? getSavingThrowModifier(character, ability) : 0;
  }

  const skill = (Object.keys(SKILLS) as SkillKey[]).find((key) =>
    target.includes(normalize(SKILLS[key].name)) || target.includes(normalize(key.replace(/_/g, ' ')))
  );
  if (skill) return getSkillModifier(character, skill);

  const ability = findAbility();
  return ability ? getAbilityModifier(character.abilities[ability]?.score ?? 10) : 0;
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
