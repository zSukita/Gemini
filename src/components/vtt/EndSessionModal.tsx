import React from 'react';
import { 
  X, 
  Sparkles, 
  LogOut, 
  RotateCcw, 
  Flag, 
  ArrowRight 
} from 'lucide-react';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  roomCode?: string;
  onStartNewAdventure: () => void;
  onClearMonstersAndCombat: () => void;
  onDisconnectAndExit: () => void;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  roomCode,
  onStartNewAdventure,
  onClearMonstersAndCombat,
  onDisconnectAndExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-slate-100 relative">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition p-1 rounded-lg hover:bg-slate-800"
          title="Cancelar e continuar na mesa"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Flag size={20} />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-amber-200">
              Finalizar Mesa / Gerenciar Sessão
            </h2>
            <p className="text-xs text-slate-400">
              {isConnected
                ? `Você está conectado na sala online [ ${roomCode} ]`
                : 'Mesa tática local / cooperativa ativa'}
            </p>
          </div>
        </div>

        {/* Opções de Ação */}
        <div className="flex flex-col gap-2.5 mt-1">
          {/* Opção 1: Iniciar Nova Aventura com Mestre IA */}
          <button
            type="button"
            onClick={onStartNewAdventure}
            className="w-full text-left p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900 hover:border-amber-400 hover:from-amber-900/50 transition group flex items-start gap-3 shadow-md shadow-amber-500/10"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-amber-200 group-hover:text-amber-100">
                  ✨ Iniciar Nova Aventura com Mestre IA
                </span>
                <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Reseta o combate e abre o seletor de cenários (Cripta, Floresta, Minas ou Tema Livre) para carregar um novo mapa, monstros e história.
              </p>
            </div>
          </button>

          {/* Opção 2: Limpar Monstros & Manter Mapa Atual */}
          <button
            type="button"
            onClick={onClearMonstersAndCombat}
            className="w-full text-left p-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800/90 hover:border-slate-600 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RotateCcw size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-slate-200 group-hover:text-cyan-200">
                  🧹 Limpar Monstros e Combate Atual
                </span>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Remove os monstros derrotados e zera a iniciativa do combate, mantendo o mapa atual e o token do seu aventureiro prontos para o próximo confronto.
              </p>
            </div>
          </button>

          {/* Opção 3: Desconectar & Encerrar Sessão */}
          <button
            type="button"
            onClick={onDisconnectAndExit}
            className="w-full text-left p-3.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/50 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <LogOut size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-red-200 group-hover:text-red-100">
                  {isConnected ? '🚪 Desconectar da Sala Online' : '🚪 Encerrar Sessão da Mesa'}
                </span>
                <ArrowRight size={14} className="text-red-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isConnected
                  ? 'Encerra a conexão P2P com outros jogadores e finaliza a sessão online.'
                  : 'Limpa os dados temporários do tabuleiro e finaliza a sessão atual.'}
              </p>
            </div>
          </button>
        </div>

        {/* Rodapé */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-1.5"
          >
            Continuar Jogando
          </button>
        </div>
      </div>
    </div>
  );
};
