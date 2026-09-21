import React from 'react';
import { X, Bookmark } from 'lucide-react';
import type { CampaignHandout } from '../firebase/campaignSync';

interface HandoutViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  handout: CampaignHandout | null;
  onSaveToJournal?: (title: string, content: string) => void;
  showNotification?: (msg: string) => void;
}

export const HandoutViewerModal: React.FC<HandoutViewerModalProps> = ({
  isOpen,
  onClose,
  handout,
  onSaveToJournal,
  showNotification,
}) => {
  if (!isOpen || !handout) return null;

  const handleSave = () => {
    if (onSaveToJournal) {
      onSaveToJournal(handout.title, handout.content);
      showNotification?.(`Pista "${handout.title}" anotada no seu Diário de Campanha!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl p-6 sm:p-8 bg-[#231b14] border-2 border-amber-600/60 shadow-2xl shadow-amber-950/60 flex flex-col max-h-[90vh] relative animate-in zoom-in-95">
        
        {/* Efeito Visual de Pergaminho e Selo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-800 border-2 border-amber-400 shadow-xl flex items-center justify-center text-amber-200 text-sm font-serif font-black select-none">
          ⚜️
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-500/80 hover:text-amber-200 p-1 rounded-lg hover:bg-amber-950/40 transition"
          title="Fechar documento"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Pergaminho */}
        <div className="text-center pt-2 pb-4 border-b border-amber-800/40">
          <div className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-bold mb-1">
            Pista Revelada pelo Mestre
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 drop-shadow">
            {handout.title}
          </h2>
        </div>

        {/* Conteúdo do Documento / Pista */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
          {handout.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-amber-700/50 shadow-md max-h-64 flex items-center justify-center bg-black/40">
              <img
                src={handout.imageUrl}
                alt={handout.title}
                className="max-h-64 object-contain w-full"
              />
            </div>
          )}

          <div className="font-serif text-amber-100/90 text-sm sm:text-base leading-relaxed whitespace-pre-wrap px-2 italic selection:bg-amber-900/60">
            {handout.content}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-4 border-t border-amber-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-amber-400/60 font-serif">
            Adicionado à sua sessão em {new Date(handout.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onSaveToJournal && (
              <button
                type="button"
                onClick={handleSave}
                className="rpg-button bg-amber-700/40 hover:bg-amber-700/60 text-amber-200 border border-amber-600/60 text-xs py-2 px-3 flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              >
                <Bookmark size={14} />
                Guardar no Diário
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rpg-button bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs py-2 px-4 flex-1 sm:flex-none"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
