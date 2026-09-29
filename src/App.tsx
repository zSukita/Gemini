import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Scroll, Sparkles } from 'lucide-react';
import { useCharacter } from './hooks/useCharacter';
import { useEncounter } from './hooks/useEncounter';
import { useBattleMap } from './hooks/useBattleMap';
import { useMultiplayer } from './hooks/useMultiplayer';

import type { AdvantageMode, DiceRollResult, Spell, ThemeId, CampaignNpc } from './types/dnd5e';
import type { FogShape, MapToken, BattleMapConfig, PeerUser } from './types/vtt';
import { isValidDiceFormula, rollD20, rollDie, rollFormula } from './utils/diceRoller';
import { applyCharacterDamage, applyCharacterHealing, isCharacterDead } from './utils/deathSaves';
import { classifyCastingTime, makeTurnActionUseKey } from './utils/actionEconomy';
import { broadcastSyncMessage } from './utils/syncChannel';

import { Navbar, type AppMode } from './components/Navbar';
import { DiceRollerBar } from './components/DiceRollerBar';
import { BeginnerGuideModal } from './components/BeginnerGuideModal';
import { AiActionReviewModal } from './components/ai/AiActionReviewModal';
import { PlayerSheetPage } from './pages/PlayerSheetPage';

const DmScreenPage = lazy(() => import('./pages/DmScreenPage').then((m) => ({ default: m.DmScreenPage })));
const VttSessionPage = lazy(() => import('./pages/VttSessionPage').then((m) => ({ default: m.VttSessionPage })));
import { AppModals } from './components/modals/AppModals';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { useModalManager } from './hooks/useModalManager';
import { useNotification } from './hooks/useNotification';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useSocialPresence } from './hooks/useSocialPresence';
import {
  type GameInvite,
  type DirectMessage,
  subscribeToDirectMessages,
  sendDirectMessage,
  markDirectMessagesAsRead,
} from './firebase/presenceAndFriends';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { 
  getStoredApiKey, 
  getStoredGroqApiKey, 
  getStoredAiProvider, 
  sendToAiDungeonMaster, 
  clearStoredChatHistory, 
  saveStoredChatHistory 
} from './services/geminiService';
import type { AiMessage, MonsterAttackAction, AiLootReward } from './types/aiDm';
import type { Combatant, Monster, ConditionKey } from './types/combat';
import type { ChatMessage, ChatMessageType } from './types/chat';
import {
  type CampaignHandout,
  type CampaignPartyMember,
  broadcastHandoutToCampaign,
  subscribeToCampaign,
} from './firebase/campaignSync';
import { DEFAULT_MAP_PRESETS, type DefaultMapPreset } from './data/defaultMaps';
import { SRD_MONSTERS } from './data/srdMonsters';
import { SRD_CLASSES } from './data/srdClasses';
import { type AiAdventureScenario } from './data/aiAdventureScenarios';
import { getXpForCr } from './utils/encounterDifficulty';

function PageFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-16 space-y-4" role="status" aria-label="Carregando">
      <Scroll className="w-10 h-10 animate-bounce text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" />
      <p className="text-sm font-cinzel text-amber-200/80 animate-pulse tracking-wider">Carregando Grimório...</p>
    </div>
  );
}

