<template>
  <div class="page-container" :style="pageStyle">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <h1 class="page-title" :style="{ color: themeStore.currentTheme.text }">设置</h1>
    </div>

    <div class="scroll-content">
      <!-- 主题模式 -->
      <div class="section">
        <div class="section-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="themeStore.currentTheme.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
          <span :style="{ color: themeStore.currentTheme.accent }">外观</span>
        </div>
        <div class="mode-grid" :style="{ background: themeStore.currentTheme.surface }">
          <button
            v-for="mode in modes"
            :key="mode.key"
            class="mode-btn"
            :class="{ active: themeStore.themeMode === mode.key }"
            :style="modeBtnStyle(mode.key)"
            @click="themeStore.setTheme(mode.key)"
          >
            <div class="mode-icon" :style="iconWrapStyle(mode.key)">
              <svg v-if="mode.key === 'light'" width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="themeStore.themeMode === 'light' ? '#fff' : themeStore.currentTheme.text" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
              <svg v-else-if="mode.key === 'dark'" width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="themeStore.themeMode === 'dark' ? '#fff' : themeStore.currentTheme.text" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="themeStore.themeMode === 'system' ? '#fff' : themeStore.currentTheme.text" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span class="mode-name" :style="{ color: themeStore.themeMode === mode.key ? '#fff' : themeStore.currentTheme.text }">{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- 关于 -->
      <div class="section">
        <div class="section-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="themeStore.currentTheme.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span :style="{ color: themeStore.currentTheme.accent }">关于</span>
        </div>
        <div class="info-card" :style="{ background: themeStore.currentTheme.surface }">
          <div class="info-row"><span class="info-label" :style="{ color: themeStore.currentTheme.text }">应用名称</span><span class="info-value" :style="{ color: themeStore.currentTheme.textTertiary }">金库</span></div>
          <div class="info-divider" :style="{ background: themeStore.currentTheme.border }"></div>
          <div class="info-row"><span class="info-label" :style="{ color: themeStore.currentTheme.text }">版本</span><span class="info-value" :style="{ color: themeStore.currentTheme.textTertiary }">1.0.0</span></div>
          <div class="info-divider" :style="{ background: themeStore.currentTheme.border }"></div>
          <div class="info-row"><span class="info-label" :style="{ color: themeStore.currentTheme.text }">数据存储</span><span class="info-value" :style="{ color: themeStore.currentTheme.textTertiary }">本地</span></div>
        </div>
      </div>

      <!-- 功能说明 -->
      <div class="section">
        <div class="section-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="themeStore.currentTheme.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
          <span :style="{ color: themeStore.currentTheme.accent }">功能说明</span>
        </div>
        <div class="info-card" :style="{ background: themeStore.currentTheme.surface }">
          <div v-for="(item, idx) in features" :key="idx" class="feature-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="themeStore.currentTheme.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.iconSvg"></svg>
            <span :style="{ color: themeStore.currentTheme.textSecondary }">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

const modes = [
  { key: 'light', label: '明亮' },
  { key: 'dark', label: '暗色' },
  { key: 'system', label: '跟随系统' },
]

const features = [
  { iconSvg: '<path d="M12 5v14"/><path d="M5 12h14"/>', text: '记录每笔买入/卖出交易' },
  { iconSvg: '<path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/>', text: 'FIFO先进先出计算持仓成本' },
  { iconSvg: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>', text: '自动计算持仓盈亏和收益率' },
  { iconSvg: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', text: '数据仅保存在本地设备' },
]

const pageStyle = computed(() => ({
  backgroundColor: themeStore.currentTheme.bg,
  color: themeStore.currentTheme.text,
}))

function modeBtnStyle(key) {
  const isActive = themeStore.themeMode === key
  return {
    background: isActive ? themeStore.currentTheme.accent : 'transparent',
    borderColor: isActive ? themeStore.currentTheme.accent : themeStore.currentTheme.border,
  }
}

function iconWrapStyle(key) {
  const isActive = themeStore.themeMode === key
  return {
    background: isActive ? 'rgba(255,255,255,0.2)' : themeStore.currentTheme.inputBg,
  }
}

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  padding-bottom: 56px;
}
.top-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: inherit;
}
.page-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}
.scroll-content {
  padding: 0 16px 30px;
  overflow-y: auto;
}
.section {
  margin-top: 20px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.mode-grid {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
}
.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  background: none;
  transition: all 0.2s;
}
.mode-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mode-name {
  font-size: 13px;
  font-weight: 500;
}
.info-card {
  border-radius: 14px;
  overflow: hidden;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
.info-label {
  font-size: 14px;
}
.info-value {
  font-size: 14px;
}
.info-divider {
  height: 1px;
  margin-left: 16px;
}
.feature-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  font-size: 14px;
}
.feature-row svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
