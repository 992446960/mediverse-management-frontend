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
  'common.resizePanelHint',
  'common.resizeDirectoryWidth',
  'common.resizeTreeWidth',
  'common.collapseDirectory',
  'common.collapseTree',
  'common.expandPanel',
  'common.expandPanelHint',
  'common.filterTree',
  'common.switchToLight',
  'common.switchToDark',
  'error.unauthorizedSubtitle',
  'error.forbiddenSubtitle',
  'error.notFoundSubtitle',
  'error.goBack',
  'error.goToLogin',
  'error.backHome',
  'error.http.400',
  'error.http.401',
  'error.http.403',
  'error.http.404',
  'error.http.405',
  'error.http.408',
  'error.http.409',
  'error.http.413',
  'error.http.422',
  'error.http.429',
  'error.http.500',
  'error.http.502',
  'error.http.503',
  'error.http.504',
  'error.http.fallback',
  'avatarTest.personalEmpty',
  'avatarTest.deptEmpty',
  'avatarTest.orgEmpty',
  'avatarTest.configureAvatar',
  'chat.createSessionBackendInvalid',
  'chat.createSessionFrontendInvalid',
  'chat.skillTagHypertensionGuideline',
  'chat.skillTagDiabetesDiet',
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
  {
    file: 'src/components/RightToolbar/index.vue',
    keys: ['common.search', 'common.refresh', 'common.columnSettings'],
  },
  {
    file: 'src/components/DirectoryTree/index.vue',
    keys: [
      'common.resizePanelHint',
      'common.resizeDirectoryWidth',
      'common.collapseDirectory',
      'common.expandPanel',
      'common.expandPanelHint',
    ],
  },
  {
    file: 'src/components/PageTree/index.vue',
    keys: [
      'common.resizePanelHint',
      'common.resizeTreeWidth',
      'common.collapse',
      'common.collapseTree',
      'common.expandPanel',
      'common.expandPanelHint',
    ],
  },
  {
    file: 'src/views/shared/KnowledgeFiles.vue',
    keys: ['knowledge.directory'],
  },
  {
    file: 'src/components/SkillPanel/index.vue',
    keys: ['chat.skillTagHypertensionGuideline', 'chat.skillTagDiabetesDiet'],
  },
  {
    file: 'src/components/ThemeSwitcher/index.vue',
    keys: ['common.switchToLight', 'common.switchToDark'],
  },
  {
    file: 'src/api/sessions.ts',
    keys: ['chat.createSessionBackendInvalid'],
  },
  {
    file: 'src/stores/chat.ts',
    keys: ['chat.createSessionFrontendInvalid'],
  },
  {
    file: 'src/config/errorCodes.ts',
    keys: ['error.http.401', 'error.http.fallback'],
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
        expect(source, `${expectation.file} should use ${key}`).toContain(key)
      }
    }
  })

  it('keeps HTTP error fallbacks locale-driven instead of hardcoded Chinese', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/config/errorCodes.ts'), 'utf8')
    expect(source).not.toContain('登录已过期，请重新登录')
    expect(source).not.toContain('请求失败 (')
    expect(source).toContain('getI18nMessage')
  })
})
