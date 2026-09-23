import { GoogleGenAI } from '@google/genai';
import { type Character, SKILLS } from '../types/dnd5e';
import type { 
  AiDmConfig, 
  AiMessage, 
  AiOracleAction, 
  AdventureTone,
  RequestedRoll,
  HandoutProposal,
  MonsterAttackAction,
  MonsterSpawnAction,
  MapMoveAction,
  AiLootReward,
  AiLootItem,
  AiProvider
} from '../types/aiDm';

const API_KEY_STORAGE_KEY = 'arcanasheet_gemini_api_key';
const GROQ_API_KEY_STORAGE_KEY = 'arcanasheet_groq_api_key';
const PROVIDER_STORAGE_KEY = 'arcanasheet_ai_provider';
const CONFIG_STORAGE_KEY = 'arcanasheet_ai_dm_config';
const CHAT_HISTORY_STORAGE_KEY = 'arcanasheet_ai_dm_history';
const CAMPAIGN_SUMMARY_STORAGE_KEY = 'arcanasheet_ai_campaign_summary';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_POLLINATIONS_MODEL = 'openai';

export const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;
const GROQ_ACTIVE_MODEL_STORAGE_KEY = 'arcanasheet_groq_active_model';

export function getStoredGroqModel(): string {
  if (typeof localStorage !== 'undefined') {
    const m = localStorage.getItem(GROQ_ACTIVE_MODEL_STORAGE_KEY);
    if (m && m.trim()) return m.trim();
  }
  return DEFAULT_GROQ_MODEL;
}

export function saveStoredGroqModel(model: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GROQ_ACTIVE_MODEL_STORAGE_KEY, model.trim());
  }
}

/**
 * Consulta a lista de modelos ativos e acessíveis para a chave da Groq
 */
export async function fetchActiveGroqModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data: Array<{ id: string }> = json.data || [];
    return data
      .map((d) => d.id)
      .filter(
        (id) =>
          !id.includes('whisper') &&
          !id.includes('guard') &&
          !id.includes('vision') &&
          !id.includes('embedding')
      );
  } catch (err) {
    console.warn('Erro ao consultar modelos ativos no Groq:', err);
    return [];
  }
}

/**
 * Seleciona o melhor modelo disponível para texto e narrativa
 */
export function pickBestGroqModel(availableModels: string[]): string {
  const preferred = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];
  for (const p of preferred) {
    if (availableModels.includes(p)) return p;
  }
  const gptOss = availableModels.find((m) => m.includes('gpt-oss'));
  if (gptOss) return gptOss;
  const llama = availableModels.find((m) => m.includes('llama'));
  if (llama) return llama;
  const qwen = availableModels.find((m) => m.includes('qwen'));
  if (qwen) return qwen;

  return availableModels[0] || DEFAULT_GROQ_MODEL;
}

export function getStoredAiProvider(): AiProvider {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY) as AiProvider;
    if (stored && (stored === 'groq' || stored === 'gemini' || stored === 'pollinations')) {
      return stored;
    }
    // Se tiver chave Groq salva, default para groq
    if (localStorage.getItem(GROQ_API_KEY_STORAGE_KEY)?.trim()) {
      return 'groq';
    }
  }
  return 'groq'; // Recomenda Groq como primeira opção padrão
}

export function saveStoredAiProvider(provider: AiProvider): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  }
}

export function getStoredGroqApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  const envKey = (import.meta as unknown as { env?: { VITE_GROQ_API_KEY?: string } }).env?.VITE_GROQ_API_KEY;
  return envKey?.trim() || '';
}

export function saveStoredGroqApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key.trim());
  }
}

export const DEFAULT_AI_CONFIG: AiDmConfig = {
  provider: 'groq',
  apiKey: '',
  groqApiKey: '',
  model: DEFAULT_GROQ_MODEL,
  tone: 'heroic',
  customInstructions: '',
  includeCharacterStats: true,
  campaignSummary: '',
};

export function getStoredApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
  return envKey?.trim() || '';
}

export function saveStoredApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
}

export function getStoredCampaignSummary(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CAMPAIGN_SUMMARY_STORAGE_KEY) || '';
    }
  } catch {
    // fallback
  }
  return '';
}

export function saveStoredCampaignSummary(summary: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CAMPAIGN_SUMMARY_STORAGE_KEY, summary.trim());
    }
  } catch (err) {
    console.error('Falha ao salvar resumo da campanha', err);
  }
}

export function getStoredAiConfig(): AiDmConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      const provider = getStoredAiProvider();
      const groqKey = getStoredGroqApiKey();
      const geminiKey = getStoredApiKey();

      if (raw) {
        const parsed = JSON.parse(raw);
        // Migra automaticamente modelos descontinuados pelo Google (2.5, 2.0, 1.5, 1.0)
        const isInvalidOrDeprecated =
          !parsed.model ||
          parsed.model.includes('2.5') ||
          parsed.model.includes('2.0') ||
          parsed.model.includes('1.5') ||
          parsed.model.includes('1.0');
        
        const isGeminiModel = typeof parsed.model === 'string' && parsed.model.startsWith('gemini');
        const activeProvider: AiProvider = parsed.provider || (isGeminiModel ? 'gemini' : provider);
        let model = parsed.model;
        if (isInvalidOrDeprecated && (activeProvider === 'gemini' || isGeminiModel)) {
          model = DEFAULT_GEMINI_MODEL;
        }
        if (!model) {
          model = activeProvider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_GEMINI_MODEL;
        }

        if (isInvalidOrDeprecated && (activeProvider === 'gemini' || isGeminiModel) && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...parsed, model: DEFAULT_GEMINI_MODEL }));
          } catch {
            // ignore
          }
        }

        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          provider: activeProvider,
          apiKey: geminiKey,
          groqApiKey: groqKey,
          model,
          campaignSummary: parsed.campaignSummary ?? getStoredCampaignSummary(),
        };
      }
    }
  } catch (err) {
    console.error('Falha ao ler configuração da IA', err);
  }
  return {
    ...DEFAULT_AI_CONFIG,
    provider: getStoredAiProvider(),
    apiKey: getStoredApiKey(),
    groqApiKey: getStoredGroqApiKey(),
  };
}

