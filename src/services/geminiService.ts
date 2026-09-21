import { GoogleGenAI } from '@google/genai';
import type { Character } from '../types/dnd5e';
import type { 
  AiDmConfig, 
  AiMessage, 
  AiOracleAction, 
  AdventureTone,
  RequestedRoll,
  HandoutProposal
} from '../types/aiDm';

const API_KEY_STORAGE_KEY = 'arcanasheet_gemini_api_key';
const CONFIG_STORAGE_KEY = 'arcanasheet_ai_dm_config';
const CHAT_HISTORY_STORAGE_KEY = 'arcanasheet_ai_dm_history';

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const DEFAULT_AI_CONFIG: AiDmConfig = {
  apiKey: '',
  model: DEFAULT_MODEL,
  tone: 'heroic',
  customInstructions: '',
  includeCharacterStats: true,
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

export function getStoredAiConfig(): AiDmConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          apiKey: getStoredApiKey(),
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    ...DEFAULT_AI_CONFIG,
    apiKey: getStoredApiKey(),
  };
}

export function saveStoredAiConfig(config: AiDmConfig): void {
  try {
    const { apiKey, ...rest } = config;
    if (apiKey !== undefined) {
      saveStoredApiKey(apiKey);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(rest));
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
export function buildSystemPrompt(character?: Character | null, tone: AdventureTone = 'heroic', customInstructions?: string): string {
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
      .map(([name, s]) => `${name}${s.proficiency === 'expertise' ? ' (Especialista)' : ''}`)
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

DIRETRIZES FUNDAMENTAIS:
1. Idioma: Português do Brasil impecável, com vocabulário rico de fantasia medieval, descrições sensoriais (sons de passos ecoando, cheiro de ozônio e cinzas, o brilho da tocha nas pedras úmidas).
2. ${toneGuidelines[tone]}
3. Conhecimento de Regras D&D 5e: Você conhece todas as regras de atributos, CDs (Classe de Dificuldade: Fácil 10, Médio 15, Difícil 20), salvaguardas e condições.
4. Respeite as ações do jogador: Nunca jogue pelo jogador nem decida os pensamentos dele. Descreva o ambiente, os NPCs, as reações do mundo e pergunte: "O que você faz?".
5. Mantenha os turnos concisos e impactantes (entre 2 e 4 parágrafos bem escritos). Evite respostas excessivamente longas que cansem o leitor.

${charContext}

${customInstructions ? `INSTRUÇÕES ADICIONAIS DO USUÁRIO:\n${customInstructions}\n` : ''}

REGRAS DE FORMATAÇÃO ESPECIAL (MUITO IMPORTANTE):
- Para sugerir ações rápidas ao final do seu turno, inclua sempre exatamente 3 opções no formato:
  [AÇÕES]
  - Opção 1
  - Opção 2
  - Opção 3
  [/AÇÕES]
- Se a situação exigir um teste de dado do jogador, inclua uma tag no formato:
  [TESTE: Nome da Perícia ou Atributo | CD Número | Motivo sucinto]
  Exemplo: [TESTE: Percepção (Sabedoria) | CD 13 | Para ouvir o que sussurram atrás da porta pesada]
  Exemplo: [TESTE: Atletismo (Força) | CD 15 | Para forçar as grades de ferro enferrujadas]
- Se o personagem encontrar um pergaminho, carta, diário ou bilhete com texto legível, você pode emitir um Handout no formato:
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
} {
  let cleanText = rawText;
  let suggestedActions: string[] | undefined;
  let requestedRoll: RequestedRoll | undefined;
  let handoutProposal: HandoutProposal | undefined;

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

  // 2. Extrair [TESTE: Perícia | CD XX | Motivo]
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

  return {
    cleanText: cleanText.replace(/\n{3,}/g, '\n\n').trim(),
    suggestedActions,
    requestedRoll,
    handoutProposal,
  };
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
  const fullConfig = { ...getStoredAiConfig(), ...config };
  const apiKey = fullConfig.apiKey;

  if (!apiKey) {
    throw new Error('Chave de API do Google Gemini não encontrada. Por favor, adicione sua chave nas configurações do Mestre IA.');
  }

  const systemInstruction = buildSystemPrompt(
    fullConfig.includeCharacterStats ? character : null,
    fullConfig.tone,
    fullConfig.customInstructions
  );

  // Formatar histórico para o formato do Gemini
  const conversationTurns = history
    .filter(m => m.role === 'narrator' || m.role === 'player')
    .slice(-10) // manter os últimos 10 turnos para agilidade e economia de tokens
    .map(m => ({
      role: m.role === 'narrator' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Adicionar o turno atual do jogador
  conversationTurns.push({
    role: 'user',
    parts: [{ text: userAction }],
  });

  try {
    const client = new GoogleGenAI({ apiKey });
    
    // Chamada usando o SDK oficial do Google GenAI
    const response = await client.models.generateContent({
      model: fullConfig.model || DEFAULT_MODEL,
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
      id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'narrator',
      content: parsed.cleanText,
      timestamp: Date.now(),
      suggestedActions: parsed.suggestedActions,
      requestedRoll: parsed.requestedRoll,
      handoutProposal: parsed.handoutProposal,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Erro na chamada ao Gemini SDK:', errorMsg);

    // Tentativa de fallback direto via REST caso o SDK encontre bloqueios de ambiente
    try {
      return await callGeminiRestFallback(apiKey, fullConfig.model || DEFAULT_MODEL, systemInstruction, conversationTurns);
    } catch (fallbackErr) {
      throw new Error(`Falha ao conectar com o Mestre IA: ${errorMsg}`);
    }
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
  };
}

/**
 * Testa a validade de uma chave de API do Gemini
 */
export async function testGeminiApiKey(apiKey: string, model: string = DEFAULT_MODEL): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'A chave da API está vazia.' };
  }

  try {
    const client = new GoogleGenAI({ apiKey: apiKey.trim() });
    const res = await client.models.generateContent({
      model: model || DEFAULT_MODEL,
      contents: 'Diga apenas: "ArcanaSheet conectado!".',
    });

    if (res.text) {
      return { success: true, message: `Conexão estabelecida com sucesso! (${model})` };
    }
    return { success: false, message: 'Nenhuma resposta recebida do modelo.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao testar chave: ${msg}` };
  }
}

/**
 * Ferramenta do Oráculo do Mestre (Co-DM) para gerar ideias de jogo instantâneas
 */
export async function generateOracleIdea(
  action: AiOracleAction,
  contextNote?: string,
  tone: AdventureTone = 'heroic'
): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Chave de API do Gemini necessária para consultar o Oráculo.');
  }

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

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
    contents: finalPrompt,
  });

  return response.text || 'O oráculo silenciou sem resposta.';
}
