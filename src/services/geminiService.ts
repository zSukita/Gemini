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
  MapMoveAction
} from '../types/aiDm';

const API_KEY_STORAGE_KEY = 'arcanasheet_gemini_api_key';
const CONFIG_STORAGE_KEY = 'arcanasheet_ai_dm_config';
const CHAT_HISTORY_STORAGE_KEY = 'arcanasheet_ai_dm_history';

export const DEFAULT_MODEL = 'gemini-3.6-flash';

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
        // Migra automaticamente modelos descontinuados pelo Google (ex: 2.5, 2.0, 1.5, 1.0)
        const isDeprecated =
          !parsed.model ||
          parsed.model.includes('2.5') ||
          parsed.model.includes('2.0') ||
          parsed.model.includes('1.5') ||
          parsed.model.includes('1.0');
        const model = isDeprecated ? DEFAULT_MODEL : parsed.model;

        if (isDeprecated && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...parsed, model: DEFAULT_MODEL }));
          } catch {
            // ignore
          }
        }

        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          model,
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

  // Lista de modelos resilientes em cascata para garantir alta disponibilidade mesmo em contas gratuitas
  const preferredModel =
    fullConfig.model && !fullConfig.model.includes('2.5') && !fullConfig.model.includes('2.0')
      ? fullConfig.model
      : DEFAULT_MODEL;

  const candidateModels = Array.from(
    new Set([
      preferredModel,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ])
  );

  let lastError: unknown = null;

  // Tenta cada modelo em ordem se houver sobrecarga temporária do Google (503 / 429)
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
      };
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Falha temporária com modelo ${modelToTry}: ${errorMsg}. Tentando modelo reserva...`);
    }
  }

  // Se todos os modelos pelo SDK falharem, tenta fallback REST com gemini-3.5-flash-lite
  try {
    return await callGeminiRestFallback(apiKey, 'gemini-3.5-flash-lite', systemInstruction, conversationTurns);
  } catch {
    // Tratamento amigável e legível para o usuário em caso de erro nos servidores do Google
    const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
    if (rawMsg.includes('503') || rawMsg.includes('overload') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('demand')) {
      throw new Error('Os servidores de IA do Google estão com alta demanda temporária (Erro 503). Por favor, aguarde alguns segundos e envie novamente sua ação.');
    }
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota')) {
      throw new Error('Limite de mensagens por minuto da chave gratuita atingido (Erro 429). Por favor, aguarde 30 segundos.');
    }
    if (rawMsg.includes('403') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid')) {
      throw new Error('Chave de API do Gemini inválida ou não autorizada. Verifique sua chave nas configurações do Mestre IA.');
    }
    throw new Error(`Falha ao conectar com o Mestre IA: ${rawMsg}`);
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
  };
}

/**
 * Testa a validade de uma chave de API do Gemini
 */
export async function testGeminiApiKey(apiKey: string, model: string = DEFAULT_MODEL): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'A chave da API está vazia.' };
  }

  const safeModel =
    model && !model.includes('2.5') && !model.includes('2.0') ? model : DEFAULT_MODEL;
  const testModels = Array.from(
    new Set([safeModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'])
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
        return { success: true, message: `Conexão estabelecida com sucesso! (${modelToTest})` };
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
    return { success: false, message: 'Chave aceita, porém os servidores do Google estão temporariamente com alta demanda (Erro 503). Tente novamente em instantes.' };
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

  const oracleModels = [DEFAULT_MODEL, 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  let lastErr: unknown = null;

  for (const m of oracleModels) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model: m,
        contents: finalPrompt,
      });
      if (response.text) return response.text;
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw new Error(`Erro ao consultar o Oráculo: ${lastErr instanceof Error ? lastErr.message : 'Serviço temporariamente indisponível'}`);
}
