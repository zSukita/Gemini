import React, { useState } from 'react';
import type { WeaponAttack } from '../types/dnd5e';
import { formatModifier } from '../utils/calculations';
import { Swords, Plus, Trash2, Dices, Crosshair } from 'lucide-react';

interface AttacksSectionProps {
  attacks: WeaponAttack[];
  onRollAttack: (weaponName: string, attackBonus: number) => void;
  onRollDamage: (weaponName: string, damageFormula: string) => void;
  onAddAttack: (attack: Omit<WeaponAttack, 'id'>) => void;
  onDeleteAttack: (id: string) => void;
}

export const AttacksSection: React.FC<AttacksSectionProps> = ({
  attacks,
  onRollAttack,
  onRollDamage,
  onAddAttack,
  onDeleteAttack,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [attackBonus, setAttackBonus] = useState<number>(5);
  const [damage, setDamage] = useState('1d8 + 3');
  const [damageType, setDamageType] = useState('Cortante');
  const [range, setRange] = useState('Corpo a corpo (1,5m)');
  const [notes, setNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddAttack({
      name: name.trim(),
      attackBonus,
      damage: damage.trim() || '1d6',
      damageType: damageType.trim() || 'Dano',
      range: range.trim() || '1,5m',
      notes: notes.trim(),
    });

    // Reset
    setName('');
    setDamage('1d8 + 3');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80 mb-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
          <Swords size={18} className="text-amber-400" />
          Ataques & Conjurações de Combate
        </h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rpg-button bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Cancelar' : 'Adicionar Arma / Ataque'}</span>
        </button>
      </div>

      {/* Formulário para Adicionar Ataque */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 bg-slate-900/90 rounded-lg border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in">
          <div>
            <label className="text-slate-400 block mb-1">Nome da Arma / Magia</label>
            <input
              type="text"
              placeholder="Ex: Espada Longa, Raio de Fogo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rpg-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Bônus de Ataque (+X)</label>
            <input
              type="number"
              value={attackBonus}
              onChange={(e) => setAttackBonus(parseInt(e.target.value, 10) || 0)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Fórmula de Dano</label>
            <input
              type="text"
              placeholder="Ex: 1d8 + 3, 2d6"
              value={damage}
              onChange={(e) => setDamage(e.target.value)}
              className="rpg-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tipo de Dano</label>
            <input
              type="text"
              placeholder="Cortante, Perfurante, Fogo..."
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Alcance</label>
            <input
              type="text"
              placeholder="Ex: 1,5m ou 9m / 36m"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Propriedades / Notas</label>
            <input
              type="text"
              placeholder="Ex: Versátil (1d10), Finesse"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rpg-button bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Salvar Ataque
            </button>
          </div>
        </form>
      )}

      {/* Tabela / Lista de Ataques */}
      {attacks.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs italic">
          Nenhum ataque cadastrado. Clique em &quot;Adicionar Arma / Ataque&quot; acima para incluir seus golpes e feitiços.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {attacks.map((atk) => (
            <div
              key={atk.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition gap-3"
            >
              {/* Informações da Arma */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100 truncate">
                    {atk.name}
                  </span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {atk.range}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-amber-300/90 font-mono font-semibold">
                    {atk.damage} ({atk.damageType})
                  </span>
                  {atk.notes && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 italic text-[11px]">{atk.notes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Rolagem (Acerto e Dano) */}
              <div className="flex items-center gap-2">
                {/* Rolar Acerto */}
                <button
                  onClick={() => onRollAttack(atk.name, atk.attackBonus)}
                  className="rpg-button bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 hover:border-amber-500/50 text-xs font-mono font-bold"
                  title={`Rolar Ataque (d20 ${formatModifier(atk.attackBonus)})`}
                >
                  <Crosshair size={13} className="text-amber-400" />
                  <span>Acerto {formatModifier(atk.attackBonus)}</span>
                </button>

                {/* Rolar Dano */}
                <button
                  onClick={() => onRollDamage(`${atk.name} (Dano)`, atk.damage)}
                  className="rpg-button bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-700 text-xs font-mono font-bold"
                  title={`Rolar Dano (${atk.damage})`}
                >
                  <Dices size={13} className="text-rose-400" />
                  <span>Dano</span>
                </button>

                {/* Excluir */}
                <button
                  onClick={() => onDeleteAttack(atk.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Remover ataque"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
