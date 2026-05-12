const gameState = {
  phase: 1,
  step: '1.3',
  stepIndex: 3,
  phaseStepTotal: 5,
  stepName: '实现玩家出价',
  day: 1,
  totalDays: 7,
  cash: 1000,
  inventoryCount: 0,
  inventoryLimit: 3,
  hotCategory: '相机',
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
  hasPassed: false,
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
    button.disabled = gameState.hasPassed || nextPrice > gameState.cash;
  });

  document.querySelector('#passButton').disabled = gameState.hasPassed;
}

function renderState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day} 天 / 共 ${gameState.totalDays} 天`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventoryCount} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
  renderPlayerActions();
}

function placePlayerBid(increment) {
  if (gameState.hasPassed) {
    addLog('你已经放弃这件拍品，不能继续出价。');
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
}

function passCurrentItem() {
  gameState.hasPassed = true;
  gameState.leader = '暂无';
  addLog(`你放弃了「${gameState.currentItem.name}」。下一步会加入 NPC 出价与成交流程。`);
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

  renderStepStatus();
  renderItem(gameState.currentItem);
  bindPlayerActions();
  renderState();
  addLog(`随机抽到拍品：${gameState.currentItem.name}。真实价值已隐藏，等鉴定阶段再揭晓。`);
  addLog('你现在可以加价或放弃；本步骤暂不加入 NPC 竞价。');
}

initGame();
