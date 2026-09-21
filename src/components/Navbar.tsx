import React, { useState, useRef, useEffect } from 'react';
import type { Encounter } from '../types/combat';
import type { ThemeId } from '../types/dnd5e';
import { RoomBadge } from './multiplayer/RoomBadge';
import { SoundtrackMiniPlayer } from './SoundtrackMiniPlayer';
import { 
  User, 
  Crown, 
  Swords, 
  Map, 
  ExternalLink,
  Printer,
  MessageSquare,
  Palette,
  Check,
  LogOut,
  Compass,
  Sparkles,
} from 'lucide-react';

export type AppMode = 'player' | 'dm' | 'vtt';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  encounter: Encounter;
  isMultiplayerConnected: boolean;
  roomCode: string;
  peersCount: number;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onOpenMultiplayer: () => void;
  onOpenCampaigns?: () => void;
  onOpenAiDm?: () => void;
  onOpenPrint?: () => void;
  onToggleChat?: () => void;
  onOpenMusicPlayer?: () => void;
  userName?: string | null;
  onLogout?: () => void;
}

const THEME_OPTIONS: { id: ThemeId; label: string; iconColor: string; desc: string }[] = [
  { id: 'default', label: 'Ouro & Ardósia', iconColor: 'bg-amber-500', desc: 'Padrão Clássico' },
  { id: 'parchment', label: 'Pergaminho Antigo', iconColor: 'bg-amber-700', desc: 'Sépia & Medieval' },
  { id: 'crimson', label: 'Carmesim & Gótico', iconColor: 'bg-rose-700', desc: 'Obsidiana & Sangue' },
  { id: 'arcane', label: 'Místico Arcano', iconColor: 'bg-indigo-600', desc: 'Cosmos & Astral' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  encounter,
  isMultiplayerConnected,
  roomCode,
  peersCount,
  currentTheme,
  onSelectTheme,
  onOpenMultiplayer,
  onOpenCampaigns,
  onOpenAiDm,
  onOpenPrint,
  onToggleChat,
  onOpenMusicPlayer,
  userName,
  onLogout,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const activeCombatant = encounter.combatants[encounter.activeCombatantIndex];

  const handleOpenSecondWindow = () => {
    window.open(window.location.href, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="w-full mb-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2.5 sm:px-4 shadow-xl backdrop-blur-md relative z-40">
      {/* Logo e Título */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-serif font-black shadow-md shadow-amber-500/20">
          ⚔
        </div>
        <div>
          <span className="font-serif font-black tracking-wider text-base text-amber-200">
            ArcanaSheet
          </span>
          <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
            VTT & Ficha D&D 5e
          </span>
        </div>
      </div>

      {/* Indicador de Combate Ativo (visível em todos os modos) */}
      {encounter.isRunning && (
        <div
          onClick={() => onSelectMode('dm')}
          className="flex items-center gap-2 bg-rose-950/50 border border-rose-500/50 text-rose-200 px-3 py-1 rounded-xl text-xs cursor-pointer hover:bg-rose-900/40 transition select-none animate-pulse"
          title="Clique para ir ao Painel do Mestre"
        >
          <Swords size={13} className="text-rose-400" />
          <span className="font-bold">Combate Rodada {encounter.round}:</span>
          <span className="font-mono text-amber-300">
            {activeCombatant?.name || 'Iniciando'}
          </span>
        </div>
      )}

      {/* Seletor de Modos (Ficha, Mestre, Mapa) + Sala Online + Dual Monitor */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Alternador de 3 Modos */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onSelectMode('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentMode === 'player'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={13} />
            <span>Ficha</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('dm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentMode === 'dm'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown size={13} />
            <span>Mestre</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('vtt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentMode === 'vtt'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map size={13} />
            <span>Mapa (VTT)</span>
          </button>
        </div>

        {/* Badge da Sala Online P2P */}
        <RoomBadge
          isConnected={isMultiplayerConnected}
          roomCode={roomCode}
          peersCount={peersCount}
          onClick={onOpenMultiplayer}
        />

        {/* Botão de Campanhas & Mesas */}
        {onOpenCampaigns && (
          <button
            type="button"
            onClick={onOpenCampaigns}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-sm flex items-center gap-1.5"
            title="Campanhas & Mesas de RPG na Nuvem"
          >
            <Compass size={14} />
            <span className="hidden lg:inline text-xs font-bold">Mesa</span>
          </button>
        )}

        {/* Botão do Mestre IA / Oráculo */}
        {onOpenAiDm && (
          <button
            type="button"
            onClick={onOpenAiDm}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-indigo-600/20 hover:from-amber-500/30 hover:to-indigo-600/30 text-amber-300 border border-amber-500/50 transition shadow-sm flex items-center gap-1.5 active:scale-95"
            title="Mestre IA (Dungeon Master & Oráculo com Gemini)"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span className="hidden sm:inline text-xs font-black tracking-wide bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">Mestre IA</span>
          </button>
        )}

        {/* Botão de Chat Tático */}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition shadow-sm relative"
            title="Abrir Chat Tático e Rolagens da Sessão"
          >
            <MessageSquare size={14} />
          </button>
        )}

        {/* Botão de Impressão / Salvar PDF */}
        {onOpenPrint && (
          <button
            type="button"
            onClick={onOpenPrint}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-sm"
            title="Imprimir Ficha ou Salvar em PDF"
          >
            <Printer size={14} />
          </button>
        )}

        {/* Reprodutor de Trilha Sonora Mini */}
        {onOpenMusicPlayer && (
          <SoundtrackMiniPlayer onOpenFullModal={onOpenMusicPlayer} />
        )}

        {/* Menu Seletor de Temas Visuais */}
        <div className="relative z-50" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition shadow-sm flex items-center gap-1"
            title="Mudar Tema Visual da Interface"
          >
            <Palette size={14} />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 ring-1 ring-amber-500/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1.5 border-b border-slate-800 mb-1 flex items-center gap-1.5">
                <Palette size={12} className="text-amber-400" />
                <span>Temas Visuais</span>
              </div>
              <div className="space-y-1">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        onSelectTheme(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${theme.iconColor} shadow-xs border border-white/20`} />
                        <div>
                          <p className="leading-none">{theme.label}</p>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{theme.desc}</span>
                        </div>
                      </div>
                      {isSelected && <Check size={13} className="text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Botão Dual Screen (Abrir Segunda Janela) */}
        <button
          type="button"
          onClick={handleOpenSecondWindow}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Abrir em nova janela (ideal para 2 monitores: mapa em uma tela, ficha na outra)"
        >
          <ExternalLink size={14} />
        </button>

        {/* Info do Usuário + Sair */}
        {userName && onLogout && (
          <div className="flex items-center gap-2 ml-1">
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 px-2.5 py-1.5 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-slate-950">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 max-w-[80px] truncate" title={userName}>{userName}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 transition"
              title="Sair da conta"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
