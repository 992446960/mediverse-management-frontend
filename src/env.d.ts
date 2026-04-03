/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径 */
  readonly VITE_API_BASE_URL: string
  /** 文件服务基础 URL */
  readonly VITE_FILE_BASE_URL?: string
  /** 应用标题 */
  /** 浏览器标签标题后缀，如「 (Dev)」；品牌名取自 i18n `app.brandName` */
  readonly VITE_APP_TITLE_SUFFIX?: string
  /** 是否启用 MSW Mock */
  readonly VITE_ENABLE_MOCK?: string
  /** 部署路径前缀 */
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
