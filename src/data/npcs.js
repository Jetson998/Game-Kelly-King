const AUCTION_NPCS = [
  {
    id: 'rookie',
    name: '新手小白',
    style: '容易上头，估值波动很大。',
    errorRate: 0.7,
    aggressionMin: 0.9,
    aggressionMax: 1.3,
  },
  {
    id: 'dealer',
    name: '二手贩子',
    style: '估值较准，利润不够就撤。',
    errorRate: 0.25,
    aggressionMin: 0.65,
    aggressionMax: 0.9,
  },
  {
    id: 'shill',
    name: '抬价托',
    style: '前期积极推价，接近上限时突然装死。',
    errorRate: 0.5,
    aggressionMin: 0.8,
    aggressionMax: 1.4,
  },
];