export function saveStoredAiConfig(config: AiDmConfig): void {
  try {
    const { apiKey, groqApiKey, provider, ...rest } = config;
    if (apiKey !== undefined) {
      saveStoredApiKey(apiKey);
    }
    if (groqApiKey !== undefined) {
      saveStoredGroqApiKey(groqApiKey);
    }
    if (provider !== undefined) {
      saveStoredAiProvider(provider);
    }
    if (config.campaignSummary !== undefined) {
      saveStoredCampaignSummary(config.campaignSummary);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...rest, provider }));
    }
  } catch (err) {
    console.error('Falha ao salvar configurações do Mestre IA', err);
  }
}

export function getStoredChatHistory(): AiMessage[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveStoredChatHistory(history: AiMessage[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.error('Falha ao salvar histórico da aventura com a IA', err);
  }
}

export function clearStoredChatHistory(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  }
}

/**
 * Cria o prompt de sistema especializado para o Mestre de RPG D&D 5e
 */
export function buildSystemPrompt(
  character?: Character | null,
  tone: AdventureTone = 'heroic',
  customInstructions?: string,
  campaignSummary?: string
): string {
  let charContext = 'Nenhum personagem selecionado (Aventureiro Desconhecido).';

  if (character) {
    const getMod = (score: number) => Math.floor((score - 10) / 2);
    const abilities = character.abilities;
    const strMod = getMod(abilities.str.score);
    const dexMod = getMod(abilities.dex.score);
    const conMod = getMod(abilities.con.score);
    const intMod = getMod(abilities.int.score);
    const wisMod = getMod(abilities.wis.score);
    const chaMod = getMod(abilities.cha.score);

    const skillsProficient = Object.entries(character.skills || {})
      .filter(([, s]) => s.proficiency === 'proficient' || s.proficiency === 'expertise')
      .map(([name, s]) => {
        const ptName = SKILLS[name as keyof typeof SKILLS]?.name || name;
        return `${ptName}${s.proficiency === 'expertise' ? ' (Especialista)' : ''}`;
      })
      .join(', ') || 'Nenhuma declarada';

    const attacks = character.attacks?.map(a => `${a.name} (${a.attackBonus >= 0 ? `+${a.attackBonus}` : a.attackBonus}, dano: ${a.damage} ${a.damageType})`).join('; ') || 'Nenhum cadastrado';
    const spells = character.spellcasting?.spells?.slice(0, 10).map(s => s.name).join(', ') || 'Nenhuma magia';

    charContext = `
DADOS DO PERSONAGEM DO JOGADOR:
- Nome: ${character.name || 'Herói sem nome'}
- Raça / Classe: ${character.race || 'Humano'} ${character.characterClass || 'Aventureiro'} (Nível ${character.level || 1})
- Antecedente: ${character.background || 'Indeterminado'} | Alinhamento: ${character.alignment || 'Neutro'}
- Pontos de Vida: ${character.currentHp}/${character.maxHp} (PV Temporários: ${character.tempHp || 0})
- Classe de Armadura (CA): ${character.armorClass} | Iniciativa: ${character.initiativeBonus >= 0 ? `+${character.initiativeBonus}` : character.initiativeBonus} | Velocidade: ${character.speed}m
- Atributos: FOR ${abilities.str.score} (${strMod >= 0 ? `+${strMod}` : strMod}), DES ${abilities.dex.score} (${dexMod >= 0 ? `+${dexMod}` : dexMod}), CON ${abilities.con.score} (${conMod >= 0 ? `+${conMod}` : conMod}), INT ${abilities.int.score} (${intMod >= 0 ? `+${intMod}` : intMod}), SAB ${abilities.wis.score} (${wisMod >= 0 ? `+${wisMod}` : wisMod}), CAR ${abilities.cha.score} (${chaMod >= 0 ? `+${chaMod}` : chaMod})
- Perícias com Proficiência: ${skillsProficient}
- Armas / Ataques: ${attacks}
- Magias Conhecidas/Preparadas: ${spells}
    `.trim();
  }

  const toneGuidelines: Record<AdventureTone, string> = {
    heroic: 'Estilo Fantasia Heroica Clássica: Foco em coragem, façanhas lendárias, ritmo dinâmico, vitórias conquistadas com bravura e aliados inspiradores.',
    dark_fantasy: 'Estilo Terror Sombrio & Gótico (estilo Ravenloft / Dark Souls): Tensão psicológica constante, descrições sensoriais de decadência, névoa, sombras e dilemas morais com consequências duras.',
    dungeon_crawl: 'Estilo Masmorra & Desafio Tático: Ênfase em arquitetura subterrânea, armadilhas, recursos escassos (tochas, cordas), posições táticas e cautela.',
    mystery: 'Estilo Investigação & Intriga: Pistas ocultas, suspeitos com motivações conflitantes, pistas em cartas ou testemunhos, enigmas e deduções.',
    survival: 'Estilo Sobrevivência & Ermos: Desafios com clima hostil, feras territoriais, orientação geográfica e gestão de cansaço e mantimentos.',
  };

  return `
Você é o Mestre Supremo de RPG do ArcanaSheet (Dungeon Master para D&D 5ª Edição).
Seu objetivo é conduzir uma narrativa interativa de RPG de altíssima qualidade, imersiva, empolgante e totalmente adaptada às escolhas do jogador.

DIRETRIZES FUNDAMENTAIS DE REGRAS E COMBATE D&D 5e:
1. Idioma: Português do Brasil impecável, com vocabulário rico de fantasia medieval, descrições sensoriais (sons de passos ecoando, cheiro de ozônio e cinzas, o brilho da tocha nas pedras úmidas).
2. ${toneGuidelines[tone]}
3. Conhecimento Estrito das Regras D&D 5e:
   - NUNCA decida ou narre o sucesso, acerto, dano ou morte de um inimigo ANTES que o jogador role os dados!
   - Se o jogador declarar um ataque, magia ou ação com risco, descreva a postura do personagem, arme o momento e PARE imediatamente solicitando a rolagem apropriada.
   - Em ataques de combate do jogador: Peça a Rolagem de Ataque (1d20 + Bônus de Ataque vs CA do alvo). Use a tag:
     [TESTE: Ataque com {Arma} (Força/Destreza) | CD {CA do Alvo} | Para acertar {Nome do Inimigo}]
     Exemplo: [TESTE: Ataque com Machado Grande (Força) | CD 13 | Para acertar o Orc Guerreiro]
   - Somente após o jogador responder com o resultado da rolagem de ataque você narra se acertou ou errou. Se acertar, peça então a rolagem do dado específico de dano da arma do personagem (1d12 para machado grande, 2d6 para espadão, 1d8 para martelo de guerra ou espada longa, 1d6 para lança/arco curto, 1d4 para adaga, etc.).
4. Respeite as ações do jogador: Nunca jogue pelo jogador nem decida os pensamentos dele. Descreva o ambiente, os NPCs, as reações do mundo e pergunte: "O que você faz?".
5. Mantenha os turnos concisos e impactantes (entre 2 e 4 parágrafos bem escritos). Evite respostas excessivamente longas que cansem o leitor.

${charContext}

${campaignSummary ? `\nMEMÓRIA DE LONGO PRAZO DA CAMPANHA (RESUMO DOS FATOS ANTERIORES):\n${campaignSummary}\n` : ''}

${customInstructions ? `INSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${customInstructions}\n` : ''}

REGRAS DE FORMATAÇÃO ESPECIAL (MANDATÓRIO):
- Para sugerir ações rápidas ao final do seu turno, inclua sempre exatamente 3 opções no formato:
  [AÇÕES]
  - Opção 1
  - Opção 2
  - Opção 3
  [/AÇÕES]
- Se a situação exigir um teste ou rolagem de ataque do jogador, inclua uma tag no formato:
  [TESTE: Nome da Perícia, Atributo ou Ataque | CD Número | Motivo sucinto]
  Exemplo: [TESTE: Furtividade (Destreza) | CD 12 | Para se esgueirar pelas sombras sem alertar o sentinela]
  Exemplo: [TESTE: Ataque com Espada Longa (Força) | CD 13 | Para romper a guarda do Orc]
- Se novos monstros, emboscadas ou criaturas surgirem na cena, declare a tag:
  [SPAWN_MONSTRO: Nome do Monstro | Quantidade]
  Exemplo: [SPAWN_MONSTRO: Orc Guerreiro | 2]
  Exemplo: [SPAWN_MONSTRO: Goblin Sentinela | 1]
  (REGRA CRÍTICA: Declare [SPAWN_MONSTRO] APENAS na PRIMEIRA vez em que novos inimigos surgirem na cena. NUNCA repita o spawn de monstros que já estão no combate atual!)
- Se personagens ou monstros se moverem no campo de batalha tático, declare a tag:
  [MOVER: Nome do Token | Ação ou Direção | Quantidade de Casas]
  Exemplo: [MOVER: Goblin Sentinela | recua para as sombras | 4]
  Exemplo: [MOVER: Orc Guerreiro 1 | avança em direção ao herói | 6]
- Se monstros atacarem os heróis no turno deles, emita a tag de ataque do monstro:
  [ATAQUE_MONSTRO: Nome do Monstro | Nome do Golpe | +BônusAtaque | FórmulaDano | Nome do Herói Alvo]
  Exemplo: [ATAQUE_MONSTRO: Orc Guerreiro | Machadada Vorpal | +5 | 1d12+3 | Thorin]
  Exemplo: [ATAQUE_MONSTRO: Goblin Sentinela | Flecha Envenenada | +4 | 1d6+2 | Lyra]
  (O sistema calculará no chat a rolagem do d20 vs CA do herói, rolará o dano exato e descontará o PV!)
- Se um monstro for derrotado, abatido, decapitado, morto ou sucumbir (seja por um golpe decisivo, golpe de misericórdia ou ataque letal), emita SEMPRE a tag de derrota:
  [DERROTAR_MONSTRO: Nome do Monstro]
  Exemplo: [DERROTAR_MONSTRO: Fera de Carga Corrompida]
  Exemplo: [DERROTAR_MONSTRO: Goblin Sentinela]
  (Isso sincroniza imediatamente o grid de combate e zera o PV do token no mapa tático!)
- Se um monstro sofrer dano mecânico decorrente de um golpe ou magia, emita:
  [DANO_MONSTRO: Nome do Monstro | Quantidade de Dano]
  Exemplo: [DANO_MONSTRO: Orc Guerreiro | 8]
- Ao recompensar os aventureiros após derrotar monstros, abrir arcas, saquear cadáveres ou receber tesouros, declare a tag:
  [LOOT: Moedas | Itens]
  Exemplo: [LOOT: 25 PO, 50 PP | 2x Poção de Cura, 1x Adaga de Prata]
  Exemplo: [LOOT: 80 PO | 1x Anel de Proteção, 2x Ração de Viagem]
  (Isso gera automaticamente um baú interativo no chat com botão de depósito direto na ficha do aventureiro!)
- Quando o jogador realizar um ataque ou teste de combate, reaja com grande dinamismo narrativo, descreva o impacto dos ferimentos ou a esquiva, faça os monstros revidarem ou se reposicionarem e continue a história sem parar!
- Se o personagem encontrar um pergaminho, carta, diário ou bilhete com texto legível:
  [PERGAMINHO: Título do Documento | Autor ou Origem]
  Texto exato do bilhete ou carta aqui...
  [/PERGAMINHO]
`.trim();
}

