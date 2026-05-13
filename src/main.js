const STORAGE_KEY = 'kelly-king-save-v1';
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

const INITIAL_GAME_STATE = {
  phase: 4,
  step: '4.3',
  stepIndex: 3,
  phaseStepTotal: 3,
  stepName: 'localStorage 存档',
  day: 1,
  totalDays: 7,
  lotsPerDay: 5,
  lotsSeenToday: 0,
  targetCash: BALANCE_CONFIG.targetCash,
  cash: BALANCE_CONFIG.startingCash,
  inventory: [],
  inventoryLimit: BALANCE_CONFIG.inventoryLimit,
  hotCategory: '相机',
  lastHotCategory: null,
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
  npcs: [],
  seenItemIds: [],
  hasPassed: false,
  auctionEnded: false,
  settlementDone: false,
  gameOver: false,
  saveStatus: '尚未保存',
  logs: [
    '欢迎来到跳蚤市场，第一件拍品已经上台。',
    '当前步骤：阶段 4 / Step 4.3（3/3）localStorage 存档。',
  ],
};

function createInitialGameState() {
  return {
    ...INITIAL_GAME_STATE,
    inventory: [],
    npcs: [],
    seenItemIds: [],
    logs: [...INITIAL_GAME_STATE.logs],
  };
}

const gameState = createInitialGameState();

