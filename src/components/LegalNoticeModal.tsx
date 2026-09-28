import { X, ShieldCheck, ExternalLink, Scroll, Scale } from 'lucide-react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalNoticeModal({ isOpen, onClose }: LegalNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-notice-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale size={20} />
            </div>
            <div>
              <h2 id="legal-notice-title" className="font-cinzel text-lg font-bold text-amber-200">
                Aviso Legal & Licenciamento
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Conformidade com a licença SRD 5.1 (Wizards of the Coast)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm font-sans text-slate-300 leading-relaxed">
          {/* Official Wizards Attribution Box */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck size={16} />
              <span>Attribution Notice (Official WotC SRD 5.1 CC-BY-4.0)</span>
            </div>
            <p className="italic text-xs font-serif text-amber-100/90 bg-slate-950/60 p-3 rounded-lg border border-amber-500/20">
              &ldquo;This work includes material taken from the System Reference Document 5.1 (&ldquo;SRD 5.1&rdquo;) by Wizards of the Coast LLC and available at{' '}
              <a
                href="https://dnd.wizards.com/resources/systems-reference-document"
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-0.5"
              >
                dnd.wizards.com
                <ExternalLink size={10} className="inline" />
              </a>
              . The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/legalcode"
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 underline underline-offset-2 hover:text-amber-200 inline-flex items-center gap-0.5"
              >
                creativecommons.org
                <ExternalLink size={10} className="inline" />
              </a>
              .&rdquo;
            </p>
          </div>

          {/* Portuguese Context / Legal Clarification */}
          <div className="space-y-3">
            <h3 className="font-cinzel text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Scroll size={16} />
              <span>Sobre o ArcanaSheet & Direitos Autorais</span>
            </h3>
            <p className="text-xs text-slate-300">
              O <strong>ArcanaSheet</strong> é uma plataforma virtual independente de criação de fichas, mesa virtual (VTT) e assistência de jogo, desenvolvida para jogadores e mestres de RPG.
            </p>
            <p className="text-xs text-slate-400">
              Todo o compêndio de regras, magias, monstros, classes, perícias e equipamentos incluído nesta plataforma é derivado exclusivamente do <strong>System Reference Document 5.1 (SRD 5.1)</strong>, publicado pela <em>Wizards of the Coast LLC</em> e disponibilizado mundialmente sob a licença livre <strong>Creative Commons Atribuição 4.0 Internacional (CC-BY-4.0)</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Dungeons & Dragons, D&D e Wizards of the Coast são marcas registradas da Wizards of the Coast LLC, uma subsidiária da Hasbro, Inc. O ArcanaSheet não é afiliado, patrocinado ou endossado pela Wizards of the Coast.
            </p>
          </div>

          {/* Useful Official Links */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4 text-xs">
            <a
              href="https://dnd.wizards.com/resources/systems-reference-document"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition"
            >
              <ExternalLink size={13} />
              <span>Acessar SRD 5.1 Oficial</span>
            </a>
            <a
              href="https://creativecommons.org/licenses/by/4.0/legalcode"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition"
            >
              <ExternalLink size={13} />
              <span>Termos da Licença CC-BY-4.0</span>
            </a>
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
