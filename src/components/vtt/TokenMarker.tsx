import React, { useState, useEffect } from 'react';
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
  cego: '👁️',
  charmed: '💖',
  enfeitiçado: '💖',
  deafened: '🔇',
  surdo: '🔇',
  frightened: '😱',
  amedrontado: '😱',
  grappled: '✊',
  agarrado: '✊',
  incapacitated: '😵',
  incapacitado: '😵',
  invisible: '👻',
  invisível: '👻',
  paralyzed: '⚡',
  paralisado: '⚡',
  petrified: '🗿',
  petrificado: '🗿',
  poisoned: '🧪',
  envenenado: '🧪',
  prone: '🛡️',
  caído: '🛡️',
  restrained: '🕸️',
  impedido: '🕸️',
  stunned: '💫',
  atordoado: '💫',
  unconscious: '💀',
  inconsciente: '💀',
  exhaustion: '💤',
  exaustão: '💤',
};

export const TokenMarker: React.FC<TokenMarkerProps> = ({
  token,
  gridSize,
  isActiveTurn,
  isSelected,
  onSelect,
  onDragStart,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [token.avatarUrl]);

  const pixelSize = token.size * gridSize;
  const tokenDiameter = pixelSize * 0.9;
  const ringRadius = Math.max(10, tokenDiameter / 2 - 2);
  const ringCircumference = 2 * Math.PI * ringRadius;
  const hpPercent = Math.max(0, Math.min(100, (token.currentHp / (token.maxHp || 1)) * 100));
  const strokeOffset = ringCircumference - (hpPercent / 100) * ringCircumference;
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
        {/* Anel de Vida Circular SVG (Health Ring) */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none select-none z-10"
          viewBox={`0 0 ${tokenDiameter} ${tokenDiameter}`}
        >
          <circle
            cx={tokenDiameter / 2}
            cy={tokenDiameter / 2}
            r={ringRadius}
            fill="none"
            stroke="#090d16"
            strokeWidth="3"
            strokeOpacity="0.65"
          />
          <circle
            cx={tokenDiameter / 2}
            cy={tokenDiameter / 2}
            r={ringRadius}
            fill="none"
            stroke={hpPercent > 50 ? '#10b981' : hpPercent > 20 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3"
            strokeDasharray={ringCircumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        {/* Imagem do Avatar ou Iniciais */}
        {token.avatarUrl && !imgError ? (
          <img
            src={token.avatarUrl}
            alt={token.name}
            onError={() => setImgError(true)}
            className="w-full h-full rounded-full object-cover pointer-events-none select-none"
          />
        ) : (
          <span className="text-sm sm:text-base drop-shadow select-none">
            {token.name.substring(0, 2).toUpperCase()}
          </span>
        )}

        {/* Indicador D&D 5e: Turno Ativo */}
        {isActiveTurn && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded-full shadow-lg border border-amber-300 animate-bounce pointer-events-none whitespace-nowrap">
            Turno
          </div>
        )}

        {/* Badges de Condições Ativas (Órbitas ao redor do token) */}
        {activeConditions.length > 0 && (
          <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5 max-w-[44px] pointer-events-none z-30">
            {activeConditions.slice(0, 3).map((cond) => {
              const lower = cond.toLowerCase();
              return (
                <span
                  key={cond}
                  className="w-4 h-4 rounded-full bg-slate-950/95 border border-amber-400/80 text-[10px] flex items-center justify-center shadow-lg leading-none"
                  title={`Condição: ${cond}`}
                >
                  {CONDITION_ICONS[lower] || '⚠️'}
                </span>
              );
            })}
            {activeConditions.length > 3 && (
              <span className="w-4 h-4 rounded-full bg-slate-950/95 border border-slate-700 text-[9px] font-bold text-amber-300 flex items-center justify-center shadow">
                +{activeConditions.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Marcador de Derrotado (0 PV) */}
        {token.currentHp <= 0 && (
          <span 
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full text-base z-30 pointer-events-none select-none"
            title="Derrotado (0 PV)"
          >
            💀
          </span>
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

        {/* Rótulo Numérico de HP no Topo (O anel circular SVG já funciona como barra de vida visual) */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-950/95 border border-slate-700 whitespace-nowrap shadow-md transition-opacity ${
              token.currentHp <= 0
                ? 'text-rose-400 border-rose-800'
                : hpPercent > 50
                ? 'text-emerald-300 border-emerald-800/80'
                : hpPercent > 20
                ? 'text-amber-300 border-amber-800/80'
                : 'text-rose-300 border-rose-800/80'
            } ${
              isSelected || token.currentHp < (token.maxHp || 1) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
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
