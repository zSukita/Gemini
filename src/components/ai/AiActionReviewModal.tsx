import React, { useEffect, useRef, useState } from 'react';
import { Swords, X } from 'lucide-react';
import type { AiMessage } from '../../types/aiDm';

interface Props { proposal: AiMessage; onApprove: (edited: AiMessage) => void; onReject: () => void; }

export const AiActionReviewModal: React.FC<Props> = ({ proposal, onApprove, onReject }) => {
  const [spawns, setSpawns] = useState(proposal.monsterSpawns || []);
  const [moves, setMoves] = useState(proposal.mapMoves || []);
  const [attack, setAttack] = useState(proposal.monsterAttack);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onReject(); return; }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
    <section ref={dialogRef} onKeyDown={handleKeyDown} role="dialog" aria-modal="true" aria-labelledby="ai-review-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-amber-500/50 bg-slate-950 p-5 text-slate-100 shadow-2xl">
      <header className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-400">Proposta do Mestre IA</p><h2 id="ai-review-title" className="mt-1 font-serif text-xl font-bold text-amber-100">Revise antes de aplicar</h2></div><button ref={closeRef} type="button" onClick={onReject} aria-label="Rejeitar e fechar" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"><X size={20} /></button></header>
      <p className="mb-4 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">{proposal.content}</p>
      {spawns.map((spawn, i) => <label key={`spawn-${i}`} className="mb-3 block rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">Adicionar criatura: <strong>{spawn.monsterName}</strong><span className="mt-2 flex items-center gap-2">Quantidade <input aria-label={`Quantidade de ${spawn.monsterName}`} type="number" min="1" max="20" value={spawn.count} onChange={(e) => setSpawns((all) => all.map((item, n) => n === i ? { ...item, count: Math.max(1, Math.min(20, Number(e.target.value) || 1)) } : item))} className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-center" /></span></label>)}
      {moves.map((move, i) => <div key={`move-${i}`} className="mb-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm"><label className="block">Mover <strong>{move.tokenName}</strong>: <input aria-label={`Ação ou destino para ${move.tokenName}`} value={move.actionOrTarget} onChange={(e) => setMoves((all) => all.map((item, n) => n === i ? { ...item, actionOrTarget: e.target.value } : item))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label><label className="mt-2 block">Distância em casas<input aria-label={`Distância de ${move.tokenName}`} type="number" min="0" max="12" value={move.distanceSquares || 4} onChange={(e) => setMoves((all) => all.map((item, n) => n === i ? { ...item, distanceSquares: Math.max(0, Math.min(12, Number(e.target.value) || 0)) } : item))} className="mt-1 w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label></div>)}
      {attack && <div className="mb-3 rounded-xl border border-rose-700/50 bg-rose-950/20 p-3 text-sm"><div className="mb-2 flex items-center gap-2 text-rose-200"><Swords size={16} />Ataque proposto</div><p>{attack.monsterName} → {attack.target || 'herói ativo'}</p><label className="mt-2 block">Alvo<input value={attack.target || ''} onChange={(e) => setAttack({ ...attack, target: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label><label className="mt-2 block">Bônus de ataque<input type="number" value={attack.attackBonus} onChange={(e) => setAttack({ ...attack, attackBonus: Number(e.target.value) || 0 })} className="mt-1 w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label><label className="mt-2 block">Fórmula de dano<input value={attack.damageFormula} onChange={(e) => setAttack({ ...attack, damageFormula: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label></div>}
      <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row"><button type="button" onClick={onReject} className="min-h-11 rounded-xl border border-slate-700 px-4 font-semibold text-slate-200">Rejeitar ações</button><button type="button" onClick={() => onApprove({ ...proposal, monsterSpawns: spawns, mapMoves: moves, monsterAttack: attack })} className="min-h-11 rounded-xl bg-amber-500 px-4 font-bold text-slate-950 hover:bg-amber-400">Aprovar e aplicar</button></div>
    </section>
  </div>;
};
