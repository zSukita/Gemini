// Gerador Rápido de NPCs & Rumores para Mestres de D&D 5e

export interface GeneratedNpc {
  id: string;
  name: string;
  gender: 'masculino' | 'feminino' | 'neutro';
  race: string;
  occupation: string;
  alignment: string;
  appearance: string;
  mannerism: string;
  secret: string;
  rumor: string;
  quote: string;
}

const FIRST_NAMES_MALE: Record<string, string[]> = {
  Humano: ['Alrik', 'Bram', 'Corin', 'Darian', 'Edgar', 'Finnian', 'Gareth', 'Jarek', 'Lucan', 'Merek', 'Roderik', 'Tomas'],
  Elfo: ['Aelar', 'Adran', 'Berrian', 'Enialis', 'Feylin', 'Galan', 'Ivellios', 'Laucian', 'Quarion', 'Soveliss', 'Theren'],
  Anão: ['Adrik', 'Baern', 'Brokk', 'Dain', 'Eberk', 'Fargrim', 'Kildrak', 'Morgran', 'Orsik', 'Rurik', 'Thorin', 'Vondal'],
  Halfling: ['Alton', 'Ander', 'Cade', 'Corrin', 'Eldon', 'Garret', 'Lyle', 'Milo', 'Osborn', 'Perrin', 'Reed', 'Wellby'],
  Tiefling: ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon', 'Leucis', 'Mephist', 'Mordai', 'Pelaios', 'Theron'],
  Draconato: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Nadarr', 'Patrin', 'Rhogar', 'Torinn'],
  'Meio-Orc': ['Dench', 'Feng', 'Gell', 'Henk', 'Holg', 'Imsh', 'Keth', 'Krusk', 'Mhurren', 'Ront', 'Thokk'],
  Gnomo: ['Boddynock', 'Dimble', 'Fonkin', 'Gerbo', 'Gimble', 'Glim', 'Namfoodle', 'Roondar', 'Seebo', 'Warryn', 'Zook'],
};

const FIRST_NAMES_FEMALE: Record<string, string[]> = {
  Humano: ['Althea', 'Brena', 'Catelyn', 'Dara', 'Elysia', 'Gwendolyn', 'Hanna', 'Isolde', 'Kara', 'Lyra', 'Mira', 'Rowan'],
  Elfo: ['Althaea', 'Anastrianna', 'Bryn', 'Caelynn', 'Drusilia', 'Felosial', 'Ielenia', 'Lia', 'Miri', 'Quelenna', 'Silaqui', 'Valanthe'],
  Anão: ['Amber', 'Artin', 'Audhild', 'Dagnal', 'Diesa', 'Eldeth', 'Gunnloda', 'Gurdis', 'Helja', 'Kathra', 'Kristryd', 'Vistra'],
  Halfling: ['Andry', 'Bree', 'Callie', 'Cora', 'Euphemia', 'Jillian', 'Kithri', 'Lavinia', 'Lidda', 'Merla', 'Nedda', 'Verna'],
  Tiefling: ['Akta', 'Anakis', 'Bryseis', 'Criella', 'Damaia', 'Kallista', 'Lerissa', 'Makaria', 'Nemeia', 'Orianna', 'Rieta'],
  Draconato: ['Akra', 'Biri', 'Daar', 'Harann', 'Havilar', 'Jheri', 'Kava', 'Korinn', 'Mishann', 'Nala', 'Perra', 'Surina'],
  'Meio-Orc': ['Baggi', 'Emen', 'Engong', 'Kansif', 'Myev', 'Neega', 'Ovak', 'Ownka', 'Shautha', 'Sutha', 'Vola'],
  Gnomo: ['Bimpnottin', 'Breena', 'Caramip', 'Donella', 'Duvamil', 'Ella', 'Ellywick', 'Lilli', 'Loopmottin', 'Mardnab', 'Nissa'],
};

const SURNAMES: Record<string, string[]> = {
  Humano: ['Falcão-de-Ferro', 'Valente', 'Monte-Claro', 'Penedo', 'Corvo-Negro', 'Madeira-Firme', 'Água-Viva', 'Pele-de-Urso'],
  Elfo: ['Lua-Cintilante', 'Fronde-Verde', 'Brisa-Estelar', 'Canto-das-Folhas', 'Orvalho-da-Manhã', 'Passo-Silencioso', 'Sombra-do-Bosque'],
  Anão: ['Machado-de-Fogo', 'Barba-de-Ferro', 'Martelo-de-Guerra', 'Bigorna-Dourada', 'Mina-Profunda', 'Pescoço-de-Pedra', 'Trançabronze'],
  Halfling: ['Colina-Verde', 'Pé-Ligeiro', 'Bolsa-Cheia', 'Barril-Doce', 'Chá-Quente', 'Salto-do-Sapo', 'Casa-Aconchegante'],
  Tiefling: ['da Noite', 'Sem-Destino', 'do Cinzel', 'Maldito', 'Cinza-Eterna', 'do Rancor', 'Sussurro-Sombrio'],
  Draconato: ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik', 'Turnuroth'],
  'Meio-Orc': ['Presa-Quebrada', 'Olho-Furioso', 'Lança-Partida', 'Cicatriz-de-Ferro', 'Braço-de-Ferro', 'Punho-de-Aço'],
  Gnomo: ['Engrenagem-Maluco', 'Faísca-Viva', 'Mola-Mágica', 'Vidro-Azul', 'Pó-de-Estrela', 'Parafuso-Torto'],
};

const RACES = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Tiefling', 'Draconato', 'Meio-Orc', 'Gnomo'];

