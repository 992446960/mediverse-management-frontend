/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Departments 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET    /departments
 *  GET    /departments/tree
 *  POST   /departments
 *  PUT    /departments/{id}
 *  DELETE /departments/{id}
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPut,
  authedDelete,
  unauthGet,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertPaginatedData,
  assertUUID,
  assertDatetime,
} from './schema-validator'

describe('Departments 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /departments ────────────────────────────────────

  describe('GET /departments', () => {
    it('应返回分页列表且符合 Schema', async () => {
      const res = await authedGet('/departments', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      assertPaginatedData(data)

      if (data.items.length > 0) {
        const item = data.items[0]
        assertUUID(item.id, 'dept.id')
        assertUUID(item.org_id, 'dept.org_id')
        expect(typeof item.name).toBe('string')
        expect(typeof item.code).toBe('string')
        expect(typeof item.status).toBe('string')
        assertDatetime(item.created_at, 'dept.created_at')
      }

      await assertMatchesSchema('list_departments_api_v1_departments_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/departments')
      expect(res.status).toBe(401)
    })

    it('支持 org_id 筛选', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000'
      const res = await authedGet('/departments', { org_id: fakeOrgId })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })
  })

  // ─── GET /departments/tree ───────────────────────────────

  describe('GET /departments/tree', () => {
    it('应返回树结构数组', async () => {
      const res = await authedGet('/departments/tree')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const node = data[0]
        assertUUID(node.id, 'tree_node.id')
        expect(typeof node.name).toBe('string')
        expect(typeof node.type).toBe('string')
      }

      await assertMatchesSchema('department_tree_api_v1_departments_tree_get', res.data)
    })
  })

  // ─── POST /departments ──────────────────────────────────

  describe('POST /departments', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/departments', {})
      expect(res.status).toBe(400)
    })
  })

  // ─── PUT /departments/{id} ──────────────────────────────

  describe('PUT /departments/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPut(`/departments/${fakeId}`, { name: 'test' })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── DELETE /departments/{id} ────────────────────────────

  describe('DELETE /departments/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedDelete(`/departments/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })
})
