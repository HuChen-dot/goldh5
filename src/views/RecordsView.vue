<template>
  <div class="records-page">
    <div class="page-header-plain">
      <h1 class="page-title-plain">交易记录</h1>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="capsule-group">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="capsule-btn"
          :class="{ active: activeFilter === tab.key }"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <button class="date-filter-btn" :class="{ active: showDateFilter }" @click="toggleDateFilter">
        <span class="calendar-icon">📅</span>
      </button>
    </div>

    <!-- Date range filter -->
    <div v-if="showDateFilter" class="date-range">
      <div class="date-field">
        <label class="date-label">从</label>
        <input v-model="dateFrom" type="date" class="date-input" />
      </div>
      <div class="date-field">
        <label class="date-label">至</label>
        <input v-model="dateTo" type="date" class="date-input" />
      </div>
    </div>

    <!-- Main list -->
    <div class="list-container">
      <!-- Empty state -->
      <div v-if="filteredTransactions.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无交易记录</div>
        <div class="empty-hint">开始记录您的第一笔黄金交易吧</div>
      </div>

      <!-- Transaction list -->
      <div v-for="txn in filteredTransactions" :key="txn.id" class="txn-card">
        <div class="txn-row" @click="openEdit(txn)">
          <!-- Type badge -->
          <span
            class="type-badge"
            :class="txn.type === 'buy' ? 'badge-buy' : 'badge-sell'"
          >
            {{ txn.type === 'buy' ? '买入' : '卖出' }}
          </span>

          <!-- Info -->
          <div class="txn-info">
            <div class="txn-date">{{ txn.date }}</div>
            <div class="txn-meta">
              {{ formatGrams(txn.grams) }} · {{ formatPrice(txn.priceCents) }}
            </div>
          </div>

          <!-- Amount -->
          <div class="txn-amount">
            <div class="txn-total">{{ formatYuan(txn.totalCents) }}</div>
            <div
              v-if="txn.type === 'sell' && txn.sellProfitCents !== null"
              class="txn-profit"
              :class="txn.sellProfitCents >= 0 ? 'text-green' : 'text-red'"
            >
              {{ formatProfit(txn.sellProfitCents) }}
            </div>
          </div>
        </div>

        <!-- Note -->
        <div v-if="txn.note" class="txn-note">{{ txn.note }}</div>

        <!-- Expand batch details for sell -->
        <div v-if="txn.type === 'sell' && txn.sellBatchData" class="txn-batches">
          <button class="expand-btn" @click="toggleExpand(txn.id)">
            {{ expandedIds[txn.id] ? '收起来源 ▼' : '展开来源 ▶' }}
          </button>
          <div v-if="expandedIds[txn.id]" class="batch-details">
            <div
              v-for="(batch, idx) in parseBatches(txn.sellBatchData)"
              :key="idx"
              class="batch-detail-row"
            >
              <span class="batch-detail-label">买入 #{{ idx + 1 }}</span>
              <span class="batch-detail-date" v-if="batch.date">{{ batch.date }}</span>
              <span class="batch-detail-value">
                {{ formatPrice(batch.priceCents) }} × {{ formatGrams(batch.grams) }} · 成本 {{ formatYuan(batch.costCents) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Delete button (swipe right) -->
        <button class="delete-btn" @click="confirmDelete(txn)">删除</button>
      </div>
    </div>

    <!-- Edit overlay -->
    <div v-if="editingTxn" class="edit-overlay" @click.self="closeEdit">
      <div class="edit-modal">
        <div class="edit-header">
          <div class="edit-header-left">
            <h2 class="edit-title">编辑交易</h2>
            <span class="edit-type-badge" :class="editingTxn?.type === 'buy' ? 'badge-buy' : 'badge-sell'">
              {{ editingTxn?.type === 'buy' ? '买入' : '卖出' }}
            </span>
          </div>
          <button class="close-btn" @click="closeEdit">✕</button>
        </div>
        <div class="edit-body">
          <div class="form-group">
            <label class="form-label">日期</label>
            <input v-model="editDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">价格（元/克）</label>
            <input
              v-model.number="editPrice"
              type="number"
              step="0.01"
              min="0"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">克数</label>
            <input
              v-model.number="editGrams"
              type="number"
              step="0.001"
              min="0"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">总价（元）</label>
            <input
              v-model.number="editTotal"
              type="number"
              step="0.01"
              min="0"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input
              v-model="editNote"
              type="text"
              placeholder="添加备注..."
              class="form-input"
            />
          </div>
          <div v-if="editError" class="error-msg">{{ editError }}</div>
        </div>
        <div class="edit-footer">
          <button class="btn btn-cancel" @click="closeEdit">取消</button>
          <button class="btn btn-save" :disabled="editSaving" @click="saveEdit">
            {{ editSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="deleteTarget" class="edit-overlay" @click.self="deleteTarget = null">
      <div class="confirm-modal">
        <div class="confirm-text">确定要删除这笔交易记录吗？</div>
        <div class="confirm-actions">
          <button class="btn btn-cancel" @click="deleteTarget = null">取消</button>
          <button class="btn btn-danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTransactionStore } from '../stores/transactionStore'
import { useThemeStore } from '../stores/themeStore'
import { formatYuan, formatPrice, formatGrams, formatProfit, centsFromYuan } from '../utils/formatters'

const transactionStore = useTransactionStore()
const themeStore = useThemeStore()

onMounted(() => {
  transactionStore.loadTransactions()
})

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'buy', label: '买入' },
  { key: 'sell', label: '卖出' }
]
const activeFilter = ref('all')
const showDateFilter = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const expandedIds = reactive({})

// Edit state
const editingTxn = ref(null)
const editDate = ref('')
const editPrice = ref(0)
const editGrams = ref(0)
const editTotal = ref(0)
const editNote = ref('')
const editSaving = ref(false)
const editError = ref('')

// Delete state
const deleteTarget = ref(null)

const filteredTransactions = computed(() => {
  let list = transactionStore.transactions.slice()

  // Type filter
  if (activeFilter.value !== 'all') {
    list = list.filter(t => t.type === activeFilter.value)
  }

  // Date range filter
  if (showDateFilter.value) {
    if (dateFrom.value) {
      list = list.filter(t => t.date >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter(t => t.date <= dateTo.value)
    }
  }

  // Sort by date descending
  list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  return list
})

function toggleDateFilter() {
  showDateFilter.value = !showDateFilter.value
  if (!showDateFilter.value) {
    dateFrom.value = ''
    dateTo.value = ''
  }
}

function toggleExpand(id) {
  expandedIds[id] = !expandedIds[id]
}

function findBuyTx(id) {
  return transactionStore.transactions.find(t => t.id === id && t.type === 'buy')
}

function parseBatches(data) {
  try {
    const batches = JSON.parse(data) || []
    return batches.map(b => {
      const buyTx = findBuyTx(b.buyTransactionId)
      return {
        ...b,
        priceCents: buyTx ? buyTx.priceCents : 0,
        date: buyTx ? buyTx.date : '',
      }
    })
  } catch {
    return []
  }
}

function openEdit(txn) {
  editingTxn.value = txn
  editDate.value = txn.date
  editPrice.value = txn.priceCents / 100
  editGrams.value = txn.grams
  editTotal.value = txn.totalCents / 100
  editNote.value = txn.note || ''
  editError.value = ''
  editSaving.value = false
}

function closeEdit() {
  editingTxn.value = null
}

async function saveEdit() {
  editError.value = ''
  if (!editDate.value) {
    editError.value = '请选择日期'
    return
  }
  if (Number(editPrice.value) <= 0) {
    editError.value = '请输入有效的价格'
    return
  }
  if (Number(editGrams.value) <= 0) {
    editError.value = '请输入有效的克数'
    return
  }
  if (Number(editTotal.value) <= 0) {
    editError.value = '请输入有效的总价'
    return
  }
  editSaving.value = true
  await transactionStore.updateTransaction(
    editingTxn.value,
    editDate.value,
    centsFromYuan(Number(editPrice.value)),
    Number(editGrams.value),
    centsFromYuan(Number(editTotal.value)),
    editNote.value
  )
  editSaving.value = false
  closeEdit()
}

function confirmDelete(txn) {
  deleteTarget.value = txn
}

async function doDelete() {
  if (deleteTarget.value) {
    await transactionStore.deleteTransaction(deleteTarget.value)
    deleteTarget.value = null
  }
}
</script>

<style scoped>
.records-page {
  height: 100vh;
  background: v-bind('themeStore.currentTheme.bg');
  display: flex;
  flex-direction: column;
  padding-bottom: 56px;
  overflow-y: auto;
}

.page-header-plain {
  padding: 16px 20px;
  background: v-bind('themeStore.currentTheme.surface');
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.page-title-plain {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: v-bind('themeStore.currentTheme.text');
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: v-bind('themeStore.currentTheme.surface');
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.capsule-group {
  display: flex;
  gap: 8px;
}

.capsule-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: v-bind('themeStore.currentTheme.inputBg');
  color: v-bind('themeStore.currentTheme.textSecondary');
  transition: all 0.2s;
}

.capsule-btn.active {
  background: v-bind('themeStore.currentTheme.accentLight');
  color: #fff;
}

.date-filter-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: v-bind('themeStore.currentTheme.inputBg');
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  font-size: 16px;
}

.date-filter-btn.active {
  background: v-bind('themeStore.currentTheme.accentLight');
}

.calendar-icon {
  line-height: 1;
}

.date-range {
  display: flex;
  gap: 12px;
  padding: 8px 20px 12px;
  background: v-bind('themeStore.currentTheme.surface');
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.date-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-label {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  white-space: nowrap;
}

.date-input {
  flex: 1;
  height: 34px;
  background: v-bind('themeStore.currentTheme.inputBg');
  border: 1px solid v-bind('themeStore.currentTheme.inputBorder');
  border-radius: 8px;
  padding: 0 8px;
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.text');
  outline: none;
  box-sizing: border-box;
}

.date-input:focus {
  border-color: v-bind('themeStore.currentTheme.accent');
}

.list-container {
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  opacity: 0.7;
}

.txn-card {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.txn-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.type-badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.badge-buy {
  background: #27AE60;
}

.badge-sell {
  background: #E74C3C;
}

.txn-info {
  flex: 1;
  min-width: 0;
}

.txn-date {
  font-size: 14px;
  font-weight: 600;
  color: v-bind('themeStore.currentTheme.text');
}

.txn-meta {
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  margin-top: 2px;
}

.txn-amount {
  text-align: right;
  flex-shrink: 0;
}

.txn-total {
  font-size: 15px;
  font-weight: 700;
  color: v-bind('themeStore.currentTheme.text');
}

.txn-profit {
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}

.text-green {
  color: #27AE60;
}

.text-red {
  color: #E74C3C;
}

.txn-note {
  margin-top: 8px;
  padding: 6px 10px;
  background: v-bind('themeStore.currentTheme.inputBg');
  border-radius: 6px;
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.txn-batches {
  margin-top: 6px;
}

.expand-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: v-bind('themeStore.currentTheme.accent');
  cursor: pointer;
  padding: 4px 0;
}

.batch-details {
  margin-top: 4px;
  padding: 6px 10px;
  background: v-bind('themeStore.currentTheme.inputBg');
  border-radius: 6px;
}

.batch-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}

.batch-detail-label {
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.batch-detail-date {
  font-size: 11px;
  color: v-bind('themeStore.currentTheme.textTertiary');
}

.batch-detail-value {
  color: v-bind('themeStore.currentTheme.textSecondary');
  font-weight: 500;
}

.delete-btn {
  margin-top: 8px;
  width: 100%;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #E74C3C;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 0.85;
}

.delete-btn:active {
  opacity: 0.7;
}

/* Edit overlay */
.edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: v-bind('themeStore.currentTheme.overlay');
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  box-sizing: border-box;
}

.edit-modal {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid v-bind('themeStore.currentTheme.border');
}

.edit-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-title {
  font-size: 17px;
  font-weight: 700;
  color: v-bind('themeStore.currentTheme.text');
  margin: 0;
}

.edit-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
}

.edit-type-badge.badge-buy {
  background: #27AE60;
}

.edit-type-badge.badge-sell {
  background: #E74C3C;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: v-bind('themeStore.currentTheme.textTertiary');
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: v-bind('themeStore.currentTheme.inputBg');
}

.edit-body {
  padding: 20px;
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

.error-msg {
  text-align: center;
  color: #E74C3C;
  font-size: 13px;
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(231, 76, 60, 0.08);
  border-radius: 6px;
}

.edit-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid v-bind('themeStore.currentTheme.border');
}

.btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.2s;
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
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #E74C3C;
  color: #fff;
}

/* Confirm modal */
.confirm-modal {
  background: v-bind('themeStore.currentTheme.surface');
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  text-align: center;
}

.confirm-text {
  font-size: 15px;
  color: v-bind('themeStore.currentTheme.text');
  margin-bottom: 20px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}
</style>
