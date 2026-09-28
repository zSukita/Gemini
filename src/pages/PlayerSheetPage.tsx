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
  Scroll,
  Heart,
  Zap,
  Swords,
  Footprints,
  Coffee,
  Moon,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { getAbilityModifier, formatModifier } from '../utils/calculations';

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
  consumeResourceCharge?: (id: string, delta?: number) => void;
  useResourceCharge?: (id: string, delta?: number) => void;
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
  onOpenPrint?: () => void;
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
  consumeResourceCharge,
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
  onOpenPrint,
}) => {
  const [activeTab, setActiveTab] = useState<PlayerSheetTabType>('combat');
  const [sheetMode, setSheetMode] = useState<'adventurer' | 'full'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('arcanasheet_sheet_mode') as 'adventurer' | 'full') || 'adventurer';
    }
    return 'adventurer';
  });

  const handleSetSheetMode = (mode: 'adventurer' | 'full') => {
    setSheetMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arcanasheet_sheet_mode', mode);
    }
  };

  const [quickHpDelta, setQuickHpDelta] = useState<number>(1);

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
        onOpenPrint={onOpenPrint}
      />

      {/* Rastreador de Condições & Status Ativos na Ficha */}
      <div className="mb-3">
        <ConditionsTracker
          activeConditions={character.activeConditions || []}
          onToggleCondition={handleToggleCondition}
          onClearConditions={handleClearConditions}
        />
      </div>

      {/* Alternador de Modo: Aventureiro (Fácil) vs Ficha Completa */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSetSheetMode('adventurer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition cursor-pointer ${
              sheetMode === 'adventurer'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield size={14} className={sheetMode === 'adventurer' ? 'text-slate-950' : 'text-amber-400'} />
            <span>🛡️ Modo Aventureiro (Fácil)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetSheetMode('full')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold tracking-wide flex items-center gap-2 transition cursor-pointer ${
              sheetMode === 'full'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen size={14} className={sheetMode === 'full' ? 'text-slate-950' : 'text-indigo-400'} />
            <span>📜 Ficha Completa (D&D 5e)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline pr-2">
          {sheetMode === 'adventurer'
            ? '⚡ Visão rápida com PV, ataques em 1 clique e testes essenciais.'
            : '📜 Acesso a todas as 6 abas, perícias e inventário completo.'}
        </span>
      </div>

      {sheetMode === 'adventurer' ? (
        <div className="space-y-4 animate-in fade-in">
          {/* 1. Painel Vital & Combate Rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pontos de Vida Grandes com + / - rápidos */}
            <div className="md:col-span-2 rpg-card p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="text-rose-500" size={20} />
                  <h3 className="font-serif text-sm font-bold text-amber-200 uppercase tracking-wider">
                    Pontos de Vida (Sobrevivência)
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {character.currentHp} / {character.maxHp} PV
                  {character.tempHp > 0 && <span className="text-amber-400 ml-1">+{character.tempHp} Temp</span>}
                </span>
              </div>

              {/* Barra Visual de Vida */}
              <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (character.currentHp / (character.maxHp || 1)) > 0.5
                      ? 'bg-emerald-500'
                      : (character.currentHp / (character.maxHp || 1)) > 0.25
                      ? 'bg-amber-500'
                      : 'bg-rose-600 animate-pulse'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, Math.round((character.currentHp / (character.maxHp || 1)) * 100)))}%`,
                  }}
                />
              </div>

              {/* Botões Rápidos de Alteração de Vida */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Rápido:</span>
                  <button
                    type="button"
                    onClick={() => applyDamage(5)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                    title="Sofrer 5 de dano"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDamage(1)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                    title="Sofrer 1 de dano"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHealing(1)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/60 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                    title="Recuperar 1 PV"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHealing(5)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/60 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
                    title="Recuperar 5 PV"
                  >
                    +5
                  </button>
                </div>

                {/* Input Customizado de Dano / Cura */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={quickHpDelta}
                    onChange={(e) => setQuickHpDelta(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 rpg-input py-1 px-2 text-xs text-center font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => applyDamage(quickHpDelta)}
                    className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    Dano
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHealing(quickHpDelta)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    Curar
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna 2: Defesa & Iniciativa */}
            <div className="rpg-card p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 shadow-xl flex flex-col justify-between space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* CA */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    <Shield size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Defesa (CA)</span>
                  </div>
                  <div className="font-serif text-2xl font-black text-amber-200">
                    {character.armorClass}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-none">Ataques precisam igualar</p>
                </div>

                {/* Deslocamento */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    <Footprints size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Passo</span>
                  </div>
                  <div className="font-serif text-2xl font-black text-amber-200">
                    {character.speed || 9}m
                  </div>
                  <p className="text-[10px] text-slate-400 leading-none">Movimento por turno</p>
                </div>
              </div>

              {/* Botão de Rolar Iniciativa */}
              <button
                type="button"
                onClick={() => handleRollD20('Iniciativa', character.initiativeBonus || 0)}
                className="w-full rpg-button bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <Zap size={14} className="fill-slate-950" />
                <span>Rolar Iniciativa ({formatModifier(character.initiativeBonus || 0)})</span>
              </button>

              {/* Descansos Rápidos */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={handleShortRest}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Recuperar fôlego e gastar Dados de Vida"
                >
                  <Coffee size={12} className="text-amber-400" />
                  <span>Descanso Curto</span>
                </button>
                <button
                  type="button"
                  onClick={handleLongRest}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Dormir e recuperar todos os PVs e magias"
                >
                  <Moon size={12} className="text-indigo-400" />
                  <span>Descanso Longo</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Minhas Ações de Combate (1-Clique para Acerto + Dano) */}
          <div className="rpg-card p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="text-amber-400" size={18} />
                <h3 className="font-serif text-sm font-bold text-amber-200 uppercase tracking-wider">
                  Minhas Ações de Ataque (Acerto + Dano Automático)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Rola 1d20 para acertar e o dano da arma em seguida
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {character.attacks && character.attacks.length > 0 ? (
                character.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-amber-100 group-hover:text-amber-300 transition">
                          {atk.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          {formatModifier(atk.attackBonus)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300 font-semibold">{atk.damage}</span>
                        {atk.damageType && <span>• {atk.damageType}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRollActionFromHotbar(atk.name, atk.attackBonus, atk.damage)}
                      className="w-full rpg-button bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-50 hover:text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Dices size={13} className="text-amber-300" />
                      <span>Atacar com {atk.name}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-3 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">Nenhum ataque configurado ainda na ficha.</p>
                  <button
                    type="button"
                    onClick={() => handleRollActionFromHotbar('Ataque Desarmado', getAbilityModifier(character.abilities.str.score) + 2, '1d4')}
                    className="rpg-button bg-amber-700 hover:bg-amber-600 text-white text-xs py-1.5 px-4 rounded-lg cursor-pointer"
                  >
                    ⚔️ Atacar com Golpe Desarmado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Magias Rápidas (Se tiver) */}
          {character.spellcasting && character.spellcasting.spells.length > 0 && (
            <div className="rpg-card p-4 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={18} />
                  <h3 className="font-serif text-sm font-bold text-indigo-200 uppercase tracking-wider">
                    Minhas Magias Rápidas
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Clique para conjurar e rolar dano ou cura automaticamente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {character.spellcasting.spells.slice(0, 6).map((spell) => (
                  <div
                    key={spell.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-indigo-950 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-indigo-100">
                          {spell.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                          {spell.level === 0 ? 'Truque' : `${spell.level}º Círculo`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {spell.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCastSpell(spell)}
                      className="w-full rpg-button bg-indigo-700 hover:bg-indigo-600 text-indigo-50 font-bold text-xs py-1.5 px-3 rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Sparkles size={13} className="text-indigo-300" />
                      <span>Conjurar {spell.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Testes Mais Comuns de Exploração (6 Perícias Essenciais) */}
          <div className="rpg-card p-4 rounded-2xl border border-amber-500/30 bg-slate-900/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className="text-amber-400" size={18} />
                <h3 className="font-serif text-sm font-bold text-amber-200 uppercase tracking-wider">
                  Testes Rápidos de Exploração (Perícias Mais Usadas)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Rola 1d20 somando seu bônus de perícia
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { key: 'perception' as SkillKey, name: 'Percepção', ability: 'wis' as AbilityKey, desc: 'Notar perigos e emboscadas', icon: Eye },
                { key: 'athletics' as SkillKey, name: 'Atletismo', ability: 'str' as AbilityKey, desc: 'Pular, escalar, empurrar', icon: Swords },
                { key: 'acrobatics' as SkillKey, name: 'Acrobacia', ability: 'dex' as AbilityKey, desc: 'Equilíbrio e esquivas ágeis', icon: Footprints },
                { key: 'stealth' as SkillKey, name: 'Furtividade', ability: 'dex' as AbilityKey, desc: 'Esconder-se em silêncio', icon: Moon },
                { key: 'investigation' as SkillKey, name: 'Investigação', ability: 'int' as AbilityKey, desc: 'Procurar pistas e segredos', icon: BookOpen },
                { key: 'persuasion' as SkillKey, name: 'Persuasão', ability: 'cha' as AbilityKey, desc: 'Negociar com guardas e NPCs', icon: Sparkles },
              ].map((item) => {
                const abilityScore = character.abilities[item.ability]?.score ?? 10;
                const abilityMod = Math.floor((abilityScore - 10) / 2);
                const profBonus = Math.floor(((character.level || 1) - 1) / 4) + 2;
                const prof = character.skills?.[item.key]?.proficiency ?? 'none';
                const bonus = abilityMod + (prof === 'expertise' ? profBonus * 2 : prof === 'proficient' ? profBonus : 0);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRollD20(`Perícia: ${item.name}`, bonus)}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-950 transition text-left flex flex-col justify-between space-y-1.5 group cursor-pointer active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent size={14} className="text-amber-400 group-hover:scale-110 transition" />
                      <span className="font-mono font-bold text-xs text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                        {formatModifier(bonus)}
                      </span>
                    </div>
                    <div>
                      <div className="font-serif text-xs font-bold text-slate-200 group-hover:text-amber-200 transition">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Guia Rápido de Ajuda ao Jogador */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 flex items-start gap-2.5">
            <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-100">
                💡 Como jogar no seu turno:
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                1. <strong>Movimento:</strong> Você pode andar até {character.speed || 9} metros.<br />
                2. <strong>Ação:</strong> Você pode atacar com uma arma ou conjurar uma magia com 1 clique nos botões acima.<br />
                3. <strong>Perícias:</strong> Quando o Mestre pedir um teste (ex: "role Percepção"), clique no botão correspondente!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                onUseCharge={(id, delta) => (consumeResourceCharge || useResourceCharge)?.(id, delta)}
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
      </>
    )}

      {/* Barra de Ações Rápidas (Macro Hotbar - 1 a 6) */}
      <QuickActionBar
        character={character}
        onRollAction={handleRollActionFromHotbar}
        updateCharacter={updateCharacter}
      />
    </div>
  );
};
