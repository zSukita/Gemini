import React, { useState } from 'react';
import type { Character, CharacterFeature } from '../types/dnd5e';
import { Sparkles, Plus, Trash2, ScrollText, User } from 'lucide-react';

interface FeaturesAndTraitsProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  onAddFeature: (feature: Omit<CharacterFeature, 'id'>) => void;
  onDeleteFeature: (id: string) => void;
}

export const FeaturesAndTraits: React.FC<FeaturesAndTraitsProps> = ({
  character,
  updateCharacter,
  onAddFeature,
  onDeleteFeature,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [featName, setFeatName] = useState('');
  const [featSource, setFeatSource] = useState('');
  const [featDesc, setFeatDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featName.trim()) return;

    onAddFeature({
      name: featName.trim(),
      source: featSource.trim() || 'Geral',
      description: featDesc.trim(),
    });

    setFeatName('');
    setFeatSource('');
    setFeatDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Coluna 1: Habilidades e Características Especiais */}
      <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Características & Talentos
            </h2>
            <p className="text-xs text-slate-400">
              Poderes raciais, habilidades de classe e talentos especiais.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rpg-button bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs"
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Cancelar' : 'Novo Talento'}</span>
          </button>
        </div>

        {/* Formulário Novo Talento */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="mb-4 p-3 bg-slate-900/90 rounded-lg border border-amber-500/30 flex flex-col gap-2 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Nome da Característica</label>
                <input
                  type="text"
                  placeholder="Ex: Surto de Ação, Visão no Escuro"
                  value={featName}
                  onChange={(e) => setFeatName(e.target.value)}
                  className="rpg-input w-full"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Origem / Fonte</label>
                <input
                  type="text"
                  placeholder="Ex: Guerreiro 2, Humano, Talento"
                  value={featSource}
                  onChange={(e) => setFeatSource(e.target.value)}
                  className="rpg-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Descrição</label>
              <textarea
                rows={2}
                placeholder="Descreva as regras e como usar esta habilidade..."
                value={featDesc}
                onChange={(e) => setFeatDesc(e.target.value)}
                className="rpg-input w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rpg-button bg-slate-800 text-slate-400 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Salvar Característica
              </button>
            </div>
          </form>
        )}

        {/* Lista de Características */}
        <div className="flex flex-col gap-2.5">
          {character.features.map((feat) => (
            <div
              key={feat.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-200">{feat.name}</span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {feat.source}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteFeature(feat.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Remover característica"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}

          {character.features.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs italic">
              Nenhuma característica adicionada ainda.
            </div>
          )}
        </div>

        {/* Idiomas e Outras Proficiências */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <label className="text-xs font-serif font-bold text-amber-200 block mb-1.5 flex items-center gap-1.5">
            <ScrollText size={14} className="text-amber-400" />
            Outras Proficiências & Idiomas
          </label>
          <textarea
            rows={3}
            value={character.proficienciesAndLanguages}
            onChange={(e) => updateCharacter({ proficienciesAndLanguages: e.target.value })}
            placeholder="Ex: Armaduras, armas, ferramentas de ladrão, Comum, Élfico, Dracônico..."
            className="rpg-input w-full text-xs"
          />
        </div>
      </div>

      {/* Coluna 2: Personalidade, Ideais, Vínculos, Defeitos & Anotações */}
      <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80 flex flex-col justify-between">
        <div>
          <div className="mb-4 pb-3 border-b border-slate-800">
            <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
              <User size={18} className="text-amber-400" />
              Interpretação & Personalidade (Roleplay)
            </h2>
            <p className="text-xs text-slate-400">
              Essência do personagem para enriquecer a narrativa na mesa de RPG.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Traços de Personalidade</label>
              <textarea
                rows={2}
                value={character.personalityTraits}
                onChange={(e) => updateCharacter({ personalityTraits: e.target.value })}
                placeholder="Como seu personagem se comporta no dia a dia?"
                className="rpg-input w-full"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Ideais</label>
              <textarea
                rows={2}
                value={character.ideals}
                onChange={(e) => updateCharacter({ ideals: e.target.value })}
                placeholder="No que ele mais acredita? O que guia suas ações?"
                className="rpg-input w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Vínculos</label>
                <textarea
                  rows={2}
                  value={character.bonds}
                  onChange={(e) => updateCharacter({ bonds: e.target.value })}
                  placeholder="Pessoas ou lugares importantes..."
                  className="rpg-input w-full"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Defeitos</label>
                <textarea
                  rows={2}
                  value={character.flaws}
                  onChange={(e) => updateCharacter({ flaws: e.target.value })}
                  placeholder="Fraquezas ou vícios..."
                  className="rpg-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Histórico & Anotações de Campanha</label>
              <textarea
                rows={3}
                value={character.notes}
                onChange={(e) => updateCharacter({ notes: e.target.value })}
                placeholder="Missões ativas, pistas de NPCs, recompensas prometidas..."
                className="rpg-input w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
