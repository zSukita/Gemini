import React, { useState } from 'react';
import type { CharacterResource, ResourceResetType } from '../types/dnd5e';
import {
  Flame,
  Plus,
  Trash2,
  Minus,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CharacterResourcesProps {
  resources: CharacterResource[];
  onAddResource: (resource: Omit<CharacterResource, 'id'>) => void;
  onUpdateResource: (id: string, updates: Partial<CharacterResource>) => void;
  onDeleteResource: (id: string) => void;
  onUseCharge: (id: string, delta: number) => void;
}

const COMMON_RESOURCES: { name: string; max: number; resetOn: ResourceResetType; desc: string }[] = [
  { name: 'Fúria', max: 2, resetOn: 'long', desc: 'Bárbaro: Resistência e dano bônus' },
  { name: 'Surto de Ação', max: 1, resetOn: 'short', desc: 'Guerreiro: Uma ação adicional no turno' },
  { name: 'Retomar o Fôlego', max: 1, resetOn: 'short', desc: 'Guerreiro: Cura 1d10 + Nível' },
  { name: 'Pontos de Chi', max: 2, resetOn: 'short', desc: 'Monge: Habilidades marciais e artes' },
  { name: 'Canalizar Divindade', max: 1, resetOn: 'short', desc: 'Clérigo / Paladino' },
  { name: 'Inspiração de Bardo', max: 3, resetOn: 'long', desc: 'Bardo: Dado de apoio aos aliados' },
  { name: 'Pontos de Feitiçaria', max: 2, resetOn: 'long', desc: 'Feiticeiro: Metamagia e slots' },
  { name: 'Forma Selvagem', max: 2, resetOn: 'short', desc: 'Druida: Transformação em fera' },
  { name: 'Imposição de Mãos', max: 5, resetOn: 'long', desc: 'Paladino: Pontos de cura por toque' },
];

export const CharacterResources: React.FC<CharacterResourcesProps> = ({
  resources,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onUseCharge,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [max, setMax] = useState(2);
  const [resetOn, setResetOn] = useState<ResourceResetType>('short');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddResource({
      name: name.trim(),
      max: Math.max(1, max),
      current: Math.max(1, max),
      resetOn,
    });
    setName('');
    setMax(2);
    setResetOn('short');
    setShowAddModal(false);
  };

  const handleQuickAdd = (preset: typeof COMMON_RESOURCES[0]) => {
    onAddResource({
      name: preset.name,
      max: preset.max,
      current: preset.max,
      resetOn: preset.resetOn,
      description: preset.desc,
    });
    setShowAddModal(false);
  };

  return (
    <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80 mb-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="text-amber-400" size={18} />
          <h3 className="text-base font-serif font-bold text-amber-200">
            Recursos de Classe & Habilidades
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rpg-button bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs py-1 px-3 flex items-center gap-1.5 font-bold"
        >
          <Plus size={14} />
          <span>Novo Recurso</span>
        </button>
      </div>

      {/* Lista de Recursos Ativos */}
      {resources.length === 0 ? (
        <div className="bg-slate-950/60 rounded-xl p-6 text-center border border-slate-800/80">
          <Zap size={28} className="text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Nenhum recurso de classe rastreado ainda (ex: Fúria, Chi, Surto de Ação).
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition"
          >
            <Plus size={14} />
            <span>Adicionar Recurso de Classe</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {resources.map((res) => {
            const isExhausted = res.current <= 0;

            return (
              <div
                key={res.id}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                  isExhausted
                    ? 'bg-slate-950/70 border-slate-800/80 opacity-70'
                    : 'bg-slate-900/80 border-slate-700/80 shadow-md shadow-black/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{res.name}</span>
                    </h4>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border inline-block mt-1 ${
                        res.resetOn === 'short'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : res.resetOn === 'long'
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {res.resetOn === 'short'
                        ? 'Descanso Curto'
                        : res.resetOn === 'long'
                        ? 'Descanso Longo'
                        : 'Manual'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteResource(res.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                    title="Excluir recurso"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Caixas de Carga / Pips clicáveis */}
                <div className="flex flex-wrap items-center gap-1.5 my-1">
                  {Array.from({ length: res.max }).map((_, pipIdx) => {
                    const isAvailable = pipIdx < res.current;

                    return (
                      <button
                        key={pipIdx}
                        type="button"
                        onClick={() => onUseCharge(res.id, isAvailable ? -1 : 1)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isAvailable
                            ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                        }`}
                        title={isAvailable ? 'Clique para gastar 1 carga' : 'Clique para restaurar 1 carga'}
                      >
                        <Flame size={12} fill={isAvailable ? 'currentColor' : 'none'} />
                      </button>
                    );
                  })}
                </div>

                {/* Controles de Número e Recarga */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUseCharge(res.id, -1)}
                      disabled={res.current <= 0}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                      title="Gastar 1 uso"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-mono font-bold px-1 text-amber-300">
                      {res.current} / {res.max}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUseCharge(res.id, 1)}
                      disabled={res.current >= res.max}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                      title="Restaurar 1 uso"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateResource(res.id, { current: res.max })}
                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1 text-[10px] transition"
                    title="Restaurar todas as cargas"
                  >
                    <RotateCcw size={11} />
                    <span>Recarregar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Adicionar Novo Recurso */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="rpg-card w-full max-w-lg rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-serif font-bold text-amber-300 flex items-center gap-2">
                <Sparkles size={16} />
                <span>Adicionar Recurso de Classe</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Modelos Prontos do D&D 5e */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sugestões Rápidas (D&D 5e):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_RESOURCES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAdd(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 text-xs font-medium transition"
                    title={preset.desc}
                  >
                    + {preset.name} ({preset.max}x)
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Ou crie um personalizado:
              </span>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Nome do Recurso</label>
                  <input
                    type="text"
                    placeholder="Ex: Fúria, Metamagia, Fôlego..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rpg-input w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Cargas Máximas</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={max}
                      onChange={(e) => setMax(parseInt(e.target.value, 10) || 1)}
                      className="rpg-input w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Recupera em</label>
                    <select
                      value={resetOn}
                      onChange={(e) => setResetOn(e.target.value as ResourceResetType)}
                      className="rpg-input w-full text-xs"
                    >
                      <option value="short">Descanso Curto</option>
                      <option value="long">Descanso Longo</option>
                      <option value="manual">Apenas Manual</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rpg-button bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs shadow"
                  >
                    Criar Recurso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
