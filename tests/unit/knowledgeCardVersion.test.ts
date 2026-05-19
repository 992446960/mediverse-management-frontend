import { describe, expect, it } from 'vitest'
import {
  buildKnowledgeCardVersionOptions,
  canCompareKnowledgeCardVersions,
  canRollbackKnowledgeCardVersion,
  findKnowledgeCardCompareTarget,
  isKnowledgeCardCurrentVersion,
  isKnowledgeCardDiffSelectionApplied,
  resolveKnowledgeCardCurrentVersionKey,
  resolveKnowledgeCardVersionKey,
} from '../../src/utils/knowledgeCardVersion'

const versions = [
  { version: 'v3.0.0', version_number: 3 },
  { version: 'v2.0.0', version_number: 2 },
  { version: 'v1.0.0', version_number: 1 },
]

describe('knowledgeCardVersion action helpers', () => {
  it('prefers explicit numeric version fields over version labels', () => {
    expect(resolveKnowledgeCardVersionKey({ version: 'v9.0.0', version_number: 2 })).toBe(2)
    expect(resolveKnowledgeCardVersionKey({ version: 'v9.0.0', current_version: 3 })).toBe(3)
  })

  it('resolves current version through the matching version history row first', () => {
    expect(resolveKnowledgeCardCurrentVersionKey({ version: 'v3.0.0' }, versions)).toBe(3)
  })

  it('filters invalid versions from operation options', () => {
    expect(
      buildKnowledgeCardVersionOptions([
        { version: 'v1.0.0' },
        { version: 'unknown' },
        { version: '', version_number: null },
      ])
    ).toEqual([{ label: 'v1.0.0', value: 1_000_000 }])
  })

  it('does not allow comparing the only version', () => {
    expect(
      findKnowledgeCardCompareTarget({ version: 'v1.0.0' }, [{ version: 'v1.0.0' }], 1_000_000)
    ).toBeNull()
  })

  it('treats the current version as non-comparable in version history', () => {
    expect(isKnowledgeCardCurrentVersion(versions[0], 3)).toBe(true)
    expect(findKnowledgeCardCompareTarget(versions[0], versions, 3)).toBeNull()
  })

  it('compares a history version against the current version first', () => {
    expect(findKnowledgeCardCompareTarget(versions[2], versions, 3)).toEqual({ from: 3, to: 1 })
  })

  it('falls back to another valid version when current version is unavailable', () => {
    expect(findKnowledgeCardCompareTarget(versions[2], versions, 99)).toEqual({ from: 3, to: 1 })
  })

  it('blocks same-version compare and rollback to the current version', () => {
    expect(canCompareKnowledgeCardVersions(2, 2, [1, 2, 3])).toBe(false)
    expect(canRollbackKnowledgeCardVersion(3, 3, [1, 2, 3])).toBe(false)
  })

  it('allows rollback only to a valid non-current target after a real comparison selection', () => {
    expect(canRollbackKnowledgeCardVersion(1, 3, [1, 2, 3], 2)).toBe(true)
    expect(canRollbackKnowledgeCardVersion(1, 3, [1, 2, 3], 1)).toBe(false)
  })

  it('marks an old diff as stale after selected versions change', () => {
    expect(isKnowledgeCardDiffSelectionApplied(3, 1, 3, 1)).toBe(true)
    expect(isKnowledgeCardDiffSelectionApplied(3, 1, 2, 1)).toBe(false)
  })
})
