import React, { useState, useRef, useEffect } from 'react';
import { 
  Wifi, 
  Users, 
  Crown, 
  User, 
  Copy, 
  Check, 
  ChevronDown, 
  Pin, 
  PinOff, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import type { PeerUser } from '../../types/vtt';

interface RoomBadgeProps {
  isConnected: boolean;
  roomCode: string;
  peersCount: number;
  connectedPeers?: PeerUser[];
  currentUserName?: string;
  isHost?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onClick: () => void;
  onOpenTabletop?: () => void;
}

export const RoomBadge: React.FC<RoomBadgeProps> = ({
  isConnected,
  roomCode,
  peersCount,
  connectedPeers = [],
  currentUserName,
  isHost = false,
  isPinned = false,
  onTogglePin,
  onClick,
  onOpenTabletop,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Se não estiver conectado, apenas abre o modal de criação/conexão
  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all select-none bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600"
        title="Clique para jogar online com amigos (Modo Cooperativo com IA ou Humano)"
      >
        <Wifi size={13} className="text-slate-400" />
        <span>Mesa Online</span>
      </button>
    );
  }

  const totalOnline = peersCount + 1;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Badge Conectado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all select-none shadow-md shadow-emerald-500/10 ${
          isOpen
            ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200'
            : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
        }`}
        title="Clique para ver quem está online na mesa"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-mono font-bold">{roomCode}</span>
        <span className="text-[10px] text-emerald-400 font-normal">({totalOnline} online)</span>
        <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Menu Suspenso da Lista de Pessoas Online */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-72 bg-slate-950/95 border border-amber-500/40 rounded-xl shadow-2xl backdrop-blur-md p-3 z-50 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
          
          {/* Topo do Popover: Código da Sala e Copiar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-serif font-bold text-amber-200">Mesa Online Conectada</span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 transition flex items-center gap-1"
              title="Copiar link de convite"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>

          {/* Lista de Quem Está Online */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-serif font-bold text-slate-300 mb-1.5">
              <div className="flex items-center gap-1">
                <Users size={12} className="text-amber-400" />
                <span>Pessoas na Mesa ({totalOnline})</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono">● Em tempo real</span>
            </div>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {/* Você (Jogador Local) */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  {isHost ? (
                    <Crown size={13} className="text-amber-400 shrink-0" />
                  ) : (
                    <User size={13} className="text-cyan-400 shrink-0" />
                  )}
                  <span className="font-bold text-slate-100 truncate">
                    {currentUserName || 'Você'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">(Você)</span>
                </div>
                <span className={`text-[9px] uppercase font-bold shrink-0 ${
                  isHost ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {isHost ? 'Mestre' : 'Jogador'}
                </span>
              </div>

              {/* Demais Participantes Conectados via WebRTC */}
              {connectedPeers.map((peer, idx) => {
                const isPeerHost = peer.role === 'dm';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isPeerHost ? (
                        <Crown size={13} className="text-amber-400 shrink-0" />
                      ) : (
                        <User size={13} className="text-cyan-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200 truncate">
                        {peer.name}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase font-bold shrink-0 ${
                      isPeerHost ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {isPeerHost ? 'Mestre' : 'Jogador'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação do Popover */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
            {/* Opção Fixar Lista na Tela */}
            {onTogglePin && (
              <button
                type="button"
                onClick={() => {
                  onTogglePin();
                  setIsOpen(false);
                }}
                className={`w-full text-xs py-1 px-2 rounded-lg border transition flex items-center justify-center gap-1.5 ${
                  isPinned
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                <span>{isPinned ? 'Desafixar Lista da Tela' : '📌 Fixar Lista na Tela'}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              {onOpenTabletop && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTabletop();
                    setIsOpen(false);
                  }}
                  className="flex-1 text-xs py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition flex items-center justify-center gap-1"
                >
                  <Play size={11} className="fill-slate-950" />
                  <span>Ir ao Mapa</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClick();
                  setIsOpen(false);
                }}
                className="flex-1 text-xs py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1"
              >
                <ExternalLink size={11} />
                <span>Central da Mesa</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
