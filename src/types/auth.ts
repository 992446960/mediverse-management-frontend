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
  /** 是否显示「我的工作台」 */
  has_expert_avatar: boolean
  /** 是否显示「科室工作台」 */
  has_dept_avatar: boolean
  /** 是否显示「机构工作台」 */
  has_org_avatar: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  remark?: string
}

export interface LoginParams {
  username: string
  password: string
  code?: string // 验证码登录（可选）
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in: number
  user: User
}

/** 刷新 Token 接口返回的 data，与 API 文档 1.1.2 一致 */
export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
}

export interface ChangePasswordParams {
  old_password: string
  new_password: string
  confirm_password: string
}

/** 修改当前用户 PUT /auth/me 请求体（字段可选，仅传需修改的） */
export interface UpdateMeParams {
  real_name?: string
  avatar_url?: string
  username?: string
  phone?: string
  email?: string
  remark?: string
}
