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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Atributos de Defesa e Velocidade */}
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80">
        <h3 className="text-sm font-serif font-bold text-amber-200 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
          <Shield size={16} className="text-amber-400" />
          Estatísticas de Combate
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Classe de Armadura (CA) */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 flex flex-col items-center">
            <Shield size={18} className="text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Classe Armad.</span>
            <input
              type="number"
              min={0}
              value={character.armorClass}
              onChange={(e) => updateCharacter({ armorClass: parseInt(e.target.value, 10) || 10 })}
              className="w-12 text-center font-mono text-xl font-black text-amber-300 bg-transparent focus:outline-none focus:text-amber-100"
            />
          </div>

          {/* Iniciativa */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 flex flex-col items-center justify-between">
            <div className="flex flex-col items-center">
              <Zap size={18} className="text-cyan-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Iniciativa</span>
            </div>
            <button
              onClick={() => onRollInitiative(initiativeTotal)}
              className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/50 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-sm font-mono font-bold transition active:scale-95"
              title="Rolar Iniciativa (d20 + DEX)"
            >
              <span>{formatModifier(initiativeTotal)}</span>
              <Dices size={12} />
            </button>
          </div>

          {/* Deslocamento */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 flex flex-col items-center">
            <Footprints size={18} className="text-emerald-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Deslocamento</span>
            <div className="flex items-center gap-0.5">
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
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-400 flex justify-between items-center px-1">
          <span>Iniciativa: DES ({formatModifier(dexMod)})</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">Bônus:</span>
            <input
              type="number"
              value={character.initiativeBonus || 0}
              onChange={(e) => updateCharacter({ initiativeBonus: parseInt(e.target.value, 10) || 0 })}
              className="w-8 text-center text-[11px] bg-slate-800 rounded border border-slate-700 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* 2. Pontos de Vida (HP) e Cura / Dano Rápido */}
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80">
        <div>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <Heart size={16} className="text-rose-500" />
              Pontos de Vida (PV)
            </h3>
            {character.tempHp > 0 && (
              <span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 rounded-full text-[10px] font-bold">
                +{character.tempHp} Temp
              </span>
            )}
          </div>

          {/* Medidor Numérico de HP */}
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
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative my-2">
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

        {/* Controles de Dano / Cura Rápida */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Qtd"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDamage();
              }}
              className="rpg-input text-xs w-16 text-center font-mono"
            />
            <button
              onClick={handleDamage}
              className="flex-1 rpg-button bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs py-1"
              title="Causar Dano"
            >
              <Minus size={13} />
              Dano
            </button>
            <button
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
              className="rpg-input text-xs w-16 text-center font-mono"
            />
            <button
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
      <div className="rpg-card rounded-xl p-4 flex flex-col justify-between border-slate-700/80">
        <div>
          <h3 className="text-sm font-serif font-bold text-amber-200 mb-3 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Dices size={16} className="text-amber-400" />
              Dados de Vida
            </span>
            <span className="text-xs font-mono text-amber-300">
              {character.hitDice.current} / {character.hitDice.total} {character.hitDice.dieType}
            </span>
          </h3>

          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={onSpendHitDie}
              disabled={character.hitDice.current <= 0}
              className="w-full rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-200 border border-slate-700 hover:border-amber-500/50 disabled:opacity-40 disabled:pointer-events-none text-xs py-2"
            >
              <Sparkles size={14} className="text-amber-400" />
              Gastar 1 Dado de Vida (Curar)
            </button>
          </div>
        </div>

        {/* Salvaguardas contra a Morte (Death Saves) */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif font-bold text-slate-300 flex items-center gap-1.5">
              <Skull size={14} className="text-rose-400" />
              Salvaguardas da Morte
            </span>
            <button
              onClick={() => updateCharacter({ deathSaves: { successes: 0, failures: 0 } })}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
              title="Resetar Salvaguardas"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            {/* Sucessos */}
            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400 font-medium text-[11px]">Sucessos</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDeathSaveSuccess(idx)}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      idx < character.deathSaves.successes
                        ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/40'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Falhas */}
            <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-rose-400 font-medium text-[11px]">Falhas</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDeathSaveFailure(idx)}
                    className={`w-4 h-4 rounded-full border transition-all ${
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
