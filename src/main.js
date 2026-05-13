const STORAGE_KEY = 'kelly-king-save-v5';
const MAX_LOG_ENTRIES = 80;

const BALANCE_CONFIG = {
  startingCash: 1200,
  targetCash: 6500,
  inventoryLimit: 4,
  hotSaleMultiplier: { min: 1.12, max: 1.34 },
  normalSaleMultiplier: { min: 0.88, max: 1.1 },
  dayValueRanges: [
    { maxDay: 2, minValue: 0, maxValue: 1000 },
    { maxDay: 5, minValue: 300, maxValue: 1800 },
    { maxDay: 7, minValue: 650, maxValue: Infinity },
  ],
};

const MARKET_EVENTS = [
  {
    id: 'inspectors-nearby',
    name: '查货风声紧',
    summary: '今天档口出货谨慎，快速变现会被压一点价，但抬价托也不敢太疯。',
    saleMultiplier: 0.94,
    npcAggression: 0.94,
  },
  {
    id: 'cash-buyers',
    name: '现金客进场',
    summary: '场里来了几个现金客，好货更容易被抢，库存报价也更漂亮。',
    saleMultiplier: 1.08,
    npcAggression: 1.08,
  },
  {
    id: 'rainy-market',
    name: '雨天冷场',
    summary: '人少，开价没那么凶；但买家也少，转手价略保守。',
    saleMultiplier: 0.98,
    npcAggression: 0.88,
  },
  {
    id: 'rumor-spread',
    name: '捡漏传闻散开',
    summary: '有人说昨天出了大漏，所有人都更上头，别被气氛带走。',
    saleMultiplier: 1,
    npcAggression: 1.16,
  },
  {
    id: 'broker-rounds',
    name: '中间人收货',
    summary: '有中间人在场里游走收货，卖出报价更高，但热门货也更难低价拿。',
    saleMultiplier: 1.12,
    npcAggression: 1.04,
  },
];

const INITIAL_GAME_STATE = {
  phase: 6,
  step: '6.1',
  stepIndex: 1,
  phaseStepTotal: 1,
  stepName: '流程驱动界面重构',
  day: 1,
  totalDays: 7,
  lotsPerDay: 5,
  lotsSeenToday: 0,
  targetCash: BALANCE_CONFIG.targetCash,
  cash: BALANCE_CONFIG.startingCash,
  inventory: [],
  inventoryLimit: BALANCE_CONFIG.inventoryLimit,
  hotCategory: '华强北电子货',
  lastHotCategory: null,
  marketEvent: null,
  lastMarketEventId: null,
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
  npcs: [],
  seenItemIds: [],
  hasPassed: false,
  auctionEnded: false,
  settlementDone: false,
  pendingSettlement: null,
  gameOver: false,
  saveStatus: '尚未保存',
  logs: ['第一件货已经上台。看估值和风险，决定要不要加价。'],
};

function createInitialGameState() {
  return {
    ...INITIAL_GAME_STATE,
    inventory: [],
    npcs: [],
    seenItemIds: [],
    marketEvent: null,
    logs: [...INITIAL_GAME_STATE.logs],
  };
}

const gameState = createInitialGameState();

function formatCurrency(value) {
  return `￥${Number(value).toLocaleString('zh-CN')}`;
}

