import React, { useState } from 'react';
import { Scroll, X, Send, Image, Sparkles } from 'lucide-react';

interface HandoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastHandout: (handout: { title: string; content: string; imageUrl?: string }) => void;
  showNotification: (msg: string) => void;
}

const HANDOUT_PRESETS = [
  {
    title: '📜 Carta do Burgomestre',
    content: 'Aos bravos aventureiros que cruzarem nossos portões:\n\nUm mal antigo e silencioso rasteja pelas brumas da floresta. Nossos guardas desapareceram e as colheitas apodreceram. Apelo à vossa honra e lâminas para proteger meu povo antes da próxima lua cheia.',
  },
  {
    title: '🗝️ Página Rasgada do Diário',
    content: 'Dia 14 após o solstício...\nAs sombras nas paredes não coincidem com as tochas. Ouvi os sussurros vindo do poço na praça central. Se alguém encontrar este bilhete, NÃO abra a cripta selada com a pedra do sol.',
  },
  {
    title: '⚖️ Contrato com Recompensa',
    content: 'ORDEM DE CAPTURA & RECOMPENSA\n\nVivo ou morto: O líder dos saqueadores que atacou a caravana real.\nRecompensa garantida pela Coroa: 250 Peças de Ouro e permissão de passagem pelas terras altas.',
  },
];

export const HandoutModal: React.FC<HandoutModalProps> = ({
  isOpen,
  onClose,
  onBroadcastHandout,
  showNotification,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showNotification('Preencha o título e o conteúdo da pista.');
      return;
    }

    onBroadcastHandout({
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
    });

    showNotification(`Pista "${title}" transmitida para os jogadores!`);
    setTitle('');
    setContent('');
    setImageUrl('');
    onClose();
  };

  const handleApplyPreset = (preset: typeof HANDOUT_PRESETS[0]) => {
    setTitle(preset.title);
    setContent(preset.content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-2xl rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scroll size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Transmitir Pista / Documento (Handout)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3.5">
          <p className="text-xs text-slate-400">
            Crie cartas, pergaminhos antigos, pistas ou charadas que saltarão na tela de todos os jogadores simultaneamente em formato de pergaminho imersivo.
          </p>

          {/* Modelos Prontos Rápidos */}
          <div>
            <div className="text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1">
              <Sparkles size={12} /> Modelos Prontos de Pistas:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HANDOUT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition truncate max-w-[200px]"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Documento
            </label>
            <input
              type="text"
              placeholder="Ex: Carta com Selo de Cera Vermelha"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rpg-input text-xs w-full py-1.5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Texto / Conteúdo do Documento
            </label>
            <textarea
              placeholder="Escreva a mensagem secreta, pista, poema cifrado ou narrativa que os jogadores devem ler..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="rpg-input text-xs w-full py-2 resize-none font-serif leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Image size={13} className="text-slate-400" />
              URL de Imagem / Mapa (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com/mapa-do-tesouro.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rpg-input text-xs w-full py-1.5"
            />
          </div>

          {/* Botão de Transmissão */}
          <div className="pt-2">
            <button
              type="submit"
              className="rpg-button bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/50 text-xs py-2.5 px-4 flex items-center justify-center gap-2 w-full font-bold shadow-lg shadow-amber-500/10"
            >
              <Send size={14} />
              Transmitir Imediatamente para a Tela dos Jogadores
            </button>
          </div>
        </form>

        {/* Rodapé */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
