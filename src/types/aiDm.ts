export type AdventureTone = 
  | 'heroic'        // Fantasia Heroica & Épica (D&D Clássico)
  | 'dark_fantasy'   // Terror Sombrio & Ravenloft (Gótico, Tensão)
  | 'dungeon_crawl'  // Exploração Tática & Armadilhas (Desafio)
  | 'mystery'        // Investigação & Conspiração (Intriga Urbana)
  | 'survival';      // Sobrevivência & Ermos Selvagens

export interface AdventureToneOption {
  id: AdventureTone;
  label: string;
  icon: string;
  description: string;
}

export const ADVENTURE_TONES: AdventureToneOption[] = [
  {
    id: 'heroic',
    label: 'Fantasia Heroica',
    icon: '⚔️',
    description: 'Aventuras clássicas, feitos grandiosos, heroísmo e combates lendários.',
  },
  {
    id: 'dark_fantasy',
    label: 'Terror Sombrio & Gótico',
    icon: '🌑',
    description: 'Ambientes opressivos, suspense, sacrifícios difíceis e perigos ocultos.',
  },
  {
    id: 'dungeon_crawl',
    label: 'Masmorra & Desafio Tático',
    icon: '🏰',
    description: 'Portas trancadas, armadilhas mortais, gestão de tochas e exploração metódica.',
  },
  {
    id: 'mystery',
    label: 'Mistério & Conspiração',
    icon: '🕵️',
    description: 'Interrogatórios, pistas ocultas, enigmas, traições políticas e dedução.',
  },
  {
    id: 'survival',
    label: 'Sobrevivência nos Ermos',
    icon: '🌲',
    description: 'Rações, clima hostil, feras territoriais e travessias perigosas.',
  },
];

export interface StartingPremise {
  id: string;
  title: string;
  subtitle: string;
  tone: AdventureTone;
  icon: string;
  initialPrompt: string;
}

export const STARTING_PREMISES: StartingPremise[] = [
  {
    id: 'tavern_ambush',
    title: 'A Taverna do Javali Caolho',
    subtitle: 'Uma noite chuvosa interrompida por gritos e um forasteiro ensanguentado',
    tone: 'heroic',
    icon: '🍺',
    initialPrompt: 'Você está sentado em um canto aquecido da Taverna do Javali Caolho, limpando suas armas enquanto a chuva fustiga as vidraças. De repente, as portas da taverna se escancaram: um aldeão empalidecido cai de joelhos no tablado de madeira, com marcas de garras incandescentes nas costas, sussurrando: "Eles acordaram na cripta... fujam!". Os olhares dos aldeões apavorados se voltam para você.',
  },
  {
    id: 'abandoned_mine',
    title: 'A Mina Esquecida de Pedra-Rubra',
    subtitle: 'Túneis de anões desativados repletos de ecos e tesouros soterrados',
    tone: 'dungeon_crawl',
    icon: '⛏️',
    initialPrompt: 'A brisa fria da montanha cessa quando você atravessa o arco de pedra que marca a entrada da Mina de Pedra-Rubra. No chão de cascalho, marcas de botas pesadas e gotas de sangue seco conduzem para a escuridão. Ao longe, nos túneis subterrâneos, você ouve o som ritmado de metal contra rocha... mas a mina foi abandonada há mais de trinta anos.',
  },
  {
    id: 'shadow_manor',
    title: 'O Solar dos Corvos Silenciosos',
    subtitle: 'Uma mansão isolada no topo da colina envolta em névoas espectrais',
    tone: 'dark_fantasy',
    icon: '🏰',
    initialPrompt: 'A névoa rasteja pelas lápides do cemitério que cerca o Solar dos Corvos. Uma carta com o brasão da família Von Karlitz queima em seu bolso: "Venha antes da meia-noite, a linhagem está amaldiçoada". Quando você chega à varanda, o portão de ferro bate com um estrondo atrás de você, trancando-se sozinho. Um candelabro no saguão ilumina um rastro de cinzas que sobe as escadarias.',
  },
  {
    id: 'whispering_woods',
    title: 'A Floresta dos Sussurros Antigos',
    subtitle: 'Árvores retorcidas, fadas trapaceiras e uma relíquia druídica perdida',
    tone: 'survival',
    icon: '🌲',
    initialPrompt: 'Sob a copa densa da Floresta dos Sussurros, a luz solar quase não penetra. O mapa em suas mãos indica que o Círculo dos Menires deve estar a poucos quilômetros, mas as árvores parecem ter mudado de lugar nas últimas horas. Uma névoa luminescente lilás começa a dançar entre as raízes, e vozes suaves cantam em um dialeto élfico ancestral chamando pelo seu nome.',
  },
];

