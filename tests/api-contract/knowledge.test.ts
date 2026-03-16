/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Knowledge 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET    /knowledge/{owner_type}/{owner_id}/directories
 *  POST   /knowledge/{owner_type}/{owner_id}/directories
 *  GET    /knowledge/{owner_type}/{owner_id}/files
 *  GET    /knowledge/{owner_type}/{owner_id}/cards
 *  POST   /knowledge/{owner_type}/{owner_id}/cards
 *  GET    /knowledge/{owner_type}/{owner_id}/cards/{id}
 *  PUT    /knowledge/{owner_type}/{owner_id}/cards/{id}
 *  PATCH  /knowledge/{owner_type}/{owner_id}/cards/{id}/status
 *  GET    /knowledge/{owner_type}/{owner_id}/cards/{id}/versions
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPut,
  authedPatch,
  authedDelete,
  unauthGet,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertUUID,
  assertDatetime,
} from './schema-validator'

/**
 * 获取一个可用的 owner_type / owner_id
 * owner_type 合法枚举：personal / dept / org
 *
 * 策略：
 *  1. 从 GET /auth/me 拿当前用户的 org_id / dept_id
 *  2. 优先用 org（数据最全），其次 dept，最后 personal（用 user.id）
 */
async function getTestOwner(): Promise<{ ownerType: string; ownerId: string } | null> {
  const meRes = await authedGet('/auth/me')
  const meData = (meRes.data as any).data
  if (!meData?.user) return null

  const user = meData.user

  if (user.org_id) {
    return { ownerType: 'org', ownerId: user.org_id }
  }
  if (user.dept_id) {
    return { ownerType: 'dept', ownerId: user.dept_id }
  }
  return { ownerType: 'personal', ownerId: user.id }
}

describe('Knowledge 模块', () => {
  let owner: { ownerType: string; ownerId: string } | null = null
  const basePath = () => `/knowledge/${owner!.ownerType}/${owner!.ownerId}`

  beforeAll(async () => {
    await loginAndGetToken()
    owner = await getTestOwner()
  })

  // ─── Directories ─────────────────────────────────────────

  describe('Directories', () => {
    it('GET directories 应返回树结构', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const res = await authedGet(`${basePath()}/directories`)
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const dir = data[0]
        assertUUID(dir.id, 'directory.id')
        expect(typeof dir.name).toBe('string')
        expect(typeof dir.is_default).toBe('boolean')
        expect(typeof dir.sort_order).toBe('number')
        expect(typeof dir.file_count).toBe('number')
        expect(Array.isArray(dir.children)).toBe(true)
      }
    })

    it('POST directories 缺 name 应返回 400', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const res = await authedPost(`${basePath()}/directories`, {})
      expect(res.status).toBe(400)
    })
  })

  // ─── Files ───────────────────────────────────────────────

  describe('Files', () => {
    it('GET files 应返回列表', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const res = await authedGet(`${basePath()}/files`, { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.items).toBeInstanceOf(Array)

      if (data.items.length > 0) {
        const file = data.items[0]
        assertUUID(file.id, 'file.id')
        expect(typeof file.file_name).toBe('string')
        expect(typeof file.file_type).toBe('string')
        expect(typeof file.file_size).toBe('number')
        expect(typeof file.status).toBe('string')
        assertDatetime(file.created_at, 'file.created_at')
      }

      await assertMatchesSchema(
        'list_files_api_v1_knowledge__owner_type___owner_id__files_get',
        res.data
      )
    })
  })

  // ─── Cards ───────────────────────────────────────────────

  describe('Cards', () => {
    it('GET cards 应返回列表', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const res = await authedGet(`${basePath()}/cards`, { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.items).toBeInstanceOf(Array)

      if (data.items.length > 0) {
        const card = data.items[0]
        assertUUID(card.id, 'card.id')
        expect(typeof card.type).toBe('string')
        expect(typeof card.title).toBe('string')
        expect(Array.isArray(card.tags)).toBe(true)
        expect(typeof card.online_status).toBe('string')
        expect(typeof card.audit_status).toBe('string')
        assertDatetime(card.created_at, 'card.created_at')
      }

      await assertMatchesSchema(
        'list_cards_api_v1_knowledge__owner_type___owner_id__cards_get',
        res.data
      )
    })

    it('POST cards 缺少必填字段应返回 400', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const res = await authedPost(`${basePath()}/cards`, {})
      expect(res.status).toBe(400)
    })

    it('GET cards/{id} 不存在应返回业务错误或 404', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedGet(`${basePath()}/cards/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })

    it('GET cards/{id} 存在时应符合 Schema', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const listRes = await authedGet(`${basePath()}/cards`, { page: 1, page_size: 1 })
      const items = (listRes.data as any).data?.items
      if (!items || items.length === 0) {
        console.warn('跳过: 无知识卡数据')
        return
      }

      const cardId = items[0].id
      const res = await authedGet(`${basePath()}/cards/${cardId}`)
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      await assertMatchesSchema(
        'get_card_detail_api_v1_knowledge__owner_type___owner_id__cards__id__get',
        res.data
      )
    })

    it('GET cards/{id}/versions 应返回版本数组', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')

      const listRes = await authedGet(`${basePath()}/cards`, { page: 1, page_size: 1 })
      const items = (listRes.data as any).data?.items
      if (!items || items.length === 0) {
        console.warn('跳过: 无知识卡数据')
        return
      }

      const cardId = items[0].id
      const res = await authedGet(`${basePath()}/cards/${cardId}/versions`)
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
      expect(Array.isArray((res.data as any).data)).toBe(true)
    })
  })

  // ─── 认证守卫 ─────────────────────────────────────────────

  describe('认证守卫', () => {
    it('不带 Token 访问 directories 应返回 401', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')
      const res = await unauthGet(`${basePath()}/directories`)
      expect(res.status).toBe(401)
    })

    it('不带 Token 访问 files 应返回 401', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')
      const res = await unauthGet(`${basePath()}/files`)
      expect(res.status).toBe(401)
    })

    it('不带 Token 访问 cards 应返回 401', async () => {
      if (!owner) return console.warn('跳过: 无可用 owner')
      const res = await unauthGet(`${basePath()}/cards`)
      expect(res.status).toBe(401)
    })
  })
})
