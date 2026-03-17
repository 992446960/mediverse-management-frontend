import { http, HttpResponse } from 'msw'
import { users } from '../data/users'
import { getMutableUserById, updateMutableMe } from './users'
import type { UserListItem } from '@/types/user'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 为登录/me 返回的用户注入 has_*_avatar（按权限矩阵：系统管理员不展示工作台） */
function withWorkbenchAvatars(u: UserListItem) {
  const roles = u.roles || []
  const isPureUser =
    roles.includes('user') &&
    !roles.includes('sysadmin') &&
    !roles.includes('org_admin') &&
    !roles.includes('dept_admin')
  return {
    ...u,
    has_expert_avatar: isPureUser,
    has_dept_avatar: roles.includes('dept_admin'),
    has_org_avatar: roles.includes('org_admin'),
  }
}

export const authHandlers = [
  // Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { username, password } = (await request.json()) as any

    const user = users.find((u) => u.username === username)

    if (!user) {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid username or password',
        data: null,
      })
    }

    // Mock password check (in real app, use hash). 默认密码：admin123
    if (password !== 'admin123') {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid username or password',
        data: null,
      })
    }

    if (user.status !== 'active') {
      return HttpResponse.json({
        code: 403,
        message: 'Account is disabled',
        data: null,
      })
    }

    return HttpResponse.json({
      code: 0,
      message: 'Success',
      data: {
        access_token: `mock_access_token_${user.id}`,
        refresh_token: `mock_refresh_token_${user.id}`,
        token_type: 'Bearer',
        expires_in: 28800,
        user: withWorkbenchAvatars(user),
      },
    })
  }),

  // Logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({
      code: 0,
      message: 'Success',
      data: null,
    })
  }),

  // Refresh Token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const { refresh_token } = (await request.json()) as any

    if (!refresh_token || !refresh_token.startsWith('mock_refresh_token_')) {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid refresh token',
        data: null,
      })
    }

    const userId = refresh_token.replace('mock_refresh_token_', '')
    const user = users.find((u) => u.id === userId)

    if (!user) {
      return HttpResponse.json({
        code: 401,
        message: 'User not found',
        data: null,
      })
    }

    return HttpResponse.json({
      code: 0,
      message: 'Success',
      data: {
        access_token: `mock_access_token_${user.id}_refreshed`,
        token_type: 'Bearer',
        expires_in: 28800,
      },
    })
  }),

  // Get User Info
  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        code: 401,
        message: 'Unauthorized',
        data: null,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    // Simple mock token parsing
    const userIdMatch = token.match(/mock_access_token_(.+?)(_refreshed)?$/)
    const userId = userIdMatch?.[1]
    if (typeof userId !== 'string') {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid token',
        data: null,
      })
    }
    const user = getMutableUserById(userId) ?? users.find((u) => u.id === userId)

    if (!user) {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid token',
        data: null,
      })
    }

    return HttpResponse.json({
      code: 0,
      message: 'Success',
      data: withWorkbenchAvatars(user),
    })
  }),

  // Update current user (PUT /auth/me)
  http.put(`${API_BASE}/auth/me`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        code: 401,
        message: 'Unauthorized',
        data: null,
      })
    }
    const token = authHeader.replace('Bearer ', '')
    const userIdMatch = token.match(/mock_access_token_(.+?)(_refreshed)?$/)
    const userId = userIdMatch?.[1]
    if (typeof userId !== 'string') {
      return HttpResponse.json({
        code: 401,
        message: 'Invalid token',
        data: null,
      })
    }
    const body = (await request.json()) as {
      real_name?: string
      avatar_url?: string
      username?: string
      phone?: string
      email?: string
      remark?: string
    }
    const updated = updateMutableMe(userId, body)
    if (!updated) {
      return HttpResponse.json({
        code: 40002,
        message: 'User not found',
        data: null,
      })
    }
    return HttpResponse.json({
      code: 0,
      message: 'Success',
      data: withWorkbenchAvatars(updated),
    })
  }),

  // Change Password
  http.post(`${API_BASE}/auth/change-password`, async ({ request }) => {
    const { old_password, new_password } = (await request.json()) as any

    // Mock validation
    if (!old_password || !new_password) {
      return HttpResponse.json({
        code: 400,
        message: 'Missing parameters',
        data: null,
      })
    }

    if (new_password.length < 6) {
      return HttpResponse.json({
        code: 400,
        message: 'Password must be at least 6 characters',
        data: null,
      })
    }

    return HttpResponse.json({
      code: 0,
      message: 'Password changed successfully',
      data: null,
    })
  }),
]
