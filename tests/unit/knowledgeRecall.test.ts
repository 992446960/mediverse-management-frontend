import { describe, expect, it } from 'vitest'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  buildKnowledgeRecallPayload,
  resolveRecallCardTypeSelection,
} from '../../src/utils/knowledgeRecall'

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

  it('does not send card_type when selected card types cover all available types', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 5,
        cardTypes: ['rule', 'evidence'],
        availableCardTypes: ['rule', 'evidence'],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 5,
    })
  })
})

describe('knowledge recall card type selection', () => {
  const allTypes = ['rule', 'evidence', 'scale']

  it('selects all concrete types when all option is selected', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: ['rule'],
        clicked: ALL_RECALL_CARD_TYPES_VALUE,
        availableCardTypes: allTypes,
        allSelected: false,
      })
    ).toEqual({
      allSelected: true,
      cardTypes: allTypes,
    })
  })

  it('removes all option when a concrete type is changed after all was selected', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: allTypes,
        clicked: 'evidence',
        availableCardTypes: allTypes,
        allSelected: true,
      })
    ).toEqual({
      allSelected: false,
      cardTypes: ['rule', 'scale'],
    })
  })

  it('keeps all option unselected when concrete types are selected manually', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: ['rule', 'evidence'],
        clicked: 'scale',
        availableCardTypes: allTypes,
        allSelected: false,
      })
    ).toEqual({
      allSelected: false,
      cardTypes: allTypes,
    })
  })
})
