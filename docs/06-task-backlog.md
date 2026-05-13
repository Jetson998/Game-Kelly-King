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


## 阶段 6：内容扩展

- [x] Step 6.1 每日拍场事件
  - 文件：`src/index.html`, `src/main.js`, `src/auction.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：每天随机出现一个“拍场风声”，影响快速出售报价和 NPC 出价激进度；事件展示在主流程上方，存档可恢复事件状态
  - 步骤位置：阶段 6 / Step 6.1（1/3）
- [x] Step 6.2 更多拍品与风险词
  - 文件：`src/data/items.js`, `src/main.js`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：扩展拍品池到 30 件，新增更清晰的高风险/高波动样本，并让判断提示识别更多风险词
  - 步骤位置：阶段 6 / Step 6.2（2/3）
- [x] Step 6.3 成就与复盘
  - 文件：`src/main.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：挑战结束后给出成交统计、称号、最佳捡漏、最佳变现、最亏打眼和账面净利复盘
  - 步骤位置：阶段 6 / Step 6.3（3/3）

## 当前推荐下一步

当前推荐下一步：阶段 9 已启动，Step 9.1 战绩分享文案已完成。下一步建议部署 GitHub Pages / Netlify，或继续 Step 9.2 做发布页与移动端落地优化。


## 阶段 7：体验增强

- [x] Step 7.1 复盘策略建议
  - 文件：`src/main.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：挑战结束后根据现金、资产、库存、打眼次数和热点利用情况给出下局建议
  - 步骤位置：阶段 7 / Step 7.1（1/3）
- [x] Step 7.2 落槌与成交动画
  - 文件：`src/index.html`, `src/main.js`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：竞价、收手、落槌、成交、流拍和变现有轻量视觉反馈，并尊重 `prefers-reduced-motion`
  - 步骤位置：阶段 7 / Step 7.2（2/3）
- [x] Step 7.3 音效开关
  - 文件：`src/index.html`, `src/main.js`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：提供可关闭的点击、加价、落槌、结算音效，设置会随 localStorage 保存
  - 步骤位置：阶段 7 / Step 7.3（3/3）


## 阶段 8：新手引导与可视化教学

- [x] Step 8.1 首次进入教程
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：首次进入显示 3 步新手引导，说明现金目标、判断提示和拍下后处理；关闭后用 localStorage 记住，设置里可重新打开
  - 步骤位置：阶段 8 / Step 8.1（1/3）
- [x] Step 8.2 视觉标注与焦点高亮
  - 文件：`src/main.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：引导步骤能高亮对应区域，玩家更清楚该看哪里
  - 步骤位置：阶段 8 / Step 8.2（2/3）
- [x] Step 8.3 首局节奏保护
  - 文件：`src/main.js`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：首局前 1-2 件货更适合作为教学样本，降低一上来随机到高风险陷阱的挫败感
  - 步骤位置：阶段 8 / Step 8.3（3/3）


### Step 8.3 首局节奏保护

步骤位置：阶段 8 / Step 8.3（3/3）

完成文件：

- `src/main.js`
- `README.md`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`

完成内容：

- 新增首局前 2 件教学拍品池，优先抽取低额、风险清楚、适合练手的样本
- 第一件偏向热身货，第二件继续小额试水，避免新玩家开局就遇到高价重仓或强陷阱
- 教学拍品仍遵守不重复出现，并会优先匹配当日热点里的候选货
- 上台日志增加短提示，说明这是练手节奏保护
- 存档 key 升到 `kelly-king-save-v11`，同步当前阶段标记到 8.3

验证方式：

- 新开一局，第 1-2 件应从教学候选池中出现，而不是直接抽到高价重仓或强陷阱货
- 第 3 件后恢复正常随机拍品池
- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`



### Step 8.2 视觉标注与焦点高亮

步骤位置：阶段 8 / Step 8.2（2/3）

完成文件：

- `src/main.js`
- `src/styles.css`
- `README.md`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`

完成内容：

- 新手引导每一步绑定一个页面焦点区域：状态栏、判断提示、底部主操作区
- 引导打开时页面对应区域会高亮描边，并显示一句短标签告诉玩家“看哪里”
- 引导卡片改为底部浮层，避免完全挡住被教学区域
- 关闭或跳过引导时会清除焦点状态，避免高亮残留
- 存档 key 升到 `kelly-king-save-v10`，同步当前阶段标记到 8.2

验证方式：

- 首次进入或点击设置里的“新手引导”，三步教程应依次高亮状态栏、判断提示、底部主操作区
- 点击上一步/下一步，高亮区域应跟随切换
- 跳过或开始拍卖后，高亮与遮罩应消失
- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`

## 阶段 9：发布与传播体验

- [x] Step 9.1 战绩分享文案
  - 文件：`src/index.html`, `src/main.js`, `src/styles.css`, `README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：挑战结束后生成可复制战绩文案，包含称号、现金、最终资产、成交统计和最佳捡漏
  - 步骤位置：阶段 9 / Step 9.1（1/3）
- [ ] Step 9.2 发布页与移动端落地
  - 文件：`src/index.html`, `src/styles.css`, `README.md`
  - 验收：首页/README 更适合外部试玩入口，移动端首屏更像可直接开始的小游戏
  - 步骤位置：阶段 9 / Step 9.2（2/3）
- [ ] Step 9.3 试玩反馈收集方案
  - 文件：`README.md`, `docs/06-task-backlog.md`, `docs/07-progress.md`
  - 验收：整理试玩反馈问题清单与下一轮迭代方向
  - 步骤位置：阶段 9 / Step 9.3（3/3）


### Step 9.1 战绩分享文案

步骤位置：阶段 9 / Step 9.1（1/3）

完成文件：

- `src/index.html`
- `src/main.js`
- `src/styles.css`
- `README.md`
- `docs/06-task-backlog.md`
- `docs/07-progress.md`

完成内容：

- 结算页新增“战绩分享”卡，自动生成适合截图/转发的短文案
- 分享文案包含本局称号、最终现金、最终资产、成交数、已变现数和最佳捡漏
- 设置菜单与结算页新增“复制战绩”按钮；未结算时会提示先打完一局
- 复制优先使用 Clipboard API，并保留 textarea 手动复制兜底
- 存档 key 升到 `kelly-king-save-v12`，当前阶段标记更新到 9.1

验证方式：

- 7 天结束后结算页应出现“战绩分享”卡和只读分享文案
- 点击“复制战绩”应复制分享文案；未结算时点击应提示“打完一局后会生成战绩”
- `node --check src/main.js src/auction.js src/data/items.js src/data/npcs.js`
- `git diff --check`
