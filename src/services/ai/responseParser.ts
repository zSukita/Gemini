import type {
  RequestedRoll,
  HandoutProposal,
  MonsterAttackAction,
  MonsterSpawnAction,
  MapMoveAction,
  AiLootReward,
  AiLootItem
} from '../../types/aiDm';

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
      .map((line) =>
        line
          .replace(/^(?:\d\uFE0F?\u20E3|\p{Extended_Pictographic}|[0-9\s\-*•.()[\]])+/gu, '')
          .replace(/^[\s*_~`[\]]+/, '')
          .replace(/[\s*_~`[\]]+$/, '')
          .trim()
      )
      .filter((line) => line.length > 0)
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
  }
  cleanText = cleanText.replace(/\[ATAQUE_MONSTRO:\s*([^\]]+)\]/gi, '').trim();

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
        /\b\d+\s*(?:po|gp|pp|sp|pc|cp|pe|ep|pl|pt)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i.test(chunk) ||
        /\b\d+\s*(?:peças?|moedas?)\s+de\s+(?:ouro|prata|cobre|electro|platina)\b/i.test(chunk)
      );
    };

    const parseCoinStr = (str: string) => {
      const gpMatch = str.match(/(\d+)\s*(?:po|gp|\bpeças?\s+de\s+ouro|\bmoedas?\s+de\s+ouro)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
      if (gpMatch) coins.gp = (coins.gp || 0) + parseInt(gpMatch[1], 10);

      const spMatch = str.match(/(\d+)\s*(?:sp|\bpeças?\s+de\s+prata|\bmoedas?\s+de\s+prata)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
      if (spMatch) coins.sp = (coins.sp || 0) + parseInt(spMatch[1], 10);

      const ppMatch = str.match(/(\d+)\s*(?:pp)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
      if (ppMatch && !spMatch) {
        coins.pp = (coins.pp || 0) + parseInt(ppMatch[1], 10);
      }

      const cpMatch = str.match(/(\d+)\s*(?:pc|cp|\bpeças?\s+de\s+cobre|\bmoedas?\s+de\s+cobre)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
      if (cpMatch) coins.cp = (coins.cp || 0) + parseInt(cpMatch[1], 10);

      const epMatch = str.match(/(\d+)\s*(?:pe|ep|\bpeças?\s+de\s+electro|\bmoedas?\s+de\s+electro)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
      if (epMatch) coins.ep = (coins.ep || 0) + parseInt(epMatch[1], 10);

      const plMatch = str.match(/(\d+)\s*(?:pl|pt|\bpeças?\s+de\s+platina|\bmoedas?\s+de\s+platina)(?![a-záàâãéêíóôõúçA-ZÀ-ÚÇ])/i);
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

    parts.forEach((part) => {
      parseItemStr(part);
    });

    lootReward = {
      coins: Object.keys(coins).length > 0 ? coins : undefined,
      items: items.length > 0 ? items : undefined,
      rawText: rawLoot,
    };
    cleanText = cleanText.replace(lootRegex, '').trim();
  }

  return {
    cleanText: cleanText
      .replace(/\[(?:ATAQUE_MONSTRO|SPAWN_MONSTRO|MOVER|DERROTAR_MONSTRO|DANO_MONSTRO|LOOT|HANDOUT|TESTE):\s*[^\]]+\]/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
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

export interface AiValidationContext {
  existingCombatants?: Array<{ name: string; type: string; id: string }>;
  existingTokens?: Array<{ name: string; id: string }>;
  combatIsRunning?: boolean;
  knownCombatantNames?: string[];
  maxMonsterSpawnCount?: number;
  maxMapMoveDistance?: number;
}

/**
 * Valida rigorosamente todos os dados de ações mecânicas vindos da IA.
 * Rejeita valores arbitrários, bônus desmedidos, fórmulas inválidas e duplicatas.
 */
export function validateAiProposedActions(
  parsed: ReturnType<typeof parseAiResponse>,
  context?: AiValidationContext
): ReturnType<typeof parseAiResponse> {
  const cleanText = (parsed.cleanText || '').slice(0, 8000).trim();

  const suggestedActions = parsed.suggestedActions
    ?.map((a) => a.slice(0, 100).trim())
    .filter((a) => a.length > 0)
    .slice(0, 3);

  let requestedRoll: RequestedRoll | undefined = undefined;
  if (parsed.requestedRoll?.skillOrAbility) {
    const skillOrAbility = parsed.requestedRoll.skillOrAbility.slice(0, 50).trim();
    const dc =
      typeof parsed.requestedRoll.dc === 'number' && Number.isFinite(parsed.requestedRoll.dc)
        ? Math.max(1, Math.min(35, Math.floor(parsed.requestedRoll.dc)))
        : undefined;
    const reason = (parsed.requestedRoll.reason || 'Para superar o desafio').slice(0, 120).trim();
    if (skillOrAbility) {
      requestedRoll = { skillOrAbility, dc, reason };
    }
  }

  let monsterSpawns: MonsterSpawnAction[] | undefined = undefined;
  if (parsed.monsterSpawns && parsed.monsterSpawns.length > 0) {
    const validSpawns: MonsterSpawnAction[] = [];
    const currentMonsters =
      context?.existingCombatants?.filter((c) => c.type === 'monster' || c.type === 'npc') || [];
    const maxCount = context?.maxMonsterSpawnCount ?? 10;

    for (const spawn of parsed.monsterSpawns) {
      const monsterName = (spawn.monsterName || '').slice(0, 50).trim();
      if (!monsterName) continue;
      const count = Math.max(1, Math.min(maxCount, Math.floor(spawn.count || 1)));

      if (context?.combatIsRunning) {
        const rawWanted = monsterName
          .toLowerCase()
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*\d+$/, '')
          .trim();
        const alreadyInCombat = currentMonsters.some((c) => {
          const cName = c.name
            .toLowerCase()
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/\s*\d+$/, '')
            .trim();
          return cName === rawWanted || cName.includes(rawWanted) || rawWanted.includes(cName);
        });
        if (alreadyInCombat) continue;
      }
      validSpawns.push({ monsterName, count });
    }
    if (validSpawns.length > 0) {
      monsterSpawns = validSpawns.slice(0, 5);
    }
  }

  let mapMoves: MapMoveAction[] | undefined = undefined;
  if (parsed.mapMoves && parsed.mapMoves.length > 0) {
    const validMoves: MapMoveAction[] = [];
    const maxDist = context?.maxMapMoveDistance ?? 12;
    for (const move of parsed.mapMoves) {
      const tokenName = (move.tokenName || '').slice(0, 50).trim();
      const actionOrTarget = (move.actionOrTarget || 'avança').slice(0, 100).trim();
      const distanceSquares =
        typeof move.distanceSquares === 'number' && Number.isFinite(move.distanceSquares)
          ? Math.max(0, Math.min(maxDist, Math.floor(move.distanceSquares)))
          : 4;
      if (tokenName) {
        validMoves.push({ tokenName, actionOrTarget, distanceSquares });
      }
    }
    if (validMoves.length > 0) {
      mapMoves = validMoves.slice(0, 5);
    }
  }

  let monsterAttack: MonsterAttackAction | undefined = undefined;
  if (parsed.monsterAttack?.monsterName && parsed.monsterAttack?.attackName) {
    const monsterName = parsed.monsterAttack.monsterName.slice(0, 50).trim();
    const attackName = parsed.monsterAttack.attackName.slice(0, 50).trim();
    const attackBonus = Math.max(
      -10,
      Math.min(30, Math.floor(parsed.monsterAttack.attackBonus || 0))
    );
    const rawFormula = (parsed.monsterAttack.damageFormula || '').trim();
    if (/^\d+d\d+(\s*[+-]\s*\d+)?$/i.test(rawFormula)) {
      const target = parsed.monsterAttack.target
        ? parsed.monsterAttack.target.slice(0, 50).trim()
        : undefined;
      monsterAttack = {
        monsterName,
        attackName,
        attackBonus,
        damageFormula: rawFormula,
        target,
        description: parsed.monsterAttack.description
          ? parsed.monsterAttack.description.slice(0, 150).trim()
          : undefined,
      };
    }
  }

  let lootReward: AiLootReward | undefined = undefined;
  if (parsed.lootReward) {
    const coins: NonNullable<AiLootReward['coins']> = {};
    if (parsed.lootReward.coins) {
      const { cp, sp, ep, gp, pp } = parsed.lootReward.coins;
      if (typeof cp === 'number' && cp > 0) coins.cp = Math.min(100000, Math.floor(cp));
      if (typeof sp === 'number' && sp > 0) coins.sp = Math.min(100000, Math.floor(sp));
      if (typeof ep === 'number' && ep > 0) coins.ep = Math.min(100000, Math.floor(ep));
      if (typeof gp === 'number' && gp > 0) coins.gp = Math.min(100000, Math.floor(gp));
      if (typeof pp === 'number' && pp > 0) coins.pp = Math.min(100000, Math.floor(pp));
    }
    const items: AiLootItem[] = [];
    if (Array.isArray(parsed.lootReward.items)) {
      for (const it of parsed.lootReward.items.slice(0, 10)) {
        const name = (it.name || '').slice(0, 80).trim();
        const quantity = Math.max(1, Math.min(100, Math.floor(it.quantity || 1)));
        if (name) items.push({ name, quantity });
      }
    }
    if (Object.keys(coins).length > 0 || items.length > 0) {
      lootReward = {
        coins: Object.keys(coins).length > 0 ? coins : undefined,
        items: items.length > 0 ? items : undefined,
        rawText: parsed.lootReward.rawText?.slice(0, 200),
      };
    }
  }

  let handoutProposal: HandoutProposal | undefined = undefined;
  if (parsed.handoutProposal?.title && parsed.handoutProposal?.content) {
    handoutProposal = {
      title: parsed.handoutProposal.title.slice(0, 80).trim(),
      authorOrOrigin: parsed.handoutProposal.authorOrOrigin?.slice(0, 60).trim(),
      content: parsed.handoutProposal.content.slice(0, 2000).trim(),
    };
  }

  return {
    cleanText,
    suggestedActions: suggestedActions && suggestedActions.length > 0 ? suggestedActions : undefined,
    requestedRoll,
    handoutProposal,
    monsterAttack,
    monsterSpawns,
    mapMoves,
    defeatedMonsters: parsed.defeatedMonsters?.map((m) => m.slice(0, 50).trim()).filter(Boolean),
    monsterDamage: parsed.monsterDamage
      ?.map((d) => ({
        monsterName: d.monsterName.slice(0, 50).trim(),
        damage: Math.max(0, Math.min(500, Math.floor(d.damage))),
      }))
      .filter((d) => d.monsterName && d.damage > 0),
    lootReward,
  };
}
