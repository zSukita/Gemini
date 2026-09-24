import { GoogleGenAI } from '@google/genai';
import { type Character } from '../types/dnd5e';
import type { 
  AiDmConfig, 
  AiMessage, 
  AiOracleAction, 
  AdventureTone,
  AiProvider
} from '../types/aiDm';

export * from './ai/aiConfigStorage';
export * from './ai/promptBuilder';
export * from './ai/responseParser';

import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  getStoredGroqModel,
  saveStoredGroqModel,
  fetchActiveGroqModels,
  pickBestGroqModel,
  getStoredApiKey,
  getStoredGroqApiKey,
  getStoredAiProvider,
  getStoredAiConfig,
  getStoredCampaignSummary,
  saveStoredCampaignSummary,
} from './ai/aiConfigStorage';
import { buildSystemPrompt } from './ai/promptBuilder';
import { parseAiResponse } from './ai/responseParser';


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
