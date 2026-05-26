import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const filePreviewSource = readFileSync(
  fileURLToPath(new URL('../../src/components/FilePreview/index.vue', import.meta.url)),
  'utf-8'
)

describe('FilePreview tabs', () => {
  it('renders PDF tabs only in the content preview area', () => {
    const headConfStart = filePreviewSource.indexOf('const headConf = computed')
    const headConfEnd = filePreviewSource.indexOf('async function loadFile')
    const headConfSource = filePreviewSource.slice(headConfStart, headConfEnd)

    expect(headConfSource).not.toContain('tabsOptions')
    expect(headConfSource).not.toContain('tabChangeHandle')
    expect(filePreviewSource).toContain('v-if="showPdfTabs"')
  })
})
