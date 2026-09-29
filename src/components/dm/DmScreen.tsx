import React, { useState } from 'react';
import type { Encounter, ConditionKey, Monster, Combatant } from '../../types/combat';
import type { Character } from '../../types/dnd5e';
import { InitiativeTracker } from './InitiativeTracker';
import { BestiaryModal } from './BestiaryModal';
import { CustomMonsterModal } from './CustomMonsterModal';
import { SoundboardModal } from './SoundboardModal';
import { LootGeneratorModal } from './LootGeneratorModal';
import { NpcGeneratorModal } from './NpcGeneratorModal';
import { MusicPlayerModal } from './MusicPlayerModal';
import { Volume2, Coins, UserPlus, Music, Sparkles } from 'lucide-react';
import type { CampaignNpc } from '../../types/dnd5e';

interface DmScreenProps {
  encounter: Encounter;
  charactersList: Character[];
  onStartEncounter: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onRollAllMonsters: () => void;
  onSortInitiative: () => void;
  onImportPlayers: (characters: Character[]) => void;
  onResetEncounter: () => void;
  onHpDelta: (id: string, delta: number) => void;
  onUndoLastHpChange: () => void;
  onToggleCondition: (id: string, cond: ConditionKey) => void;
  onUpdateInitiative: (id: string, init: number) => void;
  onRemoveCombatant: (id: string) => void;
  onAddMonster: (monster: Monster, count: number) => void;
  onAddCustomCombatant: (combatant: Omit<Combatant, 'id'>) => void;
  onRollMonsterAttack: (monsterName: string, actionName: string, attackBonus: number) => void;
  onRollMonsterDamage: (monsterName: string, actionName: string, formula: string) => void;
  onAddTokenToMap?: (monster: Monster) => void;
  onAddCoinsToCharacter?: (coins: { cp: number; sp: number; ep: number; gp: number; pp: number }) => void;
  onAddToSharedLoot?: (item: { name: string; quantity: number; valueGp: number }) => void;
  onSaveNpcToJournal?: (npc: CampaignNpc) => void;
  onOpenAiDm?: () => void;
}

export const DmScreen: React.FC<DmScreenProps> = ({
  encounter,
  charactersList,
  onStartEncounter,
  onNextTurn,
  onPreviousTurn,
  onRollAllMonsters,
  onSortInitiative,
  onImportPlayers,
  onResetEncounter,
  onHpDelta,
  onUndoLastHpChange,
  onToggleCondition,
  onUpdateInitiative,
  onRemoveCombatant,
  onAddMonster,
  onAddCustomCombatant,
  onRollMonsterAttack,
  onRollMonsterDamage,
  onAddTokenToMap,
  onAddCoinsToCharacter,
  onAddToSharedLoot,
  onSaveNpcToJournal,
  onOpenAiDm,
}) => {
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isLootOpen, setIsLootOpen] = useState(false);
  const [isNpcGenOpen, setIsNpcGenOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Ferramentas Avançadas do Mestre em Grade Responsiva */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 w-full -mb-2">
        {onOpenAiDm && (
          <button
            type="button"
            onClick={onOpenAiDm}
            className="rpg-button bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-indigo-600/20 hover:from-amber-500/30 hover:to-indigo-600/30 border border-amber-500/50 text-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 hover:border-amber-400 w-full min-h-[44px]"
            title="Abrir Oráculo IA & Mestre Supremo com Gemini"
          >
            <Sparkles size={15} className="text-amber-400 animate-pulse shrink-0" />
            <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent font-black truncate">🔮 Oráculo IA</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsLootOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 hover:border-amber-400 w-full min-h-[44px]"
          title="Gerar tesouros, moedas e itens mágicos SRD"
        >
          <Coins size={15} className="text-amber-400 shrink-0" />
          <span className="truncate">Tesouros</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNpcGenOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 hover:border-amber-400 w-full min-h-[44px]"
          title="Gerar NPC rápido com segredos e rumores"
        >
          <UserPlus size={15} className="text-amber-400 shrink-0" />
          <span className="truncate">Gerador NPCs</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMusicPlayerOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 text-purple-300 font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 hover:border-purple-400 w-full min-h-[44px]"
          title="Reprodutor de trilha sonora e músicas do Mestre"
        >
          <Music size={15} className="text-purple-400 shrink-0" />
          <span className="truncate">Trilha Sonora</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSoundboardOpen(true)}
          className="rpg-button col-span-2 sm:col-span-1 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 w-full min-h-[44px]"
          title="Abrir mesa de sons e efeitos ambientais do Mestre"
        >
          <Volume2 size={16} className="shrink-0" />
          <span className="truncate">Soundboard & Efeitos</span>
        </button>
      </div>

      {/* Rastreador Principal */}
      <InitiativeTracker
        encounter={encounter}
        charactersList={charactersList}
        onStartEncounter={onStartEncounter}
        onNextTurn={onNextTurn}
        onPreviousTurn={onPreviousTurn}
        onRollAllMonsters={onRollAllMonsters}
        onSortInitiative={onSortInitiative}
        onImportPlayers={onImportPlayers}
        onOpenBestiary={() => setIsBestiaryOpen(true)}
        onOpenCustomMonster={() => setIsCustomOpen(true)}
        onResetEncounter={onResetEncounter}
        onHpDelta={onHpDelta}
        onUndoLastHpChange={onUndoLastHpChange}
        onToggleCondition={onToggleCondition}
        onUpdateInitiative={onUpdateInitiative}
        onRemoveCombatant={onRemoveCombatant}
        onRollMonsterAttack={onRollMonsterAttack}
        onRollMonsterDamage={onRollMonsterDamage}
      />

      {/* Modal do Bestiário */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
        onAddMonster={onAddMonster}
        onRollMonsterAttack={onRollMonsterAttack}
        onRollMonsterDamage={onRollMonsterDamage}
        onAddTokenToMap={onAddTokenToMap}
      />

      {/* Modal de Criação de Monstro / NPC Customizado */}
      <CustomMonsterModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        onAddCustomCombatant={onAddCustomCombatant}
      />

      {/* Modal da Mesa de Sons (Soundboard) */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      {/* Modal do Gerador de Tesouros */}
      <LootGeneratorModal
        isOpen={isLootOpen}
        onClose={() => setIsLootOpen(false)}
        onAddCoinsToCharacter={onAddCoinsToCharacter}
        onAddToSharedLoot={onAddToSharedLoot}
      />

      {/* Modal do Gerador Rápido de NPCs */}
      <NpcGeneratorModal
        isOpen={isNpcGenOpen}
        onClose={() => setIsNpcGenOpen(false)}
        onSaveNpcToJournal={onSaveNpcToJournal}
      />

      {/* Modal do Reprodutor de Trilha Sonora */}
      <MusicPlayerModal
        isOpen={isMusicPlayerOpen}
        onClose={() => setIsMusicPlayerOpen(false)}
      />
    </div>
  );
};
