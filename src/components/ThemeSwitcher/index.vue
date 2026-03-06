<template>
  <a-dropdown>
    <a-button type="text">
      <template #icon>
        <component :is="themeIcon" />
      </template>
    </a-button>
    <template #overlay>
      <a-menu @click="handleThemeChange">
        <a-menu-item key="light">
          <template #icon><SunIcon /></template>
          {{ t('theme.light') }}
        </a-menu-item>
        <a-menu-item key="dark">
          <template #icon><MoonIcon /></template>
          {{ t('theme.dark') }}
        </a-menu-item>
        <a-menu-item key="auto">
          <template #icon><DesktopOutlined /></template>
          {{ t('theme.auto') }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { DesktopOutlined } from '@ant-design/icons-vue'
import { useThemeStore } from '@/stores/theme'

/** 太阳图标（亮色模式） */
const SunIcon = {
  name: 'SunIcon',
  render() {
    return h('span', { class: 'theme-icon-wrap', role: 'img', 'aria-hidden': 'true' }, [
      h('svg', { viewBox: '0 0 1024 1024', fill: 'currentColor', width: '1em', height: '1em' }, [
        h('path', {
          d: 'M512 256a256 256 0 1 1 0 512 256 256 0 0 1 0-512zm0 64a192 192 0 1 0 0 384 192 192 0 0 0 0-384zM512 64v64a32 32 0 0 1-64 0V64a32 32 0 0 1 64 0zm0 768v64a32 32 0 0 1-64 0v-64a32 32 0 0 1 64 0zm448-384h-64a32 32 0 0 1 0-64h64a32 32 0 0 1 0 64zM192 512H128a32 32 0 0 1 0-64h64a32 32 0 0 1 0 64zm663.296-295.296a32 32 0 0 1-45.248 45.248l-45.248-45.248a32 32 0 0 1 45.248-45.248l45.248 45.248zm-542.592 542.592a32 32 0 0 1-45.248 45.248l-45.248-45.248a32 32 0 0 1 45.248-45.248l45.248 45.248zM960 512a32 32 0 0 1-32 32h-64a32 32 0 0 1 0-64h64a32 32 0 0 1 32 32zM256 512a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h128a32 32 0 0 1 32 32zm259.296 259.296a32 32 0 0 1-45.248 45.248l-45.248-45.248a32 32 0 0 1 45.248-45.248l45.248 45.248zm0-542.592a32 32 0 0 1-45.248-45.248l45.248-45.248a32 32 0 0 1 45.248 45.248l-45.248 45.248z',
        }),
      ]),
    ])
  },
}

/** 月亮图标（暗色模式） */
const MoonIcon = {
  name: 'MoonIcon',
  render() {
    return h('span', { class: 'theme-icon-wrap', role: 'img', 'aria-hidden': 'true' }, [
      h('svg', { viewBox: '0 0 1024 1024', fill: 'currentColor', width: '1em', height: '1em' }, [
        h('path', {
          d: 'M524.8 938.667H213.333a42.667 42.667 0 0 1 0-85.334h311.467c-181.034-34.133-320-192-320-384S352.766 170.667 533.8 136.533a42.667 42.667 0 0 1 32.534 78.934C395.434 256.534 298.667 368.967 298.667 469.333s96.767 212.8 267.667 253.867a42.667 42.667 0 0 1-41.534 215.467z',
        }),
      ]),
    ])
  },
}

const { t } = useI18n()
const themeStore = useThemeStore()

const themeIcon = computed(() => {
  switch (themeStore.mode) {
    case 'light':
      return SunIcon
    case 'dark':
      return MoonIcon
    default:
      return DesktopOutlined
  }
})

const handleThemeChange = ({ key }: { key: string }) => {
  themeStore.setMode(key as 'light' | 'dark' | 'auto')
}
</script>

<style scoped>
.theme-icon-wrap {
  display: inline-flex;
  font-size: 14px;
}
.theme-icon-wrap svg {
  vertical-align: -0.125em;
}
</style>