const OCCUPATIONS = [
  'Taverneiro / Estalajadeiro',
  'Guarda da Patrulha Urbana',
  'Ferreiro de Armas e Armaduras',
  'Herbalista e Curandeiro',
  'Nobre Decadente / Colecionador',
  'Mercenário Veterano',
  'Caçador de Recompensas',
  'Menestrel e Bardo Itinerante',
  'Ladino / Espião da Guilda das Sombras',
  'Sacerdote de Templo Local',
  'Alquimista e Boticário',
  'Comerciante de Especiarias e Joias',
  'Pescador / Barqueiro do Rio',
  'Arqueólogo de Ruínas Antigas',
  'Marinheiro / Corsário Aposentado',
  'Bibliotecário e Tradutor de Pergaminhos',
];

const ALIGNMENTS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro Verdadeiro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'
];

const APPEARANCES = [
  'Cicatriz profunda cruzando o olho esquerdo, coberto por tapa-olho bordado.',
  'Olhos heterocromáticos (um âmbar, outro azul-gelo) que fitam intensamente.',
  'Mãos cobertas de queimaduras alquímicas e dedos manchados de tinta roxa.',
  'Usa um manto de veludo desgastado com broche prateado de família nobre.',
  'Sorriso fácil com um dente de ouro proeminente.',
  'Barba farta e trançada com pequenos anéis de prata e contas de osso.',
  'Tatuagens rúnicas brilhantes no pescoço que parecem formigar no frio.',
  'Porta uma capa de viagem impermeável cheia de bolsos secretos e cheiro de tabaco.',
  'Olhar cansado de veterano de guerra com postura impecavelmente ereta.',
  'Cabelos desgrenhados com penas de falcão presas nas têmporas.',
];

const MANNERISMS = [
  'Fala num sussurro conspiratório, como se as paredes tivessem ouvidos.',
  'Limpa obsessivamente um caneco ou uma moeda entre os nós dos dedos enquanto conversa.',
  'Ri alto em momentos tensos ou inapropriados para disfarçar o nervosismo.',
  'Gesticula com as mãos de forma ampla e teatral antes de dar qualquer resposta.',
  'Pausa longamente antes de responder, medindo cada palavra com frieza militar.',
  'Clica a língua no céu da boca quando desconfia do interlocutor.',
  'Olha frequentemente em direção às portas e janelas antes de revelar detalhes.',
  'Mastiga raízes secas de anis que soltam uma fumaça com aroma doce.',
];

const SECRETS = [
  'Deve uma quantia impagável ao chefe da guilda clandestina e procura uma saída.',
  'Possui um fragmento de chave antiga encontrada nos esgotos que abre uma cripta sob a capela.',
  'É um espião infiltrado a serviço de uma dinastia nobre vizinha.',
  'Acidentalmente libertou um espírito menor ao quebrar um frasco que comprou no mercado negro.',
  'Guarda o testamento original de um senhor feudal dado como morto em batalha.',
  'Reconheceu um dos aventureiros de um cartaz de procurado numa cidade costeira distante.',
  'Pratica rituais arcanos proibidos no sótão para tentar curar a doença de um ente querido.',
  'Foi o único sobrevivente de uma expedição a uma masmorra próxima e sabe a armadilha do primeiro andar.',
];

const RUMORS = [
  '“Dizem que luzes azuis fantasmagóricas dançam nas ruínas da velha abadia a cada lua nova.”',
  '“As caravanas que cruzam a floresta sussurrante estão sumindo sem deixar rastros nem carroças.”',
  '“O capitão da guarda anda comprando poções estranhas de um boticário encapuzado no porto.”',
  '“Dizem que um dragão ferido caiu nos picos nevados e monstros menores disputam seu tesouro.”',
  '“O conde trancou as portas do castelo há três semanas e ninguém mais foi visto entrando ou saindo.”',
  '“Um mago renegado ofereceu mil peças de ouro para quem trouxer intacta a flor que só nasce no pântano.”',
];

const QUOTES = [
  '“Toda informação tem seu preço, aventureiro. O meu é justo... se você tiver ouro.”',
  '“Não se meta nos becos depois que o sino da meia-noite tocar, a menos que queira perder a bolsa ou o pescoço.”',
  '“Já vi heróis mais fortes que você virarem comida de verme naquelas catacumbas.”',
  '“O destino é um rio agitado, amigos; às vezes é melhor nadar com a corrente.”',
  '“Mantenham suas lâminas afiadas e suas dúvidas em silêncio se quiserem sair daqui inteiros.”',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNpc(overrideRace?: string, overrideGender?: 'masculino' | 'feminino'): GeneratedNpc {
  const race = overrideRace || pick(RACES);
  const gender = overrideGender || (Math.random() > 0.5 ? 'masculino' : 'feminino');

  const nameList = gender === 'masculino' 
    ? (FIRST_NAMES_MALE[race] || FIRST_NAMES_MALE.Humano)
    : (FIRST_NAMES_FEMALE[race] || FIRST_NAMES_FEMALE.Humano);
  
  const firstName = pick(nameList);
  const surname = pick(SURNAMES[race] || SURNAMES.Humano);
  const fullName = `${firstName} ${surname}`;

  return {
    id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fullName,
    gender,
    race,
    occupation: pick(OCCUPATIONS),
    alignment: pick(ALIGNMENTS),
    appearance: pick(APPEARANCES),
    mannerism: pick(MANNERISMS),
    secret: pick(SECRETS),
    rumor: pick(RUMORS),
    quote: pick(QUOTES),
  };
}
