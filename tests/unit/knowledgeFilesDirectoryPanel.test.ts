import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(__dirname, '../../src/views/shared/KnowledgeFiles.vue'), 'utf8')

describe('knowledge files directory panel interaction', () => {
  it('enables DirectoryTree interaction options without local persistence', () => {
    expect(source).toContain(':resizable="true"')
    expect(source).toContain(':collapsible="true"')
    expect(source).toContain(':default-width="280"')
    expect(source).toContain(':min-width="220"')
    expect(source).toContain(':max-width="420"')
    expect(source).toContain(':collapsed-width="48"')
    expect(source).not.toContain('localStorage')
  })

  it('does not implement DirectoryTree resize behavior locally', () => {
    expect(source).not.toContain('startDirectoryResize')
    expect(source).not.toContain('directoryResizeStartX')
    expect(source).not.toContain('knowledge-files__directory-resize-handle')
    expect(source).not.toContain('knowledge-files__directory-collapsed')
  })
})
