/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Auth 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  POST /auth/login
 *  POST /auth/refresh
 *  GET  /auth/me
 *  POST /auth/logout
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  rawRequest,
  authedGet,
  authedPost,
  unauthGet,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertUUID,
  assertDatetime,
} from './schema-validator'

describe('Auth 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── POST /auth/login ────────────────────────────────────

  describe('POST /auth/login', () => {
    it('正确的用户名密码应返回 200 + token', async () => {
      const res = await rawRequest<BaseResponse>('POST', '/auth/login', {
        data: {
          username: process.env.TEST_USERNAME,
          password: process.env.TEST_PASSWORD,
        },
      })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.access_token).toBeTruthy()
      expect(data.refresh_token).toBeTruthy()
      expect(typeof data.expires_in).toBe('number')
      expect(data.user).toBeDefined()

      await assertMatchesSchema('login_api_v1_auth_login_post', res.data)
    })

    it('错误密码应返回业务错误（code !== 0）或 401', async () => {
      const res = await rawRequest<BaseResponse>('POST', '/auth/login', {
        data: { username: 'nonexistent_user_xyz', password: 'wrong' },
      })
      const isAuthError = res.status === 401 || (res.data as any)?.code !== 0
      expect(isAuthError).toBe(true)
    })

    it('缺少必填字段应返回 400', async () => {
      const res = await rawRequest<BaseResponse>('POST', '/auth/login', {
        data: {},
      })
      expect(res.status).toBe(400)
    })
  })

  // ─── GET /auth/me ────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('带 Token 应返回当前用户信息', async () => {
      const res = await authedGet('/auth/me')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.user).toBeDefined()
      assertUUID(data.user.id, 'user.id')

      await assertMatchesSchema('me_api_v1_auth_me_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/auth/me')
      expect(res.status).toBe(401)
    })
  })

  // ─── POST /auth/refresh ──────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('使用有效 refresh_token 应返回新 access_token', async () => {
      // 先登录拿 refresh_token
      const loginRes = await rawRequest<BaseResponse>('POST', '/auth/login', {
        data: {
          username: process.env.TEST_USERNAME,
          password: process.env.TEST_PASSWORD,
        },
      })
      const refreshToken = (loginRes.data as any).data.refresh_token

      const res = await rawRequest<BaseResponse>('POST', '/auth/refresh', {
        data: { refresh_token: refreshToken },
      })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
      expect((res.data as any).data.access_token).toBeTruthy()

      await assertMatchesSchema('refresh_token_api_v1_auth_refresh_post', res.data)
    })

    it('无效 refresh_token 应返回错误', async () => {
      const res = await rawRequest<BaseResponse>('POST', '/auth/refresh', {
        data: { refresh_token: 'invalid-token-xyz' },
      })
      const isError = res.status === 401 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── POST /auth/logout ──────────────────────────────────

  describe('POST /auth/logout', () => {
    it('不带 Token 应返回 401', async () => {
      const res = await rawRequest<BaseResponse>('POST', '/auth/logout')
      expect(res.status).toBe(401)
    })

    it('带 Token 应成功登出', async () => {
      // 用一个临时 token 测试 logout，避免影响后续测试
      const loginRes = await rawRequest<BaseResponse>('POST', '/auth/login', {
        data: {
          username: process.env.TEST_USERNAME,
          password: process.env.TEST_PASSWORD,
        },
      })
      const tempToken = (loginRes.data as any).data.access_token

      const res = await rawRequest<BaseResponse>('POST', '/auth/logout', {
        headers: { Authorization: `Bearer ${tempToken}` },
      })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })
  })
})
