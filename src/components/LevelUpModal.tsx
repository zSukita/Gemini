import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Character, AbilityKey, SpellSlot } from '../types/dnd5e';
import { ABILITIES } from '../types/dnd5e';
import { 
  getAverageHpGain, 
  rollHpGain, 
  getSpellSlotsForLevel, 
  isAsiLevel, 
  getClassMilestones 
} from '../utils/levelUp';
import { getAbilityModifier } from '../utils/calculations';
import { 
  X, 
  ArrowUpCircle, 
  Heart, 
  Sparkles, 
  Award, 
  Dices, 
  Check, 
  Zap 
} from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onApplyLevelUp: (updates: Partial<Character>) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  character,
  onApplyLevelUp,
}) => {
  const currentLevel = character.level;
  const nextLevel = Math.min(20, currentLevel + 1);
  const conMod = getAbilityModifier(character.abilities.con.score);
  const dieType = character.hitDice.dieType;

  const averageHp = getAverageHpGain(dieType, conMod);
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average');
  const [rolledHp, setRolledHp] = useState<{ roll: number; total: number } | null>(null);

  // ASI states (se for nível de ASI)
  const isAsi = isAsiLevel(character.characterClass, nextLevel);
  const [asiType, setAsiType] = useState<'+2' | '+1+1' | 'feat'>('+2');
  const [singleStat, setSingleStat] = useState<AbilityKey>('str');
  const [dualStat1, setDualStat1] = useState<AbilityKey>('str');
  const [dualStat2, setDualStat2] = useState<AbilityKey>('dex');

  // Novos marcos de classe
  const milestones = getClassMilestones(character.characterClass, nextLevel);
  const newSlots = getSpellSlotsForLevel(character.characterClass, nextLevel);
  const hasSpells = newSlots.some((s) => s > 0);

  const selectedHpGain = hpMethod === 'average' ? averageHp : (rolledHp?.total ?? averageHp);

  const handleRollHp = () => {
    const res = rollHpGain(dieType, conMod);
    setRolledHp(res);
  };

  const handleConfirm = () => {
    // 1. Atualizar Vida
    const newMaxHp = character.maxHp + selectedHpGain;
    const newCurrentHp = character.currentHp + selectedHpGain;
    const newTotalHitDice = character.hitDice.total + 1;

    // 2. Atualizar Atributos se ASI
    const updatedAbilities = { ...character.abilities };
    if (isAsi) {
      if (asiType === '+2') {
        updatedAbilities[singleStat] = {
          ...updatedAbilities[singleStat],
          score: Math.min(20, updatedAbilities[singleStat].score + 2),
        };
      } else if (asiType === '+1+1') {
        updatedAbilities[dualStat1] = {
          ...updatedAbilities[dualStat1],
          score: Math.min(20, updatedAbilities[dualStat1].score + 1),
        };
        updatedAbilities[dualStat2] = {
          ...updatedAbilities[dualStat2],
          score: Math.min(20, updatedAbilities[dualStat2].score + 1),
        };
      }
    }

    // 3. Atualizar Slots de Magia
    let updatedSlots: SpellSlot[] = [...character.spellcasting.slots];
    if (hasSpells) {
      updatedSlots = newSlots.map((max, index) => {
        const levelNum = index + 1;
        const existing = character.spellcasting.slots.find((s) => s.level === levelNum);
        return {
          level: levelNum,
          max: max,
          used: existing ? Math.min(existing.used, max) : 0,
        };
      });
    }

    // 4. Adicionar Habilidades nos Marcos de Classe
    const newFeatures = [...character.features];
    milestones.forEach((m) => {
      newFeatures.push({
        id: `feat-lvl${nextLevel}-${Date.now()}-${Math.random()}`,
        name: m,
        source: `${character.characterClass} Nível ${nextLevel}`,
        description: `Habilidade desbloqueada automaticamente ao atingir o nível ${nextLevel}.`,
      });
    });

    onApplyLevelUp({
      level: nextLevel,
      maxHp: newMaxHp,
      currentHp: newCurrentHp,
      hitDice: {
        ...character.hitDice,
        total: newTotalHitDice,
        current: character.hitDice.current + 1,
      },
      abilities: updatedAbilities,
      spellcasting: {
        ...character.spellcasting,
        slots: updatedSlots,
      },
      features: newFeatures,
    });

    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="rpg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border-amber-500/60 shadow-2xl overflow-hidden bg-slate-900/98 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Subir de Nível: {currentLevel} ➔ {nextLevel}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Parabéns pela evolução! Aumente seus Pontos de Vida, slots e habilidades de classe.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Seção 1: Pontos de Vida Adicionais */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-serif font-bold text-slate-200 uppercase tracking-wide">
                1. Pontos de Vida Adicionais (Dado: {dieType})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Escolha entre somar o valor fixo médio seguro ou rolar a sorte no Dado de Vida:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção Fixa */}
              <button
                type="button"
                onClick={() => setHpMethod('average')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hpMethod === 'average'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Média Fixa Oficial</span>
                  <span className="font-mono text-base font-bold text-emerald-400">+{averageHp} PV</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Garante consistência ({dieType === 'd6' ? 4 : dieType === 'd8' ? 5 : dieType === 'd10' ? 6 : 7} + mod Con {conMod >= 0 ? `+${conMod}` : conMod}).
                </p>
              </button>

              {/* Opção Rolagem */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  hpMethod === 'roll'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHpMethod('roll');
                      if (!rolledHp) handleRollHp();
                    }}
                    className="font-bold text-sm flex items-center gap-1.5 hover:text-amber-300"
                  >
                    <Dices className="w-4 h-4 text-amber-400" />
                    Rolar 1{dieType}
                  </button>
                  {rolledHp && (
                    <span className="font-mono text-base font-bold text-emerald-400">
                      +{rolledHp.total} PV
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHpMethod('roll');
                      handleRollHp();
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    {rolledHp ? 'Rolar de Novo' : 'Rolar Agora'}
                  </button>
                  {rolledHp && (
                    <span className="text-[11px] text-slate-300 font-mono">
                      (Tirou {rolledHp.roll} + {conMod} Con)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Aumento de Atributos ou Talentos (se aplicável) */}
          {isAsi && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/50 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-serif font-bold text-purple-200 uppercase tracking-wide">
                  2. Aumento no Valor de Habilidade (ASI)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Neste nível você adquire um aprimoramento de atributos ou talento:
              </p>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAsiType('+2')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                    asiType === '+2'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  +2 em 1 Atributo
                </button>
                <button
                  type="button"
                  onClick={() => setAsiType('+1+1')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                    asiType === '+1+1'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  +1 em 2 Atributos
                </button>
                <button
                  type="button"
                  onClick={() => setAsiType('feat')}
                  className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                    asiType === 'feat'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  Talento Especial
                </button>
              </div>

              {asiType === '+2' && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-400">Atributo a receber +2:</span>
                  <select
                    value={singleStat}
                    onChange={(e) => setSingleStat(e.target.value as AbilityKey)}
                    className="rpg-input py-1 text-xs bg-slate-900 text-amber-300 font-bold"
                  >
                    {Object.entries(ABILITIES).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.name} ({def.abbr}) - Atual: {character.abilities[key as AbilityKey].score}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {asiType === '+1+1' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">1º (+1):</span>
                    <select
                      value={dualStat1}
                      onChange={(e) => setDualStat1(e.target.value as AbilityKey)}
                      className="rpg-input py-1 text-xs bg-slate-900 text-amber-300 font-bold flex-1"
                    >
                      {Object.entries(ABILITIES).map(([key, def]) => (
                        <option key={key} value={key}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">2º (+1):</span>
                    <select
                      value={dualStat2}
                      onChange={(e) => setDualStat2(e.target.value as AbilityKey)}
                      className="rpg-input py-1 text-xs bg-slate-900 text-amber-300 font-bold flex-1"
                    >
                      {Object.entries(ABILITIES).map(([key, def]) => (
                        <option key={key} value={key}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seção 3: Novos Recursos e Magias */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-slate-200 uppercase tracking-wide">
                3. Novos Recursos de {character.characterClass}
              </h3>
            </div>

            {milestones.length > 0 ? (
              <ul className="space-y-1.5">
                {milestones.map((m, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/20 p-2 rounded-lg border border-amber-900/30"
                  >
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Avanço contínuo com acréscimo de Vida e Dado de Vida.
              </p>
            )}

            {/* Slots de Magia se houver */}
            {hasSpells && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <span className="text-xs font-semibold text-indigo-300 block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Espaços de Magia Atualizados para o Nível {nextLevel}:
                </span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {newSlots.map((max, idx) => {
                    if (max === 0) return null;
                    return (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-200"
                      >
                        {idx + 1}º Círculo: <strong>{max} slots</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé e Confirmação */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Aumento total de vida: <strong className="text-emerald-400 font-mono">+{selectedHpGain} PV</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black rounded-lg shadow-lg shadow-amber-600/30 active:scale-95 flex items-center gap-2 transition"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Evoluir para Nível {nextLevel}!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
