import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SRD_EQUIPMENT, type SRDEquipmentItem, type EquipmentCategory } from '../data/srdEquipment';
import type { InventoryItem, WeaponAttack } from '../types/dnd5e';
import { 
  X, 
  Search, 
  Shield, 
  Sword, 
  Backpack, 
  FlaskConical, 
  Sparkles, 
  Plus, 
  Check, 
  Weight, 
  Coins, 
  Crosshair 
} from 'lucide-react';

interface EquipmentCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onAddAttack?: (attack: Omit<WeaponAttack, 'id'>) => void;
  onUpdateAC?: (newAC: number) => void;
  currentDexMod: number;
  currentStrMod: number;
  profBonus: number;
}

const CATEGORIES: { id: EquipmentCategory | 'todas'; label: string; icon: React.ReactNode }[] = [
  { id: 'todas', label: 'Todos os Itens', icon: <Backpack className="w-4 h-4" /> },
  { id: 'armas', label: 'Armas', icon: <Sword className="w-4 h-4" /> },
  { id: 'armaduras', label: 'Armaduras & Escudos', icon: <Shield className="w-4 h-4" /> },
  { id: 'aventura', label: 'Equipamento de Aventura', icon: <Backpack className="w-4 h-4" /> },
  { id: 'pocoes', label: 'Poções & Consumíveis', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'magicos', label: 'Itens Mágicos', icon: <Sparkles className="w-4 h-4" /> },
];

