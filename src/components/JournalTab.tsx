import React, { useState } from 'react';
import type { 
  Character, 
  CampaignJournal, 
  Quest, 
  QuestStatus, 
  CampaignNpc, 
  SharedLootItem 
} from '../types/dnd5e';
import { 
  Scroll, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Users, 
  BookOpen, 
  Gem, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MapPin,
  Sparkles
} from 'lucide-react';

interface JournalTabProps {
  character: Character;
  updateCharacter: (updates: Partial<Character>) => void;
}

type JournalSection = 'quests' | 'npcs' | 'lore' | 'loot';

export const JournalTab: React.FC<JournalTabProps> = ({
  character,
  updateCharacter,
}) => {
  const [activeSection, setActiveSection] = useState<JournalSection>('quests');
  const [questFilter, setQuestFilter] = useState<QuestStatus | 'all'>('all');

  // Modais de Criação Rápida
  const [isNewQuestOpen, setIsNewQuestOpen] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDesc, setNewQuestDesc] = useState('');
  const [newQuestReward, setNewQuestReward] = useState('');
  const [newQuestObjective, setNewQuestObjective] = useState('');

  const [isNewNpcOpen, setIsNewNpcOpen] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');
  const [newNpcRole, setNewNpcRole] = useState('Aliado');
  const [newNpcLoc, setNewNpcLoc] = useState('');
  const [newNpcNotes, setNewNpcNotes] = useState('');

  const [isNewLootOpen, setIsNewLootOpen] = useState(false);
  const [newLootName, setNewLootName] = useState('');
  const [newLootQty, setNewLootQty] = useState(1);
  const [newLootVal, setNewLootVal] = useState('');

  // Inicializar estrutura do diário se ainda não existir
  const journal: CampaignJournal = character.journal || {
    quests: [
      {
        id: 'quest-default-1',
        title: 'Investigar os Rumores da Taverna',
        description: 'Um viajante misterioso mencionou criaturas estranhas rondando os arredores da floresta durante a noite.',
        reward: '50 PO e um Pergaminho de Magia',
        status: 'active',
        objectives: [
          { id: 'obj-1', text: 'Conversar com o estalajadeiro sobre os desaparecimentos', done: true },
          { id: 'obj-2', text: 'Examinar os rastros na saída leste da aldeia', done: false },
        ],
        updatedAt: new Date().toISOString(),
      },
    ],
    npcs: [
      {
        id: 'npc-default-1',
        name: 'Gundren Rockseeker',
        role: 'Aliado / Anão Patrono',
        location: 'Phandalin',
        notes: 'Mineiro em busca da lendária Caverna das Ondas do Eco. Muito generoso com aliados confiáveis.',
      },
    ],
    loreNotes: 'As ruínas da antiga torre de vigia guardam uma lenda sobre uma lâmina que brilha na presença de orcs.',
    sharedLoot: [
      { id: 'loot-1', name: 'Gema de Granada Rubra', quantity: 2, value: '50 PO cada' },
      { id: 'loot-2', name: 'Estatueta de Dragão em Prata', quantity: 1, value: '120 PO' },
    ],
  };

  const updateJournal = (updates: Partial<CampaignJournal>) => {
    updateCharacter({
      journal: {
        ...journal,
        ...updates,
      },
    });
  };

  // Funções de Missões
  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;

    const newQuest: Quest = {
      id: `quest-${Date.now()}`,
      title: newQuestTitle.trim(),
      description: newQuestDesc.trim(),
      reward: newQuestReward.trim() || undefined,
      status: 'active',
      objectives: newQuestObjective.trim()
        ? [{ id: `obj-${Date.now()}`, text: newQuestObjective.trim(), done: false }]
        : [],
      updatedAt: new Date().toISOString(),
    };

    updateJournal({
      quests: [newQuest, ...journal.quests],
    });

    setNewQuestTitle('');
    setNewQuestDesc('');
    setNewQuestReward('');
    setNewQuestObjective('');
    setIsNewQuestOpen(false);
  };

  const handleToggleObjective = (questId: string, objId: string) => {
    const updatedQuests = journal.quests.map((q) => {
      if (q.id !== questId) return q;
      return {
        ...q,
        objectives: q.objectives.map((o) => (o.id === objId ? { ...o, done: !o.done } : o)),
      };
    });
    updateJournal({ quests: updatedQuests });
  };

  const handleToggleQuestStatus = (questId: string, newStatus: QuestStatus) => {
    const updatedQuests = journal.quests.map((q) =>
      q.id === questId ? { ...q, status: newStatus } : q
    );
    updateJournal({ quests: updatedQuests });
  };

  const handleDeleteQuest = (questId: string) => {
    updateJournal({
      quests: journal.quests.filter((q) => q.id !== questId),
    });
  };

  // Funções de NPCs
  const handleAddNpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNpcName.trim()) return;

    const newNpc: CampaignNpc = {
      id: `npc-${Date.now()}`,
      name: newNpcName.trim(),
      role: newNpcRole.trim(),
      location: newNpcLoc.trim(),
      notes: newNpcNotes.trim(),
    };

    updateJournal({
      npcs: [...journal.npcs, newNpc],
    });

    setNewNpcName('');
    setNewNpcLoc('');
    setNewNpcNotes('');
    setIsNewNpcOpen(false);
  };

  const handleDeleteNpc = (npcId: string) => {
    updateJournal({
      npcs: journal.npcs.filter((n) => n.id !== npcId),
    });
  };

  // Funções de Tesouro
  const handleAddLoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLootName.trim()) return;

    const newLoot: SharedLootItem = {
      id: `loot-${Date.now()}`,
      name: newLootName.trim(),
      quantity: Math.max(1, newLootQty),
      value: newLootVal.trim() || 'Sem valor declarado',
    };

    updateJournal({
      sharedLoot: [...journal.sharedLoot, newLoot],
    });

    setNewLootName('');
    setNewLootQty(1);
    setNewLootVal('');
    setIsNewLootOpen(false);
  };

  const handleDeleteLoot = (lootId: string) => {
    updateJournal({
      sharedLoot: journal.sharedLoot.filter((l) => l.id !== lootId),
    });
  };

  const filteredQuests = journal.quests.filter((q) =>
    questFilter === 'all' ? true : q.status === questFilter
  );

  return (
    <div className="flex flex-col gap-5 animate-in fade-in">
      
      {/* Sub-navegação do Diário */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('quests')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSection === 'quests'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scroll size={14} />
            <span>Missões ({journal.quests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('npcs')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSection === 'npcs'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>NPCs & Facções ({journal.npcs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('lore')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSection === 'lore'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Notas & Lore</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('loot')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeSection === 'loot'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gem size={14} />
            <span>Cofre do Grupo ({journal.sharedLoot.length})</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: MISSÕES (QUEST LOG) */}
      {activeSection === 'quests' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filtros de Status */}
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'active', 'completed', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQuestFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    questFilter === st
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  {st === 'all'
                    ? 'Todas'
                    : st === 'active'
                    ? 'Em Andamento'
                    : st === 'completed'
                    ? 'Concluídas'
                    : 'Falhadas'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsNewQuestOpen(true)}
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              <Plus size={14} /> Nova Missão
            </button>
          </div>

          {/* Modal Nova Missão */}
          {isNewQuestOpen && (
            <form onSubmit={handleAddQuest} className="rpg-card p-4 rounded-xl border border-amber-500/40 flex flex-col gap-3 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Criar Nova Missão</h4>
              <input
                type="text"
                placeholder="Título da Missão (ex: O Resgate do Ferreiro)"
                value={newQuestTitle}
                onChange={(e) => setNewQuestTitle(e.target.value)}
                className="rpg-input py-1.5 px-3 text-xs w-full"
                required
              />
              <textarea
                placeholder="Descrição e contexto dos acontecimentos..."
                value={newQuestDesc}
                onChange={(e) => setNewQuestDesc(e.target.value)}
                className="rpg-input py-1.5 px-3 text-xs w-full h-20 resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Recompensa (ex: 200 PO, Cavalo de Guerra)"
                  value={newQuestReward}
                  onChange={(e) => setNewQuestReward(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                />
                <input
                  type="text"
                  placeholder="Primeiro Objetivo (ex: Investigar a mina abandonada)"
                  value={newQuestObjective}
                  onChange={(e) => setNewQuestObjective(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewQuestOpen(false)}
                  className="rpg-button bg-slate-800 text-slate-300 text-xs py-1 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1 px-4"
                >
                  Salvar Missão
                </button>
              </div>
            </form>
          )}

          {/* Lista de Missões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredQuests.map((quest) => (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                  quest.status === 'completed'
                    ? 'bg-slate-950/60 border-emerald-900/50 opacity-80'
                    : quest.status === 'failed'
                    ? 'bg-slate-950/60 border-rose-950/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-amber-200">
                        {quest.title}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border inline-block mt-1 ${
                        quest.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : quest.status === 'failed'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {quest.status === 'completed' ? 'Concluída' : quest.status === 'failed' ? 'Falhada' : 'Em Andamento'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuest(quest.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      title="Excluir missão"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {quest.description}
                  </p>

                  {quest.reward && (
                    <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                      <Sparkles size={12} /> Recompensa: {quest.reward}
                    </div>
                  )}

                  {/* Objetivos com Checkbox */}
                  {quest.objectives.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Objetivos:</span>
                      {quest.objectives.map((obj) => (
                        <div
                          key={obj.id}
                          onClick={() => handleToggleObjective(quest.id, obj.id)}
                          className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-300 hover:text-slate-100 transition"
                        >
                          {obj.done ? (
                            <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-slate-500 shrink-0" />
                          )}
                          <span className={obj.done ? 'line-through text-slate-500' : ''}>
                            {obj.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alternar Status da Missão */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] text-slate-500">Mudar Status:</span>
                  <div className="flex items-center gap-1.5">
                    {quest.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleToggleQuestStatus(quest.id, 'completed')}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold hover:bg-emerald-900 transition flex items-center gap-1"
                      >
                        <CheckCircle2 size={11} /> Concluir
                      </button>
                    )}
                    {quest.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => handleToggleQuestStatus(quest.id, 'active')}
                        className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold hover:bg-amber-900 transition flex items-center gap-1"
                      >
                        <Clock size={11} /> Reabrir
                      </button>
                    )}
                    {quest.status !== 'failed' && (
                      <button
                        type="button"
                        onClick={() => handleToggleQuestStatus(quest.id, 'failed')}
                        className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold hover:bg-rose-900 transition flex items-center gap-1"
                      >
                        <XCircle size={11} /> Falhar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredQuests.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 text-xs italic">
                Nenhuma missão encontrada nesta categoria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: NPCS & FACÇÕES */}
      {activeSection === 'npcs' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsNewNpcOpen(true)}
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              <Plus size={14} /> Registrar NPC / Contato
            </button>
          </div>

          {/* Modal Novo NPC */}
          {isNewNpcOpen && (
            <form onSubmit={handleAddNpc} className="rpg-card p-4 rounded-xl border border-amber-500/40 flex flex-col gap-3 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Registrar Personagem do Mundo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome do NPC (ex: Sildar)"
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                  required
                />
                <select
                  value={newNpcRole}
                  onChange={(e) => setNewNpcRole(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                >
                  <option value="Aliado">Aliado</option>
                  <option value="Neutro">Neutro / Contato</option>
                  <option value="Inimigo / Rival">Inimigo / Rival</option>
                  <option value="Mercador">Mercador</option>
                  <option value="Nobre / Autoridade">Nobre / Autoridade</option>
                </select>
                <input
                  type="text"
                  placeholder="Localização (ex: Taverna da Cidade)"
                  value={newNpcLoc}
                  onChange={(e) => setNewNpcLoc(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                />
              </div>
              <textarea
                placeholder="Anotações e segredos sobre este NPC..."
                value={newNpcNotes}
                onChange={(e) => setNewNpcNotes(e.target.value)}
                className="rpg-input py-1.5 px-3 text-xs w-full h-16 resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewNpcOpen(false)}
                  className="rpg-button bg-slate-800 text-slate-300 text-xs py-1 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1 px-4"
                >
                  Salvar NPC
                </button>
              </div>
            </form>
          )}

          {/* Grid de NPCs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {journal.npcs.map((npc) => (
              <div key={npc.id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-sm font-serif font-bold text-amber-200">{npc.name}</h4>
                    <button
                      type="button"
                      onClick={() => handleDeleteNpc(npc.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                      title="Excluir NPC"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                      {npc.role}
                    </span>
                    {npc.location && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MapPin size={10} /> {npc.location}
                      </span>
                    )}
                  </div>
                  {npc.notes && (
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {npc.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {journal.npcs.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500 text-xs italic">
                Nenhum NPC registrado ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: NOTAS DE SESSÃO & LORE */}
      {activeSection === 'lore' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Anotações livres sobre pistas, rumores e história da campanha:</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Salvo automaticamente</span>
          </div>
          <textarea
            value={journal.loreNotes || ''}
            onChange={(e) => updateJournal({ loreNotes: e.target.value })}
            placeholder="Escreva aqui segredos da campanha, profecias, histórico de batalhas e pistas..."
            className="rpg-input p-4 text-xs w-full h-80 rounded-xl leading-relaxed resize-y font-serif"
          />
        </div>
      )}

      {/* SEÇÃO 4: COFRE DE TESOUROS DO GRUPO */}
      {activeSection === 'loot' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsNewLootOpen(true)}
              className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
            >
              <Plus size={14} /> Adicionar Tesouro Coletivo
            </button>
          </div>

          {/* Modal Novo Tesouro */}
          {isNewLootOpen && (
            <form onSubmit={handleAddLoot} className="rpg-card p-4 rounded-xl border border-amber-500/40 flex flex-col gap-3 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Novo Item Valioso do Grupo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Item (ex: Cálice Dourado)"
                  value={newLootName}
                  onChange={(e) => setNewLootName(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                  required
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Quantidade"
                  value={newLootQty}
                  onChange={(e) => setNewLootQty(parseInt(e.target.value, 10) || 1)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                />
                <input
                  type="text"
                  placeholder="Valor Estimado (ex: 150 PO)"
                  value={newLootVal}
                  onChange={(e) => setNewLootVal(e.target.value)}
                  className="rpg-input py-1.5 px-3 text-xs w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewLootOpen(false)}
                  className="rpg-button bg-slate-800 text-slate-300 text-xs py-1 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rpg-button bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-1 px-4"
                >
                  Salvar no Cofre
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Tesouro */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Item / Artefato</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3">Valor Estimado</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {journal.sharedLoot.map((loot) => (
                  <tr key={loot.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-semibold text-slate-200">{loot.name}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-300">{loot.quantity}</td>
                    <td className="p-3 font-mono text-emerald-400">{loot.value}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLoot(loot.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Vender / Remover do cofre"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {journal.sharedLoot.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                      O cofre do grupo está vazio no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
