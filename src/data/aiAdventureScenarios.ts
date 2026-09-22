import type { AdventureTone } from '../types/aiDm';

export interface AiAdventureScenario {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tone: AdventureTone;
  mapPresetId: string;
  ambientLight: 'day' | 'dusk' | 'night';
  initialPrompt: string;
  suggestedActions: string[];
  requestedRoll?: { skillOrAbility: string; dc: number; reason: string };
  monsters: Array<{
    monsterId: string;
    count: number;
    initialX?: number;
    initialY?: number;
  }>;
}

export const AI_ADVENTURE_SCENARIOS: AiAdventureScenario[] = [
  {
    id: 'crypt_ancestors',
    title: 'A Cripta dos Reis Esquecidos',
    subtitle: 'Masmorra subterrânea, sarcófagos milenares e fogo espectral.',
    icon: '🏰',
    tone: 'dark_fantasy',
    mapPresetId: 'map-crypt',
    ambientLight: 'night',
    initialPrompt:
      'Vocês descem pelas escadarias úmidas de pedra antiga e penetram na Cripta dos Reis Esquecidos. O ar é denso, cheirando a pó e cinzas milenares. No centro do salão, sarcófagos de pedra rachados começam a tremer, e chamas espectrais verdes brotam dos candelabros de ferro fundido. Sombras arqueadas com armaduras enferrujadas se erguem dos túmulos empunhando lâminas lascadas!',
    suggestedActions: [
      'Sacar as armas e formar uma linha defensiva ao redor do altar central',
      'Acender uma tocha ou canalizar luz divina para afastar as sombras',
      'Examinar os sarcófagos em busca de runas que selam os mortos-vivos',
    ],
    requestedRoll: {
      skillOrAbility: 'Percepção (Sabedoria)',
      dc: 12,
      reason: 'Para identificar qual sarcófago está prestes a se romper primeiro',
    },
    monsters: [
      { monsterId: 'srd-skeleton', count: 2, initialX: 300, initialY: 350 },
      { monsterId: 'srd-zombie', count: 1, initialX: 600, initialY: 350 },
    ],
  },
  {
    id: 'forest_ambush',
    title: 'A Emboscada na Floresta dos Sussurros',
    subtitle: 'Árvores antigas, riacho sinuoso e patrulheiros goblins nas folhagens.',
    icon: '🌲',
    tone: 'survival',
    mapPresetId: 'map-forest',
    ambientLight: 'dusk',
    initialPrompt:
      'A trilha da floresta se estreita quando vocês alcançam uma clareira silenciosa com um riacho e ruínas élficas cobertas de musgo. De repente, o canto dos pássaros cessa. O som de galhos secos estalando e flechas sendo retesadas ecoa nos arbustos. Risadinhas guturais revelam patrulheiros goblins camuflados nas folhagens, acompanhados por um lobo de olhos carmesins!',
    suggestedActions: [
      'Mover-se rapidamente para a ponte de madeira e assumir cobertura tática',
      'Sacar arcos ou preparar magias para contra-atacar a emboscada',
      'Tentar intimidar as criaturas com um brado de batalha feroz',
    ],
    requestedRoll: {
      skillOrAbility: 'Percepção (Sabedoria)',
      dc: 13,
      reason: 'Para detectar a posição exata dos arqueiros goblins entre os arbustos',
    },
    monsters: [
      { monsterId: 'srd-goblin', count: 2, initialX: 550, initialY: 250 },
      { monsterId: 'srd-wolf', count: 1, initialX: 650, initialY: 380 },
    ],
  },
  {
    id: 'tavern_brawl',
    title: 'Conspiração na Taverna do Javali',
    subtitle: 'Tempestade torrencial, assassinos encapuzados e barricadas.',
    icon: '🍺',
    tone: 'heroic',
    mapPresetId: 'map-tavern',
    ambientLight: 'dusk',
    initialPrompt:
      'Vocês se refugiam da tempestade torrencial no calor da Taverna do Javali. O aroma de ensopado de carne é quebrado quando a porta é arrombada: três figuras encapuzadas com adagas curvas e mantos encharcados entram, trancando a saída atrás de si. "Ninguém sai daqui com vida esta noite!", brada o líder enquanto os clientes entram em pânico!',
    suggestedActions: [
      'Virar uma mesa de carvalho para criar uma barricada de proteção',
      'Desembainhar as armas e confrontar o líder dos assassinos',
      'Proteger os aldeões indefesos e guiá-los para trás do balcão',
    ],
    requestedRoll: {
      skillOrAbility: 'Iniciativa (Destreza)',
      dc: 11,
      reason: 'Para reagir antes que o primeiro golpe atinja um inocente',
    },
    monsters: [
      { monsterId: 'srd-bandit', count: 3, initialX: 250, initialY: 200 },
    ],
  },
  {
    id: 'dungeon_mine',
    title: 'A Mina Perdida de Pedra-Rubra',
    subtitle: 'Corredores rochosos, tochas acesas e invasores orcs.',
    icon: '⛏️',
    tone: 'dungeon_crawl',
    mapPresetId: 'map-dungeon',
    ambientLight: 'night',
    initialPrompt:
      'Os trilhos enferrujados da antiga mina de anões conduzem o grupo a um grande salão com pilares de sustentação talhados na rocha. Tochas crepitantes iluminam manchas de fuligem recentes no piso. Ao avançarem, dois guerreiros orcs brutais e um sentinela goblin surgem de um corredor lateral erguendo machados e lanças!',
    suggestedActions: [
      'Avançar pelas sombras para flanquear o sentinela goblin',
      'Bloquear a passagem estreita entre os pilares com escudos',
      'Lançar uma magia de controle de grupo nos guerreiros orcs',
    ],
    requestedRoll: {
      skillOrAbility: 'Furtividade (Destreza)',
      dc: 12,
      reason: 'Para surpreender os inimigos antes do alarme geral da mina',
    },
    monsters: [
      { monsterId: 'srd-orc', count: 2, initialX: 500, initialY: 200 },
      { monsterId: 'srd-goblin', count: 1, initialX: 650, initialY: 200 },
    ],
  },
];
