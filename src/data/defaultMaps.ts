export interface DefaultMapPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  gridSize: number;
  width: number;
  height: number;
  imageUrl: string;
  isOnline?: boolean;
  author?: string;
  sourceUrl?: string;
}

export interface OnlineMapResource {
  name: string;
  url: string;
  description: string;
  category: string;
}

// Recursos e repositórios da internet recomendados para Mestres pegarem mapas
export const RECOMMENDED_MAP_SOURCES: OnlineMapResource[] = [
  {
    name: 'DnDavid Battlemaps HD (Google Drive Público)',
    url: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
    description: 'Acervo com mais de 150 battlemaps épicos em HD (Soulsborne, Ravenloft, Theros, Templos Orientais e Cenários Fantásticos).',
    category: 'Artistas Profissionais',
  },
  {
    name: 'OpenGameArt.org (VTT Maps)',
    url: 'https://opengameart.org/art-search-advanced?keys=battlemap&field_art_type_tid%5B%5D=9',
    description: 'Mapas de batalha gratuitos com licença aberta (CC0 / CC-BY) prontos para VTT.',
    category: 'Comunidade Aberta',
  },
  {
    name: 'Watabou Procgen Arcana (Gerador de Masmorras e Cidades)',
    url: 'https://watabou.github.io/',
    description: 'O padrão ouro para geração procedural de masmorras, cavernas e vilarejos em 1 clique.',
    category: 'Geradores Procedurais',
  },
  {
    name: 'Reddit r/battlemaps',
    url: 'https://www.reddit.com/r/battlemaps/',
    description: 'A maior comunidade do mundo de criadores compartilhando milhares de mapas de RPG em alta resolução.',
    category: 'Comunidade',
  },
  {
    name: 'Forgotten Adventures VTT',
    url: 'https://www.forgotten-adventures.net/',
    description: 'Mapas detalhados com texturas ricas de fantasia medieval.',
    category: 'Artistas Profissionais',
  },
];

