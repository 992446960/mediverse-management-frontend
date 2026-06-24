import { describe, expect, it } from 'vitest'
import {
  ONLINE_STATUS_CONFIG,
  canPublishKnowledgeCard,
  canOperateKnowledgeCard,
  getAuditStatusConfig,
  getCardTypeConfig,
  getCardTypeOptionLabel,
  getOnlineStatusConfig,
} from '../../src/types/knowledge'

const enLabels: Record<string, string> = {
  'knowledge.card.typeRule': 'Rule',
  'knowledge.card.typeDiseaseOverview': 'Disease Overview',
  'knowledge.card.typeScoreElement': 'Score Element',
  'knowledge.card.typeEvidence': 'Evidence',
  'knowledge.card.typeDoctorVisit': 'Doctor Visit',
  'knowledge.card.typeDoctorTrajectory': 'Doctor Trajectory',
  'knowledge.card.typeDoctorSummary': 'Doctor Summary',
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
    expect(getCardTypeConfig('disease_overview', t)).toEqual({
      color: 'blue',
      label: 'Disease Overview',
    })
    expect(getCardTypeConfig('score_element', t).label).toBe('Score Element')
    expect(getCardTypeConfig('evidence', t).label).toBe('Evidence')
    expect(getCardTypeConfig('doctor_visit', t).label).toBe('Doctor Visit')
    expect(getCardTypeConfig('doctor_trajectory', t).label).toBe('Doctor Trajectory')
    expect(getCardTypeConfig('doctor_summary', t).label).toBe('Doctor Summary')
    expect(getOnlineStatusConfig('creating', t)).toEqual({
      color: 'processing',
      label: 'Creating',
    })
    expect(getAuditStatusConfig('approved', t)).toEqual({
      color: 'success',
      label: 'Approved',
    })
  })

  it('renders backend card type options with locale labels first', () => {
    expect(getCardTypeOptionLabel({ code: 'rule', name: '规则卡' }, t)).toBe('Rule')
    expect(getCardTypeOptionLabel({ code: 'future_type', name: '未来卡' }, t)).toBe('未来卡')
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
