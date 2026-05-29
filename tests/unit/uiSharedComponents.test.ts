// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'

describe('shared UI components', () => {
  it('renders section title with optional description', () => {
    const wrapper = mount(SectionTitle, {
      props: {
        title: '高级能力配置',
        description: '配置工具、技能与模型',
      },
    })

    expect(wrapper.text()).toContain('高级能力配置')
    expect(wrapper.text()).toContain('配置工具、技能与模型')
    expect(wrapper.find('.section-title__accent').exists()).toBe(true)
  })

  it('renders readonly rows with fallback empty text', () => {
    const wrapper = mount(ReadonlyDescription, {
      props: {
        items: [
          { label: '姓名', value: 'yuyang' },
          { label: '邮箱', value: '' },
        ],
      },
    })

    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('yuyang')
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('—')
  })
})
