import { request } from './index'
import type {
  LoginParams,
  LoginResponse,
  AuthMeResponse,
  RefreshTokenResponse,
  ChangePasswordParams,
  UpdateMeParams,
  UpdateMeResponse,
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
    return request.get<AuthMeResponse>('/auth/me')
  },

  changePassword(params: ChangePasswordParams) {
    return request.post<void>('/auth/change-password', params)
  },

  /** 修改当前用户 PUT /auth/me，返回 data 或 { user } 结构 */
  updateMe(params: UpdateMeParams) {
    return request.put<UpdateMeResponse>('/auth/me', params)
  },
}
