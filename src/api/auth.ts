import { request } from './index'
import type {
  LoginParams,
  LoginResponse,
  RefreshTokenResponse,
  User,
  ChangePasswordParams,
  UpdateMeParams,
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

  /** 修改当前用户 PUT /auth/me，返回更新后的用户对象 */
  updateMe(params: UpdateMeParams) {
    return request.put<User>('/auth/me', params)
  },
}
