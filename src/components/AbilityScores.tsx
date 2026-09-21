import React from 'react';
import type { Character, AbilityKey } from '../types/dnd5e';
import { ABILITIES } from '../types/dnd5e';
import {
  getAbilityModifier,
  formatModifier,
  getSavingThrowModifier,
  getPassivePerception,
  getPassiveInvestigation,
  getPassiveInsight,
} from '../utils/calculations';
import { Dices, Shield, Eye, Search, Brain } from 'lucide-react';

interface AbilityScoresProps {
  character: Character;
  updateAbility: (key: AbilityKey, updates: { score?: number; saveProficient?: boolean }) => void;
  onRollCheck: (abilityName: string, modifier: number) => void;
  onRollSave: (abilityName: string, modifier: number) => void;
}

export const AbilityScores: React.FC<AbilityScoresProps> = ({
  character,
  updateAbility,
  onRollCheck,
  onRollSave,
}) => {
  const abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const passivePerception = getPassivePerception(character);
  const passiveInvestigation = getPassiveInvestigation(character);
  const passiveInsight = getPassiveInsight(character);

  return (
    <div className="flex flex-col gap-6">
      {/* Grade com os 6 Atributos Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {abilityKeys.map((key) => {
          const def = ABILITIES[key];
          const abilityData = character.abilities[key];
          const score = abilityData?.score ?? 10;
          const mod = getAbilityModifier(score);

          return (
            <div
              key={key}
              className="rpg-card rounded-xl p-3 flex flex-col items-center justify-between border-slate-700/80 hover:border-amber-500/50 transition-all duration-200 group relative"
            >
              {/* Cabeçalho do Atributo */}
              <div className="text-center w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition">
                  {def.name}
                </span>
                <div className="text-xs font-serif font-black text-slate-500">
                  {def.abbr}
                </div>
              </div>

              {/* Modificador Gigante e Clicável para Teste */}
              <button
                onClick={() => onRollCheck(`Teste de ${def.name}`, mod)}
                className="my-2 w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-500/40 hover:border-amber-400 flex flex-col items-center justify-center text-amber-300 hover:text-amber-100 shadow-inner group/mod transition-all duration-150 active:scale-95"
                title={`Clique para rolar Teste de ${def.name} (d20 ${formatModifier(mod)})`}
              >
                <span className="text-2xl font-bold font-mono group-hover/mod:scale-110 transition-transform">
                  {formatModifier(mod)}
                </span>
                <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                  <Dices size={10} /> Rolar
                </span>
              </button>

              {/* Valor Numérico Editável */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-lg px-2 py-0.5 border border-slate-800">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) updateAbility(key, { score: val });
                  }}
                  className="w-8 text-center text-sm font-semibold bg-transparent text-slate-200 focus:outline-none focus:text-amber-400"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção Inferior: Salvaguardas (Testes de Resistência) + Sentidos Passivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Salvaguardas */}
        <div className="rpg-card rounded-xl p-4 border-slate-700/80">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
              <Shield size={16} className="text-amber-400" />
              Salvaguardas (Testes de Resistência)
            </h3>
            <span className="text-[10px] text-slate-400">Marque para proficiência</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {abilityKeys.map((key) => {
              const def = ABILITIES[key];
              const abilityData = character.abilities[key];
              const isProficient = abilityData?.saveProficient ?? false;
              const saveMod = getSavingThrowModifier(character, key);

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isProficient}
                      onChange={(e) => updateAbility(key, { saveProficient: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-300">
                      {def.name}
                    </span>
                  </label>

                  <button
                    onClick={() => onRollSave(`Salvaguarda de ${def.name}`, saveMod)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/50 text-xs font-mono font-bold transition active:scale-95"
                    title={`Rolar Salvaguarda de ${def.name} (d20 ${formatModifier(saveMod)})`}
                  >
                    <span>{formatModifier(saveMod)}</span>
                    <Dices size={12} className="text-slate-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentidos Passivos */}
        <div className="rpg-card rounded-xl p-4 border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                <Eye size={16} className="text-amber-400" />
                Sentidos Passivos
              </h3>
              <span className="text-[10px] text-slate-400">10 + Modificador</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Eye size={14} className="text-emerald-400" />
                  <span>Percepção Passiva (Sabedoria)</span>
                </div>
                <span className="font-mono text-base font-bold text-amber-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                  {passivePerception}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Search size={14} className="text-cyan-400" />
                  <span>Investigação Passiva (Inteligência)</span>
                </div>
                <span className="font-mono text-base font-bold text-amber-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                  {passiveInvestigation}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Brain size={14} className="text-purple-400" />
                  <span>Intuição Passiva (Sabedoria)</span>
                </div>
                <span className="font-mono text-base font-bold text-amber-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                  {passiveInsight}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 italic text-center">
            *Atualizado automaticamente conforme nível e proficiências de perícias.
          </div>
        </div>
      </div>
    </div>
  );
};
