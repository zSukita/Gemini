import React, { useState } from 'react';
import type { Character } from '../types/dnd5e';
import { getAbilityModifier, formatModifier } from '../utils/calculations';
import { 
  Shield, 
  Zap, 
  Footprints, 
  Heart, 
  Plus, 
  Minus, 
  Sparkles, 
  Skull, 
  RotateCcw,
  Dices
} from 'lucide-react';

interface CombatStatsProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  applyDamage: (amount: number) => void;
  applyHealing: (amount: number) => void;
  setTempHp: (amount: number) => void;
  toggleDeathSaveSuccess: (index: number) => void;
  toggleDeathSaveFailure: (index: number) => void;
  onSpendHitDie: () => void;
  onRollInitiative: (modifier: number) => void;
}

export const CombatStats: React.FC<CombatStatsProps> = ({
  character,
  updateCharacter,
  applyDamage,
  applyHealing,
  setTempHp,
  toggleDeathSaveSuccess,
  toggleDeathSaveFailure,
  onSpendHitDie,
  onRollInitiative,
}) => {
  const [hpInput, setHpInput] = useState<number | ''>('');
  const [tempHpInput, setTempHpInput] = useState<number | ''>('');

  const dexMod = getAbilityModifier(character.abilities.dex.score);
  const initiativeTotal = dexMod + (character.initiativeBonus || 0);

  // Porcentagem de vida atual
  const hpPercent = Math.max(0, Math.min(100, (character.currentHp / (character.maxHp || 1)) * 100));

  const handleDamage = () => {
    if (typeof hpInput === 'number' && hpInput > 0) {
      applyDamage(hpInput);
      setHpInput('');
    }
  };

  const handleHealing = () => {
    if (typeof hpInput === 'number' && hpInput > 0) {
      applyHealing(hpInput);
      setHpInput('');
    }
  };

  const handleApplyTempHp = () => {
    if (typeof tempHpInput === 'number') {
      setTempHp(tempHpInput);
      setTempHpInput('');
    }
  };

  const isPerceptionProf = character.skills.perception?.proficiency === 'proficient' || character.skills.perception?.proficiency === 'expertise';
  const perceptionMult = character.skills.perception?.proficiency === 'expertise' ? 2 : 1;
  const passPerception = 10 + getAbilityModifier(character.abilities.wis.score) + (isPerceptionProf ? (Math.floor(((character.level || 1) - 1) / 4) + 2) * perceptionMult : 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-stretch">
      {/* 1. Atributos de Defesa e Velocidade */}
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80 min-h-[250px] shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 h-8">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <Shield size={16} className="text-amber-400" />
              Estatísticas de Combate
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Defesa / Vel</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center h-24 items-center">
            {/* Classe de Armadura (CA) */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 h-full flex flex-col items-center justify-between">
              <div className="flex items-center gap-1 text-amber-400">
                <Shield size={15} />
                <span className="text-[9px] uppercase font-bold text-slate-400">CA</span>
              </div>
              <input
                type="number"
                min={0}
                value={character.armorClass}
                onChange={(e) => updateCharacter({ armorClass: parseInt(e.target.value, 10) || 10 })}
                className="w-12 text-center font-mono text-xl font-black text-amber-300 bg-transparent focus:outline-none focus:text-amber-100"
              />
              <span className="text-[9px] text-slate-500">Armadura</span>
            </div>

            {/* Iniciativa */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 h-full flex flex-col items-center justify-between">
              <div className="flex items-center gap-1 text-cyan-400">
                <Zap size={15} />
                <span className="text-[9px] uppercase font-bold text-slate-400">Inic.</span>
              </div>
              <button
                type="button"
                onClick={() => onRollInitiative(initiativeTotal)}
                className="flex items-center justify-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/50 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-sm font-mono font-bold transition active:scale-95"
                title="Rolar Iniciativa (d20 + DES)"
              >
                <span>{formatModifier(initiativeTotal)}</span>
                <Dices size={12} />
              </button>
              <span className="text-[9px] text-slate-500">d20+DES</span>
            </div>

            {/* Deslocamento */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700 h-full flex flex-col items-center justify-between">
              <div className="flex items-center gap-1 text-emerald-400">
                <Footprints size={15} />
                <span className="text-[9px] uppercase font-bold text-slate-400">Desloc.</span>
              </div>
              <div className="flex items-center justify-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  step={1.5}
                  value={character.speed}
                  onChange={(e) => updateCharacter({ speed: parseFloat(e.target.value) || 9 })}
                  className="w-10 text-center font-mono text-lg font-black text-emerald-300 bg-transparent focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-bold">m</span>
              </div>
              <span className="text-[9px] text-slate-500">Por Turno</span>
            </div>
          </div>
        </div>

        {/* Base Nivelada */}
        <div className="pt-2 border-t border-slate-800 flex flex-col justify-center min-h-[72px] gap-1 text-[11px] text-slate-400">
          <div className="flex justify-between items-center px-1">
            <span>Iniciativa Base: DES ({formatModifier(dexMod)})</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Bônus:</span>
              <input
                type="number"
                value={character.initiativeBonus || 0}
                onChange={(e) => updateCharacter({ initiativeBonus: parseInt(e.target.value, 10) || 0 })}
                className="w-9 text-center text-[11px] bg-slate-800 rounded border border-slate-700 text-slate-200 py-0.5"
              />
            </div>
          </div>
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-500">
            <span>Percepção Passiva:</span>
            <span className="font-mono font-bold text-slate-300">{passPerception}</span>
          </div>
        </div>
      </div>

      {/* 2. Pontos de Vida (HP) e Cura / Dano Rápido */}
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80 min-h-[250px] shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 h-8">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <Heart size={16} className="text-rose-500" />
              Pontos de Vida (PV)
            </h3>
            {character.tempHp > 0 ? (
              <span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 rounded-full text-[10px] font-bold">
                +{character.tempHp} Temp
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                {Math.round(hpPercent)}%
              </span>
            )}
          </div>

          {/* Medidor Numérico de HP e Barra */}
          <div className="h-24 flex flex-col justify-center">
            <div className="flex items-baseline justify-center gap-2 my-1">
              <input
                type="number"
                min={0}
                max={character.maxHp + (character.tempHp || 0)}
                value={character.currentHp}
                onChange={(e) => updateCharacter({ currentHp: parseInt(e.target.value, 10) || 0 })}
                className={`w-16 text-center font-mono text-3xl font-black bg-transparent focus:outline-none ${
                  character.currentHp === 0
                    ? 'text-rose-500'
                    : character.currentHp < character.maxHp / 3
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
              <span className="text-slate-500 text-xl font-mono">/</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">Máx</span>
                <input
                  type="number"
                  min={1}
                  value={character.maxHp}
                  onChange={(e) => updateCharacter({ maxHp: parseInt(e.target.value, 10) || 1 })}
                  className="w-14 text-left font-mono text-xl font-bold text-slate-300 bg-transparent focus:outline-none focus:text-amber-300"
                />
              </div>
            </div>

            {/* Barra Visual de Vida */}
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 relative mt-1">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  hpPercent > 50
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : hpPercent > 25
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-rose-700 to-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controles de Dano / Cura Rápida */}
        <div className="pt-2 border-t border-slate-800 flex flex-col justify-center min-h-[72px] gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Qtd"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDamage();
              }}
              className="rpg-input text-xs w-16 text-center font-mono py-1"
            />
            <button
              type="button"
              onClick={handleDamage}
              className="flex-1 rpg-button bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs py-1"
              title="Causar Dano"
            >
              <Minus size={13} />
              Dano
            </button>
            <button
              type="button"
              onClick={handleHealing}
              className="flex-1 rpg-button bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-xs py-1"
              title="Curar Vida"
            >
              <Plus size={13} />
              Cura
            </button>
          </div>

          {/* Linha do HP Temporário */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Temp"
              value={tempHpInput}
              onChange={(e) => setTempHpInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="rpg-input text-xs w-16 text-center font-mono py-1"
            />
            <button
              type="button"
              onClick={handleApplyTempHp}
              className="w-full rpg-button bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 text-xs py-1"
            >
              <Sparkles size={13} />
              Definir HP Temp
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dados de Vida & Salvaguardas contra a Morte */}
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80 min-h-[250px] shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 h-8">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <Dices size={16} className="text-amber-400" />
              Dados de Vida
            </h3>
            <span className="text-xs font-mono text-amber-300 font-bold">
              {character.hitDice.current} / {character.hitDice.total} {character.hitDice.dieType}
            </span>
          </div>

          <div className="h-24 flex flex-col justify-center">
            <button
              type="button"
              onClick={onSpendHitDie}
              disabled={character.hitDice.current <= 0}
              className="w-full rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-200 border border-slate-700 hover:border-amber-500/50 disabled:opacity-40 disabled:pointer-events-none text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Gastar 1 Dado ({character.hitDice.dieType} + CON)</span>
            </button>
            <span className="text-[10px] text-slate-500 text-center mt-1.5">
              Recupera metade no Descanso Longo
            </span>
          </div>
        </div>

        {/* Salvaguardas contra a Morte (Death Saves) */}
        <div className="pt-2 border-t border-slate-800 flex flex-col justify-center min-h-[72px] gap-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-serif font-bold text-slate-300 flex items-center gap-1.5">
              <Skull size={13} className="text-rose-400" />
              Salvaguardas da Morte
            </span>
            <button
              type="button"
              onClick={() => updateCharacter({ deathSaves: { successes: 0, failures: 0 } })}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
              title="Resetar Salvaguardas"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            {/* Sucessos */}
            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-emerald-400 font-medium text-[10px]">Sucessos</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDeathSaveSuccess(idx)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      idx < character.deathSaves.successes
                        ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/40'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Falhas */}
            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-rose-400 font-medium text-[10px]">Falhas</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDeathSaveFailure(idx)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      idx < character.deathSaves.failures
                        ? 'bg-rose-600 border-rose-500 shadow-md shadow-rose-600/40'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
