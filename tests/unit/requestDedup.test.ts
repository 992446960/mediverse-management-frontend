import { describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { checkRepeatSubmit } from '../../src/utils/requestDedup'

function buildUploadConfig(file: File): InternalAxiosRequestConfig {
  const form = new FormData()
  form.append('files', file)
  return {
    method: 'post',
    url: '/knowledge/personal/user-1/files',
    data: form,
    params: {},
    headers: {},
  } as InternalAxiosRequestConfig
}

describe('request deduplication', () => {
  it('allows concurrent FormData uploads with different files', () => {
    const first = new File(['first'], 'first.txt', { type: 'text/plain' })
    const second = new File(['second'], 'second.txt', { type: 'text/plain' })

    checkRepeatSubmit(buildUploadConfig(first))

    expect(() => checkRepeatSubmit(buildUploadConfig(second))).not.toThrow()
  })
})
