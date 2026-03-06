import { request } from './index'
import type { LoginParams, LoginResponse, User, ChangePasswordParams } from '@/types/auth'

export const authApi = {
  login(params: LoginParams) {
    return request.post<LoginResponse>('/auth/login', params)
  },

  logout() {
    return request.post<void>('/auth/logout')
  },

  refreshToken(refreshToken: string) {
    return request.post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken })
  },

  getUserInfo() {
    return request.get<User>('/auth/me')
  },

  changePassword(params: ChangePasswordParams) {
    return request.post<void>('/auth/change-password', params)
  }
}
