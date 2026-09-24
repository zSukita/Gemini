import { useState, useCallback, useEffect, useRef } from 'react';
import { useCharacter } from './hooks/useCharacter';
import { useEncounter } from './hooks/useEncounter';
import { useBattleMap } from './hooks/useBattleMap';
import { useMultiplayer } from './hooks/useMultiplayer';

import type { AdvantageMode, DiceRollResult, Spell, ThemeId, CampaignNpc } from './types/dnd5e';
import type { FogShape, MapToken, BattleMapConfig } from './types/vtt';
import { rollD20, rollDie, rollFormula } from './utils/diceRoller';
import { broadcastSyncMessage } from './utils/syncChannel';

import { Navbar, type AppMode } from './components/Navbar';
import { Header } from './components/Header';
import { CombatStats } from './components/CombatStats';
import { AbilityScores } from './components/AbilityScores';
import { SkillsList } from './components/SkillsList';
import { AttacksSection } from './components/AttacksSection';
import { Spellbook } from './components/Spellbook';
import { Inventory } from './components/Inventory';
import { FeaturesAndTraits } from './components/FeaturesAndTraits';
import { DmScreen } from './components/dm/DmScreen';
import { TabletopSessionView } from './components/vtt/TabletopSessionView';
import { BestiaryModal } from './components/dm/BestiaryModal';
import { SpellCompendiumModal } from './components/SpellCompendiumModal';
import { DiceRollerBar } from './components/DiceRollerBar';
import { RollHistoryModal } from './components/RollHistoryModal';
import { CharacterManagerModal } from './components/CharacterManagerModal';
import { CharacterWizardModal } from './components/CharacterWizardModal';
import { MultiplayerModal } from './components/multiplayer/MultiplayerModal';
import { FloatingOnlineList } from './components/multiplayer/FloatingOnlineList';
import { SocialSidebar } from './components/social/SocialSidebar';
import { GameInviteModal } from './components/social/GameInviteModal';
import { useSocialPresence } from './hooks/useSocialPresence';
import {
  type GameInvite,
  type DirectMessage,
  subscribeToDirectMessages,
  sendDirectMessage,
  markDirectMessagesAsRead,
} from './firebase/presenceAndFriends';
import { DiceRollAnimation } from './components/DiceRollAnimation';
import { PrintSheetModal } from './components/PrintSheetModal';
import { SessionChatModal } from './components/SessionChatModal';
import { LevelUpModal } from './components/LevelUpModal';
import { JournalTab } from './components/JournalTab';
import { ConditionsTracker } from './components/ConditionsTracker';
import { QuickActionBar } from './components/QuickActionBar';
import { MusicPlayerModal } from './components/dm/MusicPlayerModal';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { ShortRestModal } from './components/ShortRestModal';
import { CharacterResources } from './components/CharacterResources';
import { CampaignModal } from './components/CampaignModal';
import { HandoutModal } from './components/dm/HandoutModal';
import { HandoutViewerModal } from './components/HandoutViewerModal';
import { AiDungeonMasterModal } from './components/ai/AiDungeonMasterModal';
import { EndSessionModal } from './components/vtt/EndSessionModal';
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

import { 
  Shield, 
  Dices, 
  BookOpen, 
  Backpack, 
  Sparkles,
  Scroll
} from 'lucide-react';

