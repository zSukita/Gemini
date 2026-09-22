import React from 'react';
import { Swords, X, Shield, Users } from 'lucide-react';
import type { GameInvite } from '../../firebase/presenceAndFriends';

interface GameInviteModalProps {
  invites: GameInvite[];
  onAccept: (invite: GameInvite) => void;
  onDecline: (inviteId: string) => void;
}

export const GameInviteModal: React.FC<GameInviteModalProps> = ({
  invites,
  onAccept,
  onDecline,
}) => {
  if (!invites || invites.length === 0) return null;

  const currentInvite = invites[0];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-950/95 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 backdrop-blur-md flex flex-col gap-3 text-slate-100 shadow-amber-500/20">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow shrink-0">
              <Swords size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-amber-200">
                Convite de Jogo Recebido!
              </h3>
              <span className="text-[10px] text-slate-400">
                Um amigo chamou você para uma sessão de RPG
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDecline(currentInvite.id)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            title="Ignorar convite"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensagem e Detalhes */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 font-bold shrink-0">
            <Users size={18} />
          </div>

          <div className="flex-1">
            <p className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-amber-300 font-serif font-bold text-sm">
                {currentInvite.fromUserName}
              </strong>{' '}
              está te chamando para jogar na mesa online!
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Código da Sala:</span>
              <span className="font-mono text-xs font-black text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {currentInvite.roomCode}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onAccept(currentInvite)}
            className="rpg-button flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs py-2 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <Shield size={14} className="fill-slate-950" />
            <span>Aceitar & Entrar na Mesa</span>
          </button>

          <button
            type="button"
            onClick={() => onDecline(currentInvite.id)}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 text-xs py-2 px-3 flex items-center gap-1"
          >
            <X size={13} />
            <span>Recusar</span>
          </button>
        </div>

        {invites.length > 1 && (
          <span className="text-[10px] text-center text-slate-500">
            +{invites.length - 1} outro(s) convite(s) pendente(s)
          </span>
        )}

      </div>
    </div>
  );
};