function formatCurrency(value) {
  return `￥${value.toLocaleString('zh-CN')}`;
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

function getMarketReport(category) {
  const reports = {
    '电子产品': '旧设备回收商今天进场，能开机的电子货更容易卖掉。',
    '相机': '摄影圈突然来人扫货，镜头和胶片机报价被抬高。',
    '手表': '礼品回收摊缺货，表类今天有人愿意加价收。',
    '球鞋': '潮流买家扎堆，热门尺码的鞋会被多看两眼。',
    '手办': '收藏群里有人补款，绝版和热门角色更吃香。',
    '收藏品': '老物件摊位人气高，纪念币和怀旧玩具流动性变好。',
    '唱片': '黑胶/CD 玩家今天很活跃，有故事的唱片更容易成交。',
    '古董': '古玩客多了，但坑也更多，价格波动会被放大。',
    '神秘货': '赌箱氛围起来了，大家对未知纸箱格外上头。',
  };

  return reports[category] ?? `${category} 今天更受关注，报价和竞价都会更激进。`;
}

function renderStepStatus() {
  document.querySelector('#stepText').textContent = `阶段 ${gameState.phase} · Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）`;
  document.querySelector('#stepHint').textContent = `当前步骤：阶段 ${gameState.phase} / Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）${gameState.stepName}。目标：7 天结束时现金达到 ${formatCurrency(gameState.targetCash)}。`;
}

function renderItem(item) {
  const isHot = item.category === gameState.hotCategory;
  document.querySelector('#itemName').textContent = item.name;
  document.querySelector('#itemMeta').textContent = `品类：${item.category} · 品相：${item.condition} · 稀有度：${item.rarity}`;
  document.querySelector('#itemDescription').textContent = item.description;
  document.querySelector('#itemTags').innerHTML = [
    { text: `起拍价：${formatCurrency(item.startPrice)}`, className: 'price-tag' },
    { text: `模糊估值：${formatCurrency(item.estimateMin)} - ${formatCurrency(item.estimateMax)}` },
    { text: `风险：${item.risk}`, className: 'risk-tag' },
    ...(isHot ? [{ text: `今日热点：${item.category}`, className: 'hot-tag' }] : []),
    ...item.tags.map((tag) => ({ text: tag })),
  ].map((tag) => `<span class="${tag.className ?? ''}">${tag.text}</span>`).join('');
}

function getNpcPressureLevel(npc) {
  if (!npc.active) {
    return '已离场';
  }

  const ratio = gameState.currentPrice / Math.max(npc.maxBid, 1);
  if (ratio >= 0.9) {
    return '快到极限';
  }

  if (ratio >= 0.7) {
    return '开始犹豫';
  }

  if (ratio >= 0.45) {
    return '仍有兴趣';
  }

  return '空间很大';
}

function getNpcMindHint(npc) {
  const item = gameState.currentItem;
  if (!item) {
    return npc.tell;
  }

  const likesCategory = npc.favoriteCategories?.includes(item.category);
  const avoidsCategory = npc.avoidCategories?.includes(item.category);
  const pressure = getNpcPressureLevel(npc);

  if (!npc.active) {
    return `${pressure}：${npc.name}已经退场，他的退出理由比心理价更值得看。`;
  }

  if (npc.id === 'rookie') {
    if (likesCategory || item.rarity === 'rare' || item.rarity === 'epic') {
      return `${pressure}：他明显心动，可能会冲动跳价；别被他的热情带偏。`;
    }
    if (avoidsCategory) {
      return `${pressure}：他对这类货没那么懂，跟价参考价值偏低。`;
    }
    return `${pressure}：他更多靠感觉出价，价格越热闹越容易失控。`;
  }

  if (npc.id === 'dealer') {
    if (likesCategory || item.category === gameState.hotCategory) {
      return `${pressure}：他还在算转卖空间；他持续跟价通常说明这件货不差。`;
    }
    if (avoidsCategory) {
      return `${pressure}：他不爱碰这类风险货，早退不一定代表东西差。`;
    }
    return `${pressure}：他只看利润，撤退时多半是价格已经不香。`;
  }

  if (npc.id === 'shill') {
    if (likesCategory) {
      return `${pressure}：他在这种题材上最会带节奏，可能是在诱你多加一口。`;
    }
    return `${pressure}：他未必真想买，重点是观察他什么时候突然收手。`;
  }

  return `${pressure}：${npc.tell}`;
}

function renderNpcs() {
  const npcList = document.querySelector('.npc-list');
  npcList.innerHTML = gameState.npcs.map((npc) => {
    const status = npc.active ? `心理价：${formatCurrency(npc.maxBid)}` : '已退出';
    const categoryText = npc.favoriteCategories?.length ? `偏好：${npc.favoriteCategories.join('、')}` : '偏好：无';
    return `
      <li class="npc-card ${npc.active ? 'active' : 'inactive'}">
        <strong>${npc.name}</strong>
        <span>${npc.archetype} · ${npc.mood} · ${status}</span>
        <small>${categoryText}</small>
        <small class="npc-mind-hint">心理提示：${getNpcMindHint(npc)}</small>
      </li>
    `;
  }).join('');
}

function getRandomMultiplier(min, max) {
  return min + Math.random() * (max - min);
}

function calculateSalePrice(item) {
  const saleRange = item.category === gameState.hotCategory
    ? BALANCE_CONFIG.hotSaleMultiplier
    : BALANCE_CONFIG.normalSaleMultiplier;
  const multiplier = getRandomMultiplier(saleRange.min, saleRange.max);

  return Math.round(item.realValue * multiplier);
}

function rerollInventorySalePrices(reason = '市场热度变化') {
  gameState.inventory.forEach((entry) => {
    entry.salePrice = calculateSalePrice(entry.item);
  });

  if (gameState.inventory.length > 0) {
    addLog(`${reason}，库存的快速出售报价已重新刷新。`);
  }
}

function getProfitText(entry) {
  const profit = entry.item.realValue - entry.purchasePrice;
  if (profit > 0) {
    return `预计赚 ${formatCurrency(profit)}`;
  }

  if (profit < 0) {
    return `预计亏 ${formatCurrency(Math.abs(profit))}`;
  }

  return '预计不赚不亏';
}

function getSaleProfitClass(entry) {
  const netProfit = entry.salePrice - entry.purchasePrice;
  if (netProfit > 0) {
    return 'profit';
  }

  if (netProfit < 0) {
    return 'loss';
  }

  return 'even';
}

function getSaleProfitText(entry) {
  const netProfit = entry.salePrice - entry.purchasePrice;
  if (netProfit > 0) {
    return `卖出净赚 ${formatCurrency(netProfit)}`;
  }

  if (netProfit < 0) {
    return `卖出净亏 ${formatCurrency(Math.abs(netProfit))}`;
  }

  return '卖出不赚不亏';
}

function renderInventory() {
  const inventoryList = document.querySelector('#inventoryList');
  if (gameState.inventory.length === 0) {
    inventoryList.innerHTML = '<li class="empty-state">暂无库存。拍下一件东西后，这里会显示鉴定价和出售报价。</li>';
    return;
  }

  inventoryList.innerHTML = gameState.inventory.map((entry, index) => `
    <li class="inventory-entry ${entry.item.category === gameState.hotCategory ? 'hot-inventory' : ''}">
      <div class="inventory-item-info">
        <strong>${entry.item.name}</strong>
        <span>成交价：${formatCurrency(entry.purchasePrice)} · 鉴定价：${formatCurrency(entry.item.realValue)} · ${getProfitText(entry)}</span>
        <span class="sale-line ${getSaleProfitClass(entry)}">快速出售报价：${formatCurrency(entry.salePrice)} · ${getSaleProfitText(entry)}</span>
        ${entry.item.category === gameState.hotCategory ? '<span class="market-chip">今日热点加成中</span>' : ''}
      </div>
      <button type="button" class="sell-button" data-sell-index="${index}" ${gameState.gameOver ? 'disabled' : ''}>快速出售</button>
    </li>
  `).join('');
}

function renderAppraisal() {
  const appraisalResult = document.querySelector('#appraisalResult');
  const lastEntry = gameState.inventory.at(-1);

  if (!lastEntry) {
    appraisalResult.innerHTML = '<p>拍下物品后，这里会显示真实价值与赚亏预估。</p>';
    return;
  }

  const profit = lastEntry.item.realValue - lastEntry.purchasePrice;
  const resultClass = profit >= 0 ? 'profit' : 'loss';
  const resultText = getProfitText(lastEntry);

  appraisalResult.innerHTML = `
    <p class="appraisal-item-name">${lastEntry.item.name}</p>
    <dl>
      <div><dt>成交价</dt><dd>${formatCurrency(lastEntry.purchasePrice)}</dd></div>
      <div><dt>真实价值</dt><dd>${formatCurrency(lastEntry.item.realValue)}</dd></div>
      <div class="${resultClass}"><dt>鉴定结论</dt><dd>${resultText}</dd></div>
    </dl>
  `;
}

function addLog(text, options = {}) {
  const { skipSave = false } = options;
  gameState.logs.push(text);
  if (gameState.logs.length > MAX_LOG_ENTRIES) {
    gameState.logs = gameState.logs.slice(-MAX_LOG_ENTRIES);
  }

  renderLogs();

  if (!skipSave) {
    saveGame();
  }
}

function renderLogs() {
  const logList = document.querySelector('#logList');
  logList.innerHTML = gameState.logs.map((text) => `<li>${text}</li>`).join('');
}

function updateSaveStatus(text) {
  gameState.saveStatus = text;
  const saveStatusText = document.querySelector('#saveStatusText');
  if (saveStatusText) {
    saveStatusText.textContent = text;
  }
}

function getSerializableGameState() {
  return {
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
    currentPrice: gameState.currentPrice,
    leader: gameState.leader,
    currentItem: gameState.currentItem,
    npcs: gameState.npcs,
    seenItemIds: gameState.seenItemIds,
    hasPassed: gameState.hasPassed,
    auctionEnded: gameState.auctionEnded,
    settlementDone: gameState.settlementDone,
    gameOver: gameState.gameOver,
    logs: gameState.logs,
  };
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableGameState()));
    updateSaveStatus(`已自动保存 · 第 ${gameState.day} 天第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`);
  } catch (error) {
    updateSaveStatus('保存失败：浏览器可能禁用了 localStorage');
    console.error('保存游戏失败', error);
  }
}

