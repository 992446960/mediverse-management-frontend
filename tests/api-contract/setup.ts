/**
 * API 合规性测试 — 公共 setup
 *
 * 提供：
 *  - getBaseUrl()          读取环境变量中的 API 地址
 *  - loginAndGetToken()    调用登录接口拿 access_token
 *  - authedGet / authedPost / ... 封装鉴权请求
 *  - rawRequest()          不做 BaseResponse 解包的原始请求
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// ─── 环境变量 ──────────────────────────────────────────────────

export function getBaseUrl(): string {
  const url = process.env.API_BASE_URL
  if (!url) throw new Error('缺少环境变量 API_BASE_URL')
  return url.replace(/\/$/, '')
}

function getCredentials() {
  const username = process.env.TEST_USERNAME
  const password = process.env.TEST_PASSWORD
  if (!username || !password) {
    throw new Error('缺少环境变量 TEST_USERNAME 或 TEST_PASSWORD')
  }
  return { username, password }
}

// ─── 通用 BaseResponse 结构 ───────────────────────────────────

export interface BaseResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ─── HTTP 客户端 ─────────────────────────────────────────────

let _client: AxiosInstance | null = null
let _token: string | null = null

function client(): AxiosInstance {
  if (!_client) {
    _client = axios.create({
      baseURL: getBaseUrl(),
      timeout: 15_000,
      validateStatus: () => true, // 不抛异常，让测试自行判断状态码
    })
  }
  return _client
}

/** 登录并缓存 Token（整个 test suite 只调用一次） */
export async function loginAndGetToken(): Promise<string> {
  if (_token) return _token
  const { username, password } = getCredentials()
  const res = await client().post<BaseResponse<{ access_token: string }>>('/auth/login', {
    username,
    password,
  })
  if (res.status !== 200 || res.data.code !== 0) {
    throw new Error(`登录失败: ${res.status} ${JSON.stringify(res.data)}`)
  }
  _token = res.data.data.access_token
  return _token
}

export function getToken(): string {
  if (!_token) throw new Error('Token 未初始化，请先调用 loginAndGetToken()')
  return _token
}

// ─── 便捷请求方法 ──────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}` }
}

/**
 * 发送原始请求，返回完整 AxiosResponse（不解包）
 * 用于精确断言 HTTP 状态码 & BaseResponse 结构
 */
export async function rawRequest<T = BaseResponse>(
  method: string,
  url: string,
  opts?: {
    data?: unknown
    params?: Record<string, unknown>
    headers?: Record<string, string>
    config?: AxiosRequestConfig
  }
): Promise<AxiosResponse<T>> {
  const cfg: AxiosRequestConfig = {
    method,
    url,
    data: opts?.data,
    params: opts?.params,
    headers: opts?.headers,
    ...opts?.config,
  }
  return client().request<T>(cfg)
}

/** 带鉴权的 GET */
export function authedGet<T = BaseResponse>(
  url: string,
  params?: Record<string, unknown>
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('GET', url, { params, headers: authHeaders() })
}

/** 带鉴权的 POST */
export function authedPost<T = BaseResponse>(
  url: string,
  data?: unknown
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('POST', url, { data, headers: authHeaders() })
}

/** 带鉴权的 PUT */
export function authedPut<T = BaseResponse>(
  url: string,
  data?: unknown
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('PUT', url, { data, headers: authHeaders() })
}

/** 带鉴权的 PATCH */
export function authedPatch<T = BaseResponse>(
  url: string,
  data?: unknown
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('PATCH', url, { data, headers: authHeaders() })
}

/** 带鉴权的 DELETE */
export function authedDelete<T = BaseResponse>(url: string): Promise<AxiosResponse<T>> {
  return rawRequest<T>('DELETE', url, { headers: authHeaders() })
}

/** 不带鉴权的 GET（用于测试 401） */
export function unauthGet<T = BaseResponse>(
  url: string,
  params?: Record<string, unknown>
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('GET', url, { params })
}

/** 不带鉴权的 POST（用于测试 401） */
export function unauthPost<T = BaseResponse>(
  url: string,
  data?: unknown
): Promise<AxiosResponse<T>> {
  return rawRequest<T>('POST', url, { data })
}