export const EquipmentCompendiumModal: React.FC<EquipmentCompendiumModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  onAddAttack,
  onUpdateAC,
  currentDexMod,
  currentStrMod,
  profBonus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | 'todas'>('todas');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [addedAttacks, setAddedAttacks] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    return SRD_EQUIPMENT.filter((item) => {
      // Filtro de Texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesOriginal = item.originalName.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesName && !matchesOriginal && !matchesDesc) return false;
      }

      // Filtro de Categoria
      if (selectedCategory !== 'todas' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedCategory]);

  const handleAddToInventory = (item: SRDEquipmentItem) => {
    onAddItem({
      name: item.name,
      quantity: 1,
      weight: item.weight,
      notes: `${item.cost} • ${item.subcategory || item.description}`,
      equipped: item.category === 'armaduras',
    });
    setAddedItems((prev) => new Set([...prev, item.id]));
  };

  const handleAddAsAttack = (item: SRDEquipmentItem) => {
    if (!onAddAttack || !item.damage) return;

    // Calcular se usa Força ou Destreza (se tiver propriedade "Ágil" ou se for à distância, usa DES ou o maior)
    const isFinesse = item.properties?.some((p) => p.includes('Ágil'));
    const isRanged = item.subcategory?.includes('Distância');
    const abilityMod = (isFinesse ? Math.max(currentStrMod, currentDexMod) : (isRanged ? currentDexMod : currentStrMod));
    const attackBonus = profBonus + abilityMod;
    const bonusStr = abilityMod >= 0 ? `+ ${abilityMod}` : `- ${Math.abs(abilityMod)}`;

    onAddAttack({
      name: item.name,
      attackBonus,
      damage: `${item.damage} ${bonusStr}`,
      damageType: item.damageType || 'Dano',
      range: item.range || 'Corpo a corpo 1,5m',
      notes: item.properties?.join(', ') || '',
    });

    setAddedAttacks((prev) => new Set([...prev, item.id]));
  };

  const handleEquipArmor = (item: SRDEquipmentItem) => {
    if (!onUpdateAC || item.baseArmorClass === undefined) return;

    let calculatedAC = 10 + currentDexMod;
    if (item.subcategory === 'Escudo') {
      // Adiciona +2 à CA atual
      calculatedAC += 2;
    } else if (item.dexBonus === 'full') {
      calculatedAC = item.baseArmorClass + currentDexMod;
    } else if (item.dexBonus === 'max2') {
      calculatedAC = item.baseArmorClass + Math.min(2, Math.max(0, currentDexMod));
    } else if (item.dexBonus === 'none') {
      calculatedAC = item.baseArmorClass;
    }

    onUpdateAC(calculatedAC);
    handleAddToInventory(item);
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
        {/* Cabeçalho */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sword className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Compêndio de Equipamentos SRD 5.1
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Armas, armaduras, ferramentas e itens mágicos para equipar seu herói com 1 clique.
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

        {/* Busca e Abas */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar item ou arma por nome (ex: Espada Longa, Cota de Malha, Poção, Mochila)..."
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

          {/* Abas de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Backpack className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-500" />
              <p className="text-base font-serif text-slate-400">Nenhum equipamento encontrado</p>
              <p className="text-xs mt-1">Tente usar outros termos de busca ou mude a categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const wasAdded = addedItems.has(item.id);
                const attackAdded = addedAttacks.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-serif font-bold text-amber-300 group-hover:text-amber-200 transition">
                              {item.name}
                            </h3>
                            <span className="text-[10px] text-slate-400 italic">
                              ({item.originalName})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs">
                            <span className="text-slate-400 font-medium">
                              {item.subcategory || item.category.toUpperCase()}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-400/90 font-mono flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" />
                              {item.cost}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 flex items-center gap-1 font-mono">
                              <Weight className="w-3 h-3 text-slate-400" />
                              {item.weight} kg
                            </span>
                          </div>
                        </div>

                        {/* Botão de Adicionar ao Inventário */}
                        <button
                          onClick={() => handleAddToInventory(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                            wasAdded
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 active:scale-95'
                          }`}
                        >
                          {wasAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Adicionado (+1)
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Inventário
                            </>
                          )}
                        </button>
                      </div>

                      {/* Parâmetros Específicos: Dano ou CA */}
                      {item.damage && (
                        <div className="flex items-center gap-2 my-2 p-2 rounded-lg bg-red-950/30 border border-red-900/40 text-xs font-mono text-red-300">
                          <Sword className="w-3.5 h-3.5 text-red-400" />
                          <span>Dano: <strong>{item.damage} {item.damageType}</strong></span>
                          {item.range && <span className="text-slate-400 text-[11px]">({item.range})</span>}
                        </div>
                      )}

                      {item.baseArmorClass !== undefined && (
                        <div className="flex items-center gap-2 my-2 p-2 rounded-lg bg-blue-950/30 border border-blue-900/40 text-xs font-mono text-blue-300">
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            Defesa: <strong>{item.subcategory === 'Escudo' ? '+2 CA' : `CA ${item.baseArmorClass}`}</strong>
                            {item.dexBonus === 'full' && ' + Mod DES'}
                            {item.dexBonus === 'max2' && ' + Mod DES (máx +2)'}
                          </span>
                        </div>
                      )}

                      {/* Descrição */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                        {item.description}
                      </p>

                      {/* Propriedades da Arma */}
                      {item.properties && item.properties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.properties.map((prop, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-900/80 text-amber-300 text-[10px] border border-amber-900/30"
                            >
                              {prop}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ações Especiais no Rodapé */}
                    {(item.damage || item.baseArmorClass !== undefined) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-end gap-2">
                        {item.damage && onAddAttack && (
                          <button
                            onClick={() => handleAddAsAttack(item)}
                            disabled={attackAdded}
                            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
                              attackAdded
                                ? 'bg-slate-800 text-slate-400 cursor-default'
                                : 'bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/50'
                            }`}
                          >
                            <Crosshair className="w-3 h-3 text-red-400" />
                            {attackAdded ? 'Ataque Cadastrado' : 'Criar Ataque na Ficha'}
                          </button>
                        )}

                        {item.baseArmorClass !== undefined && onUpdateAC && (
                          <button
                            onClick={() => handleEquipArmor(item)}
                            className="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 bg-blue-950/50 hover:bg-blue-900/60 text-blue-200 border border-blue-800/50 transition"
                          >
                            <Shield className="w-3 h-3 text-blue-400" />
                            Equipar e Atualizar CA
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Exibindo <strong>{filteredItems.length}</strong> de {SRD_EQUIPMENT.length} itens oficiais</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Fechar Compêndio
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
