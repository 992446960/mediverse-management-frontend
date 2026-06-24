/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from 'vitest'
import { loginAndGetToken, authedGet, authedPost, authedDelete, type BaseResponse } from './setup'
import { assertBaseResponseOk, assertMatchesSchema, assertUUID } from './schema-validator'

async function getTestOwner(): Promise<{ ownerType: string; ownerId: string }> {
  const meRes = await authedGet('/auth/me')
  const user = (meRes.data as any).data.user
  if (user.org_id) return { ownerType: 'org', ownerId: user.org_id }
  if (user.dept_id) return { ownerType: 'dept', ownerId: user.dept_id }
  return { ownerType: 'personal', ownerId: user.id }
}

describe('Knowledge Recall 模块', () => {
  let owner: { ownerType: string; ownerId: string }
  const basePath = () => `/knowledge-recall/${owner.ownerType}/${owner.ownerId}`

  beforeAll(async () => {
    await loginAndGetToken()
    owner = await getTestOwner()
  })

  it('POST recall 应返回 Agentic 召回结果', async () => {
    const res = await authedPost(`${basePath()}/recall`, { query: '发热问诊' })
    expect(res.status).toBe(200)
    assertBaseResponseOk(res.data as Record<string, any>)
    const data = (res.data as any).data
    expect(data.query).toBe('发热问诊')
    expect(Array.isArray(data.cited_card_ids)).toBe(true)
    expect(Array.isArray(data.sources)).toBe(true)
    if (data.sources.length > 0) {
      expect('md_content' in data.sources[0]).toBe(true)
      expect('json_content' in data.sources[0]).toBe(true)
      expect('tags' in data.sources[0]).toBe(true)
      expect('online_status' in data.sources[0]).toBe(true)
      expect('audit_status' in data.sources[0]).toBe(true)
      expect('reference_count' in data.sources[0]).toBe(true)
    }
    await assertMatchesSchema(
      'recall_api_v1_knowledge_recall__owner_type___owner_id__recall_post',
      res.data
    )
  })

  it('POST search 应返回非 Agentic 检索结果', async () => {
    const res = await authedPost(`${basePath()}/search`, { query: '发热问诊' })
    expect(res.status).toBe(200)
    assertBaseResponseOk(res.data as Record<string, any>)
    const data = (res.data as any).data
    expect(data.answer).toBeUndefined()
    expect(data.count).toBeUndefined()
    expect(data.id).toBeUndefined()
    expect(Array.isArray(data.cited_card_ids)).toBe(true)
    expect(Array.isArray(data.sources)).toBe(true)
    if (data.sources.length > 0) {
      expect('id' in data.sources[0]).toBe(true)
      expect('excerpt' in data.sources[0]).toBe(true)
      expect('md_content' in data.sources[0]).toBe(false)
    }
    await assertMatchesSchema(
      'non_agentic_search_api_v1_knowledge_recall__owner_type___owner_id__search_post',
      res.data
    )
  })

  it('GET history 应返回召回历史列表', async () => {
    const res = await authedGet(`${basePath()}/history`)
    expect(res.status).toBe(200)
    assertBaseResponseOk(res.data as Record<string, any>)
    const items = (res.data as any).data.items
    expect(Array.isArray(items)).toBe(true)
    if (items.length > 0) assertUUID(items[0].id, 'recall_history.id')
    await assertMatchesSchema(
      'list_history_api_v1_knowledge_recall__owner_type___owner_id__history_get',
      res.data
    )
  })

  it('GET session detail 和 DELETE session 应返回合同结构', async () => {
    const history = await authedGet(`${basePath()}/history`)
    const sessionId = (history.data as any).data.items[0]?.id
    if (!sessionId) return

    const detail = await authedGet(`/knowledge-recall/sessions/${sessionId}`)
    expect(detail.status).toBe(200)
    assertBaseResponseOk(detail.data as Record<string, any>)
    await assertMatchesSchema(
      'get_session_detail_api_v1_knowledge_recall_sessions__session_id__get',
      detail.data
    )
    const sources = (detail.data as any).data.retrieved_sources ?? []
    if (sources.length > 0) {
      expect('md_content' in sources[0]).toBe(true)
      expect('json_content' in sources[0]).toBe(true)
    }

    const deleted = await authedDelete(`/knowledge-recall/sessions/${sessionId}`)
    expect(deleted.status).toBe(200)
    assertBaseResponseOk(deleted.data as BaseResponse)
  })

  it('DELETE history 应清理召回历史', async () => {
    const ownerClear = await authedDelete(`${basePath()}/history`)
    expect(ownerClear.status).toBe(200)
    assertBaseResponseOk(ownerClear.data as Record<string, any>)

    const allClear = await authedDelete('/knowledge-recall/history')
    expect(allClear.status).toBe(200)
    assertBaseResponseOk(allClear.data as Record<string, any>)
  })
})
