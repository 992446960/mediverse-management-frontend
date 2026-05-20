import { describe, it, expect, beforeAll } from 'vitest'
import { getBaseUrl, getToken, loginAndGetToken } from './setup'
import { assertBaseResponseOk, assertMatchesSchema } from './schema-validator'

describe('Upload 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  it('POST /upload/avatar 应接受 multipart 文件并返回 URL', async () => {
    const form = new FormData()
    form.append('file', new Blob(['mock-avatar'], { type: 'image/png' }), 'avatar.png')

    const res = await fetch(`${getBaseUrl()}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    assertBaseResponseOk(body)
    expect(typeof body.data.url).toBe('string')
    await assertMatchesSchema('upload_avatar_api_v1_upload_avatar_post', body)
  })
})
