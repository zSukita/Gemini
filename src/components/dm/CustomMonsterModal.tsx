import React, { useState } from 'react';
import type { Combatant } from '../../types/combat';
import { UserPlus, X } from 'lucide-react';

interface CustomMonsterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomCombatant: (combatant: Omit<Combatant, 'id'>) => void;
}

export const CustomMonsterModal: React.FC<CustomMonsterModalProps> = ({
  isOpen,
  onClose,
  onAddCustomCombatant,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'monster' | 'npc'>('monster');
  const [ac, setAc] = useState(13);
  const [hp, setHp] = useState(25);
  const [initiative, setInitiative] = useState(10);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCustomCombatant({
      name: name.trim(),
      type,
      armorClass: ac,
      maxHp: hp,
      currentHp: hp,
      tempHp: 0,
      initiative,
      conditions: [],
      notes: notes.trim(),
    });

    setName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-md rounded-2xl p-5 border border-amber-500/40 shadow-2xl animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Criar Monstro / NPC Customizado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Nome do Combatente</label>
            <input
              type="text"
              placeholder="Ex: Chefe Bandido, Guarda da Cidade"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rpg-input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'monster' | 'npc')}
                className="rpg-input w-full"
              >
                <option value="monster">Monstro / Inimigo</option>
                <option value="npc">NPC Neutro / Aliado</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Iniciativa Inicial</label>
              <input
                type="number"
                value={initiative}
                onChange={(e) => setInitiative(parseInt(e.target.value, 10) || 0)}
                className="rpg-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Classe de Armadura (CA)</label>
              <input
                type="number"
                min={1}
                value={ac}
                onChange={(e) => setAc(parseInt(e.target.value, 10) || 10)}
                className="rpg-input w-full"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Pontos de Vida Máximos (PV)</label>
              <input
                type="number"
                min={1}
                value={hp}
                onChange={(e) => setHp(parseInt(e.target.value, 10) || 1)}
                className="rpg-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Notas / Ataques / Habilidades</label>
            <textarea
              rows={3}
              placeholder="Ex: Ataque Espada +5 (1d8+3), Resistência a frio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rpg-button bg-slate-800 text-slate-400 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Adicionar ao Combate
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
