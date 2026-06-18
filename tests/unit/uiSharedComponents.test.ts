// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
          { label: '角色', value: ['管理员'], span: 2 },
        ],
      },
    })

    expect(wrapper.findAll('.readonly-description__row')).toHaveLength(3)
    expect(wrapper.find('.readonly-description__row--wide').exists()).toBe(true)
    expect(wrapper.find('.readonly-description__label').text()).toBe('姓名')
    expect(wrapper.find('.readonly-description__value').text()).toBe('yuyang')
    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('yuyang')
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('—')
  })

  it('supports single-column readonly rows in narrow panels', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/ReadonlyDescription/index.vue'),
      'utf8'
    )
    const wrapper = mount(ReadonlyDescription, {
      props: {
        columns: 1,
        items: [
          { label: '创建时间', value: '2026-05-29 10:02' },
          { label: '创建人', value: 'd7b41f2b-a69d-446a-91a6-6057f5e63cd6' },
        ],
      },
    })

    expect(wrapper.classes()).toContain('readonly-description--single')
    expect(wrapper.findAll('.readonly-description__row--wide')).toHaveLength(2)
    expect(source).toContain('.readonly-description--single .readonly-description__row--wide')
    expect(source).toContain('grid-column: span 1')
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

  it('emits clear click when avatar upload panel is clearable', async () => {
    const wrapper = mount(AvatarUploadPanel, {
      props: {
        imageUrl: 'https://example.test/avatar.png',
        title: '头像',
        actionText: '上传头像',
        clearable: true,
        clearText: '移除头像',
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.text()).toContain('移除头像')
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

describe('avatar wizard visual contracts', () => {
  const wizardSource = readFileSync(
    resolve(process.cwd(), 'src/views/admin/Avatars/components/AvatarWizard.vue'),
    'utf8'
  )
  const stepTypeSource = readFileSync(
    resolve(process.cwd(), 'src/views/admin/Avatars/components/steps/StepType.vue'),
    'utf8'
  )

  it('keeps the wizard modal wide enough for the five-step UI image', () => {
    expect(wizardSource).toContain(':width="880"')
    expect(wizardSource).toContain("maxWidth: '94vw'")
    expect(wizardSource).toContain('max-width: 880px')
  })

  it('keeps large visual icons in type option cards', () => {
    expect(stepTypeSource).toContain('step-type__icon')
    expect(stepTypeSource).toContain('ApartmentOutlined')
    expect(stepTypeSource).toContain('BankOutlined')
    expect(stepTypeSource).toContain('UserOutlined')
  })
})
