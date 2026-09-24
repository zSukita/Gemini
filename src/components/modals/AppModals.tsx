import React, { lazy, Suspense } from 'react';
import type { Character, DiceRollResult, Spell, CampaignNpc } from '../../types/dnd5e';
import type { ChatMessage } from '../../types/chat';
import type { PeerUser } from '../../types/vtt';
import type { CampaignHandout } from '../../firebase/campaignSync';
import type { 
  GameInvite, 
  DirectMessage, 
  FriendUser, 
  OnlineUserPresence 
} from '../../firebase/presenceAndFriends';
import type { AiAdventureScenario } from '../../data/aiAdventureScenarios';
import type { AiMessage } from '../../types/aiDm';
import { FloatingOnlineList } from '../multiplayer/FloatingOnlineList';
import { GameInviteModal } from '../social/GameInviteModal';
import { DiceRollAnimation } from '../DiceRollAnimation';
import { Scroll } from 'lucide-react';

// ── Lazy Loading: Carregados sob demanda ──
const BestiaryModal = lazy(() => import('../dm/BestiaryModal').then(m => ({ default: m.BestiaryModal })));
const RollHistoryModal = lazy(() => import('../RollHistoryModal').then(m => ({ default: m.RollHistoryModal })));
const CharacterManagerModal = lazy(() => import('../CharacterManagerModal').then(m => ({ default: m.CharacterManagerModal })));
const CharacterWizardModal = lazy(() => import('../CharacterWizardModal').then(m => ({ default: m.CharacterWizardModal })));
const MultiplayerModal = lazy(() => import('../multiplayer/MultiplayerModal').then(m => ({ default: m.MultiplayerModal })));
const SocialSidebar = lazy(() => import('../social/SocialSidebar').then(m => ({ default: m.SocialSidebar })));
const PrintSheetModal = lazy(() => import('../PrintSheetModal').then(m => ({ default: m.PrintSheetModal })));
const SessionChatModal = lazy(() => import('../SessionChatModal').then(m => ({ default: m.SessionChatModal })));
const LevelUpModal = lazy(() => import('../LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const MusicPlayerModal = lazy(() => import('../dm/MusicPlayerModal').then(m => ({ default: m.MusicPlayerModal })));
const ShortRestModal = lazy(() => import('../ShortRestModal').then(m => ({ default: m.ShortRestModal })));
const CampaignModal = lazy(() => import('../CampaignModal').then(m => ({ default: m.CampaignModal })));
const HandoutModal = lazy(() => import('../dm/HandoutModal').then(m => ({ default: m.HandoutModal })));
const HandoutViewerModal = lazy(() => import('../HandoutViewerModal').then(m => ({ default: m.HandoutViewerModal })));
const AiDungeonMasterModal = lazy(() => import('../ai/AiDungeonMasterModal').then(m => ({ default: m.AiDungeonMasterModal })));
const EndSessionModal = lazy(() => import('../vtt/EndSessionModal').then(m => ({ default: m.EndSessionModal })));
const SpellCompendiumModal = lazy(() => import('../SpellCompendiumModal').then(m => ({ default: m.SpellCompendiumModal })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Carregando">
      <Scroll className="w-6 h-6 animate-bounce text-amber-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
    </div>
  );
}

export interface AppModalsProps {
  character: Character;
  user: any;
  showNotification: (msg: string) => void;

  // Roll History
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  diceRolls: DiceRollResult[];
  onClearRolls: () => void;

  // Character Manager
  isManagerOpen: boolean;
  setIsManagerOpen: (open: boolean) => void;
  charactersList: Character[];
  activeId: string;
  onSelectCharacter: (id: string) => void;
  onCreateCharacter: (name?: string) => void;
  onDeleteCharacter: () => void;
  onImportCharacter: (json: string) => boolean;
  onExportCharacter: () => string;

  // Character Wizard
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  onCharacterCreated: (newChar: Character) => void;

  // Multiplayer
  isMultiplayerOpen: boolean;
  setIsMultiplayerOpen: (open: boolean) => void;
  isConnected: boolean;
  isConnecting: boolean;
  isHost: boolean;
  roomCode: string;
  connectedPeers: PeerUser[];
  chatLog: ChatMessage[];
  isAiResponding: boolean;
  onCreateRoom: (name: string, customCode?: string) => Promise<string>;
  onCreateAiRoom?: (scenario: AiAdventureScenario, customTitle?: string, customPrompt?: string) => Promise<string>;
  onJoinRoom: (code: string, name: string) => Promise<boolean>;
  onDisconnect: () => void;
  onSendMessage: (text: string, name: string) => void;
  onOpenTabletop: () => void;

  // End Session
  isEndSessionOpen: boolean;
  setIsEndSessionOpen: (open: boolean) => void;
  onStartNewAdventure: () => void;
  onClearMonstersAndCombat: () => void;
  onDisconnectAndExit: () => void;

  // Floating online list
  isOnlineListPinned: boolean;
  setIsOnlineListPinned: (pinned: boolean) => void;

  // Social Sidebar
  isSocialSidebarOpen: boolean;
  onToggleSocialSidebar: () => void;
  onlineUsers: OnlineUserPresence[];
  friends: FriendUser[];
  directMessages?: DirectMessage[];
  onSendDirectMessage?: (toUserId: string, toUserName: string, content: string) => Promise<void>;
  onMarkMessagesAsRead?: (partnerUserId: string) => Promise<void>;
  onAddFriend: (identifier: string) => Promise<{ success: boolean; message: string }>;
  onRemoveFriend: (friendUserId: string) => Promise<void>;
  onSendGameInvite: (friendUserId: string, friendName: string, roomCode: string) => Promise<{ ok: boolean; inviteId?: string }>;
  onCreateAndInvite?: (friendUserId: string, friendName: string) => Promise<void>;
  onJoinFromSocial: (code: string) => Promise<void>;

  // Game Invites
  pendingInvites: GameInvite[];
  onAcceptInvite: (invite: GameInvite) => Promise<void>;
  onDeclineInvite: (inviteId: string) => Promise<void>;

  // 3D Dice Animation
  activeRollAnimation: DiceRollResult | null;
  onCloseDiceAnimation: () => void;
  onRerollAnimation: () => void;

  // Print
  isPrintOpen: boolean;
  setIsPrintOpen: (open: boolean) => void;

  // Session Chat
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  sendChatMessage: (msg: any, senderName?: string) => void;

  // Level Up
  isLevelUpOpen: boolean;
  setIsLevelUpOpen: (open: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;

  // Short Rest
  isShortRestOpen: boolean;
  setIsShortRestOpen: (open: boolean) => void;
  spendHitDie: () => { dieRoll: number; conMod: number; totalHealed: number } | null;
  completeShortRest: () => void;

  // Campaign
  isCampaignModalOpen: boolean;
  setIsCampaignModalOpen: (open: boolean) => void;
  activeCampaignId: string | null;
  setActiveCampaignId: (id: string | null) => void;
  onImportPartyToCombat: (members: any[]) => void;

  // Handouts
  isHandoutModalOpen: boolean;
  setIsHandoutModalOpen: (open: boolean) => void;
  activeHandout: CampaignHandout | null;
  isHandoutViewerOpen: boolean;
  setIsHandoutViewerOpen: (open: boolean) => void;
  onBroadcastHandout: (handout: { title: string; content: string; imageUrl?: string }) => void;
  onSaveHandoutToJournal?: (title: string, content: string) => void;

  // Music Player
  isMusicPlayerOpen: boolean;
  setIsMusicPlayerOpen: (open: boolean) => void;

  // AI DM
  isAiDmOpen: boolean;
  setIsAiDmOpen: (open: boolean) => void;
  onSaveNpcToJournal: (npc: CampaignNpc) => void;
  onOpenVttWithAdventure: (history: AiMessage[]) => void;
  onStartSoloAdventureOnMap: (scenario: AiAdventureScenario, customPrompt?: string) => void;

  // Bestiary
  isBestiaryOpen: boolean;
  setIsBestiaryOpen: (open: boolean) => void;
  onAddMonsterCombatant: (monster: any) => void;
  onRollMonsterAttack: (monName: string, actName: string, bonus: number) => void;
  onRollMonsterDamage: (monName: string, actName: string, formula: string) => void;
  onAddTokenFromMonster: (monster: any) => void;

  // Spell Compendium
  isSpellCompendiumOpen: boolean;
  setIsSpellCompendiumOpen: (open: boolean) => void;
  onAddSpell: (spell: Omit<Spell, 'id'>) => void;
}

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    character,
    user,
    showNotification,
    isHistoryOpen,
    setIsHistoryOpen,
    diceRolls,
    onClearRolls,
    isManagerOpen,
    setIsManagerOpen,
    charactersList,
    activeId,
    onSelectCharacter,
    onCreateCharacter,
    onDeleteCharacter,
    onImportCharacter,
    onExportCharacter,
    isWizardOpen,
    setIsWizardOpen,
    onCharacterCreated,
    isMultiplayerOpen,
    setIsMultiplayerOpen,
    isConnected,
    isConnecting,
    isHost,
    roomCode,
    connectedPeers,
    chatLog,
    isAiResponding,
    onCreateRoom,
    onCreateAiRoom,
    onJoinRoom,
    onDisconnect,
    onSendMessage,
    onOpenTabletop,
    isEndSessionOpen,
    setIsEndSessionOpen,
    onStartNewAdventure,
    onClearMonstersAndCombat,
    onDisconnectAndExit,
    isOnlineListPinned,
    setIsOnlineListPinned,
    isSocialSidebarOpen,
    onToggleSocialSidebar,
    onlineUsers,
    friends,
    directMessages,
    onSendDirectMessage,
    onMarkMessagesAsRead,
    onAddFriend,
    onRemoveFriend,
    onSendGameInvite,
    onCreateAndInvite,
    onJoinFromSocial,
    pendingInvites,
    onAcceptInvite,
    onDeclineInvite,
    activeRollAnimation,
    onCloseDiceAnimation,
    onRerollAnimation,
    isPrintOpen,
    setIsPrintOpen,
    isChatOpen,
    setIsChatOpen,
    sendChatMessage,
    isLevelUpOpen,
    setIsLevelUpOpen,
    updateCharacter,
    isShortRestOpen,
    setIsShortRestOpen,
    spendHitDie,
    completeShortRest,
    isCampaignModalOpen,
    setIsCampaignModalOpen,
    activeCampaignId,
    setActiveCampaignId,
    onImportPartyToCombat,
    isHandoutModalOpen,
    setIsHandoutModalOpen,
    activeHandout,
    isHandoutViewerOpen,
    setIsHandoutViewerOpen,
    onBroadcastHandout,
    onSaveHandoutToJournal,
    isMusicPlayerOpen,
    setIsMusicPlayerOpen,
    isAiDmOpen,
    setIsAiDmOpen,
    onSaveNpcToJournal,
    onOpenVttWithAdventure,
    onStartSoloAdventureOnMap,
    isBestiaryOpen,
    setIsBestiaryOpen,
    onAddMonsterCombatant,
    onRollMonsterAttack,
    onRollMonsterDamage,
    onAddTokenFromMonster,
    isSpellCompendiumOpen,
    setIsSpellCompendiumOpen,
    onAddSpell,
  } = props;

  return (
    <Suspense fallback={<LazyFallback />}>
      {/* Modal de Histórico de Rolagens */}
      <RollHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        rolls={diceRolls}
        onClearRolls={onClearRolls}
      />

      {/* Modal de Gerenciamento de Personagens */}
      <CharacterManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        characters={charactersList}
        activeId={activeId}
        onSelectCharacter={(id) => {
          onSelectCharacter(id);
          setIsManagerOpen(false);
          showNotification('Ficha alternada com sucesso!');
        }}
        onCreateCharacter={(name) => {
          onCreateCharacter(name);
          setIsManagerOpen(false);
          showNotification('Nova ficha criada!');
        }}
        onOpenWizard={() => setIsWizardOpen(true)}
        onDeleteCharacter={() => {
          onDeleteCharacter();
          showNotification('Ficha removida.');
        }}
        onImportCharacter={(json) => {
          const ok = onImportCharacter(json);
          if (ok) {
            setIsManagerOpen(false);
            showNotification('Ficha importada com sucesso!');
          }
          return ok;
        }}
        onExportCharacter={onExportCharacter}
        onOpenPrint={() => setIsPrintOpen(true)}
      />

      {/* Assistente Oficial de Criação de Personagens (Wizard) */}
      <CharacterWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCharacterCreated={(newChar) => {
          onCharacterCreated(newChar);
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
        currentUserName={character.name || 'Jogador'}
        character={character}
        isAiResponding={isAiResponding}
        onCreateRoom={onCreateRoom}
        onCreateAiRoom={onCreateAiRoom}
        onJoinRoom={onJoinRoom}
        onDisconnect={onDisconnect}
        onSendMessage={onSendMessage}
        onOpenTabletop={onOpenTabletop}
      />

      {/* Modal de Finalizar Mesa / Nova Sessão */}
      <EndSessionModal
        isOpen={isEndSessionOpen}
        onClose={() => setIsEndSessionOpen(false)}
        isConnected={isConnected}
        roomCode={roomCode}
        onStartNewAdventure={onStartNewAdventure}
        onClearMonstersAndCombat={onClearMonstersAndCombat}
        onDisconnectAndExit={onDisconnectAndExit}
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

      {/* Barra Lateral Social: Pessoas Online & Amigos */}
      <SocialSidebar
        isOpen={isSocialSidebarOpen}
        onToggle={onToggleSocialSidebar}
        onlineUsers={onlineUsers}
        friends={friends}
        connectedPeers={connectedPeers}
        currentUserId={user?.uid || 'local_user'}
        currentUserName={character.name || user?.displayName || 'Você'}
        currentRoomCode={isConnected ? roomCode : undefined}
        directMessages={directMessages}
        onSendDirectMessage={onSendDirectMessage}
        onMarkMessagesAsRead={onMarkMessagesAsRead}
        onAddFriend={onAddFriend}
        onRemoveFriend={onRemoveFriend}
        onSendGameInvite={onSendGameInvite}
        onCreateAndInvite={onCreateAndInvite}
        onJoinRoom={onJoinFromSocial}
      />

      {/* Modal de Convite de Jogo Recebido */}
      <GameInviteModal
        invites={pendingInvites}
        onAccept={onAcceptInvite}
        onDecline={onDeclineInvite}
      />

      {/* Animação 3D de Rolagem de Dados Poliédricos */}
      {activeRollAnimation && (
        <DiceRollAnimation
          roll={activeRollAnimation}
          onClose={onCloseDiceAnimation}
          onReroll={onRerollAnimation}
        />
      )}

      {/* Modal de Impressão e Salvamento em PDF */}
      <PrintSheetModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        character={character}
      />

      {/* Modal de Chat Rápido da Sessão */}
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
        onImportPartyToCombat={onImportPartyToCombat}
        onOpenHandoutModal={() => setIsHandoutModalOpen(true)}
        showNotification={showNotification}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={setActiveCampaignId}
      />

      {/* Modal de Envio de Pistas/Documentos pelo Mestre (Handouts) */}
      <HandoutModal
        isOpen={isHandoutModalOpen}
        onClose={() => setIsHandoutModalOpen(false)}
        onBroadcastHandout={onBroadcastHandout}
        showNotification={showNotification}
      />

      {/* Modal de Visualização de Pistas/Documentos em Pergaminho Imersivo */}
      <HandoutViewerModal
        isOpen={isHandoutViewerOpen}
        onClose={() => setIsHandoutViewerOpen(false)}
        handout={activeHandout}
        onSaveToJournal={onSaveHandoutToJournal}
        showNotification={showNotification}
      />

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
        onTransmitHandout={onBroadcastHandout}
        onSaveNpcToJournal={onSaveNpcToJournal}
        onBroadcastToRoom={(msg) => {
          sendChatMessage(typeof msg === 'string' ? msg : msg.text, '✨ Mestre Supremo (IA)');
          showNotification('Narração do Mestre IA transmitida para a mesa online!');
        }}
        onOpenVttWithAdventure={onOpenVttWithAdventure}
        onStartSoloAdventureOnMap={onStartSoloAdventureOnMap}
      />

      {/* Modal do Bestiário de Monstros */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
        onAddMonster={onAddMonsterCombatant}
        onRollMonsterAttack={onRollMonsterAttack}
        onRollMonsterDamage={onRollMonsterDamage}
        onAddTokenToMap={onAddTokenFromMonster}
      />

      {/* Grimório Oficial / Compêndio de Magias SRD */}
      <SpellCompendiumModal
        isOpen={isSpellCompendiumOpen}
        onClose={() => setIsSpellCompendiumOpen(false)}
        onAddSpell={onAddSpell}
        characterSpells={character.spellcasting?.spells || []}
        characterClass={character.characterClass}
      />
    </Suspense>
  );
};
