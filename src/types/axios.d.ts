import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 为 true 时不弹出全局 message.error（由调用方自行处理） */
    skipErrorToast?: boolean
  }
}
