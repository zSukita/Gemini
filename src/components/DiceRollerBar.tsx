import React, { useState } from 'react';
import type { AdvantageMode, DiceRollResult } from '../types/dnd5e';
import { 
  Dices, 
  History, 
  Sparkles, 
  Skull, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lock
} from 'lucide-react';

interface DiceRollerBarProps {
  advantageMode: AdvantageMode;
  setAdvantageMode: (mode: AdvantageMode) => void;
  lastRoll: DiceRollResult | null;
  onRollDie: (sides: number) => void;
  onRollFormula: (formula: string, label: string) => void;
  onOpenHistory: () => void;
  rollCount: number;
  isDiceAnimationEnabled?: boolean;
  onToggleDiceAnimation?: () => void;
  onReplayAnimation?: (roll: DiceRollResult) => void;
  isSecretRoll?: boolean;
  onToggleSecretRoll?: () => void;
}

export const DiceRollerBar = React.memo<DiceRollerBarProps>(({
  advantageMode,
  setAdvantageMode,
  lastRoll,
  onRollDie,
  onRollFormula,
  onOpenHistory,
  rollCount,
  isDiceAnimationEnabled = true,
  onToggleDiceAnimation,
  onReplayAnimation,
  isSecretRoll = false,
  onToggleSecretRoll,
}) => {
  const [customFormula, setCustomFormula] = useState('');

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  const handleCustomRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormula.trim()) return;
    onRollFormula(customFormula.trim(), 'Rolagem Personalizada');
    setCustomFormula('');
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-5xl mx-auto z-40">
      <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Esquerda: Seletor de Vantagem / Desvantagem */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setAdvantageMode('disadvantage')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              advantageMode === 'disadvantage'
                ? 'bg-rose-900/80 text-rose-200 border border-rose-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Rola 2d20 e escolhe o menor resultado"
          >
            <TrendingDown size={13} />
            <span className="text-[11px]">Desvantagem</span>
          </button>

          <button
            type="button"
            onClick={() => setAdvantageMode('normal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              advantageMode === 'normal'
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Minus size={13} />
            <span className="text-[11px]">Normal</span>
          </button>

          <button
            type="button"
            onClick={() => setAdvantageMode('advantage')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              advantageMode === 'advantage'
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Rola 2d20 e escolhe o maior resultado"
          >
            <TrendingUp size={13} />
            <span className="text-[11px]">Vantagem</span>
          </button>
        </div>

        {/* Centro: Botões Rápidos de Dados (d4 a d100) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 max-w-full">
          {diceTypes.map((sides) => {
            const isD20 = sides === 20;
            return (
              <button
                key={sides}
                type="button"
                onClick={() => onRollDie(sides)}
                className={`px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs transition-all active:scale-95 flex items-center gap-1 select-none ${
                  isD20
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title={`Rolar d${sides}`}
              >
                <span>d{sides}</span>
              </button>
            );
          })}
        </div>

        {/* Direita: Fórmula Rápida + Notificação de Último Resultado e Histórico */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Input de Fórmula */}
          <form onSubmit={handleCustomRoll} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Ex: 2d6+4"
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className="rpg-input text-xs w-20 py-1 font-mono text-center placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg transition active:scale-95"
              title="Rolar fórmula"
            >
              <Play size={12} fill="currentColor" />
            </button>
          </form>

          {/* Badge de Último Resultado */}
          {lastRoll && (
            <div
              onClick={() => {
                if (onReplayAnimation) {
                  onReplayAnimation(lastRoll);
                } else {
                  onOpenHistory();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs cursor-pointer transition select-none ${
                lastRoll.isCriticalSuccess
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 animate-bounce'
                  : lastRoll.isCriticalFailure
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
              title="Clique para rever a animação 3D deste resultado"
            >
              {lastRoll.isCriticalSuccess && <Sparkles size={13} className="text-amber-400" />}
              {lastRoll.isCriticalFailure && <Skull size={13} className="text-rose-400" />}
              {!lastRoll.isCriticalSuccess && !lastRoll.isCriticalFailure && <Dices size={13} className="text-slate-400" />}

              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-slate-400 truncate max-w-[80px]">{lastRoll.label}</span>
                <span className="font-mono font-black text-sm">{lastRoll.total}</span>
              </div>
            </div>
          )}

          {/* Alternar Rolagem Oculta / Secreta do Mestre */}
          {onToggleSecretRoll && (
            <button
              type="button"
              onClick={onToggleSecretRoll}
              className={`p-2 rounded-xl border transition ${
                isSecretRoll
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-lg shadow-purple-500/20 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border-slate-700'
              }`}
              title={
                isSecretRoll
                  ? 'Rolagem Oculta ATIVA: Os jogadores não verão o resultado dos seus dados'
                  : 'Rolagem Oculta DESATIVADA: Clique para rolar dados em segredo'
              }
            >
              <Lock size={16} className={isSecretRoll ? 'text-purple-400' : 'text-slate-500'} />
            </button>
          )}

          {/* Alternar Animação 3D de Dados */}
          {onToggleDiceAnimation && (
            <button
              type="button"
              onClick={onToggleDiceAnimation}
              className={`p-2 rounded-xl border transition ${
                isDiceAnimationEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border-slate-700'
              }`}
              title={
                isDiceAnimationEnabled
                  ? 'Animação 3D de dados: Ligada (Clique para desligar)'
                  : 'Animação 3D de dados: Desligada (Clique para ligar)'
              }
            >
              <Dices size={16} className={isDiceAnimationEnabled ? 'text-amber-400' : 'text-slate-500'} />
            </button>
          )}

          {/* Botão de Histórico */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition relative"
            title="Abrir Histórico de Rolagens"
          >
            <History size={16} />
            {rollCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold flex items-center justify-center">
                {rollCount > 99 ? '99+' : rollCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
});
