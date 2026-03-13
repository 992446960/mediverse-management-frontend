<template>
  <button
    class="theme-switcher-btn group"
    :aria-label="isDark ? '切换亮色模式' : '切换深色模式'"
    @click="toggleTheme"
  >
    <!-- 太阳图标：浅色模式下显示 -->
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      class="icon sun-icon"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M12 2v2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12 20v2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path
        d="M4.93 4.93l1.41 1.41"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M17.66 17.66l1.41 1.41"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M2 12h2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M20 12h2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <path
        d="M4.93 19.07l1.41-1.41"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M17.66 6.34l1.41-1.41"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- 月亮图标：深色模式下显示 -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon moon-icon"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

/** 切换主题模式 */
const toggleTheme = () => {
  if (themeStore.isDark) {
    themeStore.setMode('light')
  } else {
    themeStore.setMode('dark')
  }
}
</script>

<style scoped>
.theme-switcher-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.theme-switcher-btn:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.dark .theme-switcher-btn:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.icon {
  transition: all 0.3s ease;
}

.sun-icon {
  display: block;
  color: #64748b; /* slate-500 */
}

.dark .sun-icon {
  display: none;
}

.moon-icon {
  display: none;
  color: #94a3b8;
}

.dark .moon-icon {
  display: block;
  color: #cbd5e1;
}

.theme-switcher-btn:hover .icon {
  transform: scale(1.1);
  color: var(--color-primary);
}

.dark .theme-switcher-btn:hover .icon {
  color: var(--color-primary);
}
</style>
