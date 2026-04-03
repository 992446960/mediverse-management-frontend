<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import { XProvider } from 'ant-design-x-vue'
import MainLayout from '@/layouts/MainLayout.vue'
import FullscreenLayout from '@/layouts/FullscreenLayout.vue'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'
import { useTagsViewStore } from '@/stores/tagsView'
import { themeConfig, darkThemeConfig } from '@/config/themes'
import type { Locale } from 'ant-design-vue/es/locale'

const route = useRoute() // 当前路由
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const tagsViewStore = useTagsViewStore()
const cachedViews = computed(() => tagsViewStore.cachedViews)

/** /chat/* 共用同一外层组件实例，避免每换一个 session id 就整页销毁；会话粒度的缓存由内层 router-view + keep-alive 负责 */
const routerViewKey = computed(() => {
  if (route.path === '/chat' || route.path.startsWith('/chat/')) return '/chat'
  return route.fullPath
})

const layout = computed(() =>
  route.meta.layout === 'FullscreenLayout' ? FullscreenLayout : MainLayout
)

const currentTheme = computed(() => (themeStore.isDark ? darkThemeConfig : themeConfig))

const antdLocale = computed<Locale>(() => (localeStore.locale === 'zh-CN' ? zhCN : enUS))
</script>

<template>
  <a-config-provider class="block h-full min-h-0" :theme="currentTheme" :locale="antdLocale">
    <XProvider class="block h-full min-h-0" :theme="currentTheme">
      <component :is="layout" class="h-full min-h-0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="routerViewKey" />
            </keep-alive>
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
