import { beforeEach, describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { checkRepeatSubmit } from '../../src/utils/requestDedup'
import { i18n } from '../../src/i18n'

function buildUploadConfig(
  file: File,
  url = '/knowledge/personal/user-1/files'
): InternalAxiosRequestConfig {
  const form = new FormData()
  form.append('files', file)
  return {
    method: 'post',
    url,
    data: form,
    params: {},
    headers: {},
  } as InternalAxiosRequestConfig
}

describe('request deduplication', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh-CN'
  })

  it('allows concurrent FormData uploads with different files', () => {
    const first = new File(['first'], 'first.txt', { type: 'text/plain' })
    const second = new File(['second'], 'second.txt', { type: 'text/plain' })

    checkRepeatSubmit(buildUploadConfig(first, '/knowledge/personal/user-1/files/different'))

    expect(() =>
      checkRepeatSubmit(buildUploadConfig(second, '/knowledge/personal/user-1/files/different'))
    ).not.toThrow()
  })

  it('blocks repeated FormData upload with the same file metadata', () => {
    const file = new File(['same'], 'same.txt', { type: 'text/plain' })
    const url = '/knowledge/personal/user-1/files/repeated'

    checkRepeatSubmit(buildUploadConfig(file, url))

    expect(() => checkRepeatSubmit(buildUploadConfig(file, url))).toThrow(
      '数据正在处理，请勿重复提交'
    )
  })
})
