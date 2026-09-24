import React, { lazy, Suspense } from 'react';
import type { ConditionKey } from '../types/combat';
import type { Character, CampaignNpc } from '../types/dnd5e';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Scroll } from 'lucide-react';

const DmScreen = lazy(() => import('../components/dm/DmScreen').then(m => ({ default: m.DmScreen })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Carregando">
      <Scroll className="w-6 h-6 animate-bounce text-amber-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
    </div>
  );
}

export interface DmScreenPageProps {
  encounter: any;
  charactersList: Character[];
  onStartEncounter: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onRollAllMonsters: () => void;
  onSortInitiative: () => void;
  onImportPlayers: (players: any[]) => void;
  onResetEncounter: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onToggleCondition: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative: (id: string, init: number) => void;
  onRemoveCombatant: (id: string) => void;
  onAddMonster: (monster: any) => void;
  onAddCustomCombatant: (combatant: any) => void;
  onRollMonsterAttack: (monName: string, actName: string, bonus: number) => void;
  onRollMonsterDamage: (monName: string, actName: string, formula: string) => void;
  onAddTokenToMap: (monster: any) => void;
  onAddCoinsToCharacter: (coins: { cp: number; sp: number; ep: number; gp: number; pp: number }) => void;
  onAddToSharedLoot: (item: { name: string; quantity: number; valueGp: number }) => void;
  onSaveNpcToJournal: (npc: CampaignNpc) => void;
  onOpenAiDm: () => void;
}

export const DmScreenPage: React.FC<DmScreenPageProps> = (props) => {
  return (
    <ErrorBoundary sectionName="Painel do Mestre">
      <div className="flex flex-col flex-1 animate-in fade-in">
        <Suspense fallback={<LazyFallback />}>
          <DmScreen
            encounter={props.encounter}
            charactersList={props.charactersList}
            onStartEncounter={props.onStartEncounter}
            onNextTurn={props.onNextTurn}
            onPreviousTurn={props.onPreviousTurn}
            onRollAllMonsters={props.onRollAllMonsters}
            onSortInitiative={props.onSortInitiative}
            onImportPlayers={props.onImportPlayers}
            onResetEncounter={props.onResetEncounter}
            onHpDelta={props.onHpDelta}
            onToggleCondition={props.onToggleCondition}
            onUpdateInitiative={props.onUpdateInitiative}
            onRemoveCombatant={props.onRemoveCombatant}
            onAddMonster={props.onAddMonster}
            onAddCustomCombatant={props.onAddCustomCombatant}
            onRollMonsterAttack={props.onRollMonsterAttack}
            onRollMonsterDamage={props.onRollMonsterDamage}
            onAddTokenToMap={props.onAddTokenToMap}
            onAddCoinsToCharacter={props.onAddCoinsToCharacter}
            onAddToSharedLoot={props.onAddToSharedLoot}
            onSaveNpcToJournal={props.onSaveNpcToJournal}
            onOpenAiDm={props.onOpenAiDm}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};
