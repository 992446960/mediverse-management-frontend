/** Pinia 持久化仅持久化 user 时使用的 key，与 store 的 persist.key 一致 */
export const AUTH_STORAGE_KEY = 'mediverse_auth'

const TokenKey = 'mediverse_access_token'
const RefreshTokenKey = 'mediverse_refresh_token'

/** 本地持久化：用户对「稍后修改」的选择（按 userId，换账号不影响他人） */
const SkipChangePwdUserIdKey = 'mediverse_skip_change_pwd_user_id'

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

/** 记录当前用户已选择「稍后修改」，守卫据此不再重定向到 /change-password */
export function setSkipChangePassword(userId: string) {
  localStorage.setItem(SkipChangePwdUserIdKey, userId)
}

export function getSkipChangePassword(currentUserId: string | undefined): boolean {
  if (!currentUserId) {
    return false
  }
  return localStorage.getItem(SkipChangePwdUserIdKey) === currentUserId
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
