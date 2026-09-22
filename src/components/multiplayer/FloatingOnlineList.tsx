import React, { useState } from 'react';
import type { PeerUser } from '../../types/vtt';
import { 
  Users, 
  Crown, 
  User, 
  Copy, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink 
} from 'lucide-react';

interface FloatingOnlineListProps {
  isVisible: boolean;
  roomCode: string;
  connectedPeers: PeerUser[];
  currentUserName?: string;
  isHost: boolean;
  onUnpin: () => void;
  onOpenModal?: () => void;
}

export const FloatingOnlineList: React.FC<FloatingOnlineListProps> = ({
  isVisible,
  roomCode,
  connectedPeers,
  currentUserName,
  isHost,
  onUnpin,
  onOpenModal,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isVisible) return null;

  const totalOnline = connectedPeers.length + 1;

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed bottom-16 right-4 z-40 animate-in slide-in-from-bottom-3 duration-200 select-none">
      <div className="bg-slate-950/95 border border-amber-500/40 rounded-xl shadow-2xl backdrop-blur-md text-slate-200 w-64 overflow-hidden flex flex-col">
        {/* Cabeçalho do Card Flutuante */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-amber-400" />
              <span className="text-xs font-serif font-bold text-amber-200">
                Online ({totalOnline})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition"
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              type="button"
              onClick={onUnpin}
              className="text-slate-400 hover:text-rose-300 p-0.5 rounded hover:bg-slate-800 transition"
              title="Desafixar lista da tela"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Conteúdo Expansível */}
        {!isMinimized && (
          <div className="p-2.5 flex flex-col gap-2">
            {/* Código da Sala e Link */}
            <div className="flex items-center justify-between bg-slate-900/70 px-2 py-1.5 rounded-lg border border-slate-800 text-[11px]">
              <span className="font-mono text-amber-300 font-bold">{roomCode}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[10px] text-slate-300 hover:text-amber-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
                title="Copiar link de convite"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Lista dos Jogadores Conectados */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
              {/* Usuário Local */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  {isHost ? (
                    <Crown size={12} className="text-amber-400 shrink-0" />
                  ) : (
                    <User size={12} className="text-cyan-400 shrink-0" />
                  )}
                  <span className="font-semibold truncate text-slate-100">
                    {currentUserName || 'Você'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">(Você)</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />
              </div>

              {/* Demais Usuários Conectados via WebRTC */}
              {connectedPeers.map((peer, idx) => {
                const isPeerHost = peer.role === 'dm';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isPeerHost ? (
                        <Crown size={12} className="text-amber-400 shrink-0" />
                      ) : (
                        <User size={12} className="text-cyan-400 shrink-0" />
                      )}
                      <span className="font-semibold truncate text-slate-200">
                        {peer.name}
                      </span>
                      <span className={`text-[9px] uppercase font-bold shrink-0 ${
                        isPeerHost ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {isPeerHost ? '(Mestre)' : '(Jogador)'}
                      </span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />
                  </div>
                );
              })}
            </div>

            {/* Botão de Atalho para Abrir a Central da Sala */}
            {onOpenModal && (
              <button
                type="button"
                onClick={onOpenModal}
                className="w-full text-center text-[10px] text-amber-300/80 hover:text-amber-200 py-1 rounded bg-slate-900/80 hover:bg-slate-800 transition flex items-center justify-center gap-1"
              >
                <ExternalLink size={10} />
                <span>Abrir Chat & Detalhes da Mesa</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