export const DEFAULT_MAP_PRESETS: DefaultMapPreset[] = [
  // --- COLEÇÃO DNDAVID BATTLEMAPS HD (SOULEBORNE, GÓTICO & CLÁSSICO) ---
  {
    id: 'map-church-elleh',
    title: 'Ruínas do Templo de Pedra (Igreja de Elleh)',
    description: 'Ruínas ancestrais de cantaria com fogueira acesa, colunas desabadas e pedras sagradas ao entardecer.',
    category: 'Ruínas & Santuários',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/church_of_elleh.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-ravenloft-crypt',
    title: 'Castelo Ravenloft (Salão Nobre & Criptas)',
    description: 'Câmaras góticas com lajes antigas, arcadas de pedra e corredores sombrios propícios para encontros com vampiros e mortos-vivos.',
    category: 'Castelo & Gótico',
    gridSize: 50,
    width: 1163,
    height: 1600,
    imageUrl: '/maps/castle_ravenloft.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-margit-arena',
    title: 'Muralha da Cidadela & Portão do Castelo',
    description: 'Ponte fortificada estreita sobre o abismo na entrada da cidadela, ideal para confrontos épicos contra chefes e hordas.',
    category: 'Castelo & Fortaleza',
    gridSize: 30,
    width: 620,
    height: 827,
    imageUrl: '/maps/margit_boss_arena.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-rennala-library',
    title: 'Grande Biblioteca Arcana da Academia',
    description: 'Salão circular majestoso com estantes astronômicas de grimórios, cúpula mística e relíquias encantadas.',
    category: 'Arcano & Academia',
    gridSize: 50,
    width: 1499,
    height: 1600,
    imageUrl: '/maps/rennala_library.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-forest-shrine',
    title: 'Santuário da Floresta dos Sussurros',
    description: 'Clareira de bosque sagrado com estátuas de divindades da natureza, folhagens densas e posições elevadas para emboscadas.',
    category: 'Selva & Floresta',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/forest_shrine.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-fork-road',
    title: 'Encruzilhada da Estrada Real',
    description: 'Bifurcação estratégica entre colinas e vegetação com elevações de terreno, árvores frondosas e abrigo para patrulhas.',
    category: 'Selva & Floresta',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/fork_in_the_road.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-fire-temple',
    title: 'Templo do Fogo & Forja Vulcânica',
    description: 'Santuário subterrâneo de magma fervente com plataformas de pedra e passarelas estreitas sobre a lava.',
    category: 'Vulcânico & Masmorra',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/fire_temple.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-canyon-shrine',
    title: 'Santuário do Desfiladeiro de Pedra',
    description: 'Cânion árido com pilares talhados na rocha vermelha e altares devocionais sob o sol escaldante.',
    category: 'Deserto & Montanha',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/canyon_shrine.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-agora-market',
    title: 'Ágora & Mercado da Cidade Antiga',
    description: 'Praça cívica com colunatas de mármore, tendas de comércio e calçadas amplas para intrigas urbanas e combates na taverna/feira.',
    category: 'Cidade & Taverna',
    gridSize: 40,
    width: 1200,
    height: 1600,
    imageUrl: '/maps/agora_market.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  {
    id: 'map-undead-asylum',
    title: 'Refúgio dos Mortos-Vivos (Prisão Subterrânea)',
    description: 'Complexo de celas de pedra fria com portões de ferro, pátio central e atmosfera opressiva de confinamento medieval.',
    category: 'Masmorra & Prisão',
    gridSize: 40,
    width: 1600,
    height: 1600,
    imageUrl: '/maps/undead_asylum.jpg',
    author: 'DnDavid',
    sourceUrl: 'https://drive.google.com/drive/folders/1QiBxKfHjNdYvmuw6mMfigqunJZrn50QH',
  },
  // --- MAPAS DA INTERNET (WEB BATTLE MAPS) ---
  {
    id: 'map-online-cavern',
    title: 'Caverna dos Cristais e Rio Subterrâneo',
    description: 'Caverna natural com rio subterrâneo, ponte de pedra estreita e passagens táticas esculpidas na rocha.',
    category: 'Cavernas & Subterrâneo',
    gridSize: 50,
    width: 1800,
    height: 1200,
    imageUrl: 'https://opengameart.org/sites/default/files/cavern.png',
    isOnline: true,
    author: 'Ferrin (OpenGameArt)',
    sourceUrl: 'https://opengameart.org/content/cavern-battlemap',
  },
  {
    id: 'map-online-deep-ocean',
    title: 'Abismo do Oceano Profundo',
    description: 'Águas abissais em alta resolução, perfeito para encontros náuticos, monstros marinhos, krakens e navios.',
    category: 'Aquático & Mar',
    gridSize: 50,
    width: 1920,
    height: 1200,
    imageUrl: 'https://opengameart.org/sites/default/files/deep_ocean_battlemap.png',
    isOnline: true,
    author: 'MiniModele (OpenGameArt)',
    sourceUrl: 'https://opengameart.org/content/deep-ocean-battlemap',
  },
  {
    id: 'map-online-bodiam-castle',
    title: 'Planta da Fortaleza de Bodiam (Castelo Histórico)',
    description: 'Planta de arquitetura autêntica de castelo medieval fortificado com fossos, salão nobre e torres.',
    category: 'Castelo & Fortaleza',
    gridSize: 50,
    width: 1400,
    height: 1000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bodiam_Castle_ground_plan.jpg',
    isOnline: true,
    author: 'Wikimedia Commons (Domínio Público)',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bodiam_Castle_ground_plan.jpg',
  },

  // --- MAPAS INTEGRADOS EM VETOR SVG HD ---
  {
    id: 'map-dungeon',
    title: 'Masmorra dos Ecos Sombrios',
    description: 'Corredores de pedra antiga com salas de pilares, tochas ardentes e celas misteriosas.',
    category: 'Masmorra',
    gridSize: 50,
    width: 1200,
    height: 800,
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="dungeonTiles" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="%231a1d24" stroke="%23111318" stroke-width="1.5"/>
          <path d="M5,10 L45,10 M10,25 L40,25 M5,40 L45,40" stroke="%23242833" stroke-width="0.75" opacity="0.6"/>
          <rect x="2" y="2" width="46" height="46" fill="none" stroke="%232b3140" stroke-width="0.5" opacity="0.3"/>
        </pattern>
        <radialGradient id="torchGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%23ff9d00" stop-opacity="0.45"/>
          <stop offset="60%" stop-color="%23ff5500" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="800" fill="%230e1015"/>
      <rect x="50" y="50" width="400" height="350" fill="url(%23dungeonTiles)"/>
      <rect x="400" y="150" width="400" height="150" fill="url(%23dungeonTiles)"/>
      <rect x="750" y="50" width="400" height="400" fill="url(%23dungeonTiles)"/>
      <rect x="550" y="300" width="150" height="450" fill="url(%23dungeonTiles)"/>
      <rect x="150" y="450" width="450" height="300" fill="url(%23dungeonTiles)"/>
      <rect x="700" y="500" width="450" height="250" fill="url(%23dungeonTiles)"/>
      <circle cx="200" cy="180" r="18" fill="%233a4152" stroke="%23151821" stroke-width="3"/>
      <circle cx="300" cy="180" r="18" fill="%233a4152" stroke="%23151821" stroke-width="3"/>
      <circle cx="900" cy="200" r="18" fill="%233a4152" stroke="%23151821" stroke-width="3"/>
      <circle cx="1000" cy="200" r="18" fill="%233a4152" stroke="%23151821" stroke-width="3"/>
      <circle cx="60" cy="150" r="60" fill="url(%23torchGlow)"/>
      <circle cx="60" cy="150" r="5" fill="%23ffdd00"/>
      <circle cx="440" cy="150" r="60" fill="url(%23torchGlow)"/>
      <circle cx="440" cy="150" r="5" fill="%23ffdd00"/>
      <circle cx="1140" cy="200" r="60" fill="url(%23torchGlow)"/>
      <circle cx="1140" cy="200" r="5" fill="%23ffdd00"/>
      <circle cx="200" cy="460" r="60" fill="url(%23torchGlow)"/>
      <circle cx="200" cy="460" r="5" fill="%23ffdd00"/>
    </svg>`,
  },
  {
    id: 'map-crypt',
    title: 'Cripta dos Ancestrais Esquecidos',
    description: 'Catacumbas subterrâneas com sarcófagos milenares, runas necromânticas e fogo espectral.',
    category: 'Masmorra & Cripta',
    gridSize: 50,
    width: 1200,
    height: 800,
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="cryptTiles" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="%2315191e" stroke="%230c0e12" stroke-width="1.5"/>
          <circle cx="25" cy="25" r="1" fill="%23394557" opacity="0.4"/>
        </pattern>
        <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%2310b981" stop-opacity="0.5"/>
          <stop offset="70%" stop-color="%23047857" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="800" fill="%23090b0e"/>
      <rect x="100" y="80" width="1000" height="640" fill="url(%23cryptTiles)" stroke="%231f2937" stroke-width="8"/>
      <!-- Sarcófagos Centrais -->
      <rect x="250" y="200" width="60" height="120" fill="%23374151" stroke="%23111827" stroke-width="3" rx="4"/>
      <rect x="250" y="480" width="60" height="120" fill="%23374151" stroke="%23111827" stroke-width="3" rx="4"/>
      <rect x="890" y="200" width="60" height="120" fill="%23374151" stroke="%23111827" stroke-width="3" rx="4"/>
      <rect x="890" y="480" width="60" height="120" fill="%23374151" stroke="%23111827" stroke-width="3" rx="4"/>
      <!-- Altar Central Rúnico -->
      <circle cx="600" cy="400" r="120" fill="%231e293b" stroke="%23047857" stroke-width="4"/>
      <circle cx="600" cy="400" r="150" fill="url(%23greenGlow)"/>
      <polygon points="600,320 670,440 530,440" fill="none" stroke="%2334d399" stroke-width="3" opacity="0.8"/>
      <polygon points="600,480 670,360 530,360" fill="none" stroke="%2334d399" stroke-width="3" opacity="0.8"/>
      <circle cx="600" cy="400" r="25" fill="%23064e3b" stroke="%236ee7b7" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'map-forest',
    title: 'Clareira das Ruínas Élficas',
    description: 'Uma clareira arborizada com riacho sinuoso, ponte de madeira e altares antigos.',
    category: 'Selva & Floresta',
    gridSize: 50,
    width: 1200,
    height: 800,
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="grass" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="%231c331e"/>
          <circle cx="12" cy="15" r="2" fill="%232e5431" opacity="0.7"/>
          <circle cx="38" cy="35" r="2.5" fill="%23142415" opacity="0.6"/>
          <circle cx="25" cy="42" r="1.5" fill="%233a693e" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="1200" height="800" fill="url(%23grass)"/>
      <path d="M 0,350 Q 300,450 600,320 T 1200,400 L 1200,500 Q 900,400 600,420 T 0,450 Z" fill="%231a4c6e" stroke="%2313364f" stroke-width="4"/>
      <rect x="570" y="320" width="60" height="110" fill="%235c3a21" stroke="%233d2616" stroke-width="2"/>
      <line x1="570" y1="350" x2="630" y2="350" stroke="%233d2616" stroke-width="2"/>
      <line x1="570" y1="380" x2="630" y2="380" stroke="%233d2616" stroke-width="2"/>
      <line x1="570" y1="410" x2="630" y2="410" stroke="%233d2616" stroke-width="2"/>
      <circle cx="150" cy="150" r="70" fill="%2317421a" stroke="%230f2b11" stroke-width="4"/>
      <circle cx="150" cy="150" r="45" fill="%23245c29"/>
      <circle cx="1050" cy="180" r="85" fill="%2317421a" stroke="%230f2b11" stroke-width="4"/>
      <circle cx="1050" cy="180" r="55" fill="%23245c29"/>
      <circle cx="250" cy="700" r="80" fill="%2317421a" stroke="%230f2b11" stroke-width="4"/>
      <circle cx="950" cy="680" r="75" fill="%2317421a" stroke="%230f2b11" stroke-width="4"/>
      <rect x="500" y="100" width="200" height="140" fill="%2348505e" stroke="%232d323b" stroke-width="3" rx="4"/>
      <rect x="550" y="130" width="100" height="80" fill="%2323272e" stroke="%2315171c" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'map-road-crossroads',
    title: 'Encruzilhada da Estrada Real',
    description: 'Estrada de terra batida entre árvores frondosas e rochedos, ponto ideal para emboscadas de bandidos ou monstros.',
    category: 'Selva & Floresta',
    gridSize: 50,
    width: 1200,
    height: 800,
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="roadGrass" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="%23243c22"/>
          <circle cx="10" cy="10" r="1.5" fill="%233a5e37" opacity="0.6"/>
          <circle cx="35" cy="40" r="2" fill="%231a2c19" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="1200" height="800" fill="url(%23roadGrass)"/>
      <!-- Cruzamento de terra -->
      <path d="M 0,340 L 1200,340 L 1200,460 L 0,460 Z" fill="%23735132" stroke="%234d351f" stroke-width="3"/>
      <path d="M 540,0 L 540,800 L 660,800 L 660,0 Z" fill="%23735132" stroke="%234d351f" stroke-width="3"/>
      <!-- Carroça tombada -->
      <rect x="350" y="320" width="80" height="50" fill="%23422a18" stroke="%232b1a0d" stroke-width="2" transform="rotate(-15 350 320)"/>
      <circle cx="340" cy="315" r="12" fill="%232b1a0d"/>
      <circle cx="430" cy="335" r="12" fill="%232b1a0d"/>
      <!-- Árvores e pedras de cobertura -->
      <circle cx="200" cy="180" r="65" fill="%231b471c" stroke="%23112c12" stroke-width="3"/>
      <circle cx="1000" cy="220" r="75" fill="%231b471c" stroke="%23112c12" stroke-width="3"/>
      <circle cx="220" cy="620" r="70" fill="%231b471c" stroke="%23112c12" stroke-width="3"/>
      <circle cx="980" cy="600" r="80" fill="%231b471c" stroke="%23112c12" stroke-width="3"/>
      <ellipse cx="480" cy="220" rx="30" ry="20" fill="%2358606e" stroke="%23363b45" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'map-tavern',
    title: 'Taverna do Dragão Sonolento',
    description: 'Salão aconchegante com balcão de carvalho, lareira crepitante e mesas redondas.',
    category: 'Cidade & Taverna',
    gridSize: 50,
    width: 1000,
    height: 700,
    imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
      <defs>
        <pattern id="woodPlanks" width="50" height="25" patternUnits="userSpaceOnUse">
          <rect width="50" height="25" fill="%23422a1d" stroke="%232b1b12" stroke-width="1.2"/>
          <line x1="0" y1="12" x2="50" y2="12" stroke="%23573827" stroke-width="0.6"/>
        </pattern>
        <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="%23ff6600" stop-opacity="0.6"/>
          <stop offset="70%" stop-color="%23ff2200" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="%23000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1000" height="700" fill="%231f150f"/>
      <rect x="40" y="40" width="920" height="620" fill="url(%23woodPlanks)" stroke="%23120c08" stroke-width="6"/>
      <path d="M 120,120 L 450,120 L 450,220 L 400,220 L 400,160 L 120,160 Z" fill="%236e4732" stroke="%233b251a" stroke-width="3"/>
      <rect x="860" y="250" width="100" height="150" fill="%23545b66" stroke="%232b2f36" stroke-width="4"/>
      <circle cx="910" cy="325" r="100" fill="url(%23fireGlow)"/>
      <ellipse cx="910" cy="325" rx="25" ry="35" fill="%23ff9900"/>
      <g transform="translate(250, 450)">
        <circle cx="0" cy="0" r="40" fill="%235c3a27" stroke="%23301e14" stroke-width="3"/>
        <circle cx="0" cy="-55" r="12" fill="%23382318"/>
        <circle cx="0" cy="55" r="12" fill="%23382318"/>
        <circle cx="-55" cy="0" r="12" fill="%23382318"/>
        <circle cx="55" cy="0" r="12" fill="%23382318"/>
      </g>
      <g transform="translate(600, 450)">
        <circle cx="0" cy="0" r="40" fill="%235c3a27" stroke="%23301e14" stroke-width="3"/>
        <circle cx="0" cy="-55" r="12" fill="%23382318"/>
        <circle cx="0" cy="55" r="12" fill="%23382318"/>
        <circle cx="-55" cy="0" r="12" fill="%23382318"/>
        <circle cx="55" cy="0" r="12" fill="%23382318"/>
      </g>
      <g transform="translate(650, 200)">
        <circle cx="0" cy="0" r="35" fill="%235c3a27" stroke="%23301e14" stroke-width="3"/>
        <circle cx="-45" cy="0" r="10" fill="%23382318"/>
        <circle cx="45" cy="0" r="10" fill="%23382318"/>
      </g>
    </svg>`,
  },
];