/**
 * Extrai tags especiais do texto gerado pela IA
 */
export function parseAiResponse(rawText: string): {
  cleanText: string;
  suggestedActions?: string[];
  requestedRoll?: RequestedRoll;
  handoutProposal?: HandoutProposal;
  monsterAttack?: MonsterAttackAction;
  monsterSpawns?: MonsterSpawnAction[];
  mapMoves?: MapMoveAction[];
  defeatedMonsters?: string[];
  monsterDamage?: { monsterName: string; damage: number }[];
  lootReward?: AiLootReward;
} {
  let cleanText = rawText;
  let suggestedActions: string[] | undefined;
  let requestedRoll: RequestedRoll | undefined;
  let handoutProposal: HandoutProposal | undefined;
  let monsterAttack: MonsterAttackAction | undefined;
  const monsterSpawns: MonsterSpawnAction[] = [];
  const mapMoves: MapMoveAction[] = [];
  const defeatedMonsters: string[] = [];
  const monsterDamage: { monsterName: string; damage: number }[] = [];
  let lootReward: AiLootReward | undefined;

  // 1. Extrair [AÇÕES] ... [/AÇÕES]
  const actionsRegex = /\[AÇÕES\]([\s\S]*?)\[\/AÇÕES\]/i;
  const actionsMatch = rawText.match(actionsRegex);
  if (actionsMatch) {
    const rawActions = actionsMatch[1];
    suggestedActions = rawActions
      .split('\n')
      .map(line => line.replace(/^[\s\-*•\d\.\)]+/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);
    cleanText = cleanText.replace(actionsRegex, '').trim();
  }

  // 2. Extrair [TESTE: Perícia/Ataque | CD XX | Motivo]
  const testRegex = /\[TESTE:\s*([^\]]+)\]/i;
  const testMatch = rawText.match(testRegex);
  if (testMatch) {
    const parts = testMatch[1].split('|').map(p => p.trim());
    const skillOrAbility = parts[0] || 'Teste Geral';
    let dc: number | undefined;
    let reason = 'Para superar o desafio';
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const dcMatch = part.match(/(?:CD|DC)\s*:?\s*(\d+)/i);
      if (dcMatch) {
        dc = parseInt(dcMatch[1], 10);
      } else {
        reason = part;
      }
    }
    requestedRoll = { skillOrAbility, dc, reason };
    cleanText = cleanText.replace(testRegex, '').trim();
  }

  // 3. Extrair [PERGAMINHO: Título | Autor] Conteúdo [/PERGAMINHO]
  const handoutRegex = /\[PERGAMINHO:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]([\s\S]*?)\[\/PERGAMINHO\]/i;
  const handoutMatch = rawText.match(handoutRegex);
  if (handoutMatch) {
    const title = handoutMatch[1].trim();
    const authorOrOrigin = handoutMatch[2] ? handoutMatch[2].trim() : undefined;
    const content = handoutMatch[3].trim();
    handoutProposal = { title, authorOrOrigin, content };
    cleanText = cleanText.replace(handoutRegex, '').trim();
  }

  // 4. Extrair [ATAQUE_MONSTRO: Monstro | Ação | Bônus | Dano | Alvo]
  const monsterAttackRegex = /\[ATAQUE_MONSTRO:\s*([^\]]+)\]/i;
  const monsterAttackMatch = rawText.match(monsterAttackRegex);
  if (monsterAttackMatch) {
    const parts = monsterAttackMatch[1].split('|').map(p => p.trim());
    const monsterName = parts[0] || 'Monstro';
    const attackName = parts[1] || 'Ataque';
    const bonusPart = parts[2] || '+0';
    const attackBonus = parseInt(bonusPart.replace('+', ''), 10) || 0;
    const damageFormula = parts[3] || '1d6';
    const target = parts[4] || undefined;
    monsterAttack = {
      monsterName,
      attackName,
      attackBonus,
      damageFormula,
      target,
    };
    cleanText = cleanText.replace(monsterAttackRegex, '').trim();
  }

  // 5. Extrair [SPAWN_MONSTRO: Monstro | Quantidade]
  const spawnRegex = /\[SPAWN_MONSTRO:\s*([^\]]+)\]/gi;
  let spawnMatch;
  while ((spawnMatch = spawnRegex.exec(rawText)) !== null) {
    const parts = spawnMatch[1].split('|').map(p => p.trim());
    const monsterName = parts[0] || 'Monstro';
    const count = parts[1] ? (parseInt(parts[1], 10) || 1) : 1;
    monsterSpawns.push({ monsterName, count });
  }
  cleanText = cleanText.replace(spawnRegex, '').trim();

  // 6. Extrair [MOVER: Token | Ação ou Direção | Casas]
  const moveRegex = /\[MOVER:\s*([^\]]+)\]/gi;
  let moveMatch;
  while ((moveMatch = moveRegex.exec(rawText)) !== null) {
    const parts = moveMatch[1].split('|').map(p => p.trim());
    const tokenName = parts[0] || 'Token';
    const actionOrTarget = parts[1] || 'avança';
    const distMatch = parts[2] ? parts[2].match(/\d+/) : null;
    const distanceSquares = distMatch ? parseInt(distMatch[0], 10) : undefined;
    mapMoves.push({ tokenName, actionOrTarget, distanceSquares });
  }
  cleanText = cleanText.replace(moveRegex, '').trim();

  // 7. Extrair [DERROTAR_MONSTRO: Monstro]
  const defeatRegex = /\[DERROTAR_MONSTRO:\s*([^\]]+)\]/gi;
  let defeatMatch;
  while ((defeatMatch = defeatRegex.exec(rawText)) !== null) {
    const name = defeatMatch[1].trim();
    if (name) defeatedMonsters.push(name);
  }
  cleanText = cleanText.replace(defeatRegex, '').trim();

  // 8. Extrair [DANO_MONSTRO: Monstro | Dano]
  const dmgRegex = /\[DANO_MONSTRO:\s*([^\]]+)\]/gi;
  let dmgMatch;
  while ((dmgMatch = dmgRegex.exec(rawText)) !== null) {
    const parts = dmgMatch[1].split('|').map(p => p.trim());
    const monsterName = parts[0];
    const dmg = parseInt(parts[1], 10);
    if (monsterName && !isNaN(dmg)) {
      monsterDamage.push({ monsterName, damage: dmg });
    }
  }
  cleanText = cleanText.replace(dmgRegex, '').trim();

  // 9. Extrair [LOOT: Moedas | Itens] ou [LOOT: ...]
  const lootRegex = /\[LOOT:\s*([^\]]+)\]/i;
  const lootMatch = rawText.match(lootRegex);
  if (lootMatch) {
    const rawLoot = lootMatch[1].trim();
    const parts = rawLoot.split('|').map((p) => p.trim());
    const coins: NonNullable<AiLootReward['coins']> = {};
    const items: AiLootItem[] = [];

    const isCoinOnly = (chunk: string) => {
      return (
        /^\s*\d+\s*(?:po|gp|pp|sp|pc|cp|pe|ep|pl)\b/i.test(chunk) ||
        /^\s*\d+\s*(?:peças?|moedas?)\s+de\s+(?:ouro|prata|cobre|electro|platina)\b/i.test(chunk)
      );
    };

    const parseCoinStr = (str: string) => {
      const gpMatch = str.match(/(\d+)\s*(?:po|gp|\bpeças?\s+de\s+ouro|\bmoedas?\s+de\s+ouro)/i);
      if (gpMatch) coins.gp = (coins.gp || 0) + parseInt(gpMatch[1], 10);

      const spMatch = str.match(/(\d+)\s*(?:pp|sp|\bpeças?\s+de\s+prata|\bmoedas?\s+de\s+prata)/i);
      if (spMatch) coins.sp = (coins.sp || 0) + parseInt(spMatch[1], 10);

      const cpMatch = str.match(/(\d+)\s*(?:pc|cp|\bpeças?\s+de\s+cobre|\bmoedas?\s+de\s+cobre)/i);
      if (cpMatch) coins.cp = (coins.cp || 0) + parseInt(cpMatch[1], 10);

      const epMatch = str.match(/(\d+)\s*(?:pe|ep|\bpeças?\s+de\s+electro|\bmoedas?\s+de\s+electro)/i);
      if (epMatch) coins.ep = (coins.ep || 0) + parseInt(epMatch[1], 10);

      const plMatch = str.match(/(\d+)\s*(?:pl|\bpeças?\s+de\s+platina|\bmoedas?\s+de\s+platina)/i);
      if (plMatch) coins.pp = (coins.pp || 0) + parseInt(plMatch[1], 10);
    };

    const parseItemStr = (str: string) => {
      const itemChunks = str.split(',').map((c) => c.trim()).filter(Boolean);
      itemChunks.forEach((chunk) => {
        if (isCoinOnly(chunk)) {
          parseCoinStr(chunk);
          return;
        }
        const qtyMatch = chunk.match(/^(\d+)x?\s*(.+)$/i);
        if (qtyMatch) {
          items.push({
            quantity: parseInt(qtyMatch[1], 10) || 1,
            name: qtyMatch[2].trim(),
          });
        } else {
          items.push({
            quantity: 1,
            name: chunk.trim(),
          });
        }
      });
    };

    if (parts.length >= 2) {
      if (isCoinOnly(parts[0]) || /\b(?:po|gp|pp|sp|pc|cp|pe|ep|pl)\b/i.test(parts[0])) {
        parseCoinStr(parts[0]);
      } else {
        parseItemStr(parts[0]);
      }
      parseItemStr(parts[1]);
    } else {
      const chunks = parts[0].split(',').map((c) => c.trim()).filter(Boolean);
      chunks.forEach((chunk) => {
        if (isCoinOnly(chunk)) {
          parseCoinStr(chunk);
        } else {
          const qtyMatch = chunk.match(/^(\d+)x?\s*(.+)$/i);
          if (qtyMatch) {
            items.push({
              quantity: parseInt(qtyMatch[1], 10) || 1,
              name: qtyMatch[2].trim(),
            });
          } else {
            items.push({
              quantity: 1,
              name: chunk.trim(),
            });
          }
        }
      });
    }

    lootReward = {
      coins: Object.keys(coins).length > 0 ? coins : undefined,
      items: items.length > 0 ? items : undefined,
      rawText: rawLoot,
    };
    cleanText = cleanText.replace(lootRegex, '').trim();
  }

  return {
    cleanText: cleanText.replace(/\n{3,}/g, '\n\n').trim(),
    suggestedActions,
    requestedRoll,
    handoutProposal,
    monsterAttack,
    monsterSpawns: monsterSpawns.length > 0 ? monsterSpawns : undefined,
    mapMoves: mapMoves.length > 0 ? mapMoves : undefined,
    defeatedMonsters: defeatedMonsters.length > 0 ? defeatedMonsters : undefined,
    monsterDamage: monsterDamage.length > 0 ? monsterDamage : undefined,
    lootReward,
  };
}

