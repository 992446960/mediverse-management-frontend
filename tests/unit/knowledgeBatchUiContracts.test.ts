import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function readSource(path: string) {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('knowledge batch operation ui contracts', () => {
  it('provides a shared batch action toolbar component', () => {
    const componentSource = readSource('src/components/BatchActionToolbar/index.vue')
    const typeSource = readSource('src/components/BatchActionToolbar/types.ts')

    expect(componentSource).toContain('batch-action-toolbar')
    expect(componentSource).toContain('selectedCount')
    expect(componentSource).toContain('primaryActions')
    expect(componentSource).toContain('moreActions')
    expect(componentSource).toContain("emit('clear')")
    expect(typeSource).toContain('BatchActionToolbarAction')
  })

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
    expect(cardListSource).toContain('<BatchActionToolbar')
    expect(cardListSource).toMatch(
      /<template\s+v-if="selectedCardIds\.length > 0"\s+#toolbarExtra>[\s\S]*?<BatchActionToolbar[\s\S]*?:selected-count="selectedCardIds\.length"[\s\S]*?:primary-actions="batchPrimaryActions"[\s\S]*?:more-actions="batchMoreActions"[\s\S]*?@clear="clearBatchSelection"/
    )
  })

  it('renders file batch actions inside the PageTable toolbar extra slot', () => {
    const source = readSource('src/views/shared/KnowledgeFiles.vue')

    expect(source).toContain('#toolbarExtra')
    expect(source).toMatch(
      /<template\s+v-if="selectedFileIds\.length > 0"\s+#toolbarExtra>[\s\S]*?<BatchActionToolbar[\s\S]*?:selected-count="selectedFileIds\.length"[\s\S]*?:primary-actions="batchPrimaryActions"[\s\S]*?:more-actions="batchMoreActions"[\s\S]*?@clear="clearBatchSelection"/
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

  it('keeps file batch operations out of the page header buttons', () => {
    const source = readSource('src/views/shared/KnowledgeFiles.vue')
    const headConfBody = source.match(/const headConf[\s\S]*?\n\}\)\n/)?.[0] ?? ''

    expect(headConfBody).toContain('knowledge.uploadFile')
    expect(headConfBody).not.toContain('knowledge.batchMoveFiles')
    expect(headConfBody).not.toContain('knowledge.batchDeleteFiles')
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
    const source = readSource('src/components/BatchActionToolbar/index.vue')

    expect(source).toContain('batch-action-toolbar')
    expect(source).not.toContain('size="small"')
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
