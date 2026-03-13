<template>
  <a-dropdown :trigger="['click']" placement="bottomRight">
    <div class="locale-switcher-wrapper">
      <div class="icon-box">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 8H13M8 5V8M8 8C8 8 8 13 5 16M8 8C8 8 8 13 11 16M11 11L13 13"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13 18L17 10L21 18M14.5 15H19.5"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="locale-text">{{ currentLocaleShort }}</span>
      <DownOutlined class="arrow-icon" />
    </div>
    <template #overlay>
      <a-menu :selected-keys="[localeStore.locale]" @click="handleLocaleChange">
        <a-menu-item key="zh-CN">简体中文</a-menu-item>
        <a-menu-item key="en-US">English</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import { DownOutlined } from '@ant-design/icons-vue'

const localeStore = useLocaleStore()

/** 按钮上显示国际通用语言简写（ISO 639-1 大写）：ZH / EN */
const currentLocaleShort = computed(() => {
  return localeStore.locale === 'zh-CN' ? 'ZH' : 'EN'
})

const handleLocaleChange = ({ key }: { key: string }) => {
  localeStore.setLocale(key as 'zh-CN' | 'en-US')
}
</script>

<style scoped>
.locale-switcher-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  height: 36px;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.locale-switcher-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.dark .locale-switcher-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: color 0.2s;
}

.locale-text {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-left: 8px;
  letter-spacing: 0.02em;
}

.dark .locale-text {
  color: #94a3b8;
}

.arrow-icon {
  font-size: 10px;
  color: #94a3b8;
  margin-left: 6px;
  transition: all 0.3s ease;
}

.locale-switcher-wrapper:hover .icon-box,
.locale-switcher-wrapper:hover .locale-text {
  color: var(--color-primary);
}

.dark .locale-switcher-wrapper:hover .locale-text {
  color: var(--color-primary);
}

:deep(.ant-dropdown-open) .arrow-icon {
  transform: rotate(180deg);
  color: #3b82f6;
}
</style>
