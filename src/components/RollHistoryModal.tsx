import React from 'react';
import type { DiceRollResult } from '../types/dnd5e';
import { 
  History, 
  X, 
  Trash2, 
  Sparkles, 
  Skull, 
  Dices,
  Clock 
} from 'lucide-react';

interface RollHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolls: DiceRollResult[];
  onClearRolls: () => void;
}

export const RollHistoryModal: React.FC<RollHistoryModalProps> = ({
  isOpen,
  onClose,
  rolls,
  onClearRolls,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-lg rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Histórico de Rolagens de Dados
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {rolls.length > 0 && (
              <button
                onClick={onClearRolls}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition"
                title="Limpar histórico"
              >
                <Trash2 size={13} />
                <span>Limpar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lista de Rolagens */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 flex flex-col gap-2.5 my-2">
          {rolls.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
              <Dices size={32} className="text-slate-600 stroke-1" />
              <span>Nenhum dado foi rolado ainda nesta sessão.</span>
              <span className="text-[11px] text-slate-600">
                Clique nos atributos, perícias, armas ou na barra de dados abaixo para rolar!
              </span>
            </div>
          ) : (
            rolls.map((roll) => (
              <div
                key={roll.id}
                className={`p-3 rounded-xl border transition-all ${
                  roll.isCriticalSuccess
                    ? 'bg-amber-950/30 border-amber-400 shadow-md shadow-amber-500/10'
                    : roll.isCriticalFailure
                    ? 'bg-rose-950/30 border-rose-600/80 shadow-md shadow-rose-900/20'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{roll.label}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock size={10} /> {roll.timestamp}
                      </span>
                    </div>

                    {/* Detalhamento da fórmula */}
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {roll.breakdown}
                    </div>
                  </div>

                  {/* Total e Badges */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono text-2xl font-black ${
                        roll.isCriticalSuccess
                          ? 'text-amber-300 drop-shadow'
                          : roll.isCriticalFailure
                          ? 'text-rose-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {roll.total}
                    </span>

                    {roll.isCriticalSuccess && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40 flex items-center gap-1 uppercase tracking-wider mt-0.5">
                        <Sparkles size={10} /> Crítico 20!
                      </span>
                    )}

                    {roll.isCriticalFailure && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40 flex items-center gap-1 uppercase tracking-wider mt-0.5">
                        <Skull size={10} /> Falha 1!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
