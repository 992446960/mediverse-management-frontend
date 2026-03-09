import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { message } from 'ant-design-vue'
import { getToken, setToken, getRefreshToken, clearAuth } from '@/utils/auth'
import type { ApiResponse } from '@/types'

const baseURL = import.meta.env.VITE_API_BASE_URL
const useMockFetch = import.meta.env.VITE_ENABLE_MOCK === 'true'

/** 使用 fetch 的 axios 适配器，便于 MSW 拦截（MSW 仅拦截 fetch，不拦截 XHR） */
function fetchAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = config.baseURL
    ? `${config.baseURL.replace(/\/$/, '')}/${config.url?.replace(/^\//, '')}`
    : config.url!
  const controller = new AbortController()
  const timeoutId = config.timeout
    ? setTimeout(() => controller.abort(), config.timeout)
    : undefined
  const headers = new Headers(config.headers as Record<string, string>)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  // config.data 可能已被 axios 的 transformRequest 序列化为字符串，避免二次 JSON.stringify
  const body =
    config.data == null
      ? undefined
      : typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data)

  return fetch(url, {
    method: config.method?.toUpperCase() || 'GET',
    headers,
    body,
    signal: controller.signal,
  }).then(
    async (response) => {
      if (timeoutId) clearTimeout(timeoutId)
      const text = await response.text()
      let data: unknown
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = text
      }
      const axiosRes = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      } as unknown as AxiosResponse
      if (!response.ok) {
        const err = new Error(response.statusText || 'Request failed') as Error & {
          response: AxiosResponse
        }
        err.response = axiosRes
        return Promise.reject(err)
      }
      return axiosRes
    },
    (err) => {
      if (timeoutId) clearTimeout(timeoutId)
      return Promise.reject(err)
    }
  )
}

// 创建 axios 实例
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: useMockFetch ? fetchAdapter : undefined,
})

// 防止并发刷新 Token 的标志位
let isRefreshing = false
// 存储因 Token 过期而挂起的请求
let requestsQueue: Array<(token: string) => void> = []

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const res = response.data as ApiResponse

    // 如果是二进制数据（如文件下载），直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }

    // 业务状态码判断
    if (res.code !== 0) {
      // /auth/me、/auth/logout 业务失败时由路由守卫静默跳转登录，不弹 toast（与 5xx 行为一致）
      const isAuthEndpoint =
        response.config?.url?.includes?.('/auth/me') ||
        response.config?.url?.includes?.('/auth/logout')
      if (!isAuthEndpoint) {
        message.error(res.message || 'Error')
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res.data
  },
  async (error) => {
    const originalRequest = error.config

    // 处理 401 未授权
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          requestsQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // 调用刷新 Token 接口 (使用独立的 axios 实例避免死循环)
        const { data } = await axios.post<{ code: number; data: { access_token: string } }>(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        if (data.code === 0) {
          const newToken = data.data.access_token
          setToken(newToken)

          requestsQueue.forEach((callback) => callback(newToken))
          requestsQueue = []

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } else {
          throw new Error('Refresh token failed')
        }
      } catch (refreshError) {
        clearAuth()
        requestsQueue = []
        message.error('登录已过期，请重新登录')
        // 使用 window.location.href 跳转，确保清除状态
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // /auth/me、/auth/logout 失败时由路由守卫静默跳转登录，不弹 toast（含网络错误与 5xx）
    const isAuthEndpoint =
      originalRequest?.url?.includes?.('/auth/me') ||
      originalRequest?.url?.includes?.('/auth/logout')
    const isNetworkError =
      !error.response && (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error'))
    const is5xx = error.response?.status != null && error.response.status >= 500
    if (!(isAuthEndpoint && (isNetworkError || is5xx))) {
      const errorMsg = error.response?.data?.message || error.message || '请求失败'
      message.error(errorMsg)
    }
    return Promise.reject(error)
  }
)

// 封装通用请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.get(url, config) as Promise<T>
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.post(url, data, config) as Promise<T>
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.put(url, data, config) as Promise<T>
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.delete(url, config) as Promise<T>
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.patch(url, data, config) as Promise<T>
  },
}

export default api
