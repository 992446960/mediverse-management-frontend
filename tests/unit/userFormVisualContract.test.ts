import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('user form modal visual contract', () => {
  const userFormSource = readFileSync(
    resolve(process.cwd(), 'src/views/admin/Users/components/UserForm.vue'),
    'utf8'
  )

  it('keeps user modals compact and avoids section card layout for create and edit', () => {
    expect(userFormSource).toContain(':width="560"')
    expect(userFormSource).not.toContain('width="760px"')
    expect(userFormSource).not.toContain('user-form-section__body')
  })

  it('keeps detail mode in the restored readonly section layout', () => {
    expect(userFormSource).toContain("viewOnly ? t('user.detailTitle')")
    expect(userFormSource).toContain(':columns="1"')
    expect(userFormSource).toContain('detailRemarkItems')
    expect(userFormSource).toContain('user-form-detail :deep(.readonly-description__label)')
  })
})
