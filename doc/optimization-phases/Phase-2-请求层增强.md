# Phase 2: 请求层增强

> **风险等级**：🟡 中低 | **预估工作量**：2 天 | **前置依赖**：无（可与 Phase 1 并行）

## 概述

增强 HTTP 请求层：防重复提交、文件下载工具函数、错误码中文映射。核心原则是**新增独立模块 + 最小化修改现有拦截器**，不触碰 token 刷新链路。

---

## 2.1 防重复提交

### 目标

阻止用户在短时间内对同一接口发起重复的变更请求（POST/PUT/DELETE），避免重复创建/修改数据。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/utils/requestDedup.ts` | 新增 | 独立模块，零耦合 |
| `src/api/index.ts` | 修改 | 请求拦截器新增 2 行调用；响应/错误拦截器新增 1 行清理 |

### 安全评估

- **不拦截 GET 请求**：仅对 POST/PUT/PATCH/DELETE 生效
- **排除 auth 端点**：`/auth/login`、`/auth/refresh`、`/auth/logout` 不参与去重，避免干扰 token 刷新队列
- **可按请求关闭**：通过 `config.skipDedup: true` 跳过去重（如轮询接口）
- **使用 AbortController 取消**：重复请求被 abort，而非静默丢弃，不会导致 Promise 泄漏

### 实施步骤

#### Step 1: 新建 `src/utils/requestDedup.ts`

```typescript
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 请求去重模块
 * 原理：对 POST/PUT/PATCH/DELETE 请求，用 [method, url, body] 生成唯一 key
 *       若同 key 请求已在进行中，取消新发起的请求
 */

const pendingMap = new Map<string, AbortController>()

/** 不参与去重的 URL 关键字 */
const EXCLUDE_URLS = ['/auth/login', '/auth/refresh', '/auth/logout']

/** 仅对变更类请求去重 */
const DEDUP_METHODS = ['post', 'put', 'patch', 'delete']

function generateKey(config: InternalAxiosRequestConfig): string {
  const { method, url, data } = config
  const body = typeof data === 'string' ? data : JSON.stringify(data ?? '')
  return `${method}:${url}:${body}`
}

function isExcluded(config: InternalAxiosRequestConfig): boolean {
  const url = config.url || ''
  return EXCLUDE_URLS.some((exclude) => url.includes(exclude))
}

/**
 * 在请求拦截器中调用：检查并注册 pending 请求
 * 若已有相同请求在进行中，取消当前请求
 */
export function addPending(config: InternalAxiosRequestConfig): void {
  // 跳过条件：GET 请求、排除的 URL、主动标记跳过
  if (
    !DEDUP_METHODS.includes(config.method?.toLowerCase() || '') ||
    isExcluded(config) ||
    (config as any).skipDedup === true
  ) {
    return
  }

  const key = generateKey(config)

  if (pendingMap.has(key)) {
    // 取消当前新发起的请求（保留已在进行中的）
    const controller = new AbortController()
    config.signal = controller.signal
    controller.abort('Duplicate request cancelled')
    return
  }

  // 为当前请求创建 AbortController 并注册
  const controller = new AbortController()
  config.signal = config.signal || controller.signal
  pendingMap.set(key, controller)
}

/**
 * 在响应/错误拦截器中调用：移除已完成的 pending 请求
 */
export function removePending(config: InternalAxiosRequestConfig): void {
  if (
    !DEDUP_METHODS.includes(config.method?.toLowerCase() || '') ||
    isExcluded(config)
  ) {
    return
  }

  const key = generateKey(config)
  pendingMap.delete(key)
}

/**
 * 清除所有 pending 请求（可在路由切换时调用）
 */
export function clearAllPending(): void {
  pendingMap.forEach((controller) => {
    controller.abort('Route changed, pending requests cleared')
  })
  pendingMap.clear()
}
```

#### Step 2: 修改 `src/api/index.ts`

在请求拦截器和响应拦截器中集成去重模块：

```diff
--- a/src/api/index.ts
+++ b/src/api/index.ts
@@ -8,6 +8,7 @@ import { message } from 'ant-design-vue'
 import { getToken, setToken, getRefreshToken, clearAuth } from '@/utils/auth'
 import type { ApiResponse } from '@/types'
 import type { RefreshTokenResponse } from '@/types/auth'
