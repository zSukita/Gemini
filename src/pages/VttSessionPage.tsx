import React, { lazy, Suspense } from 'react';
import type { Character } from '../types/dnd5e';
import type { BattleMapConfig, MapToken, FogShape, PeerUser } from '../types/vtt';
import type { ChatMessage } from '../types/chat';
import type { ConditionKey } from '../types/combat';
import type { AiAdventureScenario } from '../data/aiAdventureScenarios';
import type { AiLootReward } from '../types/aiDm';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Scroll } from 'lucide-react';

const TabletopSessionView = lazy(() => import('../components/vtt/TabletopSessionView').then(m => ({ default: m.TabletopSessionView })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Carregando">
      <Scroll className="w-6 h-6 animate-bounce text-amber-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
    </div>
  );
}

export interface VttSessionPageProps {
  character: Character;
  charactersList: Character[];
  encounter: any;
  mapConfig: BattleMapConfig;
  tokens: MapToken[];
  selectedTokenId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  activeTool: any;
  chatLog: ChatMessage[];
  isHost: boolean;
  isConnected: boolean;
  connectedPeers: PeerUser[];
  isAiResponding: boolean;
  onSelectToken: (id: string | null) => void;
  onMoveToken: (id: string, x: number, y: number) => void;
  onSetZoom: (zoom: number | ((prev: number) => number)) => void;
  onSetPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  onSetActiveTool: (tool: any) => void;
  onUpdateMapConfig: (updater: Partial<BattleMapConfig> | ((prev: BattleMapConfig) => BattleMapConfig)) => void;
  onSelectMapPreset: (preset: any) => void;
  onUploadMap: (title: string, dataUrl: string, width: number, height: number) => void;
  onAddFogShape: (shape: Omit<FogShape, "id">) => void;
  onResetFog: () => void;
  onRevealAllFog: () => void;
  onUpdateToken: (id: string, updates: Partial<MapToken>) => void;
  onRemoveToken: (id: string) => void;
  onAddToken: (token: Omit<MapToken, 'id'>) => void;
  onApplyCharacterAvatar: (dataUrl: string) => void;
  onSendMessage: (msg: any) => void;
  onRollDie: (sides: number) => void;
  onRollFormula: (formula: string, label?: string) => void;
  onRollD20: (label: string, bonus: number) => void;
  onStartEncounter: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onSortInitiative: () => void;
  onResetEncounter: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onToggleCondition: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative: (id: string, init: number) => void;
  onRemoveCombatant: (id: string) => void;
  onRollMonsterAttack: (monName: string, actName: string, bonus: number) => void;
  onRollMonsterDamage: (monName: string, actName: string, formula: string) => void;
  onAiMonsterAttack: (scenario?: any) => void;
  onOpenMultiplayerModal: () => void;
  onOpenAiDmModal: () => void;
  onOpenCompendium: () => void;
  onOpenBestiary: () => void;
  onOpenCharacterSheet: () => void;
  onOpenMusicPlayer: () => void;
  onOpenEndSessionModal: () => void;
  onStartScenario: (scenario: AiAdventureScenario) => void;
  onCollectLoot: (loot: AiLootReward) => void;
  onUpdateCharacter: (updates: Partial<Character>) => void;
}

export const VttSessionPage: React.FC<VttSessionPageProps> = (props) => {
  return (
    <ErrorBoundary sectionName="Mesa Virtual">
      <div className="flex flex-col flex-1 animate-in fade-in">
        <Suspense fallback={<LazyFallback />}>
          <TabletopSessionView
            character={props.character}
            charactersList={props.charactersList}
            encounter={props.encounter}
            mapConfig={props.mapConfig}
            tokens={props.tokens}
            selectedTokenId={props.selectedTokenId}
            zoom={props.zoom}
            pan={props.pan}
            activeTool={props.activeTool}
            chatLog={props.chatLog}
            currentUserName={props.character.name}
            isHost={props.isHost}
            isConnected={props.isConnected}
            connectedPeers={props.connectedPeers}
            isAiResponding={props.isAiResponding}
            onSelectToken={props.onSelectToken}
            onMoveToken={props.onMoveToken}
            onSetZoom={props.onSetZoom}
            onSetPan={props.onSetPan}
            onSetActiveTool={props.onSetActiveTool}
            onUpdateMapConfig={props.onUpdateMapConfig}
            onSelectMapPreset={props.onSelectMapPreset}
            onUploadMap={props.onUploadMap}
            onAddFogShape={props.onAddFogShape}
            onResetFog={props.onResetFog}
            onRevealAllFog={props.onRevealAllFog}
            onUpdateToken={props.onUpdateToken}
            onRemoveToken={props.onRemoveToken}
            onAddToken={props.onAddToken}
            onApplyCharacterAvatar={props.onApplyCharacterAvatar}
            onSendMessage={props.onSendMessage}
            onRollDie={props.onRollDie}
            onRollFormula={props.onRollFormula}
            onRollD20={props.onRollD20}
            onStartEncounter={props.onStartEncounter}
            onNextTurn={props.onNextTurn}
            onPreviousTurn={props.onPreviousTurn}
            onSortInitiative={props.onSortInitiative}
            onResetEncounter={props.onResetEncounter}
            onHpDelta={props.onHpDelta}
            onToggleCondition={props.onToggleCondition}
            onUpdateInitiative={props.onUpdateInitiative}
            onRemoveCombatant={props.onRemoveCombatant}
            onRollMonsterAttack={props.onRollMonsterAttack}
            onRollMonsterDamage={props.onRollMonsterDamage}
            onAiMonsterAttack={props.onAiMonsterAttack}
            onOpenMultiplayerModal={props.onOpenMultiplayerModal}
            onOpenAiDmModal={props.onOpenAiDmModal}
            onOpenCompendium={props.onOpenCompendium}
            onOpenBestiary={props.onOpenBestiary}
            onOpenCharacterSheet={props.onOpenCharacterSheet}
            onOpenMusicPlayer={props.onOpenMusicPlayer}
            onOpenEndSessionModal={props.onOpenEndSessionModal}
            onStartScenario={props.onStartScenario}
            onCollectLoot={props.onCollectLoot}
            onUpdateCharacter={props.onUpdateCharacter}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};
