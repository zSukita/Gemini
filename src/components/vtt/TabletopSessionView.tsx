import React, { useState, useMemo } from 'react';
import type { BattleMapConfig, MapToken, PeerUser, FogShape } from '../../types/vtt';
import type { DefaultMapPreset } from '../../data/defaultMaps';
import type { Encounter, ConditionKey, Combatant } from '../../types/combat';
import type { Character, DiceRollResult } from '../../types/dnd5e';
import type { ChatMessage, ChatMessageType } from '../../types/chat';
import { BattleMap } from './BattleMap';
import { TabletopParchmentChat } from './TabletopParchmentChat';
import { TabletopCombatTracker } from './TabletopCombatTracker';
import { TabletopTargetCard } from './TabletopTargetCard';

export type MapToolType = 'select' | 'measure' | 'fog-reveal' | 'fog-hide' | 'draw' | 'ping';
import { 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  Sparkles, 
  Globe, 
  User, 
  Music, 
  Heart,
  Sword,
  Crown,
  ChevronDown,
  ChevronUp,
  Flag
} from 'lucide-react';
import type { AiAdventureScenario } from '../../data/aiAdventureScenarios';

interface TabletopSessionViewProps {
  character: Character;
  charactersList?: Character[];
  encounter: Encounter;
  mapConfig: BattleMapConfig;
  tokens: MapToken[];
  selectedTokenId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  activeTool: MapToolType;
  chatLog: ChatMessage[];
  currentUserName: string;
  isHost: boolean;
  isConnected: boolean;
  connectedPeers: PeerUser[];
  isAiResponding?: boolean;

