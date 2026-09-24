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
    subtitle: 'Castelo Ravenloft, sarcófagos milenares e fogo espectral.',
    icon: '🏰',
    tone: 'dark_fantasy',
    mapPresetId: 'map-ravenloft-crypt',
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
      { monsterId: 'srd-skeleton', count: 3, initialX: 300, initialY: 350 },
    ],
  },
  {
    id: 'forest_ambush',
    title: 'A Emboscada na Floresta dos Sussurros',
    subtitle: 'Santuário na clareira sagrada e patrulheiros goblins nas folhagens.',
    icon: '🌲',
    tone: 'survival',
    mapPresetId: 'map-forest-shrine',
    ambientLight: 'dusk',
    initialPrompt:
      'A trilha da floresta se estreita quando vocês alcançam uma clareira silenciosa com um santuário ancestral e estátuas cobertas de musgo. De repente, o canto dos pássaros cessa. O som de galhos secos estalando e flechas sendo retesadas ecoa nos arbustos. Risadinhas guturais revelam patrulheiros goblins camuflados nas folhagens, acompanhados por um lobo de olhos carmesins!',
    suggestedActions: [
      'Mover-se rapidamente para o altar de pedra e assumir cobertura tática',
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
    subtitle: 'Forja subterrânea, magma ardente e invasores orcs.',
    icon: '⛏️',
    tone: 'dungeon_crawl',
    mapPresetId: 'map-fire-temple',
    ambientLight: 'night',
    initialPrompt:
      'Os trilhos enferrujados da antiga mina conduzem o grupo a uma grandiosa câmara vulcânica com passarelas sobre rios de lava e altares de forja ardente. Tochas e o fulgor do magma iluminam o salão. Ao avançarem sobre a ponte de pedra, guerreiros orcs brutais e um sentinela goblin surgem erguendo machados de batalha incandescentes!',
    suggestedActions: [
      'Avançar pelas plataformas de pedra para flanquear o sentinela goblin',
      'Bloquear a passagem estreita sobre a ponte de lava com escudos',
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
  {
    id: 'citadel_siege',
    title: 'O Portão da Cidadela Proibida',
    subtitle: 'Ponte fortificada sobre o abismo, sentinelas orcs e ventos uivantes.',
    icon: '🛡️',
    tone: 'heroic',
    mapPresetId: 'map-margit-arena',
    ambientLight: 'day',
    initialPrompt:
      'Vocês cruzam a monumental muralha de pedra que dá acesso ao coração da Cidadela. O vento uiva pelo abismo sob a ponte estreita. À frente, os gigantescos portões de ferro estão trancados, vigiados por uma patrulha de guerreiros veteranos e feras de guerra apostados nas ameias!',
    suggestedActions: [
      'Disparar contra os arqueiros nas muralhas antes que preparem rajadas de flechas',
      'Avançar com guarda alta pelo centro da ponte em direção ao portão',
      'Buscar cobertura nas colunas e peitoris de pedra',
    ],
    requestedRoll: {
      skillOrAbility: 'Atletismo (Força)',
      dc: 13,
      reason: 'Para resistir aos ventos uivantes e avançar com firmeza',
    },
    monsters: [
      { monsterId: 'srd-orc', count: 2, initialX: 300, initialY: 200 },
      { monsterId: 'srd-wolf', count: 1, initialX: 350, initialY: 280 },
    ],
  },
  {
    id: 'arcane_library',
    title: 'A Biblioteca dos Mistérios da Academia',
    subtitle: 'Cúpula estelar, estantes astronômicas e construtos de defesa.',
    icon: '📜',
    tone: 'mystery',
    mapPresetId: 'map-rennala-library',
    ambientLight: 'night',
    initialPrompt:
      'Vocês adentram a majestosa Biblioteca Arcana sob a luz azulada de uma cúpula de vidro que reflete as constelações. Milhares de tomos voam suavemente no ar e runas douradas brilham no solo de mármore. Ao tocarem no pedestal do grimório central, guardiões arcanos e esqueletos encantados despertam para repelir os intrusos!',
    suggestedActions: [
      'Identificar o selo mágico que desativa os construtos arcanos',
      'Utilizar as estantes circulares como cobertura contra disparos de energia',
      'Conjurar proteção mágica para conter o pulso de energia da sala',
    ],
    requestedRoll: {
      skillOrAbility: 'Arcanismo (Inteligência)',
      dc: 13,
      reason: 'Para decifrar o padrão rúnico no piso e prever a defesa mágica',
    },
    monsters: [
      { monsterId: 'srd-skeleton', count: 3, initialX: 400, initialY: 300 },
    ],
  },
];
