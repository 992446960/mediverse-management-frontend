/** Pinia 持久化仅持久化 user 时使用的 key，与 store 的 persist.key 一致 */
export const AUTH_STORAGE_KEY = 'mediverse_auth'

const TokenKey = 'mediverse_access_token'
const RefreshTokenKey = 'mediverse_refresh_token'

/** 本会话跳过修改密码（点击「稍后修改」后设置，logout 时清除） */
const SkipChangePwdKey = 'mediverse_skip_change_pwd'

export function getToken(): string | null {
  return localStorage.getItem(TokenKey)
}

export function setToken(token: string) {
  localStorage.setItem(TokenKey, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(RefreshTokenKey)
}

export function setRefreshToken(token: string) {
  localStorage.setItem(RefreshTokenKey, token)
}

export function clearAuth() {
  localStorage.removeItem(TokenKey)
  localStorage.removeItem(RefreshTokenKey)
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(SkipChangePwdKey)
}

/** 本会话跳过修改密码（点击「稍后修改」时设置，守卫据此不再重定向到 /change-password） */
export function setSkipChangePassword() {
  sessionStorage.setItem(SkipChangePwdKey, '1')
}

export function getSkipChangePassword(): boolean {
  return sessionStorage.getItem(SkipChangePwdKey) === '1'
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
