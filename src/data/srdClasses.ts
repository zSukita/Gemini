import type { AbilityKey, SkillKey } from '../types/dnd5e';

export interface SrdClassFeature {
  name: string;
  description: string;
}

export interface SrdClassEquipment {
  name: string;
  quantity: number;
  damage?: string;
  damageType?: string;
  range?: string;
  notes?: string;
}

export interface SrdClassDefinition {
  id: string;
  name: string;
  avatarUrl: string;
  description: string;
  hitDie: 'd6' | 'd8' | 'd10' | 'd12';
  hitDieValue: number;
  primaryAbilities: AbilityKey[];
  savingThrows: AbilityKey[];
  armorProficiencies: string;
  weaponProficiencies: string;
  spellcastingAbility?: AbilityKey;
  suggestedSkills: SkillKey[];
  features: SrdClassFeature[];
  startingEquipment: SrdClassEquipment[];
}

export const SRD_CLASSES: SrdClassDefinition[] = [
  {
    id: 'barbarian',
    name: 'Bárbaro',
    avatarUrl: '/tokens/classes/barbarian.png',
    description: 'Guerreiro feroz guiado pela fúria primordial, imensa vitalidade e resistência sobrenatural em batalha.',
    hitDie: 'd12',
    hitDieValue: 12,
    primaryAbilities: ['str', 'con'],
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Armaduras leves, médias e escudos',
    weaponProficiencies: 'Armas simples e marciais',
    suggestedSkills: ['athletics', 'intimidation', 'perception', 'survival'],
    features: [
      {
        name: 'Fúria (Rage)',
        description: 'Em combate, você pode entrar em fúria como ação bônus. Garante vantagem em testes de Força e salvaguardas de Força, +2 no dano de ataques corpo a corpo com Força e resistência contra dano concussivo, cortante e perfurante.',
      },
      {
        name: 'Defesa Sem Armadura (Unarmored Defense)',
        description: 'Enquanto não estiver vestindo armadura, sua Classe de Armadura é igual a 10 + Modificador de Destreza + Modificador de Constituição. Você pode usar um escudo e ainda receber esse benefício.',
      },
    ],
    startingEquipment: [
      { name: 'Machado Grande', quantity: 1, damage: '1d12', damageType: 'Cortante', range: 'Corpo a corpo 1,5m', notes: 'Pesado, Duas mãos' },
      { name: 'Machadinha de Arremesso', quantity: 2, damage: '1d6 + FOR', damageType: 'Cortante', range: 'Corpo a corpo / 6m-18m', notes: 'Leve, Arremesso' },
      { name: 'Javelim (Dardo)', quantity: 4, damage: '1d6 + FOR', damageType: 'Perfurante', range: '9m-36m', notes: 'Arremesso' },
    ],
  },
  {
    id: 'bard',
    name: 'Bardo',
    avatarUrl: '/tokens/classes/bard.png',
    description: 'Mestre da canção, fala e magia, manipulando ilusões, encantos e inspirando aliados com melodias arcanas.',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['cha', 'dex'],
    savingThrows: ['dex', 'cha'],
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, bestas de mão, espadas longas, rapieiras e espadas curtas',
    spellcastingAbility: 'cha',
    suggestedSkills: ['persuasion', 'performance', 'deception', 'insight'],
    features: [
      {
        name: 'Conjuração Bárdica',
        description: 'Você conjura magias usando Carisma como seu atributo de conjuração. Conhece truques e magias de 1º círculo da lista de bardo.',
      },
      {
        name: 'Inspiração de Bardo (d6)',
        description: 'Como ação bônus, você concede um dado de inspiração (1d6) a um aliado a até 18 metros. A criatura pode somar esse dado a um teste de atributo, ataque ou salvaguarda.',
      },
    ],
    startingEquipment: [
      { name: 'Rapieira', quantity: 1, damage: '1d8 + DES', damageType: 'Perfurante', range: 'Corpo a corpo 1,5m', notes: 'Acuidade' },
      { name: 'Adaga', quantity: 1, damage: '1d4 + DES', damageType: 'Perfurante', range: 'Corpo a corpo / 6m-18m', notes: 'Leve, Acuidade, Arremesso' },
      { name: 'Armadura de Couro', quantity: 1, notes: 'CA 11 + DES' },
      { name: 'Alaúde / Instrumento Musical', quantity: 1 },
    ],
  },
  {
    id: 'cleric',
    name: 'Clérigo',
    avatarUrl: '/tokens/classes/cleric.png',
    description: 'Campeão divino que empunha magia sagrada a serviço de uma divindade maior, curando feridos e esmagando mortos-vivos.',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['wis', 'con'],
    savingThrows: ['wis', 'cha'],
    armorProficiencies: 'Armaduras leves, médias e escudos (pesadas conforme o domínio)',
    weaponProficiencies: 'Armas simples',
    spellcastingAbility: 'wis',
    suggestedSkills: ['religion', 'insight', 'medicine', 'history'],
    features: [
      {
        name: 'Conjuração Divina',
        description: 'Você prepara magias divinas diariamente através de orações. Sabedoria é seu atributo de conjuração.',
      },
      {
        name: 'Domínio Divino (1º Nível)',
        description: 'Você escolhe um domínio relacionado à sua divindade (Vida, Luz, Guerra, etc.), concedendo magias de domínio e proficiências bônus.',
      },
    ],
    startingEquipment: [
      { name: 'Maça', quantity: 1, damage: '1d6 + FOR', damageType: 'Concussivo', range: 'Corpo a corpo 1,5m' },
      { name: 'Escudo de Madeira', quantity: 1, notes: '+2 CA' },
      { name: 'Cota de Malha / Gibão', quantity: 1, notes: 'Armadura' },
      { name: 'Símbolo Sagrado', quantity: 1, notes: 'Foco de conjuração' },
    ],
  },
  {
    id: 'druid',
    name: 'Druida',
    avatarUrl: '/tokens/classes/druid.png',
    description: 'Sacerdote da Natureza Antiga, canalizando os poderes elementais e assumindo as formas ferozes dos animais.',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['wis', 'con'],
    savingThrows: ['int', 'wis'],
    armorProficiencies: 'Armaduras leves, médias e escudos (não metálicos)',
    weaponProficiencies: 'Bordões, cimitarras, clavas, dardos, foices, fundas, lanças, maças e punhais',
    spellcastingAbility: 'wis',
    suggestedSkills: ['nature', 'animal_handling', 'survival', 'perception'],
    features: [
      {
        name: 'Conjuração Druídica',
        description: 'Você canaliza a energia divina da natureza para conjurar magias. Sabedoria é o atributo de conjuração.',
      },
      {
        name: 'Druídico (Idioma Secreto)',
        description: 'Você conhece o Druídico, a linguagem secreta dos druidas. Quem a domina consegue deixar mensagens ocultas.',
      },
    ],
    startingEquipment: [
      { name: 'Cimitarra', quantity: 1, damage: '1d6 + DES', damageType: 'Cortante', range: 'Corpo a corpo 1,5m', notes: 'Acuidade, Leve' },
      { name: 'Escudo de Madeira', quantity: 1, notes: '+2 CA' },
      { name: 'Armadura de Couro', quantity: 1, notes: 'CA 11 + DES' },
      { name: 'Foco Druídico (Ramo de Visco)', quantity: 1 },
    ],
  },
  {
    id: 'fighter',
    name: 'Guerreiro',
    avatarUrl: '/tokens/classes/fighter.png',
    description: 'Mestre inigualável das armas e do combate marcial, perito com qualquer armadura e táticas no campo de batalha.',
    hitDie: 'd10',
    hitDieValue: 10,
    primaryAbilities: ['str', 'con'],
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Todas as armaduras e escudos',
    weaponProficiencies: 'Armas simples e marciais',
    suggestedSkills: ['athletics', 'intimidation', 'perception', 'survival'],
    features: [
      {
        name: 'Estilo de Luta',
        description: 'Você adota um estilo de combate particular (Arquearia, Defesa, Duelismo, Combate com Duas Armas, etc.).',
      },
      {
        name: 'Retomar o Fôlego (Second Wind)',
        description: 'Você tem um poço de energia para se proteger. Em seu turno, você pode usar uma ação bônus para recuperar 1d10 + nível de guerreiro em PVs (uma vez por descanso curto/longo).',
      },
    ],
    startingEquipment: [
      { name: 'Espada Longa', quantity: 1, damage: '1d8 + FOR', damageType: 'Cortante', range: 'Corpo a corpo 1,5m', notes: 'Versátil (1d10)' },
      { name: 'Escudo de Ferro', quantity: 1, notes: '+2 CA' },
      { name: 'Besta Pesada', quantity: 1, damage: '1d10 + DES', damageType: 'Perfurante', range: '30m-120m', notes: 'Munição, Recarga' },
      { name: 'Cota de Malha', quantity: 1, notes: 'CA 16 (Armadura pesada)' },
    ],
  },
  {
    id: 'monk',
    name: 'Monge',
    avatarUrl: '/tokens/classes/monk.png',
    description: 'Mestre das artes marciais desarmadas, canalizando a energia do Ki corporal para desferir golpes relâmpago e feitos acrobáticos.',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['dex', 'wis'],
    savingThrows: ['str', 'dex'],
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Armas simples, espadas curtas',
    suggestedSkills: ['acrobatics', 'athletics', 'stealth', 'insight'],
    features: [
      {
        name: 'Defesa Sem Armadura (Monge)',
        description: 'Enquanto não estiver vestindo armadura nem usando escudo, sua CA é igual a 10 + Modificador de Destreza + Modificador de Sabedoria.',
      },
      {
        name: 'Artes Marciais (d4)',
        description: 'Seus golpes desarmados e armas de monge causam 1d4 de dano e usam Destreza em vez de Força. Ao atacar no seu turno, pode desferir um golpe desarmado como ação bônus.',
      },
    ],
    startingEquipment: [
      { name: 'Espada Curta', quantity: 1, damage: '1d6 + DES', damageType: 'Perfurante', range: 'Corpo a corpo 1,5m', notes: 'Acuidade, Leve' },
      { name: 'Golpe Desarmado', quantity: 1, damage: '1d4 + DES', damageType: 'Concussivo', range: 'Corpo a corpo 1,5m' },
      { name: 'Dardos', quantity: 10, damage: '1d4 + DES', damageType: 'Perfurante', range: '6m-18m', notes: 'Arremesso' },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladino',
    avatarUrl: '/tokens/classes/paladin.png',
    description: 'Guerreiro sagrado ligado por um juramento inquebrável, combinando poderio bélico letal com magia divina protetora.',
    hitDie: 'd10',
    hitDieValue: 10,
    primaryAbilities: ['str', 'cha'],
    savingThrows: ['wis', 'cha'],
    armorProficiencies: 'Todas as armaduras e escudos',
    weaponProficiencies: 'Armas simples e marciais',
    spellcastingAbility: 'cha',
    suggestedSkills: ['athletics', 'persuasion', 'insight', 'religion'],
    features: [
      {
        name: 'Sentido Divino (Divine Sense)',
        description: 'A presença de grande mal e bem reverbera em seus sentidos. Como ação, detecta a localização de celestiais, demônios e mortos-vivos a até 18 metros.',
      },
      {
        name: 'Cura pelas Mãos (Lay on Hands)',
        description: 'Você possui uma reserva de poder de cura igual a 5 × nível de paladino. Pode restaurar pontos de vida tocando uma criatura.',
      },
    ],
    startingEquipment: [
      { name: 'Espada Longa', quantity: 1, damage: '1d8 + FOR', damageType: 'Cortante', range: 'Corpo a corpo 1,5m', notes: 'Versátil (1d10)' },
      { name: 'Escudo', quantity: 1, notes: '+2 CA' },
      { name: 'Cota de Malha', quantity: 1, notes: 'CA 16' },
      { name: 'Símbolo Sagrado', quantity: 1 },
    ],
  },
  {
    id: 'ranger',
    name: 'Patrulheiro',
    avatarUrl: '/tokens/classes/ranger.png',
    description: 'Batedor implacável e caçador das fronteiras selvagens, especialista em rastreio, sobrevivência, arquearia e combate.',
    hitDie: 'd10',
    hitDieValue: 10,
    primaryAbilities: ['dex', 'wis'],
    savingThrows: ['str', 'dex'],
    armorProficiencies: 'Armaduras leves, médias e escudos',
    weaponProficiencies: 'Armas simples e marciais',
    spellcastingAbility: 'wis',
    suggestedSkills: ['survival', 'perception', 'stealth', 'nature'],
    features: [
      {
        name: 'Inimigo Favorito',
        description: 'Você ganha vantagem em testes de Sabedoria (Sobrevivência) para rastrear seus inimigos favoritos, bem como em testes de Inteligência para lembrar informações sobre eles.',
      },
      {
        name: 'Explorador Natural',
        description: 'Você é um perito no ambiente natural, ignorando terreno difícil para o grupo e permanecendo em alerta ao perigo mesmo enquanto viaja.',
      },
    ],
    startingEquipment: [
      { name: 'Arco Longo', quantity: 1, damage: '1d8 + DES', damageType: 'Perfurante', range: '45m-180m', notes: 'Duas mãos, Munição' },
      { name: 'Espadas Curtas (Par)', quantity: 2, damage: '1d6 + DES', damageType: 'Perfurante', range: 'Corpo a corpo 1,5m', notes: 'Leve, Acuidade' },
      { name: 'Armadura de Couro Batido', quantity: 1, notes: 'CA 12 + DES' },
    ],
  },
  {
    id: 'rogue',
    name: 'Ladino',
    avatarUrl: '/tokens/classes/rogue.png',
    description: 'Especialista em furtividade, precisão cirúrgica e perícias ladinas, explorando pontos fracos e armadilhas com maestria.',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['dex', 'int'],
    savingThrows: ['dex', 'int'],
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, bestas de mão, espadas curtas, espadas longas, rapieiras',
    suggestedSkills: ['stealth', 'sleight_of_hand', 'acrobatics', 'deception'],
    features: [
      {
        name: 'Ataque Furtivo (Sneak Attack - 1d6)',
        description: 'Uma vez por turno, você pode causar 1d6 de dano extra a uma criatura atingida com arma de acuidade ou à distância se tiver vantagem na jogada de ataque ou se um aliado estiver a 1,5m do alvo.',
      },
      {
        name: 'Especialização (Expertise)',
        description: 'Você dobra seu bônus de proficiência em duas de suas perícias escolhidas (ou em ferramentas de ladrão).',
      },
      {
        name: 'Gíria de Ladrão (Thieves\' Cant)',
        description: 'Dialeto secreto de gestos e códigos compreendido apenas pelo submundo.',
      },
    ],
    startingEquipment: [
      { name: 'Rapieira', quantity: 1, damage: '1d8 + DES', damageType: 'Perfurante', range: 'Corpo a corpo 1,5m', notes: 'Acuidade' },
      { name: 'Arco Curto', quantity: 1, damage: '1d6 + DES', damageType: 'Perfurante', range: '24m-96m', notes: 'Duas mãos' },
      { name: 'Adagas', quantity: 2, damage: '1d4 + DES', damageType: 'Perfurante', range: '6m-18m', notes: 'Leve, Acuidade, Arremesso' },
      { name: 'Ferramentas de Ladrão', quantity: 1, notes: 'Arrombar fechaduras e desarmar armadilhas' },
      { name: 'Armadura de Couro', quantity: 1, notes: 'CA 11 + DES' },
    ],
  },
  {
    id: 'sorcerer',
    name: 'Feiticeiro',
    avatarUrl: '/tokens/classes/sorcerer.png',
    description: 'Conjurador cuja magia pulsa diretamente em seu sangue por herança dracônica, caos primordial ou fada.',
    hitDie: 'd6',
    hitDieValue: 6,
    primaryAbilities: ['cha', 'con'],
    savingThrows: ['con', 'cha'],
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, bestas leves',
    spellcastingAbility: 'cha',
    suggestedSkills: ['arcana', 'deception', 'insight', 'persuasion'],
    features: [
      {
        name: 'Conjuração Feiticeira',
        description: 'Você canaliza a magia inata que corre em suas veias. Carisma é o seu atributo de conjuração.',
      },
      {
        name: 'Origem de Feitiçaria (1º Nível)',
        description: 'A fonte do seu poder mágico inato (ex: Linhagem Dracônica, Magia Selvagem), concedendo habilidades no nível 1.',
      },
    ],
    startingEquipment: [
      { name: 'Besta Leve', quantity: 1, damage: '1d8 + DES', damageType: 'Perfurante', range: '24m-96m', notes: 'Munição, Recarga' },
      { name: 'Adaga', quantity: 2, damage: '1d4 + DES', damageType: 'Perfurante', range: '6m-18m' },
      { name: 'Foco Arcano (Orbe / Cristal)', quantity: 1 },
    ],
  },
  {
    id: 'warlock',
    name: 'Bruxo',
    avatarUrl: '/tokens/classes/warlock.png',
    description: 'Barganhador de segredos cósmicos sob pacto com seres de poder incomensurável (Ínferos, Grandes Antigos ou Arquifadas).',
    hitDie: 'd8',
    hitDieValue: 8,
    primaryAbilities: ['cha', 'con'],
    savingThrows: ['wis', 'cha'],
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples',
    spellcastingAbility: 'cha',
    suggestedSkills: ['arcana', 'history', 'intimidation', 'religion'],
    features: [
      {
        name: 'Patrono de Outro Mundo (1º Nível)',
        description: 'Você fez um pacto místico com um patrono misterioso (Ínfero, Arquifada ou o Grande Antigo).',
      },
      {
        name: 'Magia de Pacto',
        description: 'Seus espaços de magia são recarregados após um Descanso Curto ou Longo, e sempre conjurados no círculo mais alto disponível.',
      },
    ],
    startingEquipment: [
      { name: 'Adaga', quantity: 2, damage: '1d4 + DES', damageType: 'Perfurante', range: '6m-18m' },
      { name: 'Armadura de Couro', quantity: 1, notes: 'CA 11 + DES' },
      { name: 'Foco Arcano', quantity: 1 },
    ],
  },
  {
    id: 'wizard',
    name: 'Mago',
    avatarUrl: '/tokens/classes/wizard.png',
    description: 'Estudioso supremo das artes arcanas, capaz de dobrar a própria realidade através de séculos de estudo e seu grimório.',
    hitDie: 'd6',
    hitDieValue: 6,
    primaryAbilities: ['int', 'con'],
    savingThrows: ['int', 'wis'],
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, bestas leves',
    spellcastingAbility: 'int',
    suggestedSkills: ['arcana', 'history', 'investigation', 'religion'],
    features: [
      {
        name: 'Conjuração Arcana & Grimório',
        description: 'Você possui um livro de magias (Grimório) contendo seus segredos arcanos. Inteligência é seu atributo de conjuração.',
      },
      {
        name: 'Recuperação Arcana',
        description: 'Uma vez por dia após um descanso curto, você pode recuperar uma quantidade de espaços de magia gastos equivalente a metade do seu nível de mago.',
      },
    ],
    startingEquipment: [
      { name: 'Bordão', quantity: 1, damage: '1d6 + FOR', damageType: 'Concussivo', range: 'Corpo a corpo 1,5m', notes: 'Versátil (1d8)' },
      { name: 'Grimório de Magias', quantity: 1, notes: 'Contém 6 magias de 1º círculo e 3 truques' },
      { name: 'Foco Arcano (Varinha)', quantity: 1 },
      { name: 'Bolsa de Componentes', quantity: 1 },
    ],
  },
];