/**
 * Chamada à API ultra-rápida do Groq (Hardware LPU, modelos OpenAI GPT-OSS e Llama)
 */
async function callGroqChat(
  apiKey: string,
  model: string = DEFAULT_GROQ_MODEL,
  systemInstruction: string,
  history: AiMessage[],
  userAction: string
): Promise<AiMessage> {
  const storedModel = getStoredGroqModel();
  const safeModel =
    model && !model.includes('llama-3.3-70b-versatile') && !model.includes('llama-3.1-8b-instant')
      ? model
      : storedModel;

  let candidateModels = Array.from(
    new Set([
      safeModel,
      storedModel,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ])
  );

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history
      .filter((m) => m.role === 'narrator' || m.role === 'player')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'narrator' ? 'assistant' : 'user',
        content: m.content,
      })),
    { role: 'user', content: userAction },
  ];

  let lastErr: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const m of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.85,
            max_completion_tokens: 1500,
            top_p: 0.95,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || 'O Mestre aguarda em silêncio...';
        const parsed = parseAiResponse(rawText);

        saveStoredGroqModel(m);

        return {
          id: `ai_groq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          role: 'narrator',
          content: parsed.cleanText,
          timestamp: Date.now(),
          suggestedActions: parsed.suggestedActions,
          requestedRoll: parsed.requestedRoll,
          handoutProposal: parsed.handoutProposal,
          monsterAttack: parsed.monsterAttack,
          monsterSpawns: parsed.monsterSpawns,
          mapMoves: parsed.mapMoves,
          defeatedMonsters: parsed.defeatedMonsters,
          monsterDamage: parsed.monsterDamage,
          lootReward: parsed.lootReward,
        };
      } catch (err: unknown) {
        lastErr = err;
        console.warn(`[Groq] Erro com modelo ${m}:`, err);
      }
    }

    // Se nenhum dos modelos predefinidos funcionou, busca em tempo real os modelos ativos na conta do usuário
    if (attempt === 0) {
      const liveModels = await fetchActiveGroqModels(apiKey);
      if (liveModels.length > 0) {
        candidateModels = [pickBestGroqModel(liveModels), ...liveModels.slice(0, 3)];
      }
    }
  }

  const rawMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  if (rawMsg.includes('401') || rawMsg.includes('Invalid API Key')) {
    throw new Error('Chave do Groq inválida. Verifique sua chave gratuita em console.groq.com/keys.');
  }
  if (rawMsg.includes('429') || rawMsg.includes('rate_limit_exceeded')) {
    throw new Error('Limite momentâneo de requisições do Groq atingido. Aguarde alguns segundos.');
  }
  throw new Error(`Falha ao conectar com o Groq: ${rawMsg}`);
}

/**
 * Chamada à API pública e gratuita do Pollinations (Sem necessidade de chave de API)
 */
async function callPollinationsChat(
  systemInstruction: string,
  history: AiMessage[],
  userAction: string
): Promise<AiMessage> {
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history
      .filter((m) => m.role === 'narrator' || m.role === 'player')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'narrator' ? 'assistant' : 'user',
        content: m.content,
      })),
    { role: 'user', content: userAction },
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: Math.floor(Math.random() * 100000),
        temperature: 0.85,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || 'O Mestre aguarda em silêncio...';
      const parsed = parseAiResponse(rawText);

      return {
        id: `ai_poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'narrator',
        content: parsed.cleanText,
        timestamp: Date.now(),
        suggestedActions: parsed.suggestedActions,
        requestedRoll: parsed.requestedRoll,
        handoutProposal: parsed.handoutProposal,
        monsterAttack: parsed.monsterAttack,
        monsterSpawns: parsed.monsterSpawns,
        mapMoves: parsed.mapMoves,
        defeatedMonsters: parsed.defeatedMonsters,
        monsterDamage: parsed.monsterDamage,
        lootReward: parsed.lootReward,
      };
    }
  } catch (err) {
    console.warn('[Pollinations] Erro no endpoint OpenAI, tentando endpoint direto...', err);
  }

  // Fallback para endpoint direto de texto
  const combinedHistory = messages
    .map((m) => `${m.role === 'system' ? 'Instruções' : m.role === 'assistant' ? 'Mestre' : 'Jogador'}: ${m.content}`)
    .join('\n');

  const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(combinedHistory)}`);
  if (!fallbackRes.ok) {
    throw new Error('Falha no Modo Livre (Pollinations). Tente novamente em instantes.');
  }

  const textReply = await fallbackRes.text();
  const parsed = parseAiResponse(textReply);

  return {
    id: `ai_poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: 'narrator',
    content: parsed.cleanText,
    timestamp: Date.now(),
    suggestedActions: parsed.suggestedActions,
    requestedRoll: parsed.requestedRoll,
    handoutProposal: parsed.handoutProposal,
    monsterAttack: parsed.monsterAttack,
    monsterSpawns: parsed.monsterSpawns,
    mapMoves: parsed.mapMoves,
    defeatedMonsters: parsed.defeatedMonsters,
    monsterDamage: parsed.monsterDamage,
    lootReward: parsed.lootReward,
  };
}