function hydrateSaveData(saveData) {
  return {
    ...createInitialGameState(),
    ...saveData,
    inventory: Array.isArray(saveData.inventory) ? saveData.inventory : [],
    npcs: Array.isArray(saveData.npcs) ? saveData.npcs : [],
    seenItemIds: Array.isArray(saveData.seenItemIds) ? saveData.seenItemIds : [],
    logs: Array.isArray(saveData.logs) && saveData.logs.length > 0 ? saveData.logs : [...INITIAL_GAME_STATE.logs],
  };
}

function loadSavedGame() {
  try {
    const rawSave = localStorage.getItem(STORAGE_KEY);
    if (!rawSave) {
      return false;
    }

    const saveData = hydrateSaveData(JSON.parse(rawSave));
    Object.assign(gameState, saveData);
    updateSaveStatus('已恢复上次进度');
    return true;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    updateSaveStatus('存档损坏，已重开新局');
    console.error('读取游戏存档失败', error);
    return false;
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
  updateSaveStatus('存档已清除');
}

function getNextPlayerBidText() {
  const amounts = [...document.querySelectorAll('[data-bid-amount]')]
    .map((button) => Number(button.dataset.bidAmount))
    .filter((amount) => gameState.currentPrice + amount <= gameState.cash);

  if (gameState.gameOver || gameState.hasPassed || gameState.auctionEnded || gameState.inventory.length >= gameState.inventoryLimit || amounts.length === 0) {
    return '无法加价';
  }

  return `+${formatCurrency(Math.min(...amounts)).replace('￥', '￥')}`;
}

function getAuctionStatusText() {
  if (gameState.gameOver) {
    return '挑战结束';
  }

  if (gameState.auctionEnded) {
    return '已落槌';
  }

  if (gameState.hasPassed) {
    return '已放弃';
  }

  if (gameState.inventory.length >= gameState.inventoryLimit) {
    return '库存已满';
  }

  return '竞价中';
}

function renderPlayerActions() {
  const inventoryFull = gameState.inventory.length >= gameState.inventoryLimit;
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    const bidAmount = Number(button.dataset.bidAmount);
    const nextPrice = gameState.currentPrice + bidAmount;
    button.disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded || inventoryFull || nextPrice > gameState.cash;
  });

  document.querySelector('#passButton').disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded;
  document.querySelector('#nextBidText').textContent = getNextPlayerBidText();
  document.querySelector('#auctionStatusText').textContent = getAuctionStatusText();

  const nextItemButton = document.querySelector('#nextItemButton');
  nextItemButton.disabled = gameState.gameOver || !gameState.auctionEnded;
  nextItemButton.textContent = gameState.day < gameState.totalDays && gameState.lotsSeenToday >= gameState.lotsPerDay
    ? '下一天'
    : '下一件';
}

