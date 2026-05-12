const gameState = {
  phase: 1,
  step: '1.4',
  stepIndex: 4,
  phaseStepTotal: 5,
  stepName: '实现简单 NPC 出价',
  day: 1,
  totalDays: 7,
  cash: 1000,
  inventoryCount: 0,
  inventoryLimit: 3,
  hotCategory: '相机',
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
  npcs: [],
  hasPassed: false,
  auctionEnded: false,
};

function formatCurrency(value) {
  return `￥${value.toLocaleString('zh-CN')}`;
}

function pickRandomItem(items) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function renderStepStatus() {
  document.querySelector('#stepText').textContent = `阶段 ${gameState.phase} · Step ${gameState.step} / 1.5`;
  document.querySelector('#stepHint').textContent = `当前步骤：阶段 ${gameState.phase} / Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）${gameState.stepName}。`;
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
    return `
      <li>
        <strong>${npc.name}</strong>
        <span>${npc.style} · ${status}</span>
      </li>
    `;
  }).join('');
}

function addLog(text) {
  const logList = document.querySelector('#logList');
  const item = document.createElement('li');
  item.textContent = text;
  logList.append(item);
}

function renderPlayerActions() {
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    const bidAmount = Number(button.dataset.bidAmount);
    const nextPrice = gameState.currentPrice + bidAmount;
    button.disabled = gameState.hasPassed || gameState.auctionEnded || nextPrice > gameState.cash;
  });

  document.querySelector('#passButton').disabled = gameState.hasPassed || gameState.auctionEnded;
}

function renderState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day} 天 / 共 ${gameState.totalDays} 天`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventoryCount} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
  renderNpcs();
  renderPlayerActions();
}

function maybeEndAuction() {
  const activeNpcs = gameState.npcs.filter((npc) => npc.active);
  if (activeNpcs.length > 0) {
    return;
  }

  gameState.auctionEnded = true;
  if (gameState.leader === '你') {
    addLog(`本轮竞价暂时由你领先：${formatCurrency(gameState.currentPrice)}。成交和入库将在 Step 1.5 实现。`);
  } else if (gameState.leader !== '暂无') {
    addLog(`${gameState.leader} 暂时拿下这件拍品。成交流程将在 Step 1.5 实现。`);
  } else {
    addLog('所有人都放弃了这件拍品。');
  }
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
    const decision = getNpcBidDecision(npc, gameState.currentPrice);

    if (!decision.shouldBid) {
      addLog(`${npc.name}：${decision.reason}。`);
      continue;
    }

    gameState.currentPrice = decision.nextPrice;
    gameState.leader = npc.name;
    addLog(`${npc.name} 加价到 ${formatCurrency(gameState.currentPrice)}。`);
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

function bindPlayerActions() {
  document.querySelectorAll('[data-bid-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      placePlayerBid(Number(button.dataset.bidAmount));
    });
  });

  document.querySelector('#passButton').addEventListener('click', passCurrentItem);
}

function initGame() {
  if (!Array.isArray(AUCTION_ITEMS) || AUCTION_ITEMS.length === 0) {
    throw new Error('拍品数据为空，无法开始拍卖。');
  }

  gameState.currentItem = pickRandomItem(AUCTION_ITEMS);
  gameState.currentPrice = gameState.currentItem.startPrice;
  gameState.npcs = createAuctionNpcs(gameState.currentItem);

  renderStepStatus();
  renderItem(gameState.currentItem);
  bindPlayerActions();
  renderState();
  addLog(`随机抽到拍品：${gameState.currentItem.name}。真实价值已隐藏，等鉴定阶段再揭晓。`);
  addLog('NPC 已入场。你每次出价后，他们会按心理价决定是否跟价。');
}

initGame();
