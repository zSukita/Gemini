import type { AbilityKey } from '../types/dnd5e';

export interface SrdRaceTrait {
  name: string;
  description: string;
}

export interface SrdRaceDefinition {
  id: string;
  name: string;
  description: string;
  size: 'Médio' | 'Pequeno';
  speed: number; // metros por turno (ex: 9m ou 7.5m)
  darkvision: number; // metros (0, 18m)
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  bonusChoicesCount?: number; // Para Meio-Elfo (+1 em dois outros atributos)
  traits: SrdRaceTrait[];
  languages: string[];
}

export const SRD_RACES: SrdRaceDefinition[] = [
  {
    id: 'human',
    name: 'Humano',
    description: 'Os mais adaptáveis, ambiciosos e diversos entre as raças comuns, capazes de prosperar em qualquer vocação.',
    size: 'Médio',
    speed: 9,
    darkvision: 0,
    abilityBonuses: {
      str: 1,
      dex: 1,
      con: 1,
      int: 1,
      wis: 1,
      cha: 1,
    },
    languages: ['Comum', 'Um idioma adicional à escolha'],
    traits: [
      {
        name: 'Versatilidade Humana',
        description: 'Você ganha +1 em todos os seis valores de atributos e aprende um idioma adicional.',
      },
    ],
  },
  {
    id: 'elf',
    name: 'Elfo',
    description: 'Povo gracioso e longevo com profunda ligação com a magia, a beleza florestal e as artes arcanas.',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    abilityBonuses: {
      dex: 2,
      int: 1,
    },
    languages: ['Comum', 'Élfico'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e na escuridão como se fosse penumbra.',
      },
      {
        name: 'Sentidos Aguçados',
        description: 'Você possui proficiência na perícia Percepção.',
      },
      {
        name: 'Ancestral Férico',
        description: 'Você tem vantagem em salvaguardas para resistir a ser enfeitiçado, e a magia não pode colocá-lo para dormir.',
      },
      {
        name: 'Transe',
        description: 'Elfos não precisam dormir. Eles meditam profundamente por 4 horas diárias, obtendo o benefício de 8 horas de descanso.',
      },
    ],
  },
  {
    id: 'dwarf',
    name: 'Anão',
    description: 'Mestres da cantaria e forja, conhecidos por sua coragem inabalável, tenacidade em batalha e profunda lealdade.',
    size: 'Médio',
    speed: 7.5,
    darkvision: 18,
    abilityBonuses: {
      con: 2,
      str: 2,
    },
    languages: ['Comum', 'Anão'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga na penumbra e escuridão a até 18 metros.',
      },
      {
        name: 'Resiliência Anã',
        description: 'Você tem vantagem em salvaguardas contra veneno e possui resistência contra dano de veneno.',
      },
      {
        name: 'Treinamento Anão em Combate',
        description: 'Proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra.',
      },
      {
        name: 'Esperteza com Pedras (Stonecunning)',
        description: 'Ao fazer testes de História sobre a origem de trabalhos em pedra, você adiciona o dobro do seu bônus de proficiência.',
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'Povo pacífico, amigável e alegre, dotado de uma sorte lendária e surpreendente bravura quando seus lares são ameaçados.',
    size: 'Pequeno',
    speed: 7.5,
    darkvision: 0,
    abilityBonuses: {
      dex: 2,
      cha: 1,
    },
    languages: ['Comum', 'Halfling'],
    traits: [
      {
        name: 'Sortudo (Lucky)',
        description: 'Quando você rola um 1 natural em uma jogada de ataque, teste de atributo ou salvaguarda, você pode rolar o dado novamente e usar o novo resultado.',
      },
      {
        name: 'Bravo (Brave)',
        description: 'Você tem vantagem em salvaguardas para resistir a ficar amedrontado.',
      },
      {
        name: 'Agilidade Halfling',
        description: 'Você pode se mover através do espaço de qualquer criatura que seja de um tamanho maior que o seu.',
      },
    ],
  },
  {
    id: 'dragonborn',
    name: 'Draconato',
    description: 'Orgulhosos guerreiros de herança dracônica que caminham pelo mundo carregando o sopro e a fúria elemental de dragões ancestrais.',
    size: 'Médio',
    speed: 9,
    darkvision: 0,
    abilityBonuses: {
      str: 2,
      cha: 1,
    },
    languages: ['Comum', 'Dracônico'],
    traits: [
      {
        name: 'Ancestralidade Dracônica',
        description: 'Você descende de um tipo de dragão (Fogo, Gelo, Relâmpago, Ácido ou Veneno), determinando o tipo de dano do seu sopro e resistência.',
      },
      {
        name: 'Arma de Sopro (Breath Weapon)',
        description: 'Você pode usar uma ação para exalar energia destrutiva (cone de 4,5m ou linha de 9m, 2d6 de dano). Cada criatura na área deve fazer uma salvaguarda.',
      },
      {
        name: 'Resistência a Dano Elemental',
        description: 'Você possui resistência ao tipo de dano associado à sua ancestralidade dracônica.',
      },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    description: 'Inventores curiosos, cheios de energia vibrante e sede insaciável por conhecimento científico, engenhocas e ilusões.',
    size: 'Pequeno',
    speed: 7.5,
    darkvision: 18,
    abilityBonuses: {
      int: 2,
      con: 1,
    },
    languages: ['Comum', 'Gnômico'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga no escuro e na penumbra a até 18 metros.',
      },
      {
        name: 'Astúcia Gnômica (Gnome Cunning)',
        description: 'Você tem vantagem em todas as salvaguardas de Inteligência, Sabedoria e Carisma contra magia.',
      },
    ],
  },
  {
    id: 'half-elf',
    name: 'Meio-Elfo',
    description: 'Caminhando entre dois mundos sem pertencer inteiramente a nenhum, combinam a graça élfica com a energia e determinação humana.',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    abilityBonuses: {
      cha: 2,
      dex: 1,
      con: 1,
    },
    bonusChoicesCount: 2,
    languages: ['Comum', 'Élfico', 'Um idioma adicional à escolha'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga no escuro e penumbra a até 18 metros.',
      },
      {
        name: 'Ancestral Férico',
        description: 'Vantagem em salvaguardas contra ser enfeitiçado; sono mágico não o afeta.',
      },
      {
        name: 'Versatilidade em Perícias',
        description: 'Você ganha proficiência em duas perícias adicionais à sua escolha.',
      },
    ],
  },
  {
    id: 'half-orc',
    name: 'Meio-Orc',
    description: 'Guerreiros de coração indomável que combinam a inteligência humana com a força brutal e a ferocidade de seus ancestrais orcs.',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    abilityBonuses: {
      str: 2,
      con: 1,
    },
    languages: ['Comum', 'Orc'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga no escuro e penumbra a até 18 metros.',
      },
      {
        name: 'Ameaçador',
        description: 'Você ganha proficiência imediata na perícia Intimidação.',
      },
      {
        name: 'Resistência Implacável (Relentless Endurance)',
        description: 'Quando você é reduzido a 0 pontos de vida mas não morre imediatamente, você pode cair para 1 ponto de vida em vez disso (1x por descanso longo).',
      },
      {
        name: 'Ataques Selvagens (Savage Attacks)',
        description: 'Quando você obtém um acerto crítico com uma arma corpo a corpo, você pode rolar um dos dados de dano da arma uma vez adicional e somá-lo ao dano crítico.',
      },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'Herdeiros de um pacto ancestral infernal, marcados com chifres e cauda, mas mestres do carisma sombrio e do fogo místico.',
    size: 'Médio',
    speed: 9,
    darkvision: 18,
    abilityBonuses: {
      cha: 2,
      int: 1,
    },
    languages: ['Comum', 'Infernal'],
    traits: [
      {
        name: 'Visão no Escuro (18 metros)',
        description: 'Você enxerga no escuro e penumbra a até 18 metros.',
      },
      {
        name: 'Resistência Infernal',
        description: 'Você possui resistência natural contra todo dano de fogo.',
      },
      {
        name: 'Legado Infernal',
        description: 'Você conhece o truque Taumaturgia. Ao subir de nível, aprende Repreensão Infernal (3º nvl) e Escuridão (5º nvl), usando Carisma.',
      },
    ],
  },
];