export interface RequestedRoll {
  skillOrAbility: string;
  dc?: number;
  reason: string;
}

export interface HandoutProposal {
  title: string;
  content: string;
  authorOrOrigin?: string;
}

export interface MonsterAttackAction {
  monsterName: string;
  attackName: string;
  attackBonus: number;
  damageFormula: string;
  target?: string;
  description?: string;
}

export interface MonsterSpawnAction {
  monsterName: string;
  count: number;
}

export interface MapMoveAction {
  tokenName: string;
  actionOrTarget: string;
  distanceSquares?: number;
}

export interface AiLootItem {
  name: string;
  quantity: number;
}

export interface AiLootReward {
  coins?: {
    cp?: number;
    sp?: number;
    ep?: number;
    gp?: number;
    pp?: number;
  };
  items?: AiLootItem[];
  rawText?: string;
}

export interface AiMessage {
  id: string;
  role: 'narrator' | 'player' | 'system';
  content: string;
  timestamp: number;
  suggestedActions?: string[];
  requestedRoll?: RequestedRoll;
  handoutProposal?: HandoutProposal;
  monsterAttack?: MonsterAttackAction;
  monsterSpawns?: MonsterSpawnAction[];
  mapMoves?: MapMoveAction[];
  defeatedMonsters?: string[];
  monsterDamage?: { monsterName: string; damage: number }[];
  lootReward?: AiLootReward;
}

export type AiProvider = 'groq' | 'gemini' | 'pollinations';

export interface AiProviderOption {
  id: AiProvider;
  name: string;
  badge?: string;
  icon: string;
  description: string;
  model: string;
  recommendedModel: string;
  requiresKey: boolean;
  keyUrl?: string;
  keyLabel?: string;
}

export const AI_PROVIDERS: AiProviderOption[] = [
  {
    id: 'groq',
    name: 'Groq (Llama 3.3 70B)',
    badge: 'Recomendado (Ultra-rápido < 1s)',
    icon: '⚡',
    description: 'Respostas em menos de 1 segundo com o modelo Llama 3.3 70B. 100% gratuito sem pedir cartão.',
    model: 'llama-3.3-70b-versatile',
    recommendedModel: 'llama-3.3-70b-versatile',
    requiresKey: true,
    keyUrl: 'https://console.groq.com/keys',
    keyLabel: 'Obter Chave Gratuita no console.groq.com',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Oficial Google AI',
    icon: '✨',
    description: 'Modelos Gemini 3.5 Flash-Lite e 3.6 Flash da Google AI Studio.',
    model: 'gemini-3.5-flash-lite',
    recommendedModel: 'gemini-3.5-flash-lite',
    requiresKey: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyLabel: 'Obter Chave no Google AI Studio',
  },
  {
    id: 'pollinations',
    name: 'Modo Livre (Pollinations)',
    badge: 'Sem Chave / Grátis',
    icon: '🌸',
    description: 'Funciona imediatamente sem necessidade de criar conta ou chave de API.',
    model: 'openai',
    recommendedModel: 'openai',
    requiresKey: false,
  },
];

export interface AiDmConfig {
  provider?: AiProvider;
  apiKey?: string;
  groqApiKey?: string;
  model: string;
  tone: AdventureTone;
  customInstructions: string;
  includeCharacterStats: boolean;
  campaignSummary?: string;
}

export type AiOracleAction = 
  | 'twist'          // Reviravolta de Combate / Trama
  | 'npc'            // Gerar NPC com Segredo & Motivação
  | 'puzzle'         // Quebra-cabeça / Enigma de Masmorra
  | 'handout'        // Documento / Carta Misteriosa
  | 'tavern_rumor'   // Rumor ou Gancho de Aventura
  | 'trap';          // Armadilha Mecânica / Mágica
