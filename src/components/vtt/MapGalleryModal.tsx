import React, { useState } from 'react';
import {
  DEFAULT_MAP_PRESETS,
  RECOMMENDED_MAP_SOURCES,
} from '../../data/defaultMaps';
import type { DefaultMapPreset } from '../../data/defaultMaps';
import {
  X,
  Globe,
  Compass,
  ExternalLink,
  Check,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface MapGalleryModalProps {
  currentMapId?: string;
  onSelectMap: (preset: DefaultMapPreset) => void;
  onCustomUrlMap: (url: string, name: string) => void;
  onClose: () => void;
}

export const MapGalleryModal: React.FC<MapGalleryModalProps> = ({
  currentMapId,
  onSelectMap,
  onCustomUrlMap,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [urlPreviewError, setUrlPreviewError] = useState<boolean>(false);

  const categories = [
    'all',
    ...Array.from(new Set(DEFAULT_MAP_PRESETS.map((p) => p.category))),
  ];

  const filteredPresets = DEFAULT_MAP_PRESETS.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    onCustomUrlMap(
      customUrl.trim(),
      customTitle.trim() || 'Mapa Personalizado da Internet'
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Galeria de Mapas de Batalha"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="rpg-card max-w-4xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Compass className="text-amber-400" size={20} />
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-100">
                Galeria de Mapas de Batalha & Internet
              </h2>
              <p className="text-xs text-slate-400">
                Escolha entre mapas oficiais da internet, vetores táticos ou insira qualquer URL externa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Filtro de Categorias */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'Todos os Mapas' : cat}
            </button>
          ))}
        </div>

        {/* Corpo: Grid de Mapas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Seção 1: Grid de Mapas Prontos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isCurrent = currentMapId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`group flex flex-col rounded-xl overflow-hidden border bg-slate-900/60 transition hover:border-amber-500/80 hover:shadow-lg ${
                    isCurrent
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Prévia da Imagem */}
                  <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={preset.imageUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge da Internet / Vetor */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {preset.isOnline ? (
                        <span className="flex items-center gap-1 text-[10px] bg-sky-950/90 text-sky-300 border border-sky-600/60 px-1.5 py-0.5 rounded shadow">
                          <Globe size={10} /> Web
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 px-1.5 py-0.5 rounded shadow">
                          <Sparkles size={10} /> HD Vetor
                        </span>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
                        <Check size={11} /> ATIVO
                      </div>
                    )}
                  </div>

                  {/* Detalhes do Mapa */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-serif font-bold text-sm text-slate-100 group-hover:text-amber-200 transition">
                          {preset.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        {preset.width}x{preset.height} px
                      </span>
                      {preset.author && (
                        <span className="truncate max-w-[120px]" title={preset.author}>
                          {preset.author}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectMap(preset);
                        onClose();
                      }}
                      className="w-full mt-1 rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1 rounded"
                    >
                      {isCurrent ? 'Recarregar Mapa' : 'Usar Este Mapa'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seção 2: Inserir Link Direto de Qualquer Imagem da Internet */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="text-sky-400" size={16} />
              <h3 className="font-serif font-bold text-sm text-slate-200">
                Inserir Link de Imagem Direta da Web
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Cole o link direto (.png, .jpg, .webp) de qualquer mapa encontrado na internet para projetá-lo no grid tático.
            </p>

            <form onSubmit={handleApplyCustomUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Título do Mapa (ex: Pântano Sombrio)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="rpg-input text-xs sm:w-1/3"
              />
              <input
                type="url"
                placeholder="https://exemplo.com/meu-mapa.png"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setUrlPreviewError(false);
                }}
                required
                className="rpg-input text-xs flex-1"
              />
              <button
                type="submit"
                className="rpg-button bg-sky-600 hover:bg-sky-500 text-white text-xs py-1.5 px-4 font-bold whitespace-nowrap"
              >
                <ImageIcon size={13} />
                <span>Carregar URL</span>
              </button>
            </form>

            {/* Pré-visualização rápida do link digitado */}
            {customUrl && !urlPreviewError && (
              <div className="relative mt-2 h-28 rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                <img
                  src={customUrl}
                  alt="Prévia"
                  className="max-h-full object-contain"
                  onError={() => setUrlPreviewError(true)}
                />
              </div>
            )}
            {urlPreviewError && (
              <p className="text-[11px] text-rose-400">
                Aviso: Não foi possível carregar a pré-visualização deste link. Verifique se a URL termina em imagem (.png, .jpg, etc.).
              </p>
            )}
          </div>

          {/* Seção 3: Repositórios e Fontes Recomendadas na Internet */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h3 className="font-serif font-bold text-xs text-amber-300 uppercase tracking-wider">
              Onde encontrar milhares de mapas gratuitos de RPG na internet:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {RECOMMENDED_MAP_SOURCES.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-800/40 transition flex items-start justify-between group"
                >
                  <div>
                    <span className="font-bold text-slate-200 group-hover:text-amber-300 transition flex items-center gap-1">
                      {source.name}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {source.description}
                    </p>
                  </div>
                  <ExternalLink
                    size={13}
                    className="text-slate-500 group-hover:text-amber-400 ml-2 shrink-0 transition"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-4 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
