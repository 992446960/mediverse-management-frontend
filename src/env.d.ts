/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** 文件/静态资源完整地址前缀，用于拼接上传接口返回的相对 path（如未设置则从 VITE_API_BASE_URL 解析 origin） */
  readonly VITE_FILE_BASE_URL?: string
  readonly VITE_APP_TITLE: string
  readonly VITE_ENABLE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
