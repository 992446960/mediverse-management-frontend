import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(__dirname, '../../src/views/shared/KnowledgeFiles.vue'), 'utf8')

function getFileNameColumnSource() {
  const propIndex = source.indexOf("prop: 'file_name'")
  expect(propIndex).toBeGreaterThan(-1)

  const start = source.lastIndexOf('{', propIndex)
  const end = source.indexOf('}', propIndex)
  return source.slice(start, end + 1)
}

describe('knowledge files table columns', () => {
  it('keeps file name column resizable without left fixing', () => {
    const column = getFileNameColumnSource()

    expect(column).toContain('width: 80')
    expect(column).toContain('resizable: true')
    expect(column).not.toContain("fixed: 'left'")
  })
})
