import React, { useState, useRef } from 'react';
import type { Character } from '../types/dnd5e';
import { 
  Users, 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  Sparkles,
  Printer,
} from 'lucide-react';

interface CharacterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  activeId: string;
  onSelectCharacter: (id: string) => void;
  onCreateCharacter: (name?: string) => void;
  onOpenWizard?: () => void;
  onDeleteCharacter: () => void;
  onImportCharacter: (json: string) => boolean;
  onExportCharacter: () => string;
  onOpenPrint?: () => void;
}

export const CharacterManagerModal: React.FC<CharacterManagerModalProps> = ({
  isOpen,
  onClose,
  characters,
  activeId,
  onSelectCharacter,
  onCreateCharacter,
  onOpenWizard,
  onDeleteCharacter,
  onImportCharacter,
  onExportCharacter,
  onOpenPrint,
}) => {
  const [newCharName, setNewCharName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) {
      onCreateCharacter();
    } else {
      onCreateCharacter(newCharName.trim());
    }
    setNewCharName('');
  };

  const handleExportDownload = () => {
    const jsonStr = onExportCharacter();
    const activeChar = characters.find((c) => c.id === activeId);
    const fileName = `${(activeChar?.name || 'personagem').toLowerCase().replace(/\s+/g, '_')}_dnd5e.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportCharacter(content);
        if (success) {
          setImportError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setImportError('Arquivo JSON incompatível ou formato corrompido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-lg rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Gerenciador de Fichas de Personagens
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Fichas Salvas */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2 my-2">
          <span className="text-xs font-semibold text-slate-400">Suas Fichas Salvas:</span>

          {characters.map((char) => {
            const isActive = char.id === activeId;

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isActive
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      isActive ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {isActive && <Check size={12} strokeWidth={3} />}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{char.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">
                          Ativa
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {char.characterClass} Nível {char.level} • {char.race}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  {char.currentHp}/{char.maxHp} PV
                </div>
              </div>
            );
          })}
        </div>

        {/* Assistente Oficial de Criação de Personagens */}
        {onOpenWizard && (
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWizard();
              }}
              className="w-full rpg-button bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs py-2 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              <span>Criar Herói com Assistente (Classe & Raça)</span>
            </button>
          </div>
        )}

        {/* Criar Nova Ficha Rápida */}
        <form onSubmit={handleCreate} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ou digite um nome para ficha rápida..."
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            className="rpg-input text-xs flex-1 py-1.5"
          />
          <button
            type="submit"
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-1.5 px-3"
          >
            <Plus size={14} className="text-amber-400" />
            Criar Rápida
          </button>
        </form>

        {/* Ações de Importação e Exportação */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Exportar JSON */}
            <button
              onClick={handleExportDownload}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1"
              title="Baixar ficha atual em arquivo JSON"
            >
              <Download size={13} className="text-amber-400" />
              Exportar JSON
            </button>

            {/* Imprimir / PDF */}
            {onOpenPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrint();
                }}
                className="rpg-button bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs py-1 font-semibold"
                title="Imprimir ficha ou salvar em PDF"
              >
                <Printer size={13} className="text-amber-400" />
                Imprimir (PDF)
              </button>
            )}

            {/* Importar JSON */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1"
              title="Carregar arquivo JSON com ficha salva"
            >
              <Upload size={13} className="text-cyan-400" />
              Importar JSON
            </button>
          </div>

          {/* Excluir Ficha Ativa */}
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta ficha de personagem?')) {
                onDeleteCharacter();
              }
            }}
            className="rpg-button bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs py-1"
            title="Excluir ficha ativa atual"
          >
            <Trash2 size={13} />
            Excluir Ficha
          </button>
        </div>

        {importError && (
          <div className="mt-3 p-2 bg-rose-950/80 border border-rose-600 rounded-lg text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{importError}</span>
          </div>
        )}

      </div>
    </div>
  );
};
