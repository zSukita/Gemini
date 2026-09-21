import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SRD_SPELLS, type SRDSpell } from '../data/srdSpells';
import type { Spell } from '../types/dnd5e';
import { 
  X, 
  Search, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Check, 
  Flame 
} from 'lucide-react';

interface SpellCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpell: (spell: Omit<Spell, 'id'>) => void;
  characterSpells: Spell[];
  characterClass?: string;
}

const CIRCLES = [
  { label: 'Todos', value: -1 },
  { label: 'Truques', value: 0 },
  { label: '1º Círculo', value: 1 },
  { label: '2º Círculo', value: 2 },
  { label: '3º Círculo', value: 3 },
  { label: '4º Círculo', value: 4 },
  { label: '5º Círculo', value: 5 },
  { label: '6º Círculo', value: 6 },
  { label: '7º Círculo', value: 7 },
  { label: '8º Círculo', value: 8 },
  { label: '9º Círculo', value: 9 },
];

const CLASSES = [
  'Todas',
  'Mago',
  'Clérigo',
  'Druida',
  'Feiticeiro',
  'Bardo',
  'Bruxo',
  'Paladino',
  'Patrulheiro',
];

const SCHOOLS = [
  'Todas',
  'Abjuração',
  'Adivinhação',
  'Conjuração',
  'Encantamento',
  'Evocação',
  'Ilusão',
  'Necromancia',
  'Transmutação',
];

export const SpellCompendiumModal: React.FC<SpellCompendiumModalProps> = ({
  isOpen,
  onClose,
  onAddSpell,
  characterSpells,
  characterClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<number>(-1);
  const [selectedClass, setSelectedClass] = useState<string>(
    characterClass && CLASSES.includes(characterClass) ? characterClass : 'Todas'
  );
  const [selectedSchool, setSelectedSchool] = useState<string>('Todas');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Verificar quais magias o personagem já possui na ficha
  const existingNames = useMemo(() => {
    return new Set(characterSpells.map((s) => s.name.toLowerCase().trim()));
  }, [characterSpells]);

  const filteredSpells = useMemo(() => {
    return SRD_SPELLS.filter((spell) => {
      // Filtro de Texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = spell.name.toLowerCase().includes(query);
        const matchesOriginal = spell.originalName.toLowerCase().includes(query);
        const matchesDesc = spell.description.toLowerCase().includes(query);
        if (!matchesName && !matchesOriginal && !matchesDesc) return false;
      }

      // Filtro de Círculo
      if (selectedCircle !== -1 && spell.level !== selectedCircle) {
        return false;
      }

      // Filtro de Classe
      if (selectedClass !== 'Todas' && !spell.classes.includes(selectedClass)) {
        return false;
      }

      // Filtro de Escola
      if (selectedSchool !== 'Todas' && spell.school !== selectedSchool) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedCircle, selectedClass, selectedSchool]);

  const handleAdd = (spell: SRDSpell) => {
    onAddSpell({
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castingTime: spell.castingTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      description: spell.description,
      prepared: true,
    });

    setAddedIds((prev) => new Set([...prev, spell.id]));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="rpg-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border-amber-900/60 shadow-2xl overflow-hidden bg-slate-900/98 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Grimório */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Compêndio de Magias SRD 5.1
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Explore magias oficiais e adicione-as ao grimório da sua ficha com 1 clique.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar magia por nome (ex: Bola de Fogo, Fireball, Cura)..."
                className="rpg-input w-full pl-10 pr-4 py-2 text-sm bg-slate-950/80"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Seletor de Classe */}
            <div className="flex items-center gap-2 sm:w-48">
              <label className="text-xs text-slate-400 whitespace-nowrap">Classe:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rpg-input text-xs py-2 bg-slate-950/80 flex-1"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Escola */}
            <div className="flex items-center gap-2 sm:w-48">
              <label className="text-xs text-slate-400 whitespace-nowrap">Escola:</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="rpg-input text-xs py-2 bg-slate-950/80 flex-1"
              >
                {SCHOOLS.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Abas de Círculo (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CIRCLES.map((c) => {
              const isSelected = selectedCircle === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setSelectedCircle(c.value)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Magias Filtradas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredSpells.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-500" />
              <p className="text-base font-serif text-slate-400">Nenhuma magia encontrada</p>
              <p className="text-xs mt-1">Tente ajustar seus filtros de busca, classe ou círculo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSpells.map((spell) => {
                const isAlreadyInSheet = existingNames.has(spell.name.toLowerCase().trim());
                const wasJustAdded = addedIds.has(spell.id);

                return (
                  <div
                    key={spell.id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Topo do card */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-serif font-bold text-amber-300 group-hover:text-amber-200 transition">
                              {spell.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 italic">
                              ({spell.originalName})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="font-semibold text-amber-400/90">
                              {spell.level === 0 ? 'Truque' : `${spell.level}º Círculo`}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{spell.school}</span>
                            {spell.concentration && (
                              <span className="px-1.5 py-0.2 bg-purple-900/50 text-purple-300 rounded text-[10px] border border-purple-700/40 font-mono">
                                Conc.
                              </span>
                            )}
                            {spell.ritual && (
                              <span className="px-1.5 py-0.2 bg-emerald-900/50 text-emerald-300 rounded text-[10px] border border-emerald-700/40 font-mono">
                                Ritual
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Adicionar */}
                        <button
                          onClick={() => handleAdd(spell)}
                          disabled={isAlreadyInSheet || wasJustAdded}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                            isAlreadyInSheet || wasJustAdded
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 cursor-default'
                              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 hover:shadow-amber-500/20 active:scale-95'
                          }`}
                        >
                          {isAlreadyInSheet || wasJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              No Grimório
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Adicionar
                            </>
                          )}
                        </button>
                      </div>

                      {/* Parâmetros Rápidos */}
                      <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 bg-slate-900/70 p-2 rounded-lg border border-slate-800 my-2">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Tempo</span>
                          <span className="truncate block">{spell.castingTime}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Alcance</span>
                          <span className="truncate block">{spell.range}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Duração</span>
                          <span className="truncate block">{spell.duration}</span>
                        </div>
                      </div>

                      {/* Dano / Cura em destaque */}
                      {spell.damageOrHealing && (
                        <div className="text-[11px] text-amber-300 font-mono mb-2 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Efeito / Dano: <strong>{spell.damageOrHealing}</strong></span>
                        </div>
                      )}

                      {/* Descrição */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                        {spell.description}
                      </p>
                    </div>

                    {/* Rodapé do Card: Classes */}
                    <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Classes: {spell.classes.join(', ')}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Comp: {spell.components}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Exibindo <strong>{filteredSpells.length}</strong> de {SRD_SPELLS.length} magias</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Fechar Grimório
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
