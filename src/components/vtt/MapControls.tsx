import React, { useRef } from 'react';
import { DEFAULT_MAP_PRESETS, type DefaultMapPreset } from '../../data/defaultMaps';
import { AOE_PRESETS } from '../../utils/aoeTemplates';
import type { AmbientLightType } from '../../types/vtt';
import { 
  MousePointer, 
  Ruler, 
  Eye, 
  EyeOff, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Upload,
  Magnet,
  Compass,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Trash2,
  Pencil,
  Radio,
} from 'lucide-react';

interface MapControlsProps {
  activeTool: 'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping';
  setActiveTool: (tool: 'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping') => void;
  drawColor?: string;
  onChangeDrawColor?: (color: string) => void;
  drawWidth?: number;
  onChangeDrawWidth?: (width: number) => void;
  onClearDrawings?: () => void;
  hasDrawings?: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  gridSize: number;
  onChangeGridSize: (size: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  fogEnabled: boolean;
  onToggleFog: () => void;
  onResetFog: () => void;
  onRevealAllFog: () => void;
  onSelectMapPreset: (preset: DefaultMapPreset) => void;
  onUploadMap: (title: string, dataUrl: string, width: number, height: number) => void;
  onOpenGallery?: () => void;
  ambientLight?: AmbientLightType;
  onSetAmbientLight?: (light: AmbientLightType) => void;
  onAddAoETemplate?: (presetId: string) => void;
  onClearAoETemplates?: () => void;
  hasAoETemplates?: boolean;
  onOpenTokenMaker?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  activeTool,
  setActiveTool,
  drawColor = '#f59e0b',
  onChangeDrawColor,
  drawWidth = 4,
  onChangeDrawWidth,
  onClearDrawings,
  hasDrawings = false,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  gridSize,
  onChangeGridSize,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  fogEnabled,
  onToggleFog,
  onResetFog,
  onRevealAllFog,
  onSelectMapPreset,
  onUploadMap,
  onOpenGallery,
  ambientLight = 'day',
  onSetAmbientLight,
  onAddAoETemplate,
  onClearAoETemplates,
  hasAoETemplates,
  onOpenTokenMaker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onUploadMap(file.name.replace(/\.[^/.]+$/, ''), url, img.naturalWidth || 1200, img.naturalHeight || 800);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md">
      {/* Ferramentas do Cursor */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTool('select')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'select'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mover Tokens e Navegar"
        >
          <MousePointer size={14} />
          <span className="hidden sm:inline">Mover</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('measure')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'measure'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Régua de Medição de Distância (metros/quadrados)"
        >
          <Ruler size={14} />
          <span className="hidden sm:inline">Régua</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('fog-reveal')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'fog-reveal'
              ? 'bg-emerald-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Revelar Área da Névoa de Guerra"
        >
          <Eye size={14} />
          <span className="hidden sm:inline">Revelar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('fog-hide')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'fog-hide'
              ? 'bg-rose-600 text-white font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ocultar Área com Névoa"
        >
          <EyeOff size={14} />
          <span className="hidden sm:inline">Ocultar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === 'draw' ? 'select' : 'draw')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'draw'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Caneta de Desenho Tático Livre"
        >
          <Pencil size={14} />
          <span className="hidden sm:inline">Desenhar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === 'ping' ? 'select' : 'ping')}
          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            activeTool === 'ping'
              ? 'bg-purple-600 text-white font-bold shadow animate-pulse'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ponteiro / Radar Pulsante (Ping no Mapa)"
        >
          <Radio size={14} />
          <span className="hidden sm:inline">Ping</span>
        </button>
      </div>

      {/* Controles de Grid e Snap */}
      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
        <button
          type="button"
          onClick={onToggleGrid}
          className={`p-1 rounded transition ${
            showGrid ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
          }`}
          title="Alternar visibilidade da grade"
        >
          <Grid size={15} />
        </button>

        <button
          type="button"
          onClick={onToggleSnap}
          className={`p-1 rounded transition ${
            snapToGrid ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
          }`}
          title="Encaixar tokens na grade (Snap to Grid)"
        >
          <Magnet size={15} />
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Tam:</span>
          <input
            type="range"
            min={35}
            max={75}
            value={gridSize}
            onChange={(e) => onChangeGridSize(parseInt(e.target.value, 10))}
            className="w-16 accent-amber-500 cursor-pointer"
            title="Ajustar tamanho da célula da grade"
          />
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1 text-slate-400 hover:text-slate-200 transition"
          title="Reduzir Zoom"
        >
          <ZoomOut size={14} />
        </button>

        <span className="font-mono text-[11px] text-slate-300 w-10 text-center font-bold">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1 text-slate-400 hover:text-slate-200 transition"
          title="Aumentar Zoom"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="p-1 text-slate-500 hover:text-slate-300 transition ml-0.5"
          title="Resetar Zoom e Posição"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Névoa de Guerra Global */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
        <button
          type="button"
          onClick={onToggleFog}
          className={`px-2 py-1 rounded text-xs font-semibold transition ${
            fogEnabled
              ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Ativar / desativar Névoa de Guerra"
        >
          Névoa: {fogEnabled ? 'Ligada' : 'Desligada'}
        </button>

        {fogEnabled && (
          <>
            <button
              type="button"
              onClick={onRevealAllFog}
              className="px-1.5 py-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition"
              title="Revelar todo o mapa"
            >
              Revelar Tudo
            </button>
            <button
              type="button"
              onClick={onResetFog}
              className="px-1.5 py-1 text-[10px] text-rose-400 hover:text-rose-300 transition"
              title="Cobrir todo o mapa com névoa"
            >
              Cobrir
            </button>
          </>
        )}
      </div>

      {/* Iluminação de Ambiente (Dia, Crepúsculo, Noite) */}
      {onSetAmbientLight && (
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onSetAmbientLight('day')}
            className={`p-1.5 rounded transition ${
              ambientLight === 'day'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Iluminação Diurna (Luz Plena)"
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSetAmbientLight('dusk')}
            className={`p-1.5 rounded transition ${
              ambientLight === 'dusk'
                ? 'bg-amber-700 text-amber-100 font-bold'
                : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Crepúsculo (Penumbra Alaranjada)"
          >
            <Sunset size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSetAmbientLight('night')}
            className={`p-1.5 rounded transition ${
              ambientLight === 'night'
                ? 'bg-indigo-900 text-indigo-200 font-bold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
            title="Noite Escura (Visão Limitada e Luz de Tochas)"
          >
            <Moon size={13} />
          </button>
        </div>
      )}

      {/* Áreas de Efeito de Magias (AoE Templates) */}
      {onAddAoETemplate && (
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAddAoETemplate(e.target.value);
                e.target.value = '';
              }
            }}
            className="bg-transparent text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>
              ✨ Área de Magia (AoE)...
            </option>
            {AOE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                {preset.name}
              </option>
            ))}
          </select>

          {hasAoETemplates && onClearAoETemplates && (
            <button
              type="button"
              onClick={onClearAoETemplates}
              className="p-1 text-rose-400 hover:text-rose-300 transition"
              title="Limpar todas as áreas de magia do mapa"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Botão do Criador de Tokens */}
      {onOpenTokenMaker && (
        <button
          type="button"
          onClick={onOpenTokenMaker}
          className="rpg-button bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-xs py-1.5 px-2.5 flex items-center gap-1.5 shadow"
          title="Abrir Criador de Tokens Circulares (Upload, Zoom e Molduras)"
        >
          <Sparkles size={13} className="text-amber-400" />
          <span className="hidden sm:inline font-bold">Criar Token</span>
        </button>
      )}

      {/* Seletor de Mapa & Upload & Galeria Online */}
      <div className="flex items-center gap-1.5">
        {onOpenGallery && (
          <button
            type="button"
            onClick={onOpenGallery}
            className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1 shadow"
            title="Abrir Galeria de Mapas de Batalha e Mapas da Internet"
          >
            <Compass size={13} />
            <span className="hidden sm:inline">Galeria de Mapas</span>
          </button>
        )}

        <select
          onChange={(e) => {
            const preset = DEFAULT_MAP_PRESETS.find((p) => p.id === e.target.value);
            if (preset) onSelectMapPreset(preset);
          }}
          className="rpg-input py-1 text-xs"
        >
          <option value="">Mapas Prontos...</option>
          {DEFAULT_MAP_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.isOnline ? `🌐 ${p.title}` : `📐 ${p.title}`}
            </option>
          ))}
        </select>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1"
          title="Carregar imagem de mapa personalizada (.png, .jpg, .webp)"
        >
          <Upload size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Carregar Mapa</span>
        </button>
      </div>

      {/* Sub-barra de Ferramentas de Desenho Livre */}
      {activeTool === 'draw' && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Pencil size={13} className="text-amber-400" />
              Cor:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { color: '#f59e0b', label: 'Dourado' },
                { color: '#ef4444', label: 'Carmesim' },
                { color: '#3b82f6', label: 'Azul' },
                { color: '#10b981', label: 'Esmeralda' },
                { color: '#ffffff', label: 'Branco Giz' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => onChangeDrawColor?.(c.color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    drawColor === c.color ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <span className="text-slate-400 font-semibold">Traço:</span>
            <div className="flex items-center gap-1">
              {[
                { width: 2, label: 'Fino' },
                { width: 5, label: 'Médio' },
                { width: 10, label: 'Grosso' },
              ].map((w) => (
                <button
                  key={w.width}
                  type="button"
                  onClick={() => onChangeDrawWidth?.(w.width)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    drawWidth === w.width
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {onClearDrawings && hasDrawings && (
            <button
              type="button"
              onClick={onClearDrawings}
              className="rpg-button bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs py-1 px-2 flex items-center gap-1"
              title="Limpar todos os desenhos do mapa"
            >
              <Trash2 size={12} />
              <span>Limpar Desenhos</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
