<template>
  <div class="buy-page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">买入黄金</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="form-body">
      <!-- 基本信息 -->
      <section class="form-section">
        <h2 class="section-title">基本信息</h2>
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
        <div class="form-group">
          <label class="form-label">克数</label>
          <input
            v-model.number="grams"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.000"
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
    </div>

    <!-- 按钮区域 - 底部固定 -->
    <div class="action-bar">
      <button class="btn btn-cancel" @click="goBack">取消</button>
      <button class="btn btn-save" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '../stores/transactionStore'
import { useThemeStore } from '../stores/themeStore'
import { centsFromYuan, formatYuan } from '../utils/formatters'

const router = useRouter()
const transactionStore = useTransactionStore()
const themeStore = useThemeStore()

onMounted(() => {
  transactionStore.loadTransactions()
})

const today = new Date().toISOString().slice(0, 10)

const date = ref(today)
const price = ref(0)
const grams = ref(0)
const autoCalc = ref(true)
const total = ref(0)
const note = ref('')
const saving = ref(false)
const errorMsg = ref('')

const computedTotal = computed(() => {
  const p = Number(price.value) || 0
  const g = Number(grams.value) || 0
  return formatYuan(centsFromYuan(p * g))
})

function getEffectiveTotal() {
  if (autoCalc.value) {
    const p = Number(price.value) || 0
    const g = Number(grams.value) || 0
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
  if (Number(grams.value) <= 0) {
    errorMsg.value = '请输入有效的克数（大于 0）'
    return false
  }
  if (!autoCalc.value && (Number(total.value) || 0) <= 0) {
    errorMsg.value = '请输入有效的总价（大于 0）'
    return false
  }
  return true
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  const effectiveTotal = getEffectiveTotal()
  await transactionStore.addBuyTransaction(
    date.value,
    centsFromYuan(Number(price.value)),
    Number(grams.value),
    effectiveTotal,
    note.value
  )
  saving.value = false
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.buy-page {
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
  flex-shrink: 0;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
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
  padding-bottom: 8px;
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
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 16px));
  background: v-bind('themeStore.currentTheme.bg');
  border-top: 1px solid v-bind('themeStore.currentTheme.border');
  flex-shrink: 0;
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