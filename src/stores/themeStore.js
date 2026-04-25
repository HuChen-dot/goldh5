import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { lightTheme, darkTheme } from '../styles/theme.js'

const STORAGE_KEY = 'gold_theme_mode'

function getSystemDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', () => {
  const savedMode = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })()

  const themeMode = ref(savedMode)
  const systemDark = ref(getSystemDark())

  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return systemDark.value
  })

  const currentTheme = computed(() => (isDark.value ? darkTheme : lightTheme))

  const themeGradient = computed(() => {
    const t = currentTheme.value
    return `linear-gradient(135deg, ${t.accent}, ${t.accentLight})`
  })

  function setTheme(mode) {
    if (['light', 'dark', 'system'].includes(mode)) {
      themeMode.value = mode
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  function initTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        themeMode.value = stored
      } else {
        themeMode.value = 'system'
      }
    } catch {
      themeMode.value = 'system'
    }
  }

  function listenSystem() {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      systemDark.value = e.matches
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }

  const cleanup = listenSystem()

  return {
    themeMode,
    isDark,
    currentTheme,
    themeGradient,
    setTheme,
    initTheme,
    cleanup,
  }
})
