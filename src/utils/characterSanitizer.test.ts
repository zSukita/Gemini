import { describe, it, expect } from 'vitest';
import { sanitizeCharacter, parseAndValidateCharacterJson } from './characterSanitizer';

describe('characterSanitizer - sanitizeCharacter', () => {
  it('deve retornar ficha padrão completa quando o input for nulo, indefinido ou array', () => {
    const fromNull = sanitizeCharacter(null);
    expect(fromNull).toBeDefined();
    expect(fromNull.name).toBe('');
    expect(fromNull.abilities.str.score).toBe(10);
    expect(fromNull.currentHp).toBe(10);

    const fromArray = sanitizeCharacter([1, 2, 3]);
    expect(fromArray.level).toBe(1);
  });

  it('deve sanitizar números não-finitos, NaN, Infinity e valores fora dos limites', () => {
    const dirty = {
      name: 'Guerreiro Louco',
      level: NaN,
      maxHp: Infinity,
      currentHp: -999999,
      tempHp: '50', // string numérico válido
      armorClass: -15,
      speed: 1500,
      initiativeBonus: 999,
      abilities: {
        str: { score: 9999, saveProficient: 'sim' },
        dex: { score: -10, saveProficient: false },
        con: { score: NaN, saveProficient: true },
      },
    };

    const clean = sanitizeCharacter(dirty);
    expect(clean.name).toBe('Guerreiro Louco');
    expect(clean.level).toBe(1); // default para NaN
    expect(clean.maxHp).toBe(10); // fallback para Infinity
    expect(clean.currentHp).toBe(-100); // clamped em -100
    expect(clean.tempHp).toBe(50); // parsed string
    expect(clean.armorClass).toBe(0); // clamped em 0
    expect(clean.speed).toBe(999); // clamped em 999
    expect(clean.initiativeBonus).toBe(50); // clamped em 50

    expect(clean.abilities.str.score).toBe(30); // max 30
    expect(clean.abilities.str.saveProficient).toBe(true);
    expect(clean.abilities.dex.score).toBe(1); // min 1
    expect(clean.abilities.con.score).toBe(10); // fallback para NaN
  });

  it('deve limitar listas excessivas (ataques, inventário, magias) para evitar DoS', () => {
    const hugeAttacks = Array.from({ length: 200 }, (_, i) => ({
      name: `Ataque #${i}`,
      attackBonus: 5,
      damage: '1d8',
    }));
    const hugeInventory = Array.from({ length: 500 }, (_, i) => ({
      name: `Item #${i}`,
      quantity: 1,
    }));
    const hugeSpells = Array.from({ length: 300 }, (_, i) => ({
      name: `Magia #${i}`,
      level: 1,
    }));

    const clean = sanitizeCharacter({
      name: 'Mago dos Itens Infinitos',
      attacks: hugeAttacks,
      inventory: hugeInventory,
      spellcasting: {
        spells: hugeSpells,
      },
    });

    expect(clean.attacks.length).toBe(50); // Capped em 50
    expect(clean.inventory.length).toBe(200); // Capped em 200
    expect(clean.spellcasting.spells.length).toBe(150); // Capped em 150
  });

  it('deve preservar dados legados sem quebrar a estrutura esperada', () => {
    const legacy = {
      name: 'Personagem Legado',
      characterClass: 'Bárbaro',
      level: 3,
      currentHp: 32,
      maxHp: 32,
      // Sem spellcasting nem journal no legado
    };

    const clean = sanitizeCharacter(legacy);
    expect(clean.name).toBe('Personagem Legado');
    expect(clean.characterClass).toBe('Bárbaro');
    expect(clean.level).toBe(3);
    expect(clean.spellcasting).toBeDefined();
    expect(clean.spellcasting.slots).toHaveLength(9);
    expect(clean.skills.athletics).toBeDefined();
    expect(clean.skills.athletics.proficiency).toBe('none');
  });

  it('deve filtrar URLs perigosas de avatar (como javascript:)', () => {
    const dangerous = {
      name: 'Hacker',
      avatarUrl: 'javascript:alert(1)',
    };
    const clean = sanitizeCharacter(dangerous);
    expect(clean.avatarUrl).toBeUndefined();

    const safeHttp = {
      name: 'Jogador Legal',
      avatarUrl: 'https://images.unsplash.com/photo-1234.jpg',
    };
    const cleanSafe = sanitizeCharacter(safeHttp);
    expect(cleanSafe.avatarUrl).toBe('https://images.unsplash.com/photo-1234.jpg');
  });
});

describe('characterSanitizer - parseAndValidateCharacterJson', () => {
  it('deve rejeitar JSON truncado ou sintaticamente inválido', () => {
    const truncated = '{"name": "Aragorn", "level": 5, "abilities": { "str": { "sc';
    const result = parseAndValidateCharacterJson(truncated);
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON corrompido ou truncado');
    expect(result.character).toBeUndefined();
  });

  it('deve rejeitar string vazia ou apenas espaços', () => {
    const result = parseAndValidateCharacterJson('   ');
    expect(result.success).toBe(false);
    expect(result.error).toContain('vazio');
  });

  it('deve rejeitar JSON primitivo (número, boolean, array)', () => {
    const resultNum = parseAndValidateCharacterJson('12345');
    expect(resultNum.success).toBe(false);

    const resultArr = parseAndValidateCharacterJson('[1, 2, 3]');
    expect(resultArr.success).toBe(false);
    expect(resultArr.error).toContain('precisa ser um objeto');
  });

  it('deve rejeitar objeto arbitrário sem campos mínimos de D&D 5e', () => {
    const arbitrary = JSON.stringify({
      title: 'Minha Receita de Bolo',
      ingredients: ['farinha', 'açúcar'],
    });
    const result = parseAndValidateCharacterJson(arbitrary);
    expect(result.success).toBe(false);
    expect(result.error).toContain('não possui os campos essenciais');
  });

  it('deve importar com sucesso uma ficha D&D 5e válida e completa', () => {
    const validJson = JSON.stringify({
      name: 'Gandalf',
      characterClass: 'Mago',
      level: 10,
      currentHp: 65,
      maxHp: 65,
      abilities: {
        str: { score: 10, saveProficient: false },
        dex: { score: 14, saveProficient: false },
        con: { score: 16, saveProficient: true },
        int: { score: 20, saveProficient: true },
        wis: { score: 18, saveProficient: false },
        cha: { score: 12, saveProficient: false },
      },
      attacks: [
        { name: 'Cajado Glamdring', attackBonus: 7, damage: '1d6+3', damageType: 'Contusão', range: '1,5m' },
      ],
      spellcasting: {
        ability: 'int',
        slots: [
          { level: 1, max: 4, used: 1 },
          { level: 2, max: 3, used: 0 },
        ],
        spells: [
          { name: 'Mísseis Mágicos', level: 1, school: 'Evocação', prepared: true },
        ],
      },
    });

    const result = parseAndValidateCharacterJson(validJson);
    expect(result.success).toBe(true);
    expect(result.character).toBeDefined();
    expect(result.character?.name).toBe('Gandalf');
    expect(result.character?.level).toBe(10);
    expect(result.character?.abilities.int.score).toBe(20);
    expect(result.character?.attacks[0].name).toBe('Cajado Glamdring');
    expect(result.character?.spellcasting.slots[0].max).toBe(4);
    expect(result.character?.spellcasting.slots[0].used).toBe(1);
  });
});
