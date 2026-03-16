import { request } from './index'
import type {
  LoginParams,
  LoginResponse,
  RefreshTokenResponse,
  User,
  ChangePasswordParams,
} from '@/types/auth'

export const authApi = {
  login(params: LoginParams) {
    return request.post<LoginResponse>('/auth/login', params)
  },

  logout() {
    return request.post<void>('/auth/logout')
  },

  refreshToken(refreshToken: string) {
    return request.post<RefreshTokenResponse>('/auth/refresh', { refresh_token: refreshToken })
  },

  getUserInfo() {
    return request.get<User>('/auth/me')
  },

  changePassword(params: ChangePasswordParams) {
    return request.post<void>('/auth/change-password', params)
  },
}
