export type UserRole = 'sysadmin' | 'org_admin' | 'dept_admin' | 'user'

export interface User {
  id: string
  username: string
  email: string
  phone?: string
  full_name: string
  avatar_url?: string
  role: UserRole
  org_id?: string
  dept_id?: string
  is_active: boolean
  must_change_pwd: boolean
  has_avatar: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface LoginParams {
  username: string
  password?: string
  code?: string // 验证码登录
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface ChangePasswordParams {
  old_password?: string
  new_password?: string
}
