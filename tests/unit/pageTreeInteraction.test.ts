import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pageTreeSource = readFileSync(
  resolve(__dirname, '../../src/components/PageTree/index.vue'),
  'utf8'
)
const departmentsSource = readFileSync(
  resolve(__dirname, '../../src/views/admin/Departments/index.vue'),
  'utf8'
)
const usersSource = readFileSync(
  resolve(__dirname, '../../src/views/admin/Users/index.vue'),
  'utf8'
)

describe('page tree interaction options', () => {
  it('defines configurable resize and collapse props on PageTree', () => {
    expect(pageTreeSource).toContain('resizable?: boolean')
    expect(pageTreeSource).toContain('collapsible?: boolean')
    expect(pageTreeSource).toContain('defaultWidth?: number')
    expect(pageTreeSource).toContain('minWidth?: number')
    expect(pageTreeSource).toContain('maxWidth?: number')
    expect(pageTreeSource).toContain('collapsedWidth?: number')
    expect(pageTreeSource).toContain('collapsedLabel?: string')
  })

  it('implements resize and collapsed entry in PageTree without persistence', () => {
    expect(pageTreeSource).toContain('page-tree__resize-handle')
    expect(pageTreeSource).toContain('@pointerdown="startResize"')
    expect(pageTreeSource).toContain('@dblclick="resetWidth"')
    expect(pageTreeSource).toContain('page-tree__collapsed-entry')
    expect(pageTreeSource).toContain('@click="expandPanel"')
    expect(pageTreeSource).not.toContain('localStorage')
  })

  it('enables PageTree interaction from departments and users pages by configuration', () => {
    for (const source of [departmentsSource, usersSource]) {
      expect(source).toContain(':resizable="true"')
      expect(source).toContain(':collapsible="true"')
      expect(source).toContain(':default-width="280"')
      expect(source).not.toContain('startTreeResize')
      expect(source).not.toContain('page-tree__resize-handle')
    }
  })
})
