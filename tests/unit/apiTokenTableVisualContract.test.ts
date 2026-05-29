import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('api token table visual contract', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/views/admin/ApiTokens/components/TokenTable.vue'),
    'utf8'
  )

  it('keeps token code column resizable with a stable column key', () => {
    expect(source).toContain("prop: 'token_hash'")
    expect(source).toContain("_id: 'token_hash'")
    expect(source).toContain('resizable: true')
  })

  it('lets token text use available cell width before truncating', () => {
    expect(source).toContain('token-cell')
    expect(source).toContain('token-cell__text')
    expect(source).not.toContain('max-w-[140px]')
  })
})
