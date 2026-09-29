import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Dices, Swords, UserRound, X } from 'lucide-react';

interface BeginnerGuideModalProps {
  onClose: () => void;
  onCreateHero: () => void;
  onRollTest: () => void;
  onOpenTable: () => void;
  onOpenCombat: () => void;
  onRollInitiative: () => void;
}

const steps = [
  { title: 'Crie seu herói', text: 'Escolha um personagem pronto para começar rápido ou crie a ficha do zero. Você pode mudar os detalhes depois.', icon: UserRound, action: 'Criar personagem' },
  { title: 'Faça um teste', text: 'Quando tentar algo incerto, role 1d20 e some o modificador indicado. O Mestre compara o total com a dificuldade.', icon: Dices, action: 'Rolar um teste de exemplo' },
  { title: 'Entre na mesa', text: 'Abra Mesa Online para criar uma sala e compartilhar o código com o grupo. Para jogar sozinho, você pode continuar offline.', icon: BookOpen, action: 'Abrir Mesa Online' },
  { title: 'Role iniciativa', text: 'A iniciativa define a ordem dos turnos. Faça a rolagem agora; no painel Mestre você poderá importar o grupo, adicionar criaturas e começar o combate.', icon: Swords, action: 'Abrir Mestre e rolar iniciativa' },
];

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = ({ onClose, onCreateHero, onRollTest, onOpenTable, onOpenCombat, onRollInitiative }) => {
  const [step, setStep] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  const current = steps[step];
  const Icon = current.icon;
  const runAction = () => {
    if (step === 0) onCreateHero();
    if (step === 1) onRollTest();
    if (step === 2) onOpenTable();
    if (step === 3) { onOpenCombat(); onRollInitiative(); }
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={dialogRef} onKeyDown={handleDialogKeyDown} role="dialog" aria-modal="true" aria-labelledby="beginner-guide-title" className="w-full max-w-lg rounded-2xl border border-amber-500/50 bg-slate-950 p-5 text-slate-100 shadow-2xl">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-amber-400">Primeira aventura · etapa {step + 1} de {steps.length}</p><h2 id="beginner-guide-title" className="mt-1 font-serif text-2xl font-bold text-amber-100">{current.title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar tutorial" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"><X size={20} /></button>
        </header>
        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <Icon className="mb-3 text-amber-400" size={28} aria-hidden="true" />
          <p className="leading-relaxed text-slate-200">{current.text}</p>
          <button type="button" onClick={runAction} className="mt-4 min-h-11 w-full rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400">{current.action}</button>
        </div>
        <nav aria-label="Etapas do tutorial" className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0} className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-slate-300 hover:bg-slate-800 disabled:opacity-40"><ChevronLeft size={18} />Voltar</button>
          <div className="flex gap-1.5" aria-hidden="true">{steps.map((_, i) => <span key={i} className={`h-2 w-6 rounded-full ${i === step ? 'bg-amber-400' : 'bg-slate-700'}`} />)}</div>
          {step < steps.length - 1 ? <button type="button" onClick={() => setStep((n) => Math.min(steps.length - 1, n + 1))} className="flex min-h-11 items-center gap-1 rounded-lg px-3 font-semibold text-amber-300 hover:bg-slate-800">Próxima<ChevronRight size={18} /></button> : <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-slate-800 px-4 font-semibold text-slate-100">Concluir</button>}
        </nav>
      </section>
    </div>
  );
};
