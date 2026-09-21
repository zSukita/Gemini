import React from 'react';
import type { MapToken } from '../../types/vtt';

interface TokenMarkerProps {
  token: MapToken;
  gridSize: number;
  isActiveTurn: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
}

const CONDITION_ICONS: Record<string, string> = {
  blinded: '👁️',
  charmed: '💖',
  deafened: '🔇',
  frightened: '😱',
  grappled: '✊',
  incapacitated: '😵',
  invisible: '👻',
  paralyzed: '⚡',
  petrified: '🗿',
  poisoned: '🤢',
  prone: '🙇',
  restrained: '🕸️',
  stunned: '💫',
  unconscious: '💀',
};

export const TokenMarker: React.FC<TokenMarkerProps> = ({
  token,
  gridSize,
  isActiveTurn,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  const pixelSize = token.size * gridSize;
  const hpPercent = Math.max(0, Math.min(100, (token.currentHp / (token.maxHp || 1)) * 100));
  const activeConditions = token.conditions || [];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${token.x}px`,
        top: `${token.y}px`,
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        onSelect();
        onDragStart(e);
      }}
      className={`select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-shadow z-20 group`}
    >
      {/* Corpo Circular do Token */}
      <div
        className={`w-[90%] h-[90%] rounded-full flex items-center justify-center font-serif font-black text-slate-950 relative border-2 shadow-2xl transition-transform ${
          isActiveTurn
            ? 'border-amber-400 ring-4 ring-amber-400/50 scale-105 animate-pulse'
            : isSelected
            ? 'border-cyan-400 ring-2 ring-cyan-400/50'
            : 'border-slate-900/80 hover:scale-105'
        }`}
        style={{
          backgroundColor: token.color,
        }}
      >
        {/* Imagem do Avatar ou Iniciais */}
        {token.avatarUrl ? (
          <img
            src={token.avatarUrl}
            alt={token.name}
            className="w-full h-full rounded-full object-cover pointer-events-none select-none"
          />
        ) : (
          <span className="text-sm sm:text-base drop-shadow select-none">
            {token.name.substring(0, 2).toUpperCase()}
          </span>
        )}

        {/* Badges de Condições Ativas (Órbitas ao redor do token) */}
        {activeConditions.length > 0 && (
          <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5 max-w-[40px] pointer-events-none z-30">
            {activeConditions.slice(0, 3).map((cond) => (
              <span
                key={cond}
                className="w-4 h-4 rounded-full bg-slate-950/95 border border-amber-400/80 text-[10px] flex items-center justify-center shadow-lg leading-none"
                title={`Condição: ${cond}`}
              >
                {CONDITION_ICONS[cond] || '⚠️'}
              </span>
            ))}
            {activeConditions.length > 3 && (
              <span className="w-4 h-4 rounded-full bg-slate-950/95 border border-slate-700 text-[9px] font-bold text-amber-300 flex items-center justify-center shadow">
                +{activeConditions.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Indicador de Tocha Acesa */}
        {token.hasTorch && (
          <span 
            className="absolute -bottom-1 -right-1 text-[11px] bg-amber-950/90 border border-amber-500 rounded-full p-0.5 shadow leading-none"
            title="Tocha Acesa (Ilumina 6 metros)"
          >
            🔥
          </span>
        )}

        {/* Mini Barra de Vida no Topo com Rótulo Numérico no Hover */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-10 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-700 shadow">
            <div
              className={`h-full ${
                hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 20 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          {/* Valor numérico de HP (visível no hover ou com token selecionado) */}
          <span className={`text-[9px] font-mono font-bold px-1 rounded bg-slate-950/95 border border-slate-700 text-slate-200 mt-0.5 whitespace-nowrap shadow transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {token.currentHp}/{token.maxHp}
          </span>
        </div>
      </div>

      {/* Nome do Token Abaixo */}
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-slate-200 whitespace-nowrap pointer-events-none shadow">
        {token.name}
      </span>
    </div>
  );
};
