import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

/** 亮色：仅覆盖主色，其余使用 antdv 默认主题 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#0EA5E9',
    colorInfo: '#0EA5E9',
  },
  algorithm: theme.defaultAlgorithm,
}

/** 暗色：仅覆盖主色，其余使用 antdv 默认主题 */
export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#38BDF8',
    colorInfo: '#38BDF8',
  },
  algorithm: theme.darkAlgorithm,
}
