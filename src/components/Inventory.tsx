import React, { useState } from 'react';
import type { Character, InventoryItem, Currency, WeaponAttack } from '../types/dnd5e';
import { getCarryingCapacity, getTotalInventoryWeight, getAbilityModifier, getProficiencyBonus } from '../utils/calculations';
import { 
  Backpack, 
  Coins, 
  Plus, 
  Trash2, 
  Weight, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { EquipmentCompendiumModal } from './EquipmentCompendiumModal';

interface InventoryProps {
  character: Character;
  updateCharacter: (updater: Partial<Character> | ((prev: Character) => Character)) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({
  character,
  updateCharacter,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0.5);
  const [notes, setNotes] = useState('');
  const [equipped, setEquipped] = useState(false);

  const currentDexMod = getAbilityModifier(character.abilities.dex.score);
  const currentStrMod = getAbilityModifier(character.abilities.str.score);
  const profBonus = getProficiencyBonus(character.level);

  const handleAddAttackFromCompendium = (attack: Omit<WeaponAttack, 'id'>) => {
    updateCharacter((prev) => ({
      ...prev,
      attacks: [
        ...prev.attacks,
        {
          id: `attack-${Date.now()}-${Math.random()}`,
          ...attack,
        },
      ],
    }));
  };

  const handleUpdateACFromCompendium = (newAC: number) => {
    updateCharacter({ armorClass: newAC });
  };

  const totalWeight = getTotalInventoryWeight(character);
  const { maxWeight, encumberedWeight } = getCarryingCapacity(character.abilities.str.score);

  const weightPercentage = Math.min(100, (totalWeight / (maxWeight || 1)) * 100);
  const isEncumbered = totalWeight > encumberedWeight;
  const isOverloaded = totalWeight > maxWeight;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    onAddItem({
      name: itemName.trim(),
      quantity: Math.max(1, quantity),
      weight: Math.max(0, weight),
      notes: notes.trim(),
      equipped,
    });

    setItemName('');
    setQuantity(1);
    setWeight(0.5);
    setNotes('');
    setEquipped(false);
    setShowAddForm(false);
  };

  const updateCoin = (coinType: keyof Currency, val: number) => {
    updateCharacter((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        [coinType]: Math.max(0, val || 0),
      },
    }));
  };

  return (
    <div className="rpg-card rounded-xl p-4 sm:p-5 border-slate-700/80 mb-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
            <Backpack size={18} className="text-amber-400" />
            Inventário & Moedas
          </h2>
          <p className="text-xs text-slate-400">
            Itens equipados, mantimentos e capacidade de carga calculada pela Força.
          </p>
        </div>

        {/* Bolsa de Moedas */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-1 text-xs text-amber-300 font-bold px-1">
            <Coins size={14} className="text-amber-400" />
            <span>Tesouro:</span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-amber-600 font-bold" title="Peças de Cobre">PC</span>
            <input
              type="number"
              min={0}
              value={character.currency.cp}
              onChange={(e) => updateCoin('cp', parseInt(e.target.value, 10))}
              className="w-12 text-center rpg-input py-0.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-300 font-bold" title="Peças de Prata">PP</span>
            <input
              type="number"
              min={0}
              value={character.currency.sp}
              onChange={(e) => updateCoin('sp', parseInt(e.target.value, 10))}
              className="w-12 text-center rpg-input py-0.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-amber-400 font-bold" title="Peças de Ouro">PO</span>
            <input
              type="number"
              min={0}
              value={character.currency.gp}
              onChange={(e) => updateCoin('gp', parseInt(e.target.value, 10))}
              className="w-14 text-center rpg-input py-0.5 text-xs font-mono font-bold text-amber-300"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-cyan-300 font-bold" title="Peças de Platina">PL</span>
            <input
              type="number"
              min={0}
              value={character.currency.pp}
              onChange={(e) => updateCoin('pp', parseInt(e.target.value, 10))}
              className="w-10 text-center rpg-input py-0.5 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Barra de Capacidade de Carga */}
      <div className="mb-5 bg-slate-900/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <Weight size={14} className={isOverloaded ? 'text-rose-400' : 'text-slate-400'} />
            <span className="font-semibold text-slate-300">Carga Transportada:</span>
            <span className={`font-mono font-bold ${isOverloaded ? 'text-rose-400' : 'text-amber-300'}`}>
              {totalWeight} kg
            </span>
            <span className="text-slate-500 font-mono">/ {maxWeight} kg máx</span>
          </div>

          {isOverloaded ? (
            <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px] animate-pulse">
              <AlertTriangle size={13} /> Sobrepeso Crítico! (Deslocamento cai para 1,5m)
            </span>
          ) : isEncumbered ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
              <AlertTriangle size={13} /> Sobrecarregado (Deslocamento -3m)
            </span>
          ) : (
            <span className="text-emerald-400 text-[11px]">Carga Normal</span>
          )}
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOverloaded
                ? 'bg-gradient-to-r from-rose-600 to-rose-500'
                : isEncumbered
                ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            }`}
            style={{ width: `${weightPercentage}%` }}
          />
        </div>
      </div>

      {/* Botões de Ação do Inventário */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <h3 className="text-sm font-serif font-bold text-amber-200">Itens na Mochila</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompendium(true)}
            className="rpg-button bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-semibold shadow-sm"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Compêndio de Itens (SRD)</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs"
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Cancelar' : 'Manual'}</span>
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar Item */}
      {showAddForm && (
        <form onSubmit={handleCreateItem} className="mb-4 p-3 bg-slate-900/90 rounded-lg border border-amber-500/30 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs animate-in fade-in">
          <div className="sm:col-span-2">
            <label className="text-slate-400 block mb-1">Nome do Item</label>
            <input
              type="text"
              placeholder="Ex: Poção de Cura, Corda de Seda 15m"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="rpg-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="rpg-input w-full"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Peso Unitário (kg)</label>
            <input
              type="number"
              step={0.1}
              min={0}
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="rpg-input w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-slate-400 block mb-1">Notas / Efeitos</label>
            <input
              type="text"
              placeholder="Ex: Recupera 2d4+2 PV, item mágico, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rpg-input w-full"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2 text-slate-300 select-none">
              <input
                type="checkbox"
                checked={equipped}
                onChange={(e) => setEquipped(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-amber-500 cursor-pointer"
              />
              <span>Equipado</span>
            </label>
          </div>

          <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
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
              Salvar Item
            </button>
          </div>
        </form>
      )}

      {/* Lista de Itens */}
      <div className="flex flex-col gap-1.5">
        {character.inventory.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
              item.equipped
                ? 'bg-amber-950/20 border-amber-500/30'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button
                onClick={() => onUpdateItem(item.id, { equipped: !item.equipped })}
                className={`p-1 rounded transition ${
                  item.equipped
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
                title={item.equipped ? 'Item Equipado (clique para desequipar)' : 'Clique para equipar'}
              >
                <ShieldCheck size={16} />
              </button>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold truncate ${item.equipped ? 'text-amber-200' : 'text-slate-200'}`}>
                    {item.name}
                  </span>
                  {item.equipped && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1 rounded border border-amber-500/40">
                      Equipado
                    </span>
                  )}
                </div>
                {item.notes && (
                  <span className="text-[11px] text-slate-400 truncate">{item.notes}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quantidade */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[10px]">Qtd:</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                  }
                  className="w-10 text-center rpg-input py-0.5 text-xs font-mono"
                />
              </div>

              {/* Peso Total do Item */}
              <span className="text-xs font-mono text-slate-400 w-16 text-right">
                {Math.round(item.quantity * item.weight * 10) / 10} kg
              </span>

              {/* Deletar */}
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                title="Remover item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {character.inventory.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            A mochila está vazia. Adicione equipamentos, provisões ou itens mágicos!
          </div>
        )}
      </div>

      {/* Modal do Compêndio Oficial de Equipamentos SRD */}
      <EquipmentCompendiumModal
        isOpen={showCompendium}
        onClose={() => setShowCompendium(false)}
        onAddItem={onAddItem}
        onAddAttack={handleAddAttackFromCompendium}
        onUpdateAC={handleUpdateACFromCompendium}
        currentDexMod={currentDexMod}
        currentStrMod={currentStrMod}
        profBonus={profBonus}
      />
    </div>
  );
};
