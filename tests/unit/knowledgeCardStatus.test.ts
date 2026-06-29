import { describe, expect, it } from 'vitest'
import {
  ONLINE_STATUS_CONFIG,
  canPublishKnowledgeCard,
  canOperateKnowledgeCard,
  formatCardTypeCodeName,
  getAuditStatusConfig,
  getCardTypeConfig,
  getCardTypeOptionLabel,
  getOnlineStatusConfig,
  normalizeCardTypeOption,
} from '../../src/types/knowledge'

const enLabels: Record<string, string> = {
  'knowledge.card.onlineStatusCreating': 'Creating',
  'knowledge.card.auditApproved': 'Approved',
}

const t = (key: string) => enLabels[key] ?? key

describe('knowledge card status rules', () => {
  it('allows publishing only after audit approval', () => {
    expect(canPublishKnowledgeCard('approved')).toBe(true)
    expect(canPublishKnowledgeCard('pending')).toBe(false)
    expect(canPublishKnowledgeCard('rejected')).toBe(false)
  })

  it('renders async write online statuses', () => {
    expect(ONLINE_STATUS_CONFIG.creating.label).toBe('创建中')
    expect(ONLINE_STATUS_CONFIG.creating.color).toBe('processing')
    expect(ONLINE_STATUS_CONFIG.updating.label).toBe('更新中')
    expect(ONLINE_STATUS_CONFIG.updating.color).toBe('processing')
  })

  it('renders known card configs with locale labels', () => {
    expect(getCardTypeConfig('disease_overview', 'en-US')).toEqual({
      color: 'blue',
      label: 'Disease Overview',
    })
    expect(getCardTypeConfig('score_element', 'en-US').label).toBe('Score Element')
    expect(getCardTypeConfig('evidence', 'en-US').label).toBe('Evidence')
    expect(getCardTypeConfig('doctor_visit', 'en-US').label).toBe('Doctor Visit')
    expect(getCardTypeConfig('risk_point', 'en-US').label).toBe('Risk Point')
    expect(getCardTypeConfig('disease_overview', 'zh-CN').label).toBe('疾病概览卡')
    expect(getOnlineStatusConfig('creating', t)).toEqual({
      color: 'processing',
      label: 'Creating',
    })
    expect(getAuditStatusConfig('approved', t)).toEqual({
      color: 'success',
      label: 'Approved',
    })
  })

  it('formats backend card type code into readable English names', () => {
    expect(formatCardTypeCodeName('disease_overview')).toBe('Disease Overview')
    expect(formatCardTypeCodeName('risk_point')).toBe('Risk Point')
    expect(formatCardTypeCodeName('doctor_visit')).toBe('Doctor Visit')
    expect(formatCardTypeCodeName('')).toBe('')
  })

  it('normalizes backend card type options with derived English names', () => {
    expect(normalizeCardTypeOption({ code: 'disease_overview', name: '疾病概览卡' })).toEqual({
      code: 'disease_overview',
      name: '疾病概览卡',
      en_name: 'Disease Overview',
    })
  })

  it('renders backend card type options by active locale', () => {
    const option = normalizeCardTypeOption({ code: 'risk_point', name: '风险控制点卡' })

    expect(getCardTypeOptionLabel(option, 'zh-CN')).toBe('风险控制点卡')
    expect(getCardTypeOptionLabel(option, 'en-US')).toBe('Risk Point')
    expect(getCardTypeOptionLabel({ code: 'future_type', name: '', en_name: '' }, 'en-US')).toBe(
      'Future Type'
    )
    expect(getCardTypeOptionLabel({ code: 'future_type', name: '', en_name: '' }, 'zh-CN')).toBe(
      'future_type'
    )
  })

  it('falls back for unknown backend online status', () => {
    expect(getOnlineStatusConfig('future_status')).toEqual({
      color: 'default',
      label: 'future_status',
    })
  })

  it('disables every operation while card is creating or updating', () => {
    expect(canOperateKnowledgeCard('creating')).toBe(false)
    expect(canOperateKnowledgeCard('updating')).toBe(false)
    expect(canOperateKnowledgeCard('online')).toBe(true)
    expect(canOperateKnowledgeCard('offline')).toBe(true)
  })
})
