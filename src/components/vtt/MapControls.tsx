import React, { useRef, useState } from 'react';
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
  Maximize,
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
  ChevronDown,
  ChevronUp,
  Sliders,
  Wrench,
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
  onFitToScreen?: (mode?: 'fill' | 'focus' | 'contain') => void;
  fitMode?: 'fill' | 'focus' | 'contain';
  onAdaptMapToViewport?: () => void;
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
  onFitToScreen,
  fitMode = 'fill',
  onAdaptMapToViewport,
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
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [showFitMenu, setShowFitMenu] = useState(false);
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

  if (isToolbarCollapsed) {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsToolbarCollapsed(false)}
          className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700 px-3 py-1 rounded-full shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition select-none"
          title="Expandir barra de ferramentas do tabuleiro"
        >
          <Wrench size={13} />
          <span>Ferramentas do Mapa</span>
          <ChevronDown size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md shrink-0">
      {/* 1. BARRA PRINCIPAL COMPACTA & ALINHADA (Sem quebras desordenadas) */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
        
        {/* Ferramentas do Cursor (Agrupadas com estilo e alinhamento) */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'select'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mover Tokens e Navegar pelo Mapa"
          >
            <MousePointer size={14} />
            <span className="hidden xl:inline">Mover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('measure')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'measure'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Régua de Medição de Distância (em metros e quadrados)"
          >
            <Ruler size={14} />
            <span className="hidden xl:inline">Régua</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('fog-reveal')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'fog-reveal'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Revelar Área da Névoa de Guerra"
          >
            <Eye size={14} />
            <span className="hidden xl:inline">Revelar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('fog-hide')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'fog-hide'
                ? 'bg-rose-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ocultar Área com Névoa"
          >
            <EyeOff size={14} />
            <span className="hidden xl:inline">Ocultar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'draw' ? 'select' : 'draw')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'draw'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Caneta de Desenho Tático Livre"
          >
            <Pencil size={14} />
            <span className="hidden xl:inline">Desenhar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'ping' ? 'select' : 'ping')}
            className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              activeTool === 'ping'
                ? 'bg-purple-600 text-white font-bold shadow animate-pulse'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ponteiro Pulsante (Ping no Mapa)"
          >
            <Radio size={14} />
            <span className="hidden xl:inline">Ping</span>
          </button>
        </div>

        {/* Grade, Snap, Zoom e Enquadramento Adaptativo */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Grade e Snap */}
          <div className="flex items-center gap-0.5 bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={onToggleGrid}
              className={`p-1 rounded transition ${
                showGrid ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Alternar visibilidade da grade"
            >
              <Grid size={14} />
            </button>

            <button
              type="button"
              onClick={onToggleSnap}
              className={`p-1 rounded transition ${
                snapToGrid ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Encaixar tokens na grade (Snap to Grid)"
            >
              <Magnet size={14} />
            </button>
          </div>

          {/* Zoom com Enquadramento Inteligente */}
          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800 text-xs relative">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title="Reduzir Zoom"
            >
              <ZoomOut size={13} />
            </button>

            <button
              type="button"
              onClick={onResetZoom}
              className="font-mono text-[11px] text-slate-300 hover:text-amber-400 w-10 text-center font-bold transition cursor-pointer"
              title="Clique para redefinir o zoom para 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title="Aumentar Zoom"
            >
              <ZoomIn size={13} />
            </button>

            {/* BOTÃO ENQUADRAR INTELIGENTE (Adapta o mapa para a área todo sem faixas pretas) */}
            {onFitToScreen && (
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => onFitToScreen()}
                  className={`px-2 py-0.5 rounded transition font-bold text-[11px] flex items-center gap-1 shadow-xs ${
                    fitMode === 'fill'
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : fitMode === 'focus'
                      ? 'bg-rose-700 text-rose-100 hover:bg-rose-600'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  }`}
                  title="Enquadrar Mapa (Clique para alternar: Preencher Área / Focar no Combate / Ver Mapa Todo)"
                >
                  <Maximize size={12} />
                  <span>
                    {fitMode === 'fill' ? 'Preencher' : fitMode === 'focus' ? 'Foco Combate' : 'Conter'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFitMenu(!showFitMenu)}
                  className="p-0.5 ml-0.5 text-slate-400 hover:text-slate-200 rounded transition"
                  title="Opções de Enquadramento"
                >
                  <ChevronDown size={11} className={`transition-transform duration-150 ${showFitMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown de Modos de Enquadramento */}
                {showFitMenu && (
                  <div className="absolute top-full right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        onFitToScreen('fill');
                        setShowFitMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition ${
                        fitMode === 'fill' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Maximize size={13} />
                      <div className="flex flex-col">
                        <span>Preencher Área Total</span>
                        <span className="text-[9px] opacity-75">Ocupa toda a tela sem faixas pretas</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFitToScreen('focus');
                        setShowFitMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition ${
                        fitMode === 'focus' ? 'bg-rose-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Compass size={13} />
                      <div className="flex flex-col">
                        <span>Focar nos Heróis & Monstros</span>
                        <span className="text-[9px] opacity-75">Aproxima a câmera na batalha</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFitToScreen('contain');
                        setShowFitMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition ${
                        fitMode === 'contain' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <RotateCcw size={13} />
                      <div className="flex flex-col">
                        <span>Ver Mapa Inteiro</span>
                        <span className="text-[9px] opacity-75">Limites completos (com margens)</span>
                      </div>
                    </button>

                    {onAdaptMapToViewport && (
                      <button
                        type="button"
                        onClick={() => {
                          onAdaptMapToViewport();
                          setShowFitMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg border-t border-slate-800 flex items-center gap-2 text-amber-300 hover:bg-amber-500/10 transition mt-0.5"
                      >
                        <Wrench size={13} />
                        <div className="flex flex-col">
                          <span>Adaptar Mapa ao Monitor</span>
                          <span className="text-[9px] text-amber-200/70">Redimensiona o grid para sua tela</span>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botão de Opções do Mapa e Botão de Ocultar Barra */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
              showAdvancedTools
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Configurações de Mapa, Luz, Névoa e Tokens"
          >
            <Sliders size={12} />
            <span className="text-[11px]">Opções</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvancedTools ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(true)}
            className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Recolher barra para visão total do mapa"
          >
            <ChevronUp size={12} />
          </button>
        </div>
      </div>

      {/* 2. SUB-BARRA EXPANSÍVEL: FERRAMENTAS AVANÇADAS DO TABULEIRO (COMPACTA) */}
      {showAdvancedTools && (
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800/80 animate-in slide-in-from-top-1 duration-150 text-xs">
          {/* Linha 1: Efeitos Visuais (Luz, Névoa, Magias AoE) */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Iluminação de Ambiente */}
            {onSetAmbientLight && (
              <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Luz:</span>
                <button
                  type="button"
                  onClick={() => onSetAmbientLight('day')}
                  className={`p-1 rounded transition ${
                    ambientLight === 'day'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  title="Iluminação Diurna (Luz Plena)"
                >
                  <Sun size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onSetAmbientLight('dusk')}
                  className={`p-1 rounded transition ${
                    ambientLight === 'dusk'
                      ? 'bg-amber-700 text-amber-100 font-bold shadow'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title="Crepúsculo (Penumbra)"
                >
                  <Sunset size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onSetAmbientLight('night')}
                  className={`p-1 rounded transition ${
                    ambientLight === 'night'
                      ? 'bg-indigo-900 text-indigo-200 font-bold shadow'
                      : 'text-slate-400 hover:text-indigo-300'
                  }`}
                  title="Noite Escura (Visão nas Tochas)"
                >
                  <Moon size={12} />
                </button>
              </div>
            )}

            {/* Névoa de Guerra */}
            <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={onToggleFog}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
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
                    className="px-1.5 py-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition"
                    title="Revelar todo o mapa"
                  >
                    Revelar
                  </button>
                  <button
                    type="button"
                    onClick={onResetFog}
                    className="px-1.5 py-0.5 text-[10px] text-rose-400 hover:text-rose-300 transition"
                    title="Cobrir todo o mapa com névoa"
                  >
                    Cobrir
                  </button>
                </>
              )}
            </div>

            {/* Áreas de Efeito (AoE) */}
            {onAddAoETemplate && (
              <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onAddAoETemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-transparent text-amber-300 text-[11px] font-bold focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    ✨ Magias (AoE)...
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
                    title="Limpar áreas de magia"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Linha 2: Gestão de Mapas, Tokens e Grade */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/40">
            {/* Galeria, Mapas Prontos e Upload */}
            <div className="flex items-center gap-1">
              {onOpenGallery && (
                <button
                  type="button"
                  onClick={onOpenGallery}
                  className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] py-0.5 px-2 shadow flex items-center gap-1"
                  title="Galeria de Mapas de Batalha HD"
                >
                  <Compass size={12} />
                  <span>Galeria</span>
                </button>
              )}

              <select
                onChange={(e) => {
                  const preset = DEFAULT_MAP_PRESETS.find((p) => p.id === e.target.value);
                  if (preset) onSelectMapPreset(preset);
                }}
                className="rpg-input py-0.5 text-[11px] max-w-[140px] truncate"
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
                className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-0.5 px-2 flex items-center gap-1"
                title="Carregar imagem de mapa personalizada (.png, .jpg, .webp)"
              >
                <Upload size={12} className="text-amber-400" />
                <span>Upload</span>
              </button>
            </div>

            {/* Criar Token */}
            {onOpenTokenMaker && (
              <button
                type="button"
                onClick={onOpenTokenMaker}
                className="rpg-button bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-[11px] py-0.5 px-2 flex items-center gap-1 shadow"
                title="Abrir Criador de Tokens Circulares"
              >
                <Sparkles size={11} className="text-amber-400" />
                <span className="font-bold">Criar Token</span>
              </button>
            )}

            {/* Ajuste Fino do Grid */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px] text-slate-400">
              <span>Grade: {gridSize}px</span>
              <input
                type="range"
                min={35}
                max={75}
                value={gridSize}
                onChange={(e) => onChangeGridSize(parseInt(e.target.value, 10))}
                className="w-14 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-BARRA DE DESENHO LIVRE (Apenas quando a ferramenta Caneta está ativa) */}
      {activeTool === 'draw' && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Pencil size={12} className="text-amber-400" />
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
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${
                    drawColor === c.color ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>

            <div className="h-3 w-px bg-slate-700 mx-1" />

            <span className="text-slate-400 font-semibold text-[11px]">Traço:</span>
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
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
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
              className="rpg-button bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs py-0.5 px-2 flex items-center gap-1"
              title="Limpar todos os desenhos do mapa"
            >
              <Trash2 size={11} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
