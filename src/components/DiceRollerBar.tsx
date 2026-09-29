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
  Lock,
  AlertTriangle,
  X,
  ChevronUp,
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
  activeConditions?: string[];
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
  activeConditions = [],
}) => {
  const [customFormula, setCustomFormula] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const conditionNames: Record<string, string> = {
    blinded: 'Cego',
    frightened: 'Amedrontado',
    poisoned: 'Envenenado',
    prone: 'Caído',
    restrained: 'Impedido',
  };

  const disadvantageConditions = activeConditions.filter((c) =>
    ['blinded', 'frightened', 'poisoned', 'prone', 'restrained'].includes(c)
  );

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  const handleCustomRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormula.trim()) return;
    onRollFormula(customFormula.trim(), 'Rolagem Personalizada');
    setCustomFormula('');
  };

  return (
    <>
      {/* ─── VERSÃO MOBILE: BOTÃO FLUTUANTE COMPACTO + PAINEL INFERIOR RECOLHÍVEL ─── */}
      <div className="sm:hidden">
        {/* Botão Flutuante Compacto */}
        {!isMobileOpen && (
          <div className="fixed bottom-3 right-3 z-40 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              id="dice-roller-mobile-btn"
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border-2 border-amber-500/70 text-amber-300 shadow-2xl shadow-black/90 backdrop-blur-md transition active:scale-95 cursor-pointer ring-1 ring-amber-500/30 min-h-[44px]"
              title="Abrir mesa de rolagem de dados"
              aria-label="Abrir mesa de rolagem de dados"
            >
              <div className="relative">
                <Dices size={20} className="text-amber-400" />
                {rollCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                    {rollCount > 99 ? '99+' : rollCount}
                  </span>
                )}
              </div>

              <div className="flex flex-col text-left leading-tight pr-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dados</span>
                <span className="text-xs font-mono font-black text-amber-200">
                  {advantageMode === 'advantage' ? 'Vant.' : advantageMode === 'disadvantage' ? 'Desv.' : 'd20'}
                </span>
              </div>

              {lastRoll && (
                <div
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 ${
                    lastRoll.isCriticalSuccess
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                      : lastRoll.isCriticalFailure
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <span>{lastRoll.total}</span>
                </div>
              )}

              <ChevronUp size={16} className="text-slate-400 ml-0.5" />
            </button>
          </div>
        )}

        {/* Painel Inferior Recolhível (Bottom Sheet) */}
        {isMobileOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 animate-in fade-in"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />
            <div 
              role="dialog"
              aria-modal="true"
              aria-label="Mesa de Rolagem de Dados"
              className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/98 border-t-2 border-amber-500/70 rounded-t-3xl shadow-2xl shadow-black p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 ring-1 ring-amber-500/20"
            >
              {/* Alça e Cabeçalho do Painel */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Dices size={18} className="text-amber-400" />
                  <h3 className="font-serif font-black text-sm text-amber-200 tracking-wide">
                    Rolagem de Dados
                  </h3>
                </div>
                <button
                  id="dice-roller-close-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileOpen(false);
                  }}
                  aria-label="Recolher painel de dados"
                  className="p-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-semibold active:scale-95 min-h-[36px] cursor-pointer"
                >
                  <X size={15} />
                  <span>Fechar</span>
                </button>
              </div>

              {/* Alerta de Condições que impõem Desvantagem */}
              {disadvantageConditions.length > 0 && (
                <div 
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (advantageMode !== 'disadvantage') setAdvantageMode('disadvantage');
                    }
                  }}
                  onClick={() => {
                    if (advantageMode !== 'disadvantage') setAdvantageMode('disadvantage');
                  }}
                  className={`mb-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    advantageMode === 'disadvantage'
                      ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                      : 'bg-amber-950/70 border-amber-500/50 text-amber-200 cursor-pointer animate-pulse'
                  }`}
                >
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">Condição: {disadvantageConditions.map((c) => conditionNames[c] || c).join(', ')}</span>
                  {advantageMode !== 'disadvantage' && (
                    <span className="underline ml-auto font-bold text-amber-300 shrink-0">Aplicar</span>
                  )}
                </div>
              )}

              {/* Seletor 3-way Vantagem */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 mb-3">
                <button
                  type="button"
                  onClick={() => setAdvantageMode('disadvantage')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                    advantageMode === 'disadvantage'
                      ? 'bg-rose-900/90 text-rose-200 border border-rose-500 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>Desvantagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdvantageMode('normal')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                    advantageMode === 'normal'
                      ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Minus size={14} />
                  <span>Normal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdvantageMode('advantage')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                    advantageMode === 'advantage'
                      ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Vantagem</span>
                </button>
              </div>

              {/* Grid de Dados Rápidos (d4 a d100) */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {diceTypes.map((sides) => {
                  const isD20 = sides === 20;
                  return (
                    <button
                      key={sides}
                      type="button"
                      onClick={() => onRollDie(sides)}
                      className={`py-2.5 rounded-xl font-mono font-black text-sm transition active:scale-95 flex items-center justify-center select-none shadow-sm min-h-[44px] ${
                        isD20
                          ? 'col-span-2 bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 border-2 border-amber-400 shadow-amber-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <span>d{sides}</span>
                    </button>
                  );
                })}
              </div>

              {/* Linha de Fórmula e Controles Auxiliares */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                {/* Input de Fórmula */}
                <form onSubmit={handleCustomRoll} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Fórmula (ex: 2d6+4)"
                    value={customFormula}
                    onChange={(e) => setCustomFormula(e.target.value)}
                    className="rpg-input text-xs flex-1 py-2 font-mono text-center placeholder:text-slate-600 rounded-xl min-h-[42px]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 shrink-0 min-h-[42px]"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Rolar</span>
                  </button>
                </form>

                {/* Ações Secundárias em Linha */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {onToggleSecretRoll && (
                    <button
                      type="button"
                      onClick={onToggleSecretRoll}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                        isSecretRoll
                          ? 'bg-purple-950/80 text-purple-300 border-purple-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Lock size={14} className={isSecretRoll ? 'text-purple-400' : 'text-slate-500'} />
                      <span className="truncate">{isSecretRoll ? 'Oculta ON' : 'Oculta'}</span>
                    </button>
                  )}

                  {onToggleDiceAnimation && (
                    <button
                      type="button"
                      onClick={onToggleDiceAnimation}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
                        isDiceAnimationEnabled
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Dices size={14} className={isDiceAnimationEnabled ? 'text-amber-400' : 'text-slate-500'} />
                      <span className="truncate">{isDiceAnimationEnabled ? '3D ON' : '3D OFF'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileOpen(false);
                      onOpenHistory();
                    }}
                    className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 relative min-h-[40px]"
                  >
                    <History size={14} />
                    <span>Histórico</span>
                    {rollCount > 0 && (
                      <span className="w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                        {rollCount > 99 ? '99+' : rollCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Badge de Último Resultado */}
                {lastRoll && (
                  <div
                    onClick={() => {
                      if (onReplayAnimation) {
                        onReplayAnimation(lastRoll);
                      } else {
                        setIsMobileOpen(false);
                        onOpenHistory();
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition select-none ${
                      lastRoll.isCriticalSuccess
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : lastRoll.isCriticalFailure
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {lastRoll.isCriticalSuccess && <Sparkles size={14} className="text-amber-400" />}
                      {lastRoll.isCriticalFailure && <Skull size={14} className="text-rose-400" />}
                      {!lastRoll.isCriticalSuccess && !lastRoll.isCriticalFailure && <Dices size={14} className="text-slate-400" />}
                      <span className="font-semibold text-slate-300 truncate max-w-[170px]">{lastRoll.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Total:</span>
                      <span className="font-mono font-black text-base text-amber-300">{lastRoll.total}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── VERSÃO DESKTOP: BARRA FLUTUANTE HORIZONTAL COMPLETA ─── */}
      <div id="dice-roller-desktop-bar" className="hidden sm:block fixed bottom-3 left-6 right-6 max-w-5xl mx-auto z-40 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80 flex flex-row items-center justify-between gap-2.5">
          
          {/* Esquerda: Seletor de Vantagem / Desvantagem */}
          <div className="flex flex-row items-center gap-1.5">
            {disadvantageConditions.length > 0 && (
              <div 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (advantageMode !== 'disadvantage') setAdvantageMode('disadvantage');
                  }
                }}
                onClick={() => {
                  if (advantageMode !== 'disadvantage') setAdvantageMode('disadvantage');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition ${
                  advantageMode === 'disadvantage'
                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                    : 'bg-amber-950/70 border-amber-500/50 text-amber-200 animate-pulse cursor-pointer hover:bg-amber-900/60'
                }`}
                title="Clique para aplicar Desvantagem automática segundo as regras de D&D 5e"
              >
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <span>Condição: {disadvantageConditions.map((c) => conditionNames[c] || c).join(', ')}</span>
                {advantageMode !== 'disadvantage' && (
                  <span className="underline ml-0.5 font-bold text-amber-300">Aplicar</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 justify-center">
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
          <div className="flex items-center gap-2 justify-end">
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
    </>
  );
});

