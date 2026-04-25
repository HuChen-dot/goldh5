<template>
  <div class="app-root">
    <router-view />
    <nav
      v-if="showBottomNav"
      class="bottom-nav"
      :style="{ background: themeStore.currentTheme.surface, borderColor: themeStore.currentTheme.border }"
    >
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: route.name === item.name }"
        :style="route.name === item.name ? { color: themeStore.currentTheme.accent } : { color: themeStore.currentTheme.textTertiary }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'

const route = useRoute()
const themeStore = useThemeStore()

const showBottomNav = computed(() => {
  return ['Home', 'Records', 'Settings'].includes(route.name)
})

const navItems = [
  { to: '/', name: 'Home', icon: '⌂', label: '首页' },
  { to: '/records', name: 'Records', icon: '☰', label: '交易记录' },
  { to: '/settings', name: 'Settings', icon: '⚙', label: '设置' },
]
</script>

<style scoped>
.app-root {
  height: 100vh;
  width: 100%;
  position: relative;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  border-top: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  font-size: 11px;
  flex: 1;
  height: 100%;
  transition: color 0.2s;
}

.nav-item.active {
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
}
</style>
