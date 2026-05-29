import { describe, expect, it, vi } from 'vitest'
import { useAdvancedConfigOptions } from '../../src/composables/useAdvancedConfigOptions'
import type { AvatarModelConfig } from '../../src/types/advancedConfig'

vi.mock('../../src/api/advancedConfig', () => ({
  getTools: vi.fn().mockResolvedValue([{ name: '基础工具', items: [{ name: 'calculator' }] }]),
  getEngines: vi
    .fn()
    .mockResolvedValue([
      { name: 'standard', description: '标准引擎', default: true, version: '1.0' },
    ]),
  getModels: vi.fn().mockResolvedValue([
    {
      provider: 'openai',
      items: [
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          provider: 'openai',
          api: 'chat',
          reasoning: false,
          input: ['text'],
          context_window: 128000,
          max_tokens: 4096,
        },
      ],
    },
  ]),
}))

vi.mock('../../src/api/skills', () => ({
  getSkills: vi
    .fn()
    .mockResolvedValue([
      { name: 'knowledge-retrieval', title: '知识检索', description: '检索知识库' },
    ]),
}))

describe('useAdvancedConfigOptions', () => {
  it('loads advanced config options and normalizes skill labels', async () => {
    const options = useAdvancedConfigOptions()

    await options.loadAdvancedOptions()

    expect(options.advancedLoaded.value).toBe(true)
    expect(options.advancedLoading.value).toBe(false)
    expect(options.toolGroups.value[0]?.items[0]?.name).toBe('calculator')
    expect(options.skillOptions.value).toEqual([
      {
        name: 'knowledge-retrieval',
        label: '知识检索',
        description: '检索知识库',
      },
    ])
  })

  it('applies default algorithm and model to refs and reactive forms', async () => {
    const options = useAdvancedConfigOptions()
    await options.loadAdvancedOptions()

    const refForm = ref<{ algorithm: string | null; model: AvatarModelConfig | null }>({
      algorithm: null,
      model: null,
    })
    options.applyAdvancedDefaults(refForm)
    expect(refForm.value).toEqual({
      algorithm: 'standard',
      model: { provider: 'openai', model_id: 'gpt-4-turbo' },
    })

    const reactiveForm = reactive<{ algorithm: string | null; model: AvatarModelConfig | null }>({
      algorithm: null,
      model: null,
    })
    options.applyAdvancedDefaults(reactiveForm)
    expect(reactiveForm).toEqual({
      algorithm: 'standard',
      model: { provider: 'openai', model_id: 'gpt-4-turbo' },
    })
  })
})
