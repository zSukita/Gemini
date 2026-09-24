import React, { useState, useEffect, useCallback } from 'react';
import type { Character, QuickAction } from '../types/dnd5e';
import { 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeftRight,
  Swords, 
  Sparkles, 
  Dices, 
  Heart, 
  Settings2, 
  X,
  Plus
} from 'lucide-react';

interface QuickActionBarProps {
  character: Character;
  onRollAction: (name: string, bonus: number, formula?: string) => void;
  updateCharacter: (updates: Partial<Character>) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  character,
  onRollAction,
  updateCharacter,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [activePressedSlot, setActivePressedSlot] = useState<number | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  // Inicializar slots padrão se não houver quickActions definidas
  const getSlots = useCallback((): (QuickAction | null)[] => {
    const saved = character.quickActions || [];
    const slots: (QuickAction | null)[] = [null, null, null, null, null, null];

    saved.forEach((act, idx) => {
      if (idx < 6) slots[idx] = act;
    });

    // Se nenhum slot foi configurado, preencher inteligentemente com padrões úteis
    if (saved.length === 0) {
      if (character.attacks?.[0]) {
        slots[0] = {
          id: 'def-atk-1',
          name: character.attacks[0].name,
          type: 'attack',
          bonus: character.attacks[0].attackBonus,
          damageFormula: `${character.attacks[0].damage} ${character.attacks[0].damageType}`,
          subtitle: 'Ataque Principal',
        };
      }
      if (character.attacks?.[1]) {
        slots[1] = {
          id: 'def-atk-2',
          name: character.attacks[1].name,
          type: 'attack',
          bonus: character.attacks[1].attackBonus,
          damageFormula: `${character.attacks[1].damage} ${character.attacks[1].damageType}`,
          subtitle: 'Ataque Secundário',
        };
      } else if (character.spellcasting?.spells?.[0]) {
        const sp = character.spellcasting.spells[0];
        slots[1] = {
          id: 'def-sp-1',
          name: sp.name,
          type: 'spell',
          spellLevel: sp.level,
          subtitle: sp.level === 0 ? 'Truque' : `Nível ${sp.level}`,
        };
      }

      // Slot 3: Iniciativa
      const dexMod = Math.floor((character.abilities.dex.score - 10) / 2);
      const initBonus = dexMod + (character.initiativeBonus || 0);
      slots[2] = {
        id: 'def-init',
        name: 'Iniciativa',
        type: 'initiative',
        bonus: initBonus,
        subtitle: `${initBonus >= 0 ? `+${initBonus}` : initBonus}`,
      };

      // Slot 4: Dado de Vida
      const conMod = Math.floor((character.abilities.con.score - 10) / 2);
      slots[3] = {
        id: 'def-hitdie',
        name: `Curar 1d${character.hitDice.dieType}`,
        type: 'hitdie',
        damageFormula: `1d${character.hitDice.dieType}${conMod >= 0 ? `+${conMod}` : conMod}`,
        subtitle: `${character.hitDice.current}/${character.hitDice.total} disponíveis`,
      };
    }

    return slots;
  }, [character]);

  const slots = getSlots();

  // Executar a ação de um slot
  const triggerSlot = useCallback((index: number) => {
    const action = slots[index];
    if (!action) return;

    setActivePressedSlot(index);
    setTimeout(() => setActivePressedSlot(null), 300);

    if (action.type === 'attack') {
      onRollAction(action.name, action.bonus || 0, action.damageFormula);
    } else if (action.type === 'spell') {
      onRollAction(`Magia: ${action.name}`, action.bonus || 0, action.damageFormula);
    } else if (action.type === 'initiative') {
      onRollAction('Rolagem de Iniciativa', action.bonus || 0);
    } else if (action.type === 'hitdie') {
      onRollAction('Gastar Dado de Vida', 0, action.damageFormula);
    } else {
      onRollAction(action.name, action.bonus || 0, action.damageFormula);
    }
  }, [slots, onRollAction]);

