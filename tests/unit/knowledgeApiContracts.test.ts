import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function readSource(path: string) {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('knowledge api contract wrappers', () => {
  const apiSource = readSource('src/api/knowledge.ts')
  const typeSource = readSource('src/types/knowledge.ts')

  it('wraps formal backend file category and batch delete endpoints', () => {
    expect(apiSource).toContain('getFileCategories')
    expect(apiSource).toContain('/files/categories')
    expect(apiSource).toContain('batchDeleteFiles')
    expect(apiSource).toContain('/files/batch/delete')
    expect(apiSource).toContain('deleteAllFiles')
    expect(apiSource).toContain('/files/delete-all')
    expect(typeSource).toContain('FileBatchDeletePayload')
    expect(typeSource).toContain('FileBatchDeleteResult')
  })

  it('wraps formal backend knowledge-card batch endpoints', () => {
    for (const token of [
      'batchDeleteKnowledgeCards',
      'deleteAllKnowledgeCards',
      'batchAuditKnowledgeCards',
      'auditApproveAllKnowledgeCards',
      'batchOnlineKnowledgeCards',
      'onlineAllKnowledgeCards',
      'batchOfflineKnowledgeCards',
      'offlineAllKnowledgeCards',
      'batchIncrementKnowledgeCardReferenceCount',
      '/cards/batch/delete',
      '/cards/delete-all',
      '/cards/batch/audit',
      '/cards/audit-approve-all',
      '/cards/batch/online',
      '/cards/online-all',
      '/cards/batch/offline',
      '/cards/offline-all',
      '/cards/batch/increment-reference-count',
    ]) {
      expect(apiSource).toContain(token)
    }
  })

  it('types backend upload/status and batch result fields used by callers', () => {
    for (const token of [
      'FileCategory',
      'downstream_file_uuid',
      'async_pending',
      'downstream',
      'storage_url',
      'CardBatchAuditPayload',
      'CardBatchOnlinePayload',
      'CardBatchOfflinePayload',
      'CardBatchOnlineResult',
      'KnowledgeCardBatchIncrementReferenceCountResult',
    ]) {
      expect(typeSource).toContain(token)
    }
  })
})
