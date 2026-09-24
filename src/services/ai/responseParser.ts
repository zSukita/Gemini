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
