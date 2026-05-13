const STORAGE_KEY = 'kelly-king-save-v2';
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
  phase: 5,
  step: '5.2',
  stepIndex: 2,
  phaseStepTotal: 3,
  stepName: '页面体验与移动端适配',
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
    '第一件货已经上台。看估值和风险，决定要不要加价。',
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
    '华强北电子货': '华强北档口今天有人扫货，能开机、能修、能拆件的电子货更容易出手。',
    '坂田仓库尾货': '坂田仓库清货消息传开，封条箱和退仓货都被多看两眼。',
    '港货回流': '香港回流货有人接，老相机、唱片和小件硬货报价被抬高。',
    '澳门高端局散货': '澳门那边有一批高端局散货流出来，表、铜器和小件最容易让人上头。',
    '广州旧档口': '广州旧档口今天人气旺，老物件真假混着来，价差也被放大。',
  };

  return reports[category] ?? `${category} 今天更受关注，报价和竞价都会更激进。`;
}

function renderStepStatus() {
  document.querySelector('#stepText').textContent = `第 ${gameState.lotsSeenToday || 1}/${gameState.lotsPerDay} 件`;
  document.querySelector('#stepHint').textContent = `提示：现金目标 ${formatCurrency(gameState.targetCash)}；放弃不扣钱，拍下后会显示真实价值。`;
}

function getPricePositionText(item) {
  if (gameState.currentPrice < item.estimateMin) {
    return '价格位置：低于估值下沿，可观察';
  }

  if (gameState.currentPrice <= item.estimateMax) {
    return '价格位置：进入估值区间，别上头';
  }

  return '价格位置：超过估值上沿，高危';
}

function getBargainPotentialText(item) {
  const estimateSpread = item.estimateMax - item.estimateMin;
  const upsideByEstimate = item.estimateMax - item.startPrice;
  const riskText = `${item.risk} ${item.tags.join(' ')}`;
  const hasObviousTrapSignal = /真假|暗病|未知|高风险|难卖|压库存|维修|缺失/.test(riskText);

  if (item.rarity === 'epic' || estimateSpread >= item.startPrice * 5) {
    return hasObviousTrapSignal ? '捡漏潜力：很高，也很容易翻车' : '捡漏潜力：很高，值得盯紧';
  }

  if (item.rarity === 'rare' || upsideByEstimate >= item.startPrice * 2.2) {
    return hasObviousTrapSignal ? '捡漏潜力：偏高，风险也偏明' : '捡漏潜力：偏高';
  }

  if (hasObviousTrapSignal && upsideByEstimate < item.startPrice) {
    return '捡漏潜力：偏保守，别硬冲';
  }

  return '捡漏潜力：中等';
}

function renderDecisionHints(item) {
  const isHot = item.category === gameState.hotCategory;
  document.querySelector('#decisionHints').innerHTML = [
    { text: getBargainPotentialText(item), className: 'hint-potential' },
    { text: getPricePositionText(item), className: gameState.currentPrice > item.estimateMax ? 'hint-danger' : 'hint-price' },
    { text: isHot ? '今日热度：命中热点，出手更快' : '今日热度：普通行情', className: isHot ? 'hint-hot' : '' },
  ].map((hint) => `<span class="${hint.className}">${hint.text}</span>`).join('');
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
  renderDecisionHints(item);
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
      return `${pressure}：他眼里有少年气，见稀罕物便想抢一手；别被这股热血带偏。`;
    }
    if (avoidsCategory) {
      return `${pressure}：他不太懂这一路货色，跟价参考价值偏低。`;
    }
    return `${pressure}：他多半凭一口气出价，场面越热越容易失了分寸。`;
  }

  if (npc.id === 'dealer') {
    if (likesCategory || item.category === gameState.hotCategory) {
      return `${pressure}：沈三还在拨算盘；他肯跟，通常说明这货不是纯垃圾。`;
    }
    if (avoidsCategory) {
      return `${pressure}：沈三不爱沾这类风险货，早退不一定代表东西差。`;
    }
    return `${pressure}：铁算盘只认利润，他收手时，多半是价格已经不香。`;
  }

  if (npc.id === 'shill') {
    if (likesCategory) {
      return `${pressure}：胡不归笑得越深越要小心，他可能正等你多加一口。`;
    }
    return `${pressure}：他未必真想买，重点是看他何时忽然合扇收手。`;
  }

  return `${pressure}：${npc.tell}`;
}

