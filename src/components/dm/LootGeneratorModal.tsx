import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  generateLoot, 
  type LootTier, 
  type LootType, 
  type GeneratedLoot 
} from '../../utils/lootGenerator';
import { 
  X, 
  Coins, 
  Gem, 
  Sparkles, 
  Dices, 
  Copy, 
  Check, 
  PlusCircle, 
  Vault
} from 'lucide-react';

interface LootGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoinsToCharacter?: (coins: { cp: number; sp: number; ep: number; gp: number; pp: number }) => void;
  onAddToSharedLoot?: (item: { name: string; quantity: number; valueGp: number }) => void;
}

export const LootGeneratorModal: React.FC<LootGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddCoinsToCharacter,
  onAddToSharedLoot,
}) => {
  const [tier, setTier] = useState<LootTier>('0-4');
  const [lootType, setLootType] = useState<LootType>('hoard');
  const [currentLoot, setCurrentLoot] = useState<GeneratedLoot>(() => generateLoot('0-4', 'hoard'));
  const [copied, setCopied] = useState(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const handleRoll = () => {
    const result = generateLoot(tier, lootType);
    setCurrentLoot(result);
    setCopied(false);
    setAppliedNotification(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentLoot.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddCoins = () => {
    if (onAddCoinsToCharacter) {
      onAddCoinsToCharacter(currentLoot.coins);
      setAppliedNotification('Moedas adicionadas à ficha do herói!');
      setTimeout(() => setAppliedNotification(null), 3000);
    }
  };

  const handleAddAllToSharedVault = () => {
    if (!onAddToSharedLoot) return;

    // Adiciona gemas
    currentLoot.gems.forEach((g) => {
      onAddToSharedLoot({ name: `Gema: ${g.name}`, quantity: g.count, valueGp: g.value });
    });
    // Adiciona arte
    currentLoot.artObjects.forEach((a) => {
      onAddToSharedLoot({ name: `Arte: ${a.name}`, quantity: a.count, valueGp: a.value });
    });
    // Adiciona itens mágicos
    currentLoot.magicItems.forEach((m) => {
      onAddToSharedLoot({ name: `Mágico: ${m}`, quantity: 1, valueGp: 100 });
    });
    // Adiciona as moedas como um lote
    if (currentLoot.totalGoldValue > 0) {
      onAddToSharedLoot({
        name: `Lote de Moedas (${currentLoot.tier})`,
        quantity: 1,
        valueGp: Math.round(
          currentLoot.coins.gp +
          currentLoot.coins.pp * 10 +
          currentLoot.coins.sp / 10 +
          currentLoot.coins.cp / 100
        ),
      });
    }

    setAppliedNotification('Tesouro enviado para o Cofre do Grupo (Diário)!');
    setTimeout(() => setAppliedNotification(null), 3000);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="rpg-card w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border-amber-500/60 shadow-2xl overflow-hidden bg-slate-900/98 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-amber-900/40 flex items-center justify-between bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 flex items-center gap-2">
                Gerador de Tesouros & Saques
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Tabelas oficiais do D&D 5e SRD para baús de covil e saques individuais de monstros.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação Toast */}
        {appliedNotification && (
          <div className="bg-emerald-950/90 border-y border-emerald-500/40 text-emerald-300 text-xs py-2 px-4 flex items-center gap-2 animate-in fade-in">
            <Check size={14} className="text-emerald-400" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Corpo do Gerador */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Seletor de Tipo e Faixa de ND */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-serif font-bold text-slate-300 uppercase tracking-wide">
                Faixa de Desafio (ND / CR)
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {(['0-4', '5-10', '11-16', '17+'] as LootTier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                      tier === t
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    ND {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-serif font-bold text-slate-300 uppercase tracking-wide">
                Tipo de Tesouro
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLootType('individual')}
                  className={`py-1.5 px-3 rounded-lg font-medium border transition ${
                    lootType === 'individual'
                      ? 'bg-amber-600 text-white border-amber-500 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700'
                  }`}
                >
                  Monstro Individual
                </button>
                <button
                  type="button"
                  onClick={() => setLootType('hoard')}
                  className={`py-1.5 px-3 rounded-lg font-medium border transition ${
                    lootType === 'hoard'
                      ? 'bg-amber-600 text-white border-amber-500 font-bold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700'
                  }`}
                >
                  Tesouro de Covil / Baú
                </button>
              </div>
            </div>

            <div className="self-end sm:self-center">
              <button
                type="button"
                onClick={handleRoll}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-95 flex items-center justify-center gap-2 transition"
              >
                <Dices className="w-4 h-4" />
                Rolar Tesouro!
              </button>
            </div>
          </div>

          {/* Resultado do Saque */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-amber-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-serif font-bold text-amber-200 text-sm">
                  Saque Gerado ({currentLoot.type === 'hoard' ? 'Tesouro de Covil' : 'Monstro Individual'} - ND {currentLoot.tier})
                </span>
              </div>
              <div className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-mono font-bold">
                Valor Total Est.: ~{currentLoot.totalGoldValue} PO
              </div>
            </div>

            {/* Moedas */}
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" />
                Moedas Encontradas:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
                <div className="p-2.5 bg-amber-950/30 border border-amber-700/40 rounded-xl">
                  <span className="text-[10px] text-amber-400 block font-sans">Ouro (PO)</span>
                  <span className="text-base font-bold text-amber-200">{currentLoot.coins.gp}</span>
                </div>
                <div className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                  <span className="text-[10px] text-slate-300 block font-sans">Prata (PP)</span>
                  <span className="text-base font-bold text-slate-200">{currentLoot.coins.sp}</span>
                </div>
                <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                  <span className="text-[10px] text-amber-600 block font-sans">Cobre (PC)</span>
                  <span className="text-base font-bold text-amber-500">{currentLoot.coins.cp}</span>
                </div>
                <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
                  <span className="text-[10px] text-indigo-400 block font-sans">Electro (PE)</span>
                  <span className="text-base font-bold text-indigo-300">{currentLoot.coins.ep}</span>
                </div>
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-700/40 rounded-xl">
                  <span className="text-[10px] text-emerald-400 block font-sans">Platina (PL)</span>
                  <span className="text-base font-bold text-emerald-300">{currentLoot.coins.pp}</span>
                </div>
              </div>
            </div>

            {/* Gemas & Pedras Preciosas */}
            {currentLoot.gems.length > 0 && (
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Gem size={14} className="text-cyan-400" />
                  Pedras Preciosas & Gemas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentLoot.gems.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-cyan-200 font-medium">{g.count}x {g.name}</span>
                      </div>
                      <span className="text-cyan-400 font-mono font-bold">{g.value * g.count} PO</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Obras de Arte */}
            {currentLoot.artObjects.length > 0 && (
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Objetos de Arte & Relíquias:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentLoot.artObjects.map((a, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between"
                    >
                      <span className="text-amber-200">{a.count}x {a.name}</span>
                      <span className="text-amber-400 font-mono font-bold">{a.value * a.count} PO</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itens Mágicos */}
            {currentLoot.magicItems.length > 0 && (
              <div>
                <span className="text-xs text-purple-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  Itens Mágicos Oficiais SRD:
                </span>
                <div className="space-y-1.5 text-xs">
                  {currentLoot.magicItems.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-center gap-2.5 text-purple-200"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="font-semibold">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé e Botões de Envio Rápido */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rpg-button bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 px-3"
              title="Copiar texto do saque para a área de transferência"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onAddCoinsToCharacter && (
              <button
                type="button"
                onClick={handleAddCoins}
                className="rpg-button bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/50 py-1.5 px-3 font-bold"
                title="Somar moedas diretamente ao inventário do herói ativo"
              >
                <PlusCircle size={14} />
                <span>+ Moedas na Ficha</span>
              </button>
            )}

            {onAddToSharedLoot && (
              <button
                type="button"
                onClick={handleAddAllToSharedVault}
                className="rpg-button bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black py-1.5 px-3.5 shadow-lg shadow-emerald-950"
                title="Enviar gemas, artes e lote de moedas direto para a aba Diário (Cofre Coletivo)"
              >
                <Vault size={14} />
                <span>Enviar ao Cofre do Grupo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
