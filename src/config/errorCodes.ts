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

export function getHttpErrorMessage(status: number, fallback?: string): string {
  return httpErrorMessages[status] || fallback || `请求失败 (${status})`
}