function renderState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day} 天 / 共 ${gameState.totalDays} 天 · 第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventory.length} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = `${gameState.hotCategory} ↑`;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
  updateSaveStatus(gameState.saveStatus);
  renderNpcs();
  renderInventory();
  renderAppraisal();
  renderPlayerActions();
}

function settleAuction() {
  if (gameState.settlementDone) {
    return;
  }

  gameState.settlementDone = true;

  if (gameState.leader === '你') {
    if (gameState.inventory.length >= gameState.inventoryLimit) {
      addLog('库存已满，无法拿下这件拍品。');
    } else {
      gameState.cash -= gameState.currentPrice;
      const inventoryEntry = {
        item: gameState.currentItem,
        purchasePrice: gameState.currentPrice,
        salePrice: calculateSalePrice(gameState.currentItem),
      };
      gameState.inventory.push(inventoryEntry);
      addLog(`成交！你以 ${formatCurrency(gameState.currentPrice)} 拍下「${gameState.currentItem.name}」，物品已进入库存。`);
      addLog(`鉴定完成：真实价值 ${formatCurrency(gameState.currentItem.realValue)}，${getProfitText(inventoryEntry)}。`);
    }
  } else if (gameState.leader !== '暂无') {
    addLog(`落槌！${gameState.leader} 以 ${formatCurrency(gameState.currentPrice)} 拍走「${gameState.currentItem.name}」。`);
  } else {
    addLog(`流拍：「${gameState.currentItem.name}」没人拿下。`);
  }

  if (gameState.day === gameState.totalDays && gameState.lotsSeenToday >= gameState.lotsPerDay) {
    endGame();
  }
}

function maybeEndAuction() {
  const activeNpcs = gameState.npcs.filter((npc) => npc.active);
  if (activeNpcs.length > 0) {
    return;
  }

  gameState.auctionEnded = true;
  settleAuction();
  renderState();
}

function runNpcBiddingRound() {
  if (gameState.auctionEnded) {
    return;
  }

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
  if (gameState.hasPassed) {
    addLog('你已经放弃这件拍品，不能继续出价。');
    return;
  }

  if (gameState.auctionEnded) {
    addLog('这件拍品的竞价已经结束。');
    return;
  }

  if (gameState.inventory.length >= gameState.inventoryLimit) {
    addLog('库存已满，不能继续拍下新物品。');
    renderState();
    return;
  }

  const nextPrice = gameState.currentPrice + increment;
  if (nextPrice > gameState.cash) {
    addLog(`现金不足：继续加价到 ${formatCurrency(nextPrice)} 会超过你当前现金 ${formatCurrency(gameState.cash)}。`);
    renderState();
    return;
  }

  gameState.currentPrice = nextPrice;
  gameState.leader = '你';
  addLog(`你加价 ${formatCurrency(increment)}，当前价格变为 ${formatCurrency(gameState.currentPrice)}。`);
  renderState();
  runNpcBiddingRound();
}

function passCurrentItem() {
  gameState.hasPassed = true;
  addLog(`你放弃了「${gameState.currentItem.name}」，NPC 继续决定是否出价。`);
  runNpcBiddingRound();
  renderState();
}

function sellInventoryItem(index) {
  if (gameState.gameOver) {
    addLog('挑战已结束，不能继续出售库存。');
    return;
  }

  const entry = gameState.inventory[index];
  if (!entry) {
    return;
  }

  gameState.cash += entry.salePrice;
  gameState.inventory.splice(index, 1);

  const netProfit = entry.salePrice - entry.purchasePrice;
  const resultText = netProfit >= 0
    ? `净赚 ${formatCurrency(netProfit)}`
    : `净亏 ${formatCurrency(Math.abs(netProfit))}`;

  addLog(`快速出售「${entry.item.name}」，收入 ${formatCurrency(entry.salePrice)}，${resultText}。`);
  renderState();
}

