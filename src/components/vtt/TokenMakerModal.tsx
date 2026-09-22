import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Upload, 
  ZoomIn, 
  RotateCw, 
  Download, 
  Sparkles, 
  MapPin, 
  Check, 
  Move
} from 'lucide-react';
import type { MapToken } from '../../types/vtt';
import { SRD_CLASSES } from '../../data/srdClasses';

interface TokenMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTokenToMap?: (token: Omit<MapToken, 'id'>) => void;
  onApplyToCharacterAvatar?: (dataUrl: string) => void;
}

export type TokenFrameStyle = 'gold' | 'silver' | 'ruby' | 'amethyst' | 'emerald' | 'obsidian';

interface FrameOption {
  id: TokenFrameStyle;
  label: string;
  outerColor: string;
  innerColor: string;
  accentColor: string;
  borderBadge: string;
}

const FRAMES: FrameOption[] = [
  {
    id: 'gold',
    label: 'Ouro Heroico',
    outerColor: '#b45309',
    innerColor: '#f59e0b',
    accentColor: '#fef08a',
    borderBadge: 'border-amber-400 text-amber-300 bg-amber-950/60',
  },
  {
    id: 'silver',
    label: 'Prata Aventureira',
    outerColor: '#475569',
    innerColor: '#94a3b8',
    accentColor: '#f1f5f9',
    borderBadge: 'border-slate-400 text-slate-200 bg-slate-800/60',
  },
  {
    id: 'ruby',
    label: 'Rubi do Monstro',
    outerColor: '#881337',
    innerColor: '#e11d48',
    accentColor: '#fecdd3',
    borderBadge: 'border-rose-500 text-rose-300 bg-rose-950/60',
  },
  {
    id: 'amethyst',
    label: 'Ametista Mística',
    outerColor: '#581c87',
    innerColor: '#9333ea',
    accentColor: '#f3e8ff',
    borderBadge: 'border-purple-500 text-purple-300 bg-purple-950/60',
  },
  {
    id: 'emerald',
    label: 'Esmeralda Guardiã',
    outerColor: '#064e3b',
    innerColor: '#10b981',
    accentColor: '#a7f3d0',
    borderBadge: 'border-emerald-500 text-emerald-300 bg-emerald-950/60',
  },
  {
    id: 'obsidian',
    label: 'Obsidiana Sombria',
    outerColor: '#09090b',
    innerColor: '#27272a',
    accentColor: '#71717a',
    borderBadge: 'border-zinc-500 text-zinc-300 bg-zinc-900/60',
  },
];