/**
 * Chamada à API do Google Gemini com modelos oficiais e fallback resiliente
 */
async function callGeminiEngine(
  apiKey: string,
  preferredModelInput: string = DEFAULT_GEMINI_MODEL,
  systemInstruction: string,
  history: AiMessage[],
  userAction: string
): Promise<AiMessage> {
  const conversationTurns = history
    .filter(m => m.role === 'narrator' || m.role === 'player')
    .slice(-10)
    .map(m => ({
      role: m.role === 'narrator' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  conversationTurns.push({
    role: 'user',
    parts: [{ text: userAction }],
  });

  const preferredModel =
    preferredModelInput && !preferredModelInput.includes('2.5') && !preferredModelInput.includes('2.0')
      ? preferredModelInput
      : DEFAULT_GEMINI_MODEL;

  const candidateModels = Array.from(
    new Set([
      preferredModel,
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
    ])
  );

  let lastError: unknown = null;

  for (const modelToTry of candidateModels) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model: modelToTry,
        contents: conversationTurns,
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
        },
      });

      const rawReply = response.text || 'O Mestre contempla a situação em silêncio... (Nenhuma resposta gerada)';
      const parsed = parseAiResponse(rawReply);

      return {
        id: `ai_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'narrator',
        content: parsed.cleanText,
        timestamp: Date.now(),
        suggestedActions: parsed.suggestedActions,
        requestedRoll: parsed.requestedRoll,
        handoutProposal: parsed.handoutProposal,
        monsterAttack: parsed.monsterAttack,
        monsterSpawns: parsed.monsterSpawns,
        mapMoves: parsed.mapMoves,
        defeatedMonsters: parsed.defeatedMonsters,
        monsterDamage: parsed.monsterDamage,
        lootReward: parsed.lootReward,
      };
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Falha temporária com modelo ${modelToTry}: ${errorMsg}. Tentando modelo reserva...`);
      if (errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE')) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // Fallback REST com gemini-3.5-flash-lite
  try {
    return await callGeminiRestFallback(apiKey, 'gemini-3.5-flash-lite', systemInstruction, conversationTurns);
  } catch {
    const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
    if (rawMsg.includes('503') || rawMsg.includes('overload') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('demand')) {
      throw new Error('Os servidores de IA do Google estão com alta demanda temporária (Erro 503). Por favor, aguarde alguns segundos ou alterne para o Groq (Llama 3.3).');
    }
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
      throw new Error('Limite de mensagens da chave gratuita do Gemini atingido (Erro 429). Alterne para o Groq ou aguarde 30 segundos.');
    }
    if (rawMsg.includes('403') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid')) {
      throw new Error('Chave de API do Gemini inválida ou não autorizada. Verifique sua chave no Google AI Studio.');
    }
    throw new Error(`Falha ao conectar com o Mestre IA (Gemini): ${rawMsg}`);
  }
}

