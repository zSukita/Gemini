import { describe, it, expect, beforeEach } from 'vitest';
import { 
  buildSystemPrompt, 
  parseAiResponse, 
  getStoredApiKey, 
  saveStoredApiKey,
  getStoredAiConfig,
  saveStoredAiConfig,
  getStoredCampaignSummary,
  saveStoredCampaignSummary,
  DEFAULT_MODEL
} from '../services/geminiService';
import type { Character } from '../types/dnd5e';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
// @ts-expect-error - node environment polyfill
globalThis.localStorage = localStorageMock;

describe('geminiService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('buildSystemPrompt', () => {
    it('deve gerar prompt com instruções fundamentais mesmo sem personagem', () => {
      const prompt = buildSystemPrompt(null, 'heroic');
      expect(prompt).toContain('Mestre Supremo de RPG do ArcanaSheet');
      expect(prompt).toContain('Português do Brasil');
      expect(prompt).toContain('[AÇÕES]');
      expect(prompt).toContain('[TESTE:');
    });

    it('deve incorporar estatísticas e perícias do personagem selecionado', () => {
      const mockChar: Partial<Character> = {
        name: 'Thorgar Quebra-Machado',
        race: 'Anão da Colina',
        characterClass: 'Guerreiro',
        level: 3,
        armorClass: 18,
        currentHp: 28,
        maxHp: 28,
        tempHp: 0,
        speed: 9,
        initiativeBonus: 1,
        abilities: {
          str: { score: 16, saveProficient: true },
          dex: { score: 12, saveProficient: false },
          con: { score: 16, saveProficient: true },
          int: { score: 10, saveProficient: false },
          wis: { score: 13, saveProficient: false },
          cha: { score: 8, saveProficient: false },
        },
        skills: {
          athletics: { proficiency: 'proficient' },
          intimidation: { proficiency: 'proficient' },
        } as unknown as Character['skills'],
        attacks: [
          { id: '1', name: 'Machado de Batalha', attackBonus: 5, damage: '1d8+3', damageType: 'Cortante', range: '1.5m' }
        ],
        spellcasting: {
          ability: 'str',
          spellSaveDcBonus: 0,
          spellAttackBonusMod: 0,
          slots: [],
          spells: [],
        },
      };

      const prompt = buildSystemPrompt(mockChar as Character, 'dark_fantasy');
      expect(prompt).toContain('Thorgar Quebra-Machado');
      expect(prompt).toContain('Anão da Colina Guerreiro (Nível 3)');
      expect(prompt).toContain('FOR 16 (+3)');
      expect(prompt).toContain('Atletismo');
      expect(prompt).toContain('Machado de Batalha');
      expect(prompt).toContain('Ravenloft');
    });
  });

  describe('parseAiResponse', () => {
    it('deve extrair texto limpo, ações sugeridas, teste de dado e pergaminho', () => {
      const rawText = `
Você avança lentamente pelo corredor de pedra úmida. O cheiro de enxofre é intenso.

[TESTE: Percepção (Sabedoria) | CD 14 | Para ouvir o que sussurra atrás da porta reforçada]

[PERGAMINHO: Carta Encharcada | Ordem do Culto]
Irmãos, o selo da cripta foi rompido. Tragam o sacrifício ao amanhecer.
[/PERGAMINHO]

A porta à sua frente permanece entreaberta, pingando água barrenta.

[AÇÕES]
- 1. Empurrar a porta com o escudo em prontidão
- 2. Olhar pela fresta cautelosamente
- 3. Acender uma tocha para iluminar o corredor
[/AÇÕES]
      `.trim();

      const parsed = parseAiResponse(rawText);

      // Texto limpo não deve conter as tags brutas
      expect(parsed.cleanText).toContain('Você avança lentamente pelo corredor');
      expect(parsed.cleanText).not.toContain('[TESTE:');
      expect(parsed.cleanText).not.toContain('[AÇÕES]');
      expect(parsed.cleanText).not.toContain('[PERGAMINHO:');

      // Teste de dado extraído
      expect(parsed.requestedRoll).toBeDefined();
      expect(parsed.requestedRoll?.skillOrAbility).toBe('Percepção (Sabedoria)');
      expect(parsed.requestedRoll?.dc).toBe(14);
      expect(parsed.requestedRoll?.reason).toBe('Para ouvir o que sussurra atrás da porta reforçada');

      // Handout / Pergaminho extraído
      expect(parsed.handoutProposal).toBeDefined();
      expect(parsed.handoutProposal?.title).toBe('Carta Encharcada');
      expect(parsed.handoutProposal?.authorOrOrigin).toBe('Ordem do Culto');
      expect(parsed.handoutProposal?.content).toContain('Irmãos, o selo da cripta foi rompido');

      // Ações sugeridas extraídas
      expect(parsed.suggestedActions).toHaveLength(3);
      expect(parsed.suggestedActions?.[0]).toBe('Empurrar a porta com o escudo em prontidão');
      expect(parsed.suggestedActions?.[1]).toBe('Olhar pela fresta cautelosamente');
      expect(parsed.suggestedActions?.[2]).toBe('Acender uma tocha para iluminar o corredor');
    });

    it('deve extrair tag de [ATAQUE_MONSTRO] com sucesso', () => {
      const rawText = `
O Goblin Líder surge das sombras com um sibilo cruel!
[ATAQUE_MONSTRO: Goblin Líder | Cimitarra Farpada | +4 | 1d6+2 | Thorin]
      `.trim();

      const parsed = parseAiResponse(rawText);
      expect(parsed.cleanText).toBe('O Goblin Líder surge das sombras com um sibilo cruel!');
      expect(parsed.monsterAttack).toBeDefined();
      expect(parsed.monsterAttack?.monsterName).toBe('Goblin Líder');
      expect(parsed.monsterAttack?.attackName).toBe('Cimitarra Farpada');
      expect(parsed.monsterAttack?.attackBonus).toBe(4);
      expect(parsed.monsterAttack?.damageFormula).toBe('1d6+2');
      expect(parsed.monsterAttack?.target).toBe('Thorin');
    });

    it('deve extrair tags de [DERROTAR_MONSTRO] e [DANO_MONSTRO] com sucesso', () => {
      const rawText = `
O golpe parte a carcaça da fera ao meio!
[DERROTAR_MONSTRO: Fera de Carga Corrompida]
[DANO_MONSTRO: Orc Guerreiro | 12]
      `.trim();

      const parsed = parseAiResponse(rawText);
      expect(parsed.cleanText).toBe('O golpe parte a carcaça da fera ao meio!');
      expect(parsed.defeatedMonsters).toEqual(['Fera de Carga Corrompida']);
      expect(parsed.monsterDamage).toEqual([{ monsterName: 'Orc Guerreiro', damage: 12 }]);
    });

    it('deve extrair tag de [LOOT] com moedas e itens com sucesso', () => {
      const rawText = `
Vocês vasculham os restos do acampamento e encontram um baú com reforços de latão!
[LOOT: 25 PO, 50 PP | 2x Poção de Cura, 1x Adaga de Prata]
      `.trim();

      const parsed = parseAiResponse(rawText);
      expect(parsed.cleanText).toBe('Vocês vasculham os restos do acampamento e encontram um baú com reforços de latão!');
      expect(parsed.lootReward).toBeDefined();
      expect(parsed.lootReward?.coins?.gp).toBe(25);
      expect(parsed.lootReward?.coins?.sp).toBe(50);
      expect(parsed.lootReward?.items).toEqual([
        { name: 'Poção de Cura', quantity: 2 },
        { name: 'Adaga de Prata', quantity: 1 },
      ]);
    });

    it('deve lidar graciosamente com textos simples sem tags', () => {
      const rawText = 'O guarda sorri e permite sua passagem pela ponte levadiça.';
      const parsed = parseAiResponse(rawText);
      expect(parsed.cleanText).toBe(rawText);
      expect(parsed.suggestedActions).toBeUndefined();
      expect(parsed.requestedRoll).toBeUndefined();
      expect(parsed.handoutProposal).toBeUndefined();
      expect(parsed.monsterAttack).toBeUndefined();
      expect(parsed.defeatedMonsters).toBeUndefined();
      expect(parsed.monsterDamage).toBeUndefined();
      expect(parsed.lootReward).toBeUndefined();
    });
  });

  describe('Configurações e Chave de API', () => {
    it('deve salvar e carregar a chave de API no localStorage', () => {
      expect(getStoredApiKey()).toBe('');
      saveStoredApiKey('AIzaSyTestKey123456');
      expect(getStoredApiKey()).toBe('AIzaSyTestKey123456');
    });

    it('deve persistir configurações completas', () => {
      saveStoredAiConfig({
        apiKey: 'chave-teste',
        model: DEFAULT_MODEL,
        tone: 'dark_fantasy',
        customInstructions: 'Seja implacável nos combates.',
        includeCharacterStats: true,
      });

      const loaded = getStoredAiConfig();
      expect(loaded.apiKey).toBe('chave-teste');
      expect(loaded.tone).toBe('dark_fantasy');
      expect(loaded.customInstructions).toBe('Seja implacável nos combates.');
      expect(loaded.model).toBe(DEFAULT_MODEL);
    });

    it('deve migrar modelos inexistentes ou inválidos como gemini-3.6-flash e gemini-3.5-flash automaticamente para DEFAULT_MODEL', () => {
      localStorageMock.setItem(
        'arcanasheet_ai_dm_config',
        JSON.stringify({
          model: 'gemini-3.6-flash',
          tone: 'heroic',
        })
      );

      const config = getStoredAiConfig();
      expect(config.model).toBe(DEFAULT_MODEL);
    });

    it('deve migrar gemini-3.5-flash para DEFAULT_MODEL', () => {
      localStorageMock.setItem(
        'arcanasheet_ai_dm_config',
        JSON.stringify({
          model: 'gemini-3.5-flash',
          tone: 'heroic',
        })
      );

      const config = getStoredAiConfig();
      expect(config.model).toBe(DEFAULT_MODEL);
    });

    it('deve salvar e carregar a memória da campanha (campaignSummary)', () => {
      expect(getStoredCampaignSummary()).toBe('');
      saveStoredCampaignSummary('O grupo resgatou a princesa e encontrou a espada de prata.');
      expect(getStoredCampaignSummary()).toBe('O grupo resgatou a princesa e encontrou a espada de prata.');
    });

    it('deve incluir o resumo da campanha no system prompt quando fornecido', () => {
      const prompt = buildSystemPrompt(null, 'heroic', undefined, 'Os heróis derrotaram o Orc Líder na mina.');
      expect(prompt).toContain('MEMÓRIA DE LONGO PRAZO DA CAMPANHA');
      expect(prompt).toContain('Os heróis derrotaram o Orc Líder na mina.');
    });
  });
});
