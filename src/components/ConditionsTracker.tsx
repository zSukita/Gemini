import React, { useState } from 'react';
import { CONDITIONS } from '../data/conditions';
import type { ConditionKey } from '../types/combat';
import { Plus, X, ShieldAlert, HelpCircle } from 'lucide-react';

interface ConditionsTrackerProps {
  activeConditions: string[];
  onToggleCondition: (conditionKey: string) => void;
  onClearConditions?: () => void;
}

export const EXHAUSTION_LEVELS: { level: number; effect: string }[] = [
  { level: 1, effect: 'Desvantagem em todos os testes de habilidade.' },
  { level: 2, effect: 'Deslocamento reduzido pela metade.' },
  { level: 3, effect: 'Desvantagem em jogadas de ataque e salvaguardas.' },
  { level: 4, effect: 'Pontos de Vida máximos reduzidos pela metade.' },
  { level: 5, effect: 'Deslocamento reduzido a 0 metros.' },
  { level: 6, effect: 'Morte imediata do personagem.' },
];

export const ConditionsTracker: React.FC<ConditionsTrackerProps> = ({
  activeConditions = [],
  onToggleCondition,
  onClearConditions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);

  const conditionKeys = Object.keys(CONDITIONS) as ConditionKey[];

  return (
    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-300">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>Condições & Efeitos Ativos</span>
          {activeConditions.length > 0 && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-amber-500/40">
              {activeConditions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {activeConditions.length > 0 && onClearConditions && (
            <button
              type="button"
              onClick={onClearConditions}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition mr-1"
            >
              Limpar Todas
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rpg-button bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs py-0.5 px-2 flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Gerenciar</span>
          </button>
        </div>
      </div>

      {/* Badges de Condições Ativas */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[26px]">
        {activeConditions.length === 0 ? (
          <span className="text-[11px] text-slate-500 italic">
            Nenhuma condição ativa. O herói está plenamente saudável!
          </span>
        ) : (
          activeConditions.map((condKey) => {
            const cond = CONDITIONS[condKey as ConditionKey];
            const isExhaustion = condKey.startsWith('exhaustion-');
            const exhaustLevel = isExhaustion ? parseInt(condKey.split('-')[1], 10) : 0;
            const label = isExhaustion
              ? `Exaustão ${exhaustLevel}`
              : cond?.name || condKey;
            const description = isExhaustion
              ? EXHAUSTION_LEVELS.find((e) => e.level === exhaustLevel)?.effect
              : cond?.description;
            const color = isExhaustion
              ? 'bg-purple-950/90 text-purple-200 border-purple-600'
              : cond?.color || 'bg-slate-800 text-slate-200 border-slate-600';

            return (
              <div
                key={condKey}
                onMouseEnter={() => setHoveredCondition(condKey)}
                onMouseLeave={() => setHoveredCondition(null)}
                className={`relative px-2 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1 shadow transition ${color}`}
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => onToggleCondition(condKey)}
                  className="hover:opacity-75 transition p-0.5"
                  title="Remover condição"
                >
                  <X size={11} />
                </button>

                {/* Tooltip com a regra mecânica exata */}
                {hoveredCondition === condKey && description && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-2 bg-slate-950/95 border border-amber-500/60 rounded-xl text-[11px] font-normal text-slate-200 shadow-2xl z-50 pointer-events-none animate-in fade-in">
                    <div className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                      <HelpCircle size={12} /> {label} (Regra 5e):
                    </div>
                    <p className="leading-snug text-slate-300">{description}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Menu / Modal Flutuante de Seleção de Condições */}
      {isOpen && (
        <div className="mt-2 pt-2 border-t border-slate-800 animate-in fade-in flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Clique para aplicar ou remover condições:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {conditionKeys.map((key) => {
              const cond = CONDITIONS[key];
              const isActive = activeConditions.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleCondition(key)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold text-left border transition flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                  title={cond.description}
                >
                  <span>{cond.name}</span>
                  {isActive && <span className="text-amber-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Exaustão 1 a 6 */}
          <div className="pt-2 border-t border-slate-900 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Níveis de Exaustão (D&D 5e):
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {EXHAUSTION_LEVELS.map((ex) => {
                const exKey = `exhaustion-${ex.level}`;
                const isActive = activeConditions.includes(exKey);

                return (
                  <button
                    key={exKey}
                    type="button"
                    onClick={() => onToggleCondition(exKey)}
                    className={`p-1 rounded text-center text-xs font-bold border transition ${
                      isActive
                        ? 'bg-purple-900 text-purple-200 border-purple-500 font-black'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-purple-300'
                    }`}
                    title={ex.effect}
                  >
                    Nível {ex.level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
