import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function readSource(path: string) {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('knowledge batch operation ui contracts', () => {
  it('exposes file batch delete from selected rows', () => {
    const source = readSource('src/views/shared/KnowledgeFiles.vue')

    for (const token of [
      'batchDeleteFiles',
      'openBatchDeleteFiles',
      'handleBatchDeleteFiles',
      'selectedFileIds',
      'batchDeleteFilesSuccess',
    ]) {
      expect(source).toContain(token)
    }
  })

  it('exposes card batch audit, status and delete actions only for operable selected rows', () => {
    const source = readSource('src/components/KnowledgeCardList/index.vue')

    for (const token of [
      "type: 'selection'",
      'selectDisabled',
      'selectedCardIds',
      'batchAuditKnowledgeCards',
      'batchOnlineKnowledgeCards',
      'batchOfflineKnowledgeCards',
      'batchDeleteKnowledgeCards',
      'openBatchAudit',
      'openBatchOnline',
      'openBatchOffline',
      'openBatchDelete',
      'canOperateKnowledgeCard',
      'canPublishKnowledgeCard',
    ]) {
      expect(source).toContain(token)
    }
  })

  it('clears batch audit context when switching back to single-card audit', () => {
    const source = readSource('src/components/KnowledgeCardList/index.vue')

    expect(source).toMatch(/function\s+clearBatchAuditContext\s*\(\)/)
    expect(source).toMatch(
      /const\s+handleAuditAction[\s\S]*?clearBatchAuditContext\(\)[\s\S]*?auditCard\.value\s*=\s*record/
    )
  })

  it('renders card batch actions inside the PageTable toolbar extra slot', () => {
    const pageTableSource = readSource('src/components/PageTable/index.vue')
    const cardListSource = readSource('src/components/KnowledgeCardList/index.vue')

    expect(pageTableSource).toContain('page-table__toolbar-extra')
    expect(pageTableSource).toMatch(
      /page-table__toolbar-extra[\s\S]*?page-table__toolbar[\s\S]*?page-table__body/
    )

    expect(cardListSource).toContain('#toolbarExtra')
    expect(cardListSource).toContain('knowledge-card-list__batch-toolbar')
    expect(cardListSource).toMatch(
      /<template\s+v-if="selectedCardIds\.length > 0"\s+#toolbarExtra>[\s\S]*?clearBatchSelection[\s\S]*?openBatchAudit\('approved'\)[\s\S]*?openBatchOnline[\s\S]*?openBatchAudit\('rejected'\)[\s\S]*?openBatchOffline[\s\S]*?openBatchDelete/
    )
  })

  it('keeps card batch operations out of the page header buttons', () => {
    const source = readSource('src/components/KnowledgeCardList/index.vue')
    const headConfBody = source.match(/const headConf[\s\S]*?\n\}\)\n/)?.[0] ?? ''

    expect(headConfBody).toContain('knowledge.card.create')
    for (const token of [
      'knowledge.card.batchAuditApprove',
      'knowledge.card.batchAuditReject',
      'knowledge.card.batchOnline',
      'knowledge.card.batchOffline',
      'knowledge.card.batchDelete',
    ]) {
      expect(headConfBody).not.toContain(token)
    }
  })

  it('keeps selected batch toolbar and selected rows on the table container background', () => {
    const pageTableSource = readSource('src/components/PageTable/index.vue')
    const toolbarExtraRule =
      pageTableSource.match(/\.page-table__toolbar-extra\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(toolbarExtraRule).not.toContain('color-mix')
    expect(toolbarExtraRule).not.toContain('border-bottom')
    expect(toolbarExtraRule).toContain('background: var(--color-bg-container)')
    expect(pageTableSource).toContain('.ant-table-row-selected')
    expect(pageTableSource).toContain('background: var(--color-bg-container)')
  })

  it('keeps card batch operation buttons at the default action button size', () => {
    const source = readSource('src/components/KnowledgeCardList/index.vue')
    const batchToolbarStart = source.indexOf('knowledge-card-list__batch-toolbar')
    const batchToolbarEnd = source.indexOf('<template #title', batchToolbarStart)
    const batchToolbarTemplate = source.slice(batchToolbarStart, batchToolbarEnd)

    expect(batchToolbarTemplate).toContain('knowledge-card-list__batch-toolbar')
    expect(batchToolbarTemplate).not.toContain('size="small"')
  })

  it('uses distinct success messages for single and batch audit approval', () => {
    const source = readSource('src/components/KnowledgeCardList/index.vue')
    const zhSource = readSource('src/i18n/locales/zh-CN.ts')
    const enSource = readSource('src/i18n/locales/en-US.ts')

    expect(source).toContain('knowledge.card.batchAuditApproveSuccess')
    expect(source).toContain('knowledge.card.batchAuditRejectSuccess')
    expect(source).toMatch(
      /auditAction\.value === 'approved'[\s\S]*?batchAuditApproveSuccess[\s\S]*?batchAuditRejectSuccess/
    )

    expect(zhSource).toContain("batchAuditApproveSuccess: '已批量通过 {count} 张知识卡'")
    expect(zhSource).toContain("auditSuccess: '审核操作成功'")
    expect(enSource).toContain(
      "batchAuditApproveSuccess: 'Approved {count} selected knowledge card(s)'"
    )
    expect(enSource).toContain("auditSuccess: 'Audit operation succeeded'")
  })

  it('uses distinct modal prompt messages for single and batch audit approval', () => {
    const modalSource = readSource('src/components/KnowledgeCardAuditModal.vue')
    const listSource = readSource('src/components/KnowledgeCardList/index.vue')
    const viewerSource = readSource('src/components/KnowledgeCardViewer/index.vue')
    const zhSource = readSource('src/i18n/locales/zh-CN.ts')
    const enSource = readSource('src/i18n/locales/en-US.ts')

    expect(modalSource).toContain('batchCount?: number')
    expect(modalSource).toContain('knowledge.card.batchAuditApproveConfirm')
    expect(modalSource).toContain('knowledge.card.batchAuditRejectConfirm')
    expect(modalSource).toMatch(
      /isBatchAudit[\s\S]*?batchAuditApproveConfirm[\s\S]*?auditApproveConfirm/
    )
    expect(listSource).toContain(':batch-count="batchAuditIds.length"')
    expect(viewerSource).not.toContain(':batch-count=')
    expect(zhSource).toContain(
      "batchAuditApproveConfirm: '确定批量通过选中的 {count} 张知识卡吗？'"
    )
    expect(enSource).toContain(
      "batchAuditApproveConfirm: 'Approve the selected {count} knowledge card(s)?'"
    )
  })
})
