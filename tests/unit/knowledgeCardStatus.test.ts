import { describe, expect, it } from 'vitest'
import { canPublishKnowledgeCard } from '../../src/types/knowledge'

describe('knowledge card status rules', () => {
  it('allows publishing only after audit approval', () => {
    expect(canPublishKnowledgeCard('approved')).toBe(true)
    expect(canPublishKnowledgeCard('pending')).toBe(false)
    expect(canPublishKnowledgeCard('rejected')).toBe(false)
  })
})