export function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    isAuthenticated,
    isFirebaseReady,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    clearError,
  } = useAuth();

  const hasAutoOpenedWizardRef = useRef(false);

  const {
    character,
    charactersList,
    isCloudLoaded,
    activeId,
    setActiveId,
    updateCharacter,
    updateAbility,
    cycleSkillProficiency,
    applyDamage,
    applyHealing,
    setTempHp,
    toggleDeathSaveSuccess,
    toggleDeathSaveFailure,
    spendHitDie,
    performLongRest,
    completeShortRest,
    addResource,
    updateResource,
    deleteResource,
    consumeResourceCharge,
    addAttack,
    deleteAttack,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    toggleSpellSlotUsed,
    updateSpellSlotMax,
    addSpell,
    updateSpell,
    deleteSpell,
    addFeature,
    deleteFeature,
    createNewCharacter,
    addCreatedCharacter,
    deleteActiveCharacter,
    importCharacter,
    exportActiveCharacter,
  } = useCharacter(user?.uid);

  const {
    encounter,
    setEncounter,
    addMonsterCombatant,
    importPlayerCharacters,
    addCustomCombatant,
    removeCombatant,
    rollAllMonstersInitiative,
    sortCombatantsByInitiative,
    nextTurn,
    previousTurn,
    startEncounter,
    resetEncounter,
    applyCombatantHpDelta,
    toggleCombatantCondition,
    updateCombatantInitiative,
    undoLastHpChange,
    recordCombatAction,
  } = useEncounter();

  // Estados de interface
  const [currentMode, setCurrentMode] = useState<AppMode>('player');
  const [beginnerMode, setBeginnerMode] = useState<boolean>(() => {
    try { return localStorage.getItem('arcanasheet_beginner_mode') === 'true'; } catch { return false; }
  });
  const [isBeginnerGuideOpen, setIsBeginnerGuideOpen] = useState(false);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [turnSpellUse, setTurnSpellUse] = useState<Record<string, true>>({});
  useEffect(() => {
    if (encounter.isRunning) setTurnSpellUse({});
  }, [encounter.id, encounter.isRunning]);
  const [diceRolls, setDiceRolls] = useState<DiceRollResult[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const [activeRollAnimation, setActiveRollAnimation] = useState<DiceRollResult | null>(null);
  const [isDiceAnimationEnabled, setIsDiceAnimationEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arcanasheet_dice_animation_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const {
    isHistoryOpen,
    setIsHistoryOpen,
    isShortRestOpen,
    setIsShortRestOpen,
    isManagerOpen,
    setIsManagerOpen,
    isWizardOpen,
    setIsWizardOpen,
    isMultiplayerOpen,
    setIsMultiplayerOpen,
    isEndSessionOpen,
    setIsEndSessionOpen,
    isCampaignModalOpen,
    setIsCampaignModalOpen,
    isHandoutModalOpen,
    setIsHandoutModalOpen,
    activeHandout,
    setActiveHandout,
    isHandoutViewerOpen,
    setIsHandoutViewerOpen,
    isPrintOpen,
    setIsPrintOpen,
    isChatOpen,
    setIsChatOpen,
    isLevelUpOpen,
    setIsLevelUpOpen,
    isMusicPlayerOpen,
    setIsMusicPlayerOpen,
    isAiDmOpen,
    setIsAiDmOpen,
    isBestiaryOpen,
    setIsBestiaryOpen,
    isSpellCompendiumOpen,
    setIsSpellCompendiumOpen,
    isOnlineListPinned,
    setIsOnlineListPinned,
    closeAllModals,
  } = useModalManager();

  const { notification, showNotification } = useNotification();
  useEffect(() => {
    try { localStorage.setItem('arcanasheet_beginner_mode', String(beginnerMode)); } catch { /* armazenamento opcional */ }
  }, [beginnerMode]);
  const [isSecretRoll, setIsSecretRoll] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('arcanasheet_active_campaign_id') || null;
    } catch {
      return null;
    }
  });
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem('arcanasheet_theme') as ThemeId) || 'default';
    } catch {
      return 'default';
    }
  });

  // Atalho global ESC para fechar modais e M para alternar tocador de música
  useGlobalShortcuts({
    onEscape: closeAllModals,
    onToggleMusic: () => setIsMusicPlayerOpen((prev) => !prev),
    onToggleDiceHistory: () => setIsHistoryOpen((prev) => !prev),
  });

  const handleSetActiveCampaignId = (id: string | null) => {
    setActiveCampaignId(id);
    try {
      if (id) {
        localStorage.setItem('arcanasheet_active_campaign_id', id);
      } else {
        localStorage.removeItem('arcanasheet_active_campaign_id');
      }
    } catch {
      // ignore
    }
  };

  // Escuta a campanha ativa na nuvem para exibir novos Handouts aos jogadores automaticamente
  useEffect(() => {
    if (!activeCampaignId) return;

    const unsubscribe = subscribeToCampaign(activeCampaignId, (camp) => {
      if (camp?.activeHandout) {
        setActiveHandout(camp.activeHandout);
        setIsHandoutViewerOpen(true);
      }
    });

    return () => unsubscribe();
  }, [activeCampaignId, setActiveHandout, setIsHandoutViewerOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('arcanasheet_theme', currentTheme);
      document.body.className = currentTheme === 'default' ? '' : `theme-${currentTheme}`;
      document.documentElement.className = currentTheme === 'default' ? '' : `theme-${currentTheme}`;
    } catch {
      // ignore
    }
  }, [currentTheme]);

  // Abre automaticamente o Assistente de Criação de Personagem se o jogador logou, nuvem carregou e não possui nenhum herói com nome
  useEffect(() => {
    if (!isAuthenticated || !isCloudLoaded) return;

    // Se o usuário já tiver heróis nomeados, nunca abrir automaticamente
    const hasAnyNamedHero = charactersList.some((c) => c.name && c.name.trim().length > 0);
    if (hasAnyNamedHero) return;

    // Verifica se já foi dispensado ou aberto anteriormente
    const storageKey = user?.uid ? `arcanasheet_wizard_dismissed_${user.uid}` : 'arcanasheet_wizard_dismissed_guest';
    const alreadyDismissed = localStorage.getItem(storageKey);

    if (!alreadyDismissed && !hasAutoOpenedWizardRef.current) {
      hasAutoOpenedWizardRef.current = true;
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // ignore
      }
      setIsWizardOpen(true);
    }
  }, [isAuthenticated, isCloudLoaded, charactersList, user?.uid, setIsWizardOpen]);

  const handleTogglePinOnlineList = useCallback(() => {
    setIsOnlineListPinned(!isOnlineListPinned);
    showNotification(`Lista de pessoas online: ${!isOnlineListPinned ? 'Fixada na tela' : 'Desafixada'}`);
  }, [isOnlineListPinned, setIsOnlineListPinned, showNotification]);

  const [isSocialSidebarOpen, setIsSocialSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('arcanasheet_social_sidebar_open');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
    } catch {
      return false;
    }
  });

  const handleToggleSocialSidebar = useCallback(() => {
    setIsSocialSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arcanasheet_social_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Sistema de Mensagens Diretas em Tempo Real (Sussurros entre usuários online e amigos)
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  useEffect(() => {
    const myId = user?.uid || 'local_user';
    const unsub = subscribeToDirectMessages(myId, (msgs) => {
      setDirectMessages((prev) => {
        const prevIds = new Set(prev.map((m) => m.id));
        const newIncoming = msgs.filter((m) => m.toUserId === myId && !m.read && !prevIds.has(m.id));
        if (newIncoming.length > 0) {
          const latest = newIncoming[newIncoming.length - 1];
          showNotification(
            `💬 Mensagem de ${latest.fromUserName}: "${latest.content.substring(0, 35)}${
              latest.content.length > 35 ? '...' : ''
            }"`
          );
        }
        return msgs;
      });
    });
    return unsub;
  }, [user?.uid, showNotification]);

  const handleSendDirectMessage = useCallback(
    async (toUserId: string, toUserName: string, content: string) => {
      const myId = user?.uid || 'local_user';
      const myName = character.name || user?.displayName || 'Você';
      const sentMsg = await sendDirectMessage({
        fromUserId: myId,
        fromUserName: myName,
        fromAvatarUrl: character.avatarUrl,
        toUserId,
        toUserName,
        content,
      });
      if (sentMsg) {
        setDirectMessages((prev) => (prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]));
      }
    },
    [user?.uid, user?.displayName, character.name, character.avatarUrl]
  );

  const handleMarkDirectMessagesAsRead = useCallback(
    async (partnerUserId: string) => {
      const myId = user?.uid || 'local_user';
      await markDirectMessagesAsRead(myId, partnerUserId);
    },
    [user?.uid]
  );

  const toggleDiceAnimation = useCallback(() => {
    setIsDiceAnimationEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arcanasheet_dice_animation_enabled', String(next));
      } catch {
        // ignore
      }
      showNotification(`Animação 3D de dados: ${next ? 'Ligada' : 'Desligada'}`);
      return next;
    });
  }, [showNotification]);

  const addRollResult = useCallback(
    (res: DiceRollResult) => {
      setDiceRolls((prev) => [res, ...prev.slice(0, 99)]);
      setLastRoll(res);
      if (isDiceAnimationEnabled) {
        setActiveRollAnimation(res);
      }
    },
    [isDiceAnimationEnabled]
  );

  const handleCloseDiceAnimation = useCallback(() => {
    setActiveRollAnimation(null);
  }, []);

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState<AiMessage | null>(null);
  const triggerAiDmRef = useRef<((promptText: string) => Promise<void>) | undefined>(undefined);
  const executeAiMonsterAttackRef = useRef<((attack: MonsterAttackAction) => Promise<void>) | undefined>(undefined);
  const handleTriggerAiMonsterTurnRef = useRef<((combatant?: Combatant) => void) | undefined>(undefined);

  const setTokensRef = useRef<React.Dispatch<React.SetStateAction<MapToken[]>> | null>(null);
  const setMapConfigRef = useRef<React.Dispatch<React.SetStateAction<BattleMapConfig>> | null>(null);
  const mapConfigRef = useRef<BattleMapConfig | null>(null);
  const tokensRef = useRef<MapToken[]>([]);
  const chatLogRef = useRef<ChatMessage[]>([]);
  const encounterRef = useRef(encounter);
  encounterRef.current = encounter;

  // Hook Multiplayer P2P WebRTC
  const {
    isConnected,
    isConnecting,
    isHost,
    roomCode,
    connectedPeers,
    chatLog,
    setChatLog,
    createRoom,
    joinRoom,
    disconnect,
    clearChatLog,
    broadcastDiceRoll,
    broadcastTokenMove,
    broadcastFogUpdate,
    broadcastMapConfig,
    broadcastRoomSync,
    sendChatMessage,
  } = useMultiplayer({
    onRemoteDiceRoll: (roll) => {
      addRollResult(roll);
      showNotification(`Rolagem remota: ${roll.label} = ${roll.total}`);
    },
    onRemoteTokenMove: (remoteTokens) => {
      setTokensRef.current?.(remoteTokens);
    },
    onRemoteFogUpdate: (shapes) => {
      setMapConfigRef.current?.((prev) => ({ ...prev, revealedShapes: shapes }));
    },
    onRemoteMapConfig: (newConfig) => {
      setMapConfigRef.current?.((prev) => ({ ...prev, ...newConfig }));
    },
    onRemoteRoomSync: (syncData) => {
      if (syncData.mapConfig) {
        setMapConfigRef.current?.(syncData.mapConfig);
      }
      if (syncData.tokens && Array.isArray(syncData.tokens)) {
        setTokensRef.current?.(syncData.tokens);
      }
      if (syncData.encounter) {
        setEncounter(syncData.encounter);
      }
      showNotification('🗺️ Mesa e mapa sincronizados com o Mestre!');
    },
    onRequestRoomState: (requesterPeerId, requesterData) => {
      if (isHost) {
        if (requesterData?.userName) {
          const peerName = requesterData.userName;
          setEncounter((prev) => {
            const exists = prev.combatants.some(
              (c) => (requesterPeerId && c.playerId === requesterPeerId) || c.name.toLowerCase() === peerName.toLowerCase()
            );
            if (exists) return prev;
            const dexMod = requesterData.dexScore ? Math.floor((requesterData.dexScore - 10) / 2) : 0;
            const init = (requesterData.initiativeBonus || 0) + dexMod + (prev.isRunning ? rollDie(20) : 0);
            const newCombatant: Combatant = {
              id: `combatant-peer-${requesterPeerId || Date.now()}`,
              name: peerName,
              type: 'player',
              avatarUrl: requesterData.avatarUrl,
              initiative: init,
              armorClass: requesterData.armorClass || 10,
              maxHp: requesterData.maxHp || 10,
              currentHp: requesterData.currentHp ?? requesterData.maxHp ?? 10,
              tempHp: 0,
              conditions: [],
              playerId: requesterPeerId,
            };
            return {
              ...prev,
              combatants: [...prev.combatants, newCombatant],
            };
          });
        }
        setTimeout(() => {
          if (mapConfigRef.current) {
            broadcastRoomSync(
              {
                mapConfig: mapConfigRef.current,
                tokens: tokensRef.current,
                chatLog: chatLogRef.current,
                encounter: encounterRef.current,
              },
              requesterPeerId
            );
          }
        }, 120);
      }
    },
    onRemoteCharacterSync: (peer: PeerUser) => {
      if (!peer || !peer.name) return;
      if (isHost) {
        setEncounter((prev) => {
          const peerId = peer.peerId;
          const existingIdx = prev.combatants.findIndex(
            (c) => (peerId && c.playerId === peerId) || c.name.toLowerCase() === peer.name.toLowerCase()
          );
          if (existingIdx >= 0) {
            const updated = [...prev.combatants];
            updated[existingIdx] = {
              ...updated[existingIdx],
              name: peer.name,
              avatarUrl: peer.avatarUrl || updated[existingIdx].avatarUrl,
              currentHp: peer.currentHp ?? updated[existingIdx].currentHp,
              maxHp: peer.maxHp ?? updated[existingIdx].maxHp,
              armorClass: peer.armorClass ?? updated[existingIdx].armorClass,
            };
            return { ...prev, combatants: updated };
          }
          const dexMod = peer.dexScore ? Math.floor((peer.dexScore - 10) / 2) : 0;
          const init = (peer.initiativeBonus || 0) + dexMod + (prev.isRunning ? rollDie(20) : 0);
          const newCombatant: Combatant = {
            id: `combatant-peer-${peerId || Date.now()}`,
            name: peer.name,
            type: 'player',
            avatarUrl: peer.avatarUrl,
            initiative: init,
            armorClass: peer.armorClass || 10,
            maxHp: peer.maxHp || 10,
            currentHp: peer.currentHp ?? peer.maxHp ?? 10,
            tempHp: 0,
            conditions: [],
            playerId: peerId,
          };
          return {
            ...prev,
            combatants: [...prev.combatants, newCombatant],
          };
        });
      }
    },
    onRemoteDirectMessage: (dm) => {
      setDirectMessages((prev) => (prev.some((m) => m.id === dm.id) ? prev : [...prev, dm]));
      showNotification(
        `💬 Mensagem de ${dm.fromUserName}: "${dm.content.substring(0, 35)}${
          dm.content.length > 35 ? '...' : ''
        }"`
      );
    },
    onRemoteChatMessage: (remoteMsg, rawPayload) => {
      // Se for o Host da sala e o jogador remoto finalizou seu turno
      if (isHost && remoteMsg.text.includes('[Turno] Finalizei meu turno')) {
        nextTurn();
      }

      // Se for o Host da sala e o remetente não tiver processado a IA localmente
      if (isHost && remoteMsg.type === 'PUBLIC' && rawPayload?.aiHandledBySender !== true) {
        const trimmed = remoteMsg.text.trim();
        const isAiCommand =
          trimmed.startsWith('@mestre') ||
          trimmed.startsWith('/mestre') ||
          trimmed.startsWith('/ia') ||
          trimmed.startsWith('@ia') ||
          trimmed.startsWith('@dm');
        if (isAiCommand) {
          const cleanPrompt =
            trimmed.replace(/^(@mestre|\/mestre|\/ia|@ia|@dm)\s*/i, '').trim() ||
            'Os aventureiros olham ao redor aguardando suas palavras. O que acontece agora? Descreva o ambiente e sugira opções de ação.';
          triggerAiDmRef.current?.(cleanPrompt);
        }
      }
    },
  });

  // Hook do Tabuleiro Tático / VTT sincronizado com o jogador local e todos os pares conectados
  const {
    mapConfig,
    setMapConfig,
    updateMapConfig,
    tokens,
    setTokens,
    selectedTokenId,
    setSelectedTokenId,
    zoom,
    setZoom,
    pan,
    setPan,
    activeTool,
    setActiveTool,
    moveToken,
    addToken,
    removeToken,
    updateToken,
    selectMapPreset,
    uploadCustomMap,
    addFogShape,
    resetFog,
    revealAllFog,
  } = useBattleMap(encounter, character, connectedPeers);

  setTokensRef.current = setTokens;
  setMapConfigRef.current = setMapConfig;
  mapConfigRef.current = mapConfig;
  tokensRef.current = tokens;
  chatLogRef.current = chatLog;

  // Modificar PV de Combatente e Sincronizar Imediatamente os Tokens no Mapa e Rede P2P
  const handleHpDelta = useCallback(
    (id: string, delta: number, critical = false) => {
      applyCombatantHpDelta(id, delta, character.name || user?.displayName || 'Mestre', { critical });

      const combatant = encounterRef.current?.combatants.find((c) => c.id === id);
      if (combatant) {
        if (combatant.type === 'player' && combatant.playerId === character.id) {
          updateCharacter((prev) => delta < 0
            ? applyCharacterDamage(prev, Math.abs(delta), critical)
            : delta > 0 ? applyCharacterHealing(prev, delta) : prev);
        }
        let newHp = combatant.currentHp;
        let newTempHp = combatant.tempHp;
        if (delta < 0) {
          const damage = Math.abs(delta);
          const absorbed = Math.min(newTempHp, damage);
          newTempHp -= absorbed;
          newHp = Math.max(0, newHp - (damage - absorbed));
        } else {
          newHp = Math.min(combatant.maxHp, newHp + delta);
        }

        setTokens((prev) => {
          const updated = prev.map((t) => {
            const isMatch =
              t.combatantId === id ||
              t.id === id ||
              t.name.toLowerCase() === combatant.name.toLowerCase();

            if (isMatch) {
              return {
                ...t,
                combatantId: id,
                currentHp: newHp,
                tempHp: newTempHp,
                maxHp: combatant.maxHp,
              };
            }
            return t;
          });

          if (isConnected) {
            broadcastTokenMove(updated, character.name);
          }
          return updated;
        });
      }
    },
    [applyCombatantHpDelta, isConnected, broadcastTokenMove, character.id, character.name, user?.displayName, setTokens, updateCharacter]
  );

  const handleUndoLastHpChange = useCallback(() => {
    const previous = encounterRef.current?.lastHpChange;
    if (!previous) return;
    setTokens((items) => {
      const updated = items.map((token) => token.combatantId === previous.combatantId || token.id === previous.combatantId
        ? { ...token, currentHp: previous.currentHp, tempHp: previous.tempHp }
        : token);
      if (isConnected) broadcastTokenMove(updated, character.name);
      return updated;
    });
    undoLastHpChange(character.name || user?.displayName || 'Mestre');
  }, [setTokens, undoLastHpChange, isConnected, broadcastTokenMove, character.name, user?.displayName]);

  // Sincroniza o combate D&D 5e do Host com todos os pares conectados quando o encontro mudar
  useEffect(() => {
    if (isHost && isConnected && mapConfigRef.current) {
      broadcastRoomSync({
        mapConfig: mapConfigRef.current,
        tokens: tokensRef.current,
        chatLog: chatLogRef.current,
        encounter,
      });
    }
  }, [isHost, isConnected, encounter, broadcastRoomSync]);

  // Alternar Condição de Combatente e Sincronizar Imediatamente os Tokens no Mapa e Rede P2P
  const handleToggleCombatantCondition = useCallback(
    (id: string, condition: ConditionKey) => {
      toggleCombatantCondition(id, condition);

      const combatant = encounterRef.current?.combatants.find((c) => c.id === id);

      setTokens((prev) => {
        const updated = prev.map((t) => {
          const isMatch =
            t.combatantId === id ||
            t.id === id ||
            (combatant && t.name.toLowerCase() === combatant.name.toLowerCase());

          if (isMatch) {
            const exists = t.conditions.includes(condition);
            const nextConditions = exists
              ? t.conditions.filter((cond) => cond !== condition)
              : [...t.conditions, condition];
            return {
              ...t,
              combatantId: id,
              conditions: nextConditions,
            };
          }
          return t;
        });

        if (isConnected) {
          broadcastTokenMove(updated, character.name);
        }
        return updated;
      });
    },
    [toggleCombatantCondition, isConnected, broadcastTokenMove, character.name, setTokens]
  );

  const triggerAiDm = useCallback(
    async (promptText: string) => {
      const provider = getStoredAiProvider();
      const groqKey = getStoredGroqApiKey();
      const geminiKey = getStoredApiKey();
      const isReady =
        provider === 'pollinations' ||
        (provider === 'groq' && Boolean(groqKey)) ||
        (provider === 'gemini' && Boolean(geminiKey)) ||
        Boolean(groqKey) ||
        Boolean(geminiKey);

      if (!isReady) {
        sendChatMessage({
          text: '⚠️ O Mestre IA precisa de configuração! Por favor, abra o menu do Mestre IA para selecionar o Modo Livre (sem chave) ou informar sua chave Groq/Gemini.',
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
        });
        return;
      }

      setIsAiResponding(true);
      try {
        const recentTurns: AiMessage[] = chatLog.slice(-8).map((msg) => ({
          id: msg.id,
          role: msg.type === 'AI_DM' ? 'narrator' : 'player',
          content: `${msg.senderName}: ${msg.text}`,
          timestamp: msg.timestamp,
        }));

        const currentEnc = encounterRef.current || encounter;
        const activeCombatant = currentEnc.combatants[currentEnc.activeCombatantIndex];
        const isPlayerTurn = activeCombatant?.type === 'player';
        const encounterContext = currentEnc.isRunning
          ? {
              isRunning: true,
              round: currentEnc.round,
              activeCombatantName: activeCombatant?.name,
              isPlayerTurn,
              combatants: currentEnc.combatants.map((c) => ({
                name: c.name,
                type: c.type,
                currentHp: c.currentHp,
                maxHp: c.maxHp,
                armorClass: c.armorClass,
                initiative: c.initiative,
              })),
            }
          : undefined;

        const aiReply = await sendToAiDungeonMaster(
          promptText,
          recentTurns,
          character,
          {
            customInstructions:
              'Você é o Mestre Supremo em uma mesa multiplayer online ao vivo de D&D 5e. Narre em português do Brasil com grande riqueza sensorial e desafie o grupo.',
            encounterContext,
          }
        );

        // Filtragem inteligente de spawns duplicados:
        // Se o combate já está em andamento e monstros desse tipo já existem, descarta spawn repetitivo
        if (aiReply.monsterSpawns && aiReply.monsterSpawns.length > 0) {
          const currentMonsters = currentEnc.combatants.filter((c) => c.type === 'monster' || c.type === 'npc');
          const filteredSpawns = aiReply.monsterSpawns.filter((spawn) => {
            const rawWanted = spawn.monsterName.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s*\d+$/, '').trim();
            const alreadyInCombat = currentMonsters.some((c) => {
              const cName = c.name.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s*\d+$/, '').trim();
              return cName === rawWanted || cName.includes(rawWanted) || rawWanted.includes(cName);
            });
            if (currentEnc.isRunning && alreadyInCombat) {
              console.info(`[AI DM] Spawn ignorado: "${spawn.monsterName}" já está presente no combate.`);
              return false;
            }
            return true;
          });
          aiReply.monsterSpawns = filteredSpawns.length > 0 ? filteredSpawns : undefined;
        }

        const hasMechanicalProposal = Boolean(
          aiReply.monsterSpawns?.length || aiReply.mapMoves?.length || aiReply.monsterAttack
        );
        if (hasMechanicalProposal) {
          setPendingAiAction(aiReply);
        }

        sendChatMessage({
          id: aiReply.id,
          text: `${aiReply.content}${hasMechanicalProposal ? '\n\n⚖️ Ações mecânicas aguardam revisão do Mestre.' : ''}`,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          suggestedActions: aiReply.suggestedActions,
          requestedRoll: aiReply.requestedRoll,
          lootReward: aiReply.lootReward,
        });
      } catch (err: unknown) {
        const errText = err instanceof Error ? err.message : String(err);
        sendChatMessage({
          text: `🔮 O Mestre hesitou em meio ao véu arcano: ${errText}`,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
        });
      } finally {
        setIsAiResponding(false);
      }
    },
    [chatLog, character, sendChatMessage, addMonsterCombatant, moveToken, isConnected, broadcastTokenMove, handleHpDelta]
  );

  triggerAiDmRef.current = triggerAiDm;

  // Coletar Tesouro do Mestre IA diretamente para a Ficha e Mochila do Personagem
  const handleCollectLoot = useCallback(
    (loot: AiLootReward) => {
      const currentCoins = character.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
      const newCoins = {
        cp: (currentCoins.cp || 0) + (loot.coins?.cp || 0),
        sp: (currentCoins.sp || 0) + (loot.coins?.sp || 0),
        ep: (currentCoins.ep || 0) + (loot.coins?.ep || 0),
        gp: (currentCoins.gp || 0) + (loot.coins?.gp || 0),
        pp: (currentCoins.pp || 0) + (loot.coins?.pp || 0),
      };

      const currentInventory = [...(character.inventory || [])];
      if (loot.items && loot.items.length > 0) {
        loot.items.forEach((item) => {
          const existingIndex = currentInventory.findIndex(
            (inv) => inv.name.toLowerCase().trim() === item.name.toLowerCase().trim()
          );
          if (existingIndex >= 0) {
            currentInventory[existingIndex] = {
              ...currentInventory[existingIndex],
              quantity: (currentInventory[existingIndex].quantity || 1) + item.quantity,
            };
          } else {
            currentInventory.push({
              id: `loot-item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: item.name,
              quantity: item.quantity,
              weight: 0.5,
              notes: 'Tesouro obtido em aventura',
              equipped: false,
            });
          }
        });
      }

      updateCharacter({
        currency: newCoins,
        inventory: currentInventory,
      });

      const parts: string[] = [];
      if (loot.coins) {
        const coinParts: string[] = [];
        if (loot.coins.gp) coinParts.push(`${loot.coins.gp} PO`);
        if (loot.coins.sp) coinParts.push(`${loot.coins.sp} PP`);
        if (loot.coins.cp) coinParts.push(`${loot.coins.cp} PC`);
        if (loot.coins.ep) coinParts.push(`${loot.coins.ep} PE`);
        if (loot.coins.pp) coinParts.push(`${loot.coins.pp} PL`);
        if (coinParts.length > 0) parts.push(coinParts.join(', '));
      }
      if (loot.items && loot.items.length > 0) {
        parts.push(loot.items.map((i) => `${i.quantity}x ${i.name}`).join(', '));
      }

      const summary = parts.join(' | ') || 'Tesouro';
      showNotification(`💰 Tesouro adicionado à sua ficha: ${summary}!`);

      sendChatMessage({
        text: `💰 **${character.name || 'O herói'}** coletou o tesouro para sua mochila: ${summary}`,
        senderName: character.name || 'Aventureiro',
        type: 'PUBLIC',
      });
    },
    [character, updateCharacter, showNotification, sendChatMessage]
  );

  const handleUserChatMessage = useCallback(
    (
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
    ) => {
      const isObj = typeof textOrPayload === 'object' && textOrPayload !== null;
      const text = isObj ? textOrPayload.text : textOrPayload;
      const senderName = isObj && textOrPayload.senderName ? textOrPayload.senderName : (senderFallback || character.name || 'Aventureiro');
      const trimmed = text.trim();
      if (!trimmed) return;

      const trimmedLower = trimmed.toLowerCase();
      const isMonsterAttackCmd =
        trimmedLower === '/ia atacar' ||
        trimmedLower === '@mestre atacar' ||
        trimmedLower === '/mestre atacar' ||
        trimmedLower === '/monstro atacar' ||
        trimmedLower.startsWith('/ia atacar') ||
        trimmedLower.startsWith('@mestre atacar');

      if (isMonsterAttackCmd) {
        handleTriggerAiMonsterTurnRef.current?.();
        return;
      }

      const isAiCommand =
        trimmedLower.includes('@mestre') ||
        trimmedLower.includes('/mestre') ||
        trimmedLower.includes('/ia') ||
        trimmedLower.includes('@ia') ||
        trimmedLower.includes('@dm');

      const provider = getStoredAiProvider();
      const groqKey = getStoredGroqApiKey();
      const geminiKey = getStoredApiKey();
      const isAiReady =
        provider === 'pollinations' ||
        (provider === 'groq' && Boolean(groqKey)) ||
        (provider === 'gemini' && Boolean(geminiKey)) ||
        Boolean(groqKey) ||
        Boolean(geminiKey);

      const willHandleAi = isAiCommand && isAiReady && (!isConnected || isHost);

      if (isObj) {
        if (textOrPayload.diceRoll) {
          addRollResult(textOrPayload.diceRoll);
          if (isConnected) {
            broadcastDiceRoll(textOrPayload.diceRoll, senderName);
          }
        }

        sendChatMessage(
          {
            ...textOrPayload,
            aiHandledBySender: textOrPayload.aiHandledBySender ?? willHandleAi,
          },
          senderName
        );
      } else {
        sendChatMessage(
          {
            text: trimmed,
            senderName,
            type: 'PUBLIC',
            aiHandledBySender: willHandleAi,
          },
          senderName
        );
      }

      if (isAiCommand) {
        if (isConnected && !isHost) {
          // Em sala multiplayer P2P, apenas o Mestre (Host) processa a IA e narra para todos
          return;
        }

        let cleanPrompt = trimmed
          .replace(/^(@mestre|\/mestre|\/ia|@ia|@dm)\s*[:,-]?\s*/i, '')
          .trim();
        cleanPrompt = cleanPrompt.replace(/(@mestre|\/mestre|\/ia|@ia|@dm)/gi, '').trim();
        if (!cleanPrompt) {
          cleanPrompt =
            'Os aventureiros olham ao redor aguardando suas palavras. O que acontece agora? Descreva o ambiente e sugira opções de ação.';
        }
        triggerAiDm(cleanPrompt);
      }
    },
    [sendChatMessage, character.name, triggerAiDm, addRollResult, isConnected, isHost, broadcastDiceRoll]
  );

  // Criar Mesa Cooperativa com Mestre IA (Mapa Tático + Monstros + História)
  const handleCreateAiRoom = useCallback(
    async (scenario: AiAdventureScenario, customTitle?: string, customPrompt?: string) => {
      // 1. Cria a sala P2P com o nome do herói/usuário e seu avatar
      const hostName = character.name || 'Herói';
      const classAvatar = SRD_CLASSES.find(
        (c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()
      )?.avatarUrl;
      const effectiveAvatar = character.avatarUrl || classAvatar;
      const code = await createRoom(hostName, undefined, effectiveAvatar);

      // 2. Carrega o mapa predefinido correspondente ao cenário
      const targetPreset =
        DEFAULT_MAP_PRESETS.find((p) => p.id === scenario.mapPresetId) ||
        DEFAULT_MAP_PRESETS[0];
      if (targetPreset) {
        selectMapPreset(targetPreset);
      }

      // 3. Atualiza iluminação ambiente e névoa
      updateMapConfig({
        ambientLight: scenario.ambientLight,
        fogOfWarEnabled: false,
      });

      // 4. Limpa e reinicia o combate, inserindo o personagem do jogador
      resetEncounter();
      importPlayerCharacters([character]);

      // 5. Adiciona os monstros do cenário ao encontro (e portanto aos tokens do mapa)
      scenario.monsters.forEach((m) => {
        const mon = SRD_MONSTERS.find((s) => s.id === m.monsterId);
        if (mon) {
          addMonsterCombatant(mon, m.count);
        }
      });

      // Quando o prólogo pede um teste, deixe o jogador rolar e escolher uma ação antes do combate.
      if (scenario.monsters.length > 0 && !scenario.requestedRoll) {
        setTimeout(() => {
          startEncounter();
        }, 300);
      }

      // 6. Envia o prólogo/história da IA para o chat da sala
      const prologueText = customPrompt?.trim()
        ? `📜 **Prólogo da Nova Campanha: ${customTitle || 'Aventura Inexplorada'}**\n\n${customPrompt}\n\nO Mestre Supremo (IA) aguarda as escolhas do grupo!`
        : `📜 **Prólogo da Campanha: ${scenario.title}**\n\n${scenario.initialPrompt}`;

      sendChatMessage(
        {
          text: prologueText,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          suggestedActions: scenario.suggestedActions,
          requestedRoll: scenario.requestedRoll,
        },
        '✨ Mestre Supremo (IA)'
      );

      // 7. Muda automaticamente a visualização do app para a Mesa Tática (VTT)
      setCurrentMode('vtt');
      setIsMultiplayerOpen(false);

      // 8. Tenta copiar o link de convite e avisa o jogador
      try {
        const inviteUrl = `${window.location.origin}?room=${code}`;
        await navigator.clipboard.writeText(inviteUrl);
        showNotification(`🎉 Mesa com Mestre IA iniciada! Código: ${code} (Link copiado para a área de transferência)`);
      } catch {
        showNotification(`🎉 Mesa com Mestre IA iniciada! Código da sala: ${code}`);
      }

      return code;
    },
    [
      character,
      createRoom,
      selectMapPreset,
      updateMapConfig,
      resetEncounter,
      importPlayerCharacters,
      addMonsterCombatant,
      startEncounter,
      sendChatMessage,
      showNotification,
      setIsMultiplayerOpen,
    ]
  );

  // Transferir Crônica da Aventura Solo do Modal para o Mapa Tático (VTT)
  const handleOpenVttFromAiDm = useCallback(
    (history: AiMessage[]) => {
      if (history.length > 0) {
        const converted: ChatMessage[] = history.map((aiMsg, index) => ({
          id: aiMsg.id || `chat-from-aidm-${Date.now()}-${index}`,
          senderId: aiMsg.role === 'player' ? (character.id || 'player') : 'ai_dm',
          senderName: aiMsg.role === 'player' ? (character.name || 'Herói') : '✨ Mestre Supremo (IA)',
          text: aiMsg.content,
          type: aiMsg.role === 'player' ? 'PUBLIC' : 'AI_DM',
          suggestedActions: aiMsg.suggestedActions,
          requestedRoll: aiMsg.requestedRoll,
          monsterSpawns: aiMsg.monsterSpawns,
          mapMoves: aiMsg.mapMoves,
          timestamp: aiMsg.timestamp || Date.now(),
        }));
        setChatLog(converted);
      }

      setIsAiDmOpen(false);
      setCurrentMode('vtt');
      showNotification('🗺️ Aventura Solo transferida para o Mapa Tático! O Mestre IA continuará narrando pelo chat.');
    },
    [character.id, character.name, setChatLog, showNotification, setIsAiDmOpen]
  );

  // Iniciar Aventura Solo Diretamente no Mapa Tático (VTT)
  const handleStartSoloAdventureOnMap = useCallback(
    (scenario: AiAdventureScenario, customPrompt?: string) => {
      // 1. Carrega o preset do mapa tático correspondente
      const targetPreset =
        DEFAULT_MAP_PRESETS.find((p) => p.id === scenario.mapPresetId) ||
        DEFAULT_MAP_PRESETS[0];
      if (targetPreset) {
        selectMapPreset(targetPreset);
      }

      // 2. Atualiza iluminação ambiente e névoa
      updateMapConfig({
        ambientLight: scenario.ambientLight,
        fogOfWarEnabled: false,
      });

      // 3. Reinicia encontro e insere o personagem ativo
      resetEncounter();
      importPlayerCharacters([character]);

      // 4. Adiciona os monstros do cenário ao encontro e tokens do mapa
      scenario.monsters.forEach((m) => {
        const mon = SRD_MONSTERS.find((s) => s.id === m.monsterId);
        if (mon) {
          addMonsterCombatant(mon, m.count);
        }
      });

      // Quando o prólogo pede um teste, deixe o jogador rolar e escolher uma ação antes do combate.
      if (scenario.monsters.length > 0 && !scenario.requestedRoll) {
        setTimeout(() => {
          startEncounter();
        }, 300);
      }

      // 5. Monta o prólogo narrativo da IA
      const prologueText = customPrompt?.trim()
        ? `📜 **Prólogo da Aventura Solo: ${scenario.title}**\n\n${customPrompt}\n\nO Mestre Supremo (IA) aguarda as suas ações no mapa tático!`
        : `📜 **Prólogo da Aventura Solo: ${scenario.title}**\n\n${scenario.initialPrompt}`;

      const prologueMsg: ChatMessage = {
        id: `prologue_${Date.now()}`,
        senderId: 'ai_dm',
        senderName: '✨ Mestre Supremo (IA)',
        text: prologueText,
        type: 'AI_DM',
        suggestedActions: scenario.suggestedActions,
        requestedRoll: scenario.requestedRoll,
        timestamp: Date.now(),
      };

      setChatLog([prologueMsg]);
      saveStoredChatHistory([
        {
          id: prologueMsg.id,
          role: 'narrator',
          content: prologueMsg.text,
          timestamp: prologueMsg.timestamp,
          suggestedActions: prologueMsg.suggestedActions,
          requestedRoll: prologueMsg.requestedRoll,
        },
      ]);

      // 6. Transiciona para a tela do VTT e fecha modais
      setIsAiDmOpen(false);
      setCurrentMode('vtt');
      showNotification(`🗺️ Aventura "${scenario.title}" iniciada no Mapa Tático com o Mestre IA!`);
    },
    [
      character,
      selectMapPreset,
      updateMapConfig,
      resetEncounter,
      importPlayerCharacters,
      addMonsterCombatant,
      startEncounter,
      setChatLog,
      showNotification,
      setIsAiDmOpen,
    ]
  );

  // Handlers para Finalizar Mesa / Iniciar Nova Aventura
  const handleStartNewAdventure = useCallback(() => {
    clearStoredChatHistory();
    clearChatLog();
    resetEncounter();
    setTokens((prev) => prev.filter((t) => t.type === 'player'));
    setIsEndSessionOpen(false);
    setIsMultiplayerOpen(true);
    showNotification('✨ Memória da IA limpa! Escolha um cenário ou inicie uma nova aventura.');
  }, [clearChatLog, resetEncounter, setTokens, showNotification, setIsEndSessionOpen, setIsMultiplayerOpen]);

  const handleClearMonstersAndCombat = useCallback(() => {
    resetEncounter();
    setTokens((prev) => prev.filter((t) => t.type === 'player'));
    setIsEndSessionOpen(false);
    showNotification('🧹 Monstros e combate limpos! O mapa atual foi mantido.');
  }, [resetEncounter, setTokens, showNotification, setIsEndSessionOpen]);

  const handleDisconnectAndExit = useCallback(() => {
    if (isConnected) {
      disconnect();
    }
    clearStoredChatHistory();
    clearChatLog();
    resetEncounter();
    setTokens((prev) => prev.filter((t) => t.type === 'player'));
    setIsEndSessionOpen(false);
    setCurrentMode('player');
    showNotification('🚪 Sessão finalizada. Retornando à ficha do personagem.');
  }, [isConnected, disconnect, clearChatLog, resetEncounter, setTokens, showNotification, setIsEndSessionOpen]);

  // Hook de Presença Social, Quem Está Online e Lista de Amigos
  const {
    onlineUsers,
    friends,
    pendingInvites,
    isUsingFallback,
    handleAddFriend,
    handleRemoveFriend,
    handleSendGameInvite,
    handleAcceptInvite,
    handleDeclineInvite,
  } = useSocialPresence({
    user,
    character,
    currentRoomCode: roomCode,
    isConnectedMultiplayer: isConnected,
  });

  // Aceitar convite de jogo de um amigo
  const handleAcceptGameInvite = useCallback(
    async (invite: GameInvite) => {
      const targetRoomCode = await handleAcceptInvite(invite);
      if (targetRoomCode) {
        showNotification(`Conectando à mesa de ${invite.fromUserName} (${targetRoomCode})...`);
        const classAvatar = SRD_CLASSES.find(
          (c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()
        )?.avatarUrl;
        const effectiveAvatar = character.avatarUrl || classAvatar;
        const charData = {
          characterClass: character.characterClass,
          currentHp: character.currentHp,
          maxHp: character.maxHp,
          armorClass: character.armorClass,
          dexScore: character.abilities?.dex?.score,
          initiativeBonus: character.initiativeBonus,
        };
        const ok = await joinRoom(targetRoomCode, character.name || 'Jogador', effectiveAvatar, charData);
        if (ok) {
          setCurrentMode('vtt');
          showNotification(`🎉 Você entrou na mesa ${targetRoomCode}!`);
        } else {
          showNotification(`⚠️ Não foi possível entrar na sala ${targetRoomCode}. Verifique o código.`);
        }
      }
    },
    [handleAcceptInvite, joinRoom, character, showNotification]
  );

  // Criar sala e convidar amigo caso ainda não esteja em uma sala
  const handleCreateRoomAndInvite = useCallback(
    async (friendUserId: string, friendName: string) => {
      let code = roomCode;
      if (!isConnected) {
        const classAvatar = SRD_CLASSES.find(
          (c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()
        )?.avatarUrl;
        const effectiveAvatar = character.avatarUrl || classAvatar;
        code = await createRoom(character.name || 'Herói', undefined, effectiveAvatar);
        setCurrentMode('vtt');
      }
      if (code) {
        await handleSendGameInvite(friendUserId, friendName, code);
        showNotification(`⚔️ Convite para a mesa ${code} enviado para ${friendName}!`);
      }
    },
    [isConnected, roomCode, createRoom, character.name, character.characterClass, character.avatarUrl, handleSendGameInvite, showNotification]
  );

  // Mover Token local e transmitir para a rede P2P
  const handleMoveToken = useCallback(
    (id: string, x: number, y: number) => {
      moveToken(id, x, y);
      if (isConnected) {
        // Envia tokens atualizados
        const updated = tokens.map((t) => (t.id === id ? { ...t, x, y } : t));
        broadcastTokenMove(updated, character.name);
      }
    },
    [moveToken, isConnected, tokens, broadcastTokenMove, character.name]
  );

  // Atualizar Token local (PV, tocha, etc.), sincronizar ficha e transmitir para a rede P2P
  const handleUpdateToken = useCallback(
    (id: string, updates: Partial<MapToken>) => {
      updateToken(id, updates);

      // Se o token pertencer ao personagem atual, sincroniza PV com a ficha
      const targetToken = tokens.find((t) => t.id === id);
      if (targetToken && updates.currentHp !== undefined) {
        if (targetToken.name.toLowerCase() === (character.name || '').toLowerCase()) {
          updateCharacter((prev) => ({
            ...prev,
            currentHp: updates.currentHp!,
          }));
        }
        if (targetToken.combatantId) {
          applyCombatantHpDelta(targetToken.combatantId, updates.currentHp - targetToken.currentHp);
        }
      }

      if (isConnected) {
        const updated = tokens.map((t) => (t.id === id ? { ...t, ...updates } : t));
        broadcastTokenMove(updated, character.name);
      }
    },
    [updateToken, tokens, character.name, updateCharacter, applyCombatantHpDelta, isConnected, broadcastTokenMove]
  );

  // Revelar Névoa e transmitir para a rede
  const handleAddFogShape = useCallback(
    (shape: Omit<FogShape, 'id'>) => {
      addFogShape(shape);
      if (isConnected && isHost) {
        broadcastFogUpdate([...mapConfig.revealedShapes, { ...shape, id: `fog-${Date.now()}` }]);
      }
    },
    [addFogShape, isConnected, isHost, broadcastFogUpdate, mapConfig.revealedShapes]
  );

  // Redefinir Névoa e transmitir para a rede
  const handleResetFog = useCallback(() => {
    resetFog();
    if (isConnected && isHost) {
      broadcastFogUpdate([]);
    }
  }, [resetFog, isConnected, isHost, broadcastFogUpdate]);

  // Revelar toda a Névoa e transmitir para a rede
  const handleRevealAllFog = useCallback(() => {
    revealAllFog();
    if (isConnected && isHost) {
      const fullShape: FogShape = {
        id: 'fog-all-revealed',
        x: 0,
        y: 0,
        width: mapConfig.width || 30,
        height: mapConfig.height || 30,
        type: 'rect',
        isRevealed: true,
      };
      broadcastFogUpdate([fullShape]);
    }
  }, [revealAllFog, isConnected, isHost, broadcastFogUpdate, mapConfig.width, mapConfig.height]);

  // Atualizar configuração do mapa e transmitir aos outros jogadores
  const handleUpdateMapConfig = useCallback(
    (updater: Partial<BattleMapConfig> | ((prev: BattleMapConfig) => BattleMapConfig)) => {
      if (typeof updater === 'function') {
        setMapConfig((prev) => {
          const next = updater(prev);
          if (isConnected) {
            broadcastMapConfig(next);
          }
          return next;
        });
      } else {
        updateMapConfig(updater);
        if (isConnected) {
          broadcastMapConfig(updater);
        }
      }
    },
    [updateMapConfig, setMapConfig, isConnected, broadcastMapConfig]
  );

  // Selecionar preset do mapa e sincronizar com todos na mesa
  const handleSelectMapPreset = useCallback(
    (preset: DefaultMapPreset) => {
      selectMapPreset(preset);
      if (isConnected) {
        broadcastMapConfig({
          id: preset.id,
          title: preset.title,
          imageUrl: preset.imageUrl,
          gridSize: preset.gridSize,
          width: preset.width,
          height: preset.height,
        });
      }
    },
    [selectMapPreset, isConnected, broadcastMapConfig]
  );

  // Fazer upload de mapa customizado e transmitir aos jogadores
  const handleUploadCustomMap = useCallback(
    (title: string, imageUrl: string, width?: number, height?: number) => {
      uploadCustomMap(title, imageUrl, width || 1200, height || 800);
      if (isConnected) {
        broadcastMapConfig({
          id: `map-custom-${Date.now()}`,
          title,
          imageUrl,
          width: width || 1200,
          height: height || 800,
        });
      }
    },
    [uploadCustomMap, isConnected, broadcastMapConfig]
  );

  // Adicionar Token local e transmitir para a rede P2P
  const handleAddToken = useCallback(
    (tokenData: Omit<MapToken, 'id'>) => {
      const newToken = addToken(tokenData);
      if (isConnected) {
        const updated = [...tokens, newToken];
        broadcastTokenMove(updated, character.name);
      }
      return newToken;
    },
    [addToken, isConnected, tokens, broadcastTokenMove, character.name]
  );

  // Remover Token local e transmitir para a rede P2P
  const handleRemoveToken = useCallback(
    (id: string) => {
      removeToken(id);
      if (isConnected) {
        const updated = tokens.filter((t) => t.id !== id);
        broadcastTokenMove(updated, character.name);
      }
    },
    [removeToken, isConnected, tokens, broadcastTokenMove, character.name]
  );

  // Rolagens com d20 (Testes, Salvaguardas, Perícias, Ataques)
  const handleRollD20 = useCallback(
    (label: string, modifier: number) => {
      const res = rollD20(label, modifier, advantageMode);
      if (isSecretRoll) {
        res.isSecret = true;
      }
      addRollResult(res);
      if (encounterRef.current?.isRunning && !isSecretRoll) {
        const bonus = res.modifier >= 0 ? `+${res.modifier}` : `${res.modifier}`;
        recordCombatAction(`${character.name || 'Jogador'}: ${label} — ${res.breakdown} = ${res.total} (bônus ${bonus}; ${res.advantageMode}).`, 'roll', character.name || 'Jogador');
      }

      // Se estiver conectado em sala multiplayer, transmite para todos na mesa (ou oculta se for secreto)
      if (isConnected) {
        if (isSecretRoll) {
          sendChatMessage({
            text: 'Rolou um d20 em segredo...',
            senderName: character.name,
            type: 'GM_ROLL',
            diceRoll: res,
          });
        } else {
          broadcastDiceRoll(res, character.name);
        }
      }

      // Se for iniciativa do jogador, sincroniza com o DM Screen local
      if (label === 'Iniciativa' && character) {
        broadcastSyncMessage({
          type: 'PLAYER_INITIATIVE_ROLLED',
          payload: {
            playerId: character.id,
            initiative: res.total,
          },
        });
        showNotification(`Iniciativa (${res.total}) enviada para o combate do Mestre!`);
      }

      // Regras Oficiais de D&D 5e: Salvaguardas contra a Morte automáticas
      const isDeathSave = /salvamento de morte|salvaguarda da morte|death save/i.test(label);
      if (isDeathSave && character) {
        const d20Roll = res.selectedRoll ?? res.total;
        const currentSuccesses = character.deathSaves?.successes || 0;
        const currentFailures = character.deathSaves?.failures || 0;

        if (d20Roll === 20) {
          // 20 Natural: Recupera 1 PV e acorda consciente imediatamente!
          updateCharacter((prev) => ({
            ...prev,
            currentHp: Math.max(1, prev.currentHp || 0) + 1,
            deathSaves: { successes: 0, failures: 0 },
          }));
          showNotification('🌟 20 NATURAL! Você recuperou 1 PV e recobrou a consciência!');
        } else if (d20Roll >= 10) {
          // Sucesso
          const newSuccesses = Math.min(3, currentSuccesses + 1);
          updateCharacter((prev) => ({
            ...prev,
            deathSaves: { ...prev.deathSaves, successes: newSuccesses },
          }));
          if (newSuccesses >= 3) {
            showNotification('🛡️ 3 Sucessos! Você se estabilizou contra a morte!');
          } else {
            showNotification(`🛡️ Sucesso no teste de morte (${newSuccesses}/3)!`);
          }
        } else if (d20Roll === 1) {
          // 1 Natural: 2 Falhas imediatas!
          const newFailures = Math.min(3, currentFailures + 2);
          updateCharacter((prev) => ({
            ...prev,
            deathSaves: { ...prev.deathSaves, failures: newFailures },
          }));
          if (newFailures >= 3) {
            showNotification('💀 1 NATURAL! 2 Falhas adicionadas. Você acumulou 3 falhas de morte!');
          } else {
            showNotification(`💔 1 Natural! 2 Falhas de morte sofridas (${newFailures}/3)!`);
          }
        } else {
          // Falha normal (< 10)
          const newFailures = Math.min(3, currentFailures + 1);
          updateCharacter((prev) => ({
            ...prev,
            deathSaves: { ...prev.deathSaves, failures: newFailures },
          }));
          if (newFailures >= 3) {
            showNotification('💀 3 Falhas acumuladas nas salvaguardas da morte!');
          } else {
            showNotification(`💔 Falha no teste de morte (${newFailures}/3)!`);
          }
        }
      }

      // Reset para modo normal após rolar com vantagem/desvantagem
      if (advantageMode !== 'normal') {
        setAdvantageMode('normal');
      }
    },
    [
      advantageMode,
      isSecretRoll,
      addRollResult,
      isConnected,
      sendChatMessage,
      character,
      broadcastDiceRoll,
      showNotification,
      updateCharacter,
      setAdvantageMode,
      recordCombatAction,
      isSecretRoll,
      character.name,
    ]
  );

  // Alternar Condição Ativa na Ficha
  const handleToggleCondition = useCallback(
    (conditionKey: string) => {
      const current = character.activeConditions || [];
      const exists = current.includes(conditionKey);
      const updated = exists
        ? current.filter((c) => c !== conditionKey)
        : [...current, conditionKey];
      updateCharacter({ activeConditions: updated });
    },
    [character.activeConditions, updateCharacter]
  );

  const handleClearConditions = useCallback(() => {
    updateCharacter({ activeConditions: [] });
  }, [updateCharacter]);

  // Enviar Monstro do Bestiário para o Mapa Tático
  const handleAddTokenFromMonster = useCallback(
    (monster: Monster) => {
      const size = monster.size === 'Grande' ? 2 : monster.size === 'Enorme' ? 3 : 1;
      addToken({
        name: monster.name,
        x: 250 + Math.floor(Math.random() * 60),
        y: 200 + Math.floor(Math.random() * 60),
        size,
        color: '#f43f5e',
        avatarUrl: monster.avatarUrl,
        currentHp: monster.hitPoints,
        maxHp: monster.hitPoints,
        type: 'monster',
        conditions: [],
      });
      showNotification(`Monstro "${monster.name}" enviado para o Mapa Tático!`);
    },
    [addToken, showNotification]
  );

  // Rolar qualquer dado rápido (d4, d6, d8, etc.)
  const handleRollDie = useCallback(
    (sides: number) => {
      if (sides === 20) {
        handleRollD20('d20 Puro', 0);
        return;
      }
      const val = rollDie(sides);
      const res: DiceRollResult = {
        id: `roll-${Date.now()}`,
        label: `d${sides}`,
        dieType: `d${sides}`,
        rolls: [val],
        selectedRoll: val,
        modifier: 0,
        total: val,
        advantageMode: 'normal',
        breakdown: `d${sides} (${val})`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        isSecret: isSecretRoll,
      };
      addRollResult(res);

      if (isConnected) {
        if (isSecretRoll) {
          sendChatMessage({
            text: `Rolou d${sides} em segredo...`,
            senderName: character.name,
            type: 'GM_ROLL',
            diceRoll: res,
          });
        } else {
          broadcastDiceRoll(res, character.name);
        }
      }
    },
    [handleRollD20, isSecretRoll, addRollResult, isConnected, sendChatMessage, character.name, broadcastDiceRoll]
  );

  // Rolar fórmula personalizada ou dano
  const handleRollFormula = useCallback(
    (formula: string, label: string, isCrit = false) => {
      const res = rollFormula(formula, label, isCrit);
      if (res.invalidFormula) {
        showNotification(res.breakdown);
        return;
      }
      if (isSecretRoll) {
        res.isSecret = true;
      }
      addRollResult(res);
      if (encounterRef.current?.isRunning && !isSecretRoll) {
        recordCombatAction(`${character.name || 'Jogador'}: ${label || formula} — ${res.breakdown} = ${res.total}.`, 'roll', character.name || 'Jogador');
      }

      if (isConnected) {
        if (isSecretRoll) {
          sendChatMessage({
            text: `Rolou ${formula} em segredo...`,
            senderName: character.name,
            type: 'GM_ROLL',
            diceRoll: res,
          });
        } else {
          broadcastDiceRoll(res, character.name);
        }
      }
    },
    [isSecretRoll, addRollResult, isConnected, sendChatMessage, character.name, broadcastDiceRoll, recordCombatAction, showNotification]
  );

  // Rolar novamente a última rolagem ativa (Re-roll na animação 3D)
  const handleReroll = useCallback(() => {
    if (!activeRollAnimation) return;
    if (activeRollAnimation.dieType === 'd20') {
      handleRollD20(activeRollAnimation.label, activeRollAnimation.modifier);
    } else if (activeRollAnimation.dieType.startsWith('d')) {
      const sides = parseInt(activeRollAnimation.dieType.replace('d', ''), 10);
      if (!isNaN(sides)) {
        handleRollDie(sides);
      }
    } else {
      handleRollFormula(activeRollAnimation.dieType, activeRollAnimation.label);
    }
  }, [activeRollAnimation, handleRollD20, handleRollDie, handleRollFormula]);

  // Executa o ataque autônomo do monstro pela IA com dados 3D na tela, transmissão P2P e dedução de PV
  const executeAiMonsterAttack = useCallback(
    (attack: MonsterAttackAction): Promise<void> => {
      return new Promise<void>((resolve) => {
        const currentEncounter = encounterRef.current;
        const monster = currentEncounter?.combatants.find((c) => c.type === 'monster' && c.name.toLowerCase() === attack.monsterName.toLowerCase() && c.currentHp > 0);
        const storedAction = monster?.monsterData?.actions.find((a) => a.name.toLowerCase() === attack.attackName.toLowerCase());
        const safeAttack = monster && storedAction
          ? { ...attack, monsterName: monster.name, attackName: storedAction.name, attackBonus: storedAction.attackBonus ?? 0, damageFormula: storedAction.damageFormula || '' }
          : null;
        if (!safeAttack || !safeAttack.damageFormula || !isValidDiceFormula(safeAttack.damageFormula)) {
          showNotification('Ação cancelada: ataque ou fórmula não consta na ficha válida do monstro.');
          resolve();
          return;
        }
        const requestedTarget = currentEncounter?.combatants.find((c) => c.type === 'player' && c.name.toLowerCase() === (safeAttack.target || character.name || '').toLowerCase());
        if (!requestedTarget || requestedTarget.currentHp <= 0) {
          showNotification(`${safeAttack.target || 'O alvo'} não está consciente ou não pertence ao grupo. O ataque foi cancelado.`);
          resolve();
          return;
        }
        attack = safeAttack;
        const requestedTargetName = requestedTarget.name;
        // 1. Notificação de início do ataque
        showNotification(`🐉 ${attack.monsterName} ataca com ${attack.attackName}!`);

        // 2. Rolagem de Ataque com d20 único (aciona animação 3D e broadcast P2P)
        const targetName = requestedTargetName;
        const targetCombatant = encounterRef.current?.combatants.find((c) => c.name.toLowerCase() === targetName.toLowerCase());
        const targetAc = targetCombatant?.armorClass || character.armorClass || 10;
        const attackLabel = `${attack.monsterName}: ${attack.attackName}${attack.target ? ` (vs ${attack.target})` : ''}`;
        
        const attackRoll = rollD20(attackLabel, attack.attackBonus || 0, 'normal');
        addRollResult(attackRoll);
        if (isConnected) {
          broadcastDiceRoll(attackRoll, attack.monsterName);
        }

        const natural = attackRoll.rolls?.[0] ?? attackRoll.selectedRoll;
        const isNat20 = natural === 20 || Boolean(attackRoll.isCriticalSuccess);
        const isNat1 = natural === 1 || Boolean(attackRoll.isCriticalFailure);
        const isHit = isNat20 || (!isNat1 && attackRoll.total >= targetAc);
        recordCombatAction(`${attack.monsterName}: ${attack.attackName} +${attack.attackBonus || 0} — ${attackRoll.breakdown} = ${attackRoll.total} contra CA ${targetAc}: ${isHit ? 'acerto' : 'erro'}.`, 'attack', attack.monsterName);

        // 3. Intervalo de suspense (1.6s) para os jogadores conferirem se acertou a CA antes do dano
        setTimeout(() => {
          let finalDamage = 0;
          let damageRoll: DiceRollResult | null = null;

          if (isHit) {
            const damageLabel = `${attack.monsterName}: Dano ${attack.attackName}`;
            damageRoll = rollFormula(attack.damageFormula, damageLabel, isNat20);
            finalDamage = damageRoll.total;
            recordCombatAction(`${attack.monsterName}: dano ${damageRoll.breakdown} = ${finalDamage}${isNat20 ? ' (crítico)' : ''} contra ${targetName}.`, 'attack', attack.monsterName);

            // Se o herói local for o alvo, deduz vida na ficha e no mapa
            const isLocalTarget =
              !attack.target ||
              attack.target.toLowerCase() === (character.name || '').toLowerCase() ||
              attack.target.toLowerCase() === 'o herói';

            if (isLocalTarget && finalDamage > 0) {
              applyDamage(finalDamage);

              setTokens((prev) =>
                prev.map((t) => {
                  if (t.type === 'player' && t.name.toLowerCase() === (character.name || '').toLowerCase()) {
                    const current = t.currentHp ?? t.maxHp ?? 10;
                    return { ...t, currentHp: Math.max(0, current - finalDamage) };
                  }
                  return t;
                })
              );
            }

            // Também deduz o dano no combatente correspondente em encounter.combatants
            const hpTarget = targetCombatant || encounterRef.current?.combatants.find(
              (c) => c.name.toLowerCase() === (attack.target || '').toLowerCase() ||
                (isLocalTarget && c.name.toLowerCase() === (character.name || '').toLowerCase())
            );
            if (hpTarget && finalDamage > 0) {
              applyCombatantHpDelta(hpTarget.id, -finalDamage, attack.monsterName, { critical: isNat20 });
            }
          }

          const breakdown = attackRoll.breakdown;
          const outcome = isNat20
            ? '💥 ACERTO CRÍTICO!'
            : isHit
            ? `⚔️ ACERTOU! (vs CA ${targetAc})`
            : `🛡️ ERROU! (vs CA ${targetAc})`;

          let resultChat = `⚔️ **${attack.monsterName}** desferiu **${attack.attackName}** contra **${targetName}**!\n\n` +
            `🎲 **Rolagem de Ataque:** [${breakdown}] ➜ **${outcome}**\n`;

          if (isHit && damageRoll) {
            resultChat += `🩸 **Dano de D&D 5e:** [${damageRoll.breakdown}] = **${finalDamage}** de dano sofrido!\n` +
              `💔 **${targetName}** sofreu dano em combate!`;
          } else {
            resultChat += `🛡️ O golpe ricocheteou na armadura ou foi esquivado a tempo!`;
          }

          sendChatMessage(
            {
              text: resultChat,
              senderName: '✨ Mestre Supremo (IA)',
              type: 'AI_DM',
              diceRoll: damageRoll || undefined,
            },
            '✨ Mestre Supremo (IA)'
          );

          // 4. Notificação e avanço automático de turno do monstro após o ataque
          showNotification(`⚔️ ${attack.monsterName} finalizou o ataque!`);
          if (encounterRef.current?.isRunning) {
            setTimeout(() => {
              nextTurn();
            }, 1000);
          }
          resolve();
        }, 1600);
      });
    },
    [character, applyDamage, applyCombatantHpDelta, nextTurn, addRollResult, isConnected, broadcastDiceRoll, setTokens, sendChatMessage, showNotification, recordCombatAction]
  );
  executeAiMonsterAttackRef.current = executeAiMonsterAttack;

  // Dispara a jogada do monstro ativo (ou selecionado) controlada pelo Mestre IA
  const handleTriggerAiMonsterTurn = useCallback(
    (targetCombatant?: Combatant) => {
      // 1. Identifica o combatente alvo: o passado por argumento, ou o da iniciativa atual, ou o primeiro monstro vivo
      const activeCombatant = encounter.combatants[encounter.activeCombatantIndex];
      const mon =
        targetCombatant ||
        (activeCombatant?.type === 'monster'
          ? activeCombatant
          : encounter.combatants.find((c) => c.type === 'monster' && c.currentHp > 0));

      if (!mon) {
        showNotification('Nenhum monstro ativo ou vivo no combate para a IA controlar!');
        return;
      }

      // 2. Localiza as ações do monstro no compêndio/ficha do monstro
      const actions = mon.monsterData?.actions || [];
      const chosenAction =
        actions.find((a) => a.attackBonus !== undefined && a.damageFormula) ||
        actions[0] || {
          name: 'Investida Feroz',
          attackBonus: 3,
          damageFormula: '1d6+1',
          description: 'Um golpe brutal com garras, presas ou armas rústicas.',
        };

      if (!mon.monsterData?.actions.some((action) => action.name === chosenAction.name && action.damageFormula) || !chosenAction.damageFormula || !isValidDiceFormula(chosenAction.damageFormula)) {
        showNotification(`${mon.name} não tem um ataque válido cadastrado. O turno automático foi cancelado.`);
        return;
      }

      const currentEncounter = encounterRef.current;
      const consciousTargets = (currentEncounter?.combatants || encounter.combatants)
        .filter((c) => c.type === 'player' && c.currentHp > 0);
      const target = consciousTargets[0];
      if (!target) {
        setEncounter((prev) => ({
          ...prev,
          isRunning: false,
          actionLog: [{ id: `log-${Date.now()}`, timestamp: Date.now(), round: prev.round, actor: 'Mestre', kind: 'turn' as const, message: 'Combate pausado: não há personagens jogadores conscientes para continuar os turnos automáticos.' }, ...(prev.actionLog || [])].slice(0, 50),
        }));
        sendChatMessage({
          text: '⏸️ **Combate pausado.** Não há heróis conscientes para os inimigos atacarem automaticamente. O personagem a 0 PV permanece inconsciente; o Mestre pode retomar a cena, aplicar cura ou decidir o próximo passo.',
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
        }, '✨ Mestre Supremo (IA)');
        showNotification('Combate pausado: nenhum herói consciente.');
        return;
      }

      const attackAction: MonsterAttackAction = {
        monsterName: mon.name,
        attackName: chosenAction.name,
        attackBonus: chosenAction.attackBonus ?? 0,
        damageFormula: chosenAction.damageFormula,
        target: target.name,
      };

      // 3. Registra a narração da IA no chat compartilhado
      sendChatMessage(
        {
          text: `⚔️ **Turno do Monstro:** O Mestre IA comanda **${mon.name}**, que avança ferozmente e desfere **${chosenAction.name}** contra os heróis!`,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          monsterAttack: attackAction,
        },
        '✨ Mestre Supremo (IA)'
      );

      // 4. Dispara a sequência de dados 3D na tela de todos
      executeAiMonsterAttack(attackAction);
    },
    [encounter.combatants, encounter.activeCombatantIndex, executeAiMonsterAttack, sendChatMessage, showNotification, setEncounter]
  );
  handleTriggerAiMonsterTurnRef.current = handleTriggerAiMonsterTurn;

  // Automação: O Mestre IA assume e joga o turno dos monstros automaticamente
  const isAiMonsterTurnExecutingRef = useRef(false);

  useEffect(() => {
    if (!encounter.isRunning) {
      isAiMonsterTurnExecutingRef.current = false;
      return;
    }

    // Apenas na sessão local/solo ou no Host da sala multiplayer
    if (isConnected && !isHost) return;

    const activeCombatant = encounter.combatants[encounter.activeCombatantIndex];
    if (!activeCombatant) return;

    // Se o combatente da vez for um monstro vivo
    if (activeCombatant.type === 'monster' && activeCombatant.currentHp > 0) {
      if (isAiMonsterTurnExecutingRef.current) return;
      isAiMonsterTurnExecutingRef.current = true;

      // Delay tático suave (1500ms) para criar expectativa e permitir ao jogador acompanhar a iniciativa
      const timer = setTimeout(() => {
        handleTriggerAiMonsterTurnRef.current?.(activeCombatant);
        // Libera a trava após o ataque e passagem para o próximo turno
        setTimeout(() => {
          isAiMonsterTurnExecutingRef.current = false;
        }, 3200);
      }, 1500);

      return () => {
        clearTimeout(timer);
        isAiMonsterTurnExecutingRef.current = false;
      };
    } else {
      isAiMonsterTurnExecutingRef.current = false;
    }
  }, [encounter.isRunning, encounter.activeCombatantIndex, encounter.combatants, isConnected, isHost]);

  // Automação: Detecção de vitória no combate e concessão automática de XP (D&D 5e Oficial)
  const awardedCombatVictoryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!encounter.isRunning) return;

    // Apenas no Host ou em sessão solo para evitar duplicação no P2P
    if (isConnected && !isHost) return;

    const monsters = encounter.combatants.filter((c) => c.type === 'monster');
    if (monsters.length === 0) return;

    // Verifica se todos os monstros foram derrotados
    const allMonstersDefeated = monsters.every((m) => m.currentHp <= 0);
    if (!allMonstersDefeated) return;

    // Evita premiar repetidamente o mesmo combate
    const victoryKey = `${encounter.id}-win-${monsters.map((m) => m.id).join('-')}`;
    if (awardedCombatVictoryIdRef.current === victoryKey) return;
    awardedCombatVictoryIdRef.current = victoryKey;

    // Calcula o XP total dos monstros derrotados segundo as regras do Dungeon Master's Guide 5e
    const totalXp = monsters.reduce((acc, m) => {
      const cr = m.monsterData?.challengeRating || '1/4';
      return acc + getXpForCr(cr);
    }, 0);

    // Conta os jogadores participantes da batalha
    const players = encounter.combatants.filter((c) => c.type === 'player');
    const playerCount = Math.max(1, players.length);
    const xpPerPlayer = Math.round(totalXp / playerCount);

    // Atualiza a ficha do herói com o XP conquistado
    if (xpPerPlayer > 0) {
      updateCharacter((prev) => ({
        ...prev,
        experience: prev.experience + xpPerPlayer,
      }));
    }

    // Mensagem de vitória do Mestre IA no chat
    sendChatMessage(
      {
        text: `🏆 **VITÓRIA NO COMBATE!**\n\nTodos os inimigos foram derrotados na **Rodada ${encounter.round}**!\n\n` +
          `🎖️ **Recompensa de Experiência (D&D 5e Oficial):**\n` +
          `- **XP Total dos Monstros:** ${totalXp} XP\n` +
          `- **Aventureiros:** ${playerCount} herói(s)\n` +
          `- **XP Concedido a Cada Aventureiro:** **+${xpPerPlayer} XP** adicionados automaticamente à ficha!\n\n` +
          `_A poeira da batalha assenta e os corações acalmam. Vocês triunfaram! O que desejam fazer agora?_`,
        senderName: '✨ Mestre Supremo (IA)',
        type: 'AI_DM',
      },
      '✨ Mestre Supremo (IA)'
    );

    showNotification(`🏆 Vitória! +${xpPerPlayer} XP adicionados à ficha de ${character.name}!`);
  }, [encounter.isRunning, encounter.id, encounter.combatants, encounter.round, isConnected, isHost, updateCharacter, sendChatMessage, showNotification, character.name]);

  // Avança o turno D&D 5e e sincroniza entre Host e jogadores
  const handleNextTurn = useCallback(() => {
    nextTurn();
    if (isConnected) {
      if (isHost) {
        setTimeout(() => {
          if (mapConfigRef.current) {
            broadcastRoomSync({
              mapConfig: mapConfigRef.current,
              tokens: tokensRef.current,
              chatLog: chatLogRef.current,
              encounter: encounterRef.current,
            });
          }
        }, 50);
      } else {
        sendChatMessage(
          {
            text: '⚔️ [Turno] Finalizei meu turno no combate!',
            senderName: character.name || 'Jogador',
            type: 'PUBLIC',
          },
          character.name || 'Jogador'
        );
      }
    }
  }, [nextTurn, isConnected, isHost, broadcastRoomSync, sendChatMessage, character.name]);

  // Inicia o encontro D&D 5e e sincroniza com a sala
  const handleStartEncounter = useCallback(() => {
    startEncounter();
    if (isConnected && isHost) {
      setTimeout(() => {
        if (mapConfigRef.current) {
          broadcastRoomSync({
            mapConfig: mapConfigRef.current,
            tokens: tokensRef.current,
            chatLog: chatLogRef.current,
            encounter: encounterRef.current,
          });
        }
      }, 100);
    }
  }, [startEncounter, isConnected, isHost, broadcastRoomSync]);

  const handleRemoveCombatant = useCallback((id: string) => {
    removeCombatant(id);
    setTokens((prev) => prev.filter((t) => t.combatantId !== id && t.id !== id && t.id !== `token-${id}`));
    showNotification('Combatente removido do encontro e do mapa.');
  }, [removeCombatant, setTokens, showNotification]);

  // Descanso Curto (Abre modal interativo para gastar dados de vida e recarregar recursos)
  const handleShortRest = () => {
    setIsShortRestOpen(true);
  };

  // Descanso Longo
  const handleLongRest = () => {
    performLongRest();
    showNotification(
      'Descanso Longo Concluído! Todos os Pontos de Vida, metade dos Dados de Vida e todos os Espaços de Magia foram restaurados.'
    );
  };

  // Importar grupo da campanha na nuvem para o Combate / Iniciativa
  const handleImportPartyToCombat = (members: CampaignPartyMember[]) => {
    if (!members || members.length === 0) {
      showNotification('Nenhum membro no grupo da campanha.');
      return;
    }

    let addedCount = 0;
    members.forEach((m) => {
      addCustomCombatant({
        name: m.name,
        type: 'player',
        initiative: 10 + Math.floor(Math.random() * 8),
        armorClass: m.armorClass || 10,
        maxHp: m.maxHp || 10,
        currentHp: m.currentHp || 10,
        tempHp: 0,
        conditions: [],
        playerId: m.characterId,
      });
      addedCount++;
    });

    setIsCampaignModalOpen(false);
    setCurrentMode('dm');
    showNotification(`${addedCount} aventureiros da campanha importados para o combate!`);
  };

  // Transmitir Pista / Documento (Handout)
  const handleBroadcastHandout = async (data: { title: string; content: string; imageUrl?: string }) => {
    if (activeCampaignId) {
      await broadcastHandoutToCampaign(activeCampaignId, data);
    }
    const handout: CampaignHandout = {
      id: `handout_${Date.now()}`,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      timestamp: Date.now(),
    };
    setActiveHandout(handout);
    setIsHandoutViewerOpen(true);
    sendChatMessage({
      text: `📜 Pista revelada: "${data.title}"`,
      senderName: character.name,
      type: 'PUBLIC',
    });
    showNotification(`Pista "${data.title}" transmitida!`);
  };

  // Guardar Pista no Diário de Campanha do Personagem
  const handleSaveHandoutToJournal = (title: string, content: string) => {
    updateCharacter((prev) => {
      const currentNotes = prev.journal?.loreNotes || '';
      const newEntry = `\n\n### 📜 ${title}\n${content}`;
      return {
        ...prev,
        journal: {
          quests: prev.journal?.quests || [],
          npcs: prev.journal?.npcs || [],
          sharedLoot: prev.journal?.sharedLoot || [],
          loreNotes: (currentNotes + newEntry).trim(),
        },
      };
    });
    showNotification(`Pista salva no Diário de Campanha!`);
  };

  // Conjurar Magia
  const handleCastSpell = (spell: Spell) => {
    if (isCharacterDead(character) || character.currentHp <= 0) {
      showNotification('Um personagem inconsciente ou morto não pode conjurar magia.');
      return;
    }
    const activeCombatant = encounter.isRunning ? encounter.combatants[encounter.activeCombatantIndex] : null;
    if (activeCombatant && (activeCombatant.type !== 'player' || (activeCombatant.id !== character.id && activeCombatant.name.toLowerCase() !== character.name.toLowerCase()))) {
      showNotification('Aguarde o turno do seu personagem para conjurar durante o combate.');
      return;
    }
    const actionType = classifyCastingTime(spell.castingTime);
    const usageKey = actionType ? makeTurnActionUseKey(encounter.id, encounter.round, character.id, actionType) : '';
    if (encounter.isRunning && usageKey && turnSpellUse[usageKey]) {
      showNotification(`Você já usou sua ${actionType} nesta rodada.`);
      return;
    }
    if (spell.level > 0) {
      const slot = character.spellcasting.slots.find((s) => s.level === spell.level);
      if (slot && slot.used < slot.max) {
        toggleSpellSlotUsed(spell.level, slot.used);
        showNotification(`Magia "${spell.name}" conjurada gastando 1 espaço de ${spell.level}º Círculo!`);
      } else {
        showNotification(`Aviso: Nenhum espaço de ${spell.level}º Círculo disponível para "${spell.name}"!`);
        return;
      }
    }

    if (encounter.isRunning && usageKey) {
      setTurnSpellUse((used) => {
        const next = { ...used, [usageKey]: true as const };
        const entries = Object.entries(next);
        return entries.length > 60 ? Object.fromEntries(entries.slice(-40)) : next;
      });
    }

    const match = spell.description.match(/(\d+d\d+(\s*[+-]\s*\d+)?)/i);
    if (match) {
      handleRollFormula(match[1], `${spell.name} (Efeito/Dano)`);
    } else {
      showNotification(`Magia "${spell.name}" ativada!`);
    }
  };

  const handleThemeChange = useCallback((theme: ThemeId) => {
    setCurrentTheme(theme);
    const themeNames: Record<ThemeId, string> = {
      default: 'Ouro & Ardósia',
      parchment: 'Pergaminho Antigo',
      crimson: 'Carmesim & Gótico',
      arcane: 'Místico Arcano',
    };
    showNotification(`Tema alterado para: ${themeNames[theme]}`);
  }, [showNotification]);

  const handleAddCoinsToCharacter = useCallback(
    (coins: { cp: number; sp: number; ep: number; gp: number; pp: number }) => {
      updateCharacter({
        currency: {
          cp: (character.currency?.cp || 0) + coins.cp,
          sp: (character.currency?.sp || 0) + coins.sp,
          ep: (character.currency?.ep || 0) + coins.ep,
          gp: (character.currency?.gp || 0) + coins.gp,
          pp: (character.currency?.pp || 0) + coins.pp,
        },
      });
      showNotification(`Moedas adicionadas com sucesso à ficha de ${character.name}!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleAddToSharedLoot = useCallback(
    (item: { name: string; quantity: number; valueGp: number }) => {
      const existingLoot = character.journal?.sharedLoot || [];
      const newEntry = {
        id: `loot-${Date.now()}`,
        name: item.name,
        quantity: item.quantity,
        value: `${item.valueGp} PO`,
      };
      updateCharacter({
        journal: {
          ...(character.journal || { quests: [], npcs: [], loreNotes: '', sharedLoot: [] }),
          sharedLoot: [...existingLoot, newEntry],
        },
      });
      showNotification(`"${item.name}" adicionado ao Cofre do Grupo no Diário!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleSaveNpcToJournal = useCallback(
    (npc: CampaignNpc) => {
      const existingNpcs = character.journal?.npcs || [];
      updateCharacter({
        journal: {
          ...(character.journal || { quests: [], npcs: [], loreNotes: '', sharedLoot: [] }),
          npcs: [...existingNpcs, npc],
        },
      });
      showNotification(`NPC "${npc.name}" salvo no Diário de Campanha!`);
    },
    [character, updateCharacter, showNotification]
  );

  const handleRollActionFromHotbar = useCallback(
    (name: string, bonus: number, formula?: string) => {
      handleRollD20(name, bonus);
      if (formula) {
        setTimeout(() => {
          handleRollFormula(formula, `${name} (Dano/Efeito)`);
        }, 300);
      }
    },
    [handleRollD20, handleRollFormula]
  );

  const handleLogout = useCallback(() => {
    logout();
    hasAutoOpenedWizardRef.current = false;
    showNotification('Você saiu da conta.');
  }, [logout, showNotification]);

  const handleApproveAiActions = useCallback(async (proposal: AiMessage) => {
    setPendingAiAction(null);
    (proposal.monsterSpawns || []).forEach((spawn) => {
      const wanted = spawn.monsterName.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
      const rawWanted = wanted.replace(/\s*\d+$/, '').trim();
      const currentMonsters = encounterRef.current?.combatants.filter((c) => c.type === 'monster' || c.type === 'npc') || [];
      const alreadyInCombat = currentMonsters.some((c) => {
        const cName = c.name.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s*\d+$/, '').trim();
        return cName === rawWanted || cName.includes(rawWanted) || rawWanted.includes(cName);
      });
      if (encounterRef.current?.isRunning && alreadyInCombat) {
        showNotification(`A criatura "${spawn.monsterName}" já está no combate; spawn duplicado ignorado.`);
        return;
      }
      const monster = SRD_MONSTERS.find((item) => {
        const iName = item.name.toLowerCase();
        return iName === wanted || iName.includes(wanted) || wanted.includes(iName);
      });
      if (monster) {
        addMonsterCombatant(monster, Math.max(1, Math.min(20, spawn.count)));
        return;
      }
      const customMonster: Monster = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: spawn.monsterName, size: 'Médio', type: 'Monstruosidade', alignment: 'Hostil', armorClass: 13,
        hitPoints: 22, hitDice: '3d8+6', speed: '9m', abilities: { str: 14, dex: 12, con: 14, int: 8, wis: 10, cha: 8 },
        challengeRating: '1', xp: 200, senses: 'Visão no Escuro 18m', languages: 'Comum',
        actions: [{ name: 'Ataque Selvagem', type: 'melee', description: 'Ataque corpo a corpo: +4 para acertar, dano 1d8+2 cortante.', attackBonus: 4, damageFormula: '1d8+2' }],
      };
      addMonsterCombatant(customMonster, Math.max(1, Math.min(20, spawn.count)));
    });

    for (const move of proposal.mapMoves || []) {
      const token = tokensRef.current.find((item) => item.name.toLowerCase() === move.tokenName.toLowerCase());
      if (!token) { showNotification(`Não encontrei o token “${move.tokenName}”; movimento ignorado.`); continue; }
      const distance = Math.max(0, Math.min(12, move.distanceSquares ?? 4)) * 50;
      const act = move.actionOrTarget.toLowerCase();
      const target = tokensRef.current.find((item) => item.id !== token.id && act.includes(item.name.toLowerCase()));
      let x = token.x;
      let y = token.y;
      if (target) {
        const length = Math.hypot(target.x - x, target.y - y) || 1;
        const moveBy = Math.min(distance, Math.max(0, length - 50));
        x += Math.round((target.x - x) / length * moveBy);
        y += Math.round((target.y - y) / length * moveBy);
      } else if (act.includes('norte') || act.includes('cima')) y -= distance;
      else if (act.includes('sul') || act.includes('baixo')) y += distance;
      else if (act.includes('oeste') || act.includes('esquerda')) x -= distance;
      else if (act.includes('leste') || act.includes('direita')) x += distance;
      else { showNotification(`Revise a direção do movimento de ${move.tokenName}; movimento ignorado.`); continue; }
      const width = mapConfigRef.current?.width || 1200;
      const height = mapConfigRef.current?.height || 800;
      x = Math.max(0, Math.min(width, x)); y = Math.max(0, Math.min(height, y));
      moveToken(token.id, x, y);
      const updated = tokensRef.current.map((item) => item.id === token.id ? { ...item, x, y } : item);
      if (isConnected) broadcastTokenMove(updated, character.name);
    }
    if (proposal.monsterAttack) await executeAiMonsterAttackRef.current?.(proposal.monsterAttack);
    showNotification('Ações aprovadas aplicadas. Confira o registro do combate.');
  }, [addMonsterCombatant, moveToken, isConnected, broadcastTokenMove, character.name, showNotification]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <Scroll className="w-10 h-10 animate-bounce text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" aria-hidden="true" />
          <p className="font-serif text-sm tracking-wider" role="status" aria-live="polite">Invocando ArcanaSheet...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={login}
        onSignup={signup}
        onGoogleLogin={loginWithGoogle}
        onResetPassword={resetPassword}
        isFirebaseConfigured={isFirebaseReady}
        error={authError}
        loading={authLoading}
        clearError={clearError}
      />
    );
  }

  return (
    <div className={`min-h-screen pb-28 pt-3 px-3 sm:px-6 max-w-6xl mx-auto flex flex-col font-sans theme-${currentTheme}`}>
      {/* Notificação Flutuante (Toast) com a11y */}
      {notification && (
        <div role="alert" aria-live="assertive" className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 border border-amber-300 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={16} aria-hidden="true" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Navegação Superior */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        encounter={encounter}
        isMultiplayerConnected={isConnected}
        roomCode={roomCode}
        peersCount={connectedPeers.length}
        connectedPeers={connectedPeers}
        isHost={isHost}
        isPinnedOnlineList={isOnlineListPinned}
        onTogglePinOnlineList={handleTogglePinOnlineList}
        isSocialOpen={isSocialSidebarOpen}
        onToggleSocial={handleToggleSocialSidebar}
        onlineUsersCount={onlineUsers.filter((u) => u.userId !== (user?.uid || 'local_user')).length}
        friendsCount={friends.length}
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
        onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        onOpenCampaigns={() => setIsCampaignModalOpen(true)}
        onOpenAiDm={() => setIsAiDmOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}
        beginnerMode={beginnerMode}
        onToggleBeginnerMode={() => setBeginnerMode((value) => !value)}
        onOpenBeginnerGuide={() => setIsBeginnerGuideOpen(true)}
        userName={character.name || user?.displayName || user?.email || null}
        onLogout={handleLogout}
      />

      {pendingAiAction && <AiActionReviewModal proposal={pendingAiAction} onApprove={handleApproveAiActions} onReject={() => { setPendingAiAction(null); showNotification('Ações mecânicas da IA rejeitadas; a narração foi mantida.'); }} />}

      {beginnerMode && (
        <aside className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm" aria-label="Ajuda do modo iniciante">
          <p className="text-slate-200"><strong className="text-amber-300">Modo iniciante:</strong> {currentMode === 'player' ? 'crie sua ficha, acompanhe seus PV e use os dados para fazer testes.' : currentMode === 'dm' ? 'importe os heróis, adicione criaturas e avance os turnos pelo painel de combate.' : 'escolha um cenário, posicione os personagens e acompanhe a aventura no mapa.'}</p>
          <button type="button" onClick={() => setIsBeginnerGuideOpen(true)} className="min-h-10 rounded-lg bg-amber-500 px-3 font-bold text-slate-950">Abrir tutorial</button>
        </aside>
      )}

      {/* MODO 1: FICHA DE PERSONAGEM (JOGADOR) */}
      {currentMode === 'player' && (
        <PlayerSheetPage
          character={character}
          beginnerMode={beginnerMode}
          updateCharacter={updateCharacter}
          updateAbility={updateAbility}
          cycleSkillProficiency={cycleSkillProficiency}
          applyDamage={applyDamage}
          applyHealing={applyHealing}
          setTempHp={setTempHp}
          toggleDeathSaveSuccess={toggleDeathSaveSuccess}
          toggleDeathSaveFailure={toggleDeathSaveFailure}
          handleShortRest={handleShortRest}
          handleLongRest={handleLongRest}
          handleRollD20={handleRollD20}
          handleRollFormula={(formula, label) => handleRollFormula(formula, label || '')}
          handleToggleCondition={handleToggleCondition}
          handleClearConditions={handleClearConditions}
          addResource={addResource}
          updateResource={updateResource}
          deleteResource={deleteResource}
          consumeResourceCharge={(id, delta) => consumeResourceCharge(id, delta ?? 1)}
          addAttack={addAttack}
          deleteAttack={deleteAttack}
          toggleSpellSlotUsed={toggleSpellSlotUsed}
          updateSpellSlotMax={updateSpellSlotMax}
          addSpell={addSpell}
          updateSpell={updateSpell}
          deleteSpell={deleteSpell}
          handleCastSpell={handleCastSpell}
          addInventoryItem={addInventoryItem}
          updateInventoryItem={updateInventoryItem}
          deleteInventoryItem={deleteInventoryItem}
          addFeature={addFeature}
          deleteFeature={deleteFeature}
          handleRollActionFromHotbar={handleRollActionFromHotbar}
          onOpenCharacterManager={() => setIsManagerOpen(true)}
          onOpenLevelUp={() => setIsLevelUpOpen(true)}
          onOpenWizard={() => setIsWizardOpen(true)}
          onOpenCompendium={() => setIsSpellCompendiumOpen(true)}
          onOpenPrint={() => setIsPrintOpen(true)}
        />
      )}

      {isBeginnerGuideOpen && (
        <BeginnerGuideModal
          onClose={() => setIsBeginnerGuideOpen(false)}
          onCreateHero={() => { setCurrentMode('player'); setIsWizardOpen(true); }}
          onRollTest={() => { setCurrentMode('player'); handleRollD20('Teste de exemplo', 2); }}
          onOpenTable={() => setIsMultiplayerOpen(true)}
          onOpenCombat={() => setCurrentMode('dm')}
          onRollInitiative={() => handleRollD20('Iniciativa', character.initiativeBonus || 0)}
        />
      )}

      {/* MODO 2: PAINEL DO MESTRE (DM SCREEN) */}
      {currentMode === 'dm' && (
        <Suspense fallback={<PageFallback />}>
          <DmScreenPage
            encounter={encounter}
            charactersList={charactersList}
            onStartEncounter={handleStartEncounter}
            onNextTurn={handleNextTurn}
            onPreviousTurn={previousTurn}
            onRollAllMonsters={rollAllMonstersInitiative}
            onSortInitiative={sortCombatantsByInitiative}
            onImportPlayers={importPlayerCharacters}
            onResetEncounter={resetEncounter}
            onHpDelta={handleHpDelta}
            onUndoLastHpChange={handleUndoLastHpChange}
            onToggleCondition={handleToggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={handleRemoveCombatant}
            onAddMonster={addMonsterCombatant}
            onAddCustomCombatant={addCustomCombatant}
            onRollMonsterAttack={(monName, actName, bonus) =>
              handleRollD20(`${monName}: ${actName}`, bonus)
            }
            onRollMonsterDamage={(monName, actName, formula) =>
              handleRollFormula(formula, `${monName}: ${actName}`)
            }
            onAddTokenToMap={handleAddTokenFromMonster}
            onAddCoinsToCharacter={handleAddCoinsToCharacter}
            onAddToSharedLoot={handleAddToSharedLoot}
            onSaveNpcToJournal={handleSaveNpcToJournal}
            onOpenAiDm={() => setIsAiDmOpen(true)}
          />
        </Suspense>
      )}

      {/* MODO 3: MESA VIRTUAL ONLINE COMPLETA (MODELO FANTASY GROUNDS) */}
      {currentMode === 'vtt' && (
        <Suspense fallback={<PageFallback />}>
          <VttSessionPage
            character={character}
            charactersList={charactersList}
            encounter={encounter}
            mapConfig={mapConfig}
            tokens={tokens}
            selectedTokenId={selectedTokenId}
            zoom={zoom}
            pan={pan}
            activeTool={activeTool}
            chatLog={chatLog}
            isHost={isHost}
            isConnected={isConnected}
            connectedPeers={connectedPeers}
            isAiResponding={isAiResponding}
            onSelectToken={setSelectedTokenId}
            onMoveToken={handleMoveToken}
            onSetZoom={setZoom}
            onSetPan={setPan}
            onSetActiveTool={setActiveTool}
            onUpdateMapConfig={handleUpdateMapConfig}
            onSelectMapPreset={handleSelectMapPreset}
            onUploadMap={handleUploadCustomMap}
            onAddFogShape={handleAddFogShape}
            onResetFog={handleResetFog}
            onRevealAllFog={handleRevealAllFog}
            onUpdateToken={handleUpdateToken}
            onRemoveToken={handleRemoveToken}
            onAddToken={handleAddToken}
            onApplyCharacterAvatar={(dataUrl) => updateCharacter({ avatarUrl: dataUrl } as any)}
            onSendMessage={handleUserChatMessage}
            onRollDie={handleRollDie}
            onRollFormula={(formula, label) => handleRollFormula(formula, label || '')}
            onRollD20={handleRollD20}
            onStartEncounter={handleStartEncounter}
            onNextTurn={handleNextTurn}
            onPreviousTurn={previousTurn}
            onSortInitiative={sortCombatantsByInitiative}
            onResetEncounter={resetEncounter}
            onHpDelta={handleHpDelta}
            onToggleCondition={handleToggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={handleRemoveCombatant}
            onRollMonsterAttack={(monName, actName, bonus) =>
              handleRollD20(`${monName}: ${actName}`, bonus)
            }
            onRollMonsterDamage={(monName, actName, formula) =>
              handleRollFormula(formula, `${monName}: ${actName}`)
            }
            onAiMonsterAttack={handleTriggerAiMonsterTurn}
            onOpenMultiplayerModal={() => setIsMultiplayerOpen(true)}
            onOpenAiDmModal={() => setIsAiDmOpen(true)}
            onOpenCompendium={() => setIsSpellCompendiumOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onOpenCharacterSheet={() => setCurrentMode('player')}
            onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}
            onOpenEndSessionModal={() => setIsEndSessionOpen(true)}
            onStartScenario={handleStartSoloAdventureOnMap}
            onCollectLoot={handleCollectLoot}
            onUpdateCharacter={updateCharacter}
          />
        </Suspense>
      )}

      {/* Barra de Rolagem de Dados Fixa no Rodapé (oculta no VTT pois possui sua própria doca) */}
      {currentMode !== 'vtt' && (
        <DiceRollerBar
        advantageMode={advantageMode}
        setAdvantageMode={setAdvantageMode}
        lastRoll={lastRoll}
        onRollDie={handleRollDie}
        onRollFormula={(formula, label) => handleRollFormula(formula, label)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        rollCount={diceRolls.length}
        isDiceAnimationEnabled={isDiceAnimationEnabled}
        onToggleDiceAnimation={toggleDiceAnimation}
        onReplayAnimation={(roll) => setActiveRollAnimation(roll)}
        isSecretRoll={isSecretRoll}
        onToggleSecretRoll={() => {
          setIsSecretRoll((prev) => {
            const next = !prev;
            showNotification(next ? '🤫 Rolagem Oculta ATIVA: seus dados não serão vistos pelos jogadores!' : 'Rolagem Normal ATIVA: visível para todos');
            return next;
          });
        }}
        activeConditions={character.activeConditions}
      />
      )}

      {/* Container Central de Modais e Diálogos */}
      <AppModals
        character={character}
        user={user}
        showNotification={showNotification}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        diceRolls={diceRolls}
        onClearRolls={() => {
          setDiceRolls([]);
          setLastRoll(null);
        }}
        isManagerOpen={isManagerOpen}
        setIsManagerOpen={setIsManagerOpen}
        charactersList={charactersList}
        activeId={activeId}
        onSelectCharacter={(id) => {
          setActiveId(id);
          setIsManagerOpen(false);
          showNotification('Ficha alternada com sucesso!');
        }}
        onCreateCharacter={(name) => {
          createNewCharacter(name);
          setIsManagerOpen(false);
          showNotification('Nova ficha criada!');
        }}
        onDeleteCharacter={() => {
          deleteActiveCharacter();
          showNotification('Ficha removida.');
        }}
        onImportCharacter={(json) => {
          const ok = importCharacter(json);
          if (ok) {
            setIsManagerOpen(false);
            showNotification('Ficha importada com sucesso!');
          }
          return ok;
        }}
        onExportCharacter={exportActiveCharacter}
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        onCharacterCreated={(newChar) => {
          addCreatedCharacter(newChar);
          showNotification(
            `Herói "${newChar.name}" (${newChar.race} ${newChar.characterClass}) criado com sucesso!`
          );
        }}
        isMultiplayerOpen={isMultiplayerOpen}
        setIsMultiplayerOpen={setIsMultiplayerOpen}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isHost={isHost}
        roomCode={roomCode}
        connectedPeers={connectedPeers}
        chatLog={chatLog}
        isAiResponding={isAiResponding}
        onCreateRoom={(name, customCode) => {
          const classAvatar = SRD_CLASSES.find((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase())?.avatarUrl;
          return createRoom(name, customCode, character.avatarUrl || classAvatar);
        }}
        onCreateAiRoom={handleCreateAiRoom}
        onJoinRoom={(code, name) => {
          const classAvatar = SRD_CLASSES.find((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase())?.avatarUrl;
          const charData = {
            characterClass: character.characterClass,
            currentHp: character.currentHp,
            maxHp: character.maxHp,
            armorClass: character.armorClass,
            dexScore: character.abilities?.dex?.score,
            initiativeBonus: character.initiativeBonus,
          };
          return joinRoom(code, name, character.avatarUrl || classAvatar, charData);
        }}
        onDisconnect={disconnect}
        onSendMessage={handleUserChatMessage}
        onOpenTabletop={() => setCurrentMode('vtt')}
        isEndSessionOpen={isEndSessionOpen}
        setIsEndSessionOpen={setIsEndSessionOpen}
        onStartNewAdventure={handleStartNewAdventure}
        onClearMonstersAndCombat={handleClearMonstersAndCombat}
        onDisconnectAndExit={handleDisconnectAndExit}
        isOnlineListPinned={isOnlineListPinned}
        setIsOnlineListPinned={setIsOnlineListPinned}
        isSocialSidebarOpen={isSocialSidebarOpen}
        onToggleSocialSidebar={handleToggleSocialSidebar}
        onlineUsers={onlineUsers}
        friends={friends}
        directMessages={directMessages}
        isUsingFallback={isUsingFallback}
        onSendDirectMessage={handleSendDirectMessage}
        onMarkMessagesAsRead={handleMarkDirectMessagesAsRead}
        onAddFriend={handleAddFriend}
        onRemoveFriend={handleRemoveFriend}
        onSendGameInvite={async (friendId, fName, rCode) => {
          const res = await handleSendGameInvite(friendId, fName, rCode);
          if (res.ok) {
            showNotification(`⚔️ Convite para a mesa ${rCode} enviado para ${fName}!`);
          }
          return res;
        }}
        onCreateAndInvite={handleCreateRoomAndInvite}
        onJoinFromSocial={async (code) => {
          const classAvatar = SRD_CLASSES.find((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase())?.avatarUrl;
          const charData = {
            characterClass: character.characterClass,
            currentHp: character.currentHp,
            maxHp: character.maxHp,
            armorClass: character.armorClass,
            dexScore: character.abilities?.dex?.score,
            initiativeBonus: character.initiativeBonus,
          };
          const ok = await joinRoom(code, character.name || 'Jogador', character.avatarUrl || classAvatar, charData);
          if (ok) {
            setCurrentMode('vtt');
          }
        }}
        pendingInvites={pendingInvites}
        onAcceptInvite={handleAcceptGameInvite}
        onDeclineInvite={handleDeclineInvite}
        activeRollAnimation={activeRollAnimation}
        onCloseDiceAnimation={handleCloseDiceAnimation}
        onRerollAnimation={handleReroll}
        isPrintOpen={isPrintOpen}
        setIsPrintOpen={setIsPrintOpen}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        sendChatMessage={sendChatMessage}
        isLevelUpOpen={isLevelUpOpen}
        setIsLevelUpOpen={setIsLevelUpOpen}
        updateCharacter={updateCharacter}
        isShortRestOpen={isShortRestOpen}
        setIsShortRestOpen={setIsShortRestOpen}
        spendHitDie={spendHitDie}
        completeShortRest={completeShortRest}
        isCampaignModalOpen={isCampaignModalOpen}
        setIsCampaignModalOpen={setIsCampaignModalOpen}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={handleSetActiveCampaignId}
        onImportPartyToCombat={handleImportPartyToCombat}
        isHandoutModalOpen={isHandoutModalOpen}
        setIsHandoutModalOpen={setIsHandoutModalOpen}
        activeHandout={activeHandout}
        isHandoutViewerOpen={isHandoutViewerOpen}
        setIsHandoutViewerOpen={setIsHandoutViewerOpen}
        onBroadcastHandout={handleBroadcastHandout}
        onSaveHandoutToJournal={handleSaveHandoutToJournal}
        isMusicPlayerOpen={isMusicPlayerOpen}
        setIsMusicPlayerOpen={setIsMusicPlayerOpen}
        isAiDmOpen={isAiDmOpen}
        setIsAiDmOpen={setIsAiDmOpen}
        onSaveNpcToJournal={handleSaveNpcToJournal}
        onOpenVttWithAdventure={handleOpenVttFromAiDm}
        onStartSoloAdventureOnMap={handleStartSoloAdventureOnMap}
        isBestiaryOpen={isBestiaryOpen}
        setIsBestiaryOpen={setIsBestiaryOpen}
        onAddMonsterCombatant={addMonsterCombatant}
        onRollMonsterAttack={(monName, actName, bonus) =>
          handleRollD20(`${monName}: ${actName}`, bonus)
        }
        onRollMonsterDamage={(monName, actName, formula) =>
          handleRollFormula(formula, `${monName}: ${actName}`)
        }
        onAddTokenFromMonster={handleAddTokenFromMonster}
        isSpellCompendiumOpen={isSpellCompendiumOpen}
        setIsSpellCompendiumOpen={setIsSpellCompendiumOpen}
        onAddSpell={addSpell}
      />

      {/* Rodapé Institucional & Aviso Legal SRD 5.1 */}
      <footer className="mt-auto pt-8 pb-4 text-center text-xs text-slate-500 font-sans border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
        <p>ArcanaSheet • VTT & Ficha de RPG D&D 5e</p>
        <button
          type="button"
          onClick={() => setIsLegalModalOpen(true)}
          className="text-amber-500/80 hover:text-amber-300 underline underline-offset-2 transition cursor-pointer"
        >
          Aviso Legal & Licença SRD 5.1 (WotC / CC-BY-4.0)
        </button>
      </footer>

      <LegalNoticeModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

    </div>
  );
}

export default App;
