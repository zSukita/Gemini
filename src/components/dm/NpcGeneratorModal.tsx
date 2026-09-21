import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { generateNpc, type GeneratedNpc } from '../../utils/npcGenerator';
import type { CampaignNpc } from '../../types/dnd5e';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Dices, 
  Copy, 
  Check, 
  Eye, 
  MessageSquare, 
  KeyRound, 
  Scroll,
  BookOpen
} from 'lucide-react';

interface NpcGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNpcToJournal?: (npc: CampaignNpc) => void;
}

const RACES_SELECT = [
  'Qualquer Raça',
  'Humano',
  'Elfo',
  'Anão',
  'Halfling',
  'Tiefling',
  'Draconato',
  'Meio-Orc',
  'Gnomo',
];

export const NpcGeneratorModal: React.FC<NpcGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveNpcToJournal,
}) => {
  const [selectedRace, setSelectedRace] = useState('Qualquer Raça');
  const [selectedGender, setSelectedGender] = useState<'qualquer' | 'masculino' | 'feminino'>('qualquer');
  const [currentNpc, setCurrentNpc] = useState<GeneratedNpc>(() => generateNpc());
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerate = () => {
    const race = selectedRace === 'Qualquer Raça' ? undefined : selectedRace;
    const gender = selectedGender === 'qualquer' ? undefined : selectedGender;
    setCurrentNpc(generateNpc(race, gender));
    setCopied(false);
    setSavedSuccess(false);
  };

  const handleCopy = () => {
    const text = `Nome: ${currentNpc.name} (${currentNpc.race} - ${currentNpc.occupation})\nTendência: ${currentNpc.alignment}\nAparência: ${currentNpc.appearance}\nManeirismo: ${currentNpc.mannerism}\nSegredo: ${currentNpc.secret}\nRumor: ${currentNpc.rumor}\nCitação: ${currentNpc.quote}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToJournal = () => {
    if (!onSaveNpcToJournal) return;
    const newNpc: CampaignNpc = {
      id: currentNpc.id,
      name: currentNpc.name,
      role: `${currentNpc.race} • ${currentNpc.occupation}`,
      location: 'Taverna / Cidade Local',
      attitude: currentNpc.alignment.includes('Bom') ? 'friendly' : currentNpc.alignment.includes('Mau') ? 'hostile' : 'neutral',
      notes: `Aparência: ${currentNpc.appearance}\nManeirismo: ${currentNpc.mannerism}\nSegredo: ${currentNpc.secret}\nRumor: ${currentNpc.rumor}`,
    };
    onSaveNpcToJournal(newNpc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="rpg-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border-amber-500/60 shadow-2xl overflow-hidden bg-slate-900/98 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Gerador Rápido de NPCs
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Crie em 1 clique personagens memoráveis com aparência, maneirismos, segredos e rumores.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros e Disparo */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="rpg-input py-1 text-xs"
            >
              {RACES_SELECT.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedGender('qualquer')}
                className={`px-2 py-0.5 rounded ${selectedGender === 'qualquer' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('masculino')}
                className={`px-2 py-0.5 rounded ${selectedGender === 'masculino' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                Masc
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender('feminino')}
                className={`px-2 py-0.5 rounded ${selectedGender === 'feminino' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                Fem
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-lg shadow flex items-center gap-1.5 active:scale-95 transition"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Gerar Outro NPC</span>
          </button>
        </div>

        {/* Notificação de Salvamento */}
        {savedSuccess && (
          <div className="bg-emerald-950/90 border-y border-emerald-500/40 text-emerald-300 text-xs py-2 px-4 flex items-center gap-2 animate-in fade-in">
            <Check size={14} className="text-emerald-400" />
            <span>NPC salvo na aba Diário & Missões (NPCs e Facções)!</span>
          </div>
        )}

        {/* Dossiê do NPC */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Card Principal de Identificação */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-serif font-black text-amber-200">
                {currentNpc.name}
              </h3>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                {currentNpc.alignment}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-400">{currentNpc.race}</span>
              <span>•</span>
              <span className="text-slate-200 font-medium">{currentNpc.occupation}</span>
              <span>•</span>
              <span className="text-slate-400 capitalize">Gênero: {currentNpc.gender}</span>
            </div>
            <p className="text-xs italic text-amber-300/80 pt-1 border-t border-slate-700/60 font-serif">
              {currentNpc.quote}
            </p>
          </div>

          {/* Dossiê de Detalhes */}
          <div className="grid grid-cols-1 gap-3 text-xs">
            {/* Aparência */}
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <Eye size={14} className="text-amber-400" />
                Aparência & Traço Marcante:
              </div>
              <p className="text-slate-200 leading-relaxed">{currentNpc.appearance}</p>
            </div>

            {/* Maneirismo / Voz */}
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
                <MessageSquare size={14} className="text-indigo-400" />
                Maneirismo & Estilo de Fala:
              </div>
              <p className="text-slate-200 leading-relaxed">{currentNpc.mannerism}</p>
            </div>

            {/* Segredo / Gancho */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                <KeyRound size={14} className="text-purple-400" />
                Segredo Oculto & Motivação:
              </div>
              <p className="text-purple-200 leading-relaxed">{currentNpc.secret}</p>
            </div>

            {/* Rumor de Taverna */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Scroll size={14} className="text-amber-500" />
                Rumor de Taverna que Conhece:
              </div>
              <p className="text-amber-200/90 italic leading-relaxed">{currentNpc.rumor}</p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 px-3"
            title="Copiar dados do NPC"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Dossiê'}</span>
          </button>

          {onSaveNpcToJournal && (
            <button
              type="button"
              onClick={handleSaveToJournal}
              className="rpg-button bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-1.5 px-4 shadow-md shadow-amber-600/20 active:scale-95 flex items-center gap-1.5 transition"
              title="Adicionar permanentemente este NPC à lista da campanha na ficha"
            >
              <BookOpen size={14} />
              <span>Salvar no Diário (NPCs)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