function pickOne(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function getDayValueRange(day) {
  return BALANCE_CONFIG.dayValueRanges.find((range) => day <= range.maxDay) ?? BALANCE_CONFIG.dayValueRanges.at(-1);
}

function filterItemsForCurrentDay(items) {
  const range = getDayValueRange(gameState.day);
  const tierItems = items.filter((item) => item.realValue >= range.minValue && item.realValue <= range.maxValue);
  return tierItems.length > 0 ? tierItems : items;
}

function pickRandomItem(items) {
  const dayPool = filterItemsForCurrentDay(items);
  const availableItems = dayPool.filter((item) => !gameState.seenItemIds.includes(item.id));
  const pool = availableItems.length > 0 ? availableItems : dayPool;
  const hotPool = pool.filter((item) => item.category === gameState.hotCategory);
  const finalPool = hotPool.length > 0 && Math.random() < 0.35 ? hotPool : pool;
  return pickOne(finalPool);
}

function getMarketCategories() {
  return [...new Set(AUCTION_ITEMS.map((item) => item.category))];
}

function pickDailyHotCategory() {
  const categories = getMarketCategories().filter((category) => category !== gameState.lastHotCategory);
  return pickOne(categories.length > 0 ? categories : getMarketCategories());
}

function pickDailyMarketEvent() {
  const events = MARKET_EVENTS.filter((event) => event.id !== gameState.lastMarketEventId);
  return pickOne(events.length > 0 ? events : MARKET_EVENTS);
}

function getMarketReport(category) {
  const reports = {
    '华强北电子货': '华强北档口今天有人扫货，能开机、能修、能拆件的电子货更容易出手。',
    '坂田仓库尾货': '坂田仓库清货消息传开，封条箱和退仓货都被多看两眼。',
    '港货回流': '香港回流货有人接，老相机、唱片和小件硬货报价被抬高。',
    '澳门高端局散货': '澳门那边有一批高端局散货流出来，表、铜器和小件最容易让人上头。',
    '广州旧档口': '广州旧档口今天人气旺，老物件真假混着来，价差也被放大。',
  };

  return reports[category] ?? `${category} 今天更受关注，报价和竞价都会更激进。`;
}

function getPricePositionText(item) {
  if (gameState.currentPrice < item.estimateMin) {
    return '价格低：可以试探';
  }
  if (gameState.currentPrice <= item.estimateMax) {
    return '价格中：谨慎跟';
  }
  return '价格高：建议收手';
}

function getBargainPotentialText(item) {
  const estimateSpread = item.estimateMax - item.estimateMin;
  const upsideByEstimate = item.estimateMax - item.startPrice;
  const riskText = `${item.risk} ${item.tags.join(' ')}`;
  const hasObviousTrapSignal = /真假|暗病|未知|高风险|难卖|压库存|维修|缺失|返修|临期|渠道|仿品|受潮|故障|鼓包|来源不明|砸手|故事/.test(riskText);

  if (gameState.currentPrice > item.estimateMax) return '建议：收手';
  if (item.rarity === 'epic' || estimateSpread >= item.startPrice * 5) {
    return hasObviousTrapSignal ? '建议：小口试探' : '建议：重点盯';
  }
  if (item.rarity === 'rare' || upsideByEstimate >= item.startPrice * 2.2) {
    return hasObviousTrapSignal ? '建议：别大跳' : '建议：可跟';
  }
  if (hasObviousTrapSignal && upsideByEstimate < item.startPrice) return '建议：少碰';
  return '建议：正常看';
}

function renderDecisionHints(item) {
  const isHot = item.category === gameState.hotCategory;
  document.querySelector('#decisionHints').innerHTML = [
    { text: getBargainPotentialText(item), className: 'hint-potential' },
    { text: getPricePositionText(item), className: gameState.currentPrice > item.estimateMax ? 'hint-danger' : 'hint-price' },
    { text: isHot ? '热点：好出手' : '非热点：别囤太久', className: isHot ? 'hint-hot' : '' },
  ].map((hint) => `<span class="${hint.className}">${hint.text}</span>`).join('');
}

function renderItem(item) {
  const isHot = item.category === gameState.hotCategory;
  document.querySelector('#itemName').textContent = item.name;
  document.querySelector('#itemMeta').textContent = `${item.category} · ${item.condition}`;
  document.querySelector('#itemDescription').textContent = item.description;
  document.querySelector('#itemTags').innerHTML = [
    { text: `起拍 ${formatCurrency(item.startPrice)}`, className: 'price-tag' },
    { text: `估值 ${formatCurrency(item.estimateMin)}-${formatCurrency(item.estimateMax)}` },
    { text: item.risk, className: 'risk-tag' },
    ...(isHot ? [{ text: '今日热点', className: 'hot-tag' }] : []),
  ].map((tag) => `<span class="${tag.className ?? ''}">${tag.text}</span>`).join('');
  renderDecisionHints(item);
}

function getNpcPressureLevel(npc) {
  if (!npc.active) return '已退场';
  const ratio = gameState.currentPrice / Math.max(npc.maxBid, 1);
  if (ratio >= 0.9) return '快到极限';
  if (ratio >= 0.7) return '开始犹豫';
  if (ratio >= 0.45) return '仍有兴趣';
  return '空间很大';
}

function getNpcShortHint(npc) {
  if (!npc.active) return '已收手';
  if (npc.id === 'rookie') return '容易上头';
  if (npc.id === 'dealer') return '只认利润';
  if (npc.id === 'shill') return '可能抬价';
  return npc.tell;
}

function renderNpcs() {
  const npcList = document.querySelector('.npc-list');
  npcList.innerHTML = gameState.npcs.map((npc) => `
    <li class="npc-card ${npc.active ? 'active' : 'inactive'}">
      <strong>${npc.name}</strong>
      <span>${getNpcPressureLevel(npc)}</span>
      <small>${getNpcShortHint(npc)}</small>
    </li>
  `).join('');
}

function getRandomMultiplier(min, max) {
  return min + Math.random() * (max - min);
}

function calculateSalePrice(item) {
  const saleRange = item.category === gameState.hotCategory
    ? BALANCE_CONFIG.hotSaleMultiplier
    : BALANCE_CONFIG.normalSaleMultiplier;
  const eventMultiplier = gameState.marketEvent?.saleMultiplier ?? 1;
  return Math.round(item.realValue * getRandomMultiplier(saleRange.min, saleRange.max) * eventMultiplier);
}

function getProfitAmount(entry) {
  return entry.item.realValue - entry.purchasePrice;
}

function getProfitText(entry) {
  const profit = getProfitAmount(entry);
  if (profit > 0) return `预计赚 ${formatCurrency(profit)}`;
  if (profit < 0) return `预计亏 ${formatCurrency(Math.abs(profit))}`;
  return '预计不赚不亏';
}

function getSaleProfitClass(entry) {
  const netProfit = entry.salePrice - entry.purchasePrice;
  if (netProfit > 0) return 'profit';
  if (netProfit < 0) return 'loss';
  return 'even';
}

function getSaleProfitText(entry) {
  const netProfit = entry.salePrice - entry.purchasePrice;
  if (netProfit > 0) return `卖出净赚 ${formatCurrency(netProfit)}`;
  if (netProfit < 0) return `卖出净亏 ${formatCurrency(Math.abs(netProfit))}`;
  return '卖出不赚不亏';
}

function addLog(text, options = {}) {
  const { skipSave = false } = options;
  gameState.logs.push(text);
  if (gameState.logs.length > MAX_LOG_ENTRIES) {
    gameState.logs = gameState.logs.slice(-MAX_LOG_ENTRIES);
  }
  renderLogs();
  renderRecentEvent();
  if (!skipSave) saveGame();
}

function renderLogs() {
  document.querySelector('#logList').innerHTML = gameState.logs.map((text) => `<li>${text}</li>`).join('');
}

function renderRecentEvent() {
  document.querySelector('#recentEventText').textContent = gameState.logs.at(-1) ?? '第一件货已经上台。';
}

function updateSaveStatus(text) {
  gameState.saveStatus = text;
  const node = document.querySelector('#saveStatusText');
  if (node) node.textContent = text;
}

function getSerializableGameState() {
  return {
    version: 5,
    savedAt: new Date().toISOString(),
    phase: gameState.phase,
    step: gameState.step,
    stepIndex: gameState.stepIndex,
    phaseStepTotal: gameState.phaseStepTotal,
    stepName: gameState.stepName,
    day: gameState.day,
    totalDays: gameState.totalDays,
    lotsPerDay: gameState.lotsPerDay,
    lotsSeenToday: gameState.lotsSeenToday,
    targetCash: gameState.targetCash,
    cash: gameState.cash,
    inventory: gameState.inventory,
    inventoryLimit: gameState.inventoryLimit,
    hotCategory: gameState.hotCategory,
    lastHotCategory: gameState.lastHotCategory,
    marketEvent: gameState.marketEvent,
    lastMarketEventId: gameState.lastMarketEventId,
    currentPrice: gameState.currentPrice,
    leader: gameState.leader,
    currentItem: gameState.currentItem,
    npcs: gameState.npcs,
    seenItemIds: gameState.seenItemIds,
    hasPassed: gameState.hasPassed,
    auctionEnded: gameState.auctionEnded,
    settlementDone: gameState.settlementDone,
    pendingSettlement: gameState.pendingSettlement,
    gameOver: gameState.gameOver,
    logs: gameState.logs,
  };
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableGameState()));
    updateSaveStatus(`已保存 · 第 ${gameState.day} 天第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`);
  } catch (error) {
    updateSaveStatus('保存失败');
    console.error('保存游戏失败', error);
  }
}