/**
 * Envia uma mensagem ou ação para o Mestre IA e retorna a resposta estruturada
 */
export async function sendToAiDungeonMaster(
  userAction: string,
  history: AiMessage[],
  character?: Character | null,
  config?: Partial<AiDmConfig>
): Promise<AiMessage> {
  const fullConfig: AiDmConfig = {
    ...getStoredAiConfig(),
    ...config,
  };

  const provider: AiProvider = fullConfig.provider || getStoredAiProvider();
  const groqKey = fullConfig.groqApiKey || getStoredGroqApiKey();
  const geminiKey = fullConfig.apiKey || getStoredApiKey();

  const campaignSummary = fullConfig.campaignSummary || getStoredCampaignSummary();
  const systemInstruction = buildSystemPrompt(
    fullConfig.includeCharacterStats ? character : null,
    fullConfig.tone,
    fullConfig.customInstructions,
    campaignSummary
  );

  // 1. Provedor GROQ (Llama 3.3 70B - Ultra Rápido)
  if (provider === 'groq') {
    if (!groqKey) {
      throw new Error('Chave de API do Groq não configurada. Por favor, adicione sua chave gratuita do console.groq.com nas configurações do Mestre IA.');
    }
    try {
      return await callGroqChat(groqKey, fullConfig.model || DEFAULT_GROQ_MODEL, systemInstruction, history, userAction);
    } catch (err: unknown) {
      console.warn('[Groq] Falha na chamada principal:', err);
      // Se houver chave Gemini como fallback secundário, tenta Gemini
      if (geminiKey) {
        console.info('[Groq Fallback] Acionando Google Gemini como reserva...');
        return await callGeminiEngine(geminiKey, DEFAULT_GEMINI_MODEL, systemInstruction, history, userAction);
      }
      throw err;
    }
  }

  // 2. Provedor MODO LIVRE (Pollinations - Sem Chave)
  if (provider === 'pollinations') {
    try {
      return await callPollinationsChat(systemInstruction, history, userAction);
    } catch (err: unknown) {
      console.warn('[Pollinations] Falha na chamada:', err);
      if (groqKey) {
        return await callGroqChat(groqKey, DEFAULT_GROQ_MODEL, systemInstruction, history, userAction);
      }
      if (geminiKey) {
        return await callGeminiEngine(geminiKey, DEFAULT_GEMINI_MODEL, systemInstruction, history, userAction);
      }
      throw new Error('Falha ao conectar com o serviço público do Modo Livre. Tente novamente em instantes.');
    }
  }

  // 3. Provedor GOOGLE GEMINI (Nativo)
  if (!geminiKey) {
    if (groqKey) {
      return await callGroqChat(groqKey, DEFAULT_GROQ_MODEL, systemInstruction, history, userAction);
    }
    throw new Error('Chave de API do Google Gemini não encontrada. Adicione sua chave nas configurações do Mestre IA ou use o Modo Livre.');
  }

  try {
    return await callGeminiEngine(geminiKey, fullConfig.model, systemInstruction, history, userAction);
  } catch (err: unknown) {
    if (groqKey) {
      console.info('[Gemini Fallback] Google indisponível, acionando Groq como backup transparente...');
      return await callGroqChat(groqKey, DEFAULT_GROQ_MODEL, systemInstruction, history, userAction);
    }
    throw err;
  }
}

