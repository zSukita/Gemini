// Gerador de Tesouros e Saques D&D 5e Oficial (SRD 5.1)
import { rollDie } from './diceRoller';

export type LootTier = '0-4' | '5-10' | '11-16' | '17+';
export type LootType = 'individual' | 'hoard';

export interface LootGemItem {
  name: string;
  value: number; // em PO
  count: number;
}

export interface LootArtItem {
  name: string;
  value: number; // em PO
  count: number;
}

export interface GeneratedLoot {
  tier: LootTier;
  type: LootType;
  coins: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  gems: LootGemItem[];
  artObjects: LootArtItem[];
  magicItems: string[];
  totalGoldValue: number;
  summaryText: string;
}

// Catálogo Oficial de Gemas SRD 5e
const GEMS_10GP = [
  'Azurita', 'Quartzo Azul', 'Olho de Gato', 'Lápis-Lazúli', 
  'Malaquita', 'Obsidiana', 'Olho de Tigre', 'Turquesa'
];
const GEMS_50GP = [
  'Ágata Vermelha', 'Jaspe Sanguíneo', 'Calcedônia', 'Crisoprásio', 
  'Jaspe', 'Pedra da Lua', 'Ônix', 'Quartzo Rosa'
];
const GEMS_100GP = [
  'Âmbar Dourado', 'Ametista Imperial', 'Coral Esculpido', 'Granada Rubra', 
  'Jade Polida', 'Pérola Natural', 'Espinela Branca', 'Turmalina Verde'
];
const GEMS_500GP = [
  'Alexandrita', 'Água-Marinha Fina', 'Pérola Negra', 'Topázio Azul', 
  'Crisólito', 'Peridoto Radiante'
];
const GEMS_1000GP = [
  'Opala Negra Flamejante', 'Safira Azul Estelar', 'Esmeralda Lapidada', 
  'Rubi Sangue de Pombo', 'Safira Estrela'
];
const GEMS_5000GP = [
  'Diamante de Grande Pureza', 'Rubi Real Ancestral', 'Esmeralda Radiante Gigante', 'Safira Negra Rara'
];

// Obras de Arte
const ART_25GP = [
  'Jarro de prata trabalhado', 'Estatueta esculpida em osso', 'Pingente de ouro com brasão antigo',
  'Anel de prata com ágata encrustada', 'Espelho de bolso com moldura em filigrana'
];
const ART_250GP = [
  'Cálice de ouro cravado de safiras', 'Adaga cerimonial com lâmina damascena', 
  'Tapeçaria bordada com fios de prata', 'Caixa de rapé entalhada em marfim e jade'
];
const ART_750GP = [
  'Coroa de prata cravejada de pedras lunares', 'Harpa de madeira nobre com cordas de ouro', 
  'Ídolo divino banhado a ouro puro', 'Taça cerimonial em platina com rubis'
];

