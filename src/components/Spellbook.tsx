import React, { useState } from 'react';
import type { Character, Spell, AbilityKey } from '../types/dnd5e';
import { ABILITIES } from '../types/dnd5e';
import {
  getSpellSaveDC,
  getSpellAttackBonus,
  formatModifier,
} from '../utils/calculations';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Flame, 
  ShieldAlert, 
  Crosshair,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

import { SpellCompendiumModal } from './SpellCompendiumModal';

interface SpellbookProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  onToggleSpellSlot: (level: number, slotIndex: number) => void;
  onUpdateSpellSlotMax: (level: number, max: number) => void;
  onAddSpell: (spell: Omit<Spell, 'id'>) => void;
  onUpdateSpell: (id: string, updates: Partial<Spell>) => void;
  onDeleteSpell: (id: string) => void;
  onCastSpell: (spell: Spell) => void;
}

export const Spellbook: React.FC<SpellbookProps> = ({
  character,
  updateCharacter,
  onToggleSpellSlot,
  onUpdateSpellSlotMax,
  onAddSpell,
  onUpdateSpell,
  onDeleteSpell,
  onCastSpell,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Form states
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState(1);
  const [newSpellSchool, setNewSpellSchool] = useState('Evocação');
  const [newSpellCastingTime, setNewSpellCastingTime] = useState('1 Ação');
  const [newSpellRange, setNewSpellRange] = useState('18m');
  const [newSpellComponents, setNewSpellComponents] = useState('V, S');
  const [newSpellDuration, setNewSpellDuration] = useState('Instantânea');
  const [newSpellDesc, setNewSpellDesc] = useState('');

  const spellSaveDC = getSpellSaveDC(character);
  const spellAttackBonus = getSpellAttackBonus(character);

  const handleCreateSpell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpellName.trim()) return;

    onAddSpell({
      name: newSpellName.trim(),
      level: newSpellLevel,
      school: newSpellSchool,
      castingTime: newSpellCastingTime,
      range: newSpellRange,
      components: newSpellComponents,
      duration: newSpellDuration,
      description: newSpellDesc.trim(),
      prepared: true,
    });

    // Reset
    setNewSpellName('');
    setNewSpellDesc('');
    setShowAddForm(false);
  };

  const spellLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80 mb-6">
      {/* Cabeçalho do Grimório */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            Grimório de Magias & Conjuração
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie espaços de magia (spell slots), feitiços preparados e bônus de conjurador.
          </p>
        </div>

        {/* Estatísticas de Conjuração */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Atributo Conjurador */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Atributo:</span>
            <select
              value={character.spellcasting.ability}
              onChange={(e) =>
                updateCharacter((prev) => ({
                  ...prev,
                  spellcasting: {
                    ...prev.spellcasting,
                    ability: e.target.value as AbilityKey,
                  },
                }))
              }
              className="bg-slate-800 text-amber-300 font-bold rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="int">INT ({ABILITIES.int.name})</option>
              <option value="wis">SAB ({ABILITIES.wis.name})</option>
              <option value="cha">CAR ({ABILITIES.cha.name})</option>
            </select>
          </div>

          {/* CD de Magia */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-indigo-500/30 text-xs">
            <ShieldAlert size={14} className="text-indigo-400" />
            <span className="text-slate-400">CD Magia:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{spellSaveDC}</span>
          </div>

          {/* Bônus de Ataque de Magia */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs">
            <Crosshair size={14} className="text-amber-400" />
            <span className="text-slate-400">Ataque Mágico:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{formatModifier(spellAttackBonus)}</span>
          </div>
        </div>
      </div>

      {/* Gerenciamento de Espaços de Magia (Slots por Nível) */}
      <div className="mb-6 bg-slate-900/40 rounded-xl p-3 border border-slate-800">
        <h3 className="text-xs font-serif font-bold text-slate-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles size={13} className="text-indigo-400" />
          Espaços de Magia (Círculos 1 a 9)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {character.spellcasting.slots.map((slot) => {
            return (
              <div
                key={slot.level}
                className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex flex-col items-center justify-between"
              >
                <div className="flex items-center justify-between w-full text-[11px] mb-1 text-slate-400 font-medium">
                  <span>{slot.level}º Círc.</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={slot.max}
                    onChange={(e) =>
                      onUpdateSpellSlotMax(slot.level, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-6 text-center text-xs font-mono font-bold bg-slate-800 text-slate-200 rounded"
                    title="Quantidade máxima de slots para este círculo"
                  />
                </div>

                {/* Bolhas de Slots */}
                {slot.max === 0 ? (
                  <span className="text-[10px] text-slate-600 my-1">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1 justify-center my-1">
                    {Array.from({ length: slot.max }).map((_, idx) => {
                      const isUsed = idx < slot.used;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onToggleSpellSlot(slot.level, idx)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${
                            isUsed
                              ? 'bg-slate-800 border-slate-700 opacity-40'
                              : 'bg-indigo-500 border-indigo-400 shadow-sm shadow-indigo-500/50'
                          }`}
                          title={`Espaço ${idx + 1} (${isUsed ? 'Gasto' : 'Disponível'}). Clique para alternar.`}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="text-[10px] font-mono text-slate-500">
                  {slot.max - slot.used} disp.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botões de Adicionar Magia */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <h3 className="text-sm font-serif font-bold text-amber-200">Feitiços Conhecidos & Preparados</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompendium(true)}
            className="rpg-button bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-semibold shadow-sm"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Grimório Oficial (SRD)</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rpg-button bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 text-xs"
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Fechar' : 'Nova Manual'}</span>
          </button>
        </div>
      </div>

      {/* Formulário de Nova Magia */}
      {showAddForm && (
        <form onSubmit={handleCreateSpell} className="mb-4 p-3 bg-slate-900/90 rounded-lg border border-indigo-500/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in">
          <div>
            <label className="text-slate-400 block mb-1">Nome da Magia</label>
            <input
              type="text"
              placeholder="Ex: Bola de Fogo, Escudo Arcano"
              value={newSpellName}
              onChange={(e) => setNewSpellName(e.target.value)}
              className="rpg-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Círculo (0 = Truque)</label>
            <select
              value={newSpellLevel}
              onChange={(e) => setNewSpellLevel(parseInt(e.target.value, 10))}
              className="rpg-input w-full"
            >
              <option value={0}>0 (Truque / Cantrip)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}º Círculo</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Escola de Magia</label>
            <input
              type="text"
              placeholder="Evocação, Abjuração, etc."
              value={newSpellSchool}
              onChange={(e) => setNewSpellSchool(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tempo de Conjuração</label>
            <input
              type="text"
              placeholder="1 Ação, 1 Ação Bônus, Reação"
              value={newSpellCastingTime}
              onChange={(e) => setNewSpellCastingTime(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Alcance</label>
            <input
              type="text"
              placeholder="Pessoal, 1,5m, 18m, 36m"
              value={newSpellRange}
              onChange={(e) => setNewSpellRange(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Componentes</label>
            <input
              type="text"
              placeholder="V, S, M"
              value={newSpellComponents}
              onChange={(e) => setNewSpellComponents(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Duração</label>
            <input
              type="text"
              placeholder="Instantânea, 1 min, etc."
              value={newSpellDuration}
              onChange={(e) => setNewSpellDuration(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-slate-400 block mb-1">Descrição e Efeitos</label>
            <textarea
              rows={2}
              placeholder="Descreva o efeito, fórmulas de dano (ex: 8d6 fogo), salvaguardas necessárias..."
              value={newSpellDesc}
              onChange={(e) => setNewSpellDesc(e.target.value)}
              className="rpg-input w-full text-xs"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rpg-button bg-slate-800 text-slate-400 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rpg-button bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Salvar Magia
            </button>
          </div>
        </form>
      )}

      {/* Lista de Magias Separadas por Nível */}
      <div className="flex flex-col gap-4">
        {spellLevels.map((lvl) => {
          const spellsAtLevel = character.spellcasting.spells.filter((s) => s.level === lvl);
          if (spellsAtLevel.length === 0) return null;

          return (
            <div key={lvl} className="border border-slate-800 rounded-lg p-3 bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-bold text-amber-300">
                  {lvl === 0 ? 'Truques (Cantrips)' : `${lvl}º Círculo`}
                </span>
                <span className="text-[11px] text-slate-500">
                  {spellsAtLevel.length} {spellsAtLevel.length === 1 ? 'magia' : 'magias'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {spellsAtLevel.map((spell) => {
                  const isExpanded = expandedSpellId === spell.id;

                  return (
                    <div
                      key={spell.id}
                      className="rounded-lg bg-slate-900/70 border border-slate-800 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-2.5 gap-2 hover:bg-slate-800/40 transition">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Botão Preparada (se não for truque) */}
                          {spell.level > 0 && (
                            <button
                              type="button"
                              onClick={() => onUpdateSpell(spell.id, { prepared: !spell.prepared })}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                spell.prepared
                                  ? 'bg-indigo-600 border-indigo-400 text-white'
                                  : 'border-slate-600 bg-slate-800'
                              }`}
                              title={spell.prepared ? 'Magia Preparada' : 'Magia Não Preparada'}
                            >
                              {spell.prepared && <Check size={12} />}
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedSpellId(isExpanded ? null : spell.id)}
                            className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                          >
                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                            <span className="text-xs font-semibold text-slate-200 truncate hover:text-indigo-300">
                              {spell.name}
                            </span>
                            <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                              {spell.school}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Botão Conjurar */}
                          <button
                            onClick={() => onCastSpell(spell)}
                            className="rpg-button bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-xs py-0.5 px-2"
                            title="Conjurar magia (rola dados se houver fórmula e deduz slot se aplicável)"
                          >
                            <Flame size={12} className="text-amber-400" />
                            <span>Conjurar</span>
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => onDeleteSpell(spell.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded"
                            title="Remover magia"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Detalhes Expandidos */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-300 flex flex-col gap-1.5 animate-in fade-in">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                            <div><strong className="text-slate-300">Tempo:</strong> {spell.castingTime}</div>
                            <div><strong className="text-slate-300">Alcance:</strong> {spell.range}</div>
                            <div><strong className="text-slate-300">Comp:</strong> {spell.components}</div>
                            <div><strong className="text-slate-300">Duração:</strong> {spell.duration}</div>
                          </div>
                          <p className="whitespace-pre-line text-slate-300 text-xs leading-relaxed pt-1">
                            {spell.description || 'Sem descrição cadastrada.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {character.spellcasting.spells.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            Nenhuma magia adicionada ao grimório ainda. Clique em &quot;Grimório Oficial (SRD)&quot; ou &quot;Nova Manual&quot; para adicionar magias.
          </div>
        )}
      </div>

      {/* Modal do Compêndio Oficial de Magias SRD */}
      <SpellCompendiumModal
        isOpen={showCompendium}
        onClose={() => setShowCompendium(false)}
        onAddSpell={onAddSpell}
        characterSpells={character.spellcasting.spells}
        characterClass={character.characterClass}
      />
    </div>
  );
};
