import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { darkThemeConfig, themeConfig } from '@/config/themes'
import { brandTokens } from '@/config/tokens'
import { describe, expect, it } from 'vitest'

function readSource(file: string): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function runThemeGuard(root: string): string {
  return execFileSync(process.execPath, [
    resolve(process.cwd(), 'scripts/check-theme-guard.mjs'),
    '--root',
    root,
  ]).toString()
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

  it('keeps phase 2 brand colors on primary theme variables', () => {
    const brandHardcodedFiles = [
      'src/components/AvatarConfig/AdvancedConfigFields.vue',
      'src/components/AvatarConfig/AdvancedTagList.vue',
      'src/components/AvatarConfig/QuickActionGuide.vue',
      'src/components/AvatarConfig/index.vue',
      'src/views/admin/Avatars/components/AvatarDetailModal.vue',
      'src/views/admin/Avatars/components/AvatarWizard.vue',
      'src/views/admin/Avatars/components/AvatarStyleSelector.vue',
      'src/views/admin/Avatars/components/steps/StepType.vue',
      'src/views/admin/Avatars/components/steps/StepScope.vue',
      'src/views/admin/Organizations/components/OrgForm.vue',
      'src/views/my/Profile.vue',
      'src/views/shared/knowledge-recall-test/index.vue',
      'src/views/shared/knowledge-recall-test/components/RecallSourceDetailModal.vue',
    ]
    const bannedBrandTokens = [
      '#0ea5e9',
      '#0284c7',
      '#00a0e9',
      'rgb(14 165 233',
      'rgba(14, 165, 233',
      'bg-[#0ea5e9]',
      'border-[#0ea5e9]',
      'text-[#0ea5e9]',
      'ring-[#0ea5e9]',
    ]

    for (const file of brandHardcodedFiles) {
      const source = readSource(file).toLowerCase()
      for (const token of bannedBrandTokens) {
        expect(source, `${file} should not contain ${token}`).not.toContain(token)
      }
    }
  })

  it('keeps phase 3 paired dark styles and static grays on theme variables', () => {
    const bannedTokensByFile: Record<string, string[]> = {
      'src/components/LocaleSwitcher/index.vue': [
        '.dark .locale-text',
        '#64748b',
        '#475569',
        '#94a3b8',
        '#3b82f6',
        'rgba(0, 0, 0, 0.03)',
        'rgba(255, 255, 255, 0.05)',
      ],
      'src/components/ThemeSwitcher/index.vue': [
        '.dark .sun-icon',
        '.dark .moon-icon',
        '#64748b',
        '#94a3b8',
        '#cbd5e1',
        'rgba(0, 0, 0, 0.03)',
        'rgba(255, 255, 255, 0.05)',
      ],
      'src/views/admin/Avatars/components/steps/StepScope.vue': [
        '.dark .step-scope-select',
        '#e5e7eb',
        '#9ca3af',
        '#374151',
        '#1f2937',
        'background-color: #fff',
      ],
      'src/components/ChatWindow/BubbleRenderer.vue': [
        '.dark .markdown-body',
        '#f6f8fa',
        '#161b22',
      ],
      'src/components/KnowledgeCardViewer/index.vue': ['text-gray-500'],
      'src/components/PageHead/index.vue': ['text-slate-500', 'text-slate-800', 'text-slate-400'],
      'src/components/PageTable/index.vue': [
        'border-slate-200',
        'border-slate-100',
        'bg-white',
        'text-slate-500',
        'text-slate-400',
      ],
      'src/components/ChatWindow/MessageList.vue': ['text-gray-500'],
      'src/components/CitationPreviewHtml/index.vue': [
        'text-gray-600',
        'text-gray-500',
        'dark:text-gray-400',
      ],
    }

    for (const [file, tokens] of Object.entries(bannedTokensByFile)) {
      const source = readSource(file).toLowerCase()
      for (const token of tokens) {
        expect(source, `${file} should not contain ${token}`).not.toContain(token)
      }
    }
  })

  it('keeps dark theme surfaces from bypassing semantic variables', () => {
    const bannedTokensByFile: Record<string, string[]> = {
      'src/views/shared/knowledge-recall-test/components/RecallResultSection.vue': [
        'dark:bg-[--color-bg-container]',
        'dark:bg-[--color-bg-container]/80',
        'dark:bg-slate-900',
        'dark:border-slate-800',
      ],
      'src/components/AvatarConfig/index.vue': [
        'dark:bg-gray-800',
        'dark:bg-gray-700',
        'dark:border-gray-600',
        'dark:text-gray-300',
      ],
      'src/components/AvatarStats/index.vue': [
        'dark:bg-gray-800',
        'dark:border-gray-700',
        'dark:text-gray-200',
        'dark:text-gray-500',
      ],
    }

    for (const [file, tokens] of Object.entries(bannedTokensByFile)) {
      const source = readSource(file).toLowerCase()
      for (const token of tokens) {
        expect(source, `${file} should not contain ${token}`).not.toContain(token)
      }
    }
  })

  it('keeps markdown styling centralized in the project theme layer', () => {
    const markdownFiles = [
      'src/components/ChatWindow/BubbleRenderer.vue',
      'src/components/ChatWindow/ThinkingProcess.vue',
      'src/views/shared/knowledge-recall-test/index.vue',
      'src/components/KnowledgeCardViewer/CardContentBody.vue',
    ]

    for (const file of markdownFiles) {
      expect(readSource(file), `${file} should not import github light markdown css`).not.toContain(
        'github-markdown-css/github-markdown-light.css'
      )
    }

    const globalStyle = readSource('src/styles/index.css')
    expect(globalStyle).toContain("@import './markdown.css';")

    const markdownStyle = readSource('src/styles/markdown.css')
    expect(markdownStyle).toContain('--markdown-bg: transparent')
    expect(markdownStyle).toContain('var(--color-text-base)')
    expect(markdownStyle).toContain('var(--color-code-bg)')
  })

  it('keeps modal chrome on the elevated theme surface', () => {
    const globalStyle = readSource('src/styles/index.css')

    expect(globalStyle).toContain('.ant-modal-title')
    expect(globalStyle).toContain('background-color: var(--color-bg-elevated);')
    expect(globalStyle).toContain('color: var(--color-text-base);')
  })

  it('blocks new unthemed light surfaces with the theme guard', () => {
    const root = mkdtempSync(join(tmpdir(), 'theme-guard-red-'))
    try {
      const componentDir = join(root, 'src/components')
      mkdirSync(componentDir, { recursive: true })
      writeFileSync(
        join(componentDir, 'BadSurface.vue'),
        [
          '<template>',
          '  <div class="bg-white text-gray-800">Bad</div>',
          '</template>',
          '<style scoped lang="scss">',
          '.bad {',
          '  background: #fff;',
          '  color: #111827;',
          '}',
          '</style>',
        ].join('\n')
      )

      expect(() => runThemeGuard(root)).toThrow(/BadSurface\.vue/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('blocks theme guard bypasses that still render inconsistent dark surfaces', () => {
    const root = mkdtempSync(join(tmpdir(), 'theme-guard-bypass-'))
    try {
      const componentDir = join(root, 'src/components')
      mkdirSync(componentDir, { recursive: true })
      writeFileSync(
        join(componentDir, 'BadThemeBypass.vue'),
        [
          '<script setup lang="ts">',
          "import 'github-markdown-css/github-markdown-light.css'",
          '</script>',
          '<template>',
          '  <div class="bg-white dark:bg-[--color-bg-container]">',
          '    <section class="bg-white dark:bg-gray-800">Bad</section>',
          '  </div>',
          '</template>',
        ].join('\n')
      )

      expect(() => runThemeGuard(root)).toThrow(/BadThemeBypass\.vue/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('allows themed surfaces in the theme guard', () => {
    const root = mkdtempSync(join(tmpdir(), 'theme-guard-green-'))
    try {
      const componentDir = join(root, 'src/components')
      mkdirSync(componentDir, { recursive: true })
      writeFileSync(
        join(componentDir, 'GoodSurface.vue'),
        [
          '<template>',
          '  <div class="bg-white dark:bg-(--color-bg-container)">Good</div>',
          '</template>',
          '<style scoped lang="scss">',
          '.good {',
          '  background: var(--color-bg-container);',
          '  color: var(--color-text-base);',
          '}',
          '</style>',
        ].join('\n')
      )

      expect(runThemeGuard(root)).toContain('theme guard passed')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
