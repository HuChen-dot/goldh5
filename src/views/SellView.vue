<template>
  <div class="sell-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">卖出黄金</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="form-body">
      <!-- 卖出信息 -->
      <section class="form-section">
        <h2 class="section-title">卖出信息</h2>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input v-model="date" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">价格（元/克）</label>
          <input
            v-model.number="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="form-input"
          />
        </div>
      </section>

      <!-- 总价 -->
      <section class="form-section">
        <h2 class="section-title">总价</h2>
        <div class="toggle-row">
          <span class="toggle-label">自动计算总价</span>
          <label class="toggle-switch">
            <input v-model="autoCalc" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div v-if="autoCalc" class="auto-total">
          总价：<span class="total-value">{{ computedTotal }}</span>
        </div>
        <div v-else class="form-group">
          <label class="form-label">总价（元）</label>
          <input
            v-model.number="total"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="form-input"
          />
        </div>
      </section>

      <!-- 选择卖出来源批次 -->
      <section class="form-section">
        <h2 class="section-title">选择卖出来源批次</h2>
        <div v-if="transactionStore.heldBatches.length === 0" class="empty-batches">
          暂无可用持仓批次
        </div>
        <div
          v-for="batch in transactionStore.heldBatches"
          :key="batch.id"
          class="batch-item"
          :class="{ 'batch-selected': selectedBatchIds[batch.id] }"
        >
          <div class="batch-row" @click="toggleBatch(batch.id)">
            <div class="batch-check">
              <span
                class="check-icon"
                :class="{ checked: selectedBatchIds[batch.id] }"
              >
                {{ selectedBatchIds[batch.id] ? '✓' : '○' }}
              </span>
            </div>
            <div class="batch-info">
              <div class="batch-price">
                买入价 {{ formatPrice(batch.transaction.priceCents) }}
              </div>
              <div class="batch-grams">
                可卖 {{ formatGrams(batch.heldGrams) }}
              </div>
              <div class="batch-meta">
                {{ batch.transaction.date }}
                <span v-if="batch.transaction.note"> · {{ batch.transaction.note }}</span>
              </div>
              <div class="batch-cost">
                持仓成本 {{ formatYuan(batch.heldTotalCents) }}
              </div>
            </div>
          </div>
          <div v-if="selectedBatchIds[batch.id]" class="batch-grams-input">
            <div class="stepper-label">卖出克数</div>
            <div class="stepper-row">
              <button class="stepper-btn" @click="decrementGrams(batch.id)">−</button>
              <input
                v-model.number="batchGrams[batch.id]"
                type="number"
                step="0.1"
                min="0"
                :max="batch.heldGrams"
                class="stepper-input"
                @input="clampGrams(batch.id)"
              />
              <button class="stepper-btn" @click="incrementGrams(batch.id)">+</button>
            </div>
          </div>
        </div>
        <div v-if="totalSelectedGrams > 0" class="summary-line">
          共卖出 {{ formatGrams(totalSelectedGrams) }}
        </div>
      </section>

      <!-- 预估收益 -->
      <section
        v-if="totalSelectedGrams > 0 && Number(price) > 0"
        class="form-section"
      >
        <h2 class="section-title">预估收益</h2>
        <div class="profit-grid">
          <div class="profit-row">
            <span class="profit-label">卖出收入</span>
            <span class="profit-value">{{ formatYuan(sellIncomeCents) }}</span>
          </div>
          <div class="profit-row">
            <span class="profit-label">买入成本</span>
            <span class="profit-value">{{ formatYuan(buyCostCents) }}</span>
          </div>
          <div class="profit-row profit-divider"></div>
          <div class="profit-row">
            <span class="profit-label">预估收益</span>
            <span
              class="profit-value"
              :class="profitCents >= 0 ? 'text-green' : 'text-red'"
            >
              {{ formatProfit(profitCents) }}
            </span>
          </div>
        </div>
      </section>

      <!-- 备注 -->
      <section class="form-section">
        <h2 class="section-title">备注（可选）</h2>
        <div class="form-group">
          <input
            v-model="note"
            type="text"
            placeholder="添加备注..."
            class="form-input"
            maxlength="200"
          />
        </div>
      </section>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- 按钮区域 -->
      <div class="action-bar">
        <button class="btn btn-cancel" @click="goBack">取消</button>
        <button class="btn btn-save" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../stores/transactionStore'
import { useThemeStore } from '../stores/themeStore'
import { centsFromYuan, formatYuan, formatPrice, formatGrams, formatProfit } from '../utils/formatters'

const router = useRouter()
const transactionStore = useTransactionStore()
const themeStore = useThemeStore()

onMounted(() => {
  transactionStore.loadTransactions()
})

