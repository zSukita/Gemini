import { describe, it, expect, beforeEach } from 'vitest';
import { 
  buildSystemPrompt, 
  parseAiResponse, 
  getStoredApiKey, 
  saveStoredApiKey,
  getStoredAiConfig,
  saveStoredAiConfig,
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

    it('deve lidar graciosamente com textos simples sem tags', () => {
      const rawText = 'O guarda sorri e permite sua passagem pela ponte levadiça.';
      const parsed = parseAiResponse(rawText);
      expect(parsed.cleanText).toBe(rawText);
      expect(parsed.suggestedActions).toBeUndefined();
      expect(parsed.requestedRoll).toBeUndefined();
      expect(parsed.handoutProposal).toBeUndefined();
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

    it('deve migrar modelos depreciados como gemini-1.5-flash automaticamente para gemini-2.5-flash', () => {
      localStorageMock.setItem(
        'arcanasheet_ai_dm_config',
        JSON.stringify({
          model: 'gemini-1.5-flash',
          tone: 'heroic',
        })
      );

      const config = getStoredAiConfig();
      expect(config.model).toBe('gemini-2.5-flash');
    });

    it('deve migrar gemini-2.5-flash-lite descontinuado para gemini-2.5-flash', () => {
      localStorageMock.setItem(
        'arcanasheet_ai_dm_config',
        JSON.stringify({
          model: 'gemini-2.5-flash-lite',
          tone: 'heroic',
        })
      );

      const config = getStoredAiConfig();
      expect(config.model).toBe('gemini-2.5-flash');
    });
  });
});
