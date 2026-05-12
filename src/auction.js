function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function roundToBidStep(value) {
  return Math.max(50, Math.round(value / 50) * 50);
}

function createAuctionNpcs(item) {
  return AUCTION_NPCS.map((npc) => {
    const estimateNoise = randomBetween(1 - npc.errorRate, 1 + npc.errorRate);
    const aggression = randomBetween(npc.aggressionMin, npc.aggressionMax);
    const maxBid = roundToBidStep(item.realValue * estimateNoise * aggression);

    return {
      ...npc,
      maxBid,
      active: true,
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

function getNpcBidDecision(npc, currentPrice) {
  if (!npc.active) {
    return {
      shouldBid: false,
      reason: '已经退出竞价',
    };
  }

  const increment = getNextBidIncrement(currentPrice);
  const nextPrice = currentPrice + increment;

  if (nextPrice > npc.maxBid) {
    npc.active = false;
    return {
      shouldBid: false,
      reason: `心理价到顶，选择放弃`,
    };
  }

  return {
    shouldBid: true,
    increment,
    nextPrice,
    reason: `愿意追到 ${formatCurrency(nextPrice)}`,
  };
}
