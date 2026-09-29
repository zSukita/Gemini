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
  Users,
  Smartphone,
  Menu,
  X,
} from 'lucide-react';
import { usePwaInstall } from '../utils/pwa';

import type { PeerUser } from '../types/vtt';

export type AppMode = 'player' | 'dm' | 'vtt';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  encounter: Encounter;
  isMultiplayerConnected: boolean;
  roomCode: string;
  peersCount: number;
  connectedPeers?: PeerUser[];
  isHost?: boolean;
  isPinnedOnlineList?: boolean;
  onTogglePinOnlineList?: () => void;
  isSocialOpen?: boolean;
  onToggleSocial?: () => void;
  onlineUsersCount?: number;
  friendsCount?: number;
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
  connectedPeers = [],
  isHost = false,
  isPinnedOnlineList = false,
  onTogglePinOnlineList,
  isSocialOpen = false,
  onToggleSocial,
  onlineUsersCount,
  friendsCount,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const { isInstallable, triggerInstall } = usePwaInstall();

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
    <>
      {/* ─── CABEÇALHO MOBILE (COMPACTO COM 2 LINHAS & MENU EXPANSÍVEL) ─── */}
      <div className="md:hidden w-full mb-3 bg-slate-900/95 border border-amber-500/30 rounded-2xl p-2.5 shadow-xl backdrop-blur-md relative z-40">
        {/* Linha 1: Logo + Status de Combate + Avatar + Botão Menu */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Logo e Título */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-serif font-black text-xs shadow-md shadow-amber-500/20">
              ⚔
            </div>
            <div>
              <span className="font-serif font-black tracking-wider text-sm text-amber-200">
                ArcanaSheet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Indicador de Combate Compacto */}
            {encounter.isRunning && (
              <button
                type="button"
                onClick={() => onSelectMode('dm')}
                className="flex items-center gap-1 bg-rose-950/70 border border-rose-500/60 text-rose-200 px-2 py-1 rounded-lg text-[11px] font-bold animate-pulse cursor-pointer"
                title="Combate em andamento: ir para o Painel do Mestre"
              >
                <Swords size={12} className="text-rose-400" />
                <span>R{encounter.round}</span>
              </button>
            )}

            {/* Avatar do Usuário */}
            {userName && (
              <div 
                className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[11px] font-bold text-slate-950 border border-amber-400/40"
                title={userName}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Botão de Menu para Ações Secundárias */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-sm active:scale-95 flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
              title="Menu de Ferramentas, Campanhas e Opções"
              aria-label="Abrir menu secundário"
            >
              <Menu size={18} />
              {((friendsCount !== undefined && friendsCount > 0) || (onlineUsersCount !== undefined && onlineUsersCount > 0) || isMultiplayerConnected) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Linha 2: Seletor Segmentado de Modos (Ficha, Mestre, Mapa VTT) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full text-xs font-semibold">
          <button
            id="nav-mode-player"
            type="button"
            onClick={() => onSelectMode('player')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition min-h-[38px] ${
              currentMode === 'player'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={13} />
            <span>Ficha</span>
          </button>

          <button
            id="nav-mode-dm"
            type="button"
            onClick={() => onSelectMode('dm')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition min-h-[38px] ${
              currentMode === 'dm'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown size={13} />
            <span>Mestre</span>
          </button>

          <button
            id="nav-mode-vtt"
            type="button"
            onClick={() => onSelectMode('vtt')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition min-h-[38px] ${
              currentMode === 'vtt'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map size={13} />
            <span>Mapa</span>
          </button>
        </div>

        {/* Gaveta / Modal Móvel de Ações Secundárias */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div 
              role="dialog"
              aria-modal="true"
              aria-label="Menu de Ações Secundárias"
              className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/98 border-t-2 border-amber-500/70 rounded-t-3xl shadow-2xl shadow-black p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 ring-1 ring-amber-500/20 space-y-4"
            >
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1" />
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="font-serif font-bold text-sm text-amber-200">
                    Menu & Ferramentas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-xs font-semibold"
                >
                  <X size={15} />
                  <span>Fechar</span>
                </button>
              </div>

              {/* Sala Online P2P */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMultiplayerConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="text-xs font-bold text-slate-200">
                    {isMultiplayerConnected ? `Sala: ${roomCode}` : 'Modo Offline'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenMultiplayer();
                  }}
                  className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/40"
                >
                  {isMultiplayerConnected ? 'Gerenciar' : 'Conectar'}
                </button>
              </div>

              {/* Botões Principais de Navegação Secundária */}
              <div className="grid grid-cols-2 gap-2">
                {onOpenCampaigns && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCampaigns();
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200 flex items-center gap-2.5 font-bold text-xs"
                  >
                    <Compass size={16} className="text-amber-400" />
                    <span>Mesas na Nuvem</span>
                  </button>
                )}

                {onOpenAiDm && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAiDm();
                    }}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-indigo-600/20 border border-amber-500/40 text-amber-200 flex items-center gap-2.5 font-bold text-xs"
                  >
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                    <span>Oráculo IA</span>
                  </button>
                )}

                {onToggleSocial && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleSocial();
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-between font-bold text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-amber-400" />
                      <span>Comunidade</span>
                    </div>
                    {onlineUsersCount !== undefined && onlineUsersCount > 0 && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                        {onlineUsersCount} online
                      </span>
                    )}
                  </button>
                )}

                {onToggleChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleChat();
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 flex items-center gap-2.5 font-bold text-xs"
                  >
                    <MessageSquare size={16} />
                    <span>Chat Tático</span>
                  </button>
                )}

                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenPrint();
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2.5 font-bold text-xs"
                  >
                    <Printer size={16} className="text-amber-400" />
                    <span>Imprimir / PDF</span>
                  </button>
                )}

                {isInstallable && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      triggerInstall();
                    }}
                    className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-2.5 font-bold text-xs"
                  >
                    <Smartphone size={16} />
                    <span>Instalar App</span>
                  </button>
                )}
              </div>

              {/* Temas Visuais */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette size={13} className="text-amber-400" />
                  <span>Tema Visual</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => onSelectTheme(theme.id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between border transition ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/50'
                            : 'bg-slate-950/60 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.iconColor}`} />
                          <span className="text-[11px] truncate">{theme.label}</span>
                        </div>
                        {isSelected && <Check size={12} className="text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sair da Conta */}
              {userName && onLogout && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">{userName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <LogOut size={13} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── CABEÇALHO DESKTOP (HORIZONTAL COMPLETO) ─── */}
      <div className="hidden md:flex w-full mb-4 items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2.5 sm:px-4 shadow-xl backdrop-blur-md relative z-40">
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
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap xl:flex-nowrap">
          {/* Alternador de 3 Modos */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-mode-player-desktop"
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
              id="nav-mode-dm-desktop"
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
              id="nav-mode-vtt-desktop"
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

          {/* Badge da Sala Online P2P com Lista Interativa */}
          <RoomBadge
            isConnected={isMultiplayerConnected}
            roomCode={roomCode}
            peersCount={peersCount}
            connectedPeers={connectedPeers}
            currentUserName={userName || undefined}
            isHost={isHost}
            isPinned={isPinnedOnlineList}
            onTogglePin={onTogglePinOnlineList}
            onClick={onOpenMultiplayer}
            onOpenTabletop={() => onSelectMode('vtt')}
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

          {/* Botão de Amigos & Comunidade Online */}
          {onToggleSocial && (
            <button
              type="button"
              onClick={onToggleSocial}
              className={`p-2 rounded-xl border transition shadow-sm flex items-center gap-1.5 cursor-pointer ${
                isSocialOpen
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-amber-500/40'
              }`}
              title="Comunidade: Quem está Online no Site & Lista de Amigos"
            >
              <Users size={14} className={isSocialOpen ? 'text-amber-300' : 'text-amber-400'} />
              <span className="hidden sm:inline text-xs font-bold">
                Amigos{friendsCount !== undefined && friendsCount > 0 ? ` (${friendsCount})` : ''}
              </span>
              {onlineUsersCount !== undefined && onlineUsersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title={`${onlineUsersCount} online agora`} />
              )}
            </button>
          )}

          {/* Barra de Ferramentas Rápidas (Chat, Impressão, Música, Temas, Tela Dupla) */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 shrink-0">
            {/* Botão de Instalar App (PWA) */}
            {isInstallable && (
              <button
                type="button"
                onClick={triggerInstall}
                className="p-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 text-xs font-bold animate-pulse cursor-pointer shadow-sm shadow-amber-500/10"
                title="Instalar ArcanaSheet como aplicativo no seu dispositivo"
              >
                <Smartphone size={13} className="text-amber-400" />
                <span className="hidden xl:inline text-[11px]">Instalar App</span>
              </button>
            )}

            {/* Botão de Chat Tático */}
            {onToggleChat && (
              <button
                type="button"
                onClick={onToggleChat}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-indigo-300 transition relative cursor-pointer"
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
                className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-300 transition cursor-pointer"
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
                className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 transition flex items-center justify-center cursor-pointer"
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
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
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              title="Abrir em nova janela (ideal para 2 monitores: mapa em uma tela, ficha na outra)"
            >
              <ExternalLink size={14} />
            </button>
          </div>

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
    </>
  );
};
