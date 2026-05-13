function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function roundToBidStep(value) {
  return Math.max(50, Math.round(value / 50) * 50);
}

function pickOne(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function getCategoryAffinity(npc, item, hotCategory) {
  let affinity = 1;

  if (npc.favoriteCategories?.includes(item.category)) {
    affinity *= npc.favoriteBoost;
  }

  if (npc.avoidCategories?.includes(item.category)) {
    affinity *= npc.avoidPenalty;
  }

  if (item.category === hotCategory) {
    affinity *= npc.hotCategoryBoost ?? 1.08;
  }

  return affinity;
}

function getRarityExcitement(npc, item) {
  if (npc.id !== 'rookie') {
    return 1;
  }

  if (item.rarity === 'rare') {
    return 1.08;
  }

  if (item.rarity === 'epic') {
    return 1.16;
  }

  return 1;
}

function createAuctionNpcs(item, hotCategory, marketEvent = null) {
  const eventAggression = marketEvent?.npcAggression ?? 1;
  return AUCTION_NPCS.map((npc) => {
    const estimateNoise = randomBetween(1 - npc.errorRate, 1 + npc.errorRate);
    const aggression = randomBetween(npc.aggressionMin, npc.aggressionMax);
    const categoryAffinity = getCategoryAffinity(npc, item, hotCategory);
    const rarityExcitement = getRarityExcitement(npc, item);
    const maxBid = roundToBidStep(item.realValue * estimateNoise * aggression * categoryAffinity * rarityExcitement * eventAggression);

    return {
      ...npc,
      maxBid,
      active: true,
      bidsPlaced: 0,
      hasBluffed: false,
      mood: pickOne(npc.moods),
    };
  });
}

function getNextBidIncrement(currentPrice) {
  if (currentPrice >= 1200) {
    return 200;
  }

  if (currentPrice >= 600) {
    return 100;
  }

  return 50;
}

function getRookieDecision(npc, currentPrice, context) {
  const baseIncrement = getNextBidIncrement(currentPrice);
  const isTempted = context.item.rarity === 'rare' || context.item.rarity === 'epic' || currentPrice < npc.maxBid * 0.55;
  const jumpIncrement = isTempted && Math.random() < npc.jumpBidChance
    ? baseIncrement * 2
    : baseIncrement;
  const nextPrice = currentPrice + jumpIncrement;
  const panicCeiling = npc.maxBid + (Math.random() < npc.overbidChance ? baseIncrement : 0);

  if (nextPrice > panicCeiling) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: pickOne([
        '突然冷静下来，心理价到顶，选择放弃',
        '手心冒汗，还是不敢再追',
        '算了算钱包，决定先撤',
      ]),
    };
  }

  npc.bidsPlaced += 1;
  return {
    shouldBid: true,
    increment: jumpIncrement,
    nextPrice,
    reason: jumpIncrement > baseIncrement ? '被翻身机会勾住，直接跳价' : '跟着感觉加价',
  };
}

function getDealerDecision(npc, currentPrice, context) {
  const increment = getNextBidIncrement(currentPrice);
  const nextPrice = currentPrice + increment;
  const targetMargin = context.item.category === context.hotCategory ? 0.9 : 0.72;
  const resaleCeiling = roundToBidStep(context.item.realValue * targetMargin);
  const hardCeiling = Math.min(npc.maxBid, resaleCeiling);

  if (nextPrice > hardCeiling) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: pickOne([
        '利润不够，冷静撤退',
        '转卖空间太薄，不跟了',
        '账算完了，再追就没意思',
      ]),
    };
  }

  npc.bidsPlaced += 1;
  return {
    shouldBid: true,
    increment,
    nextPrice,
    reason: '只在有利润时稳稳跟价',
  };
}

function getShillDecision(npc, currentPrice, context) {
  const baseIncrement = getNextBidIncrement(currentPrice);
  const pressureLine = npc.maxBid * npc.pressureRatio;

  if (currentPrice >= pressureLine && npc.bidsPlaced >= npc.minBluffBids) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: pickOne([
        '抬得差不多了，忽然装作没兴趣',
        '看你还在场，笑了笑就收手',
        '价格被顶起来后，马上安静下来',
      ]),
    };
  }

  const increment = currentPrice < npc.maxBid * 0.5 && Math.random() < npc.jumpBidChance
    ? baseIncrement * 2
    : baseIncrement;
  const nextPrice = currentPrice + increment;

  if (nextPrice > npc.maxBid) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: '再抬可能砸自己手里，马上撤',
    };
  }

  npc.bidsPlaced += 1;
  npc.hasBluffed = true;
  return {
    shouldBid: true,
    increment,
    nextPrice,
    reason: increment > baseIncrement ? '故意跳价带节奏' : '慢慢推高价格',
  };
}

function getNpcBidDecision(npc, currentPrice, context = {}) {
  if (!npc.active) {
    return {
      shouldBid: false,
      reason: '已经退出竞价',
    };
  }

  if (context.leader === npc.name) {
    return {
      shouldBid: false,
      reason: '暂时领先，按兵不动',
    };
  }

  if (npc.id === 'rookie') {
    return getRookieDecision(npc, currentPrice, context);
  }

  if (npc.id === 'dealer') {
    return getDealerDecision(npc, currentPrice, context);
  }

  if (npc.id === 'shill') {
    return getShillDecision(npc, currentPrice, context);
  }

  const increment = getNextBidIncrement(currentPrice);
  const nextPrice = currentPrice + increment;

  if (nextPrice > npc.maxBid) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: '心理价到顶，选择放弃',
    };
  }

  npc.bidsPlaced += 1;
  return {
    shouldBid: true,
    increment,
    nextPrice,
    reason: `愿意追到 ${formatCurrency(nextPrice)}`,
  };
}
