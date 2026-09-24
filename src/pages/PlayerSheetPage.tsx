import React, { useState } from 'react';
import type { 
  Character, 
  AbilityKey, 
  SkillKey, 
  Spell, 
  InventoryItem, 
  CharacterFeature, 
  CharacterResource 
} from '../types/dnd5e';
import { Header } from '../components/Header';
import { ConditionsTracker } from '../components/ConditionsTracker';
import { CombatStats } from '../components/CombatStats';
import { CharacterResources } from '../components/CharacterResources';
import { AttacksSection } from '../components/AttacksSection';
import { AbilityScores } from '../components/AbilityScores';
import { SkillsList } from '../components/SkillsList';
import { Spellbook } from '../components/Spellbook';
import { Inventory } from '../components/Inventory';
import { FeaturesAndTraits } from '../components/FeaturesAndTraits';
import { JournalTab } from '../components/JournalTab';
import { QuickActionBar } from '../components/QuickActionBar';
import { 
  Shield, 
  Dices, 
  BookOpen, 
  Backpack, 
  Sparkles,
  Scroll
} from 'lucide-react';

export type PlayerSheetTabType = 'combat' | 'skills' | 'spells' | 'inventory' | 'features' | 'journal';

export interface PlayerSheetPageProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  updateAbility: (key: AbilityKey, updates: { score?: number; saveProficient?: boolean }) => void;
  cycleSkillProficiency: (key: SkillKey) => void;
  applyDamage: (amount: number) => void;
  applyHealing: (amount: number) => void;
  setTempHp: (amount: number) => void;
  toggleDeathSaveSuccess: (index: number) => void;
  toggleDeathSaveFailure: (index: number) => void;
  handleShortRest: () => void;
  handleLongRest: () => void;
  handleRollD20: (label: string, bonus: number) => void;
  handleRollFormula: (formula: string, label?: string) => void;
  handleToggleCondition: (condKey: string) => void;
  handleClearConditions: () => void;
  addResource: (res: Omit<CharacterResource, 'id'>) => void;
  updateResource: (id: string, updates: Partial<CharacterResource>) => void;
  deleteResource: (id: string) => void;
  useResourceCharge: (id: string, delta?: number) => void;
  addAttack: (atk: any) => void;
  deleteAttack: (id: string) => void;
  toggleSpellSlotUsed: (level: number, slotIndex: number) => void;
  updateSpellSlotMax: (level: number, max: number) => void;
  addSpell: (spell: Omit<Spell, 'id'>) => void;
  updateSpell: (id: string, updates: Partial<Spell>) => void;
  deleteSpell: (id: string) => void;
  handleCastSpell: (spell: Spell) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addFeature: (feat: Omit<CharacterFeature, 'id'>) => void;
  deleteFeature: (id: string) => void;
  handleRollActionFromHotbar: (name: string, bonus: number, formula?: string) => void;
  onOpenCharacterManager: () => void;
  onOpenLevelUp: () => void;
  onOpenWizard: () => void;
  onOpenCompendium: () => void;
}

export const PlayerSheetPage: React.FC<PlayerSheetPageProps> = ({
  character,
  updateCharacter,
  updateAbility,
  cycleSkillProficiency,
  applyDamage,
  applyHealing,
  setTempHp,
  toggleDeathSaveSuccess,
  toggleDeathSaveFailure,
  handleShortRest,
  handleLongRest,
  handleRollD20,
  handleRollFormula,
  handleToggleCondition,
  handleClearConditions,
  addResource,
  updateResource,
  deleteResource,
  useResourceCharge,
  addAttack,
  deleteAttack,
  toggleSpellSlotUsed,
  updateSpellSlotMax,
  addSpell,
  updateSpell,
  deleteSpell,
  handleCastSpell,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addFeature,
  deleteFeature,
  handleRollActionFromHotbar,
  onOpenCharacterManager,
  onOpenLevelUp,
  onOpenWizard,
  onOpenCompendium,
}) => {
  const [activeTab, setActiveTab] = useState<PlayerSheetTabType>('combat');

  return (
    <div className="flex flex-col flex-1 animate-in fade-in">
      <Header
        character={character}
        updateCharacter={updateCharacter}
        onOpenCharacterManager={onOpenCharacterManager}
        onOpenLevelUp={onOpenLevelUp}
        onOpenWizard={onOpenWizard}
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
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none" role="tablist" aria-label="Seções da ficha de personagem">
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
            onOpenCompendium={onOpenCompendium}
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

      {/* Barra de Ações Rápidas (Macro Hotbar - 1 a 6) */}
      <QuickActionBar
        character={character}
        onRollAction={handleRollActionFromHotbar}
        updateCharacter={updateCharacter}
      />
    </div>
  );
};
