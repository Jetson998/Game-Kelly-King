const INITIAL_GAME_STATE = {
  phase: 3,
  step: '3.1',
  stepIndex: 1,
  phaseStepTotal: 3,
  stepName: 'NPC 性格差异',
  day: 1,
  totalDays: 7,
  lotsPerDay: 5,
  lotsSeenToday: 0,
  targetCash: 10000,
  cash: 1000,
  inventory: [],
  inventoryLimit: 3,
  hotCategory: '相机',
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
  npcs: [],
  seenItemIds: [],
  hasPassed: false,
  auctionEnded: false,
  settlementDone: false,
  gameOver: false,
};

const gameState = { ...INITIAL_GAME_STATE, inventory: [], npcs: [], seenItemIds: [] };

function formatCurrency(value) {
  return `￥${value.toLocaleString('zh-CN')}`;
}

function pickRandomItem(items) {
  const availableItems = items.filter((item) => !gameState.seenItemIds.includes(item.id));
  const pool = availableItems.length > 0 ? availableItems : items;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function renderStepStatus() {
  document.querySelector('#stepText').textContent = `阶段 ${gameState.phase} · Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）`;
  document.querySelector('#stepHint').textContent = `当前步骤：阶段 ${gameState.phase} / Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）${gameState.stepName}。目标：7 天结束时现金达到 ${formatCurrency(gameState.targetCash)}。`;
}

function renderItem(item) {
  document.querySelector('#itemName').textContent = item.name;
  document.querySelector('#itemMeta').textContent = `品类：${item.category} · 品相：${item.condition} · 稀有度：${item.rarity}`;
  document.querySelector('#itemDescription').textContent = item.description;
  document.querySelector('#itemTags').innerHTML = [
    `起拍价：${formatCurrency(item.startPrice)}`,
    `模糊估值：${formatCurrency(item.estimateMin)} - ${formatCurrency(item.estimateMax)}`,
    `风险：${item.risk}`,
    ...item.tags,
  ].map((tag) => `<span>${tag}</span>`).join('');
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
        <small>${npc.tell}</small>
      </li>
    `;
  }).join('');
}

function getRandomMultiplier(min, max) {
  return min + Math.random() * (max - min);
}

function calculateSalePrice(item) {
  const multiplier = item.category === gameState.hotCategory
    ? getRandomMultiplier(1.1, 1.35)
    : getRandomMultiplier(0.85, 1.08);

  return Math.round(item.realValue * multiplier);
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

function renderInventory() {
  const inventoryList = document.querySelector('#inventoryList');
  if (gameState.inventory.length === 0) {
    inventoryList.innerHTML = '<li>暂无库存。</li>';
    return;
  }

  inventoryList.innerHTML = gameState.inventory.map((entry, index) => `
    <li>
      <div class="inventory-item-info">
        <strong>${entry.item.name}</strong>
        <span>成交价：${formatCurrency(entry.purchasePrice)} · 鉴定价：${formatCurrency(entry.item.realValue)} · ${getProfitText(entry)}</span>
        <span>快速出售报价：${formatCurrency(entry.salePrice)}</span>
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

function addLog(text) {
  const logList = document.querySelector('#logList');
  const item = document.createElement('li');
  item.textContent = text;
  logList.append(item);
}

function renderPlayerActions() {
  const inventoryFull = gameState.inventory.length >= gameState.inventoryLimit;
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    const bidAmount = Number(button.dataset.bidAmount);
    const nextPrice = gameState.currentPrice + bidAmount;
    button.disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded || inventoryFull || nextPrice > gameState.cash;
  });

  document.querySelector('#passButton').disabled = gameState.gameOver || gameState.hasPassed || gameState.auctionEnded;

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
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
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

function advanceDayIfNeeded() {
  if (gameState.lotsSeenToday < gameState.lotsPerDay) {
    return;
  }

  gameState.day += 1;
  gameState.lotsSeenToday = 0;
  addLog(`第 ${gameState.day} 天开场，新的摊位开始上货。`);
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
  gameState.npcs = createAuctionNpcs(gameState.currentItem);
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

function endGame() {
  if (gameState.gameOver) {
    return;
  }

  gameState.gameOver = true;
  gameState.auctionEnded = true;

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

  addLog(`7 天挑战结束：最终现金 ${formatCurrency(gameState.cash)}，最终资产 ${formatCurrency(finalAssets)}。`);
}

function resetGame() {
  Object.assign(gameState, {
    ...INITIAL_GAME_STATE,
    inventory: [],
    npcs: [],
    seenItemIds: [],
  });

  document.querySelector('#logList').innerHTML = `
    <li>欢迎来到跳蚤市场，第一件拍品已经上台。</li>
    <li>当前步骤：阶段 ${gameState.phase} / Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）${gameState.stepName}。</li>
  `;
  document.querySelector('#resultPanel').hidden = true;
  renderStepStatus();
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
  loadNextItem();
  addLog('NPC 已入场。你每次出价后，他们会按心理价决定是否跟价。');
}

initGame();