type TabType = 'combat' | 'skills' | 'spells' | 'inventory' | 'features' | 'journal';

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
    useResourceCharge,
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
  } = useEncounter();

  // Estados de interface
  const [currentMode, setCurrentMode] = useState<AppMode>('player');
  const [activeTab, setActiveTab] = useState<TabType>('combat');
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isEndSessionOpen, setIsEndSessionOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isHandoutModalOpen, setIsHandoutModalOpen] = useState(false);
  const [activeHandout, setActiveHandout] = useState<CampaignHandout | null>(null);
  const [isHandoutViewerOpen, setIsHandoutViewerOpen] = useState(false);
  const [isSecretRoll, setIsSecretRoll] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('arcanasheet_active_campaign_id') || null;
    } catch {
      return null;
    }
  });
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isAiDmOpen, setIsAiDmOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isSpellCompendiumOpen, setIsSpellCompendiumOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem('arcanasheet_theme') as ThemeId) || 'default';
    } catch {
      return 'default';
    }
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [isOnlineListPinned, setIsOnlineListPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arcanasheet_online_list_pinned') === 'true';
    } catch {
      return false;
    }
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
  }, [activeCampaignId]);

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
  }, [isAuthenticated, isCloudLoaded, charactersList, user?.uid]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  }, []);

  const handleTogglePinOnlineList = useCallback(() => {
    setIsOnlineListPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('arcanasheet_online_list_pinned', String(next));
      } catch {
        // ignore
      }
      showNotification(`Lista de pessoas online: ${next ? 'Fixada na tela' : 'Desafixada'}`);
      return next;
    });
  }, [showNotification]);

  const [isSocialSidebarOpen, setIsSocialSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('arcanasheet_social_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
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
  const triggerAiDmRef = useRef<((promptText: string) => Promise<void>) | undefined>(undefined);
  const executeAiMonsterAttackRef = useRef<((attack: MonsterAttackAction) => void) | undefined>(undefined);
  const handleTriggerAiMonsterTurnRef = useRef<((combatant?: Combatant) => void) | undefined>(undefined);

  const setTokensRef = useRef<React.Dispatch<React.SetStateAction<MapToken[]>> | null>(null);
  const setMapConfigRef = useRef<React.Dispatch<React.SetStateAction<BattleMapConfig>> | null>(null);
  const mapConfigRef = useRef<BattleMapConfig | null>(null);
  const tokensRef = useRef<MapToken[]>([]);
  const chatLogRef = useRef<any[]>([]);
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
    onRequestRoomState: (requesterPeerId) => {
      if (isHost && mapConfigRef.current) {
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
    (id: string, delta: number) => {
      applyCombatantHpDelta(id, delta);

      const combatant = encounterRef.current?.combatants.find((c) => c.id === id);
      if (combatant) {
        const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.currentHp + delta));

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
    [applyCombatantHpDelta, isConnected, broadcastTokenMove, character.name, setTokens]
  );

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

        const aiReply = await sendToAiDungeonMaster(
          promptText,
          recentTurns,
          character,
          {
            customInstructions:
              'Você é o Mestre Supremo em uma mesa multiplayer online ao vivo de D&D 5e. Narre em português do Brasil com grande riqueza sensorial e desafie o grupo.',
          }
        );

        sendChatMessage({
          id: aiReply.id,
          text: aiReply.content,
          senderName: '✨ Mestre Supremo (IA)',
          type: 'AI_DM',
          suggestedActions: aiReply.suggestedActions,
          requestedRoll: aiReply.requestedRoll,
          monsterAttack: aiReply.monsterAttack,
          monsterSpawns: aiReply.monsterSpawns,
          mapMoves: aiReply.mapMoves,
          lootReward: aiReply.lootReward,
        });

        // 1. Inserir novos monstros no encontro e tokens no mapa (SPAWN)
        if (aiReply.monsterSpawns && aiReply.monsterSpawns.length > 0) {
          aiReply.monsterSpawns.forEach((spawn) => {
            // Se o monstro exato com count=1 já existe no encontro ativo, evita duplicações desnecessárias
            const alreadyExists = spawn.count <= 1 && encounterRef.current?.combatants.some((c) => {
              return c.name.toLowerCase() === spawn.monsterName.toLowerCase();
            });

            if (alreadyExists) {
              return;
            }

            const foundMon = SRD_MONSTERS.find(
              (m) =>
                m.name.toLowerCase().includes(spawn.monsterName.toLowerCase()) ||
                spawn.monsterName.toLowerCase().includes(m.name.toLowerCase())
            );

            if (foundMon) {
              addMonsterCombatant(foundMon, spawn.count);
            } else {
              const fallbackMon: Monster = {
                id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: spawn.monsterName,
                size: 'Médio',
                type: 'Monstruosidade',
                alignment: 'Hostil',
                armorClass: 13,
                hitPoints: 22,
                hitDice: '3d8+6',
                speed: '9m',
                abilities: {
                  str: 14,
                  dex: 12,
                  con: 14,
                  int: 8,
                  wis: 10,
                  cha: 8,
                },
                challengeRating: '1',
                xp: 200,
                senses: 'Visão no Escuro 18m',
                languages: 'Comum',
                actions: [
                  {
                    name: 'Ataque Selvagem',
                    type: 'melee',
                    description: 'Ataque corpo-a-corpo: +4 para acertar, dano 1d8+2 cortante.',
                    attackBonus: 4,
                    damageFormula: '1d8+2',
                  },
                ],
              };
              addMonsterCombatant(fallbackMon, spawn.count);
            }

            sendChatMessage(
              {
                text: `⚠️ **Reforços Inimigos:** ${spawn.count}x **${spawn.monsterName}** entraram no combate e foram adicionados ao mapa tático!`,
                senderName: '✨ Mestre Supremo (IA)',
                type: 'AI_DM',
              },
              '✨ Mestre Supremo (IA)'
            );
          });
        }

        // 2. Mover tokens de monstros ou jogadores no mapa (MOVER)
        if (aiReply.mapMoves && aiReply.mapMoves.length > 0) {
          aiReply.mapMoves.forEach((move) => {
            const moveNameBase = move.tokenName.toLowerCase().replace(/\s*\d+$/, '').trim();
            const tokenToMove = tokensRef.current.find((t) => {
              const tBase = t.name.toLowerCase().replace(/\s*\d+$/, '').trim();
              return (
                t.name.toLowerCase() === move.tokenName.toLowerCase() ||
                t.name.toLowerCase().includes(move.tokenName.toLowerCase()) ||
                move.tokenName.toLowerCase().includes(t.name.toLowerCase()) ||
                tBase === moveNameBase
              );
            });

            if (tokenToMove) {
              const squares = move.distanceSquares || 4;
              const dist = squares * 50;
              const act = move.actionOrTarget.toLowerCase();

              const mapW = mapConfigRef.current?.width || 1200;
              const mapH = mapConfigRef.current?.height || 800;

              // Procura se a ação cita algum outro combatente (alvo de aproximação ou combate)
              const otherTargetToken = tokensRef.current.find(
                (other) =>
                  other.id !== tokenToMove.id &&
                  act.includes(other.name.toLowerCase())
              );

              let newX = tokenToMove.x;
              let newY = tokenToMove.y;

              if (otherTargetToken) {
                // Move em direção ao token alvo, mantendo 1 casa (50px) de distância
                const dx = otherTargetToken.x - tokenToMove.x;
                const dy = otherTargetToken.y - tokenToMove.y;
                const currentDist = Math.sqrt(dx * dx + dy * dy);

                if (currentDist > 60) {
                  const moveAmount = Math.min(dist, currentDist - 50);
                  const ratio = moveAmount / currentDist;
                  newX = Math.round(tokenToMove.x + dx * ratio);
                  newY = Math.round(tokenToMove.y + dy * ratio);
                }
              } else if (act.includes('recua') || act.includes('trás') || act.includes('afasta')) {
                // Recua para longe do centro
                newY = tokenToMove.y < mapH / 2 ? Math.max(50, newY - dist) : Math.min(mapH - 60, newY + dist);
              } else if (act.includes('norte') || act.includes('cima')) {
                newY = Math.max(50, newY - dist);
              } else if (act.includes('sul') || act.includes('baixo')) {
                newY = Math.min(mapH - 60, newY + dist);
              } else if (act.includes('esquerda') || act.includes('oeste')) {
                newX = Math.max(50, newX - dist);
              } else if (act.includes('direita') || act.includes('leste')) {
                newX = Math.min(mapW - 60, newX + dist);
              } else if (act.includes('avança') || act.includes('investe') || act.includes('frente') || act.includes('aproxima')) {
                // Avança em direção ao time oposto mais próximo
                const opponentToken = tokensRef.current.find(
                  (e) => e.type !== tokenToMove.type && (e.currentHp ?? 1) > 0
                );
                if (opponentToken) {
                  const dx = opponentToken.x - tokenToMove.x;
                  const dy = opponentToken.y - tokenToMove.y;
                  const currentDist = Math.sqrt(dx * dx + dy * dy);
                  if (currentDist > 60) {
                    const moveAmount = Math.min(dist, currentDist - 50);
                    const ratio = moveAmount / currentDist;
                    newX = Math.round(tokenToMove.x + dx * ratio);
                    newY = Math.round(tokenToMove.y + dy * ratio);
                  }
                } else {
                  newX = tokenToMove.x < mapW / 2 ? tokenToMove.x + Math.floor(dist * 0.7) : tokenToMove.x - Math.floor(dist * 0.7);
                  newY = tokenToMove.y < mapH / 2 ? tokenToMove.y + Math.floor(dist * 0.7) : tokenToMove.y - Math.floor(dist * 0.7);
                }
              }

              newX = Math.max(50, Math.min(mapW - 60, newX));
              newY = Math.max(50, Math.min(mapH - 60, newY));

              moveToken(tokenToMove.id, newX, newY);

              if (isConnected) {
                const updated = tokensRef.current.map((t) =>
                  t.id === tokenToMove.id ? { ...t, x: newX, y: newY } : t
                );
                broadcastTokenMove(updated, character.name);
              }

              sendChatMessage(
                {
                  text: `👣 **Movimentação:** **${tokenToMove.name}** deslocou-se ${squares} casas (${move.actionOrTarget}) no mapa!`,
                  senderName: '✨ Mestre Supremo (IA)',
                  type: 'AI_DM',
                },
                '✨ Mestre Supremo (IA)'
              );
            }
          });
        }

        // 3. Executar ataque mecânico do monstro
        if (aiReply.monsterAttack) {
          executeAiMonsterAttackRef.current?.(aiReply.monsterAttack);
        }

        // 4. Aplicar derrota mecânica de monstros (DERROTAR_MONSTRO ou heurística de abate narrativo)
        const defeatedNames = new Set<string>();
        if (aiReply.defeatedMonsters && aiReply.defeatedMonsters.length > 0) {
          aiReply.defeatedMonsters.forEach((name) => defeatedNames.add(name.toLowerCase()));
        }

        const narrativeText = aiReply.content.toLowerCase();
        const killKeywords = [
          'decapita',
          'decapitada',
          'decapitado',
          'golpe de misericórdia',
          'misericordia',
          'cai morto',
          'cai morta',
          'cai sem vida',
          'sucumbe ao ferimento',
          'sucumbe ao golpe',
          'sucumbiu',
          'tomba sem vida',
          'jaz sem vida',
          'está morto',
          'está morta',
          'foi abatido',
          'foi abatida',
          'derrotado',
          'derrotada',
          'corpo inerte',
          'morte certa',
        ];
        const narrativeHasKill = killKeywords.some((kw) => narrativeText.includes(kw));

        const activeMonsters = (encounterRef.current?.combatants || []).filter(
          (c) => (c.type === 'monster' || c.type === 'npc') && c.currentHp > 0
        );

        activeMonsters.forEach((c) => {
          const cNameLower = c.name.toLowerCase();
          const cBase = cNameLower.replace(/\s*\d+$/, '').trim();

          const explicitlyDefeated = Array.from(defeatedNames).some(
            (dn) => cNameLower.includes(dn) || dn.includes(cNameLower) || (cBase.length >= 3 && (cBase.includes(dn) || dn.includes(cBase)))
          );

          const narrativelyDefeated =
            narrativeHasKill &&
            (narrativeText.includes(cNameLower) || (cBase.length >= 3 && narrativeText.includes(cBase)));

          if (explicitlyDefeated || narrativelyDefeated) {
            handleHpDelta(c.id, -c.currentHp);
            sendChatMessage(
              {
                text: `💀 **Derrota:** **${c.name}** foi abatido(a) e seus Pontos de Vida foram zerados (0 PV)!`,
                senderName: '✨ Mestre Supremo (IA)',
                type: 'AI_DM',
              },
              '✨ Mestre Supremo (IA)'
            );
          }
        });

        // 5. Aplicar dano mecânico a monstros (DANO_MONSTRO)
        if (aiReply.monsterDamage && aiReply.monsterDamage.length > 0) {
          aiReply.monsterDamage.forEach((dmg) => {
            const dmgNameLower = dmg.monsterName.toLowerCase();
            const targetCombatant = activeMonsters.find((c) => {
              const cNameLower = c.name.toLowerCase();
              const cBase = cNameLower.replace(/\s*\d+$/, '').trim();
              return cNameLower.includes(dmgNameLower) || dmgNameLower.includes(cNameLower) || (cBase.length >= 3 && cBase.includes(dmgNameLower));
            });

            if (targetCombatant && targetCombatant.currentHp > 0) {
              const effectiveDmg = Math.min(targetCombatant.currentHp, dmg.damage);
              handleHpDelta(targetCombatant.id, -effectiveDmg);
            }
          });
        }
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

      const willHandleAi = isAiCommand && isAiReady;

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
    [sendChatMessage, character.name, triggerAiDm, addRollResult, isConnected, broadcastDiceRoll]
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
      sendChatMessage,
      showNotification,
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
    [character.id, character.name, setChatLog, showNotification]
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
      setChatLog,
      showNotification,
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
  }, [clearChatLog, resetEncounter, setTokens, showNotification]);

  const handleClearMonstersAndCombat = useCallback(() => {
    resetEncounter();
    setTokens((prev) => prev.filter((t) => t.type === 'player'));
    setIsEndSessionOpen(false);
    showNotification('🧹 Monstros e combate limpos! O mapa atual foi mantido.');
  }, [resetEncounter, setTokens, showNotification]);

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
  }, [isConnected, disconnect, clearChatLog, resetEncounter, setTokens, showNotification]);

  // Hook de Presença Social, Quem Está Online e Lista de Amigos
  const {
    onlineUsers,
    friends,
    pendingInvites,
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
        const ok = await joinRoom(targetRoomCode, character.name || 'Jogador', effectiveAvatar);
        if (ok) {
          setCurrentMode('vtt');
          showNotification(`🎉 Você entrou na mesa ${targetRoomCode}!`);
        } else {
          showNotification(`⚠️ Não foi possível entrar na sala ${targetRoomCode}. Verifique o código.`);
        }
      }
    },
    [handleAcceptInvite, joinRoom, character.name, character.characterClass, character.avatarUrl, showNotification]
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
  const handleRollD20 = (label: string, modifier: number) => {
    const res = rollD20(label, modifier, advantageMode);
    if (isSecretRoll) {
      res.isSecret = true;
    }
    addRollResult(res);

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

    // Reset para modo normal após rolar com vantagem/desvantagem
    if (advantageMode !== 'normal') {
      setAdvantageMode('normal');
    }
  };

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
  const handleRollDie = (sides: number) => {
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
  };

  // Rolar fórmula personalizada ou dano
  const handleRollFormula = (formula: string, label: string, isCrit = false) => {
    const res = rollFormula(formula, label, isCrit);
    if (isSecretRoll) {
      res.isSecret = true;
    }
    addRollResult(res);

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
  };

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
    (attack: MonsterAttackAction) => {
      // 1. Notificação de início do ataque
      showNotification(`🐉 ${attack.monsterName} ataca com ${attack.attackName}!`);

      // 2. Rolagem de Ataque com d20 único (aciona animação 3D e broadcast P2P)
      const targetName = attack.target || character.name || 'o Herói';
      const targetAc = character.armorClass || 10;
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

      // 3. Intervalo de suspense (1.6s) para os jogadores conferirem se acertou a CA antes do dano
      setTimeout(() => {
        let finalDamage = 0;
        let damageRoll: DiceRollResult | null = null;

        if (isHit) {
          const damageLabel = `${attack.monsterName}: Dano ${attack.attackName}`;
          damageRoll = rollFormula(attack.damageFormula || '1d6', damageLabel);
          finalDamage = isNat20 ? damageRoll.total * 2 : damageRoll.total;

          // Se o herói local for o alvo, deduz vida na ficha e no mapa
          const isLocalTarget = !attack.target || attack.target.toLowerCase() === (character.name || '').toLowerCase();
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

        // 4. Notificação e aviso para passar o turno
        showNotification(`⚔️ ${attack.monsterName} finalizou o ataque! Você já pode passar o turno no combate.`);
      }, 1600);
    },
    [character, applyDamage, addRollResult, isConnected, broadcastDiceRoll, setTokens, sendChatMessage, showNotification]
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

      const attackAction: MonsterAttackAction = {
        monsterName: mon.name,
        attackName: chosenAction.name,
        attackBonus: chosenAction.attackBonus ?? 3,
        damageFormula: chosenAction.damageFormula ?? '1d6+1',
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
    [encounter.combatants, encounter.activeCombatantIndex, executeAiMonsterAttack, sendChatMessage, showNotification]
  );
  handleTriggerAiMonsterTurnRef.current = handleTriggerAiMonsterTurn;

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
    if (spell.level > 0) {
      const slot = character.spellcasting.slots.find((s) => s.level === spell.level);
      if (slot && slot.used < slot.max) {
        toggleSpellSlotUsed(spell.level, slot.used);
        showNotification(`Magia "${spell.name}" conjurada gastando 1 espaço de ${spell.level}º Círculo!`);
      } else {
        showNotification(`Aviso: Nenhum espaço de ${spell.level}º Círculo disponível para "${spell.name}"!`);
      }
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <Scroll className="w-10 h-10 animate-bounce text-amber-400 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" />
          <p className="font-serif text-sm tracking-wider">Invocando ArcanaSheet...</p>
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
      {/* Notificação Flutuante (Toast) */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 border border-amber-300 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={16} />
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
        userName={character.name || user?.displayName || user?.email || null}
        onLogout={handleLogout}
      />

      {/* MODO 1: FICHA DE PERSONAGEM (JOGADOR) */}
      {currentMode === 'player' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <Header
            character={character}
            updateCharacter={updateCharacter}
            onOpenCharacterManager={() => setIsManagerOpen(true)}
            onOpenLevelUp={() => setIsLevelUpOpen(true)}
            onOpenWizard={() => setIsWizardOpen(true)}
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
          />

          {/* Rastreador de Condições & Status Ativos na Ficha */}
          <div className="mb-3">
            <ConditionsTracker
              activeConditions={character.activeConditions || []}
              onToggleCondition={handleToggleCondition}
              onClearConditions={handleClearConditions}
            />
          </div>

          {/* Navegação por Abas da Ficha */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setActiveTab('combat')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'combat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Shield size={14} className={activeTab === 'combat' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Visão Geral & Combate</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Dices size={14} className={activeTab === 'skills' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Perícias (18)</span>
            </button>

            <button
              onClick={() => setActiveTab('spells')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'spells'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'spells' ? 'text-indigo-400' : 'text-slate-500'} />
              <span>Grimório & Magias</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Backpack size={14} className={activeTab === 'inventory' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Inventário & Carga</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'features'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'features' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Talentos & Roleplay</span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'journal'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Scroll size={14} className={activeTab === 'journal' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Diário & Missões</span>
            </button>
          </nav>

          {/* Conteúdo da Aba */}
          <main className="flex-1">
            {activeTab === 'combat' && (
              <div>
                <CombatStats
                  character={character}
                  updateCharacter={updateCharacter}
                  applyDamage={applyDamage}
                  applyHealing={applyHealing}
                  setTempHp={setTempHp}
                  toggleDeathSaveSuccess={toggleDeathSaveSuccess}
                  toggleDeathSaveFailure={toggleDeathSaveFailure}
                  onSpendHitDie={handleShortRest}
                  onRollInitiative={(mod) => handleRollD20('Iniciativa', mod)}
                />

                <div className="mb-4">
                  <CharacterResources
                    resources={character.resources || []}
                    onAddResource={addResource}
                    onUpdateResource={updateResource}
                    onDeleteResource={deleteResource}
                    onUseCharge={useResourceCharge}
                  />
                </div>

                <AttacksSection
                  attacks={character.attacks}
                  onRollAttack={(name, bonus) => handleRollD20(`Ataque: ${name}`, bonus)}
                  onRollDamage={(name, formula) => handleRollFormula(formula, name)}
                  onAddAttack={addAttack}
                  onDeleteAttack={deleteAttack}
                />

                <AbilityScores
                  character={character}
                  updateAbility={updateAbility}
                  onRollCheck={(name, mod) => handleRollD20(name, mod)}
                  onRollSave={(name, mod) => handleRollD20(name, mod)}
                />
              </div>
            )}

            {activeTab === 'skills' && (
              <SkillsList
                character={character}
                onCycleProficiency={cycleSkillProficiency}
                onRollSkill={(name, mod) => handleRollD20(`Perícia: ${name}`, mod)}
              />
            )}

            {activeTab === 'spells' && (
              <Spellbook
                character={character}
                updateCharacter={updateCharacter}
                onToggleSpellSlot={toggleSpellSlotUsed}
                onUpdateSpellSlotMax={updateSpellSlotMax}
                onAddSpell={addSpell}
                onUpdateSpell={updateSpell}
                onDeleteSpell={deleteSpell}
                onCastSpell={handleCastSpell}
              />
            )}

            {activeTab === 'inventory' && (
              <Inventory
                character={character}
                updateCharacter={updateCharacter}
                onAddItem={addInventoryItem}
                onUpdateItem={updateInventoryItem}
                onDeleteItem={deleteInventoryItem}
              />
            )}

            {activeTab === 'features' && (
              <FeaturesAndTraits
                character={character}
                updateCharacter={updateCharacter}
                onAddFeature={addFeature}
                onDeleteFeature={deleteFeature}
              />
            )}

            {activeTab === 'journal' && (
              <JournalTab
                character={character}
                updateCharacter={updateCharacter}
              />
            )}
          </main>
        </div>
      )}

      {/* MODO 2: PAINEL DO MESTRE (DM SCREEN) */}
      {currentMode === 'dm' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <DmScreen
            encounter={encounter}
            charactersList={charactersList}
            onStartEncounter={startEncounter}
            onNextTurn={nextTurn}
            onPreviousTurn={previousTurn}
            onRollAllMonsters={rollAllMonstersInitiative}
            onSortInitiative={sortCombatantsByInitiative}
            onImportPlayers={importPlayerCharacters}
            onResetEncounter={resetEncounter}
            onHpDelta={handleHpDelta}
            onToggleCondition={handleToggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={removeCombatant}
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
        </div>
      )}

      {/* MODO 3: MESA VIRTUAL ONLINE COMPLETA (MODELO FANTASY GROUNDS) */}
      {currentMode === 'vtt' && (
        <div className="flex flex-col flex-1 animate-in fade-in">
          <TabletopSessionView
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
            currentUserName={character.name}
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
            onRollFormula={(formula, label) => handleRollFormula(formula, label)}
            onRollD20={handleRollD20}
            onStartEncounter={startEncounter}
            onNextTurn={nextTurn}
            onPreviousTurn={previousTurn}
            onSortInitiative={sortCombatantsByInitiative}
            onResetEncounter={resetEncounter}
            onHpDelta={handleHpDelta}
            onToggleCondition={handleToggleCombatantCondition}
            onUpdateInitiative={updateCombatantInitiative}
            onRemoveCombatant={removeCombatant}
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
        </div>
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
      />
      )}

      {/* Modal de Histórico de Rolagens */}
      <RollHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        rolls={diceRolls}
        onClearRolls={() => {
          setDiceRolls([]);
          setLastRoll(null);
        }}
      />

      {/* Modal de Gerenciamento de Personagens */}
      <CharacterManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        characters={charactersList}
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
        onOpenWizard={() => setIsWizardOpen(true)}
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
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Assistente Oficial de Criação de Personagens (Wizard) */}
      <CharacterWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCharacterCreated={(newChar) => {
          addCreatedCharacter(newChar);
          showNotification(
            `Herói "${newChar.name}" (${newChar.race} ${newChar.characterClass}) criado com sucesso!`
          );
        }}
      />

      {/* Modal Multiplayer Online P2P */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isHost={isHost}
        roomCode={roomCode}
        connectedPeers={connectedPeers}
        chatLog={chatLog}
        currentUserName={character.name}
        character={character}
        isAiResponding={isAiResponding}
        onCreateRoom={(name, customCode) => {
          const classAvatar = SRD_CLASSES.find((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase())?.avatarUrl;
          return createRoom(name, customCode, character.avatarUrl || classAvatar);
        }}
        onCreateAiRoom={handleCreateAiRoom}
        onJoinRoom={(code, name) => {
          const classAvatar = SRD_CLASSES.find((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase())?.avatarUrl;
          return joinRoom(code, name, character.avatarUrl || classAvatar);
        }}
        onDisconnect={disconnect}
        onSendMessage={handleUserChatMessage}
        onOpenTabletop={() => setCurrentMode('vtt')}
      />

      {/* Modal de Finalizar Mesa / Nova Sessão */}
      <EndSessionModal
        isOpen={isEndSessionOpen}
        onClose={() => setIsEndSessionOpen(false)}
        isConnected={isConnected}
        roomCode={roomCode}
        onStartNewAdventure={handleStartNewAdventure}
        onClearMonstersAndCombat={handleClearMonstersAndCombat}
        onDisconnectAndExit={handleDisconnectAndExit}
      />

      {/* Lista Flutuante de Pessoas Online Fixada na Tela */}
      <FloatingOnlineList
        isVisible={isConnected && isOnlineListPinned}
        roomCode={roomCode}
        connectedPeers={connectedPeers}
        currentUserName={character.name || user?.displayName || undefined}
        isHost={isHost}
        onUnpin={() => setIsOnlineListPinned(false)}
        onOpenModal={() => setIsMultiplayerOpen(true)}
      />

      {/* Barra Lateral Social: Pessoas Online & Amigos (Área Direita da Tela) */}
      <SocialSidebar
        isOpen={isSocialSidebarOpen}
        onToggle={handleToggleSocialSidebar}
        onlineUsers={onlineUsers}
        friends={friends}
        connectedPeers={connectedPeers}
        currentUserId={user?.uid || 'local_user'}
        currentUserName={character.name || user?.displayName || 'Você'}
        currentRoomCode={isConnected ? roomCode : undefined}
        directMessages={directMessages}
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
        onJoinRoom={async (code) => {
          const ok = await joinRoom(code, character.name || 'Jogador', character.avatarUrl);
          if (ok) {
            setCurrentMode('vtt');
          }
        }}
      />

      {/* Modal de Convite de Jogo Recebido */}
      <GameInviteModal
        invites={pendingInvites}
        onAccept={handleAcceptGameInvite}
        onDecline={handleDeclineInvite}
      />

      {/* Animação 3D de Rolagem de Dados Poliédricos */}
      {activeRollAnimation && (
        <DiceRollAnimation
          roll={activeRollAnimation}
          onClose={handleCloseDiceAnimation}
          onReroll={handleReroll}
        />
      )}

      {/* Modal de Impressão e Salvamento em PDF */}
      <PrintSheetModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        character={character}
      />

      {/* Chat Tático e Registro de Sessão com Rolagens Secretas e Mestre IA */}
      <SessionChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatLog={chatLog}
        currentUserName={character.name}
        isHost={isHost}
        character={character}
        onSendMessage={(msg) => {
          sendChatMessage(msg, character.name);
        }}
      />

      {/* Assistente Oficial de Subir de Nível (Level Up Wizard) */}
      <LevelUpModal
        isOpen={isLevelUpOpen}
        onClose={() => setIsLevelUpOpen(false)}
        character={character}
        onApplyLevelUp={(updates) => {
          updateCharacter(updates);
          showNotification(
            `Parabéns! ${character.name} evoluiu para o Nível ${updates.level ?? (character.level + 1)}!`
          );
        }}
      />

      {/* Modal Interativo de Descanso Curto */}
      <ShortRestModal
        isOpen={isShortRestOpen}
        onClose={() => setIsShortRestOpen(false)}
        character={character}
        onSpendHitDie={spendHitDie}
        onCompleteShortRest={completeShortRest}
        showNotification={showNotification}
      />

      {/* Modal de Campanhas na Nuvem (Firebase) */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        userId={user?.uid || 'guest'}
        userName={user?.displayName || user?.email || character.name}
        activeCharacter={character}
        onImportPartyToCombat={handleImportPartyToCombat}
        onOpenHandoutModal={() => setIsHandoutModalOpen(true)}
        showNotification={showNotification}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={handleSetActiveCampaignId}
      />

      {/* Modal de Envio de Pistas/Documentos pelo Mestre (Handouts) */}
      <HandoutModal
        isOpen={isHandoutModalOpen}
        onClose={() => setIsHandoutModalOpen(false)}
        onBroadcastHandout={handleBroadcastHandout}
        showNotification={showNotification}
      />

      {/* Modal de Visualização de Pistas/Documentos em Pergaminho Imersivo */}
      <HandoutViewerModal
        isOpen={isHandoutViewerOpen}
        onClose={() => setIsHandoutViewerOpen(false)}
        handout={activeHandout}
        onSaveToJournal={handleSaveHandoutToJournal}
        showNotification={showNotification}
      />

      {/* Barra de Ações Rápidas (Macro Hotbar - 1 a 6) */}
      {currentMode === 'player' && (
        <QuickActionBar
          character={character}
          onRollAction={handleRollActionFromHotbar}
          updateCharacter={updateCharacter}
        />
      )}

      {/* Modal Independente de Trilha Sonora do Mestre */}
      <MusicPlayerModal
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
      />

      {/* Modal do Mestre IA / Oráculo (Arcana AI Dungeon Master) */}
      <AiDungeonMasterModal
        isOpen={isAiDmOpen}
        onClose={() => setIsAiDmOpen(false)}
        activeCharacter={character}
        onTransmitHandout={(handout) => {
          handleBroadcastHandout(handout);
        }}
        onSaveNpcToJournal={(npc) => {
          handleSaveNpcToJournal(npc);
        }}
        onBroadcastToRoom={(msg) => {
          sendChatMessage(msg, '✨ Mestre Supremo (IA)');
          showNotification('Narração do Mestre IA transmitida para a mesa online!');
        }}
        onOpenVttWithAdventure={handleOpenVttFromAiDm}
        onStartSoloAdventureOnMap={handleStartSoloAdventureOnMap}
      />

      {/* Modal do Bestiário de Monstros */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
        onAddMonster={addMonsterCombatant}
        onRollMonsterAttack={(monName, actName, bonus) =>
          handleRollD20(`${monName}: ${actName}`, bonus)
        }
        onRollMonsterDamage={(monName, actName, formula) =>
          handleRollFormula(formula, `${monName}: ${actName}`)
        }
        onAddTokenToMap={handleAddTokenFromMonster}
      />

      {/* Modal do Compêndio de Magias SRD */}
      <SpellCompendiumModal
        isOpen={isSpellCompendiumOpen}
        onClose={() => setIsSpellCompendiumOpen(false)}
        onAddSpell={(spell) => {
          updateCharacter((prev) => ({
            ...prev,
            spellcasting: {
              ...prev.spellcasting,
              spells: [...(prev.spellcasting?.spells || []), { ...spell, id: `spell-${Date.now()}` }],
            },
          }));
          showNotification(`Magia "${spell.name}" adicionada ao Grimório!`);
        }}
        characterSpells={character.spellcasting?.spells || []}
        characterClass={character.characterClass}
      />
    </div>
  );
}

export default App;
