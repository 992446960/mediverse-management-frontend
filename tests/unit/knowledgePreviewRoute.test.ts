import { describe, expect, it } from 'vitest'
import {
  getKnowledgePreviewOwnerTypeFromRoute,
  isKnowledgePreviewRoute,
} from '../../src/utils/knowledgePreviewRoute'

describe('knowledgePreviewRoute', () => {
  it('resolves owner type from preview route names only', () => {
    expect(getKnowledgePreviewOwnerTypeFromRoute({ name: 'DeptFilesPreview' })).toBe('dept')
    expect(getKnowledgePreviewOwnerTypeFromRoute({ name: 'OrgFilesPreview' })).toBe('org')
    expect(getKnowledgePreviewOwnerTypeFromRoute({ name: 'MyFilesPreview' })).toBe('personal')
  })

  it('does not reinterpret a leaving preview component as personal on chat routes', () => {
    expect(isKnowledgePreviewRoute({ name: 'ChatSession' })).toBe(false)
    expect(getKnowledgePreviewOwnerTypeFromRoute({ name: 'ChatSession' })).toBeUndefined()
  })
})
