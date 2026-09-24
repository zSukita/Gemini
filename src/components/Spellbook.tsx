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

interface SpellbookProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  onToggleSpellSlot: (level: number, slotIndex: number) => void;
  onUpdateSpellSlotMax: (level: number, max: number) => void;
  onAddSpell: (spell: Omit<Spell, 'id'>) => void;
  onUpdateSpell: (id: string, updates: Partial<Spell>) => void;
  onDeleteSpell: (id: string) => void;
  onCastSpell: (spell: Spell) => void;
  onOpenCompendium?: () => void;
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
  onOpenCompendium,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Form de Nova Magia Manual
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState<number>(0);
  const [newSpellSchool, setNewSpellSchool] = useState('Evocação');
  const [newSpellCastingTime, setNewSpellCastingTime] = useState('1 ação');
  const [newSpellRange, setNewSpellRange] = useState('18 metros');
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
                          onClick={() => onToggleSpellSlot(slot.level, idx)}
                          className={`w-3.5 h-3.5 rounded-full border transition-all ${
                            isUsed
                              ? 'bg-slate-950 border-slate-700 opacity-40'
                              : 'bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                          }`}
                          title={isUsed ? 'Espaço de magia gasto' : 'Espaço disponível (clique para gastar)'}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="text-[10px] text-slate-500 mt-0.5">
                  {slot.max - slot.used}/{slot.max}
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
            onClick={() => onOpenCompendium?.()}
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
            <label className="text-slate-400 block mb-1">Círculo / Nível</label>
            <select
              value={newSpellLevel}
              onChange={(e) => setNewSpellLevel(parseInt(e.target.value, 10))}
              className="rpg-input w-full"
            >
              <option value={0}>Truque (Nível 0)</option>
              {spellLevels.slice(1).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}º Círculo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Escola de Magia</label>
            <input
              type="text"
              placeholder="Ex: Evocação, Abjuração"
              value={newSpellSchool}
              onChange={(e) => setNewSpellSchool(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tempo de Conjuração</label>
            <input
              type="text"
              placeholder="Ex: 1 ação, 1 reação"
              value={newSpellCastingTime}
              onChange={(e) => setNewSpellCastingTime(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Alcance</label>
            <input
              type="text"
              placeholder="Ex: 18 metros, Toque, Pessoal"
              value={newSpellRange}
              onChange={(e) => setNewSpellRange(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Componentes</label>
            <input
              type="text"
              placeholder="Ex: V, S, M (uma pena)"
              value={newSpellComponents}
              onChange={(e) => setNewSpellComponents(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-400 block mb-1">Duração</label>
            <input
              type="text"
              placeholder="Ex: Instantânea, Concentração (1 min)"
              value={newSpellDuration}
              onChange={(e) => setNewSpellDuration(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-slate-400 block mb-1">Descrição dos Efeitos</label>
            <textarea
              rows={2}
              placeholder="Descreva o que a magia faz, danos e testes de resistência..."
              value={newSpellDesc}
              onChange={(e) => setNewSpellDesc(e.target.value)}
              className="rpg-input w-full resize-none"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
            >
              Adicionar ao Grimório
            </button>
          </div>
        </form>
      )}

      {/* Lista de Magias por Círculo */}
      <div className="flex flex-col gap-4">
        {spellLevels.map((level) => {
          const spellsInLevel = character.spellcasting.spells.filter((s) => s.level === level);
          if (spellsInLevel.length === 0) return null;

          return (
            <div key={level} className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/30">
              <div className="bg-slate-900/60 px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
                <span className="font-serif font-bold text-xs text-indigo-300">
                  {level === 0 ? 'Truques (Nível 0)' : `${level}º Círculo`}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {spellsInLevel.length} {spellsInLevel.length === 1 ? 'magia' : 'magias'}
                </span>
              </div>

              <div className="divide-y divide-slate-800/50">
                {spellsInLevel.map((spell) => {
                  const isExpanded = expandedSpellId === spell.id;

                  return (
                    <div key={spell.id} className="p-3 hover:bg-slate-900/40 transition">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Preparada Toggle (truques sempre preparados) */}
                          {level > 0 && (
                            <button
                              onClick={() =>
                                onUpdateSpell(spell.id, { prepared: !spell.prepared })
                              }
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                spell.prepared
                                  ? 'bg-amber-500 border-amber-400 text-slate-950'
                                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                              }`}
                              title={spell.prepared ? 'Magia preparada' : 'Não preparada'}
                            >
                              {spell.prepared && <Check size={11} strokeWidth={3} />}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setExpandedSpellId(isExpanded ? null : spell.id)
                            }
                            className="flex items-center gap-1.5 text-left font-serif font-bold text-xs text-slate-200 hover:text-amber-300 transition truncate"
                          >
                            {isExpanded ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                            <span className="truncate">{spell.name}</span>
                          </button>

                          <span className="text-[10px] text-slate-500 italic hidden sm:inline truncate">
                            {spell.school}
                          </span>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onCastSpell(spell)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-indigo-100 border border-indigo-500/30 text-[11px] font-semibold transition"
                            title="Conjurar magia no chat"
                          >
                            <Flame size={12} className="text-amber-400" />
                            <span>Conjurar</span>
                          </button>

                          <button
                            onClick={() => onDeleteSpell(spell.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remover magia do grimório"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Detalhes Expandidos da Magia */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/40 p-2.5 rounded-lg animate-in fade-in">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Tempo:</span>
                            <span>{spell.castingTime}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Alcance:</span>
                            <span>{spell.range}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Componentes:</span>
                            <span>{spell.components}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duração:</span>
                            <span>{spell.duration}</span>
                          </div>
                          {spell.description && (
                            <div className="col-span-2 sm:col-span-4 mt-1 pt-1 border-t border-slate-800 text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                              {spell.description}
                            </div>
                          )}
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
    </div>
  );
};
