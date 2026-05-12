# 任务清单

## 阶段 0：项目准备

- [x] Step 0.1 建立项目文件夹与文档
- [x] Step 0.2 初步确定技术路线：HTML/CSS/JS

## 阶段 1：最小可玩原型

- [x] Step 1.1 创建静态页面骨架
  - 文件：`src/index.html`, `src/styles.css`, `src/main.js`
  - 验收：页面能打开，显示标题、现金、天数、拍品区域和按钮

- [x] Step 1.2 加入拍品数据
  - 文件：`src/data/items.js`
  - 验收：页面能随机显示一个拍品
  - 步骤位置：阶段 1 / Step 1.2（2/5）

- [x] Step 1.3 实现玩家出价
  - 文件：`src/main.js`
  - 验收：玩家能加价/放弃，现金不足不能继续加价
  - 步骤位置：阶段 1 / Step 1.3（3/5）

- [x] Step 1.4 实现简单 NPC 出价
  - 文件：`src/data/npcs.js`, `src/auction.js`
  - 验收：NPC 会参与竞价，拍品能成交
  - 步骤位置：阶段 1 / Step 1.4（4/5）

- [x] Step 1.5 实现成交与库存
  - 文件：`src/main.js`
  - 验收：玩家拍下后扣钱，物品进入库存
  - 步骤位置：阶段 1 / Step 1.5（5/5）

## 阶段 2：鉴定与出售

- [x] Step 2.1 实现鉴定结果
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`
  - 验收：拍下后显示真实价值与赚亏预估
  - 步骤位置：阶段 2 / Step 2.1（1/3）

- [x] Step 2.2 实现快速出售
  - 文件：`src/main.js`, `src/styles.css`
  - 验收：库存物品可快速出售，现金增加并移除库存
  - 步骤位置：阶段 2 / Step 2.2（2/3）

- [x] Step 2.3 实现 7 天挑战
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`
  - 验收：每天 5 件拍品，7 天后结算，达到现金目标显示胜利
  - 步骤位置：阶段 2 / Step 2.3（3/3）

## 阶段 3：增强趣味

- [ ] Step 3.1 NPC 性格差异
- [ ] Step 3.2 NPC 心理提示
- [ ] Step 3.3 市场热度

## 阶段 4：体验优化

- [ ] Step 4.1 UI 优化
- [ ] Step 4.2 数值平衡
- [ ] Step 4.3 localStorage 存档

## 当前推荐下一步

继续：

```text
阶段 3 / Step 3.1（1/3）NPC 性格差异
```

让不同 NPC 的行为更明显，例如新手更容易上头、二手贩子更保守、抬价托更像故意推价。