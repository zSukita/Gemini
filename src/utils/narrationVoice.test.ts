import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  cleanNarrativeForSpeech,
  isAutoNarrationEnabled,
  setAutoNarrationEnabled,
  toggleAutoNarration,
  splitIntoSentences,
  isNarratableMessage,
  getVoiceNarrationMode,
  setVoiceNarrationMode,
  toggleVoiceNarrationMode,
} from './narrationVoice';

describe('narrationVoice utility', () => {
  const storage: Record<string, string> = {};

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => {
        storage[key] = String(val);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.restoreAllMocks();
  });

  it('deve limpar formatações de markdown e colchetes mecânicos', () => {
    const input = `### O Guardião das Sombras
O orc avança com seu machado **pesado**!
[ROLAGEM DE DADO: Atletismo CD 15]
Ele sussurra: *"Vocês nunca sairão vivos daqui!"*`;

    const cleaned = cleanNarrativeForSpeech(input);

    expect(cleaned).not.toContain('###');
    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('[ROLAGEM');
    expect(cleaned).toContain('O orc avança com seu machado pesado!');
    expect(cleaned).toContain('Vocês nunca sairão vivos daqui!');
  });

  it('deve limpar fórmulas de dados crus e tags de prompt @mestre', () => {
    const input = `@mestre [RESULTADO DO ATAQUE]: 🎯 ACERTOU! [1d20+5] = 18 (vs CA 14) causando 8 PV de dano!`;
    const cleaned = cleanNarrativeForSpeech(input);

    expect(cleaned).not.toContain('@mestre');
    expect(cleaned).not.toContain('[RESULTADO DO ATAQUE]');
    expect(cleaned).not.toContain('[1d20+5]');
    expect(cleaned).not.toContain('= 18');
    expect(cleaned).toContain('pontos de vida');
    expect(cleaned).toContain('classe de armadura 14');
  });

  it('deve dividir textos longos em sentenças (chunking)', () => {
    const longText = 'O ar na masmorra fica subitamente gélido. Uma sombra emerge do sarcófago de pedra! Os aventureiros sacam suas lâminas em guarda. O que vocês fazem agora?';
    const sentences = splitIntoSentences(longText);

    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences[0]).toContain('O ar na masmorra fica subitamente gélido.');
    expect(sentences[1]).toContain('Uma sombra emerge do sarcófago de pedra!');
  });

  it('deve filtrar corretamente mensagens narráveis vs logs mecânicos', () => {
    // Logs mecânicos não devem ser narrados
    expect(isNarratableMessage({ text: '⚠️ **Reforços Inimigos:** 2x Carniçal entraram no combate!' })).toBe(false);
    expect(isNarratableMessage({ text: '👣 **Movimentação:** Carniçal deslocou-se 4 casas no mapa!' })).toBe(false);
    expect(isNarratableMessage({ text: '💀 **Derrota:** Carniçal foi abatido!' })).toBe(false);
    expect(isNarratableMessage({ text: '⏳ **Turno de Carniçal 1!**' })).toBe(false);
    expect(isNarratableMessage({ text: '🎲 **Iniciativa de Combate:** Iniciando...' })).toBe(false);
    expect(isNarratableMessage({ text: '🎯 ACERTOU! [1d20+4] = 18 (vs CA 12)' })).toBe(false);
    expect(isNarratableMessage({ text: '⚔️ **Carniçal** desferiu **Mordida** contra **Herói**!\n\n🎲 **Rolagem de Ataque:** [1d20+4] ➜ **⚔️ ACERTOU!**' })).toBe(false);

    // Narrativas do Mestre IA devem ser narradas
    expect(isNarratableMessage({ text: 'A névoa espessa se abre revelando a entrada de uma cripta ancestral envolta por runas arcanas.' })).toBe(true);
    expect(isNarratableMessage({ text: 'O carniçal recua sibilando de dor enquanto o fogo da tocha ilumina suas presas ensanguentadas.' })).toBe(true);

    // Prólogos de aventura e cenários devem ser narrados
    expect(
      isNarratableMessage({
        text: '📜 **Prólogo da Aventura Solo: A Cripta dos Reis Esquecidos**\n\nVocês descem pelas escadarias úmidas de pedra antiga e entram na Cripta dos Reis Esquecidos. O ar cheira a pó e cinzas antigas.',
      })
    ).toBe(true);

    // Turno narrativo do monstro deve ser narrado
    expect(
      isNarratableMessage({
        text: '⚔️ **Turno do Monstro:** O Mestre IA comanda **Esqueleto**, que avança ferozmente e desfere **Espada Curta** contra os heróis!',
      })
    ).toBe(true);

    // Vitória no combate com texto de epílogo deve ser narrada
    expect(
      isNarratableMessage({
        text: '🏆 **VITÓRIA NO COMBATE!**\n\nTodos os inimigos foram derrotados na **Rodada 2**!\n\n_A poeira da batalha assenta e os corações acalmam. Vocês triunfaram! O que desejam fazer agora?_',
      })
    ).toBe(true);
  });

  it('deve limpar dados complexos e avisos de sistema mecânicos na síntese', () => {
    const input = `O esqueleto avança cambaleante!
[d20 (13) + 2] = 15
⚖️ Ações mecânicas aguardam revisão do Mestre.
Ele golpeia com força! [d20 (14) + 4] ➜ ⚔️ ACERTOU!`;

    const cleaned = cleanNarrativeForSpeech(input);

    expect(cleaned).not.toContain('[d20 (13) + 2]');
    expect(cleaned).not.toContain('= 15');
    expect(cleaned).not.toContain('Ações mecânicas aguardam');
    expect(cleaned).not.toContain('➜');
    expect(cleaned).toContain('O esqueleto avança cambaleante!');
    expect(cleaned).toContain('Ele golpeia com força!');
  });

  it('deve gerenciar estado de auto-narração no localStorage', () => {
    expect(isAutoNarrationEnabled()).toBe(false);

    setAutoNarrationEnabled(true);
    expect(isAutoNarrationEnabled()).toBe(true);

    const toggled = toggleAutoNarration();
    expect(toggled).toBe(false);
    expect(isAutoNarrationEnabled()).toBe(false);
  });

  it('deve gerenciar modo de narração (story_only vs all)', () => {
    expect(getVoiceNarrationMode()).toBe('story_only');

    setVoiceNarrationMode('all');
    expect(getVoiceNarrationMode()).toBe('all');

    const toggled = toggleVoiceNarrationMode();
    expect(toggled).toBe('story_only');
    expect(getVoiceNarrationMode()).toBe('story_only');
  });
});