/**
 * Fallback resiliente via REST caso necessário
 */
async function callGeminiRestFallback(
  apiKey: string,
  model: string,
  systemInstruction: string,
  turns: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<AiMessage> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: turns,
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'O Mestre não respondeu.';
  const parsed = parseAiResponse(rawReply);

  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    role: 'narrator',
    content: parsed.cleanText,
    timestamp: Date.now(),
    suggestedActions: parsed.suggestedActions,
    requestedRoll: parsed.requestedRoll,
    handoutProposal: parsed.handoutProposal,
    monsterAttack: parsed.monsterAttack,
    monsterSpawns: parsed.monsterSpawns,
    mapMoves: parsed.mapMoves,
    defeatedMonsters: parsed.defeatedMonsters,
    monsterDamage: parsed.monsterDamage,
    lootReward: parsed.lootReward,
  };
}

/**
 * Sintetiza o histórico recente e o resumo anterior em um resumo conciso e atualizado da campanha (Memória de Longo Prazo)
 */
export async function generateCampaignSummaryUpdate(
  recentHistory: AiMessage[],
  currentSummary = ''
): Promise<string> {
  const provider = getStoredAiProvider();
  const groqKey = getStoredGroqApiKey();
  const geminiKey = getStoredApiKey();

  const historyExcerpt = recentHistory
    .slice(-14)
    .map((m) => `${m.role === 'narrator' ? 'Mestre' : 'Jogador'}: ${m.content}`)
    .join('\n');

  const prompt = `Você é o Arquivista e Mestre de Crônicas de RPG D&D 5e.
Sua missão é resumir e consolidar os eventos mais importantes da história para servir de memória viva contínua aos próximos episódios da mesa.

RESUMO ANTERIOR:
${currentSummary || 'Início da aventura.'}

ACONTECIMENTOS RECENTES:
${historyExcerpt}

INSTRUÇÕES:
- Escreva um resumo conciso e imersivo em português do Brasil (máximo de 3 parágrafos objetivos).
- Destaque: locais explorados, inimigos e chefes enfrentados ou derrotados, itens e segredos descobertos, e o objetivo atual imediato do grupo.
- Responda APENAS com o texto do resumo atualizado, sem introduções, notas ou cumprimentos.`;

  // Tenta Groq se ativo ou configurado
  if (provider === 'groq' && groqKey) {
    try {
      const activeModel = getStoredGroqModel();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          saveStoredCampaignSummary(text);
          return text;
        }
      }
    } catch (err) {
      console.warn('[Summary] Falha ao resumir via Groq:', err);
    }
  }

  // Tenta Gemini se configurado
  if (geminiKey) {
    try {
      const aiConfig = getStoredAiConfig();
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: aiConfig.model || DEFAULT_GEMINI_MODEL,
        contents: prompt,
      });
      const updated = response.text?.trim();
      if (updated) {
        saveStoredCampaignSummary(updated);
        return updated;
      }
    } catch (err) {
      console.error('Erro ao gerar resumo da campanha via Gemini:', err);
    }
  }

  return currentSummary;
}

/**
 * Testa a validade de uma conexão com a IA (Groq, Pollinations ou Google Gemini)
 */