function renderNpcs() {
  const npcList = document.querySelector('.npc-list');
  npcList.innerHTML = gameState.npcs.map((npc) => {
    const pressure = getNpcPressureLevel(npc);
    const status = npc.active ? pressure : '已退出';
    const hint = getNpcMindHint(npc).replace(`${pressure}：`, '').replace('已离场：', '');
    return `
      <li class="npc-card ${npc.active ? 'active' : 'inactive'}">
        <strong>${npc.name}</strong>
        <span>${status}</span>
        <small class="npc-mind-hint">${hint}</small>
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

function renderDealSpotlight(entry) {
  const spotlight = document.querySelector('#dealSpotlight');
  const title = document.querySelector('#dealSpotlightTitle');
  const text = document.querySelector('#dealSpotlightText');
  const profit = entry.item.realValue - entry.purchasePrice;
  const isProfit = profit >= 0;

  spotlight.hidden = false;
  spotlight.classList.toggle('profit', isProfit);
  spotlight.classList.toggle('loss', !isProfit);
  title.textContent = isProfit ? '捡漏成功！' : '打眼了！';
  text.textContent = `你以 ${formatCurrency(entry.purchasePrice)} 拿下「${entry.item.name}」，真实价值 ${formatCurrency(entry.item.realValue)}，${getProfitText(entry)}。`;
}

function hideDealSpotlight() {
  const spotlight = document.querySelector('#dealSpotlight');
  spotlight.hidden = true;
  spotlight.classList.remove('profit', 'loss');
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
    version: 1,
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

function isValidSaveData(saveData) {
  return Boolean(
    saveData
    && typeof saveData === 'object'
    && Number.isFinite(saveData.day)
    && Number.isFinite(saveData.cash)
    && Array.isArray(saveData.inventory)
    && Array.isArray(saveData.logs)
  );
}

function hydrateSaveData(saveData) {
  if (!isValidSaveData(saveData)) {
    throw new Error('存档缺少必要字段');
  }

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

function renderWealthProgress() {
  const ratio = Math.min(gameState.cash / gameState.targetCash, 1);
  const gap = Math.max(gameState.targetCash - gameState.cash, 0);
  const percent = Math.round(ratio * 100);

  document.querySelector('#targetGapText').textContent = gap > 0
    ? `距离捡漏之王还差 ${formatCurrency(gap)}`
    : '现金目标已达成，守住胜局。';
  document.querySelector('#wealthProgressText').textContent = `财富进度：${formatCurrency(gameState.cash)} / ${formatCurrency(gameState.targetCash)}`;
  document.querySelector('#wealthProgressPercent').textContent = `${percent}%`;
  document.querySelector('#wealthProgressBar').style.width = `${percent}%`;
}

function renderState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day}/${gameState.totalDays} 天 · 第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`;
  document.querySelector('#stepText').textContent = `第 ${gameState.lotsSeenToday}/${gameState.lotsPerDay} 件`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventory.length} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = `${gameState.hotCategory} ↑`;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
  renderWealthProgress();
  updateSaveStatus(gameState.saveStatus);
  renderDecisionHints(gameState.currentItem);
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
      renderDealSpotlight(inventoryEntry);
      addLog(`落槌！你以 ${formatCurrency(gameState.currentPrice)} 拍下「${gameState.currentItem.name}」，物品已入库。`);
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
  const npcCanOutbidPlayer = activeNpcs.some((npc) => gameState.leader === '你' && gameState.currentPrice + 50 <= npc.maxBid);
  if (activeNpcs.length > 0 && !gameState.hasPassed && gameState.leader !== '你') {
    return;
  }

  if (activeNpcs.length > 0 && npcCanOutbidPlayer) {
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
  addLog(`你放弃了「${gameState.currentItem.name}」。`);
  runNpcBiddingRound();

  if (!gameState.auctionEnded) {
    gameState.auctionEnded = true;
    settleAuction();
  }

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

  addLog(`第 ${gameState.day} 天开场，大湾区各路货源开始上台。`);
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

  hideDealSpotlight();
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
  hideDealSpotlight();
  renderStepStatus();
  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('对手已入场。加价后，他们会决定是否跟。');
}

function bindPlayerActions() {
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      placePlayerBid(Number(button.dataset.bidAmount));
    });
  });

  document.querySelector('#passButton').addEventListener('click', passCurrentItem);
  document.querySelector('#nextItemButton').addEventListener('click', loadNextItem);
  document.querySelectorAll('[data-restart-game]').forEach((button) => {
    button.addEventListener('click', resetGame);
  });
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
    addLog('已恢复本地进度。', { skipSave: true });
    return;
  }

  renderLogs();
  startNewMarketDay(true);
  loadNextItem();
  addLog('对手已入场。加价后，他们会决定是否跟。');
}

initGame();
