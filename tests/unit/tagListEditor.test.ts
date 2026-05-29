// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TagListEditor from '../../src/components/TagListEditor/index.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const stubs = {
  'a-popover': {
    template: '<div><slot /><slot name="content" /></div>',
  },
  'a-input': {
    props: ['value'],
    emits: ['update:value'],
    template:
      '<input class="tag-list-editor-test-input" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
  },
  'a-button': {
    emits: ['click'],
    template:
      '<button class="tag-list-editor-test-confirm" @click="$emit(\'click\')"><slot /></button>',
  },
  CloseOutlined: true,
  PlusOutlined: true,
}

describe('TagListEditor', () => {
  it('emits removed tags without mutating the input array', async () => {
    const tags = ['内科', '指南']
    const wrapper = mount(TagListEditor, {
      props: { tags },
      global: { stubs },
    })

    await wrapper.find('.tag-list-editor__remove').trigger('click')

    expect(tags).toEqual(['内科', '指南'])
    expect(wrapper.emitted('update:tags')?.[0]).toEqual([['指南']])
  })

  it('trims, deduplicates, and respects max count when adding tags', async () => {
    const wrapper = mount(TagListEditor, {
      props: { tags: ['内科'], maxCount: 2 },
      global: { stubs },
    })

    await wrapper.find('.tag-list-editor-test-input').setValue(' 内科 ')
    await wrapper.find('.tag-list-editor-test-confirm').trigger('click')
    expect(wrapper.emitted('update:tags')).toBeUndefined()

    await wrapper.find('.tag-list-editor-test-input').setValue(' 指南 ')
    await wrapper.find('.tag-list-editor-test-confirm').trigger('click')
    expect(wrapper.emitted('update:tags')?.[0]).toEqual([['内科', '指南']])
  })
})