export async function testAiApiKey(
  provider: AiProvider,
  apiKey: string,
  model?: string
): Promise<{ success: boolean; message: string }> {
  // Provedor Groq
  if (provider === 'groq') {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'A chave da API Groq está vazia. Obtenha sua chave gratuita em console.groq.com/keys' };
    }
    try {
      // 1. Descobre modelos disponíveis para esta chave na Groq
      const activeModels = await fetchActiveGroqModels(apiKey);
      if (activeModels.length === 0) {
        const testAuth = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        if (testAuth.status === 401) {
          return { success: false, message: 'Chave de API do Groq inválida. Crie uma chave gratuita em console.groq.com/keys.' };
        }
      }

      // 2. Determina o melhor modelo ativo na conta do usuário
      const targetModel = activeModels.length > 0
        ? pickBestGroqModel(activeModels)
        : (model && !model.includes('llama-3.3-70b-versatile') ? model : getStoredGroqModel());

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Diga apenas: "ArcanaSheet conectado!".' }],
          max_completion_tokens: 25,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, message: 'Chave de API do Groq inválida. Crie uma chave gratuita em console.groq.com/keys.' };
        }
        if (res.status === 429) {
          return { success: false, message: 'Limite temporário da Groq atingido. Aguarde alguns segundos e tente novamente.' };
        }
        const txt = await res.text();
        return { success: false, message: `Erro ao testar Groq (${res.status}): ${txt}` };
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'OK';
      saveStoredGroqModel(targetModel);

      return { 
        success: true, 
        message: `⚡ Conectado ao Groq (${targetModel}) com sucesso! Velocidade ultrarrápida ativa. Resposta: "${reply.trim()}"` 
      };
    } catch (err: unknown) {
      return { success: false, message: `Falha de rede ao conectar com a Groq: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // Provedor Pollinations (Modo Livre - Sem Chave)
  if (provider === 'pollinations') {
    try {
      const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [{ role: 'user', content: 'Diga apenas: "ArcanaSheet conectado!".' }],
          max_tokens: 20,
        }),
      });
      if (res.ok) {
        return { 
          success: true, 
          message: '🌸 Modo Livre (Pollinations) conectado com sucesso! 100% gratuito e sem necessidade de chave de API.' 
        };
      }
      // Teste fallback
      const ping = await fetch('https://text.pollinations.ai/ping');
      if (ping.ok) {
        return { success: true, message: '🌸 Modo Livre (Pollinations) disponível e pronto para uso!' };
      }
      return { success: false, message: 'Serviço público do Modo Livre temporariamente instável. Tente novamente em instantes.' };
    } catch (err: unknown) {
      return { success: false, message: `Falha ao testar Modo Livre: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // Provedor Google Gemini
  return testGeminiApiKey(apiKey, model);
}

/**
 * Testa a validade de uma chave de API do Gemini (Retrocompatibilidade)
 */
export async function testGeminiApiKey(apiKey: string, model: string = DEFAULT_GEMINI_MODEL): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'A chave da API está vazia.' };
  }

  const safeModel =
    model && !model.includes('2.5') && !model.includes('2.0') && !model.includes('1.5') ? model : DEFAULT_GEMINI_MODEL;
  const testModels = Array.from(
    new Set([safeModel, 'gemini-3.5-flash-lite', 'gemini-3.6-flash'])
  );
  let lastErrMsg = '';

  for (const modelToTest of testModels) {
    try {
      const client = new GoogleGenAI({ apiKey: apiKey.trim() });
      const res = await client.models.generateContent({
        model: modelToTest,
        contents: 'Diga apenas: "ArcanaSheet conectado!".',
      });

      if (res.text) {
        return { success: true, message: `✨ Conexão com Google Gemini (${modelToTest}) estabelecida com sucesso!` };
      }
    } catch (err: unknown) {
      lastErrMsg = err instanceof Error ? err.message : String(err);
      if (lastErrMsg.includes('API_KEY_INVALID') || lastErrMsg.includes('API key not valid')) {
        return { success: false, message: 'Chave de API inválida. Verifique sua chave no Google AI Studio e tente novamente.' };
      }
      continue;
    }
  }

  if (lastErrMsg.includes('503') || lastErrMsg.includes('overload') || lastErrMsg.includes('UNAVAILABLE')) {
    return { success: false, message: 'Chave aceita, porém os servidores do Google estão temporariamente com alta demanda (Erro 503). Recomendamos selecionar a opção "Groq" no menu de IA.' };
  }
  return { success: false, message: `Erro ao testar chave: ${lastErrMsg}` };
}

/**
 * Ferramenta do Oráculo do Mestre (Co-DM) para gerar ideias de jogo instantâneas
 */
export async function generateOracleIdea(
  action: AiOracleAction,
  contextNote?: string,
  tone: AdventureTone = 'heroic'
): Promise<string> {
  const provider = getStoredAiProvider();
  const groqKey = getStoredGroqApiKey();
  const geminiKey = getStoredApiKey();

  const prompts: Record<AiOracleAction, string> = {
    twist: `Gere uma reviravolta dramática e surpreendente (Plot Twist / Complicação) para uma sessão de D&D 5e no estilo ${tone}. Pode ser uma mudança repentina no ambiente, uma traição inesperada, o surgimento de um terceiro inimigo ou um efeito mágico descontrolado. Seja criativo, direto e empolgante em 2 parágrafos.`,
    npc: `Crie um NPC marcante e tridimensional para D&D 5e no estilo ${tone}. Formate com:
- Nome & Raça/Classe
- Aparência marcante & Maneirismo/Voz
- Motivação Imediata
- Um Segredo Oculto que ele não revela facilmente
- Como ele pode ajudar ou atrapalhar os heróis`,
    puzzle: `Crie um quebra-cabeça ou enigma de masmorra instigante para D&D 5e. Formate com:
- A Cena / O Que os Jogadores Veem
- As Pistas Visuais ou Sonoras
- A Solução Inteligente (que valorize trabalho em equipe e lógica)
- A Consequência de uma Falha (armadilha ou complicação leve)`,
    handout: `Redija um documento narrativo autêntico de fantasia (como uma carta misteriosa, página rasgada de diário, ordem de execução ou contrato de recompensa) para D&D 5e.
Use formatação elegante e dê um título claro. Termine com um gancho intrigante.`,
    tavern_rumor: `Gere 3 rumores distintos que os aventureiros podem ouvir sussurrados em uma taverna:
1. Um boato 100% verdadeiro (sobre um perigo ou tesouro real)
2. Um boato exagerado (com uma parcela de verdade e muito exagero)
3. Um boato falso ou armadilha proposital de um vilão`,
    trap: `Crie uma armadilha mortal ou engenhosa para D&D 5e. Formate com:
- Nome da Armadilha
- Como ela se camufla no ambiente
- Gatilho de Ativação
- Efeito & Teste de Resistência (CD e Dano)
- Como detectá-la e desarmá-la com perícias (Investigação/Ladinagem)`
  };

  const finalPrompt = `
${prompts[action]}
${contextNote ? `\nCONTEXTO ESPECÍFICO DO MESTRE:\n${contextNote}` : ''}
Responda diretamente em português do Brasil com excelente diagramação em markdown.
  `.trim();

  // 1. Tenta Groq se ativo ou com chave
  if ((provider === 'groq' || !geminiKey) && groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: getStoredGroqModel(),
          messages: [{ role: 'user', content: finalPrompt }],
          temperature: 0.85,
          max_tokens: 1000,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn('[Oráculo Groq] Erro:', err);
    }
  }

  // 2. Tenta Pollinations se Modo Livre
  if (provider === 'pollinations') {
    try {
      const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [{ role: 'user', content: finalPrompt }],
          temperature: 0.85,
          max_tokens: 1000,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn('[Oráculo Pollinations] Erro:', err);
    }
  }

  // 3. Tenta Google Gemini
  if (geminiKey) {
    const oracleModels = [DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
    for (const m of oracleModels) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey });
        const response = await client.models.generateContent({
          model: m,
          contents: finalPrompt,
        });
        if (response.text) return response.text;
      } catch {
        continue;
      }
    }
  }

  throw new Error('Não foi possível consultar o Oráculo. Verifique sua conexão e chave de API do provedor selecionado.');
}
