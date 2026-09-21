import React, { useState, useEffect } from 'react';
import type { Character } from '../types/dnd5e';
import {
  type Campaign,
  type CampaignPartyMember,
  createCampaign,
  findCampaignByCode,
  joinCampaign,
  leaveCampaign,
  deleteCampaign,
  subscribeToCampaign,
  syncMemberStats,
} from '../firebase/campaignSync';
import { getPassivePerception } from '../utils/calculations';
import {
  Crown,
  Users,
  Copy,
  Check,
  Plus,
  Trash2,
  LogOut,
  Swords,
  Scroll,
  X,
  Shield,
  Eye,
  Heart,
  Share2,
  Compass,
} from 'lucide-react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  activeCharacter: Character;
  onImportPartyToCombat: (members: CampaignPartyMember[]) => void;
  onOpenHandoutModal?: () => void;
  showNotification: (msg: string) => void;
  activeCampaignId: string | null;
  setActiveCampaignId: (id: string | null) => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  activeCharacter,
  onImportPartyToCombat,
  onOpenHandoutModal,
  showNotification,
  activeCampaignId,
  setActiveCampaignId,
}) => {
  const [activeTab, setActiveTab] = useState<'dm' | 'player'>('dm');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form de criação (Mestre)
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form de entrada (Jogador)
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Assinatura em tempo real da campanha ativa
  useEffect(() => {
    if (!activeCampaignId) {
      setCampaign(null);
      return;
    }

    const unsubscribe = subscribeToCampaign(activeCampaignId, (camp) => {
      setCampaign(camp);
    });

    return () => unsubscribe();
  }, [activeCampaignId]);

  // Sincroniza status do personagem do jogador quando ele muda de HP ou nível
  useEffect(() => {
    if (!activeCampaignId || !campaign || campaign.dmId === userId) return;
    if (!activeCharacter.name) return;

    const member: CampaignPartyMember = {
      userId,
      characterId: activeCharacter.id,
      name: activeCharacter.name,
      characterClass: activeCharacter.characterClass,
      level: activeCharacter.level,
      currentHp: activeCharacter.currentHp,
      maxHp: activeCharacter.maxHp,
      armorClass: activeCharacter.armorClass,
      passivePerception: getPassivePerception(activeCharacter),
      avatarUrl: activeCharacter.avatarUrl,
      updatedAt: Date.now(),
    };

    syncMemberStats(activeCampaignId, member).catch(() => {});
  }, [
    activeCampaignId,
    campaign,
    userId,
    activeCharacter.name,
    activeCharacter.characterClass,
    activeCharacter.level,
    activeCharacter.currentHp,
    activeCharacter.maxHp,
    activeCharacter.armorClass,
    activeCharacter.avatarUrl,
  ]);

  if (!isOpen) return null;

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    try {
      setIsCreating(true);
      const camp = await createCampaign(
        userId,
        userName || 'Mestre Arcana',
        newCampaignName,
        newCampaignDesc
      );
      setActiveCampaignId(camp.id);
      setCampaign(camp);
      setNewCampaignName('');
      setNewCampaignDesc('');
      showNotification(`Campanha "${camp.name}" criada com sucesso! Código: ${camp.code}`);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao criar campanha. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setIsJoining(true);
      const camp = await findCampaignByCode(joinCode);
      if (!camp) {
        showNotification('Nenhuma campanha encontrada com esse código.');
        return;
      }

      const member: CampaignPartyMember = {
        userId,
        characterId: activeCharacter.id,
        name: activeCharacter.name || 'Aventureiro Sem Nome',
        characterClass: activeCharacter.characterClass || 'Guerreiro',
        level: activeCharacter.level || 1,
        currentHp: activeCharacter.currentHp,
        maxHp: activeCharacter.maxHp,
        armorClass: activeCharacter.armorClass,
        passivePerception: getPassivePerception(activeCharacter),
        avatarUrl: activeCharacter.avatarUrl,
        updatedAt: Date.now(),
      };

      await joinCampaign(camp.id, member);
      setActiveCampaignId(camp.id);
      setCampaign(camp);
      setJoinCode('');
      showNotification(`Você ingressou na campanha "${camp.name}" com sucesso!`);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao ingressar na campanha.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showNotification(`Código da campanha ${code} copiado! Compartilhe com seus jogadores.`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleLeaveCampaign = async () => {
    if (!activeCampaignId) return;
    if (!window.confirm('Tem certeza que deseja sair desta campanha?')) return;

    try {
      await leaveCampaign(activeCampaignId, userId);
      setActiveCampaignId(null);
      setCampaign(null);
      showNotification('Você saiu da campanha.');
    } catch {
      showNotification('Erro ao sair da campanha.');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!activeCampaignId) return;
    if (!window.confirm('Tem certeza que deseja encerrar e excluir esta campanha para todos?')) return;

    try {
      await deleteCampaign(activeCampaignId);
      setActiveCampaignId(null);
      setCampaign(null);
      showNotification('Campanha encerrada.');
    } catch {
      showNotification('Erro ao encerrar campanha.');
    }
  };

  const partyMembers = campaign ? Object.values(campaign.members || {}) : [];
  const isDm = campaign?.dmId === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rpg-card w-full max-w-3xl rounded-2xl p-5 border border-amber-500/40 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass size={20} className="text-amber-400" />
            <h2 className="text-base font-serif font-bold text-amber-200">
              Campanhas & Mesas de RPG na Nuvem
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 pt-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('dm')}
            className={`px-4 py-2 text-xs font-serif font-bold tracking-wide flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'dm'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown size={14} className={activeTab === 'dm' ? 'text-amber-400' : 'text-slate-500'} />
            <span>Mestre da Mesa</span>
          </button>

          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-2 text-xs font-serif font-bold tracking-wide flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'player'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} className={activeTab === 'player' ? 'text-amber-400' : 'text-slate-500'} />
            <span>Entrar como Jogador</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* ABA DO MESTRE */}
          {activeTab === 'dm' && (
            <div>
              {campaign && isDm ? (
                <div className="space-y-4">
                  {/* Cartão de Informações da Campanha */}
                  <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown size={16} className="text-amber-400" />
                        <h3 className="text-base font-bold text-amber-100">{campaign.name}</h3>
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-slate-400 mt-1">{campaign.description}</p>
                      )}
                    </div>

                    {/* Código de Convite de 6 caracteres */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Código da Mesa</div>
                        <div className="font-mono text-sm font-black text-amber-300 tracking-wider">
                          {campaign.code}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(campaign.code)}
                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition"
                        title="Copiar código"
                      >
                        {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Barra de Ações Rápidas do Mestre */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onImportPartyToCombat(partyMembers)}
                      disabled={partyMembers.length === 0}
                      className="rpg-button bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/50 text-xs py-2 px-3 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Swords size={14} />
                      Importar Grupo para o Combate ({partyMembers.length})
                    </button>

                    {onOpenHandoutModal && (
                      <button
                        onClick={onOpenHandoutModal}
                        className="rpg-button bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 text-xs py-2 px-3 flex items-center gap-1.5"
                      >
                        <Scroll size={14} />
                        Transmitir Pista / Documento
                      </button>
                    )}

                    <button
                      onClick={handleDeleteCampaign}
                      className="rpg-button bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs py-2 px-3 flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 size={13} />
                      Encerrar Campanha
                    </button>
                  </div>

                  {/* Grid de Personagens do Grupo (Sincronizados em tempo real) */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} /> Grupo de Aventureiros ({partyMembers.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Atualizado automaticamente conforme os jogadores jogam
                      </span>
                    </div>

                    {partyMembers.length === 0 ? (
                      <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                        <p className="font-semibold text-slate-300 mb-1">Nenhum aventureiro entrou ainda.</p>
                        <p>Compartilhe o código <strong className="font-mono text-amber-400">{campaign.code}</strong> com seus jogadores para eles entrarem!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {partyMembers.map((m) => {
                          const hpPercent = Math.max(0, Math.min(100, (m.currentHp / (m.maxHp || 1)) * 100));
                          return (
                            <div
                              key={m.userId}
                              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2 shadow"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0 overflow-hidden">
                                  {m.avatarUrl ? (
                                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                  ) : (
                                    m.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-slate-200 text-xs truncate">{m.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {m.characterClass} Nvl {m.level}
                                  </div>
                                </div>
                              </div>

                              {/* Barra de Vida */}
                              <div>
                                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                                  <span className="flex items-center gap-1"><Heart size={10} className="text-rose-400" /> PV</span>
                                  <span className="font-bold text-slate-200">{m.currentHp}/{m.maxHp}</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full ${
                                      hpPercent > 50 ? 'bg-emerald-400' : hpPercent > 20 ? 'bg-amber-400' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${hpPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Defesas e Percepção */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-900 text-[10px]">
                                <div className="flex items-center gap-1 text-slate-300 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded">
                                  <Shield size={11} className="text-amber-400" />
                                  <span>CA {m.armorClass}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-300 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded">
                                  <Eye size={11} className="text-cyan-400" />
                                  <span>Perc {m.passivePerception}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Formulário para Criar Nova Campanha */
                <form onSubmit={handleCreateCampaign} className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-serif font-bold text-amber-300">
                    <Plus size={16} /> Criar Nova Mesa / Campanha
                  </div>
                  <p className="text-xs text-slate-400">
                    Como Mestre, crie uma campanha para gerar um código de 6 caracteres. Seus jogadores poderão entrar e você acompanhará todos os dados em tempo real!
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Campanha</label>
                    <input
                      type="text"
                      placeholder="Ex: A Mina Perdida de Phandelver"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="rpg-input text-xs w-full py-1.5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Sinopse (Opcional)</label>
                    <textarea
                      placeholder="Breve resumo da aventura, mundo ou horários de jogo..."
                      value={newCampaignDesc}
                      onChange={(e) => setNewCampaignDesc(e.target.value)}
                      rows={2}
                      className="rpg-input text-xs w-full py-1.5 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating || !newCampaignName.trim()}
                    className="rpg-button bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/50 text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Crown size={14} />
                    {isCreating ? 'Criando Mesa...' : 'Criar Campanha & Gerar Código'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ABA DO JOGADOR */}
          {activeTab === 'player' && (
            <div className="space-y-4">
              {campaign && !isDm ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Campanha Conectada</div>
                      <div className="text-base font-bold text-slate-100">{campaign.name}</div>
                      <div className="text-xs text-slate-400">Mestre: {campaign.dmName}</div>
                    </div>
                    <button
                      onClick={handleLeaveCampaign}
                      className="rpg-button bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <LogOut size={13} /> Sair da Mesa
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <div className="text-xs font-serif font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                      <Users size={14} /> Seus Companheiros de Aventura ({partyMembers.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {partyMembers.map((m) => (
                        <div key={m.userId} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {m.name} {m.userId === userId && '(Você)'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {m.characterClass} Nvl {m.level} • {m.currentHp}/{m.maxHp} PV
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulário para Jogador Ingressar */
                <form onSubmit={handleJoinCampaign} className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-serif font-bold text-amber-300">
                    <Share2 size={16} /> Ingressar com Código da Mesa
                  </div>
                  <p className="text-xs text-slate-400">
                    Digite o código de 6 caracteres fornecido pelo seu Mestre (ex: <span className="font-mono text-amber-400">ARC-8492</span>). Seu personagem ativo será sincronizado instantaneamente com a mesa dele.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Código da Campanha</label>
                    <input
                      type="text"
                      placeholder="Ex: ARC-9X2Y"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="rpg-input font-mono font-bold text-sm tracking-widest uppercase text-amber-300 w-full py-2 px-3 text-center"
                      required
                    />
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Shield size={14} className="text-amber-400 shrink-0" />
                    <span>
                      Personagem sincronizado: <strong className="text-slate-200">{activeCharacter.name || 'Seu Personagem'}</strong> ({activeCharacter.characterClass || 'Guerreiro'} Nível {activeCharacter.level || 1})
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining || !joinCode.trim()}
                    className="rpg-button bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 border border-amber-500/50 text-xs py-2 px-4 flex items-center justify-center gap-1.5 w-full disabled:opacity-50"
                  >
                    <Users size={14} />
                    {isJoining ? 'Ingressando...' : 'Ingressar na Mesa'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
