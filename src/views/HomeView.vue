<template>
  <div class="page" :style="{ background: themeStore.currentTheme.bg, color: themeStore.currentTheme.text }">
    <div class="content">
      <!-- Header -->
      <div class="header" :style="{ color: themeStore.currentTheme.accent }">
        <span class="header-icon">&#9733;</span>
        <span class="header-title">总览</span>
      </div>

      <!-- Scrollable content -->
      <div class="scroll-area">
        <!-- 1. Top Holding Card -->
        <div class="card holding-card">
          <div class="card-gradient-bar" :style="{ background: themeStore.currentTheme.accent }"></div>
          <div class="card-body">
            <div class="holding-label">
              <span class="label-icon">&#9679;</span>
              <span class="label-text" :style="{ color: themeStore.currentTheme.accent }">当前持仓</span>
            </div>
            <div class="holding-grams" :style="{ color: themeStore.currentTheme.accent }">
              {{ formatGrams(transactionStore.heldGrams) }}
            </div>
            <div class="holding-meta" v-if="transactionStore.totalBuyGrams > 0">
              <div class="meta-item">
                <span class="meta-label">总投入</span>
                <span class="meta-value">{{ formatYuan(transactionStore.totalInvestmentCents) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">均价</span>
                <span class="meta-value" v-if="transactionStore.averageCostCents !== null">
                  {{ formatPrice(transactionStore.averageCostCents) }}
                </span>
                <span class="meta-value" v-else>--</span>
              </div>
            </div>
            <div class="latest-price" v-if="transactionStore.latestPriceCents !== null">
              <span class="price-label">最新价</span>
              <span class="price-value">{{ formatPrice(transactionStore.latestPriceCents) }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card" v-for="item in metrics" :key="item.label">
            <div class="metric-icon" :style="{ color: themeStore.currentTheme.accent }">{{ item.icon }}</div>
            <div
              class="metric-value"
              :style="{
                color: item.isProfit !== undefined
                  ? (item.valueNumeric >= 0 ? themeStore.currentTheme.positive : themeStore.currentTheme.negative)
                  : themeStore.currentTheme.text
              }"
            >
              {{ item.value }}
            </div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </div>

        <!-- 3. Held Batches Section -->
        <div class="batches-section" v-if="transactionStore.heldBatches.length > 0">
          <div class="section-title">
            <span class="section-icon">&#9776;</span>
            <span>持仓明细</span>
          </div>
          <div
            class="card batch-card"
            v-for="batch in transactionStore.heldBatches"
            :key="batch.id"
          >
            <div class="card-gradient-bar-short" :style="{ background: themeStore.currentTheme.accent }"></div>
            <div class="batch-body">
              <div class="batch-left">
                <div class="batch-price">{{ formatPrice(batch.transaction.priceCents) }}</div>
                <div class="batch-grams">{{ formatGrams(batch.heldGrams) }}</div>
              </div>
              <div class="batch-right">
                <div class="batch-date">{{ formatDate(batch.transaction.date) }}</div>
                <div class="batch-total">{{ formatYuan(batch.heldTotalCents) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Action Buttons -->
        <div class="action-buttons">
          <button
            class="btn btn-buy"
            :style="{ background: themeStore.themeGradient }"
            @click="goBuy"
          >
            买入
          </button>
          <button
            class="btn btn-sell"
            :class="{ disabled: transactionStore.heldGrams <= 0 }"
            :style="{ background: transactionStore.heldGrams > 0 ? 'linear-gradient(135deg, #888 0%, #bbb 100%)' : '#ccc' }"
            :disabled="transactionStore.heldGrams <= 0"
            @click="goSell"
          >
            卖出
          </button>
        </div>

        <!-- 5. Recent Transactions -->
        <div v-if="recentTransactions.length > 0" class="card section-card">
          <div class="card-gradient-bar" :style="{ background: themeStore.currentTheme.accent }"></div>
          <div class="card-header-row">
            <h2 class="card-title" style="margin:0; font-size:15px; font-weight:600;">最近操作</h2>
            <button class="more-btn" @click="goRecords">查看全部 →</button>
          </div>
          <div class="recent-list">
            <div
              class="recent-item"
              v-for="tx in recentTransactions"
              :key="tx.id"
            >
              <div class="recent-left">
                <span class="recent-type" :class="tx.type">
                  {{ tx.type === 'buy' ? '买入' : '卖出' }}
                </span>
                <span class="recent-date">{{ formatDate(tx.date) }}</span>
              </div>
              <div class="recent-right">
                <span class="recent-grams">{{ formatGrams(tx.grams) }}</span>
                <span class="recent-total">{{ formatYuan(tx.totalCents) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { formatGrams, formatYuan, formatPrice, formatDate, formatProfit, formatRate } from '@/utils/formatters'

const router = useRouter()
const themeStore = useThemeStore()
const transactionStore = useTransactionStore()

onMounted(() => {
  themeStore.initTheme()
  transactionStore.loadTransactions()
})

function goBuy() {
  router.push('/buy')
}

function goSell() {
  if (transactionStore.heldGrams > 0) {
    router.push('/sell')
  }
}

function goRecords() {
  router.push('/records')
}

const recentTransactions = computed(() => {
  return [...transactionStore.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
})

const metrics = computed(() => {
  const store = transactionStore
  const totalCents = store.totalInvestmentCents
  const realizedProfit = store.realizedProfitCents
  const realizedRate = totalCents > 0 ? (realizedProfit / totalCents) * 100 : null

  return [
    {
      icon: '◎',
      label: '总投入',
      value: totalCents > 0 ? formatYuan(totalCents) : '¥0.00',
      valueNumeric: totalCents,
    },
    {
      icon: '▲',
      label: '总买入',
      value: formatGrams(store.totalBuyGrams),
    },
    {
      icon: '▼',
      label: '总卖出',
      value: formatGrams(store.totalSellGrams),
    },
    {
      icon: '★',
      label: '已实现收益',
      value: formatProfit(realizedProfit),
      valueNumeric: realizedProfit,
      isProfit: true,
    },
    {
      icon: '★',
      label: '总收益率',
      value: realizedRate !== null ? formatRate(realizedRate / 100) : '--',
      valueNumeric: realizedRate !== null ? realizedRate : 0,
      isProfit: true,
    },
  ]
})
</script>

<style scoped>
.page {
  height: 100vh;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 56px;
}

.content {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px 0;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 700;
  padding: 12px 0 16px;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.scroll-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Card base */
.card {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
}

.card-gradient-bar {
  height: 4px;
  width: 100%;
}

.card-gradient-bar-short {
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  border-radius: 2px 0 0 2px;
}

.card-body {
  padding: 16px;
}

/* Holding card */
.holding-card {
  position: relative;
}

.holding-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.label-icon {
  font-size: 10px;
}

.holding-grams {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 12px;
}

.holding-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.meta-value {
  font-size: 15px;
  font-weight: 500;
  color: v-bind('themeStore.currentTheme.text');
}

.latest-price {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid v-bind('themeStore.currentTheme.border');
}

.price-label {
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.price-value {
  font-size: 16px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-card {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: v-bind('themeStore.currentTheme.text');
  word-break: break-all;
}

.metric-label {
  font-size: 11px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  white-space: nowrap;
}

/* Batches Section */
.batches-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
  padding: 4px 0;
}

.section-icon {
  font-size: 16px;
  color: v-bind('themeStore.currentTheme.accent');
}

.batch-card {
  position: relative;
  padding-left: 4px;
}

.batch-body {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
}

.batch-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-price {
  font-size: 16px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
}

.batch-grams {
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.textSecondary');
}

.batch-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.batch-date {
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.batch-total {
  font-size: 14px;
  font-weight: 500;
  color: v-bind('themeStore.currentTheme.text');
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.btn {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  letter-spacing: 2px;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
}

.btn:active:not(.disabled) {
  transform: scale(0.97);
}

.btn-buy {
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
}

.btn-sell {
  color: v-bind('themeStore.currentTheme.text');
}

.btn-sell.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.bottom-spacer {
  height: 40px;
}

/* Recent Transactions */
.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.more-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.accent');
  cursor: pointer;
  padding: 4px 8px;
}

.recent-list {
  padding: 12px 16px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recent-type {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.recent-type.buy {
  background: rgba(39, 174, 96, 0.12);
  color: #27AE60;
}

.recent-type.sell {
  background: rgba(231, 76, 60, 0.12);
  color: #E74C3C;
}

.recent-date {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.recent-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recent-grams {
  font-size: 14px;
  font-weight: 500;
  color: v-bind('themeStore.currentTheme.textSecondary');
}

.recent-total {
  font-size: 14px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
  min-width: 70px;
  text-align: right;
}
</style>
