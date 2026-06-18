import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { brandTokens } from './tokens'

/** 亮色：仅覆盖主色，其余使用 antdv 默认主题 */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: brandTokens.primary.light,
    colorInfo: brandTokens.primary.light,
  },
  algorithm: theme.defaultAlgorithm,
}

/** 暗色：仅覆盖主色，其余使用 antdv 默认主题 */
export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: brandTokens.primary.dark,
    colorInfo: brandTokens.primary.dark,
  },
  algorithm: theme.darkAlgorithm,
}