function startNewMarketDay(isFirstDay = false) {
  gameState.lastHotCategory = gameState.hotCategory;
  gameState.hotCategory = pickDailyHotCategory();

  if (isFirstDay) {
    addLog(`今日市场热点：${gameState.hotCategory}。${getMarketReport(gameState.hotCategory)}`);
    return;
  }

  addLog(`第 ${gameState.day} 天开场，新的摊位开始上货。`);
  addLog(`今日市场热点切换为：${gameState.hotCategory}。${getMarketReport(gameState.hotCategory)}`);
  rerollInventorySalePrices('新一天行情变动');
}

function advanceDayIfNeeded() {
  if (gameState.lotsSeenToday < gameState.lotsPerDay) {
    return;
  }

  gameState.day += 1;
  gameState.lotsSeenToday = 0;
  startNewMarketDay(false);
}

function loadNextItem() {
  if (gameState.gameOver) {
    return;
  }

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
  gameState.npcs = createAuctionNpcs(gameState.currentItem, gameState.hotCategory);
  gameState.hasPassed = false;
  gameState.auctionEnded = false;
  gameState.settlementDone = false;

  renderItem(gameState.currentItem);
  renderState();
  addLog(`第 ${gameState.day} 天第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件拍品上台：「${gameState.currentItem.name}」。`);
}

function getInventoryValue() {
  return gameState.inventory.reduce((total, entry) => total + entry.salePrice, 0);
}

function renderGameResult() {
  const inventoryValue = getInventoryValue();
  const finalAssets = gameState.cash + inventoryValue;
  const isWin = gameState.cash >= gameState.targetCash;
  const resultPanel = document.querySelector('#resultPanel');
  const resultContent = document.querySelector('#resultContent');

  resultPanel.hidden = false;
  resultPanel.classList.toggle('win', isWin);
  resultPanel.classList.toggle('loss', !isWin);
  resultContent.innerHTML = `
    <p class="result-title">${isWin ? '挑战成功！你成了捡漏之王。' : '挑战结束，现金目标还差一点。'}</p>
    <dl>
      <div><dt>最终现金</dt><dd>${formatCurrency(gameState.cash)}</dd></div>
      <div><dt>库存快速出售估值</dt><dd>${formatCurrency(inventoryValue)}</dd></div>
      <div><dt>最终资产</dt><dd>${formatCurrency(finalAssets)}</dd></div>
      <div><dt>现金目标</dt><dd>${formatCurrency(gameState.targetCash)}</dd></div>
    </dl>
  `;

  return { inventoryValue, finalAssets };
}

function endGame() {
  if (gameState.gameOver) {
    renderGameResult();
    return;
  }

  gameState.gameOver = true;
  gameState.auctionEnded = true;

  const { finalAssets } = renderGameResult();

  addLog(`7 天挑战结束：最终现金 ${formatCurrency(gameState.cash)}，最终资产 ${formatCurrency(finalAssets)}。`);
}

function resetGame() {
  clearSavedGame();
  Object.assign(gameState, createInitialGameState());

  document.querySelector('#resultPanel').hidden = true;
  document.querySelector('#resultPanel').classList.remove('win', 'loss');
  renderStepStatus();
  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('NPC 已入场。你每次出价后，他们会按心理价决定是否跟价。');
}

function bindPlayerActions() {
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      placePlayerBid(Number(button.dataset.bidAmount));
    });
  });

  document.querySelector('#passButton').addEventListener('click', passCurrentItem);
  document.querySelector('#nextItemButton').addEventListener('click', loadNextItem);
  document.querySelector('#restartButton').addEventListener('click', resetGame);
  document.querySelector('#inventoryList').addEventListener('click', (event) => {
    const sellButton = event.target.closest('[data-sell-index]');
    if (!sellButton) {
      return;
    }

    sellInventoryItem(Number(sellButton.dataset.sellIndex));
  });
}

function initGame() {
  if (!Array.isArray(AUCTION_ITEMS) || AUCTION_ITEMS.length === 0) {
    throw new Error('拍品数据为空，无法开始拍卖。');
  }

  renderStepStatus();
  bindPlayerActions();

  if (loadSavedGame() && gameState.currentItem) {
    renderItem(gameState.currentItem);
    renderLogs();
    renderState();
    if (gameState.gameOver) {
      endGame();
    }
    addLog('已从本地存档恢复进度。', { skipSave: true });
    return;
  }

  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('NPC 已入场。你每次出价后，他们会按心理价决定是否跟价。');
}

initGame();
