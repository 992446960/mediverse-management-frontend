<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import { XProvider } from 'ant-design-x-vue'
import MainLayout from '@/layouts/MainLayout.vue'
import FullscreenLayout from '@/layouts/FullscreenLayout.vue'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'
import { themeConfig, darkThemeConfig } from '@/config/themes'
import type { Locale } from 'ant-design-vue/es/locale'

const route = useRoute()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()

const layout = computed(() =>
  route.meta.layout === 'FullscreenLayout' ? FullscreenLayout : MainLayout
)

const currentTheme = computed(() => (themeStore.isDark ? darkThemeConfig : themeConfig))

const antdLocale = computed<Locale>(() => (localeStore.locale === 'zh-CN' ? zhCN : enUS))
</script>

<template>
  <a-config-provider :theme="currentTheme" :locale="antdLocale">
    <XProvider :theme="currentTheme">
      <component :is="layout">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </component>
    </XProvider>
  </a-config-provider>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