  // Handlers do Mapa
  onSelectToken: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onSetZoom: (z: number | ((prev: number) => number)) => void;
  onSetPan: (p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onSetActiveTool: (t: MapToolType) => void;
  onUpdateMapConfig: (updater: Partial<BattleMapConfig> | ((prev: BattleMapConfig) => BattleMapConfig)) => void;
  onSelectMapPreset: (preset: DefaultMapPreset) => void;
  onUploadMap: (title: string, dataUrl: string, width: number, height: number) => void;
  onAddFogShape: (s: Omit<FogShape, 'id'>) => void;
  onResetFog: () => void;
  onRevealAllFog: () => void;
  onUpdateToken: (id: string, updates: Partial<MapToken>) => void;
  onRemoveToken: (id: string) => void;
  onAddToken: (t: Omit<MapToken, 'id'>) => void;
  onApplyCharacterAvatar?: (dataUrl: string) => void;

  // Handlers do Chat & IA
  onSendMessage: (
    textOrPayload:
      | string
      | {
          id?: string;
          text: string;
          senderName?: string;
          type?: ChatMessageType;
          recipientName?: string;
          diceRoll?: DiceRollResult;
          suggestedActions?: string[];
          requestedRoll?: { skillOrAbility: string; dc?: number; reason: string };
          aiHandledBySender?: boolean;
        },
    senderFallback?: string
  ) => void;

  // Handlers de Rolagem de Dados
  onRollDie: (sides: number) => void;
  onRollFormula: (formula: string, label: string) => void;
  onRollD20: (label: string, modifier: number) => void;

  // Handlers do Combate
  onStartEncounter?: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onSortInitiative: () => void;
  onResetEncounter?: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onToggleCondition?: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative?: (id: string, init: number) => void;
  onRemoveCombatant?: (id: string) => void;
  onRollMonsterAttack: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollMonsterDamage: (monsterName: string, actionName: string, formula: string) => void;
  onAiMonsterAttack?: (combatant?: Combatant) => void;

  // Abertura de Modais Rápidos
  onOpenMultiplayerModal?: () => void;
  onOpenAiDmModal?: () => void;
  onOpenCompendium?: () => void;
  onOpenBestiary?: () => void;
  onOpenCharacterSheet?: () => void;
  onOpenMusicPlayer?: () => void;
  onOpenEndSessionModal?: () => void;
  onStartScenario?: (scenario: AiAdventureScenario) => void;
}

export const TabletopSessionView: React.FC<TabletopSessionViewProps> = ({
  character,
  charactersList = [],
  encounter,
  mapConfig,
  tokens,
  selectedTokenId,
  zoom,
  pan,
  activeTool,
  chatLog,
  currentUserName,
  isHost,
  isConnected,
  connectedPeers,
  isAiResponding,
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
  onSendMessage,
  onRollDie,
  onRollFormula,
  onRollD20,
  onStartEncounter,
  onNextTurn,
  onPreviousTurn,
  onSortInitiative,
  onResetEncounter,
  onHpDelta,
  onToggleCondition,
  onUpdateInitiative,
  onRemoveCombatant,
  onRollMonsterAttack,
  onRollMonsterDamage,
  onAiMonsterAttack,
  onOpenMultiplayerModal,
  onOpenAiDmModal,
  onOpenCompendium,
  onOpenBestiary,
  onOpenCharacterSheet,
  onOpenMusicPlayer,
  onOpenEndSessionModal,
  onStartScenario,
}) => {
  // Alternância entre Visão Completa da Mesa e Modo Foco no Mapa
  const [isMapFocusOnly, setIsMapFocusOnly] = useState(false);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [isBottomDockOpen, setIsBottomDockOpen] = useState(false);

  // Determina o combatente/alvo ativo para inspeção
  const activeTarget: Combatant | null = useMemo(() => {
    if (selectedCombatantId) {
      const found = encounter.combatants.find((c) => c.id === selectedCombatantId);
      if (found) return found;
    }
    if (selectedTokenId) {
      const token = tokens.find((t) => t.id === selectedTokenId);
      if (token?.combatantId) {
        const found = encounter.combatants.find((c) => c.id === token.combatantId);
        if (found) return found;
      }
      // Se for token avulso sem combatantId, monta combatente sintético
      if (token) {
        return {
          id: token.id,
          name: token.name,
          type: token.type,
          initiative: 10,
          armorClass: 14,
          maxHp: token.maxHp,
          currentHp: token.currentHp,
          tempHp: 0,
          conditions: [],
        };
      }
    }
    // Fallback: primeiro monstro do encontro
    return encounter.combatants.find((c) => c.type === 'monster') || null;
  }, [selectedCombatantId, selectedTokenId, encounter.combatants, tokens]);

  // Lista dos Heróis do Grupo para a Barra Superior de Retratos
  const partyMembers = useMemo(() => {
    const list: { id: string; name: string; avatarUrl?: string; hp?: number; maxHp?: number; isCurrent: boolean }[] = [];
    // 1. Personagem Local
    list.push({
      id: character.id || 'local-char',
      name: character.name || currentUserName || 'Você',
      avatarUrl: character.avatarUrl,
      hp: character.currentHp ?? 20,
      maxHp: character.maxHp ?? 20,
      isCurrent: true,
    });

    // 2. Colegas conectados via WebRTC
    connectedPeers.forEach((p) => {
      if (p.name !== character.name) {
        list.push({
          id: p.peerId,
          name: p.name,
          hp: 25,
          maxHp: 25,
          isCurrent: false,
        });
      }
    });

    // 3. Demais personagens jogadores no encontro
    encounter.combatants
      .filter((c) => c.type === 'player' && c.name !== character.name && !list.some((m) => m.name === c.name))
      .forEach((c) => {
        list.push({
          id: c.id,
          name: c.name,
          hp: c.currentHp,
          maxHp: c.maxHp,
          isCurrent: false,
        });
      });

    return list;
  }, [character, currentUserName, connectedPeers, encounter.combatants]);

  // Execução de Macros da Barra Rápida (Hotbar 1 a 12)
  const handleMacroClick = (slotNumber: number) => {
    const charName = character.name || currentUserName || 'Aventureiro';
    switch (slotNumber) {
      case 1: // Ataque
        onRollD20(`${charName}: Ataque Básico`, character.abilities?.str?.score ? Math.floor((character.abilities.str.score - 10) / 2) + 2 : 2);
        break;
      case 2: // Esquiva
        onSendMessage(`${charName} assume postura defensiva com a ação de Esquiva! Todos os ataques contra ele têm desvantagem nesta rodada.`, charName);
        break;
      case 3: // Disparada
        onSendMessage(`${charName} utiliza a ação de Disparada, dobrando seu deslocamento para fugir ou alcançar o inimigo!`, charName);
        break;
      case 4: // Desengajar
        onSendMessage(`${charName} utiliza Desengajar para recuar sem provocar ataques de oportunidade.`, charName);
        break;
      case 5: // Esconder-se
        {
          const dexMod = character.abilities?.dex?.score ? Math.floor((character.abilities.dex.score - 10) / 2) : 2;
          onRollD20(`${charName}: Teste de Furtividade (Esconder-se)`, dexMod);
        }
        break;
      case 6: // Ajudar
        onSendMessage(`${charName} presta auxílio a um aliado, concedendo vantagem no próximo teste ou ataque!`, charName);
        break;
      case 7: // Iniciativa
        {
          const dexMod = character.abilities?.dex?.score ? Math.floor((character.abilities.dex.score - 10) / 2) : 0;
          const initMod = (character.initiativeBonus ?? 0) + dexMod;
          onRollD20(`${charName}: Rolagem de Iniciativa`, initMod);
        }
        break;
      case 8: // Percepção
        {
          const wisMod = character.abilities?.wis?.score ? Math.floor((character.abilities.wis.score - 10) / 2) : 0;
          onRollD20(`${charName}: Teste de Percepção`, wisMod + 2);
        }
        break;
      case 9: // Atletismo
        {
          const strMod = character.abilities?.str?.score ? Math.floor((character.abilities.str.score - 10) / 2) : 0;
          onRollD20(`${charName}: Teste de Atletismo`, strMod + 2);
        }
        break;
      case 10: // Acrobacia
        {
          const dexMod = character.abilities?.dex?.score ? Math.floor((character.abilities.dex.score - 10) / 2) : 0;
          onRollD20(`${charName}: Teste de Acrobacia`, dexMod + 2);
        }
        break;
      case 11: // Curar / Segundo Vento
        onRollFormula('1d10+1', `${charName}: Segundo Vento / Recuperação de PV`);
        break;
      case 12: // Chamar Mestre IA
        onSendMessage('@mestre Olhamos com atenção ao nosso redor. O que acontece agora e o que os perigos da masmorra nos revelam?', charName);
        break;
      default:
        break;
    }
  };

  return (
    <div className="tabletop-wood-bg w-full h-[calc(100vh-3.8rem)] flex flex-col overflow-hidden select-none relative animate-in fade-in duration-200">
      
      {/* 1. BARRA SUPERIOR: RETRATOS DO GRUPO (PARTY PORTRAITS) & CONTROLES */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#3b2413] bg-black/40 backdrop-blur-sm shrink-0 z-10">
        
        {/* Retratos Circulares dos Heróis (Estilo Fantasy Grounds) */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          {partyMembers.map((hero) => (
            <div
              key={hero.id}
              className="flex items-center gap-2 bg-[#2a170d]/80 border border-[#8a633b] px-2.5 py-1 rounded-full shadow-lg hover:border-amber-400 transition cursor-pointer"
              title={`${hero.name} (PV: ${hero.hp}/${hero.maxHp})`}
            >
              <div className="relative w-8 h-8 rounded-full border-2 border-amber-400/90 overflow-hidden bg-[#160c07] shadow shrink-0 flex items-center justify-center text-xs text-amber-200 font-bold">
                {hero.avatarUrl ? (
                  <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} />
                )}
                {hero.isCurrent && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                )}
              </div>

              <div className="flex flex-col pr-1">
                <span className="text-[11px] font-serif font-black text-amber-100 leading-tight truncate max-w-[90px]">
                  {hero.name}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-amber-300/80 font-mono">
                  <Heart size={9} className="text-red-400" />
                  <span>{hero.hp}/{hero.maxHp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controles da Mesa & Alternador de Foco */}
        <div className="flex items-center gap-2">
          {/* Status Multiplayer */}
          <button
            type="button"
            onClick={onOpenMultiplayerModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1.5 transition ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-amber-500/40'
            }`}
            title={
              isConnected
                ? `Online na Mesa: ${[character.name || 'Você', ...connectedPeers.map((p) => p.name)].join(', ')} (Clique para detalhes)`
                : 'Conexão Online Multiplayer WebRTC'
            }
          >
            {isHost ? (
              <Crown size={14} className="text-amber-400" />
            ) : (
              <Globe size={14} className={isConnected ? 'text-emerald-400' : 'text-slate-400'} />
            )}
            <span>
              {isConnected ? `Online (${connectedPeers.length + 1})` : 'Multiplayer'}
            </span>
          </button>

          {/* Mestre IA */}
          <button
            type="button"
            onClick={onOpenAiDmModal}
            className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-serif font-bold flex items-center gap-1.5 hover:bg-amber-900/60 transition shadow"
            title="Abrir Oráculo IA / Gerador de Aventuras"
          >
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>Mestre IA</span>
          </button>

          {/* Finalizar / Nova Mesa */}
          {onOpenEndSessionModal && (
            <button
              type="button"
              onClick={onOpenEndSessionModal}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 text-red-200 text-xs font-serif font-bold flex items-center gap-1.5 transition shadow"
              title="Finalizar esta mesa ou iniciar uma nova aventura"
            >
              <Flag size={14} className="text-red-400" />
              <span>Finalizar Mesa</span>
            </button>
          )}

          {/* Trilha Sonora */}
          {onOpenMusicPlayer && (
            <button
              type="button"
              onClick={onOpenMusicPlayer}
              className="p-1.5 rounded-xl bg-[#2a170d] border border-[#8a633b] text-amber-200 hover:text-white transition"
              title="Trilha Sonora & Músicas"
            >
              <Music size={16} />
            </button>
          )}

          {/* Alternar Foco: Mesa Completa vs Apenas Mapa */}
          <button
            type="button"
            onClick={() => setIsMapFocusOnly(!isMapFocusOnly)}
            className="px-3 py-1.5 rounded-xl bg-[#3c2214] hover:bg-[#52301c] border border-[#a17849] text-amber-100 text-xs font-serif font-bold flex items-center gap-1.5 shadow"
            title={isMapFocusOnly ? 'Voltar para Mesa Completa (Fantasy Grounds)' : 'Maximizar apenas o Mapa Tático'}
          >
            {isMapFocusOnly ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isMapFocusOnly ? 'Mesa Completa' : 'Foco no Mapa'}</span>
          </button>

          {/* Atalho Rápido para Painel de Combate */}
          <button
            type="button"
            onClick={() => setIsBottomDockOpen(!isBottomDockOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1.5 transition shadow ${
              encounter.isRunning
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                : isBottomDockOpen
                ? 'bg-amber-900/60 border-amber-500 text-amber-100'
                : 'bg-[#2a170d] border-[#8a633b] text-amber-200 hover:text-white'
            }`}
            title="Abrir / Recolher Painel de Combate e Alvo"
          >
            <Sword size={14} className={encounter.isRunning ? 'text-rose-400' : 'text-amber-400'} />
            <span>{encounter.isRunning ? `Em Combate (R${encounter.round})` : 'Combate & Alvo'}</span>
            {isBottomDockOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL DA MESA VIRTUAL */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 relative">
        
        {/* COLUNA ESQUERDA: PERGAMINHO DE AVENTURA & CHAT IA (32% da tela) */}
        {!isMapFocusOnly && (
          <div className="w-[33%] min-w-[340px] max-w-[480px] h-full flex flex-col shrink-0 animate-in slide-in-from-left duration-150">
            <TabletopParchmentChat
              chatLog={chatLog}
              currentUserName={currentUserName}
              character={character}
              isAiResponding={isAiResponding}
              encounter={encounter}
              onHpDelta={onHpDelta}
              onOpenEndSessionModal={onOpenEndSessionModal}
              onStartScenario={onStartScenario}
              onSendMessage={onSendMessage}
            />
          </div>
        )}

        {/* COLUNA CENTRAL / DIREITA: MAPA TÁTICO + INSPEÇÃO + COMBAT TRACKER */}
        <div className="flex-1 flex flex-col h-full gap-2 overflow-hidden">
          
          {/* TOPO: TABULEIRO TÁTICO (BATTLEMAP) - OCUPA O MÁXIMO DE ESPAÇO */}
          <div className="flex-1 w-full rounded-xl overflow-hidden border-2 border-[#5c3a1d] shadow-2xl relative min-h-0 bg-slate-950">
            <BattleMap
              mapConfig={mapConfig}
              tokens={tokens}
              selectedTokenId={selectedTokenId}
              zoom={zoom}
              pan={pan}
              activeTool={activeTool}
              encounter={encounter}
              onSelectToken={(id) => {
                onSelectToken(id);
                if (id) {
                  const t = tokens.find((tok) => tok.id === id);
                  if (t?.combatantId) setSelectedCombatantId(t.combatantId);
                }
              }}
              onMoveToken={onMoveToken}
              onSetZoom={onSetZoom}
              onSetPan={onSetPan}
              onSetActiveTool={onSetActiveTool}
              onUpdateMapConfig={onUpdateMapConfig}
              onSelectMapPreset={onSelectMapPreset}
              onUploadMap={onUploadMap}
              onAddFogShape={onAddFogShape}
              onResetFog={onResetFog}
              onRevealAllFog={onRevealAllFog}
              onUpdateToken={onUpdateToken}
              onRemoveToken={onRemoveToken}
              onAddToken={onAddToken}
              onApplyCharacterAvatar={onApplyCharacterAvatar}
            />
          </div>

          {/* INFERIOR: PAINÉIS DE FICHA DO ALVO & COMBAT TRACKER (estilo Fantasy Grounds - Colapsável) */}
          {!isMapFocusOnly && (
            <div
              className={`transition-all duration-300 ease-in-out shrink-0 flex flex-col bg-[#1a0e07] border border-[#5c3a1d] rounded-xl shadow-2xl overflow-hidden ${
                isBottomDockOpen ? 'h-[250px]' : 'h-8'
              }`}
            >
              {/* Barra de Título / Alternador do Dock */}
              <div
                onClick={() => setIsBottomDockOpen(!isBottomDockOpen)}
                className="h-8 px-3 flex items-center justify-between bg-[#2a170d] hover:bg-[#3d2214] cursor-pointer border-b border-[#4a2e18] transition select-none text-xs text-amber-200"
              >
                <div className="flex items-center gap-2 font-serif font-bold">
                  <Sword size={13} className="text-amber-400" />
                  <span>
                    Combate & Alvo ({encounter.combatants.length} combatentes
                    {encounter.isRunning ? ` · Rodada ${encounter.round}` : ''})
                  </span>
                  {activeTarget && (
                    <span className="text-[11px] font-sans font-normal text-amber-300/90 bg-black/40 px-2 py-0.5 rounded-full border border-amber-900/50">
                      Alvo: <strong>{activeTarget.name}</strong> ({activeTarget.currentHp}/{activeTarget.maxHp} PV)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-sans font-semibold">
                  <span>{isBottomDockOpen ? 'Recolher Painel' : 'Expandir Painel'}</span>
                  {isBottomDockOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              </div>

              {/* Conteúdo Expansível: TargetCard e CombatTracker */}
              {isBottomDockOpen && (
                <div className="flex-1 flex gap-2 p-2 overflow-hidden animate-in fade-in duration-200">
                  {/* Painel Inferior Esquerdo: Ficha de Atributos do Alvo / Monstro */}
                  <div className="flex-1 h-full overflow-hidden">
                    <TabletopTargetCard
                      target={activeTarget}
                      onClose={() => {
                        setSelectedCombatantId(null);
                        onSelectToken(null);
                      }}
                      onRollAttack={onRollMonsterAttack}
                      onRollDamage={onRollMonsterDamage}
                    />
                  </div>

                  {/* Painel Inferior Direito: Rastreador de Combate & Iniciativa */}
                  <div className="flex-1 h-full overflow-hidden">
                    <TabletopCombatTracker
                      encounter={encounter}
                      charactersList={charactersList}
                      selectedCombatantId={selectedCombatantId}
                      onSelectCombatant={(c) => setSelectedCombatantId(c.id)}
                      onStartEncounter={onStartEncounter}
                      onNextTurn={onNextTurn}
                      onPreviousTurn={onPreviousTurn}
                      onSortInitiative={onSortInitiative}
                      onResetEncounter={onResetEncounter}
                      onHpDelta={onHpDelta}
                      onToggleCondition={onToggleCondition}
                      onUpdateInitiative={onUpdateInitiative}
                      onRemoveCombatant={onRemoveCombatant}
                      onOpenBestiary={onOpenBestiary}
                      onAiMonsterAttack={onAiMonsterAttack}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARRA LATERAL DIREITA: TOMOS MÁGICOS & ATALHOS RÁPIDOS (Estilo Fantasy Grounds) */}
        <div className="flex flex-col gap-2 shrink-0 py-1 justify-start">
          <button
            type="button"
            onClick={onOpenCharacterSheet}
            className="w-10 h-10 rounded-xl bg-[#2e190f] hover:bg-[#4d2c1c] border border-[#a17849] flex items-center justify-center text-amber-200 hover:text-white shadow-xl transition active:scale-95 group relative"
            title="Abrir Ficha de Personagem Completa"
          >
            <User size={18} />
            <span className="absolute right-12 px-2 py-1 rounded bg-black/90 text-amber-200 text-[10px] font-serif whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition">
              Ficha do Herói
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCompendium}
            className="w-10 h-10 rounded-xl bg-[#2e190f] hover:bg-[#4d2c1c] border border-[#a17849] flex items-center justify-center text-amber-200 hover:text-white shadow-xl transition active:scale-95 group relative"
            title="Compêndio de Magias & Equipamentos SRD"
          >
            <BookOpen size={18} />
            <span className="absolute right-12 px-2 py-1 rounded bg-black/90 text-amber-200 text-[10px] font-serif whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition">
              Compêndio de Regras
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenBestiary}
            className="w-10 h-10 rounded-xl bg-[#2e190f] hover:bg-[#4d2c1c] border border-[#a17849] flex items-center justify-center text-amber-200 hover:text-white shadow-xl transition active:scale-95 group relative"
            title="Bestiário de Monstros & Criaturas"
          >
            <Sword size={18} />
            <span className="absolute right-12 px-2 py-1 rounded bg-black/90 text-amber-200 text-[10px] font-serif whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition">
              Bestiário de Monstros
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenAiDmModal}
            className="w-10 h-10 rounded-xl bg-[#381c0d] hover:bg-[#572b15] border border-amber-500/60 flex items-center justify-center text-amber-300 hover:text-white shadow-xl transition active:scale-95 group relative"
            title="Oráculo & Gerador do Mestre IA"
          >
            <Sparkles size={18} className="text-amber-400" />
            <span className="absolute right-12 px-2 py-1 rounded bg-black/90 text-amber-200 text-[10px] font-serif whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition">
              Oráculo Mestre IA
            </span>
          </button>
        </div>
      </div>

      {/* 3. BANDEJA DE DADOS POLIÉDRICOS 3D & BARRA DE MACROS INFERIOR (HOTBAR) */}
      <div className="h-12 px-4 bg-[#120804] border-t border-[#3b2413] flex items-center justify-between gap-4 shrink-0 select-none z-10">
        
        {/* Doca de Dados Poliédricos 3D (d4, d6, d8, d10, d12, d20, d100) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-serif uppercase tracking-widest text-amber-900 font-black hidden md:inline">
            Dados:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { sides: 4, label: 'd4', bg: 'from-red-950 to-amber-950 border-red-700/60' },
              { sides: 6, label: 'd6', bg: 'from-amber-950 to-orange-950 border-amber-700/60' },
              { sides: 8, label: 'd8', bg: 'from-yellow-950 to-amber-950 border-yellow-700/60' },
              { sides: 10, label: 'd10', bg: 'from-emerald-950 to-teal-950 border-emerald-700/60' },
              { sides: 12, label: 'd12', bg: 'from-cyan-950 to-blue-950 border-cyan-700/60' },
              { sides: 20, label: 'd20', bg: 'from-amber-700 to-amber-900 border-amber-400 text-amber-100 font-black scale-105 shadow-md' },
              { sides: 100, label: 'd100', bg: 'from-purple-950 to-indigo-950 border-purple-700/60' },
            ].map((die) => (
              <button
                key={die.sides}
                type="button"
                onClick={() => onRollDie(die.sides)}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${die.bg} border flex items-center justify-center text-[11px] font-mono font-bold text-amber-200 shadow-sm hover:scale-110 active:scale-95 transition`}
                title={`Rolar ${die.label}`}
              >
                {die.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hotbar / Macros Rápidos (Slots 1 a 12 como no Fantasy Grounds) */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {[
            { slot: 1, label: 'Ataque' },
            { slot: 2, label: 'Esquiva' },
            { slot: 3, label: 'Disparada' },
            { slot: 4, label: 'Desengajar' },
            { slot: 5, label: 'Esconder' },
            { slot: 6, label: 'Ajudar' },
            { slot: 7, label: 'Iniciativa' },
            { slot: 8, label: 'Percepção' },
            { slot: 9, label: 'Atletismo' },
            { slot: 10, label: 'Acrobacia' },
            { slot: 11, label: 'Segundo Vento' },
            { slot: 12, label: '@mestre' },
          ].map((macro) => (
            <button
              key={macro.slot}
              type="button"
              onClick={() => handleMacroClick(macro.slot)}
              className="px-2 py-1 rounded bg-[#201108] hover:bg-[#381f10] border border-[#5a3b22] text-[#d6be9a] hover:text-white text-[10px] font-serif flex items-center gap-1 transition active:scale-95 shadow-xs"
              title={`Atalho ${macro.slot}: ${macro.label}`}
            >
              <span className="font-mono text-[9px] text-amber-700 font-bold">{macro.slot}.</span>
              <span className="truncate max-w-[65px]">{macro.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
