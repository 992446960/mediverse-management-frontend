import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
})
