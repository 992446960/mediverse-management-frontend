import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const directoryTreeSource = readFileSync(
  resolve(__dirname, '../../src/components/DirectoryTree/index.vue'),
  'utf8'
)
const knowledgeFilesSource = readFileSync(
  resolve(__dirname, '../../src/views/shared/KnowledgeFiles.vue'),
  'utf8'
)

describe('directory tree interaction options', () => {
  it('defines configurable resize and collapse props on DirectoryTree', () => {
    expect(directoryTreeSource).toContain('resizable?: boolean')
    expect(directoryTreeSource).toContain('collapsible?: boolean')
    expect(directoryTreeSource).toContain('defaultWidth?: number')
    expect(directoryTreeSource).toContain('minWidth?: number')
    expect(directoryTreeSource).toContain('maxWidth?: number')
    expect(directoryTreeSource).toContain('collapsedWidth?: number')
    expect(directoryTreeSource).toContain('collapsedLabel?: string')
  })

  it('implements resize and collapsed entry in DirectoryTree without persistence', () => {
    expect(directoryTreeSource).toContain('directory-tree__resize-handle')
    expect(directoryTreeSource).toContain('@pointerdown="startResize"')
    expect(directoryTreeSource).toContain('@dblclick="resetWidth"')
    expect(directoryTreeSource).toContain('directory-tree__collapsed-entry')
    expect(directoryTreeSource).toContain('@click="expandPanel"')
    expect(directoryTreeSource).not.toContain('localStorage')
  })

  it('keeps KnowledgeFiles as configuration-only consumer', () => {
    expect(knowledgeFilesSource).toContain(':resizable="true"')
    expect(knowledgeFilesSource).toContain(':collapsible="true"')
    expect(knowledgeFilesSource).toContain(':default-width="280"')
    expect(knowledgeFilesSource).not.toContain('startDirectoryResize')
    expect(knowledgeFilesSource).not.toContain('knowledge-files__directory-resize-handle')
  })
})