// Itens Mágicos SRD
const MAGIC_MINOR = [
  'Poção de Cura (2d4+2 PV)', 'Poção de Escalada', 'Pergaminho de Magia (1º Círculo)',
  'Poção de Amizade Animal', 'Pergaminho de Magia (Truque)', 'Poção de Fôlego Aquático',
  'Selo de Proteção Elemental'
];
const MAGIC_MEDIUM = [
  'Poção de Cura Maior (4d4+4 PV)', 'Espada Curta +1', 'Espada Longa +1', 'Adaga +1',
  'Arco Longo +1', 'Armadura de Couro Batido +1', 'Escudo +1', 'Varinha de Mísseis Mágicos',
  'Bolsa de Carga (Bag of Holding)', 'Botas Élficas', 'Capa Élfica', 'Vassoura Voadora',
  'Anel de Proteção +1', 'Poção de Força do Gigante da Colina'
];
const MAGIC_MAJOR = [
  'Poção de Cura Superior (8d4+8 PV)', 'Arma Encantada +2 (Espada/Arco/Machado)',
  'Armadura de Placas +1', 'Manto de Deslocamento', 'Espada Flamejante (Flame Tongue)',
  'Amuleto de Saúde (Constituição 19)', 'Braçadeiras de Defesa', 'Varinha do Mago de Batalha +2',
  'Anel de Queda Suave', 'Cinto de Força do Gigante da Pedra'
];
const MAGIC_SUPREME = [
  'Poção de Cura Suprema (10d4+20 PV)', 'Arma Lendária +3', 'Armadura de Placas +2',
  'Espada Vorpal', 'Anel dos Três Desejos', 'Varinha do Arquimago',
  'Manual do Bom Exercício (+2 Força)', 'Manto de Invisibilidade Lendário'
];

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function rollDice(count: number, sides: number, bonus = 0): number {
  let total = bonus;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

export function generateLoot(tier: LootTier, type: LootType): GeneratedLoot {
  const coins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const gems: LootGemItem[] = [];
  const artObjects: LootArtItem[] = [];
  const magicItems: string[] = [];

  if (type === 'individual') {
    // Saque Individual de Monstro (D&D 5e DMG)
    const roll = rollDie(100);
    if (tier === '0-4') {
      if (roll <= 30) coins.cp = rollDice(5, 6);
      else if (roll <= 60) coins.sp = rollDice(4, 6);
      else if (roll <= 70) coins.ep = rollDice(3, 6);
      else if (roll <= 95) coins.gp = rollDice(3, 6);
      else coins.pp = rollDice(1, 6);
    } else if (tier === '5-10') {
      if (roll <= 30) {
        coins.cp = rollDice(4, 6) * 100;
        coins.ep = rollDice(1, 6) * 10;
      } else if (roll <= 60) {
        coins.sp = rollDice(6, 6) * 10;
        coins.gp = rollDice(2, 6) * 10;
      } else if (roll <= 70) {
        coins.ep = rollDice(3, 6) * 10;
        coins.gp = rollDice(2, 6) * 10;
      } else if (roll <= 95) {
        coins.gp = rollDice(4, 6) * 10;
      } else {
        coins.gp = rollDice(2, 6) * 10;
        coins.pp = rollDice(3, 6);
      }
    } else if (tier === '11-16') {
      if (roll <= 20) {
        coins.sp = rollDice(4, 6) * 100;
        coins.gp = rollDice(1, 6) * 100;
      } else if (roll <= 35) {
        coins.ep = rollDice(1, 6) * 100;
        coins.gp = rollDice(1, 6) * 100;
      } else if (roll <= 75) {
        coins.gp = rollDice(2, 6) * 100;
        coins.pp = rollDice(1, 6) * 10;
      } else {
        coins.gp = rollDice(2, 6) * 100;
        coins.pp = rollDice(2, 6) * 10;
      }
    } else {
      // 17+
      if (roll <= 15) {
        coins.ep = rollDice(2, 6) * 1000;
        coins.gp = rollDice(8, 6) * 100;
      } else if (roll <= 55) {
        coins.gp = rollDice(1, 6) * 1000;
        coins.pp = rollDice(1, 6) * 100;
      } else {
        coins.gp = rollDice(1, 6) * 1000;
        coins.pp = rollDice(2, 6) * 100;
      }
    }

    // Chance de 1 gema ou poçãozinha para saque individual
    if (roll > 85) {
      if (tier === '0-4') gems.push({ name: pickRandom(GEMS_10GP), value: 10, count: rollDice(1, 2) });
      else if (tier === '5-10') gems.push({ name: pickRandom(GEMS_50GP), value: 50, count: rollDice(1, 3) });
      else if (tier === '11-16') gems.push({ name: pickRandom(GEMS_500GP), value: 500, count: rollDice(1, 2) });
      else gems.push({ name: pickRandom(GEMS_1000GP), value: 1000, count: rollDice(1, 4) });
    }
  } else {
    // Tesouro de Covil / Baú (Hoard Loot)
    if (tier === '0-4') {
      coins.cp = rollDice(6, 6) * 100;
      coins.sp = rollDice(3, 6) * 100;
      coins.gp = rollDice(2, 6) * 10;

      const gemCount = rollDice(2, 6);
      gems.push({ name: pickRandom(GEMS_10GP), value: 10, count: gemCount });
      if (rollDie(100) > 50) {
        artObjects.push({ name: pickRandom(ART_25GP), value: 25, count: rollDice(1, 4) });
      }
      const magicCount = rollDice(1, 3);
      for (let i = 0; i < magicCount; i++) magicItems.push(pickRandom(MAGIC_MINOR));
    } else if (tier === '5-10') {
      coins.cp = rollDice(2, 6) * 100;
      coins.sp = rollDice(2, 6) * 1000;
      coins.gp = rollDice(6, 6) * 100;
      coins.pp = rollDice(3, 6) * 10;

      const gemCount = rollDice(3, 6);
      const gemCatalog = rollDie(100) > 50 ? GEMS_100GP : GEMS_50GP;
      const gemVal = gemCatalog === GEMS_100GP ? 100 : 50;
      gems.push({ name: pickRandom(gemCatalog), value: gemVal, count: gemCount });
      artObjects.push({ name: pickRandom(ART_250GP), value: 250, count: rollDice(2, 4) });

      const magicCount = rollDice(1, 4);
      for (let i = 0; i < magicCount; i++) magicItems.push(pickRandom(MAGIC_MEDIUM));
    } else if (tier === '11-16') {
      coins.gp = rollDice(4, 6) * 1000;
      coins.pp = rollDice(5, 6) * 100;

      const gemCount = rollDice(3, 6);
      gems.push({ name: pickRandom(GEMS_500GP), value: 500, count: gemCount });
      artObjects.push({ name: pickRandom(ART_750GP), value: 750, count: rollDice(2, 4) });

      const magicCount = rollDice(1, 4, 1);
      for (let i = 0; i < magicCount; i++) magicItems.push(pickRandom(MAGIC_MAJOR));
    } else {
      // 17+
      coins.gp = rollDice(12, 6) * 1000;
      coins.pp = rollDice(8, 6) * 1000;

      const gemCount = rollDice(3, 6);
      gems.push({ name: pickRandom(GEMS_1000GP), value: 1000, count: gemCount });
      gems.push({ name: pickRandom(GEMS_5000GP), value: 5000, count: rollDice(1, 4) });

      const magicCount = rollDice(1, 6, 1);
      for (let i = 0; i < magicCount; i++) magicItems.push(pickRandom(MAGIC_SUPREME));
    }
  }

  // Cálculo do valor total em PO equivalente
  const coinsInGp = 
    coins.cp / 100 + 
    coins.sp / 10 + 
    coins.ep / 2 + 
    coins.gp + 
    coins.pp * 10;

  const gemsTotal = gems.reduce((acc, g) => acc + g.value * g.count, 0);
  const artTotal = artObjects.reduce((acc, a) => acc + a.value * a.count, 0);
  const totalGoldValue = Math.round(coinsInGp + gemsTotal + artTotal);

  // Resumo textual
  const parts: string[] = [];
  if (coins.gp > 0) parts.push(`${coins.gp} PO`);
  if (coins.sp > 0) parts.push(`${coins.sp} PP`);
  if (coins.cp > 0) parts.push(`${coins.cp} PC`);
  if (coins.ep > 0) parts.push(`${coins.ep} PE`);
  if (coins.pp > 0) parts.push(`${coins.pp} PL`);
  gems.forEach((g) => parts.push(`${g.count}x ${g.name} (${g.value} PO cada)`));
  artObjects.forEach((a) => parts.push(`${a.count}x ${a.name} (${a.value} PO cada)`));
  magicItems.forEach((m) => parts.push(`✨ ${m}`));

  const summaryText = parts.join(', ');

  return {
    tier,
    type,
    coins,
    gems,
    artObjects,
    magicItems,
    totalGoldValue,
    summaryText,
  };
}
