import { describe, expect, it } from 'vitest'
import { normalizeDirectoryTreeResponse } from '@/api/knowledge'
import type { DirectoryNode } from '@/types/knowledge'

const directory: DirectoryNode = {
  id: 'dir-1',
  name: '指南',
  is_default: true,
  sort_order: 0,
  file_count: 1,
  children: [],
}

describe('knowledge directory tree API normalization', () => {
  it('keeps array directory responses unchanged', () => {
    expect(normalizeDirectoryTreeResponse([directory])).toEqual({
      tree: [directory],
      total_file_count: 1,
      unclassified_file_count: 0,
    })
  })

  it('unwraps directory arrays and file counts from object responses', () => {
    expect(
      normalizeDirectoryTreeResponse({
        tree: [directory],
        total_file_count: 15,
        unclassified_file_count: 13,
      })
    ).toEqual({
      tree: [directory],
      total_file_count: 15,
      unclassified_file_count: 13,
    })
    expect(normalizeDirectoryTreeResponse({ directories: [directory] }).tree).toEqual([directory])
    expect(normalizeDirectoryTreeResponse({ items: [directory] }).tree).toEqual([directory])
    expect(normalizeDirectoryTreeResponse({ list: [directory] }).tree).toEqual([directory])
  })

  it('falls back to an empty tree for unsupported responses', () => {
    expect(normalizeDirectoryTreeResponse(null)).toEqual({
      tree: [],
      total_file_count: 0,
      unclassified_file_count: 0,
    })
    expect(normalizeDirectoryTreeResponse({ directories: null })).toEqual({
      tree: [],
      total_file_count: 0,
      unclassified_file_count: 0,
    })
  })
})
