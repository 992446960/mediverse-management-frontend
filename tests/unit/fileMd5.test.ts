import { describe, expect, it } from 'vitest'
import { getFileMd5 } from '../../src/utils/fileMd5'

describe('file md5', () => {
  it('calculates md5 from file content', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

    await expect(getFileMd5(file)).resolves.toBe('5d41402abc4b2a76b9719d911017c592')
  })

  it('uses content instead of file name as the md5 source', async () => {
    const first = new File(['same content'], 'first.txt', { type: 'text/plain' })
    const second = new File(['same content'], 'second.txt', { type: 'text/plain' })

    await expect(getFileMd5(first)).resolves.toBe(await getFileMd5(second))
  })
})
