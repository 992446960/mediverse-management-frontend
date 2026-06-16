import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { darkThemeConfig, themeConfig } from '@/config/themes'
import { brandTokens } from '@/config/tokens'
import { describe, expect, it } from 'vitest'

function readSource(file: string): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

describe('style static contracts', () => {
  it('keeps root transition styles in the global style entry', () => {
    expect(readSource('src/App.vue')).not.toContain('<style')
    const globalStyle = readSource('src/styles/index.css')
    expect(globalStyle).toContain('.fade-enter-active')
    expect(globalStyle).toContain('.fade-leave-to')
  })

  it('keeps layout component style blocks scoped and using scss', () => {
    expect(readSource('src/layouts/FullscreenLayout.vue')).toContain('<style scoped lang="scss">')

    const mainLayout = readSource('src/layouts/MainLayout.vue')
    expect(mainLayout.match(/<style/g)).toHaveLength(1)
    expect(mainLayout).toContain('<style scoped lang="scss">')
  })

  it('keeps teleported user menu overlay styles in the global style entry', () => {
    const mainLayout = readSource('src/layouts/MainLayout.vue')
    const globalStyle = readSource('src/styles/index.css')

    expect(mainLayout).not.toContain('.user-menu-overlay.ant-dropdown')
    expect(globalStyle).toContain('.user-menu-overlay.ant-dropdown')
  })

  it('keeps shared tree component states on theme variables instead of hardcoded tokens', () => {
    const treeSources = [
      'src/components/DirectoryTree/index.vue',
      'src/components/PageTree/index.vue',
      'src/components/DirectoryTree/DirectoryTreeItem.vue',
    ]
    const bannedTreeTokens = [
      '#fff',
      '#0ea5e9',
      '#e2e8f0',
      '#475569',
      '#334155',
      '#94a3b8',
      '#f0f9ff',
      'rgb(14 165 233',
    ]

    for (const file of treeSources) {
      const source = readSource(file).toLowerCase()
      for (const token of bannedTreeTokens) {
        expect(source, `${file} should not contain ${token}`).not.toContain(token)
      }
    }
  })
  it('keeps brand theme seeds centralized and mirrored by css fallback values', () => {
    expect(themeConfig.token?.colorPrimary).toBe(brandTokens.primary.light)
    expect(themeConfig.token?.colorInfo).toBe(brandTokens.primary.light)
    expect(darkThemeConfig.token?.colorPrimary).toBe(brandTokens.primary.dark)
    expect(darkThemeConfig.token?.colorInfo).toBe(brandTokens.primary.dark)

    const variables = readSource('src/styles/variables.css')
    expect(variables).toContain(`--color-primary-500: ${brandTokens.primary.light};`)
    expect(variables).toContain(`--color-primary-500: ${brandTokens.primary.dark};`)
  })

  it('defines dedicated diff and code block theme variables for both color modes', () => {
    const variables = readSource('src/styles/variables.css')
    expect(variables.match(/--color-diff-add:/g)).toHaveLength(2)
    expect(variables.match(/--color-diff-del:/g)).toHaveLength(2)
    expect(variables.match(/--color-code-bg:/g)).toHaveLength(2)
  })

  it('keeps phase 1 dark-mode visible surfaces on theme variables', () => {
    const bannedTokensByFile: Record<string, string[]> = {
      'src/components/KBSidebar/index.vue': [
        'bg-white',
        'border-gray-200',
        'text-gray-700',
        'hover:bg-gray-100',
        'text-gray-500',
      ],
      'src/components/AvatarConfig/ToolSkillSelector.vue': [
        'background: #fff',
        'color: #111827',
        'color: #6b7280',
      ],
      'src/components/KnowledgeCardViewer/VersionDiffView.vue': [
        'bg-gray-50',
        'background-color: #fdd',
        'background-color: #dfd',
      ],
      'src/components/KnowledgeCardViewer/JsonContentPane.vue': ['bg-gray-50', 'text-gray-500'],
      'src/components/KnowledgeCardViewer/CardContentBody.vue': ['bg-gray-50', 'text-gray-500'],
      'src/components/KnowledgeCardViewer/VersionTimeline.vue': ['text-gray-800', 'text-gray-600'],
      'src/views/admin/Avatars/components/AvatarDetailModal.vue': [
        'color: #1677ff',
        'background: #e7f3ff',
      ],
      'src/views/shared/knowledge-recall-test/components/RecallSourceDetailModal.vue': [
        'bg-white',
        'background: #fff',
      ],
      'src/components/KnowledgeCardEditor/index.vue': ['background: #fff'],
    }

    for (const [file, tokens] of Object.entries(bannedTokensByFile)) {
      const source = readSource(file).toLowerCase()
      for (const token of tokens) {
        expect(source, `${file} should not contain ${token}`).not.toContain(token)
      }
    }
  })
})
