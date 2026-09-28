import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DiceRollResult } from '../types/dnd5e';
import {
  playDiceRattle,
  playDiceImpact,
  isDiceSoundMuted,
  toggleDiceSound,
} from '../utils/diceSound';
import { Volume2, VolumeX, X, RotateCcw, Sparkles, Skull } from 'lucide-react';

interface DiceRollAnimationProps {
  roll: DiceRollResult | null;
  onClose: () => void;
  onReroll?: () => void;
}

export const DiceRollAnimation: React.FC<DiceRollAnimationProps> = ({
  roll,
  onClose,
  onReroll,
}) => {
  const [phase, setPhase] = useState<'rolling' | 'settled'>('rolling');
  const [displayNumber, setDisplayNumber] = useState<number>(20);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => isDiceSoundMuted());

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const lastAnimatedRollIdRef = useRef<string | null>(null);

  const isCritSuccess = Boolean(roll?.isCriticalSuccess);
  const isCritFail = Boolean(roll?.isCriticalFailure);
  const rollSignature = roll ? `${roll.id || ''}_${roll.total}_${roll.breakdown}_${roll.timestamp || ''}` : null;

  // Inicializa e executa a sequência de animação toda vez que um novo roll chega
  useEffect(() => {
    if (!roll || !rollSignature) return;
    if (lastAnimatedRollIdRef.current === rollSignature) return;
    lastAnimatedRollIdRef.current = rollSignature;

    setPhase('rolling');
    playDiceRattle();

    // Determina o valor máximo do dado para o ticker de números
    const match = roll.dieType.match(/d(\d+)/i);
    const maxSides = match ? parseInt(match[1], 10) : 20;

    // Ticker rápido de números enquanto o dado gira em 3D
    const tickerInterval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * maxSides) + 1);
    }, 45);

    // Momento do impacto na mesa (850ms)
    const impactTimer = setTimeout(() => {
      clearInterval(tickerInterval);
      setDisplayNumber(roll.selectedRoll);
      setPhase('settled');
      playDiceImpact(isCritSuccess, isCritFail);
    }, 850);

    // Auto fechar suavemente após 3.2 segundos
    const autoCloseTimer = setTimeout(() => {
      onCloseRef.current();
    }, 3200);

    return () => {
      clearInterval(tickerInterval);
      clearTimeout(impactTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [roll, rollSignature, isCritSuccess, isCritFail]);

  // Atalho de teclado: Espaço ou Esc fecha imediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleDiceSound();
    setSoundMuted(next);
  }, []);

  if (!roll) return null;

  // Renderizador de Geometria de Dados Poliédricos 3D
  const renderDieShape = (dieType: string, facetColor: string, facetBorder: string) => {
    const lower = dieType.toLowerCase();
    if (lower === 'd4') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
          <polygon points="50,8 94,84 6,84" fill={facetColor} stroke={facetBorder} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50,8 50,56 6,84" fill="#000" opacity="0.22" />
          <polygon points="50,8 50,56 94,84" fill="#fff" opacity="0.18" />
          <polygon points="6,84 50,56 94,84" fill="#000" opacity="0.32" />
          <line x1="50" y1="8" x2="50" y2="56" stroke={facetBorder} strokeWidth="2" />
          <line x1="6" y1="84" x2="50" y2="56" stroke={facetBorder} strokeWidth="2" />
          <line x1="94" y1="84" x2="50" y2="56" stroke={facetBorder} strokeWidth="2" />
        </svg>
      );
    }

    if (lower === 'd6') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
          <polygon points="50,10 88,32 50,54 12,32" fill={facetColor} stroke={facetBorder} strokeWidth="2" strokeLinejoin="round" filter="brightness(1.18)" />
          <polygon points="12,32 50,54 50,94 12,72" fill={facetColor} stroke={facetBorder} strokeWidth="2" strokeLinejoin="round" filter="brightness(0.85)" />
          <polygon points="88,32 50,54 50,94 88,72" fill={facetColor} stroke={facetBorder} strokeWidth="2" strokeLinejoin="round" filter="brightness(0.68)" />
          <polygon points="50,10 88,32 50,54 12,32" fill="#fff" opacity="0.12" />
        </svg>
      );
    }

    if (lower === 'd8') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
          <polygon points="50,6 92,50 50,94 8,50" fill={facetColor} stroke={facetBorder} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50,6 8,50 50,50" fill="#fff" opacity="0.16" />
          <polygon points="50,6 92,50 50,50" fill="#fff" opacity="0.25" />
          <polygon points="8,50 50,94 50,50" fill="#000" opacity="0.28" />
          <polygon points="92,50 50,94 50,50" fill="#000" opacity="0.38" />
          <line x1="50" y1="6" x2="50" y2="94" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="8" y1="50" x2="92" y2="50" stroke={facetBorder} strokeWidth="1.8" />
        </svg>
      );
    }

    if (lower === 'd10' || lower === 'd100') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
          <polygon points="50,6 92,44 76,88 50,96 24,88 8,44" fill={facetColor} stroke={facetBorder} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50,6 8,44 50,58" fill="#fff" opacity="0.2" />
          <polygon points="50,6 92,44 50,58" fill="#fff" opacity="0.3" />
          <polygon points="8,44 24,88 50,58" fill="#000" opacity="0.25" />
          <polygon points="92,44 76,88 50,58" fill="#000" opacity="0.32" />
          <polygon points="24,88 50,96 76,88 50,58" fill="#000" opacity="0.4" />
          <line x1="50" y1="6" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="8" y1="44" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="92" y1="44" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="24" y1="88" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="76" y1="88" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
          <line x1="50" y1="96" x2="50" y2="58" stroke={facetBorder} strokeWidth="1.8" />
        </svg>
      );
    }

    if (lower === 'd12') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
          <polygon points="50,6 78,16 95,40 92,70 72,92 50,96 28,92 8,70 5,40 22,16" fill={facetColor} stroke={facetBorder} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50,28 75,46 65,74 35,74 25,46" fill={facetColor} stroke={facetBorder} strokeWidth="2" strokeLinejoin="round" filter="brightness(1.15)" />
          <polygon points="50,6 78,16 75,46 50,28" fill="#fff" opacity="0.22" />
          <polygon points="50,6 22,16 25,46 50,28" fill="#fff" opacity="0.14" />
          <polygon points="78,16 95,40 92,70 75,46" fill="#000" opacity="0.18" />
          <polygon points="22,16 5,40 8,70 25,46" fill="#000" opacity="0.28" />
          <polygon points="75,46 92,70 72,92 65,74" fill="#000" opacity="0.35" />
          <polygon points="25,46 8,70 28,92 35,74" fill="#000" opacity="0.38" />
          <polygon points="35,74 65,74 72,92 50,96 28,92" fill="#000" opacity="0.45" />
        </svg>
      );
    }

    // Padrão d20 Icosaedro
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="facetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={facetBorder} stopOpacity="0.9" />
            <stop offset="100%" stopColor={facetColor} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="facetGrad2" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={facetColor} stroke={facetBorder} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="50,4 8,27 28,50" fill="#000" opacity="0.18" />
        <polygon points="50,4 92,27 72,50" fill="#fff" opacity="0.22" />
        <polygon points="8,73 50,96 28,50" fill="#000" opacity="0.35" />
        <polygon points="92,73 50,96 72,50" fill="#000" opacity="0.28" />
        <polygon points="50,22 80,72 20,72" fill="url(#facetGrad1)" stroke={facetBorder} strokeWidth="2" strokeLinejoin="round" />
        <polygon points="50,22 80,72 20,72" fill="url(#facetGrad2)" />
        <line x1="50" y1="4" x2="50" y2="22" stroke={facetBorder} strokeWidth="1.8" />
        <line x1="8" y1="27" x2="20" y2="72" stroke={facetBorder} strokeWidth="1.8" />
        <line x1="92" y1="27" x2="80" y2="72" stroke={facetBorder} strokeWidth="1.8" />
        <line x1="8" y1="73" x2="20" y2="72" stroke={facetBorder} strokeWidth="1.8" />
        <line x1="92" y1="73" x2="80" y2="72" stroke={facetBorder} strokeWidth="1.8" />
        <line x1="50" y1="96" x2="50" y2="72" stroke={facetBorder} strokeWidth="1.8" />
      </svg>
    );
  };

  // Renderizador de Face Facetada de Dado Poliédrico 3D
  const renderPolyhedron = (value: number, isWinner = true, isDiscarded = false) => {
    let themeGlow = 'from-amber-600 via-amber-700 to-amber-950 border-amber-400/80 shadow-amber-500/30';
    let facetColor = '#d97706';
    let facetBorder = '#fef08a';

    if (isCritSuccess) {
      themeGlow = 'from-yellow-400 via-amber-500 to-yellow-700 border-yellow-200 shadow-yellow-400/60 ring-4 ring-yellow-400/40';
      facetColor = '#eab308';
      facetBorder = '#fef9c3';
    } else if (isCritFail) {
      themeGlow = 'from-rose-700 via-red-900 to-rose-950 border-red-500 shadow-red-700/50 ring-4 ring-red-600/30';
      facetColor = '#991b1b';
      facetBorder = '#fca5a5';
    }

    const sparkAngles = [0, 25, 50, 75, 100, 130, 160, 190, 220, 250, 280, 310, 335];

    return (
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ${
          isDiscarded ? 'opacity-35 grayscale scale-90' : ''
        }`}
      >
        {/* Sombra Dinâmica 3D no chão */}
        <div
          className={`absolute -bottom-8 w-24 h-6 rounded-full bg-black/60 blur-md transition-all duration-300 ${
            phase === 'rolling' ? 'scale-75 opacity-40 translate-y-4' : 'scale-110 opacity-90'
          }`}
        />

        {/* Onda de Choque do Impacto ao Bater na Mesa */}
        {phase === 'settled' && isWinner && (
          <div
            className={`absolute w-32 h-32 rounded-full border-2 pointer-events-none animate-shockwave ${
              isCritSuccess
                ? 'border-amber-400'
                : isCritFail
                ? 'border-rose-500'
                : 'border-amber-500/50'
            }`}
          />
        )}

        {/* Fagulhas / Partículas Mágicas ao Impactar */}
        {phase === 'settled' && isWinner && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {sparkAngles.map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const dist = 45 + (i % 3) * 15;
              const tx = `${Math.round(Math.cos(rad) * dist)}px`;
              const ty = `${Math.round(Math.sin(rad) * dist)}px`;
              return (
                <div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full animate-spark ${
                    isCritSuccess
                      ? 'bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.9)]'
                      : isCritFail
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  }`}
                  style={
                    {
                      '--tx': tx,
                      '--ty': ty,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        )}

        {/* Corpo do Dado Poliédrico 3D */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center select-none rounded-2xl ${themeGlow} ${
            phase === 'rolling'
              ? 'animate-dice-tumble'
              : phase === 'settled' && isCritFail
              ? 'animate-crit-fail'
              : 'animate-dice-impact'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {renderDieShape(roll.dieType, facetColor, facetBorder)}

          {/* Número Central com Tipografia Épica */}
          <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
            <span
              className={`font-serif font-black tracking-tighter transition-all ${
                isCritSuccess
                  ? 'text-4xl text-yellow-100 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] animate-pulse'
                  : isCritFail
                  ? 'text-4xl text-rose-200 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                  : 'text-3xl text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
              }`}
            >
              {value}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const hasMultipleRolls = roll.rolls && roll.rolls.length > 1;

  return (
    <div
      role="dialog"
      aria-label="Animação de Rolagem de Dados"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Feixes de Luz Dourados Girando para Acerto Crítico */}
      {isCritSuccess && phase === 'settled' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div
            className="w-[600px] h-[600px] rounded-full opacity-30 animate-ray-spin"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(251, 191, 36, 0.4) 30deg, transparent 60deg, rgba(251, 191, 36, 0.4) 90deg, transparent 120deg, rgba(251, 191, 36, 0.4) 150deg, transparent 180deg, rgba(251, 191, 36, 0.4) 210deg, transparent 240deg, rgba(251, 191, 36, 0.4) 270deg, transparent 300deg, rgba(251, 191, 36, 0.4) 330deg, transparent 360deg)',
            }}
          />
        </div>
      )}

      {/* Caixa Central da Animação */}
      <div
        className="relative max-w-md w-full mx-4 p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl shadow-black/80 flex flex-col items-center gap-5 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Controles Superiores (Som e Fechar) */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
            title={soundMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
          >
            {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-amber-400" />}
            <span className="text-[11px]">{soundMuted ? 'Mudo' : 'Som Ligado'}</span>
          </button>

          <span className="font-mono text-[11px] uppercase tracking-wider text-amber-500/90 font-bold">
            {roll.dieType.toUpperCase()} • {roll.timestamp}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Fechar (Esc ou Espaço)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Título da Rolagem */}
        <div className="flex flex-col items-center">
          <h3 className="font-serif text-lg font-bold text-amber-200 tracking-wide">
            {roll.label}
          </h3>

          {/* Badges de Modo de Vantagem / Desvantagem */}
          {roll.advantageMode === 'advantage' && (
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-full mt-1">
              Com Vantagem (Maior Resultado)
            </span>
          )}
          {roll.advantageMode === 'disadvantage' && (
            <span className="text-[11px] text-rose-400 font-bold bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded-full mt-1">
              Com Desvantagem (Menor Resultado)
            </span>
          )}
        </div>

        {/* Área Central: Exibição dos Dados 3D */}
        <div className="py-4 flex items-center justify-center gap-6 min-h-[140px]">
          {hasMultipleRolls ? (
            // Rolagem com Vantagem ou Desvantagem (2 dados lado a lado)
            <div className="flex items-center gap-5">
              {roll.rolls.map((r, idx) => {
                const isWinner = r === roll.selectedRoll;
                const isDiscarded = phase === 'settled' && !isWinner;
                const currentVal = phase === 'rolling' ? displayNumber : r;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    {renderPolyhedron(currentVal, isWinner, isDiscarded)}
                    {phase === 'settled' && (
                      <span
                        className={`text-[11px] font-bold ${
                          isWinner ? 'text-emerald-400' : 'text-slate-500 line-through'
                        }`}
                      >
                        {isWinner ? 'Escolhido' : 'Descartado'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Rolagem de Dado Único
            renderPolyhedron(
              phase === 'rolling' ? displayNumber : roll.selectedRoll,
              true,
              false
            )
          )}
        </div>

        {/* Notificação Especial de Acerto ou Falha Crítica */}
        {phase === 'settled' && isCritSuccess && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 border border-yellow-400/80 px-4 py-1.5 rounded-full animate-bounce">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="font-serif font-black tracking-wider text-xs uppercase text-yellow-200">
              Acerto Crítico! (20 Natural)
            </span>
            <Sparkles size={16} className="text-yellow-300" />
          </div>
        )}

        {phase === 'settled' && isCritFail && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-rose-950/60 via-red-900/70 to-rose-950/60 border border-red-500/80 px-4 py-1.5 rounded-full">
            <Skull size={16} className="text-rose-400" />
            <span className="font-serif font-black tracking-wider text-xs uppercase text-rose-200">
              Falha Crítica! (1 Natural)
            </span>
            <Skull size={16} className="text-rose-400" />
          </div>
        )}

        {/* Placa de Resultado Final e Detalhamento */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">Total:</span>
            <span
              className={`font-serif text-3xl font-black ${
                isCritSuccess
                  ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]'
                  : isCritFail
                  ? 'text-rose-400'
                  : 'text-amber-300'
              }`}
            >
              {phase === 'rolling' ? '...' : roll.total}
            </span>
          </div>

          <p className="font-mono text-xs text-slate-400">
            {phase === 'rolling' ? 'Rolando os dados...' : roll.breakdown}
          </p>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="flex items-center gap-3 w-full justify-center">
          {onReroll && (
            <button
              type="button"
              onClick={onReroll}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-lg border border-slate-700"
            >
              <RotateCcw size={13} className="text-amber-400" />
              <span>Rolar Novamente</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-4 rounded-lg shadow"
          >
            <span>Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
