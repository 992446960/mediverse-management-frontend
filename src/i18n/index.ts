import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

/** 单一数据源：初始语言（localStorage 优先，否则按浏览器语言） */
export function getInitialLocale(): 'zh-CN' | 'en-US' {
  const saved =
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('app-locale') as 'zh-CN' | 'en-US' | null)
      : null
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  const language = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
  return language.startsWith('zh') ? 'zh-CN' : 'en-US'
}

const defaultLocale = getInitialLocale()

export const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: defaultLocale,
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n
