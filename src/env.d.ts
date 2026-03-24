/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径 */
  readonly VITE_API_BASE_URL: string
  /** 文件服务基础 URL */
  readonly VITE_FILE_BASE_URL?: string
  /** 应用标题 */
  readonly VITE_APP_TITLE?: string
  /** 是否启用 MSW Mock */
  readonly VITE_ENABLE_MOCK?: string
  /** 部署路径前缀 */
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
