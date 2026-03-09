/** Pinia 持久化仅持久化 user 时使用的 key，与 store 的 persist.key 一致 */
export const AUTH_STORAGE_KEY = 'mediverse_auth'

const TokenKey = 'mediverse_access_token'
const RefreshTokenKey = 'mediverse_refresh_token'

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
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
