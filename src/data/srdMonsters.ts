import type { Monster } from '../types/combat';

export const SRD_MONSTERS: Monster[] = [
  {
    "id": "srd-goblin",
    "name": "Goblin",
    "avatarUrl": "/tokens/monsters/goblin.png",
    "size": "Pequeno",
    "type": "Humanoide (goblinóide)",
    "alignment": "Neutro e Mau",
    "armorClass": 15,
    "armorType": "Armadura de Couro, Escudo",
    "hitPoints": 7,
    "hitDice": "2d6",
    "speed": "9m",
    "abilities": {
      "str": 8,
      "dex": 14,
      "con": 10,
      "int": 10,
      "wis": 8,
      "cha": 8
    },
    "challengeRating": "1/4",
    "xp": 50,
    "senses": "Visão no Escuro 18m, Percepção Passiva 9",
    "languages": "Comum, Goblin",
    "traits": [
      {
        "name": "Fuga Ágil (Nimble Escape)",
        "description": "O goblin pode realizar a ação de Desengajar ou Esconder-se como uma ação bônus em cada um dos seus turnos."
      }
    ],
    "actions": [
      {
        "name": "Cimitarra",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Arco Curto",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Perfurante",
        "range": "24m / 96m",
        "description": "Ataque à distância com arma: distância 24/96m, um alvo."
      }
    ]
  },
  {
    "id": "srd-skeleton",
    "name": "Esqueleto",
    "avatarUrl": "/tokens/monsters/skeleton.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Ordeiro e Mau",
    "armorClass": 13,
    "armorType": "Restos de Armadura",
    "hitPoints": 13,
    "hitDice": "2d8 + 4",
    "speed": "9m",
    "abilities": {
      "str": 10,
      "dex": 14,
      "con": 15,
      "int": 6,
      "wis": 8,
      "cha": 5
    },
    "challengeRating": "1/4",
    "xp": 50,
    "senses": "Visão no Escuro 18m, Percepção Passiva 9",
    "languages": "Compreende os idiomas que falava em vida, mas não fala",
    "traits": [
      {
        "name": "Vulnerabilidade a Dano",
        "description": "Vulnerável a dano Contundente. Imune a dano de Veneno e à condição Envenenado."
      }
    ],
    "actions": [
      {
        "name": "Espada Curta",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Arco Curto",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Perfurante",
        "range": "24m / 96m",
        "description": "Ataque com arma à distância: distância 24/96m, um alvo."
      }
    ]
  },
  {
    "id": "srd-zombie",
    "name": "Zumbi",
    "avatarUrl": "/tokens/monsters/zombie.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Neutro e Mau",
    "armorClass": 8,
    "hitPoints": 22,
    "hitDice": "3d8 + 9",
    "speed": "6m",
    "abilities": {
      "str": 13,
      "dex": 6,
      "con": 16,
      "int": 3,
      "wis": 6,
      "cha": 5
    },
    "challengeRating": "1/4",
    "xp": 50,
    "senses": "Visão no Escuro 18m, Percepção Passiva 8",
    "languages": "Compreende os idiomas que falava em vida, mas não fala",
    "traits": [
      {
        "name": "Fortitude de Morto-Vivo",
        "description": "Se o dano reduzir o zumbi a 0 PV, ele realiza uma salvaguarda de CON com CD 5 + o dano sofrido, a não ser que o dano seja radiante ou de um acerto crítico. Se tiver sucesso, fica com 1 PV."
      }
    ],
    "actions": [
      {
        "name": "Pancada (Slam)",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-orc",
    "name": "Orc Guerreiro",
    "avatarUrl": "/tokens/monsters/orc.png",
    "size": "Médio",
    "type": "Humanoide (orc)",
    "alignment": "Caótico e Mau",
    "armorClass": 13,
    "armorType": "Armadura de Couro Batido",
    "hitPoints": 15,
    "hitDice": "2d8 + 6",
    "speed": "9m",
    "abilities": {
      "str": 16,
      "dex": 12,
      "con": 16,
      "int": 7,
      "wis": 11,
      "cha": 10
    },
    "challengeRating": "1/2",
    "xp": 100,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Comum, Orc",
    "traits": [
      {
        "name": "Agressivo (Aggressive)",
        "description": "Como uma ação bônus, o orc pode mover-se até seu deslocamento em direção a uma criatura hostil que ele possa ver."
      }
    ],
    "actions": [
      {
        "name": "Machado Grande (Greataxe)",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d12 + 3",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Azagaia (Javelin)",
        "type": "ranged",
        "attackBonus": 5,
        "damageFormula": "1d6 + 3",
        "damageType": "Perfurante",
        "range": "9m / 36m",
        "description": "Ataque corpo a corpo ou à distância: alcance 1,5m ou 9/36m."
      }
    ]
  },
  {
    "id": "srd-wolf",
    "name": "Lobo Selvagem",
    "size": "Médio",
    "type": "Besta",
    "alignment": "Sem Tendência",
    "armorClass": 13,
    "hitPoints": 11,
    "hitDice": "2d8 + 2",
    "speed": "12m",
    "abilities": {
      "str": 12,
      "dex": 15,
      "con": 12,
      "int": 3,
      "wis": 12,
      "cha": 6
    },
    "challengeRating": "1/4",
    "xp": 50,
    "senses": "Percepção Passiva 13",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Olfato e Audição Aguçados",
        "description": "Vantagem em testes de Sabedoria (Percepção) relacionados ao olfato ou audição."
      },
      {
        "name": "Táticas de Matilha (Pack Tactics)",
        "description": "Vantagem nas jogadas de ataque se pelo menos um aliado do lobo estiver a 1,5m do alvo e não estiver incapacitado."
      }
    ],
    "actions": [
      {
        "name": "Mordida (Bite)",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "2d4 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m, um alvo. Se o alvo for uma criatura, deve ser bem-sucedido em uma salvaguarda de FOR CD 11 ou cairá no chão (Caído)."
      }
    ]
  },
  {
    "id": "srd-ogre",
    "name": "Ogro",
    "avatarUrl": "/tokens/monsters/ogre.png",
    "size": "Grande",
    "type": "Gigante",
    "alignment": "Caótico e Mau",
    "armorClass": 11,
    "armorType": "Armadura de Pele",
    "hitPoints": 59,
    "hitDice": "7d10 + 21",
    "speed": "12m",
    "abilities": {
      "str": 19,
      "dex": 8,
      "con": 16,
      "int": 5,
      "wis": 7,
      "cha": 7
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão no Escuro 18m, Percepção Passiva 8",
    "languages": "Comum, Gigante",
    "actions": [
      {
        "name": "Clava Grande (Greatclub)",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d8 + 4",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Arremesso de Azagaia",
        "type": "ranged",
        "attackBonus": 6,
        "damageFormula": "2d6 + 4",
        "damageType": "Perfurante",
        "range": "9m / 36m",
        "description": "Ataque à distância com arma: alcance 9/36m, um alvo."
      }
    ]
  },
  {
    "id": "srd-owlbear",
    "name": "Urso-Coruja (Owlbear)",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Sem Tendência",
    "armorClass": 13,
    "armorType": "Armadura Natural",
    "hitPoints": 59,
    "hitDice": "7d10 + 21",
    "speed": "12m",
    "abilities": {
      "str": 20,
      "dex": 12,
      "con": 17,
      "int": 3,
      "wis": 12,
      "cha": 7
    },
    "challengeRating": "3",
    "xp": 700,
    "senses": "Visão no Escuro 18m, Percepção Passiva 13",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Visão e Olfato Aguçados",
        "description": "O urso-coruja tem vantagem em testes de Sabedoria (Percepção) relacionados à visão ou ao olfato."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "1d10 + 5",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "O urso-coruja realiza dois ataques: um com o bico e outro com as garras."
      },
      {
        "name": "Bico (Beak)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "1d10 + 5",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Garras (Claws)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d8 + 5",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-spectator",
    "name": "Espectador (Mini-Beholder)",
    "avatarUrl": "/tokens/monsters/spectator.png",
    "size": "Médio",
    "type": "Aberração",
    "alignment": "Leal e Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 39,
    "hitDice": "6d8 + 12",
    "speed": "0m, Voo 9m (planar)",
    "abilities": {
      "str": 8,
      "dex": 14,
      "con": 14,
      "int": 13,
      "wis": 14,
      "cha": 11
    },
    "challengeRating": "3",
    "xp": 700,
    "senses": "Visão no Escuro 36m, Percepção Passiva 16",
    "languages": "Subterrâneo, Telepatia 36m",
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 1,
        "damageFormula": "1d6 - 1",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo com arma: alcance 1,5m, um alvo."
      },
      {
        "name": "Raios Oculares (4 Opções)",
        "type": "spell",
        "attackBonus": 5,
        "damageFormula": "3d10",
        "damageType": "Necrótico / Efeito",
        "range": "27m",
        "description": "Dispara 2 raios aleatórios: 1- Confusão, 2- Paralisia, 3- Medo, 4- Raio de Ferimento (3d10 necrótico). Salvaguarda CD 13."
      }
    ]
  },
  {
    "id": "srd-young-red-dragon",
    "name": "Dragão Vermelho Jovem",
    "avatarUrl": "/tokens/monsters/red-dragon.png",
    "size": "Grande",
    "type": "Dragão",
    "alignment": "Caótico e Mau",
    "armorClass": 18,
    "armorType": "Armadura Natural",
    "hitPoints": 178,
    "hitDice": "17d10 + 85",
    "speed": "12m, Escalada 12m, Voo 24m",
    "abilities": {
      "str": 23,
      "dex": 10,
      "con": 21,
      "int": 14,
      "wis": 11,
      "cha": 19
    },
    "challengeRating": "10",
    "xp": 5900,
    "senses": "Percepção às Cegas 9m, Visão no Escuro 36m, Percepção Passiva 18",
    "languages": "Comum, Dracônico",
    "traits": [
      {
        "name": "Imunidade a Fogo",
        "description": "O dragão é totalmente imune a qualquer dano de fogo."
      }
    ],
    "actions": [
      {
        "name": "Mordida de Fogo",
        "type": "melee",
        "attackBonus": 10,
        "damageFormula": "2d10 + 6",
        "damageType": "Perfurante + 1d6 Fogo",
        "range": "3m",
        "description": "Ataque com arma corpo a corpo: alcance 3m, um alvo. Causa 2d10+6 perfurante mais 1d6 de dano de fogo."
      },
      {
        "name": "Garras",
        "type": "melee",
        "attackBonus": 10,
        "damageFormula": "2d6 + 6",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Sopro de Fogo (Recarga 5-6)",
        "type": "special",
        "damageFormula": "16d6",
        "damageType": "Fogo",
        "range": "Cone de 9m",
        "description": "O dragão expele fogo em um cone de 9m. Cada criatura na área deve fazer uma salvaguarda de DES CD 17, sofrendo 16d6 de dano de fogo se falhar, ou metade se tiver sucesso."
      }
    ]
  },
  {
    "id": "srd-bandit",
    "name": "Bandido",
    "size": "Médio",
    "type": "Humanoide (qualquer raça)",
    "alignment": "Qualquer tendência não leal",
    "armorClass": 12,
    "armorType": "Armadura de Couro",
    "hitPoints": 11,
    "hitDice": "2d8 + 2",
    "speed": "9m",
    "abilities": {
      "str": 11,
      "dex": 12,
      "con": 12,
      "int": 10,
      "wis": 10,
      "cha": 10
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Percepção Passiva 10",
    "languages": "Comum",
    "actions": [
      {
        "name": "Cimitarra",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Besta Leve",
        "type": "ranged",
        "attackBonus": 3,
        "damageFormula": "1d8 + 1",
        "damageType": "Perfurante",
        "range": "24m / 96m",
        "description": "Ataque com arma à distância: distância 24/96m, um alvo."
      }
    ]
  },
  {
    "id": "srd-cultist",
    "name": "Cultista das Trevas",
    "avatarUrl": "/tokens/monsters/cultist.png",
    "size": "Médio",
    "type": "Humanoide (qualquer raça)",
    "alignment": "Qualquer tendência má",
    "armorClass": 12,
    "armorType": "Armadura de Couro",
    "hitPoints": 9,
    "hitDice": "2d8",
    "speed": "9m",
    "abilities": {
      "str": 11,
      "dex": 12,
      "con": 10,
      "int": 10,
      "wis": 11,
      "cha": 10
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Percepção Passiva 10",
    "languages": "Comum",
    "traits": [
      {
        "name": "Devoção Obscura",
        "description": "O cultista tem vantagem em salvaguardas contra ser enfeitiçado ou amedrontado."
      }
    ],
    "actions": [
      {
        "name": "Cimitarra",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-giant-spider",
    "name": "Aranha Gigante",
    "avatarUrl": "/tokens/monsters/giant-spider.png",
    "size": "Grande",
    "type": "Besta",
    "alignment": "Sem Tendência",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 26,
    "hitDice": "4d10 + 4",
    "speed": "9m, Escalada 9m",
    "abilities": {
      "str": 14,
      "dex": 16,
      "con": 12,
      "int": 2,
      "wis": 11,
      "cha": 4
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Sentido Sísmico 3m, Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Andar nas Teias",
        "description": "A aranha ignora restrições de movimento causadas por teias."
      }
    ],
    "actions": [
      {
        "name": "Mordida Venenosa",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d8 + 3",
        "damageType": "Perfurante + 2d8 Veneno",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m. Causa 1d8+3 perfurante mais salvaguarda de CON CD 11 ou sofre 2d8 de veneno (metade em sucesso)."
      },
      {
        "name": "Disparar Teia (Recarga 5-6)",
        "type": "ranged",
        "attackBonus": 5,
        "damageFormula": "0",
        "damageType": "Condição: Impedido",
        "range": "9m / 18m",
        "description": "Ataque à distância: alcance 9/18m. O alvo fica Impedido pelas teias (escapar com teste de FOR CD 12)."
      }
    ]
  },
  {
    "id": "srd-specter",
    "name": "Espectro",
    "avatarUrl": "/tokens/monsters/wraith.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Caótico e Mau",
    "armorClass": 12,
    "hitPoints": 22,
    "hitDice": "5d8",
    "speed": "0m, Voo 15m (planar)",
    "abilities": {
      "str": 1,
      "dex": 14,
      "con": 11,
      "int": 10,
      "wis": 10,
      "cha": 11
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Compreende os idiomas que falava em vida, mas não pode falar",
    "traits": [
      {
        "name": "Movimento Incorpóreo",
        "description": "O espectro pode mover-se através de outras criaturas e objetos como se fossem terreno difícil."
      }
    ],
    "actions": [
      {
        "name": "Dreno de Vida",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "3d6",
        "damageType": "Necrótico",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m. Causa 3d6 necrótico. O alvo deve passar em salvaguarda de CON CD 10 ou seu HP máximo é reduzido."
      }
    ]
  },
  {
    "id": "srd-gargoyle",
    "name": "Gárgula",
    "size": "Médio",
    "type": "Elemental",
    "alignment": "Caótico e Mau",
    "armorClass": 15,
    "armorType": "Armadura Natural",
    "hitPoints": 52,
    "hitDice": "7d8 + 21",
    "speed": "9m, Voo 18m",
    "abilities": {
      "str": 15,
      "dex": 11,
      "con": 16,
      "int": 6,
      "wis": 11,
      "cha": 7
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Terrano",
    "traits": [
      {
        "name": "Aparência Falsa",
        "description": "Enquanto a gárgula permanece imóvel, ela é indistinguível de uma estátua inanimada."
      }
    ],
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Garras",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-troll",
    "name": "Troll",
    "avatarUrl": "/tokens/monsters/troll.png",
    "size": "Grande",
    "type": "Gigante",
    "alignment": "Caótico e Mau",
    "armorClass": 15,
    "armorType": "Armadura Natural",
    "hitPoints": 84,
    "hitDice": "8d10 + 40",
    "speed": "9m",
    "abilities": {
      "str": 18,
      "dex": 13,
      "con": 20,
      "int": 7,
      "wis": 9,
      "cha": 7
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 12",
    "languages": "Gigante",
    "traits": [
      {
        "name": "Regeneração Implacável",
        "description": "O troll recupera 10 PV no início de cada um dos seus turnos, a não ser que tenha sofrido dano de fogo ou ácido no turno anterior."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (Mordida + 2 Garras)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "1d6 + 4",
        "damageType": "Perfurante / Cortante",
        "range": "1,5m",
        "description": "O troll desfere um ataque de mordida e dois de garra."
      },
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "1d6 + 4",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Garra",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d6 + 4",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-fire-elemental",
    "name": "Elemental do Fogo",
    "avatarUrl": "/tokens/monsters/fire-elemental.png",
    "size": "Grande",
    "type": "Elemental",
    "alignment": "Neutro",
    "armorClass": 13,
    "hitPoints": 102,
    "hitDice": "12d10 + 36",
    "speed": "15m",
    "abilities": {
      "str": 10,
      "dex": 17,
      "con": 16,
      "int": 6,
      "wis": 10,
      "cha": 7
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Ígneo",
    "traits": [
      {
        "name": "Corpo de Chamas",
        "description": "Qualquer criatura que toque o elemental ou o acerte com um ataque a 1,5m sofre 1d10 de dano de fogo."
      }
    ],
    "actions": [
      {
        "name": "Golpe Incendiário",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d6 + 3",
        "damageType": "Fogo",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m. Se o alvo for uma criatura ou objeto inflamável, entra em chamas sofrendo 1d10 de dano por rodada."
      }
    ]
  },
  {
    "id": "srd-mage",
    "name": "Mago Arquivista (Mage)",
    "size": "Médio",
    "type": "Humanoide (qualquer raça)",
    "alignment": "Qualquer tendência",
    "armorClass": 12,
    "armorType": "15 com Armadura Arcana",
    "hitPoints": 40,
    "hitDice": "9d8",
    "speed": "9m",
    "abilities": {
      "str": 9,
      "dex": 14,
      "con": 11,
      "int": 17,
      "wis": 12,
      "cha": 11
    },
    "challengeRating": "6",
    "xp": 2300,
    "senses": "Percepção Passiva 11",
    "languages": "Comum e mais 2 idiomas",
    "traits": [
      {
        "name": "Conjuração de 9º Nível (Inteligência CD 15, +7 para acertar)",
        "description": "Espaços: Truques (Raio de Fogo 2d10, Luz), 1º (Mísseis Mágicos, Escudo Arcano), 2º (Passo Nebuloso), 3º (Bola de Fogo, Contramágica), 4º (Invisibilidade Maior), 5º (Cone de Frio)."
      }
    ],
    "actions": [
      {
        "name": "Bola de Fogo (3º Círculo)",
        "type": "spell",
        "attackBonus": 7,
        "damageFormula": "8d6",
        "damageType": "Fogo",
        "range": "45m (Esfera de 6m)",
        "description": "Explosão de chamas. Salvaguarda de DES CD 15 para metade do dano."
      },
      {
        "name": "Raio de Fogo (Truque)",
        "type": "spell",
        "attackBonus": 7,
        "damageFormula": "2d10",
        "damageType": "Fogo",
        "range": "36m",
        "description": "Ataque à distância com magia: alcance 36m, um alvo."
      },
      {
        "name": "Adaga",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d4 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-gladiator",
    "name": "Gladiador Campeão",
    "size": "Médio",
    "type": "Humanoide (qualquer raça)",
    "alignment": "Qualquer tendência",
    "armorClass": 16,
    "armorType": "Armadura de Couro Batido, Escudo",
    "hitPoints": 112,
    "hitDice": "15d8 + 45",
    "speed": "9m",
    "abilities": {
      "str": 18,
      "dex": 15,
      "con": 16,
      "int": 10,
      "wis": 12,
      "cha": 15
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Percepção Passiva 11",
    "languages": "Comum",
    "traits": [
      {
        "name": "Valente",
        "description": "O gladiador tem vantagem em salvaguardas contra ser amedrontado."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (3 Golpes)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "1d6 + 4",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "O gladiador realiza três ataques corpo a corpo ou dois ataques à distância."
      },
      {
        "name": "Golpe com Escudo",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d4 + 4",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Se o alvo for uma criatura Média ou menor, deve passar em salvaguarda de FOR CD 15 ou ficará Caído."
      }
    ]
  },
  {
    "id": "srd-lich",
    "name": "Lich Ancestral",
    "avatarUrl": "/tokens/monsters/lich.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Neutro e Mau",
    "armorClass": 17,
    "armorType": "Armadura Natural",
    "hitPoints": 135,
    "hitDice": "18d8 + 54",
    "speed": "9m",
    "abilities": {
      "str": 11,
      "dex": 16,
      "con": 16,
      "int": 20,
      "wis": 14,
      "cha": 16
    },
    "challengeRating": "21",
    "xp": 33000,
    "senses": "Visão Verdadeira 36m, Percepção Passiva 19",
    "languages": "Comum e até outros 5 idiomas",
    "traits": [
      {
        "name": "Resistência Lendária (3/Dia)",
        "description": "Se o lich falhar em uma salvaguarda, ele pode optar por ter sucesso em vez disso."
      },
      {
        "name": "Rejuvenescimento",
        "description": "Se tiver um filactério, o lich destrói ganha um novo corpo em 1d10 dias com todos os seus PV."
      }
    ],
    "actions": [
      {
        "name": "Toque Paralisante",
        "type": "melee",
        "attackBonus": 12,
        "damageFormula": "3d6",
        "damageType": "Frio + Paralisia",
        "range": "1,5m",
        "description": "Ataque com magia corpo a corpo: 3d6 dano de frio. O alvo deve ser bem-sucedido em salvaguarda de CON CD 18 ou ficará Paralisado por 1 minuto."
      },
      {
        "name": "Palavra de Poder: Matar (9º Círculo)",
        "type": "spell",
        "attackBonus": 12,
        "damageFormula": "Morte Instantânea",
        "damageType": "Morte",
        "range": "18m",
        "description": "Profere uma palavra mágica. Se a criatura tiver 100 PV ou menos, morre instantaneamente."
      },
      {
        "name": "Desintegrar (6º Círculo)",
        "type": "spell",
        "attackBonus": 12,
        "damageFormula": "10d6 + 40",
        "damageType": "Força",
        "range": "18m",
        "description": "Feixe fino de energia. Salvaguarda de DES CD 20. Se os PV caírem a 0, é reduzido a pó fino."
      }
    ]
  },
  {
    "id": "srd-mimic",
    "name": "Mímico (Mimic)",
    "avatarUrl": "/tokens/monsters/mimic.png",
    "size": "Médio",
    "type": "Monstruosidade (Metamorfo)",
    "alignment": "Neutro",
    "armorClass": 12,
    "armorType": "Armadura Natural",
    "hitPoints": 58,
    "hitDice": "9d8 + 18",
    "speed": "4,5m",
    "abilities": {
      "str": 17,
      "dex": 12,
      "con": 15,
      "int": 5,
      "wis": 13,
      "cha": 8
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão no Escuro 18m, Percepção Passiva 11",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Metamorfo (Falsa Aparência)",
        "description": "O mímico pode se transformar em um objeto ou em sua forma amorfa natural. Enquanto imóvel, é indistinguível de um objeto comum (como um baú ou porta)."
      },
      {
        "name": "Adesivo (Adhesive)",
        "description": "O mímico gruda em qualquer coisa que o toque. Uma criatura Enorme ou menor que o toque fica Agarrada (CD 13 para escapar). Testes de ataque contra o alvo agarrado têm vantagem."
      }
    ],
    "actions": [
      {
        "name": "Pseudópode",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d8 + 3",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m. O alvo fica Agarrado pela característica Adesivo."
      },
      {
        "name": "Mordida Voraz",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d8 + 3",
        "damageType": "Perfurante + 1d8 Ácido",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m, um alvo. Causa 1d8+3 perfurante mais 1d8 de dano ácido."
      }
    ]
  },
  {
    "id": "srd-gelatinous-cube",
    "name": "Cubo Gelatinoso",
    "avatarUrl": "/tokens/monsters/gelatinous-cube.png",
    "size": "Grande",
    "type": "Limo",
    "alignment": "Incondicional Neutro",
    "armorClass": 6,
    "hitPoints": 84,
    "hitDice": "8d10 + 40",
    "speed": "4,5m",
    "abilities": {
      "str": 14,
      "dex": 3,
      "con": 20,
      "int": 1,
      "wis": 6,
      "cha": 1
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Sentido Cego 18m (cego além desse raio), Percepção Passiva 8",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Transparente (Transparent)",
        "description": "Mesmo à vista aberta, é preciso um teste de Sabedoria (Percepção) CD 15 para avistar o cubo se ele não estiver se movendo."
      },
      {
        "name": "Engolfar (Engulf)",
        "description": "O cubo entra no espaço de criaturas Grandes ou menores. O alvo deve fazer uma salvaguarda de DES CD 12 ou é engolfado, sofrendo 3d6 de dano ácido no início de cada turno e ficando impedido."
      }
    ],
    "actions": [
      {
        "name": "Pseudópode Ácido",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "3d6",
        "damageType": "Ácido",
        "range": "1,5m",
        "description": "Ataque com arma corpo a corpo: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-gray-ooze",
    "name": "Gosma Cinzenta (Slime)",
    "avatarUrl": "/tokens/monsters/slime.png",
    "size": "Médio",
    "type": "Limo",
    "alignment": "Incondicional Neutro",
    "armorClass": 8,
    "hitPoints": 22,
    "hitDice": "3d8 + 9",
    "speed": "3m, Natação 3m",
    "abilities": {
      "str": 12,
      "dex": 6,
      "con": 16,
      "int": 1,
      "wis": 6,
      "cha": 2
    },
    "challengeRating": "1/2",
    "xp": 100,
    "senses": "Sentido Cego 18m (cego além), Percepção Passiva 8",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Amorfo e Falsa Aparência",
        "description": "Pode passar por aberturas de 2,5 cm sem se espremer. Enquanto imóvel, parece uma poça de óleo ou rocha molhada."
      },
      {
        "name": "Corroer Metal",
        "description": "Qualquer arma não mágica feita de metal que atinja a gosma sofre uma penalidade permanente e cumulativa de -1 nas jogadas de dano (se chegar a -5, quebra)."
      }
    ],
    "actions": [
      {
        "name": "Pseudópode Corrosivo",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Contundente + 2d6 Ácido",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: 1d6+1 contundente mais 2d6 ácido. Armaduras de metal atingidas sofrem penalidade permanente de -1 na CA."
      }
    ]
  },
  {
    "id": "srd-beholder",
    "name": "Observador (Beholder)",
    "avatarUrl": "/tokens/monsters/beholder.png",
    "size": "Grande",
    "type": "Aberração",
    "alignment": "Ordeiro e Mau",
    "armorClass": 18,
    "armorType": "Armadura Natural",
    "hitPoints": 180,
    "hitDice": "19d10 + 76",
    "speed": "0m, Voo 6m (planar)",
    "abilities": {
      "str": 10,
      "dex": 14,
      "con": 18,
      "int": 17,
      "wis": 15,
      "cha": 17
    },
    "challengeRating": "13",
    "xp": 10000,
    "senses": "Visão no Escuro 36m, Percepção Passiva 22",
    "languages": "Subterrâneo, Dialeto Ocular",
    "traits": [
      {
        "name": "Cone Antimagia (Antimagic Cone)",
        "description": "O olho central do beholder cria uma área de antimagia em um cone de 45m. No início de cada um dos seus turnos, o beholder decide para onde direcionar o cone e se ele está ativo."
      }
    ],
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "4d6",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo com arma: alcance 1,5m, um alvo."
      },
      {
        "name": "Raios Oculares (3 Alvos Aleatórios)",
        "type": "spell",
        "attackBonus": 8,
        "damageFormula": "10d10",
        "damageType": "Mágico / Diversos",
        "range": "36m",
        "description": "Dispara 3 raios oculares aleatórios (CD 16): 1- Charme, 2- Paralisia, 3- Medo, 4- Lentidão, 5- Enervação (8d8 necrótico), 6- Telecinese, 7- Sono, 8- Petrificação, 9- Desintegração (10d10 força), 10- Raio da Morte (10d10 necrótico)."
      }
    ]
  },
  {
    "id": "srd-mind-flayer",
    "name": "Devorador de Mentes (Illithid)",
    "avatarUrl": "/tokens/monsters/mind-flayer.png",
    "size": "Médio",
    "type": "Aberração",
    "alignment": "Ordeiro e Mau",
    "armorClass": 15,
    "armorType": "Peitoral de Aço",
    "hitPoints": 71,
    "hitDice": "13d8 + 13",
    "speed": "9m",
    "abilities": {
      "str": 11,
      "dex": 12,
      "con": 12,
      "int": 19,
      "wis": 17,
      "cha": 17
    },
    "challengeRating": "7",
    "xp": 2900,
    "senses": "Visão no Escuro 36m, Percepção Passiva 16",
    "languages": "Subterrâneo, Telepatia 36m",
    "traits": [
      {
        "name": "Resistência à Magia",
        "description": "O devorador de mentes tem vantagem em salvaguardas contra magias e outros efeitos mágicos."
      },
      {
        "name": "Conjuração Psiônica",
        "description": "Pode conjurar Levitação, Detectar Pensamentos, Dominar Monstro e Viagem Planar sem componentes materiais (CD 15)."
      }
    ],
    "actions": [
      {
        "name": "Tentáculos Devoradores",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d10 + 4",
        "damageType": "Psíquico",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: 2d10+4 psíquico. O alvo fica Agarrado (escapar CD 15) e Atordoado até o agarrão terminar."
      },
      {
        "name": "Extrair Cérebro (Extract Brain)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "10d10",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Contra um alvo incapacitado e agarrado: causa 10d10 perfurante. Se reduzir a criatura a 0 PV, devora o cérebro e a mata instantaneamente."
      },
      {
        "name": "Rajada Mental (Mind Blast, Recarga 5-6)",
        "type": "special",
        "damageFormula": "4d8 + 4",
        "damageType": "Psíquico",
        "range": "Cone de 18m",
        "description": "Cone de 18m. Todas as criaturas na área devem ser bem-sucedidas em salvaguarda de INT CD 15 ou sofrerão 4d8+4 psíquico e ficarão Atordoadas por 1 minuto."
      }
    ]
  },
  {
    "id": "srd-minotaur",
    "name": "Minotauro",
    "avatarUrl": "/tokens/monsters/minotaur.png",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Caótico e Mau",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 76,
    "hitDice": "9d10 + 27",
    "speed": "12m",
    "abilities": {
      "str": 18,
      "dex": 11,
      "con": 16,
      "int": 6,
      "wis": 16,
      "cha": 9
    },
    "challengeRating": "3",
    "xp": 700,
    "senses": "Visão no Escuro 18m, Percepção Passiva 17",
    "languages": "Abissal",
    "traits": [
      {
        "name": "Carga com Chifres (Charge)",
        "description": "Se o minotauro se mover pelo menos 3m em linha reta em direção a um alvo e acertar um ataque de chifres, causa +2d8 de dano perfurante e o alvo deve passar em salvaguarda de FOR CD 14 ou cairá Caído."
      },
      {
        "name": "Memória Labiríntica",
        "description": "O minotauro nunca se perde e se lembra perfeitamente de qualquer caminho que já percorreu."
      }
    ],
    "actions": [
      {
        "name": "Machado Grande (Greataxe)",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d12 + 4",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo devastador: alcance 1,5m, um alvo."
      },
      {
        "name": "Chifrada",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d8 + 4",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo com chifres: alcance 1,5m, um alvo."
      }
    ]
  },
  {
    "id": "srd-cyclops",
    "name": "Ciclope",
    "avatarUrl": "/tokens/monsters/cyclops.png",
    "size": "Enorme",
    "type": "Gigante",
    "alignment": "Caótico e Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 138,
    "hitDice": "12d12 + 60",
    "speed": "9m",
    "abilities": {
      "str": 22,
      "dex": 11,
      "con": 20,
      "int": 8,
      "wis": 6,
      "cha": 10
    },
    "challengeRating": "6",
    "xp": 2300,
    "senses": "Percepção Passiva 8",
    "languages": "Gigante",
    "traits": [
      {
        "name": "Visão Monocular (Poor Depth Perception)",
        "description": "O ciclope tem desvantagem em qualquer jogada de ataque contra um alvo a mais de 9m de distância."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (2x Clava)",
        "type": "melee",
        "attackBonus": 9,
        "damageFormula": "3d8 + 6",
        "damageType": "Contundente",
        "range": "3m",
        "description": "O ciclope desfere dois ataques brutais com sua clava de tronco."
      },
      {
        "name": "Arremesso de Rocha",
        "type": "ranged",
        "attackBonus": 9,
        "damageFormula": "4d10 + 6",
        "damageType": "Contundente",
        "range": "9m / 30m",
        "description": "Arremessa uma enorme pedra em um alvo à distância."
      }
    ]
  },
  {
    "id": "srd-displacer-beast",
    "name": "Besta Deslocadora",
    "avatarUrl": "/tokens/monsters/nekomata.png",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Ordeiro e Mau",
    "armorClass": 13,
    "armorType": "Armadura Natural",
    "hitPoints": 85,
    "hitDice": "10d10 + 30",
    "speed": "12m",
    "abilities": {
      "str": 18,
      "dex": 15,
      "con": 16,
      "int": 6,
      "wis": 12,
      "cha": 8
    },
    "challengeRating": "3",
    "xp": 700,
    "senses": "Visão no Escuro 18m, Percepção Passiva 11",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Deslocamento Ilusório (Displacement)",
        "description": "A besta projeta uma ilusão mágica que faz parecer que ela está próxima de sua localização real. Todas as jogadas de ataque contra ela têm desvantagem."
      },
      {
        "name": "Evasão (Avoidance)",
        "description": "Se a besta for submetida a um efeito que permita fazer uma salvaguarda para sofrer metade do dano, ela não sofre dano se tiver sucesso, e apenas metade se falhar."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (2 Tentáculos)",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "1d6 + 4",
        "damageType": "Contundente + 1d6 Perfurante",
        "range": "3m",
        "description": "A besta desfere dois chicoteios de tentáculos farpados contra seus oponentes."
      }
    ]
  },
  {
    "id": "srd-imp",
    "name": "Diabrete (Imp)",
    "avatarUrl": "/tokens/monsters/demon.png",
    "size": "Miúdo",
    "type": "Corruptor (Diabo, Metamorfo)",
    "alignment": "Ordeiro e Mau",
    "armorClass": 13,
    "hitPoints": 10,
    "hitDice": "3d4 + 3",
    "speed": "6m, Voo 12m",
    "abilities": {
      "str": 6,
      "dex": 17,
      "con": 13,
      "int": 11,
      "wis": 12,
      "cha": 14
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Visão no Escuro 36m (Vê na escuridão mágica), Percepção Passiva 11",
    "languages": "Infernal, Comum",
    "traits": [
      {
        "name": "Metamorfo e Invisibilidade",
        "description": "Pode se transformar em corvo, rato ou aranha venenosa. Como ação bônus, pode ficar invisível magicamente até atacar."
      },
      {
        "name": "Resistência à Magia",
        "description": "Tem vantagem em salvaguardas contra magias e efeitos mágicos."
      }
    ],
    "actions": [
      {
        "name": "Ferroada Venenosa",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d4 + 3",
        "damageType": "Perfurante + 3d6 Veneno",
        "range": "1,5m",
        "description": "Ataque com ferrão: 1d4+3 perfurante mais salvaguarda de CON CD 11 ou sofre 3d6 de veneno (metade em sucesso)."
      }
    ]
  },
  {
    "id": "srd-water-elemental",
    "name": "Elemental da Água",
    "avatarUrl": "/tokens/monsters/water-elemental.png",
    "size": "Grande",
    "type": "Elemental",
    "alignment": "Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 114,
    "hitDice": "12d10 + 48",
    "speed": "9m, Natação 27m",
    "abilities": {
      "str": 18,
      "dex": 14,
      "con": 18,
      "int": 5,
      "wis": 10,
      "cha": 8
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Aquan",
    "traits": [
      {
        "name": "Forma Líquida (Water Form)",
        "description": "O elemental pode entrar no espaço de uma criatura hostil e parar lá. Pode se mover através de aberturas de até 2,5 cm sem se espremer."
      }
    ],
    "actions": [
      {
        "name": "Golpe de Torrente (2x Pancada)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d8 + 4",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "O elemental desfere dois golpes de ondas esmagadoras."
      },
      {
        "name": "Engolfar / Vórtice (Recarga 4-6)",
        "type": "special",
        "damageFormula": "2d8 + 4",
        "damageType": "Contundente + Afogamento",
        "range": "Espaço do elemental",
        "description": "Criaturas Médias ou menores no espaço do elemental sofrem salvaguarda de FOR CD 15 ou são presas, impedidas e começam a se afogar."
      }
    ]
  },
  {
    "id": "srd-earth-elemental",
    "name": "Elemental da Terra",
    "avatarUrl": "/tokens/monsters/earth-elemental.png",
    "size": "Grande",
    "type": "Elemental",
    "alignment": "Neutro",
    "armorClass": 17,
    "armorType": "Armadura Natural",
    "hitPoints": 126,
    "hitDice": "12d10 + 60",
    "speed": "9m, Escavação 9m",
    "abilities": {
      "str": 20,
      "dex": 8,
      "con": 20,
      "int": 5,
      "wis": 10,
      "cha": 5
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Sentido Sísmico 18m, Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Terran",
    "traits": [
      {
        "name": "Deslizar pela Terra (Earth Glide)",
        "description": "Pode escavar através de terra e rocha não trabalhadas sem perturbar o material pelo qual passa."
      },
      {
        "name": "Rompe-Cerco",
        "description": "Causa dano dobrado a objetos e estruturas."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (2x Pancada Rochosa)",
        "type": "melee",
        "attackBonus": 8,
        "damageFormula": "2d10 + 5",
        "damageType": "Contundente",
        "range": "3m",
        "description": "Dois golpes esmagadores com punhos maciços de granito."
      }
    ]
  },
  {
    "id": "srd-stone-golem",
    "name": "Golem de Pedra",
    "avatarUrl": "/tokens/monsters/stone-golem.png",
    "size": "Grande",
    "type": "Constructo",
    "alignment": "Incondicional Neutro",
    "armorClass": 17,
    "armorType": "Armadura Natural",
    "hitPoints": 178,
    "hitDice": "17d10 + 85",
    "speed": "9m",
    "abilities": {
      "str": 22,
      "dex": 9,
      "con": 20,
      "int": 3,
      "wis": 11,
      "cha": 1
    },
    "challengeRating": "10",
    "xp": 5900,
    "senses": "Visão no Escuro 36m, Percepção Passiva 10",
    "languages": "Compreende os idiomas do criador, mas não fala",
    "traits": [
      {
        "name": "Forma Imutável e Armas Mágicas",
        "description": "Imune a qualquer magia ou efeito que altere sua forma. Seus ataques com armas contam como mágicos."
      },
      {
        "name": "Resistência à Magia",
        "description": "Vantagem em salvaguardas contra magias e outros efeitos mágicos."
      }
    ],
    "actions": [
      {
        "name": "Pancada de Rocha Esmagadora (2x)",
        "type": "melee",
        "attackBonus": 10,
        "damageFormula": "3d8 + 6",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Dois socos sísmicos de pedra esculpida."
      },
      {
        "name": "Pulso de Lentidão (Recarga 5-6)",
        "type": "special",
        "damageFormula": "Condição: Lentidão",
        "damageType": "Efeito Temporal",
        "range": "Raio de 3m",
        "description": "Alvos a até 3m devem passar em salvaguarda de SAB CD 17 ou são afetados pela magia Lentidão por 1 minuto."
      }
    ]
  },
  {
    "id": "srd-flesh-golem",
    "name": "Golem de Carne",
    "avatarUrl": "/tokens/monsters/flesh-golem.png",
    "size": "Médio",
    "type": "Constructo",
    "alignment": "Neutro",
    "armorClass": 9,
    "hitPoints": 93,
    "hitDice": "11d8 + 44",
    "speed": "9m",
    "abilities": {
      "str": 19,
      "dex": 9,
      "con": 18,
      "int": 6,
      "wis": 10,
      "cha": 5
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Compreende comandos do criador",
    "traits": [
      {
        "name": "Absorção de Eletricidade",
        "description": "Sempre que sofre dano elétrico, não sofre dano e recupera PV iguais ao valor do dano."
      },
      {
        "name": "Aversão ao Fogo",
        "description": "Se sofrer dano de fogo, tem desvantagem em ataques e testes até o final do seu próximo turno."
      },
      {
        "name": "Fúria Berserk",
        "description": "Com 40 PV ou menos, pode entrar em fúria cega atacando a criatura mais próxima."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (2x Pancada)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "2d8 + 4",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Dois golpes pesados com membros costurados."
      }
    ]
  },
  {
    "id": "srd-rust-monster",
    "name": "Monstro da Ferrugem",
    "avatarUrl": "/tokens/monsters/rust-monster.png",
    "size": "Médio",
    "type": "Monstruosidade",
    "alignment": "Incondicional Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 27,
    "hitDice": "5d8 + 5",
    "speed": "12m",
    "abilities": {
      "str": 13,
      "dex": 12,
      "con": 13,
      "int": 2,
      "wis": 13,
      "cha": 6
    },
    "challengeRating": "1/2",
    "xp": 100,
    "senses": "Visão no Escuro 18m, Faro de Ferro 9m, Percepção Passiva 11",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Faro de Metal e Corrosão Instantânea",
        "description": "Pode rastrear a localização exata de metais ferrosos a 9m. Armas de metal que o atinjam sofrem -1 de dano permanente e corroem."
      }
    ],
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d8 + 1",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque com mandíbula: alcance 1,5m, um alvo."
      },
      {
        "name": "Antenas Corrosivas",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "Corrosão de Metal",
        "damageType": "Ferrugem",
        "range": "1,5m",
        "description": "Toca um objeto metálico não mágico (armadura, escudo ou arma). A armadura sofre -1 permanente na CA; armas sofrem -1 cumulativo no dano até virarem pó."
      }
    ]
  },
  {
    "id": "srd-carrion-crawler",
    "name": "Verme da Carniça",
    "avatarUrl": "/tokens/monsters/carrion-crawler.png",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Incondicional Neutro",
    "armorClass": 13,
    "armorType": "Armadura Natural",
    "hitPoints": 51,
    "hitDice": "6d10 + 18",
    "speed": "9m, Escalada 9m",
    "abilities": {
      "str": 14,
      "dex": 13,
      "con": 16,
      "int": 1,
      "wis": 12,
      "cha": 5
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão no Escuro 18m, Faro Aguçado 9m, Percepção Passiva 13",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Escalar Superfícies (Spider Climb)",
        "description": "Pode escalar superfícies difíceis, incluindo tetos de cabeça para baixo, sem fazer teste de atributo."
      }
    ],
    "actions": [
      {
        "name": "Tentáculos Paralisantes",
        "type": "melee",
        "attackBonus": 8,
        "damageFormula": "1d4 + 2",
        "damageType": "Veneno + Paralisia",
        "range": "3m",
        "description": "Ataque corpo a corpo: alcance 3m. O alvo deve passar em salvaguarda de CON CD 13 ou fica Envenenado e Paralisado por 1 minuto."
      },
      {
        "name": "Mordida Devoradora",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "2d4 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque contra um alvo (preferencialmente paralisado)."
      }
    ]
  },
  {
    "id": "srd-intellect-devourer",
    "name": "Devorador de Intelecto",
    "avatarUrl": "/tokens/monsters/intellect-devourer.png",
    "size": "Pequeno",
    "type": "Aberração",
    "alignment": "Ordeiro e Mau",
    "armorClass": 12,
    "hitPoints": 21,
    "hitDice": "6d6",
    "speed": "12m",
    "abilities": {
      "str": 6,
      "dex": 14,
      "con": 13,
      "int": 12,
      "wis": 11,
      "cha": 10
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Sentido Cego 18m, Percepção Passiva 10",
    "languages": "Compreende Subterrâneo, Telepatia 18m",
    "traits": [
      {
        "name": "Percepção Telepática",
        "description": "O devorador sabe a localização de qualquer criatura com Inteligência 3 ou maior num raio de 90m."
      }
    ],
    "actions": [
      {
        "name": "Garras",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "2d4 + 2",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque com patas afiadas: alcance 1,5m."
      },
      {
        "name": "Devorar Intelecto (Devour Intellect)",
        "type": "special",
        "damageFormula": "2d10",
        "damageType": "Psíquico + Perda de INT",
        "range": "3m",
        "description": "Alvo deve passar em salvaguarda de INT CD 12 ou sofre 2d10 psíquico e disputa teste de INT contra o monstro; se perder, sua pontuação de INT é reduzida a 0 (Fica Atordoado)."
      },
      {
        "name": "Ladrão de Corpos (Body Thief)",
        "type": "special",
        "damageFormula": "Possessão Cerebral",
        "damageType": "Controle Mental",
        "range": "1,5m",
        "description": "Teleporta-se para o crânio de um humanoide incapacitado com 0 de INT, devora seu cérebro e assume controle total do corpo!"
      }
    ]
  },
  {
    "id": "srd-flumph",
    "name": "Flumph",
    "avatarUrl": "/tokens/monsters/flumph.png",
    "size": "Pequeno",
    "type": "Aberração",
    "alignment": "Ordeiro e Bom",
    "armorClass": 12,
    "hitPoints": 7,
    "hitDice": "2d6",
    "speed": "1,5m, Voo 9m",
    "abilities": {
      "str": 6,
      "dex": 15,
      "con": 10,
      "int": 14,
      "wis": 14,
      "cha": 11
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Visão no Escuro 18m, Percepção Passiva 12",
    "languages": "Subterrâneo, Telepatia 18m",
    "traits": [
      {
        "name": "Flutuação Telepática e Humor Radiante",
        "description": "Alimenta-se da energia de mentes psiônicas pacíficas e muda de cor conforme seu humor (verde = amigável, azul = triste, vermelho = alerta)."
      }
    ],
    "actions": [
      {
        "name": "Tentáculos com Ácido",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d4 + 2",
        "damageType": "Perfurante + 1d4 Ácido",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m, um alvo."
      },
      {
        "name": "Jato de Fedor Repugnante (1/Dia)",
        "type": "special",
        "damageFormula": "Fedor Intenso",
        "damageType": "Envenenado",
        "range": "Cone de 4,5m",
        "description": "Dispara fluido com odor pútrido. Alvos devem passar em salvaguarda de DES CD 10 ou ficam Envenenados por 1d4 horas."
      }
    ]
  },
  {
    "id": "srd-gibbering-mouther",
    "name": "Boca Tagarela (Gibbering Mouther)",
    "avatarUrl": "/tokens/monsters/gibbering-mouther.png",
    "size": "Médio",
    "type": "Aberração",
    "alignment": "Neutro",
    "armorClass": 9,
    "hitPoints": 67,
    "hitDice": "9d8 + 27",
    "speed": "3m, Natação 3m",
    "abilities": {
      "str": 10,
      "dex": 8,
      "con": 16,
      "int": 3,
      "wis": 10,
      "cha": 6
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Tagarelice Enlouquecedora (Gibbering)",
        "description": "Balbucia constantemente vozes desconexas. Qualquer criatura a até 6m que possa ouvi-la deve passar em salvaguarda de SAB CD 10 ou ficará Confusa sem conseguir agir normalmente."
      },
      {
        "name": "Chão Aberrante",
        "description": "O solo a até 3m ao redor da criatura se liquefaz como lama fervente, tornando-se terreno difícil."
      }
    ],
    "actions": [
      {
        "name": "Enxurrada de Mordidas",
        "type": "melee",
        "attackBonus": 2,
        "damageFormula": "5d6",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Dezenas de bocas cravam os dentes no alvo. Se a criatura for Média ou menor, deve passar em salvaguarda de FOR CD 10 ou fica Caída."
      },
      {
        "name": "Cusparada Cegante (Recarga 5-6)",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "1d6",
        "damageType": "Fogo + Condição: Cego",
        "range": "4,5m",
        "description": "Cospe um glóbulo químico incandescente. Alvo fica Cego até o fim do próximo turno."
      }
    ]
  },
  {
    "id": "srd-ghoul",
    "name": "Carniçal (Ghoul)",
    "avatarUrl": "/tokens/monsters/ghoul.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Caótico e Mau",
    "armorClass": 12,
    "hitPoints": 22,
    "hitDice": "5d8",
    "speed": "9m",
    "abilities": {
      "str": 13,
      "dex": 15,
      "con": 10,
      "int": 7,
      "wis": 10,
      "cha": 6
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Comum",
    "traits": [
      {
        "name": "Imunidades de Morto-Vivo",
        "description": "Imune a dano de Veneno e às condições Enfeitiçado, Envenenado e Exaustão."
      }
    ],
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 2,
        "damageFormula": "2d6 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo com mandíbula podre."
      },
      {
        "name": "Garras Paralisantes",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "2d4 + 2",
        "damageType": "Cortante + Paralisia",
        "range": "1,5m",
        "description": "Se o alvo não for um elfo ou morto-vivo, deve passar em salvaguarda de CON CD 10 ou fica Paralisado por 1 minuto."
      }
    ]
  },
  {
    "id": "srd-stirge",
    "name": "Estrige (Stirge)",
    "avatarUrl": "/tokens/monsters/stirge.png",
    "size": "Miúdo",
    "type": "Besta",
    "alignment": "Incondicional Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 2,
    "hitDice": "1d4",
    "speed": "3m, Voo 12m",
    "abilities": {
      "str": 4,
      "dex": 16,
      "con": 11,
      "int": 2,
      "wis": 8,
      "cha": 6
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Visão no Escuro 18m, Percepção Passiva 9",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Sugar Sangue",
        "description": "Enquanto presa a uma criatura, a estrige drena 1d4+3 de PV da criatura no início de cada um dos seus turnos sem precisar rolar ataque."
      }
    ],
    "actions": [
      {
        "name": "Probóscide (Bico Sugador)",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "1d4 + 3",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque com bico longo: acerta e gruda na carne do alvo."
      }
    ]
  },
  {
    "id": "srd-kobold",
    "name": "Kobold Rastejante",
    "avatarUrl": "/tokens/monsters/kobold.png",
    "size": "Pequeno",
    "type": "Humanoide (kobold)",
    "alignment": "Ordeiro e Mau",
    "armorClass": 12,
    "hitPoints": 5,
    "hitDice": "2d6 - 2",
    "speed": "9m",
    "abilities": {
      "str": 7,
      "dex": 15,
      "con": 9,
      "int": 8,
      "wis": 7,
      "cha": 8
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Visão no Escuro 18m, Percepção Passiva 8",
    "languages": "Comum, Dracônico",
    "traits": [
      {
        "name": "Sensibilidade à Luz Solar",
        "description": "Desvantagem em jogadas de ataque e percepção que dependam da visão quando sob luz solar direta."
      },
      {
        "name": "Táticas de Matilha (Pack Tactics)",
        "description": "O kobold tem vantagem nas jogadas de ataque se pelo menos um aliado estiver a até 1,5m do alvo e não incapacitado."
      }
    ],
    "actions": [
      {
        "name": "Adaga",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d4 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque corpo-a-corpo: alcance 1,5m."
      },
      {
        "name": "Funda",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "1d4 + 2",
        "damageType": "Contundente",
        "range": "9m / 36m",
        "description": "Ataque à distância com projétil: distância 9/36m."
      }
    ]
  },
  {
    "id": "srd-bugbear",
    "name": "Bugbear Emboscador",
    "avatarUrl": "/tokens/monsters/bugbear.png",
    "size": "Médio",
    "type": "Humanoide (goblinóide)",
    "alignment": "Caótico e Mau",
    "armorClass": 16,
    "armorType": "Gibão de Peles, Escudo",
    "hitPoints": 27,
    "hitDice": "5d8 + 5",
    "speed": "9m",
    "abilities": {
      "str": 15,
      "dex": 14,
      "con": 13,
      "int": 8,
      "wis": 11,
      "cha": 9
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Visão no Escuro 18m, Percepção Passiva 10",
    "languages": "Comum, Goblin",
    "traits": [
      {
        "name": "Brutal (Brute)",
        "description": "Um golpe com arma corpo a corpo desferido pelo bugbear causa um dado adicional de dano (já incluso nas ações)."
      },
      {
        "name": "Ataque Surpresa",
        "description": "Se o bugbear surpreender uma criatura e acertá-la com um ataque no primeiro turno de combate, causa +2d6 de dano extra."
      }
    ],
    "actions": [
      {
        "name": "Maça Estrela (Morningstar)",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "2d8 + 2",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Golpe pesado com espigões de ferro."
      },
      {
        "name": "Azagaia",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "1d6 + 2",
        "damageType": "Perfurante",
        "range": "9m / 36m",
        "description": "Arremesso de azagaia à distância."
      }
    ]
  },
  {
    "id": "srd-giant-constrictor-snake",
    "name": "Cobra Constritora Gigante",
    "avatarUrl": "/tokens/monsters/giant-snake.png",
    "size": "Enorme",
    "type": "Besta",
    "alignment": "Incondicional Neutro",
    "armorClass": 12,
    "hitPoints": 60,
    "hitDice": "8d12 + 8",
    "speed": "9m, Natação 9m",
    "abilities": {
      "str": 19,
      "dex": 14,
      "con": 12,
      "int": 1,
      "wis": 10,
      "cha": 3
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Sentido Cego 3m, Percepção Passiva 12",
    "languages": "Nenhum",
    "actions": [
      {
        "name": "Mordida",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d6 + 4",
        "damageType": "Perfurante",
        "range": "3m",
        "description": "Bote com presas: alcance 3m, um alvo."
      },
      {
        "name": "Constrição Sufocante",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d8 + 4",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Causa 2d8+4 contundente e o alvo fica Agarrado e Impedido (escapar CD 14)."
      }
    ]
  },
  {
    "id": "srd-ghost",
    "name": "Fantasma",
    "avatarUrl": "/tokens/monsters/ghost.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Qualquer Alinhamento",
    "armorClass": 11,
    "hitPoints": 45,
    "hitDice": "10d8",
    "speed": "0m, Voo 12m (planar)",
    "abilities": {
      "str": 7,
      "dex": 13,
      "con": 10,
      "int": 10,
      "wis": 12,
      "cha": 17
    },
    "challengeRating": "4",
    "xp": 1100,
    "senses": "Visão no Escuro 18m, Percepção Passiva 11",
    "languages": "Qualquer que falava em vida",
    "traits": [
      {
        "name": "Movimento Incorpóreo",
        "description": "Pode atravessar criaturas e objetos como terreno difícil. Sofre 1d10 de dano de força se terminar o turno dentro de um objeto."
      }
    ],
    "actions": [
      {
        "name": "Toque Enfraquecedor",
        "type": "melee",
        "attackBonus": 5,
        "damageFormula": "4d6 + 3",
        "damageType": "Necrótico",
        "range": "1,5m",
        "description": "Ataque corpo a corpo com toque espectral."
      },
      {
        "name": "Olhar Horripilante",
        "type": "special",
        "damageFormula": "Envelhecimento e Medo",
        "damageType": "Pavor",
        "range": "18m",
        "description": "Criaturas que olhem para o fantasma fazem salvaguarda de SAB CD 13 ou ficam Amedrontadas e envelhecem 1d4 × 10 anos."
      },
      {
        "name": "Possessão Espectral (Recarga 6)",
        "type": "special",
        "damageFormula": "Possessão",
        "damageType": "Controle Total",
        "range": "1,5m",
        "description": "Invade o corpo de um humanoide (salvaguarda de CAR CD 13). Se falhar, o fantasma assume controle do corpo."
      }
    ]
  },
  {
    "id": "srd-banshee",
    "name": "Banshee Lamuriante",
    "avatarUrl": "/tokens/monsters/banshee.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Caótico e Mau",
    "armorClass": 12,
    "hitPoints": 58,
    "hitDice": "13d8",
    "speed": "0m, Voo 12m (planar)",
    "abilities": {
      "str": 1,
      "dex": 14,
      "con": 10,
      "int": 12,
      "wis": 11,
      "cha": 17
    },
    "challengeRating": "4",
    "xp": 1100,
    "senses": "Visão no Escuro 18m, Detectar Vida 9m, Percepção Passiva 10",
    "languages": "Comum, Élfico",
    "traits": [
      {
        "name": "Detectar Vida",
        "description": "A banshee detecta magicamente a presença de criaturas vivas a até 9m."
      }
    ],
    "actions": [
      {
        "name": "Toque Corruptor",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "3d6",
        "damageType": "Necrótico",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: toque gélido da morte."
      },
      {
        "name": "Lamento Mortal da Banshee (1/Dia)",
        "type": "special",
        "damageFormula": "0 PV ou 3d6 Necrótico",
        "damageType": "Necrótico Fatal",
        "range": "Raio de 9m",
        "description": "Solta um grito pavoroso. Criaturas a até 9m devem passar em salvaguarda de CON CD 13; falha = cai imediatamente a 0 PV! Sucesso = sofre 3d6 de dano necrótico."
      }
    ]
  },
  {
    "id": "srd-wraith",
    "name": "Aparição Sombria (Wraith)",
    "avatarUrl": "/tokens/monsters/wraith.png",
    "size": "Médio",
    "type": "Morto-vivo",
    "alignment": "Neutro e Mau",
    "armorClass": 13,
    "hitPoints": 67,
    "hitDice": "9d8 + 27",
    "speed": "0m, Voo 18m (planar)",
    "abilities": {
      "str": 6,
      "dex": 16,
      "con": 16,
      "int": 12,
      "wis": 14,
      "cha": 15
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 12",
    "languages": "Comum e os idiomas de sua vida",
    "traits": [
      {
        "name": "Sensibilidade à Luz Solar",
        "description": "Desvantagem em ataques e testes de percepção sob luz solar."
      }
    ],
    "actions": [
      {
        "name": "Dreno de Vida Devorador",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "4d8 + 3",
        "damageType": "Necrótico",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: 4d8+3 necrótico. Alvo deve passar em salvaguarda de CON CD 14 ou seu PV máximo é reduzido pelo dano sofrido."
      },
      {
        "name": "Criar Espectro",
        "type": "special",
        "damageFormula": "Invocação",
        "damageType": "Necromancia",
        "range": "3m",
        "description": "Transforma o espírito de um humanoide recém-morto em um espectro sob seu controle."
      }
    ]
  },
  {
    "id": "srd-cloaker",
    "name": "Manto Negro (Cloaker)",
    "avatarUrl": "/tokens/monsters/cloaker.png",
    "size": "Grande",
    "type": "Aberração",
    "alignment": "Caótico e Neutro",
    "armorClass": 14,
    "armorType": "Armadura Natural",
    "hitPoints": 78,
    "hitDice": "12d10 + 12",
    "speed": "3m, Voo 12m",
    "abilities": {
      "str": 17,
      "dex": 15,
      "con": 12,
      "int": 13,
      "wis": 12,
      "cha": 14
    },
    "challengeRating": "8",
    "xp": 3900,
    "senses": "Visão no Escuro 18m, Percepção Passiva 11",
    "languages": "Subterrâneo",
    "traits": [
      {
        "name": "Transferência de Dano (Damage Transfer)",
        "description": "Enquanto estiver anexado a uma criatura, o manto negro sofre apenas metade do dano sofrido, e a criatura à qual está preso sofre a outra metade."
      },
      {
        "name": "Fantasmas Ilusórios (Duplos)",
        "description": "Pode invocar três duplicatas ilusórias de si mesmo como na magia Reflexos."
      }
    ],
    "actions": [
      {
        "name": "Mordida e Sufocamento",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d6 + 3",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Prende-se à cabeça do alvo (Grande ou menor), cegando-o e impedindo-o de respirar."
      },
      {
        "name": "Golpe com Cauda",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "1d8 + 3",
        "damageType": "Cortante",
        "range": "3m",
        "description": "Ataque corpo a corpo chicoteando com a cauda articulada."
      },
      {
        "name": "Gemido Infrassônico (Moan)",
        "type": "special",
        "damageFormula": "Pavor",
        "damageType": "Condição: Amedrontado",
        "range": "Raio de 18m",
        "description": "Alvos na área devem passar em salvaguarda de SAB CD 13 ou ficam Amedrontados."
      }
    ]
  },
  {
    "id": "srd-guard",
    "name": "Guarda da Cidade",
    "avatarUrl": "/tokens/monsters/guard.png",
    "size": "Médio",
    "type": "Humanoide (qualquer raça)",
    "alignment": "Qualquer Alinhamento",
    "armorClass": 16,
    "armorType": "Cota de Malha, Escudo",
    "hitPoints": 11,
    "hitDice": "2d8 + 2",
    "speed": "9m",
    "abilities": {
      "str": 13,
      "dex": 12,
      "con": 12,
      "int": 10,
      "wis": 11,
      "cha": 10
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Percepção Passiva 12",
    "languages": "Comum",
    "actions": [
      {
        "name": "Lança Curta",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Perfurante",
        "range": "1,5m ou 6/18m",
        "description": "Golpe ou arremesso de lança: 1d6+1 perfurante (ou 1d8+1 com duas mãos)."
      },
      {
        "name": "Besta Leve",
        "type": "ranged",
        "attackBonus": 3,
        "damageFormula": "1d8",
        "damageType": "Perfurante",
        "range": "24m / 96m",
        "description": "Disparo à distância com besta leve."
      }
    ]
  },
  {
    "id": "srd-nothic",
    "name": "Nothic dos Segredos",
    "avatarUrl": "/tokens/monsters/nothic.png",
    "size": "Médio",
    "type": "Aberração",
    "alignment": "Neutro e Mau",
    "armorClass": 15,
    "armorType": "Armadura Natural",
    "hitPoints": 45,
    "hitDice": "6d8 + 18",
    "speed": "9m",
    "abilities": {
      "str": 14,
      "dex": 16,
      "con": 16,
      "int": 13,
      "wis": 10,
      "cha": 8
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Visão Verdadeira 36m, Percepção Passiva 12",
    "languages": "Subterrâneo",
    "traits": [
      {
        "name": "Percepção Estranha (Weird Insight)",
        "description": "O nothic sonda a mente de uma criatura a até 9m e descobre magicamente um segredo ou fato importante sobre ela (disputa de Decepção vs Intuição)."
      }
    ],
    "actions": [
      {
        "name": "Garras",
        "type": "melee",
        "attackBonus": 4,
        "damageFormula": "1d6 + 3",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque corpo a corpo: alcance 1,5m."
      },
      {
        "name": "Olhar Necrótico (Rotting Gaze)",
        "type": "ranged",
        "attackBonus": 4,
        "damageFormula": "3d6",
        "damageType": "Necrótico",
        "range": "9m",
        "description": "Mira seu olho gigante em um alvo. O alvo deve fazer uma salvaguarda de CON CD 12 ou sofre 3d6 de dano necrótico."
      }
    ]
  },
  {
    "id": "srd-kraken",
    "name": "Kraken Ancestral",
    "avatarUrl": "/tokens/monsters/kraken.png",
    "size": "Gargantuesco",
    "type": "Monstruosidade (titã)",
    "alignment": "Caótico e Mau",
    "armorClass": 18,
    "armorType": "Armadura Natural",
    "hitPoints": 472,
    "hitDice": "27d20 + 189",
    "speed": "6m, Natação 18m",
    "abilities": {
      "str": 30,
      "dex": 11,
      "con": 25,
      "int": 22,
      "wis": 18,
      "cha": 20
    },
    "challengeRating": "23",
    "xp": 50000,
    "senses": "Visão Verdadeira 36m, Percepção Passiva 24",
    "languages": "Compreende Abissal, Celestial, Infernal e Primordial; Telepatia 36m",
    "traits": [
      {
        "name": "Monstro do Cerco e Liberdade de Movimento",
        "description": "Causa dano duplo a estruturas e embarcações. Ignora terreno difícil e magias não podem reduzir seu deslocamento nem deixá-lo paralisado."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (3 Tentáculos + Mordida)",
        "type": "melee",
        "attackBonus": 17,
        "damageFormula": "3d6 + 10",
        "damageType": "Contundente + Perfurante",
        "range": "9m / 1,5m",
        "description": "Desfere três golpes de tentáculo e uma mordida colossal."
      },
      {
        "name": "Tentáculo Esmagador",
        "type": "melee",
        "attackBonus": 17,
        "damageFormula": "3d6 + 10",
        "damageType": "Contundente",
        "range": "9m",
        "description": "Acerta e agarra o alvo (escapar CD 18). Até o agarrão terminar, a criatura fica Impedida."
      },
      {
        "name": "Tempestade de Raios Elétricos",
        "type": "special",
        "damageFormula": "4d10",
        "damageType": "Elétrico",
        "range": "36m (3 alvos)",
        "description": "Dispara raios dos céus ou das profundezas contra até 3 alvos. Salvaguarda de DES CD 23 para metade."
      }
    ]
  },
  {
    "id": "srd-umber-hulk",
    "name": "Umber Hulk",
    "avatarUrl": "/tokens/monsters/umber-hulk.png",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Caótico e Mau",
    "armorClass": 18,
    "armorType": "Carapaça Natural",
    "hitPoints": 93,
    "hitDice": "11d10 + 33",
    "speed": "9m, Escavação 6m",
    "abilities": {
      "str": 20,
      "dex": 13,
      "con": 16,
      "int": 8,
      "wis": 10,
      "cha": 10
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 36m, Sentido Sísmico 18m, Percepção Passiva 13",
    "languages": "Umber Hulk",
    "traits": [
      {
        "name": "Olhar Confuso (Confusing Gaze)",
        "description": "Criaturas a até 9m que olhem para os 4 olhos do Umber Hulk devem passar em salvaguarda de CAR CD 15 ou ficam Confusas na rodada."
      }
    ],
    "actions": [
      {
        "name": "Ataque Múltiplo (2x Garras + 1 Mandíbula)",
        "type": "melee",
        "attackBonus": 8,
        "damageFormula": "1d8 + 5",
        "damageType": "Cortante / Perfurante",
        "range": "1,5m",
        "description": "Dois golpes de garras cortantes (1d8+5) e uma mordida de mandíbulas afiadas (2d8+5)."
      }
    ]
  },
  {
    "id": "srd-roper",
    "name": "Roper (Corda Voraz)",
    "avatarUrl": "/tokens/monsters/roper.png",
    "size": "Grande",
    "type": "Monstruosidade",
    "alignment": "Neutro e Mau",
    "armorClass": 20,
    "armorType": "Carapaça de Rocha",
    "hitPoints": 93,
    "hitDice": "11d10 + 33",
    "speed": "3m, Escalada 3m",
    "abilities": {
      "str": 19,
      "dex": 8,
      "con": 17,
      "int": 7,
      "wis": 16,
      "cha": 6
    },
    "challengeRating": "5",
    "xp": 1800,
    "senses": "Visão no Escuro 18m, Percepção Passiva 16",
    "languages": "Subterrâneo",
    "traits": [
      {
        "name": "Falsa Aparência (Estalactite)",
        "description": "Enquanto imóvel, é indistinguível de uma formação rochosa natural em cavernas."
      }
    ],
    "actions": [
      {
        "name": "Tentáculos Extensíveis (4x)",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "Agarrar e Puxar",
        "damageType": "Contundente",
        "range": "15m",
        "description": "Alcance 15m. O alvo fica Agarrado e é puxado até 7,5m em direção ao Roper."
      },
      {
        "name": "Mordida Devoradora",
        "type": "melee",
        "attackBonus": 7,
        "damageFormula": "4d8 + 4",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Ataque brutal contra criaturas presas por seus tentáculos."
      }
    ]
  },
  {
    "id": "srd-thri-kreen",
    "name": "Guerreiro Thri-kreen",
    "avatarUrl": "/tokens/monsters/thri-kreen.png",
    "size": "Médio",
    "type": "Humanoide (thri-kreen)",
    "alignment": "Caótico e Neutro",
    "armorClass": 15,
    "armorType": "Carapaça Natural",
    "hitPoints": 33,
    "hitDice": "6d8 + 6",
    "speed": "12m",
    "abilities": {
      "str": 12,
      "dex": 15,
      "con": 13,
      "int": 8,
      "wis": 12,
      "cha": 7
    },
    "challengeRating": "1",
    "xp": 200,
    "senses": "Visão no Escuro 18m, Percepção Passiva 13",
    "languages": "Thri-kreen, Telepatia 18m",
    "traits": [
      {
        "name": "Camuflagem Camaleônica",
        "description": "O thri-kreen tem vantagem em testes de Destreza (Furtividade) para se esconder no terreno."
      },
      {
        "name": "Salto em Altura",
        "description": "Pode saltar até 9m horizontalmente ou 4,5m verticalmente com um início de corrida."
      }
    ],
    "actions": [
      {
        "name": "Mordida com Veneno Paralisante",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Perfurante + Paralisia",
        "range": "1,5m",
        "description": "Alvo deve passar em salvaguarda de CON CD 11 ou fica Paralisado por 1 minuto."
      },
      {
        "name": "Gythka (Arma de Duas Lâminas)",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d8 + 1",
        "damageType": "Cortante",
        "range": "1,5m",
        "description": "Ataque ágil de lâmina dupla."
      }
    ]
  },
  {
    "id": "srd-kuo-toa",
    "name": "Kuo-toa",
    "avatarUrl": "/tokens/monsters/kuo-toa.png",
    "size": "Médio",
    "type": "Humanoide (kuo-toa)",
    "alignment": "Neutro e Mau",
    "armorClass": 13,
    "armorType": "Escudo de Pele",
    "hitPoints": 18,
    "hitDice": "4d8",
    "speed": "9m, Natação 9m",
    "abilities": {
      "str": 13,
      "dex": 10,
      "con": 11,
      "int": 6,
      "wis": 10,
      "cha": 8
    },
    "challengeRating": "1/4",
    "xp": 50,
    "senses": "Visão no Escuro 36m, Sentido do Outro Mundo, Percepção Passiva 10",
    "languages": "Subterrâneo",
    "traits": [
      {
        "name": "Sentido do Outro Mundo",
        "description": "O kuo-toa pode sentir a presença de criaturas invisíveis ou no plano etéreo a até 9m."
      },
      {
        "name": "Escudo Pegajoso",
        "description": "Se uma criatura errar um ataque corpo a corpo contra o kuo-toa, deve passar em salvaguarda de FOR CD 11 para sua arma não ficar grudada no escudo."
      }
    ],
    "actions": [
      {
        "name": "Lança",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Perfurante",
        "range": "1,5m ou 6/18m",
        "description": "Ataque com lança farpada aquática."
      }
    ]
  },
  {
    "id": "srd-giant-crab",
    "name": "Caranguejo Gigante",
    "avatarUrl": "/tokens/monsters/giant-crab.png",
    "size": "Médio",
    "type": "Besta",
    "alignment": "Incondicional Neutro",
    "armorClass": 15,
    "armorType": "Carapaça Natural",
    "hitPoints": 13,
    "hitDice": "3d8",
    "speed": "9m, Natação 9m",
    "abilities": {
      "str": 13,
      "dex": 15,
      "con": 11,
      "int": 1,
      "wis": 9,
      "cha": 3
    },
    "challengeRating": "1/8",
    "xp": 25,
    "senses": "Sentido Cego 9m, Percepção Passiva 9",
    "languages": "Nenhum",
    "actions": [
      {
        "name": "Pinça Esmagadora",
        "type": "melee",
        "attackBonus": 3,
        "damageFormula": "1d6 + 1",
        "damageType": "Contundente",
        "range": "1,5m",
        "description": "Acerta e agarra o alvo (escapar CD 11). O caranguejo tem duas pinças."
      }
    ]
  },
  {
    "id": "srd-hunter-shark",
    "name": "Tubarão Caçador",
    "avatarUrl": "/tokens/monsters/hunter-shark.png",
    "size": "Grande",
    "type": "Besta",
    "alignment": "Incondicional Neutro",
    "armorClass": 12,
    "armorType": "Armadura Natural",
    "hitPoints": 45,
    "hitDice": "6d10 + 12",
    "speed": "0m, Natação 12m",
    "abilities": {
      "str": 18,
      "dex": 12,
      "con": 15,
      "int": 1,
      "wis": 10,
      "cha": 4
    },
    "challengeRating": "2",
    "xp": 450,
    "senses": "Sentido Cego 9m, Percepção Passiva 12",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Frenesi Sanguinário",
        "description": "O tubarão tem vantagem em jogadas de ataque corpo a corpo contra qualquer criatura que não esteja com todos os seus PV."
      }
    ],
    "actions": [
      {
        "name": "Mordida Feroz",
        "type": "melee",
        "attackBonus": 6,
        "damageFormula": "2d8 + 4",
        "damageType": "Perfurante",
        "range": "1,5m",
        "description": "Mordida poderosa com dentes serrilhados sob a água."
      }
    ]
  },
  {
    "id": "srd-gas-spore",
    "name": "Esporo Gasoso (Falso Beholder)",
    "avatarUrl": "/tokens/monsters/gas-spore.png",
    "size": "Grande",
    "type": "Planta",
    "alignment": "Incondicional Neutro",
    "armorClass": 5,
    "hitPoints": 1,
    "hitDice": "1d10 - 4",
    "speed": "0m, Voo 3m (planar)",
    "abilities": {
      "str": 5,
      "dex": 1,
      "con": 3,
      "int": 1,
      "wis": 1,
      "cha": 1
    },
    "challengeRating": "1/2",
    "xp": 100,
    "senses": "Sentido Cego 9m, Percepção Passiva 5",
    "languages": "Nenhum",
    "traits": [
      {
        "name": "Aparência de Beholder",
        "description": "Parece exatamente com um Beholder flutuando na penumbra. Um teste de INT (Investigação) CD 15 revela sua natureza fúngica."
      },
      {
        "name": "Morte Explosiva",
        "description": "Se o esporo morrer, explode em uma nuvem fúngica de 6m. Criaturas na área devem passar em salvaguarda de CON CD 15 ou sofrem 3d6 de veneno e ficam infectadas por esporos letais."
      }
    ],
    "actions": [
      {
        "name": "Toque Infectante",
        "type": "melee",
        "attackBonus": 0,
        "damageFormula": "1",
        "damageType": "Necrótico + Infecção",
        "range": "1,5m",
        "description": "Toca uma criatura, liberando esporos que brotam no hospedeiro."
      }
    ]
  }
];