const today = new Date().toISOString().slice(0, 10)

const date = ref(today)
const price = ref(0)
const autoCalc = ref(true)
const total = ref(0)
const note = ref('')
const saving = ref(false)
const errorMsg = ref('')

const selectedBatchIds = reactive({})
const batchGrams = reactive({})

const totalSelectedGrams = computed(() => {
  let sum = 0
  for (const batch of transactionStore.heldBatches) {
    if (selectedBatchIds[batch.id]) {
      sum += Number(batchGrams[batch.id]) || 0
    }
  }
  return sum
})

const computedTotal = computed(() => {
  const p = Number(price.value) || 0
  const g = totalSelectedGrams.value
  return formatYuan(centsFromYuan(p * g))
})

const sellIncomeCents = computed(() => {
  const p = Number(price.value) || 0
  const g = totalSelectedGrams.value
  return centsFromYuan(p * g)
})

const buyCostCents = computed(() => {
  let totalCost = 0
  for (const batch of transactionStore.heldBatches) {
    if (selectedBatchIds[batch.id]) {
      const g = Number(batchGrams[batch.id]) || 0
      const ratio = batch.heldGrams > 0 ? g / batch.heldGrams : 0
      totalCost += Math.round(batch.heldTotalCents * ratio)
    }
  }
  return totalCost
})

const profitCents = computed(() => {
  return sellIncomeCents.value - buyCostCents.value
})

function toggleBatch(id) {
  if (selectedBatchIds[id]) {
    selectedBatchIds[id] = false
    delete batchGrams[id]
  } else {
    selectedBatchIds[id] = true
    const batch = transactionStore.heldBatches.find(b => b.id === id)
    if (batch) {
      batchGrams[id] = batch.heldGrams
    }
  }
}

function incrementGrams(id) {
  const batch = transactionStore.heldBatches.find(b => b.id === id)
  if (!batch) return
  const current = Number(batchGrams[id]) || 0
  batchGrams[id] = Math.min(current + 0.1, batch.heldGrams)
}

function decrementGrams(id) {
  const current = Number(batchGrams[id]) || 0
  batchGrams[id] = Math.max(current - 0.1, 0)
}

function clampGrams(id) {
  const batch = transactionStore.heldBatches.find(b => b.id === id)
  if (!batch) return
  let val = Number(batchGrams[id]) || 0
  if (val < 0) val = 0
  if (val > batch.heldGrams) val = batch.heldGrams
  batchGrams[id] = val
}

function getEffectiveTotal() {
  if (autoCalc.value) {
    const p = Number(price.value) || 0
    const g = totalSelectedGrams.value
    return centsFromYuan(p * g)
  }
  return centsFromYuan(Number(total.value) || 0)
}

function validate() {
  errorMsg.value = ''
  if (!date.value) {
    errorMsg.value = '请选择日期'
    return false
  }
  if (Number(price.value) <= 0) {
    errorMsg.value = '请输入有效的价格（大于 0）'
    return false
  }
  if (totalSelectedGrams.value <= 0) {
    errorMsg.value = '请至少选择一批持仓并设置卖出克数'
    return false
  }
  if (!autoCalc.value && (Number(total.value) || 0) <= 0) {
    errorMsg.value = '请输入有效的总价（大于 0）'
    return false
  }
  return true
}

function buildSelectedBatches() {
  const result = []
  for (const batch of transactionStore.heldBatches) {
    if (selectedBatchIds[batch.id]) {
      const g = Number(batchGrams[batch.id]) || 0
      if (g > 0) {
        const ratio = batch.heldGrams > 0 ? g / batch.heldGrams : 0
        const costCents = Math.round(batch.heldTotalCents * ratio)
        result.push({
          buyTransactionId: batch.id,
          grams: g,
          costCents
        })
      }
    }
  }
  return result
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  const selectedBatches = buildSelectedBatches()
  const totalG = selectedBatches.reduce((sum, b) => sum + b.grams, 0)
  const effectiveTotal = getEffectiveTotal()
  const success = await transactionStore.addSellTransaction(
    date.value,
    centsFromYuan(Number(price.value)),
    totalG,
    effectiveTotal,
    note.value,
    selectedBatches
  )
  if (!success) {
    errorMsg.value = '保存失败，请检查数据'
    saving.value = false
    return
  }
  router.back()
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.sell-page {
  height: 100vh;
  background: v-bind('themeStore.currentTheme.bg');
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, v-bind('themeStore.currentTheme.accent'), v-bind('themeStore.currentTheme.accentLight'));
  color: #fff;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 1px;
}

.header-spacer {
  width: 60px;
}

