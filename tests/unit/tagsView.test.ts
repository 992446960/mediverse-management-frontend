import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
  },
  configurable: true,
})

function route(overrides: Partial<RouteLocationNormalized>): RouteLocationNormalized {
  return {
    fullPath: '/hidden',
    path: '/hidden',
    name: 'HiddenRoute',
    query: {},
    params: {},
    hash: '',
    matched: [],
    meta: {},
    redirectedFrom: undefined,
    ...overrides,
  } as RouteLocationNormalized
}

describe('tags view hidden route behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('skips hidden routes by default', async () => {
    const { useTagsViewStore } = await import('../../src/stores/tagsView')
    const store = useTagsViewStore()

    store.addView(
      route({
        meta: {
          hidden: true,
          title: 'hidden.title',
        },
      })
    )

    expect(store.visitedViews).toEqual([])
  })

  it('adds hidden routes when showInTagsView is enabled', async () => {
    const { useTagsViewStore } = await import('../../src/stores/tagsView')
    const store = useTagsViewStore()

    store.addView(
      route({
        fullPath: '/my/knowledge-cards/recall-test',
        path: '/my/knowledge-cards/recall-test',
        name: 'MyKnowledgeRecallTest',
        meta: {
          hidden: true,
          showInTagsView: true,
          title: 'knowledge.recall.title',
        },
      })
    )

    expect(store.visitedViews).toMatchObject([
      {
        fullPath: '/my/knowledge-cards/recall-test',
        path: '/my/knowledge-cards/recall-test',
        name: 'MyKnowledgeRecallTest',
        title: 'knowledge.recall.title',
      },
    ])
  })
})
