# 金库 (GoldVault) — 黄金投资记账系统 · 功能文档

> 纯前端移动端 H5 应用，Vue 3 + Vite + Pinia 构建，零后端依赖，数据存储于浏览器 localStorage。
> 适配手机 Safari/Chrome，支持添加到桌面作为全屏 WebApp。

---

## 目录

- [1. 系统架构](#1-系统架构)
- [2. 页面与功能](#2-页面与功能)
- [3. 核心业务逻辑](#3-核心业务逻辑)
- [4. 数据模型](#4-数据模型)
- [5. 主题配色](#5-主题配色)
- [6. 数据持久化](#6-数据持久化)
- [7. 部署与配置](#7-部署与配置)

---

## 1. 系统架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) | 响应式 UI 框架 |
| 构建工具 | Vite 5 | 极速开发服务器与打包 |
| 路由 | Vue Router 4 (History Mode) | 6 个页面路由 + 登录鉴权守卫 |
| 状态管理 | Pinia 2 | 交易数据与主题状态分离管理 |
| 存储 | Browser localStorage | 5 个独立 key 持久化 |
| 样式 | CSS scoped + CSS Variables | 零 UI 组件库依赖 |

### 项目结构

```
goldh5/
├── index.html              # 入口 HTML（PWA meta + viewport 适配）
├── package.json            # 依赖管理
├── vite.config.js          # Vite 配置（别名 @ -> src/）
├── vercel.json             # Vercel 部署配置（SPA fallback）
├── FEATURES.md             # 本文档
├── public/
│   ├── manifest.json       # PWA 清单（display: fullscreen）
│   └── icons/
│       ├── icon-192.png    # PWA 图标 192px
│       └── icon-512.png    # PWA 图标 512px
└── src/
    ├── main.js             # 应用入口（挂载 Pinia + Router + 全局样式）
    ├── App.vue             # 根组件（RouterView + 登录跳转守卫）
    ├── router.js           # 路由定义 + beforeEach 登录鉴权
    ├── styles/
    │   ├── theme.js        # 5 种配色方案定义（金/翡翠绿/宝石蓝/玫瑰红/暗夜紫）
    │   └── global.css      # 全局样式重置 + CSS 变量 + 手机端适配
    ├── utils/
    │   ├── idgen.js        # UUID 生成器
    │   └── formatters.js   # 金额/克数/日期/盈亏格式化工具函数
    ├── stores/
    │   ├── themeStore.js       # 主题状态管理（切换 + localStorage 持久化）
    │   └── transactionStore.js # 交易数据管理（CRUD + FIFO 批次 + 盈亏计算）
    └── views/
        ├── LoginView.vue      # 登录页
        ├── HomeView.vue       # 首页仪表盘
        ├── BuyView.vue        # 买入黄金页
        ├── SellView.vue       # 卖出黄金页
        ├── RecordsView.vue    # 交易记录页
        └── SettingsView.vue   # 设置页
```

---

## 2. 页面与功能

### 2.1 登录页 (`/login`)

**功能**：身份验证，拦截未登录用户访问内页。

- 固定账号：`caohongni` / 密码：`199728`
- 暗色金风格背景 + 毛玻璃登录卡片
- "金库"大标题居中，输入框自动聚焦
- 登录成功后设置 `localStorage.isLoggedIn = 'true'`，跳转首页
- 密码错误提示"账号或密码错误，请重试"
- 路由 `beforeEach` 守卫拦截：未登录时重定向至 `/login`

### 2.2 首页仪表盘 (`/`)

**功能**：展示黄金持仓汇总信息与快捷操作入口。

**① 顶部摘要卡片（持仓总览）**
- 总计买入克数
- 总投入金额（所有买入记录之和）
- 均价（总投入 ÷ 所有买入克数）
- 持有克数（买入总克数 − 已卖出克数）
- 已实现盈亏（卖出总金额 − 对应买入成本）
- 浮动盈亏（按最新成交价估算持仓市值 − 持仓成本）
- 总收益率（已实现盈亏 + 浮动盈亏 ÷ 总投入 × 100%）
- 交易次数（买卖记录总数）
- 当前市值（最新买入价 × 持仓克数）

**② 持有批次列表**
- 按买入时间升序显示每个持有批次的：
  - 买入价格（元/克）
  - 当前持有克数
  - 买入日期
  - 持有部分对应金额

**③ 最近操作**
- 最近 5 条交易记录（按时间倒序）
- 每条显示：类型标记（买入/卖出）、日期、克数、金额
- 右上角"查看全部 →"跳转到交易记录页

**④ 操作按钮**
- **买入** — 跳转到买入页
- **卖出** — 跳转到卖出页（持仓为 0 时禁用）

### 2.3 买入黄金页 (`/buy`)

**功能**：记录一笔黄金买入交易。

**表单字段**
- **日期** — 日期选择器，默认当前日期
- **价格（元/克）** — 数字输入，支持 2 位小数
- **克数** — 数字输入，支持 3 位小数
- **自动计算总价** — 开关（默认开启），开启后总价 = 价格 × 克数；关闭后可手动输入总价
- **总价** — 自动计算时只读显示；手动模式可编辑
- **备注** — 可选文本，最长 200 字符

**校验规则**
- 日期必填
- 价格必须大于 0
- 克数必须大于 0
- 手动总价必须大于 0

**保存流程**
1. 校验通过后调用 `transactionStore.addBuyTransaction()`
2. 生成 UUID，type='buy'
3. 金额以分（cents）存储
4. 保存后自动跳转首页

### 2.4 卖出黄金页 (`/sell`)

**功能**：记录黄金卖出交易，按 FIFO （先进先出）原则从持仓批次中扣减。

**基本信息**
- **日期** — 日期选择器，默认当前日期
- **价格（元/克）** — 数字输入
- **克数** — 想要卖出的总克数

**批号选择（Stepper 模式）**
- 按时间顺序列出所有持有批次
- 每个批次显示：买入价格、持有克数、买入日期
- 每个批次旁有 `−` / `+` 按钮调整从该批次卖出的克数
- 按 `+` 时：从当前批次剩余量中扣除，依次填满最早批次（FIFO 自动逻辑）
- 按 `−` 时：减少当前批次，后续批次自动回填

**"预扣/实际"模式切换**
- **预扣模式**：输入希望卖出的总克数，系统自动按 FIFO 分配各批次的扣减量，用户可微调
- **实际模式**：用户逐一指定各批次的卖出克数，合计为总卖出克数

**手续费**
- 可输入每克手续费（ITC），默认 0
- 总手续费 = 手续费单价 × 卖出总克数

**保存流程**
1. 校验各批次扣减不超过持有量
2. 计算总成本（各批次卖出克数 × 对应买入单价）
3. 计算盈亏 = 卖出总金额 − 总成本
4. 生成 JSON 形式的 `sellBatchData` 记录每个批次来源
5. 保存后跳转首页

### 2.5 交易记录页 (`/records`)

**功能**：浏览、筛选、编辑、删除全部交易记录。

**筛选功能**
- **类型筛选** — 胶囊按钮切换："全部" / "买入" / "卖出"
- **日期筛选** — 点击日期筛选按钮展开 DatePicker 起止日期
- 筛选结果合计：显示筛选范围内的买入总克数、卖出总克数、净持仓变动

**列表展示**
- 按时间倒序排列
- 每条记录显示：
  - 左侧：类型标签（"买入"绿色 / "卖出"红色）+ 日期 + 克数
  - 右侧：单价（元/克）+ 总金额
- 卖出记录支持展开查看批次明细：点击后显示从哪些买入批次中扣除了多少克

**操作**
- **长按/点击编辑** — 弹出编辑弹窗（sheet 模式），可修改日期、价格、克数、总价、备注
- **删除** — 点击删除按钮弹出确认对话框，确认后删除记录
- 编辑/删除后数据自动重新计算所有汇总（已实现盈亏、持仓等）

### 2.6 设置页 (`/settings`)

**功能**：主题切换与应用信息。

**① 主题切换**
- 5 种配色方案以卡片形式展示：
  - **金色** (gold) — `#D4AF37` / `#F5D76E`（默认）
  - **翡翠绿** (emerald) — `#2ECC71` / `#58D68D`
  - **宝石蓝** (sapphire) — `#3498DB` / `#5DADE2`
  - **玫瑰红** (rose) — `#E91E63` / `#F06292`
  - **暗夜紫** (midnight) — `#8E44AD` / `#AF7AC5`
- 点击卡片立即切换主题，保存至 `localStorage.gold_theme`
- 当前主题卡片有醒目边框标识

**② 关于**
- 版本号
- 技术栈：Vue 3 + Vite + Pinia 纯前端
- 功能说明：数据存浏览器，零后端

---

## 3. 核心业务逻辑

### 3.1 FIFO 批次管理

所有买入交易按时间顺序生成"批次块"，卖出时按先进先出原则扣减。

**数据结构**
```
买入批次块: { buyTransactionId, date, pricePerGram, grams, totalCost }
卖出批次映射: { buyTransactionId → consumedGrams }
```

**持有批次计算**
1. 所有买入交易按日期升序排列
2. 遍历所有卖出交易的 `sellBatchData`（JSON 记录每个批次扣减克数），构建消耗字典
3. 对每个买入批次：持有量 = 买入克数 - 已消耗克数
4. 剩余 > 0.001g 的批次列入持有列表

**卖出分配**
- 用户输入卖出总克数
- 从最早买入批次开始依次扣减
- 每个批次支持部分卖出
- 卖出记录保存完整的批次扣减明细

### 3.2 盈亏计算

| 指标 | 计算方式 |
|------|----------|
| 已实现盈亏 | 所有卖出记录 `profitCents` 之和 |
| 持仓均价 | 总投资 ÷ 总买入克数（含已卖出部分） |
| 当前市值 | 最新买入价 × 持仓克数 |
| 浮动盈亏 | 当前市值 − 持仓均价 × 持仓克数 |
| 总收益率 | (已实现盈亏 + 浮动盈亏) ÷ 总投资 × 100% |

> 注意：均价分母为所有买入克数（`totalBuyGrams`），而非当前持仓克数（`heldGrams`）。因为用户可能在部分卖出后均价不变，这样更符合黄金投资的直观理解。

### 3.3 金额精度

所有金额以"分（cents）"为单位，存储为整数，避免浮点误差。

| 存储 | 显示 | 转换函数 |
|------|------|----------|
| `totalCents: number` | `¥1,234.00` | `formatYuan(cents)` |
| `priceCents: number` | `¥680.00/g` | `formatPrice(cents)` |
| `grams: number` | `10.000g` | `formatGrams(grams)` |
| 元输入转存储 | — | `centsFromYuan(yuan)` |

---

## 4. 数据模型

### 4.1 Transaction（交易记录）

```typescript
interface Transaction {
  id: string             // UUID 格式
  type: 'buy' | 'sell'   // 交易类型
  date: string           // ISO 日期，如 '2024-01-15'
  priceCents: number     // 单价，分
  grams: number          // 克数
  totalCents: number     // 总金额，分
  note: string           // 备注，可选
  sellProfitCents: number | null   // 卖出盈亏，仅卖出交易有
  sellBatchData: string | null     // JSON: SellBatchInfo[]，仅卖出交易有
  createdAt: string      // ISO 时间戳
}

interface SellBatchInfo {
  buyTransactionId: string  // 对应的买入记录 ID
  grams: number             // 从该批次卖出的克数
  costCents: number         // 该批次买入成本，分
}
```

### 4.2 HeldBatch（持有批次）

```typescript
interface HeldBatch {
  id: string           // 买入交易 ID
  transaction: Transaction  // 买入记录
  heldGrams: number    // 当前持有克数
  heldTotalCents: number    // 持有部分对应成本，分
}
```

### 4.3 localStorage key 对照

| 键名 | 类型 | 用途 |
|------|------|------|
| `gold_transactions` | JSON string | 全部交易记录数组 |
| `gold_theme` | string | 当前主题 key（gold/emerald/sapphire/rose/midnight） |
| `isLoggedIn` | string ('true') | 登录状态标记 |

---

## 5. 主题配色

每个主题包含 6 个属性：

```typescript
interface Theme {
  name: string       // 中文名称
  accent: string     // 主色（头部渐变、按钮、强调色）
  accentLight: string // 浅色辅色（渐变终点）
  positive: string   // 盈利/买入颜色（绿色系）
  negative: string   // 亏损/卖出颜色（红色系）
  bg: string         // 浅色背景色
  darkBg: string     // 深色背景色（登录页用）
  icon: string       // 图标标识
}
```

5 种配色均适配亮色/暗色场景，通过 CSS Variables 和 `v-bind()` 响应式应用到所有组件。

---

## 6. 数据持久化

### 存储方案

所有数据存储于浏览器 `localStorage`，零后端依赖。

- **读取时机**：每个页面组件挂载时（`onMounted`）调用 `loadTransactions()`
- **写入时机**：每次 CRUD 操作后立即调用 `saveTransactions()`
- **导出/备份**：可通过浏览器开发者工具 > Application > Local Storage 查看完整数据

### PWA 全屏 WebApp

- `<meta name="apple-mobile-web-app-capable" content="yes">` — Safari 全屏
- `manifest.json` 配置 `display: "fullscreen"` + `orientation: "portrait"`
- iOS 用户：Safari 分享按钮 → "添加到主屏幕" → 全屏体验
- App 图标：192px / 512px SVG 渲染图标

### 离线使用

应用完全静态（纯 HTML + JS + CSS），首次加载后浏览器缓存所有资源。
即使无网络连接，已缓存页面仍可正常打开和使用，所有交易数据存储在 localStorage 中。

---

## 7. 部署与配置

### Vercel 部署

`vercel.json` 配置了 SPA 路由重写：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

部署步骤：
1. 安装 Vercel CLI 或关联 GitHub 仓库
2. 构建输出目录设为 `dist`
3. 自动识别 Vue 项目，无需额外配置

### 本地开发

```bash
cd goldh5
npm install
npm run dev     # 开发服务器，默认 http://localhost:3001
npm run build   # 生产构建，输出 dist/
```

### 环境要求

- Node.js >= 18
- 现代浏览器（Chrome / Safari / Edge / 手机浏览器均可）
- iOS Safari 12+ 支持 PWA 添加到主屏幕

---

## 附录：与原 iOS 版本的差异

| 特性 | 原 iOS（SwiftUI/SwiftData） | 当前 H5 版本 |
|------|-----------------------------|--------------|
| 框架 | SwiftUI + SwiftData | Vue 3 + Pinia + localStorage |
| 平台 | iOS 17+ | 所有现代浏览器 |
| 安装方式 | App Store / IPA | 浏览器打开 / PWA 添加到桌面 |
| 数据存储 | SwiftData (SQLite) | 浏览器 localStorage |
| 后端依赖 | 无 | 无 |
| 主题 | ThemeManager 环境变量 | Pinia themeStore + CSS v-bind |
| 状态管理 | @Observable | Pinia |
| 部署 | Xcode Archive | Vercel / 静态托管 |