export const TokenMakerModal: React.FC<TokenMakerModalProps> = ({
  isOpen,
  onClose,
  onAddTokenToMap,
  onApplyToCharacterAvatar,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState('Novo Token');
  const [tokenType, setTokenType] = useState<'player' | 'monster' | 'npc'>('player');
  const [tokenSize, setTokenSize] = useState<number>(1);
  const [selectedFrame, setSelectedFrame] = useState<TokenFrameStyle>('gold');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Carregar imagem de exemplo inicial se não houver
  useEffect(() => {
    if (!imageSrc) {
      const defaultImg = new Image();
      defaultImg.crossOrigin = 'anonymous';
      defaultImg.onload = () => {
        imageRef.current = defaultImg;
        renderCanvas();
      };
      // Criar avatar placeholder procedural com gradiente se não houver imagem
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 256;
      tempCanvas.height = 256;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚔️', 128, 128);
        setImageSrc(tempCanvas.toDataURL());
      }
    }
  }, []);

  // Recarregar imagem quando imageSrc mudar
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      renderCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redesenhar canvas sempre que as propriedades mudarem
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = center - 16; // Margem para a moldura

    ctx.clearRect(0, 0, size, size);

    // Salva o estado para recortar a imagem dentro do círculo
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fundo interno
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Desenhar Imagem com Transformações (Pan, Zoom, Rotação)
    if (imageRef.current) {
      const img = imageRef.current;
      ctx.save();
      ctx.translate(center + offset.x, center + offset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      // Desenhar centralizada
      const imgAspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      if (imgAspect > 1) {
        drawW = size * imgAspect;
      } else {
        drawH = size / imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    ctx.restore(); // Restaura fora do clip para desenhar a moldura circular sobreposta

    // Desenho da Moldura Decorativa (Anel Duplo D&D)
    const frame = FRAMES.find((f) => f.id === selectedFrame) || FRAMES[0];

    // Anel externo grosso
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = frame.outerColor;
    ctx.stroke();

    // Anel principal metálico brilhante
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = frame.innerColor;
    ctx.stroke();

    // Anel interno fino de acabamento
    ctx.beginPath();
    ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = frame.accentColor;
    ctx.stroke();

    // Pequenos rebites decorativos nas 4 direções cardeais
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const rx = center + (radius + 1) * Math.cos(angle);
      const ry = center + (radius + 1) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = frame.accentColor;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
  }, [selectedFrame, scale, rotation, offset]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Manipulação de Arquivo Local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setOffset({ x: 0, y: 0 });
      setScale(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  // Arrastar com mouse no canvas para Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Obter DataURL atual do Canvas
  const getTokenDataUrl = (): string | null => {
    return canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
  };

  // Ação: Baixar PNG do Token
  const handleDownload = () => {
    const url = getTokenDataUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-${tokenName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    showFeedback('Token baixado com sucesso!');
  };

  // Ação: Enviar ao Mapa Tático
  const handleSendToMap = () => {
    const url = getTokenDataUrl();
    if (!url || !onAddTokenToMap) return;

    onAddTokenToMap({
      name: tokenName,
      x: 250,
      y: 250,
      size: tokenSize,
      color: FRAMES.find((f) => f.id === selectedFrame)?.innerColor || '#f59e0b',
      avatarUrl: url,
      currentHp: 20,
      maxHp: 20,
      type: tokenType,
      conditions: [],
    });

    showFeedback('Token adicionado à mesa tática!');
    setTimeout(() => onClose(), 800);
  };

  // Ação: Usar como Avatar na Ficha
  const handleApplyAvatar = () => {
    const url = getTokenDataUrl();
    if (!url || !onApplyToCharacterAvatar) return;
    onApplyToCharacterAvatar(url);
    showFeedback('Retrato aplicado à ficha!');
    setTimeout(() => onClose(), 800);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-2xl rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Criador de Tokens Circulares de RPG
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notificação de Feedback */}
        {feedbackMsg && (
          <div className="my-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={14} /> {feedbackMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          
          {/* Lado Esquerdo: Canvas Interativo */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group cursor-grab active:cursor-grabbing">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-full shadow-2xl border border-slate-700 bg-slate-950"
              />
              <div className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                <span className="text-[11px] font-bold text-amber-200 bg-slate-900/90 px-2.5 py-1 rounded-full border border-amber-500/40 shadow flex items-center gap-1">
                  <Move size={12} /> Arraste para enquadrar
                </span>
              </div>
            </div>

            {/* Upload de Imagem */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Upload size={14} className="text-amber-400" />
              Carregar Imagem / Foto
            </button>

            {/* Presets Rápidos de Classes D&D */}
            <div className="w-full max-w-[280px]">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 text-center">
                Ou use a ilustração de uma Classe:
              </span>
              <div className="grid grid-cols-6 gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                {SRD_CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    title={cls.name}
                    onClick={() => {
                      setImageSrc(cls.avatarUrl);
                      setTokenName(cls.name);
                      setTokenType('player');
                      setScale(1);
                      setRotation(0);
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 flex items-center justify-center p-0.5 transition active:scale-95 group"
                  >
                    <img
                      src={cls.avatarUrl}
                      alt={cls.name}
                      className="w-full h-full object-contain filter drop-shadow group-hover:scale-110 transition"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lado Direito: Controles & Molduras */}
          <div className="flex flex-col gap-3 text-xs">
            
            {/* Nome e Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Nome do Token
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="rpg-input py-1 px-2.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Tipo
                </label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as 'player' | 'monster' | 'npc')}
                  className="rpg-input py-1 px-2 text-xs w-full"
                >
                  <option value="player">Jogador (Herói)</option>
                  <option value="monster">Monstro / Inimigo</option>
                  <option value="npc">Aliado / NPC</option>
                </select>
              </div>
            </div>

            {/* Tamanho da Criatura */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Tamanho no Grid Tático
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { size: 1, label: 'Médio / Pequeno (1x1)' },
                  { size: 2, label: 'Grande (2x2)' },
                  { size: 3, label: 'Enorme (3x3)' },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setTokenSize(s.size)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition ${
                      tokenSize === s.size
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ajustes de Zoom e Rotação */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <ZoomIn size={13} className="text-amber-400" /> Zoom: {(scale * 100).toFixed(0)}%
                </span>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-32 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <RotateCw size={13} className="text-amber-400" /> Rotação: {rotation}°
                </span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="w-32 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Seleção de Molduras */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Estilo da Moldura Circular
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {FRAMES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFrame(f.id)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 transition ${
                      selectedFrame === f.id
                        ? `${f.borderBadge} ring-2 ring-amber-400/40 font-black scale-[1.02]`
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: f.innerColor }}
                    />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Salvar arquivo PNG no computador"
          >
            <Download size={14} /> Baixar PNG
          </button>

          <div className="flex items-center gap-2">
            {onApplyToCharacterAvatar && (
              <button
                type="button"
                onClick={handleApplyAvatar}
                className="rpg-button bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Sparkles size={14} /> Usar na Ficha
              </button>
            )}

            {onAddTokenToMap && (
              <button
                type="button"
                onClick={handleSendToMap}
                className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-lg"
              >
                <MapPin size={14} /> Adicionar ao Mapa
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
