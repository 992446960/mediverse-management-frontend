import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = resolve(__dirname, '../..')

function readSource(path: string) {
  return readFileSync(resolve(rootDir, path), 'utf8')
}

describe('modal loading layout', () => {
  it('centers the avatar detail initial loading state inside the modal body', () => {
    const source = readSource('src/views/admin/Avatars/components/AvatarDetailModal.vue')

    expect(source).toContain('class="avatar-detail-loading"')
    expect(source).toMatch(/\.avatar-detail-loading\s*{[\s\S]*min-height:/)
    expect(source).toMatch(/\.avatar-detail-loading\s*{[\s\S]*align-items:\s*center/)
    expect(source).toMatch(/\.avatar-detail-loading\s*{[\s\S]*justify-content:\s*center/)
  })

  it('centers the knowledge card diff loading state inside the detail modal tab', () => {
    const source = readSource('src/components/KnowledgeCardViewer/VersionDiffView.vue')

    expect(source).toContain('class="version-diff-view__loading"')
    expect(source).toMatch(/\.version-diff-view__loading\s*{[\s\S]*min-height:/)
    expect(source).toMatch(/\.version-diff-view__loading\s*{[\s\S]*align-items:\s*center/)
    expect(source).toMatch(/\.version-diff-view__loading\s*{[\s\S]*justify-content:\s*center/)
  })
})