function isValidSaveData(saveData) {
  return Boolean(saveData && typeof saveData === 'object' && Number.isFinite(saveData.day) && Number.isFinite(saveData.cash) && Array.isArray(saveData.inventory));
}

function hydrateSaveData(saveData) {
  if (!isValidSaveData(saveData)) throw new Error('存档缺少必要字段');
  return {
    ...createInitialGameState(),
    ...saveData,
    inventory: Array.isArray(saveData.inventory) ? saveData.inventory : [],
    npcs: Array.isArray(saveData.npcs) ? saveData.npcs : [],
    seenItemIds: Array.isArray(saveData.seenItemIds) ? saveData.seenItemIds : [],
    marketEvent: saveData.marketEvent ?? null,
    lastMarketEventId: saveData.lastMarketEventId ?? null,
    logs: Array.isArray(saveData.logs) && saveData.logs.length > 0 ? saveData.logs : [...INITIAL_GAME_STATE.logs],
  };
}

function loadSavedGame() {
  try {
    const rawSave = localStorage.getItem(STORAGE_KEY);
    if (!rawSave) return false;
    Object.assign(gameState, hydrateSaveData(JSON.parse(rawSave)));
    updateSaveStatus('已恢复上次进度');
    return true;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    updateSaveStatus('存档损坏，已重开');
    console.error('读取游戏存档失败', error);
    return false;
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
  updateSaveStatus('存档已清除');
}

function renderWealthProgress() {
  const ratio = Math.min(gameState.cash / gameState.targetCash, 1);
  const gap = Math.max(gameState.targetCash - gameState.cash, 0);
  const percent = Math.round(ratio * 100);
  document.querySelector('#targetGapText').textContent = gap > 0 ? `差 ${formatCurrency(gap)}` : '已达标';
  document.querySelector('#wealthProgressText').textContent = `${formatCurrency(gameState.cash)} / ${formatCurrency(gameState.targetCash)}`;
  document.querySelector('#wealthProgressPercent').textContent = `${percent}%`;
  document.querySelector('#wealthProgressBar').style.width = `${percent}%`;
}

function getAuctionStatusLabel() {
  if (gameState.gameOver) return '挑战结束';
  if (gameState.auctionEnded) return '已落槌';
  if (gameState.hasPassed) return '已收手';
  return '暂无领先';
}

function renderInventory() {
  const inventoryList = document.querySelector('#inventoryList');
  if (gameState.inventory.length === 0) {
    inventoryList.innerHTML = '<li class="empty-state">暂无库存。拍下后可以选择放入库存。</li>';
    return;
  }

  inventoryList.innerHTML = gameState.inventory.map((entry, index) => `
    <li class="inventory-entry ${entry.item.category === gameState.hotCategory ? 'hot-inventory' : ''}">
      <div>
        <strong>${entry.item.name}</strong>
        <span>买入 ${formatCurrency(entry.purchasePrice)} · 鉴定 ${formatCurrency(entry.item.realValue)}</span>
        <span class="sale-line ${getSaleProfitClass(entry)}">报价 ${formatCurrency(entry.salePrice)} · ${getSaleProfitText(entry)}</span>
      </div>
      <button type="button" class="sell-button" data-sell-index="${index}" ${gameState.gameOver ? 'disabled' : ''}>卖出</button>
    </li>
  `).join('');
}

function renderSettlement() {
  const pending = gameState.pendingSettlement;
  const settlementView = document.querySelector('#settlementView');
  const auctionView = document.querySelector('#auctionView');
  if (gameState.gameOver) {
    settlementView.hidden = true;
    auctionView.hidden = true;
    return;
  }
  settlementView.hidden = !gameState.auctionEnded || !pending;
  auctionView.hidden = gameState.auctionEnded && Boolean(pending);

  if (!pending) return;

  const { type, entry, winner, price, item } = pending;
  const won = type === 'won';
  document.querySelector('#stageTitle').textContent = won ? '这单怎么处理？' : '这件已经结束';
  document.querySelector('#stageEyebrow').textContent = 'Settlement';
  document.querySelector('#settlementTitle').textContent = won ? (getProfitAmount(entry) >= 0 ? '捡漏成功' : '打眼了') : '没买到，也不亏';
  document.querySelector('#settlementSummary').textContent = won
    ? `你以 ${formatCurrency(entry.purchasePrice)} 拍下「${entry.item.name}」。现在决定卖掉还是放进库存。`
    : `${winner} 以 ${formatCurrency(price)} 拍走「${item.name}」。`;
  document.querySelector('#settlementPrice').textContent = formatCurrency(price);
  document.querySelector('#settlementValue').textContent = won ? formatCurrency(entry.item.realValue) : '未鉴定';
  document.querySelector('#settlementProfit').textContent = won ? getProfitText(entry) : '现金不变';
  document.querySelector('#settlementSale').textContent = won ? `${formatCurrency(entry.salePrice)} · ${getSaleProfitText(entry)}` : '无';
}

function renderPlayerActions() {
  const inSettlement = gameState.auctionEnded && Boolean(gameState.pendingSettlement) && !gameState.gameOver;
  document.querySelector('#auctionActions').hidden = inSettlement || gameState.gameOver;
  document.querySelector('#settlementActions').hidden = !inSettlement;

  const inventoryFull = gameState.inventory.length >= gameState.inventoryLimit;
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    const nextPrice = gameState.currentPrice + Number(button.dataset.bidAmount);
    button.disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded || inventoryFull || nextPrice > gameState.cash;
  });
  document.querySelector('#passButton').disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded;

  const pending = gameState.pendingSettlement;
  const won = pending?.type === 'won';
  document.querySelector('#sellNowButton').hidden = !won;
  document.querySelector('#keepItemButton').hidden = !won;
  document.querySelector('#nextItemButton').querySelector('strong').textContent = gameState.day < gameState.totalDays && gameState.lotsSeenToday >= gameState.lotsPerDay ? '下一天' : '下一件';

  if (gameState.gameOver) {
    document.querySelector('#stepHint').textContent = '挑战已结束，可以在设置里重新开始。';
  } else if (inSettlement) {
    document.querySelector('#stepHint').textContent = won ? '拍卖结束：现在只处理这单，卖掉或放库存。' : '这件结束了，继续下一件。';
  } else {
    document.querySelector('#stepHint').textContent = '当前阶段：买不买。只需要决定加价还是收手。';
  }
}