  // Capturar teclas de atalho de 1 a 6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.hasAttribute('contenteditable');

      if (isInput) return;

      const key = e.key;
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        const slotIdx = parseInt(key, 10) - 1;
        if (slots[slotIdx]) {
          e.preventDefault();
          triggerSlot(slotIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slots, triggerSlot]);

  // Salvar uma ação no slot
  const handleAssignToSlot = (index: number, newAction: QuickAction | null) => {
    const newSlots = [...slots];
    newSlots[index] = newAction;
    const cleanList = newSlots.filter((s): s is QuickAction => s !== null);
    updateCharacter({ quickActions: cleanList });
    setEditingSlotIndex(null);
  };

  const getSlotIcon = (action: QuickAction) => {
    switch (action.type) {
      case 'attack':
        return <Swords className="w-3.5 h-3.5 text-red-400" />;
      case 'spell':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'initiative':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'hitdie':
        return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Dices className="w-3.5 h-3.5 text-amber-300" />;
    }
  };

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 z-40 select-none flex items-center transition-all duration-300 ${
        position === 'left' ? 'left-2 sm:left-3' : 'right-2 sm:right-3 flex-row-reverse'
      }`}
    >
      {/* Botão de aba quando encolhido */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className={`bg-slate-900/95 hover:bg-slate-800 border border-amber-500/50 text-amber-400 py-3.5 px-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1.5 transition active:scale-95 group cursor-pointer ${
            position === 'left' ? 'rounded-r-2xl border-l-0' : 'rounded-l-2xl border-r-0'
          }`}
          title="Expandir Barra Lateral de Atalhos Rápidos (Teclas 1 a 6)"
        >
          <Zap className="w-4 h-4 text-amber-400 group-hover:scale-125 transition" />
          <span className="text-[10px] font-mono font-black text-amber-300 tracking-wider [writing-mode:vertical-lr] rotate-180">
            ATALHOS 1-6
          </span>
          {position === 'left' ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
          )}
        </button>
      ) : (
        /* Conteúdo da Hotbar Lateral */
        <div
          className={`flex flex-col items-center gap-1.5 p-2 bg-slate-950/95 border border-amber-500/50 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-xl animate-in ${
            position === 'left' ? 'slide-in-from-left-2' : 'slide-in-from-right-2'
          }`}
        >
          {/* Cabeçalho da Hotbar Lateral */}
          <div className="flex items-center justify-between w-full px-1 pb-1.5 border-b border-slate-800/80 gap-2">
            <div className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-tight">Atalhos (1-6)</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setPosition(position === 'left' ? 'right' : 'left')}
                className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition cursor-pointer"
                title={position === 'left' ? 'Mover barra para a direita' : 'Mover barra para a esquerda'}
              >
                <ArrowLeftRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
                title="Recolher Atalhos"
              >
                {position === 'left' ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Coluna Vertical de Slots 1 a 6 */}
          <div className="flex flex-col gap-1.5">
            {slots.map((action, idx) => {
              const isPressed = activePressedSlot === idx;
              return (
                <div key={idx} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (action) {
                        triggerSlot(idx);
                      } else {
                        setEditingSlotIndex(idx);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-xl border transition-all cursor-pointer ${
                      isPressed
                        ? 'scale-95 ring-2 ring-amber-400 bg-amber-500/40 border-amber-300'
                        : action
                        ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400 hover:bg-slate-800/90 shadow-md'
                        : 'bg-slate-950/40 border-dashed border-slate-700 hover:border-slate-500 text-slate-600'
                    }`}
                    title={action ? `${action.name} (Pressione ${idx + 1})` : `Configurar Atalho ${idx + 1}`}
                  >
                    {/* Número do Atalho Tecla */}
                    <span className="absolute top-1 left-1.5 text-[9px] font-mono font-black text-amber-400/90 bg-slate-950/80 px-1 rounded">
                      {idx + 1}
                    </span>

                    {action ? (
                      <div className="flex flex-col items-center mt-1.5 px-1 text-center w-full">
                        {getSlotIcon(action)}
                        <span className="text-[9px] font-bold text-slate-200 truncate w-full mt-0.5 leading-tight">
                          {action.name}
                        </span>
                        {action.subtitle && (
                          <span className="text-[8px] font-mono text-amber-300/80 truncate w-full leading-tight">
                            {action.subtitle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Plus className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {/* Botão de Ajuste Rápido no Hover */}
                  {action && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSlotIndex(idx);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 border border-slate-600 text-slate-400 hover:text-amber-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                      title="Alterar este atalho"
                    >
                      <Settings2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal / Popover de Configuração de Slot */}
      {editingSlotIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="rpg-box bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">
                  Configurar Tecla de Atalho [{editingSlotIndex + 1}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Escolha uma ação da ficha para vincular à tecla {editingSlotIndex + 1}:
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {/* Opções de Ataques */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Ataques & Armas
                </span>
                <div className="space-y-1">
                  {character.attacks.map((atk) => (
                    <button
                      key={atk.id}
                      type="button"
                      onClick={() =>
                        handleAssignToSlot(editingSlotIndex, {
                          id: `atk-${atk.id}`,
                          name: atk.name,
                          type: 'attack',
                          bonus: atk.attackBonus,
                          damageFormula: `${atk.damage} ${atk.damageType}`,
                          subtitle: `${atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus} | ${atk.damage}`,
                        })
                      }
                      className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2">
                        <Swords className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-bold text-slate-200">{atk.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">
                        {atk.attackBonus >= 0 ? `+${atk.attackBonus}` : atk.attackBonus} ({atk.damage})
                      </span>
                    </button>
                  ))}
                  {character.attacks.length === 0 && (
                    <span className="text-xs text-slate-500 italic">Nenhum ataque cadastrado</span>
                  )}
                </div>
              </div>

              {/* Opções de Magias */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Magias Rápidas
                </span>
                <div className="space-y-1">
                  {character.spellcasting?.spells.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() =>
                        handleAssignToSlot(editingSlotIndex, {
                          id: `sp-${sp.id}`,
                          name: sp.name,
                          type: 'spell',
                          spellLevel: sp.level,
                          subtitle: sp.level === 0 ? 'Truque' : `Nível ${sp.level}`,
                        })
                      }
                      className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200">{sp.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300">
                        {sp.level === 0 ? 'Truque' : `Nível ${sp.level}`}
                      </span>
                    </button>
                  ))}
                  {(!character.spellcasting?.spells || character.spellcasting.spells.length === 0) && (
                    <span className="text-xs text-slate-500 italic">Nenhuma magia cadastrada</span>
                  )}
                </div>
              </div>

              {/* Ações Especiais */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Ações Rápidas do Sistema
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const dexMod = Math.floor((character.abilities.dex.score - 10) / 2);
                      const initBonus = dexMod + (character.initiativeBonus || 0);
                      handleAssignToSlot(editingSlotIndex, {
                        id: 'init',
                        name: 'Iniciativa',
                        type: 'initiative',
                        bonus: initBonus,
                        subtitle: `${initBonus >= 0 ? `+${initBonus}` : initBonus}`,
                      });
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Iniciativa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const conMod = Math.floor((character.abilities.con.score - 10) / 2);
                      handleAssignToSlot(editingSlotIndex, {
                        id: 'hitdie',
                        name: `Dado de Vida (d${character.hitDice.dieType})`,
                        type: 'hitdie',
                        damageFormula: `1d${character.hitDice.dieType}${conMod >= 0 ? `+${conMod}` : conMod}`,
                        subtitle: `Cura`,
                      });
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Dado de Vida</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleAssignToSlot(editingSlotIndex, null)}
                className="text-xs text-red-400 hover:text-red-300 font-bold"
              >
                Limpar Slot
              </button>
              <button
                type="button"
                onClick={() => setEditingSlotIndex(null)}
                className="py-1.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