.form-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-section {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.form-group {
  margin-bottom: 14px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 44px;
  background: v-bind('themeStore.currentTheme.inputBg');
  border: 1px solid v-bind('themeStore.currentTheme.inputBorder');
  border-radius: 10px;
  padding: 0 14px;
  font-size: 15px;
  color: v-bind('themeStore.currentTheme.text');
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: v-bind('themeStore.currentTheme.accent');
  background: v-bind('themeStore.currentTheme.surface');
}

.form-input::placeholder {
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  font-size: 14px;
  color: v-bind('themeStore.currentTheme.textSecondary');
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: v-bind('themeStore.currentTheme.textTertiary');
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: v-bind('themeStore.currentTheme.accentLight');
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

.auto-total {
  margin-top: 12px;
  font-size: 15px;
  color: v-bind('themeStore.currentTheme.textSecondary');
  text-align: center;
  padding: 12px;
  background: v-bind('themeStore.currentTheme.surface');
  border: 1px solid v-bind('themeStore.currentTheme.border');
  border-radius: 10px;
}

.total-value {
  font-weight: 700;
  color: v-bind('themeStore.currentTheme.accent');
  font-size: 18px;
}

.empty-batches {
  text-align: center;
  color: v-bind('themeStore.currentTheme.textTertiary');
  font-size: 14px;
  padding: 24px 0;
}

.batch-item {
  border: 1px solid v-bind('themeStore.currentTheme.border');
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.batch-item.batch-selected {
  border-color: v-bind('themeStore.currentTheme.accentLight');
}

.batch-row {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  cursor: pointer;
  gap: 10px;
}

.batch-check {
  flex-shrink: 0;
  padding-top: 2px;
}

.check-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid v-bind('themeStore.currentTheme.textTertiary');
  font-size: 13px;
  font-weight: 700;
  color: transparent;
  transition: all 0.2s;
}

.check-icon.checked {
  background: v-bind('themeStore.currentTheme.accentLight');
  border-color: v-bind('themeStore.currentTheme.accentLight');
  color: #fff;
}

.batch-info {
  flex: 1;
  min-width: 0;
}

.batch-price {
  font-size: 15px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
}

.batch-grams {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.accent');
  font-weight: 600;
  margin-top: 2px;
}

.batch-meta {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-top: 2px;
}

.batch-cost {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-top: 2px;
}

.batch-grams-input {
  padding: 0 12px 12px;
  border-top: 1px solid v-bind('themeStore.currentTheme.border');
  padding-top: 10px;
}

.stepper-label {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-bottom: 6px;
}

.stepper-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper-btn {
  width: 36px;
  height: 36px;
  border: 1px solid v-bind('themeStore.currentTheme.border');
  border-radius: 8px;
  background: v-bind('themeStore.currentTheme.inputBg');
  font-size: 18px;
  font-weight: 700;
  color: v-bind('themeStore.currentTheme.textSecondary');
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.stepper-btn:hover {
  background: v-bind('themeStore.currentTheme.border');
}

.stepper-btn:active {
  background: v-bind('themeStore.currentTheme.textTertiary');
}

.stepper-input {
  flex: 1;
  height: 36px;
  background: v-bind('themeStore.currentTheme.inputBg');
  border: 1px solid v-bind('themeStore.currentTheme.inputBorder');
  border-radius: 8px;
  padding: 0 10px;
  font-size: 14px;
  color: v-bind('themeStore.currentTheme.text');
  text-align: center;
  outline: none;
  box-sizing: border-box;
}

.stepper-input:focus {
  border-color: v-bind('themeStore.currentTheme.accent');
}

.summary-line {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.accent');
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid v-bind('themeStore.currentTheme.border');
}

.profit-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profit-label {
  font-size: 14px;
  color: v-bind('themeStore.currentTheme.textSecondary');
}

.profit-value {
  font-size: 15px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
}

.profit-divider {
  height: 1px;
  background: v-bind('themeStore.currentTheme.border');
  margin: 4px 0;
}

.text-green {
  color: #27AE60;
}

.text-red {
  color: #E74C3C;
}

.error-msg {
  text-align: center;
  color: #E74C3C;
  font-size: 13px;
  margin: 8px 0 12px;
  padding: 8px 12px;
  background: rgba(231, 76, 60, 0.08);
  border-radius: 8px;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 20px 0 32px;
}

.btn {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.2s;
  letter-spacing: 1px;
}

.btn:active {
  transform: scale(0.97);
}

.btn-cancel {
  background: v-bind('themeStore.currentTheme.inputBg');
  color: v-bind('themeStore.currentTheme.textSecondary');
}

.btn-save {
  background: linear-gradient(135deg, v-bind('themeStore.currentTheme.accent'), v-bind('themeStore.currentTheme.accentLight'));
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
