import type { ConditionKey, ConditionInfo } from '../types/combat';

export const CONDITIONS: Record<ConditionKey, ConditionInfo> = {
  blinded: {
    key: 'blinded',
    name: 'Cego',
    description: 'Falha automática em testes de visão. Jogadas de ataque contra a criatura têm vantagem; os ataques da criatura têm desvantagem.',
    color: 'bg-zinc-700 text-zinc-100 border-zinc-500',
  },
  charmed: {
    key: 'charmed',
    name: 'Enfeitiçado',
    description: 'Não pode atacar quem o enfeitiçou. O encantador tem vantagem em testes sociais.',
    color: 'bg-pink-900/80 text-pink-200 border-pink-500',
  },
  deafened: {
    key: 'deafened',
    name: 'Surdo',
    description: 'Falha automática em testes de audição.',
    color: 'bg-slate-700 text-slate-200 border-slate-500',
  },
  frightened: {
    key: 'frightened',
    name: 'Amedrontado',
    description: 'Desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte do medo estiver na linha de visão. Não pode se aproximar da fonte.',
    color: 'bg-purple-900/80 text-purple-200 border-purple-500',
  },
  grappled: {
    key: 'grappled',
    name: 'Agarrado',
    description: 'Deslocamento da criatura torna-se 0 e não se beneficia de bônus de velocidade.',
    color: 'bg-amber-900/80 text-amber-200 border-amber-500',
  },
  incapacitated: {
    key: 'incapacitated',
    name: 'Incapacitado',
    description: 'Não pode realizar ações ou reações.',
    color: 'bg-rose-950 text-rose-300 border-rose-600',
  },
  invisible: {
    key: 'invisible',
    name: 'Invisível',
    description: 'Impossível de ser visto sem magia/sentidos especiais. Ataques contra têm desvantagem; ataques da criatura têm vantagem.',
    color: 'bg-cyan-900/80 text-cyan-200 border-cyan-400',
  },
  paralyzed: {
    key: 'paralyzed',
    name: 'Paralisado',
    description: 'Incapacitado e não pode se mover ou falar. Falha automática em salvaguardas de FOR e DES. Ataques contra têm vantagem e qualquer ataque a 1,5m é acerto crítico!',
    color: 'bg-yellow-900/80 text-yellow-200 border-yellow-500',
  },
  petrified: {
    key: 'petrified',
    name: 'Petrificado',
    description: 'Transformado em substância sólida. Peso decuplica, incapacitado, resistente a todo tipo de dano e imune a veneno.',
    color: 'bg-stone-700 text-stone-200 border-stone-400',
  },
  poisoned: {
    key: 'poisoned',
    name: 'Envenenado',
    description: 'Desvantagem em jogadas de ataque e testes de habilidade.',
    color: 'bg-emerald-950 text-emerald-300 border-emerald-500',
  },
  prone: {
    key: 'prone',
    name: 'Caído',
    description: 'A única opção de movimento é rastejar. A criatura tem desvantagem em ataques. Ataques a 1,5m contra ela têm vantagem; à distância têm desvantagem.',
    color: 'bg-orange-950 text-orange-200 border-orange-500',
  },
  restrained: {
    key: 'restrained',
    name: 'Impedido',
    description: 'Deslocamento 0. Ataques contra a criatura têm vantagem; ataques da criatura têm desvantagem. Desvantagem em salvaguardas de DES.',
    color: 'bg-indigo-950 text-indigo-300 border-indigo-500',
  },
  stunned: {
    key: 'stunned',
    name: 'Atordoado',
    description: 'Incapacitado, não pode se mover, fala aos tropeços. Falha automática em salvaguardas de FOR e DES. Ataques contra têm vantagem.',
    color: 'bg-teal-950 text-teal-200 border-teal-500',
  },
  unconscious: {
    key: 'unconscious',
    name: 'Inconsciente',
    description: 'Incapacitado, larga o que estiver segurando, cai no chão. Falha automática em FOR e DES. Ataques contra têm vantagem e qualquer ataque a 1,5m é acerto crítico!',
    color: 'bg-red-950 text-red-200 border-red-600',
  },
};