function renderState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day}/${gameState.totalDays} 天 · 第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`;
  document.querySelector('#stepText').textContent = `第 ${gameState.lotsSeenToday || 1}/${gameState.lotsPerDay} 件`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventory.length} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#eventNameText').textContent = gameState.marketEvent?.name ?? '暂无风声';
  document.querySelector('#eventSummaryText').textContent = gameState.marketEvent?.summary ?? '今天场面平稳，照常看货出价。';
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader === '暂无' ? getAuctionStatusLabel() : `${gameState.leader} 领先`;
  if (gameState.gameOver) {
    document.querySelector('#stageTitle').textContent = '挑战结束';
    document.querySelector('#stageEyebrow').textContent = 'Final Result';
  } else {
    document.querySelector('#stageTitle').textContent = gameState.auctionEnded && gameState.pendingSettlement ? document.querySelector('#stageTitle').textContent : '现在买不买？';
    document.querySelector('#stageEyebrow').textContent = gameState.auctionEnded && gameState.pendingSettlement ? 'Settlement' : 'Current Lot';
  }
  renderWealthProgress();
  updateSaveStatus(gameState.saveStatus);
  if (gameState.currentItem) renderDecisionHints(gameState.currentItem);
  renderNpcs();
  renderInventory();
  renderRecentEvent();
  renderSettlement();
  renderPlayerActions();
}

function settleAuction() {
  if (gameState.settlementDone) return;
  gameState.settlementDone = true;

  if (gameState.leader === '你') {
    const entry = {
      item: gameState.currentItem,
      purchasePrice: gameState.currentPrice,
      salePrice: calculateSalePrice(gameState.currentItem),
    };
    gameState.pendingSettlement = { type: 'won', entry, price: gameState.currentPrice, item: gameState.currentItem, winner: '你' };
    addLog(`落槌！你以 ${formatCurrency(gameState.currentPrice)} 拍下「${gameState.currentItem.name}」。`);
  } else if (gameState.leader !== '暂无') {
    gameState.pendingSettlement = { type: 'lost', winner: gameState.leader, price: gameState.currentPrice, item: gameState.currentItem };
    addLog(`落槌！${gameState.leader} 以 ${formatCurrency(gameState.currentPrice)} 拍走「${gameState.currentItem.name}」。`);
  } else {
    gameState.pendingSettlement = { type: 'lost', winner: '无人', price: gameState.currentPrice, item: gameState.currentItem };
    addLog(`流拍：「${gameState.currentItem.name}」没人拿下。`);
  }
}

function maybeEndAuction() {
  const activeNpcs = gameState.npcs.filter((npc) => npc.active);
  const npcCanOutbidPlayer = activeNpcs.some((npc) => gameState.leader === '你' && gameState.currentPrice + 50 <= npc.maxBid);
  if (activeNpcs.length > 0 && !gameState.hasPassed && gameState.leader !== '你') return;
  if (activeNpcs.length > 0 && npcCanOutbidPlayer) return;
  gameState.auctionEnded = true;
  settleAuction();
  renderState();
}

function runNpcBiddingRound() {
  if (gameState.auctionEnded) return;
  const activeNpcs = gameState.npcs.filter((npc) => npc.active);
  if (activeNpcs.length === 0) {
    maybeEndAuction();
    return;
  }

  for (const npc of activeNpcs) {
    const decision = getNpcBidDecision(npc, gameState.currentPrice, {
      item: gameState.currentItem,
      hotCategory: gameState.hotCategory,
      leader: gameState.leader,
      cash: gameState.cash,
    });
    if (!decision.shouldBid) {
      addLog(`${npc.name}：${decision.reason}。`);
      continue;
    }
    gameState.currentPrice = decision.nextPrice;
    gameState.leader = npc.name;
    addLog(`${npc.name} ${decision.reason}，加价到 ${formatCurrency(gameState.currentPrice)}。`);
  }
  maybeEndAuction();
  renderState();
}

function placePlayerBid(increment) {
  if (gameState.hasPassed || gameState.auctionEnded || gameState.gameOver) return;
  if (gameState.inventory.length >= gameState.inventoryLimit) {
    addLog('库存已满，先卖出一件再拍。');
    renderState();
    return;
  }
  const nextPrice = gameState.currentPrice + increment;
  if (nextPrice > gameState.cash) {
    addLog(`现金不足：加到 ${formatCurrency(nextPrice)} 会超过当前现金。`);
    renderState();
    return;
  }
  gameState.currentPrice = nextPrice;
  gameState.leader = '你';
  addLog(`你加价 ${formatCurrency(increment)}，当前价 ${formatCurrency(gameState.currentPrice)}。`);
  renderState();
  runNpcBiddingRound();
}

function passCurrentItem() {
  if (gameState.auctionEnded || gameState.gameOver) return;
  gameState.hasPassed = true;
  addLog(`你收手，不追「${gameState.currentItem.name}」。`);
  runNpcBiddingRound();
  if (!gameState.auctionEnded) {
    gameState.auctionEnded = true;
    settleAuction();
  }
  renderState();
}

function finishSettlement() {
  gameState.pendingSettlement = null;
  if (gameState.day === gameState.totalDays && gameState.lotsSeenToday >= gameState.lotsPerDay) {
    endGame();
    renderState();
    return;
  }
  loadNextItem();
}

function sellPendingNow() {
  const entry = gameState.pendingSettlement?.entry;
  if (!entry) return;
  const netCashChange = entry.salePrice - entry.purchasePrice;
  gameState.cash += netCashChange;
  addLog(`立即卖出「${entry.item.name}」：成交扣款 ${formatCurrency(entry.purchasePrice)}，卖出收入 ${formatCurrency(entry.salePrice)}，${getSaleProfitText(entry)}。`);
  finishSettlement();
}

function keepPendingItem() {
  const entry = gameState.pendingSettlement?.entry;
  if (!entry) return;
  if (entry.purchasePrice > gameState.cash) {
    addLog('现金不足，不能放入库存。请直接卖出。');
    renderState();
    return;
  }
  if (gameState.inventory.length >= gameState.inventoryLimit) {
    addLog('库存已满，不能放入库存。请直接卖出。');
    renderState();
    return;
  }
  gameState.cash -= entry.purchasePrice;
  gameState.inventory.push(entry);
  addLog(`放入库存：「${entry.item.name}」。现金扣除 ${formatCurrency(entry.purchasePrice)}。`);
  finishSettlement();
}

function sellInventoryItem(index) {
  if (gameState.gameOver) return;
  const entry = gameState.inventory[index];
  if (!entry) return;
  gameState.cash += entry.salePrice;
  gameState.inventory.splice(index, 1);
  addLog(`卖出库存「${entry.item.name}」，收入 ${formatCurrency(entry.salePrice)}，${getSaleProfitText(entry)}。`);
  renderState();
}

function rerollInventorySalePrices(reason = '市场热度变化') {
  gameState.inventory.forEach((entry) => { entry.salePrice = calculateSalePrice(entry.item); });
  if (gameState.inventory.length > 0) addLog(`${reason}，库存报价已刷新。`);
}

function startNewMarketDay(isFirstDay = false) {
  gameState.lastHotCategory = gameState.hotCategory;
  gameState.hotCategory = pickDailyHotCategory();
  gameState.lastMarketEventId = gameState.marketEvent?.id ?? gameState.lastMarketEventId;
  gameState.marketEvent = pickDailyMarketEvent();
  if (isFirstDay) {
    addLog(`今日热点：${gameState.hotCategory}。${getMarketReport(gameState.hotCategory)} 风声：${gameState.marketEvent.name}，${gameState.marketEvent.summary}`);
    return;
  }
  addLog(`第 ${gameState.day} 天开场。热点：${gameState.hotCategory}。风声：${gameState.marketEvent.name}。`);
  rerollInventorySalePrices('新一天行情变动');
}

function advanceDayIfNeeded() {
  if (gameState.lotsSeenToday < gameState.lotsPerDay) return;
  gameState.day += 1;
  gameState.lotsSeenToday = 0;
  startNewMarketDay(false);
}

function loadNextItem() {
  if (gameState.gameOver) return;
  advanceDayIfNeeded();
  if (gameState.day > gameState.totalDays) {
    endGame();
    renderState();
    return;
  }

  gameState.currentItem = pickRandomItem(AUCTION_ITEMS);
  gameState.seenItemIds.push(gameState.currentItem.id);
  gameState.lotsSeenToday += 1;
  gameState.currentPrice = gameState.currentItem.startPrice;
  gameState.leader = '暂无';
  gameState.npcs = createAuctionNpcs(gameState.currentItem, gameState.hotCategory, gameState.marketEvent);
  gameState.hasPassed = false;
  gameState.auctionEnded = false;
  gameState.settlementDone = false;
  gameState.pendingSettlement = null;

  renderItem(gameState.currentItem);
  renderState();
  addLog(`第 ${gameState.day} 天第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件：「${gameState.currentItem.name}」上台。`);
}

function getInventoryValue() {
  return gameState.inventory.reduce((total, entry) => total + entry.salePrice, 0);
}

function renderGameResult() {
  const inventoryValue = getInventoryValue();
  const finalAssets = gameState.cash + inventoryValue;
  const isWin = gameState.cash >= gameState.targetCash;
  const resultPanel = document.querySelector('#resultPanel');
  resultPanel.hidden = false;
  resultPanel.classList.toggle('win', isWin);
  resultPanel.classList.toggle('loss', !isWin);
  document.querySelector('#auctionView').hidden = true;
  document.querySelector('#settlementView').hidden = true;
  document.querySelector('#stageTitle').textContent = '挑战结束';
  document.querySelector('#resultContent').innerHTML = `
    <p class="result-title">${isWin ? '挑战成功！你成了捡漏之王。' : '挑战结束，现金目标还差一点。'}</p>
    <dl>
      <div><dt>最终现金</dt><dd>${formatCurrency(gameState.cash)}</dd></div>
      <div><dt>库存报价</dt><dd>${formatCurrency(inventoryValue)}</dd></div>
      <div><dt>最终资产</dt><dd>${formatCurrency(finalAssets)}</dd></div>
      <div><dt>现金目标</dt><dd>${formatCurrency(gameState.targetCash)}</dd></div>
    </dl>
  `;
  return { finalAssets };
}

function endGame() {
  if (gameState.gameOver) {
    renderGameResult();
    return;
  }
  gameState.gameOver = true;
  gameState.auctionEnded = true;
  const { finalAssets } = renderGameResult();
  addLog(`7 天结束：现金 ${formatCurrency(gameState.cash)}，资产 ${formatCurrency(finalAssets)}。`);
}

function resetGame() {
  clearSavedGame();
  Object.assign(gameState, createInitialGameState());
  document.querySelector('#resultPanel').hidden = true;
  document.querySelector('#auctionView').hidden = false;
  document.querySelector('#settlementView').hidden = true;
  document.querySelector('#inventoryDrawer').hidden = true;
  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('对手已入场。加价后，他们会决定是否跟。');
}

function bindPlayerActions() {
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    button.addEventListener('click', () => placePlayerBid(Number(button.dataset.bidAmount)));
  });
  const openInventory = () => { document.querySelector('#inventoryDrawer').hidden = false; };
  const openLog = () => {
    const logDrawer = document.querySelector('#logDrawer');
    logDrawer.open = true;
    logDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  document.querySelector('#passButton').addEventListener('click', passCurrentItem);
  document.querySelector('#sellNowButton').addEventListener('click', sellPendingNow);
  document.querySelector('#keepItemButton').addEventListener('click', keepPendingItem);
  document.querySelector('#nextItemButton').addEventListener('click', finishSettlement);
  document.querySelectorAll('[data-restart-game]').forEach((button) => button.addEventListener('click', resetGame));
  document.querySelector('#inventoryToggle').addEventListener('click', openInventory);
  document.querySelector('#logToggle').addEventListener('click', openLog);
  document.querySelector('#inventoryClose').addEventListener('click', () => { document.querySelector('#inventoryDrawer').hidden = true; });
  document.querySelector('#inventoryDrawer').addEventListener('click', (event) => {
    if (event.target.id === 'inventoryDrawer') document.querySelector('#inventoryDrawer').hidden = true;
  });
  document.querySelector('#inventoryList').addEventListener('click', (event) => {
    const sellButton = event.target.closest('[data-sell-index]');
    if (sellButton) sellInventoryItem(Number(sellButton.dataset.sellIndex));
  });
}

function initGame() {
  if (!Array.isArray(AUCTION_ITEMS) || AUCTION_ITEMS.length === 0) throw new Error('拍品数据为空，无法开始拍卖。');
  bindPlayerActions();
  if (loadSavedGame() && gameState.currentItem) {
    renderItem(gameState.currentItem);
    renderLogs();
    renderState();
    if (gameState.gameOver) endGame();
    addLog('已恢复本地进度。', { skipSave: true });
    return;
  }
  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('对手已入场。加价后，他们会决定是否跟。');
}

initGame();
