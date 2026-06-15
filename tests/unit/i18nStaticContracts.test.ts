import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import enUS from '@/i18n/locales/en-US'
import zhCN from '@/i18n/locales/zh-CN'

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, source)
}

const requiredKeys = [
  'common.loginExpired',
  'common.requestFailed',
  'common.downloadFallback',
  'common.repeatSubmit',
  'error.unauthorizedSubtitle',
  'error.forbiddenSubtitle',
  'error.notFoundSubtitle',
  'error.goBack',
  'error.goToLogin',
  'error.backHome',
  'avatarTest.personalEmpty',
  'avatarTest.deptEmpty',
  'avatarTest.orgEmpty',
  'avatarTest.configureAvatar',
]

const sourceExpectations = [
  {
    file: 'src/views/error/401.vue',
    keys: ['error.unauthorizedSubtitle', 'error.goBack', 'error.goToLogin'],
  },
  {
    file: 'src/views/error/403.vue',
    keys: ['error.forbiddenSubtitle', 'error.backHome'],
  },
  {
    file: 'src/views/error/404.vue',
    keys: ['error.notFoundSubtitle', 'error.backHome'],
  },
  {
    file: 'src/views/my/AvatarTest.vue',
    keys: ['avatarTest.personalEmpty', 'avatarTest.configureAvatar'],
  },
  {
    file: 'src/views/dept/AvatarTest.vue',
    keys: ['avatarTest.deptEmpty', 'avatarTest.configureAvatar'],
  },
  {
    file: 'src/views/org/AvatarTest.vue',
    keys: ['avatarTest.orgEmpty', 'avatarTest.configureAvatar'],
  },
]

describe('i18n static contracts', () => {
  it('keeps newly centralized user-facing messages in both locales', () => {
    for (const key of requiredKeys) {
      expect(getByPath(zhCN, key), `missing zh-CN key ${key}`).toBeTypeOf('string')
      expect(getByPath(enUS, key), `missing en-US key ${key}`).toBeTypeOf('string')
    }
  })

  it('uses i18n keys in error pages and avatar test empty states', () => {
    for (const expectation of sourceExpectations) {
      const source = readFileSync(resolve(process.cwd(), expectation.file), 'utf8')
      for (const key of expectation.keys) {
        expect(source, `${expectation.file} should use ${key}`).toContain(`t('${key}')`)
      }
    }
  })
})
