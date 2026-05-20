/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from 'vitest'
import { getBaseUrl, getToken, loginAndGetToken, authedGet, readSSEEvents } from './setup'
import { assertBaseResponseOk, assertMatchesSchema } from './schema-validator'

describe('Skills 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  it('GET /skills 应返回技能列表', async () => {
    const res = await authedGet('/skills')
    expect(res.status).toBe(200)
    assertBaseResponseOk(res.data as Record<string, any>)
    expect(Array.isArray((res.data as any).data)).toBe(true)
    await assertMatchesSchema('get_skills_api_v1_skills_get', res.data)
  })

  it('POST /skills/{skill_code}/execute 应返回 SSE done 事件', async () => {
    const res = await fetch(`${getBaseUrl()}/skills/knowledge-retrieval/execute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ args: { query: '测试' }, context: {} }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/)
    const events = await readSSEEvents(res.body!)
    expect(events.some((event) => event.type === 'done')).toBe(true)
  })
})
