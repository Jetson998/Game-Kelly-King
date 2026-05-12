const gameState = {
  phase: 1,
  step: '1.2',
  stepIndex: 2,
  phaseStepTotal: 5,
  stepName: '加入拍品数据',
  day: 1,
  totalDays: 7,
  cash: 1000,
  inventoryCount: 0,
  inventoryLimit: 3,
  hotCategory: '相机',
  currentPrice: 0,
  leader: '暂无',
  currentItem: null,
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
  document.querySelector('#stepHint').textContent = `当前步骤：阶段 ${gameState.phase} / Step ${gameState.step}（${gameState.stepIndex}/${gameState.phaseStepTotal}）${gameState.stepName}；按钮仍暂不可用。`;
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

function renderStaticState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day} 天 / 共 ${gameState.totalDays} 天`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventoryCount} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
}

function initGame() {
  if (!Array.isArray(AUCTION_ITEMS) || AUCTION_ITEMS.length === 0) {
    throw new Error('拍品数据为空，无法开始拍卖。');
  }

  gameState.currentItem = pickRandomItem(AUCTION_ITEMS);
  gameState.currentPrice = gameState.currentItem.startPrice;

  renderStepStatus();
  renderItem(gameState.currentItem);
  renderStaticState();
  addLog(`随机抽到拍品：${gameState.currentItem.name}。真实价值已隐藏，等鉴定阶段再揭晓。`);
}

initGame();
