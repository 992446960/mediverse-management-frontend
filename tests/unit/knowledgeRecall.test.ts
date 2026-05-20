import { describe, expect, it } from 'vitest'
import { buildKnowledgeRecallPayload } from '../../src/utils/knowledgeRecall'

describe('knowledge recall payload', () => {
  it('does not send empty card_type when all card types are selected', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 5,
        cardTypes: [],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 5,
    })
  })

  it('sends selected card types as metadata.card_type', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 8,
        cardTypes: ['rule', 'evidence'],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 8,
      metadata: {
        card_type: ['rule', 'evidence'],
      },
    })
  })
})