+import { addPending, removePending } from '@/utils/requestDedup'

 // ... (fetchAdapter 和 axios 实例创建不变) ...

@@ -94,6 +95,9 @@ api.interceptors.request.use(
   (config: InternalAxiosRequestConfig) => {
     const token = getToken()
     // ... token 和 FormData 逻辑不变 ...
+
+    // 防重复提交（仅 POST/PUT/PATCH/DELETE，排除 auth 端点）
+    addPending(config)
     return config
   },
   (error) => {
@@ -113,6 +117,9 @@ api.interceptors.response.use(
   (response: AxiosResponse<any>) => {
+    // 请求完成，移除 pending 标记
+    removePending(response.config as InternalAxiosRequestConfig)
+
     const res = response.data as ApiResponse
     // ... 后续逻辑不变 ...
   },
   async (error) => {
+    // 请求失败，也移除 pending 标记
+    if (error.config) {
+      removePending(error.config as InternalAxiosRequestConfig)
+    }
+
     const originalRequest = error.config
     // ... 后续 401 刷新逻辑不变 ...
   }
 )
```

**完整修改后的拦截器代码（仅展示改动区域）：**

请求拦截器：
```typescript
// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    // 防重复提交
    addPending(config)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

响应拦截器成功回调开头：
```typescript
  (response: AxiosResponse<any>) => {
    removePending(response.config as InternalAxiosRequestConfig)

    const res = response.data as ApiResponse
    // ... 后续不变 ...
  },
```

响应拦截器错误回调开头：
```typescript
  async (error) => {
    if (error.config) {
      removePending(error.config as InternalAxiosRequestConfig)
    }

    const originalRequest = error.config
    // ... 后续 401 刷新逻辑完全不变 ...
  }
```

### 验证方式

1. 快速双击提交按钮，确认只有第一次请求发出
2. 确认 GET 请求不受影响（如列表刷新）
3. 确认登录接口 `/auth/login` 不受去重影响
4. 确认 token 刷新流程正常工作

---

## 2.2 文件下载工具函数

### 目标

封装通用下载函数，支持 blob 响应校验、自动取文件名、下载失败时解析 JSON 错误信息。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/utils/download.ts` | 新增 | 独立工具函数，按需引用 |

### 安全评估

- 纯新增，不修改任何现有代码
- 现有 `src/utils/triggerFileDownload.ts` 保持不变，新函数用于**从 API 下载 blob**

### 实施步骤

#### Step 1: 新建 `src/utils/download.ts`

```typescript
import api from '@/api'
import { message } from 'ant-design-vue'

/**
 * 通用文件下载
 * @param url    API 路径（如 /export/users）
 * @param params 请求参数
 * @param filename 下载文件名（可选，默认从 Content-Disposition 或 URL 提取）
 * @param method 请求方法，默认 GET
 */
export async function downloadFile(
  url: string,
  params?: Record<string, any>,
  filename?: string,
  method: 'get' | 'post' = 'get'
): Promise<void> {
  try {
    const response =
      method === 'get'
        ? await api.get(url, { params, responseType: 'blob' })
        : await api.post(url, params, { responseType: 'blob' })

    const blob = response.data as Blob

    // 如果后端返回的是 JSON（业务错误），解析并提示
    if (blob.type === 'application/json') {
      const text = await blob.text()
      try {
        const json = JSON.parse(text)
        message.error(json.message || '下载失败')
      } catch {
        message.error('下载失败')
      }
      return
    }

    // 从 Content-Disposition 提取文件名
    if (!filename) {
      const disposition = response.headers?.['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/)
      if (match) {
        filename = decodeURIComponent(match[1])
      } else {
        // 从 URL 提取
        filename = url.split('/').pop() || 'download'
      }
    }

    // 触发浏览器下载
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error: any) {
    message.error(error.message || '下载失败')
    throw error
  }
}
```

### 使用示例

```typescript
import { downloadFile } from '@/utils/download'

// GET 下载
await downloadFile('/export/users', { dept_id: '123' }, '用户列表.xlsx')

// POST 下载
await downloadFile('/export/report', { date_range: [start, end] }, '报告.pdf', 'post')
```

### 验证方式

1. 使用实际导出接口验证下载功能
2. 模拟后端返回 JSON 错误（blob 为 application/json），确认提示错误信息而不是下载空文件

---

## 2.3 HTTP 错误码中文映射

### 目标

为常见 HTTP 错误码提供中文友好提示，替代原始的英文 statusText。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/config/errorCodes.ts` | 新增 | 独立配置文件 |
| `src/api/index.ts` | 修改 | 响应错误拦截器中 3 行 fallback 逻辑 |

### 安全评估

- 以 **fallback 模式**接入：仅在后端未返回 `message` 字段时，才走错误码映射
- 不改变现有错误提示的优先级：`error.response.data.message > errorCodeMap > 原始 error.message`
- 不影响 401 刷新逻辑和 auth 端点静默策略

### 实施步骤

#### Step 1: 新建 `src/config/errorCodes.ts`

```typescript
/**
 * HTTP 状态码 → 中文友好提示
 * 仅在后端未返回业务 message 时使用
 */
export const httpErrorMessages: Record<number, string> = {
  400: '请求参数有误',
  401: '登录已过期，请重新登录',
  403: '没有权限访问该资源',
  404: '请求的资源不存在',
  405: '请求方法不被允许',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  413: '上传内容过大',
  422: '请求参数校验失败',
  429: '请求过于频繁，请稍后重试',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用，请稍后重试',
  504: '网关超时',
}

/**
 * 根据 HTTP 状态码获取友好提示
 */
export function getHttpErrorMessage(status: number, fallback?: string): string {
  return httpErrorMessages[status] || fallback || `请求失败 (${status})`
}
```

#### Step 2: 修改 `src/api/index.ts` 响应错误拦截器

在错误拦截器中，替换硬编码的错误提示：

```diff
--- a/src/api/index.ts (错误拦截器尾部)
+++ b/src/api/index.ts
@@ -1,6 +1,7 @@
 import type { ApiResponse } from '@/types'
 import type { RefreshTokenResponse } from '@/types/auth'
+import { getHttpErrorMessage } from '@/config/errorCodes'

 // ... 中间不变 ...

     // 通用错误提示（位于错误拦截器尾部，第 200-213 行附近）
     const isAuthEndpoint =
       originalRequest?.url?.includes?.('/auth/me') ||
       originalRequest?.url?.includes?.('/auth/logout')
     const isNetworkError =
       !error.response && (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error'))
     const is5xx = error.response?.status != null && error.response.status >= 500
     if (!(isAuthEndpoint && (isNetworkError || is5xx))) {
-      const errorMsg = error.response?.data?.message || error.message || '请求失败'
+      const errorMsg =
+        error.response?.data?.message ||
+        (error.response?.status ? getHttpErrorMessage(error.response.status) : null) ||
+        error.message ||
+        '请求失败'
       const silent = originalRequest?.skipErrorToast === true
       if (!silent) {
         message.error(errorMsg)
       }
     }
```

### 验证方式

1. 模拟 500 错误，确认提示"服务器内部错误"而非英文 "Internal Server Error"
2. 模拟 404 错误，确认提示"请求的资源不存在"
3. 后端返回带 `message` 字段的错误，确认仍优先显示后端消息

---

## TypeScript 类型扩展

为 `skipDedup` 和 `skipErrorToast` 提供类型支持。修改或新建 `src/types/axios.d.ts`：

```typescript
import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 跳过防重复提交检查 */
    skipDedup?: boolean
    /** 跳过错误 toast 提示 */
    skipErrorToast?: boolean
  }
}
```

> 注：如果项目已有类似的类型扩展文件，合并到现有文件中。

---

## 完成标志

- [ ] `pnpm dev` 启动无报错
- [ ] 快速重复提交变更请求，仅第一次有效
- [ ] `downloadFile` 函数可正常下载文件
- [ ] HTTP 错误提示为中文
- [ ] token 刷新流程不受影响
- [ ] TypeScript 编译通过 (`vue-tsc -b`)
