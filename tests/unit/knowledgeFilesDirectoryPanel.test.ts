import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(__dirname, '../../src/views/shared/KnowledgeFiles.vue'), 'utf8')

describe('knowledge files directory panel interaction', () => {
  it('uses in-memory directory panel sizing without persistence', () => {
    expect(source).toContain('DIRECTORY_PANEL_DEFAULT_WIDTH')
    expect(source).toContain('DIRECTORY_PANEL_MIN_WIDTH')
    expect(source).toContain('DIRECTORY_PANEL_MAX_WIDTH')
    expect(source).toContain('DIRECTORY_PANEL_COLLAPSED_WIDTH')
    expect(source).not.toContain('localStorage')
  })

  it('provides resize and collapse controls in expanded state', () => {
    expect(source).toContain('knowledge-files__directory-resize-handle')
    expect(source).toContain('@pointerdown="startDirectoryResize"')
    expect(source).toContain('@dblclick="resetDirectoryPanelWidth"')
    expect(source).toContain('@click="collapseDirectoryPanel"')
  })

  it('keeps a visible directory entry in collapsed state', () => {
    expect(source).toContain('knowledge-files__directory-collapsed')
    expect(source).toContain('FolderOpenOutlined')
    expect(source).toContain('@click="expandDirectoryPanel"')
    expect(source).toContain('目录')
  })
})
