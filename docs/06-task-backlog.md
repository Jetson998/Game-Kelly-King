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

- [x] Step 3.1 NPC 性格差异
  - 文件：`src/data/npcs.js`, `src/auction.js`, `src/main.js`, `src/styles.css`
  - 验收：新手、二手贩子、抬价托有明显不同的出价逻辑、偏好品类和日志表现
  - 步骤位置：阶段 3 / Step 3.1（1/3）
- [x] Step 3.2 NPC 心理提示
  - 文件：`src/main.js`, `src/index.html`, `src/styles.css`
  - 验收：NPC 面板根据品类偏好、价格压力和角色性格显示不剧透真实价值的心理提示
  - 步骤位置：阶段 3 / Step 3.2（2/3）
- [x] Step 3.3 市场热度
  - 文件：`src/index.html`, `src/main.js`, `src/auction.js`, `src/data/npcs.js`
  - 验收：每日随机热点会影响拍品出现概率、快速出售报价与 NPC 判断
  - 步骤位置：阶段 3 / Step 3.3（3/3）

## 阶段 4：体验优化

- [x] Step 4.1 UI 优化
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`
  - 验收：页面视觉层级更清晰，按钮反馈、库存盈亏、热点提示、拍卖状态和日志可读性改善
  - 步骤位置：阶段 4 / Step 4.1（1/3）
- [x] Step 4.2 数值平衡
  - 文件：`src/main.js`, `src/data/npcs.js`, `src/index.html`
  - 验收：起始资金、现金目标、库存上限、出售倍率、每日拍品价值池和 NPC 激进度完成首轮平衡
  - 步骤位置：阶段 4 / Step 4.2（2/3）
- [x] Step 4.3 localStorage 存档
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`
  - 验收：游戏状态会自动保存到 localStorage，刷新页面后可恢复 7 天挑战进度；重新开始会清除旧存档
  - 步骤位置：阶段 4 / Step 4.3（3/3）

### Step 4.3 localStorage 存档

步骤位置：阶段 4 / Step 4.3（3/3）

完成文件：

- `src/index.html`
- `src/main.js`
- `src/styles.css`
- `docs/06-task-backlog.md`

完成内容：

- 新增 `localStorage` 自动存档，保存天数、拍品进度、现金、库存、市场热点、当前拍品、NPC 状态、竞价状态、结算状态和日志
- 页面初始化时自动尝试恢复上次进度，刷新浏览器后可以继续当前 7 天挑战
- “重新开始”会清除旧存档并重开新局
- 新增存档状态提示，显示是否已自动保存或恢复
- 日志改为由游戏状态统一渲染，避免刷新后丢失最近操作记录

验证方式：

- 打开 `src/index.html`，进行一次出价或放弃后刷新页面，应恢复到刷新前进度
- 点击“重新开始”后刷新页面，应保持新局而不是旧局
- 若浏览器禁用 localStorage，应显示保存失败提示且不影响继续游玩

## 阶段 5：试玩验收

- [x] Step 5.1 浏览器试玩与问题修复
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：修复试玩中发现的重开入口、存档恢复校验、移动端布局等问题
  - 步骤位置：阶段 5 / Step 5.1（1/3）
- [x] Step 5.2 页面体验与移动端适配
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：玩家界面隐藏开发步骤标记，关键文案更短，小屏布局、按钮点击区域和对手提示更适合试玩
  - 步骤位置：阶段 5 / Step 5.2（2/3）
- [x] Step 5.3 发布前整理
  - 文件：`README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：补充玩法说明、当前版本状态和本地运行/验证方式
  - 步骤位置：阶段 5 / Step 5.3（3/3）

### Step 5.1 浏览器试玩与问题修复

步骤位置：阶段 5 / Step 5.1（1/3）

完成文件：

- `src/index.html`
- `src/main.js`
- `src/styles.css`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`

完成内容：

- 将页面步骤标记推进到阶段 5 / Step 5.1
- 发现结算前没有明显“重新开始”入口，新增拍卖面板底部的小型重开按钮
- 统一 `data-restart-game` 绑定，结算面板与拍卖面板的重开按钮都调用同一逻辑
- localStorage 恢复前增加必要字段校验，损坏或不完整存档会自动清除并重开
- 移动端下存档状态与重开按钮改为纵向排列，避免挤压

验证方式：

- 打开 `src/index.html`
- 任意操作后刷新，应恢复进度
- 点击拍卖面板底部“重新开始”，应清除旧存档并开新局
- 手动写入坏存档后刷新，应自动清除坏存档并继续游戏
- 小屏幕下存档状态与重开按钮不应挤在同一行

### Step 5.2 页面体验与移动端适配

步骤位置：阶段 5 / Step 5.2（2/3）

完成文件：

- `src/index.html`
- `src/main.js`
- `src/styles.css`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`

完成内容：

- 玩家界面隐藏“阶段 / Step”开发标记，改为显示当天第几件拍品
- 首页副标题改为更直接的目标提示：看估值、压价格、别上头，7 天做到目标现金
- NPC 面板改为“对手动向”，不再直接暴露心理价，改显示压力状态和更短的行为提示
- 日志、恢复存档、重新开始等文案收短，减少试玩噪音
- 放弃逻辑收尾更明确，玩家放弃后本轮会立即结算归属
- 小屏布局补充断点，按钮点击区域加大，拍卖区、库存区、日志区在移动端更易读

验证方式：

- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`
- `curl -fsS http://127.0.0.1:4173/` 能获取页面，页面包含 `捡漏之王`、`styles.css` 和 `main.js`
- 打开 `http://127.0.0.1:4173/`，大屏和窄屏下主要操作按钮都应可读、可点击

### 大湾区灰市捡漏风格改版

完成文件：

- `src/index.html`
- `src/main.js`
- `src/auction.js`
- `src/data/items.js`
- `src/data/npcs.js`

完成内容：

- 按体验反馈确认“半现代、贴近深圳/香港/澳门/广州现实货场”的改版方向
- 拍品品类改为华强北电子货、坂田仓库尾货、港货回流、澳门高端局散货、广州旧档口
- NPC 改为阿杰、老周、马哥，分别对应冲动散客、旧货行老板、拍场老油条
- 文案强调信息差、转手利润、做局风险和暴富冲动，同时避免网红化、武侠化和性别噱头

验证方式：

- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`


### Step 5.3 发布前整理

步骤位置：阶段 5 / Step 5.3（3/3）

完成文件：

- `README.md`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`
- `src/index.html`
- `src/main.js`
- `src/styles.css`
- `src/data/npcs.js`

完成内容：

- 确认方案 B：保留现实大湾区货源，叠加半现代江湖拍场气质
- 对手改为青衣少侠、铁算盘沈三、笑面狐胡不归，强化读人和抬价压力
- 增加首屏挑战目标与财富进度，玩家更清楚 7 天现金目标
- 增加玩法引导、拍品判断提示和成交鉴定高亮，减少试玩迷路
- 判断提示避免直接使用真实价值剧透，改为基于估值区间、风险词和稀有度
- README 补充玩法说明、当前版本状态、本地运行和验证方式

验证方式：

- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`
- `curl -fsS http://127.0.0.1:4173/` 能获取页面，页面包含 `捡漏之王`、`styles.css` 和 `main.js`
- 浏览器试玩：首屏能理解目标，出价/放弃/下一件/快速出售/刷新恢复均可用

## 当前推荐下一步

阶段 5 已完成。下一步可以做发布部署（GitHub Pages / Netlify）或继续新增内容（更多拍品、事件卡、音效和成就）。
