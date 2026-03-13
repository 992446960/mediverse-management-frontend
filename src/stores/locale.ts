import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n, getInitialLocale } from '@/i18n'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

export type SupportedLocale = 'zh-CN' | 'en-US'

export const useLocaleStore = defineStore('locale', () => {
  // State：与 i18n 使用同一初始值，避免首屏不一致
  const locale = ref<SupportedLocale>(getInitialLocale())

  // Actions
  function setLocale(newLocale: SupportedLocale) {
    locale.value = newLocale
    localStorage.setItem('app-locale', newLocale)

    // Update vue-i18n
    if (i18n.global) {
      // @ts-ignore - handling composition API mode dynamic locale change
      i18n.global.locale.value = newLocale
    }

    // Update dayjs
    dayjs.locale(newLocale === 'zh-CN' ? 'zh-cn' : 'en')

    // Update document language
    document.querySelector('html')?.setAttribute('lang', newLocale)
  }

  return {
    locale,
    setLocale,
  }
})
