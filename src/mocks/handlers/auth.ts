import { http, HttpResponse } from 'msw'
import { users } from '../data/users'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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
        expires_in: 3600,
        user,
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
        expires_in: 3600,
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
    const userId = userIdMatch ? userIdMatch[1] : null

    const user = users.find((u) => u.id === userId)

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
      data: user,
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
