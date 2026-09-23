import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { BattleMapConfig, MapToken, FogShape, DrawingStroke, MapPing, FloatingCombatText } from '../../types/vtt';
import type { Encounter } from '../../types/combat';
import { TokenMarker } from './TokenMarker';
import { MapControls } from './MapControls';
import { MapGalleryModal } from './MapGalleryModal';
import { TokenMakerModal } from './TokenMakerModal';
import { calculateMapDistance } from '../../utils/mapRenderer';
import { generateConePath, AOE_PRESETS, createAoETemplate } from '../../utils/aoeTemplates';
import type { DefaultMapPreset } from '../../data/defaultMaps';
import { Trash2 } from 'lucide-react';

interface BattleMapProps {
  mapConfig: BattleMapConfig;
  tokens: MapToken[];
  selectedTokenId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  activeTool: 'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping';
  encounter?: Encounter;
  onSelectToken: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onSetZoom: (zoom: number | ((z: number) => number)) => void;
  onSetPan: (pan: { x: number; y: number } | ((p: { x: number; y: number }) => { x: number; y: number })) => void;
  onSetActiveTool: (tool: 'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping') => void;
  onUpdateMapConfig: (updater: Partial<BattleMapConfig> | ((prev: BattleMapConfig) => BattleMapConfig)) => void;
  onSelectMapPreset: (preset: DefaultMapPreset) => void;
  onUploadMap: (title: string, dataUrl: string, width: number, height: number) => void;
  onAddFogShape: (shape: Omit<FogShape, 'id'>) => void;
  onResetFog: () => void;
  onRevealAllFog: () => void;
  onUpdateToken?: (id: string, updates: Partial<MapToken>) => void;
  onRemoveToken?: (id: string) => void;
  onAddToken?: (token: Omit<MapToken, 'id'>) => void;
  onApplyCharacterAvatar?: (dataUrl: string) => void;
}

function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  return points.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
}

