const gameState = {
  day: 1,
  totalDays: 7,
  cash: 1000,
  inventoryCount: 0,
  inventoryLimit: 3,
  hotCategory: '老相机',
  currentPrice: 200,
  leader: '暂无',
};

function formatCurrency(value) {
  return `￥${value.toLocaleString('zh-CN')}`;
}

function renderStaticState() {
  document.querySelector('#dayText').textContent = `第 ${gameState.day} 天 / 共 ${gameState.totalDays} 天`;
  document.querySelector('#cashText').textContent = formatCurrency(gameState.cash);
  document.querySelector('#inventoryText').textContent = `${gameState.inventoryCount} / ${gameState.inventoryLimit}`;
  document.querySelector('#hotCategoryText').textContent = gameState.hotCategory;
  document.querySelector('#currentPriceText').textContent = formatCurrency(gameState.currentPrice);
  document.querySelector('#leaderText').textContent = gameState.leader;
}

renderStaticState();
