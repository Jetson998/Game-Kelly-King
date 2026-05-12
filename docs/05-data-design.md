# 数据与数值设计

## 1. 拍品数据结构

```js
{
  id: string,
  name: string,
  category: string,
  condition: string,
  description: string,
  startPrice: number,
  realValue: number,
  risk: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic',
  tags: string[]
}
```

## 2. 品类

MVP 品类：

- 电子产品
- 相机
- 手表
- 收藏品
- 球鞋
- 手办
- 唱片
- 古董
- 神秘货

## 3. 稀有度倍率参考

```text
common：1.0
uncommon：1.5
rare：2.5
epic：5.0
```

MVP 可以先直接手写真实价值，不必动态计算。

## 4. 起拍价设计

起拍价大致为真实价值的 20%-80%。

特殊情况：

- 真捡漏：起拍价为真实价值 10%-30%
- 普通：起拍价为真实价值 40%-70%
- 坑货：起拍价可能高于真实价值

## 5. 模糊估值

玩家看到的是估值区间，不是真实价值。

```js
visibleEstimateMin = realValue * random(0.4, 0.8)
visibleEstimateMax = realValue * random(1.0, 1.8)
```

如果是高风险拍品，区间更宽。

## 6. NPC 心理价计算

基础公式：

```js
npcEstimate = realValue * random(1 - errorRate, 1 + errorRate)
npcMaxBid = npcEstimate * aggression
```

不同 NPC：

### 新手小白

```text
errorRate：0.7
aggression：0.9 - 1.3
特点：波动大，可能买贵
```

### 二手贩子

```text
errorRate：0.25
aggression：0.65 - 0.9
特点：理性，不太追高
```

### 抬价托

```text
errorRate：0.5
aggression：0.8 - 1.4
特点：前期积极，接近上限时突然撤
```

## 7. 加价幅度

MVP 固定按钮：

- +50
- +100
- +500

后续可根据当前价格动态调整。

## 8. 出售价格

```js
baseSalePrice = realValue
if category === hotCategory:
  multiplier = random(1.1, 1.35)
else:
  multiplier = random(0.85, 1.08)
salePrice = Math.round(baseSalePrice * multiplier)
```

## 9. 资金平衡初版

```text
初始现金：1000
第一天拍品真实价值：100 - 2000
中期拍品真实价值：500 - 5000
后期拍品真实价值：1000 - 12000
胜利目标：10000
```

目标是让玩家经常觉得：

- 买得起，但不敢乱买
- 有时必须放弃好东西
- 一次大捡漏可以翻盘

## 10. 风险设计

MVP 暂不实现真假货系统，只通过真实价值低于起拍价制造“坑”。

后续可加：

```js
isFake: boolean,
fakeValue: number,
authenticValue: number
```
