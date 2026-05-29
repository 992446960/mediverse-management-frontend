// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import IdentitySummary from '@/components/IdentitySummary/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

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

  it('emits upload click from avatar upload panel', async () => {
    const wrapper = mount(AvatarUploadPanel, {
      props: {
        imageUrl: '',
        title: '头像',
        actionText: '上传头像',
        hint: '建议尺寸 200x200px',
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('upload')).toHaveLength(1)
    expect(wrapper.text()).toContain('上传头像')
  })

  it('renders identity summary scope and status', () => {
    const wrapper = mount(IdentitySummary, {
      props: {
        name: '余主任的分身1',
        scope: 'AI创新研究院 / 前端开发部门 / yuyang',
        statusText: '启用中',
      },
    })

    expect(wrapper.text()).toContain('余主任的分身1')
    expect(wrapper.text()).toContain('AI创新研究院')
    expect(wrapper.text()).toContain('启用中')
  })
})