export const BattleMap: React.FC<BattleMapProps> = ({
  mapConfig,
  tokens,
  selectedTokenId,
  zoom,
  pan,
  activeTool,
  encounter,
  onSelectToken,
  onMoveToken,
  onSetZoom,
  onSetPan,
  onSetActiveTool,
  onUpdateMapConfig,
  onSelectMapPreset,
  onUploadMap,
  onAddFogShape,
  onResetFog,
  onRevealAllFog,
  onUpdateToken,
  onRemoveToken,
  onAddToken,
  onApplyCharacterAvatar,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de arrasto de token
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Estados do Criador de Tokens e Galeria
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTokenMakerOpen, setIsTokenMakerOpen] = useState(false);

  // Estados de arrasto de modelos AoE
  const [draggingAoEId, setDraggingAoEId] = useState<string | null>(null);
  const [aoeDragOffset, setAoEDragOffset] = useState({ x: 0, y: 0 });

  // Estados de medição com régua
  const [ruler, setRuler] = useState<{
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);

  // Estados de seleção de névoa
  const [fogBox, setFogBox] = useState<{
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);

  // Estados de Pan com botão do meio ou barra de espaço
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Estados de Desenho Livre e Ping
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [drawColor, setDrawColor] = useState('#f59e0b');
  const [drawWidth, setDrawWidth] = useState(4);
  const [pings, setPings] = useState<MapPing[]>([]);

  // Estados de Floating Combat Text (Números flutuantes de dano e cura)
  const [floatingTexts, setFloatingTexts] = useState<FloatingCombatText[]>([]);
  const prevHpsRef = useRef<Map<string, number>>(new Map());

  // Detecta automaticamente alterações de PV em qualquer token
  useEffect(() => {
    const prevMap = prevHpsRef.current;
    tokens.forEach((t) => {
      if (prevMap.has(t.id)) {
        const prevHp = prevMap.get(t.id)!;
        const delta = t.currentHp - prevHp;
        if (delta !== 0) {
          const pixelSize = t.size * mapConfig.gridSize;
          const isCrit = delta <= -12;
          const newFt: FloatingCombatText = {
            id: `fct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tokenId: t.id,
            x: t.x + pixelSize / 2,
            y: t.y,
            text: delta > 0 ? `+${delta}` : `${delta}`,
            type: delta > 0 ? 'heal' : isCrit ? 'crit' : 'damage',
            timestamp: Date.now(),
          };
          setFloatingTexts((prev) => [...prev, newFt]);
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== newFt.id));
          }, 1400);
        }
      }
      prevMap.set(t.id, t.currentHp);
    });
  }, [tokens, mapConfig.gridSize]);

  // Listener para eventos customizados de floating text (ex: ERROU / MISS)
  useEffect(() => {
    const handleCustomFt = (e: Event) => {
      const detail = (e as CustomEvent<FloatingCombatText>).detail;
      if (detail) {
        setFloatingTexts((prev) => [...prev, detail]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((item) => item.id !== detail.id));
        }, 1400);
      }
    };
    window.addEventListener('arcanasheet_floating_text', handleCustomFt);
    return () => window.removeEventListener('arcanasheet_floating_text', handleCustomFt);
  }, []);

  const playPingSound = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // ignore
    }
  }, []);

  const emitPing = useCallback(
    (mapX: number, mapY: number) => {
      const newPing: MapPing = {
        id: `ping-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        x: mapX,
        y: mapY,
        color: drawColor,
        timestamp: Date.now(),
      };
      setPings((prev) => [...prev, newPing]);
      playPingSound();
      setTimeout(() => {
        setPings((prev) => prev.filter((p) => p.id !== newPing.id));
      }, 3000);
    },
    [drawColor, playPingSound]
  );

  // Monitorar tecla de espaço para Pan rápido
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Converter coordenadas da tela para coordenadas do mapa
  const getMapCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x: Math.max(0, x), y: Math.max(0, y) };
    },
    [pan, zoom]
  );

  // Início de clique/toque no tabuleiro
  const handlePointerDown = (e: React.PointerEvent) => {
    // Se for botão do meio (1) ou espaço pressionado, inicia pan
    if (e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // apenas botão esquerdo para ferramentas

    const coords = getMapCoordinates(e.clientX, e.clientY);

    if (activeTool === 'draw') {
      setCurrentStroke({
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        color: drawColor,
        width: drawWidth,
        points: [coords],
      });
    } else if (activeTool === 'ping') {
      emitPing(coords.x, coords.y);
    } else if (activeTool === 'measure') {
      setRuler({ start: coords, current: coords });
    } else if (activeTool === 'fog-reveal' || activeTool === 'fog-hide') {
      setFogBox({ start: coords, current: coords });
    } else if (activeTool === 'select' && !draggingTokenId) {
      onSelectToken(null);
    }
  };

  // Funções de Gestão de Modelos de Magia (AoE Templates)
  const handleAddAoETemplate = useCallback(
    (presetId: string) => {
      const preset = AOE_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      const center = {
        x: (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom,
        y: (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom,
      };
      const newTemplate = createAoETemplate(preset, Math.max(50, center.x), Math.max(50, center.y));
      onUpdateMapConfig((prev) => ({
        ...prev,
        aoeTemplates: [...(prev.aoeTemplates || []), newTemplate],
      }));
    },
    [pan, zoom, onUpdateMapConfig]
  );

  const handleRemoveAoE = useCallback(
    (id: string) => {
      onUpdateMapConfig((prev) => ({
        ...prev,
        aoeTemplates: (prev.aoeTemplates || []).filter((t) => t.id !== id),
      }));
    },
    [onUpdateMapConfig]
  );

  const handleClearAoETemplates = useCallback(() => {
    onUpdateMapConfig((prev) => ({
      ...prev,
      aoeTemplates: [],
    }));
  }, [onUpdateMapConfig]);

  const handleAoEDragStart = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const coords = getMapCoordinates(e.clientX, e.clientY);
    const aoe = (mapConfig.aoeTemplates || []).find((t) => t.id === id);
    if (!aoe) return;
    setDraggingAoEId(id);
    setAoEDragOffset({
      x: coords.x - aoe.x,
      y: coords.y - aoe.y,
    });
  };

  // Movimento no tabuleiro
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      onSetPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coords = getMapCoordinates(e.clientX, e.clientY);

    if (activeTool === 'draw' && currentStroke) {
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, coords] } : null));
      return;
    }

    if (draggingTokenId) {
      onMoveToken(draggingTokenId, coords.x - dragOffset.x, coords.y - dragOffset.y);
    } else if (draggingAoEId) {
      const newX = coords.x - aoeDragOffset.x;
      const newY = coords.y - aoeDragOffset.y;
      onUpdateMapConfig((prev) => ({
        ...prev,
        aoeTemplates: (prev.aoeTemplates || []).map((t) =>
          t.id === draggingAoEId ? { ...t, x: Math.max(0, newX), y: Math.max(0, newY) } : t
        ),
      }));
    } else if (ruler) {
      setRuler((prev) => (prev ? { ...prev, current: coords } : null));
    } else if (fogBox) {
      setFogBox((prev) => (prev ? { ...prev, current: coords } : null));
    }
  };

  // Finalização do clique
  const handlePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 0) {
      onUpdateMapConfig((prev) => ({
        ...prev,
        drawings: [...(prev.drawings || []), currentStroke],
      }));
      setCurrentStroke(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggingTokenId) {
      setDraggingTokenId(null);
    }

    if (draggingAoEId) {
      setDraggingAoEId(null);
    }

    if (ruler) {
      setRuler(null);
    }

    if (fogBox) {
      const minX = Math.min(fogBox.start.x, fogBox.current.x);
      const minY = Math.min(fogBox.start.y, fogBox.current.y);
      const width = Math.abs(fogBox.current.x - fogBox.start.x);
      const height = Math.abs(fogBox.current.y - fogBox.start.y);

      if (width > 10 && height > 10) {
        onAddFogShape({
          x: minX,
          y: minY,
          width,
          height,
          type: 'rect',
          isRevealed: activeTool === 'fog-reveal',
        });
      }
      setFogBox(null);
    }
  };

  // Zoom pela roda do mouse com ouvinte não-passivo para evitar erro de preventDefault do navegador
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      onSetZoom((prev) => Math.min(3, Math.max(0.3, prev + zoomDelta)));
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, [onSetZoom]);

  // Iniciar arrasto de token
  const handleTokenDragStart = (tokenId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;

    const coords = getMapCoordinates(e.clientX, e.clientY);
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return;

    setDraggingTokenId(tokenId);
    setDragOffset({
      x: coords.x - token.x,
      y: coords.y - token.y,
    });
  };

  // Cálculos de medição da régua ativa
  const rulerMetrics = ruler
    ? calculateMapDistance(ruler.start.x, ruler.start.y, ruler.current.x, ruler.current.y, mapConfig.gridSize)
    : null;

  const activeTurnCombatantId =
    encounter?.combatants[encounter.activeCombatantIndex]?.id;

  return (
    <div className="w-full h-full flex flex-col gap-2 min-h-0 relative">
      {/* Barra de Ferramentas Superior */}
      <MapControls
        activeTool={activeTool}
        setActiveTool={onSetActiveTool}
        ambientLight={mapConfig.ambientLight || 'day'}
        onSetAmbientLight={(light) => onUpdateMapConfig({ ambientLight: light })}
        onAddAoETemplate={handleAddAoETemplate}
        onClearAoETemplates={handleClearAoETemplates}
        hasAoETemplates={Boolean(mapConfig.aoeTemplates && mapConfig.aoeTemplates.length > 0)}
        onOpenTokenMaker={() => setIsTokenMakerOpen(true)}
        showGrid={mapConfig.showGrid}
        onToggleGrid={() => onUpdateMapConfig((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
        snapToGrid={mapConfig.snapToGrid}
        onToggleSnap={() => onUpdateMapConfig((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
        gridSize={mapConfig.gridSize}
        onChangeGridSize={(size) => onUpdateMapConfig({ gridSize: size })}
        zoom={zoom}
        onZoomIn={() => onSetZoom((z) => Math.min(3, z + 0.15))}
        onZoomOut={() => onSetZoom((z) => Math.max(0.3, z - 0.15))}
        onResetZoom={() => {
          onSetZoom(1);
          onSetPan({ x: 0, y: 0 });
        }}
        fogEnabled={mapConfig.fogOfWarEnabled}
        onToggleFog={() =>
          onUpdateMapConfig((prev) => ({ ...prev, fogOfWarEnabled: !prev.fogOfWarEnabled }))
        }
        onResetFog={onResetFog}
        onRevealAllFog={onRevealAllFog}
        onSelectMapPreset={onSelectMapPreset}
        onUploadMap={onUploadMap}
        onOpenGallery={() => setIsGalleryOpen(true)}
        drawColor={drawColor}
        onChangeDrawColor={setDrawColor}
        drawWidth={drawWidth}
        onChangeDrawWidth={setDrawWidth}
        onClearDrawings={() => onUpdateMapConfig({ drawings: [] })}
        hasDrawings={Boolean(mapConfig.drawings && mapConfig.drawings.length > 0)}
      />

      {/* Modal da Galeria de Mapas de Batalha (Internet & Vetoriais) */}
      {isGalleryOpen && (
        <MapGalleryModal
          currentMapId={mapConfig.id}
          onSelectMap={(preset) => {
            onSelectMapPreset(preset);
            setIsGalleryOpen(false);
          }}
          onCustomUrlMap={(url, name) => {
            onUploadMap(name, url, 1800, 1200);
            setIsGalleryOpen(false);
          }}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {/* Modal do Criador de Tokens */}
      {isTokenMakerOpen && (
        <TokenMakerModal
          isOpen={isTokenMakerOpen}
          onClose={() => setIsTokenMakerOpen(false)}
          onAddTokenToMap={onAddToken}
          onApplyToCharacterAvatar={onApplyCharacterAvatar}
        />
      )}

      {/* Janela de Visualização do Tabuleiro (Viewport) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={(e) => {
          const coords = getMapCoordinates(e.clientX, e.clientY);
          emitPing(coords.x, coords.y);
        }}
        className={`relative w-full flex-1 min-h-[300px] h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${
          isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'draw'
            ? 'cursor-crosshair'
            : activeTool === 'ping'
            ? 'cursor-pointer'
            : 'cursor-default'
        }`}
      >
        {/* Camada do Tabuleiro com Transformações de Pan e Zoom */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${mapConfig.width}px`,
            height: `${mapConfig.height}px`,
            position: 'relative',
          }}
        >
          {/* 1. Imagem de Fundo do Mapa */}
          {mapConfig.imageUrl && (
            <img
              src={mapConfig.imageUrl}
              alt={mapConfig.title}
              draggable={false}
              className="absolute top-0 left-0 w-full h-full object-cover select-none pointer-events-none"
            />
          )}

          {/* 2. Grade Tática Personalizável */}
          {mapConfig.showGrid && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
              }}
            >
              <defs>
                <pattern
                  id="gridPattern"
                  width={mapConfig.gridSize}
                  height={mapConfig.gridSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${mapConfig.gridSize} 0 L 0 0 0 ${mapConfig.gridSize}`}
                    fill="none"
                    stroke={mapConfig.gridColor}
                    strokeWidth="1"
                    strokeOpacity={mapConfig.gridOpacity}
                  />
                </pattern>
              </defs>
              <rect width={mapConfig.width} height={mapConfig.height} fill="url(#gridPattern)" />
            </svg>
          )}

          {/* 2.5 Camada de Iluminação de Ambiente (Dia / Crepúsculo / Noite) */}
          {mapConfig.ambientLight === 'dusk' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
                backgroundColor: '#b45309',
                opacity: 0.22,
                mixBlendMode: 'color-burn',
                zIndex: 12,
              }}
            />
          )}

          {mapConfig.ambientLight === 'night' && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
                zIndex: 15,
              }}
            >
              <defs>
                <mask id="nightVisionMask">
                  <rect width={mapConfig.width} height={mapConfig.height} fill="white" />
                  {tokens.map((token) => {
                    const radiusMeters = token.hasTorch ? 6 : token.type === 'player' ? 3 : 1.5;
                    const radiusPx = (radiusMeters / 1.5) * mapConfig.gridSize;
                    const cx = token.x + (token.size * mapConfig.gridSize) / 2;
                    const cy = token.y + (token.size * mapConfig.gridSize) / 2;
                    return (
                      <circle
                        key={`mask-${token.id}`}
                        cx={cx}
                        cy={cy}
                        r={radiusPx}
                        fill="black"
                      />
                    );
                  })}
                </mask>
                <radialGradient id="torchGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#d97706" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect
                width={mapConfig.width}
                height={mapConfig.height}
                fill="#030712"
                fillOpacity="0.88"
                mask="url(#nightVisionMask)"
              />
              {tokens
                .filter((t) => t.hasTorch)
                .map((token) => {
                  const radiusPx = (6 / 1.5) * mapConfig.gridSize;
                  const cx = token.x + (token.size * mapConfig.gridSize) / 2;
                  const cy = token.y + (token.size * mapConfig.gridSize) / 2;
                  return (
                    <circle
                      key={`glow-${token.id}`}
                      cx={cx}
                      cy={cy}
                      r={radiusPx}
                      fill="url(#torchGlowGrad)"
                    />
                  );
                })}
            </svg>
          )}

          {/* 3. Névoa de Guerra (Fog of War) */}
          {mapConfig.fogOfWarEnabled && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
                opacity: 0.88,
                zIndex: 18,
              }}
            >
              <defs>
                <mask id="fogMask">
                  <rect width={mapConfig.width} height={mapConfig.height} fill="white" />
                  {mapConfig.revealedShapes
                    .filter((s) => s.isRevealed)
                    .map((s) => (
                      <rect
                        key={s.id}
                        x={s.x}
                        y={s.y}
                        width={s.width}
                        height={s.height}
                        fill="black"
                        rx="8"
                      />
                    ))}
                </mask>
              </defs>
              <rect
                width={mapConfig.width}
                height={mapConfig.height}
                fill="#05070a"
                mask="url(#fogMask)"
              />
            </svg>
          )}

          {/* 4. Modelos de Área de Efeito de Magias (AoE Templates) */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${mapConfig.width}px`,
              height: `${mapConfig.height}px`,
              pointerEvents: 'auto',
              zIndex: 19,
            }}
          >
            {(mapConfig.aoeTemplates || []).map((aoe) => {
              const sizePx = (aoe.sizeMeters / 1.5) * mapConfig.gridSize;
              return (
                <g
                  key={aoe.id}
                  className="cursor-move select-none"
                  onPointerDown={(e) => handleAoEDragStart(aoe.id, e)}
                >
                  {aoe.type === 'circle' && (
                    <circle
                      cx={aoe.x}
                      cy={aoe.y}
                      r={sizePx}
                      fill={aoe.color}
                      fillOpacity="0.32"
                      stroke={aoe.color}
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                    />
                  )}
                  {aoe.type === 'cone' && (
                    <path
                      d={generateConePath(aoe.x, aoe.y, sizePx, aoe.angle || 0)}
                      fill={aoe.color}
                      fillOpacity="0.32"
                      stroke={aoe.color}
                      strokeWidth="2.5"
                    />
                  )}
                  {aoe.type === 'line' && (
                    <rect
                      x={aoe.x}
                      y={aoe.y - mapConfig.gridSize / 2}
                      width={sizePx}
                      height={mapConfig.gridSize}
                      transform={`rotate(${aoe.angle || 0}, ${aoe.x}, ${aoe.y})`}
                      fill={aoe.color}
                      fillOpacity="0.32"
                      stroke={aoe.color}
                      strokeWidth="2.5"
                    />
                  )}
                  {aoe.type === 'cube' && (
                    <rect
                      x={aoe.x - sizePx / 2}
                      y={aoe.y - sizePx / 2}
                      width={sizePx}
                      height={sizePx}
                      fill={aoe.color}
                      fillOpacity="0.32"
                      stroke={aoe.color}
                      strokeWidth="2.5"
                      rx="4"
                    />
                  )}

                  {/* Rótulo da Magia com botão de fechar */}
                  <g transform={`translate(${aoe.x}, ${aoe.y})`}>
                    <rect
                      x="-55"
                      y="-12"
                      width="110"
                      height="24"
                      rx="6"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={aoe.color}
                      strokeWidth="1.5"
                    />
                    <text
                      x="-8"
                      y="4"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {aoe.label.split(' ')[0]}
                    </text>
                    <g
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAoE(aoe.id);
                      }}
                    >
                      <circle cx="40" cy="0" r="7" fill="#e11d48" />
                      <text x="40" y="3" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                        ✕
                      </text>
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* 5. Camada de Desenhos Livres Táticos */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${mapConfig.width}px`,
              height: `${mapConfig.height}px`,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            {(mapConfig.drawings || []).map((stroke) => (
              <path
                key={stroke.id}
                d={pointsToSvgPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.88"
              />
            ))}
            {currentStroke && (
              <path
                d={pointsToSvgPath(currentStroke.points)}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}
          </svg>

          {/* 6. Radar Pulsante de Pings */}
          {pings.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
                zIndex: 25,
              }}
            >
              {pings.map((ping) => (
                <g key={ping.id} transform={`translate(${ping.x}, ${ping.y})`}>
                  <circle r="14" fill={ping.color} fillOpacity="0.4" className="animate-ping" />
                  <circle r="28" stroke={ping.color} strokeWidth="3" fill="none" className="animate-pulse" />
                  <circle r="6" fill={ping.color} />
                </g>
              ))}
            </svg>
          )}

          {/* 7. Tokens sobre o Tabuleiro */}
          {tokens.map((token) => (
            <TokenMarker
              key={token.id}
              token={token}
              gridSize={mapConfig.gridSize}
              isActiveTurn={Boolean(activeTurnCombatantId && token.combatantId === activeTurnCombatantId)}
              isSelected={token.id === selectedTokenId}
              onSelect={() => onSelectToken(token.id)}
              onDragStart={(e) => handleTokenDragStart(token.id, e)}
            />
          ))}

          {/* 8. Camada de Números Flutuantes de Dano e Cura (Floating Combat Text) */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              style={{
                position: 'absolute',
                left: `${ft.x}px`,
                top: `${ft.y}px`,
                pointerEvents: 'none',
                zIndex: 45,
              }}
              className={`floating-combat-number select-none pointer-events-none font-serif font-black ${
                ft.type === 'crit'
                  ? 'text-yellow-300 text-lg sm:text-xl tracking-wider drop-shadow-[0_0_12px_rgba(234,179,8,1)]'
                  : ft.type === 'damage'
                  ? 'text-rose-400 text-base sm:text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'
                  : ft.type === 'heal'
                  ? 'text-emerald-400 text-base sm:text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'
                  : 'text-slate-300 text-xs sm:text-sm italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
              }`}
            >
              {ft.type === 'crit' ? `💥 CRÍTICO! ${ft.text}` : ft.text}
            </div>
          ))}

          {/* Barra Flutuante de Ações para o Token Selecionado */}
          {selectedTokenId && (() => {
            const token = tokens.find((t) => t.id === selectedTokenId);
            if (!token) return null;
            const curHp = typeof token.currentHp === 'number' ? token.currentHp : 10;
            const maxHp = typeof token.maxHp === 'number' ? token.maxHp : 10;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${token.x + (token.size * mapConfig.gridSize) / 2}px`,
                  top: `${token.y - 42}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 40,
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 border-2 border-amber-400 text-slate-200 px-2.5 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 text-xs animate-in zoom-in-95 pointer-events-auto select-none"
              >
                <span className="font-bold text-[10px] text-amber-300 mr-1 truncate max-w-[80px]">
                  {token.name}
                </span>

                {/* Alternar Tocha */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateToken?.(token.id, { hasTorch: !token.hasTorch });
                  }}
                  className={`p-1 rounded text-xs transition active:scale-90 ${
                    token.hasTorch
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={token.hasTorch ? 'Apagar Tocha' : 'Acender Tocha (6m de luz na escuridão)'}
                >
                  🔥
                </button>

                {/* Ajustar HP: -1 */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateToken?.(token.id, { currentHp: Math.max(0, curHp - 1) });
                  }}
                  className="px-1.5 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-mono font-bold text-[10px] active:scale-90 transition"
                  title="Subtrair 1 PV"
                >
                  -1
                </button>
                <span className="font-mono text-[10px] font-bold text-slate-300 px-0.5">
                  {curHp}/{maxHp}
                </span>
                {/* Ajustar HP: +1 */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateToken?.(token.id, { currentHp: Math.min(maxHp, curHp + 1) });
                  }}
                  className="px-1.5 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-mono font-bold text-[10px] active:scale-90 transition"
                  title="Adicionar 1 PV"
                >
                  +1
                </button>

                {/* Remover Token */}
                {onRemoveToken && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveToken(token.id);
                      onSelectToken(null);
                    }}
                    className="p-1 rounded text-rose-400 hover:bg-rose-950/80 transition ml-0.5 active:scale-90"
                    title="Remover Token do Mapa"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })()}

          {/* 5. Linha e Distância da Régua */}
          {ruler && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${mapConfig.width}px`,
                height: `${mapConfig.height}px`,
                pointerEvents: 'none',
                zIndex: 30,
              }}
            >
              <line
                x1={ruler.start.x}
                y1={ruler.start.y}
                x2={ruler.current.x}
                y2={ruler.current.y}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <circle cx={ruler.start.x} cy={ruler.start.y} r="5" fill="#38bdf8" />
              <circle cx={ruler.current.x} cy={ruler.current.y} r="5" fill="#38bdf8" />
              {rulerMetrics && (
                <g transform={`translate(${(ruler.start.x + ruler.current.x) / 2}, ${(ruler.start.y + ruler.current.y) / 2 - 14})`}>
                  <rect
                    x="-45"
                    y="-11"
                    width="90"
                    height="22"
                    rx="5"
                    fill="#020617"
                    fillOpacity="0.9"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {rulerMetrics.meters}m ({rulerMetrics.squares}q)
                  </text>
                </g>
              )}
            </svg>
          )}

          {/* 6. Caixa de Seleção da Névoa de Guerra */}
          {fogBox && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(fogBox.start.x, fogBox.current.x)}px`,
                top: `${Math.min(fogBox.start.y, fogBox.current.y)}px`,
                width: `${Math.abs(fogBox.current.x - fogBox.start.x)}px`,
                height: `${Math.abs(fogBox.current.y - fogBox.start.y)}px`,
                pointerEvents: 'none',
                zIndex: 35,
              }}
              className={`border-2 border-dashed ${
                activeTool === 'fog-reveal'
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : 'border-rose-400 bg-rose-500/20'
              }`}
            />
          )}
        </div>

        {/* Badge Flutuante da Régua (com metros e quadrados) */}
        {ruler && rulerMetrics && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500 text-cyan-300 font-mono font-bold px-4 py-2 rounded-xl shadow-2xl z-40 text-xs flex items-center gap-2 animate-in fade-in">
            <span>Distância: {rulerMetrics.meters} metros</span>
            <span className="text-slate-400">({rulerMetrics.squares} quadrados / {rulerMetrics.feet}ft)</span>
          </div>
        )}

        {/* Dica de navegação no rodapé do mapa */}
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
          Segure <strong>Espaço</strong> para arrastar a tela • Use a <strong>Roda do mouse</strong> para Zoom
        </div>
      </div>
    </div>
  );
};
