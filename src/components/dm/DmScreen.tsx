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
import { Volume2, Coins, UserPlus, Music } from 'lucide-react';
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
}) => {
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isLootOpen, setIsLootOpen] = useState(false);
  const [isNpcGenOpen, setIsNpcGenOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Ferramentas Avançadas do Mestre */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 -mb-2">
        <button
          type="button"
          onClick={() => setIsLootOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95 hover:border-amber-400"
          title="Gerar tesouros, moedas e itens mágicos SRD"
        >
          <Coins size={15} className="text-amber-400" />
          <span>Gerador de Tesouros</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNpcGenOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95 hover:border-amber-400"
          title="Gerar NPC rápido com segredos e rumores"
        >
          <UserPlus size={15} className="text-amber-400" />
          <span>Gerador de NPCs</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMusicPlayerOpen(true)}
          className="rpg-button bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 text-purple-300 font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95 hover:border-purple-400"
          title="Reprodutor de trilha sonora e músicas do Mestre"
        >
          <Music size={15} className="text-purple-400" />
          <span>Trilha Sonora & Músicas</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSoundboardOpen(true)}
          className="rpg-button bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95"
          title="Abrir mesa de sons e efeitos ambientais do Mestre"
        >
          <Volume2 size={16} />
          <span>Soundboard & Efeitos</span>
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
