import { describe, expect, it } from 'vitest'
import {
  buildAvatarCreatePayload,
  getDefaultEngineName,
  getEnabledNames,
  normalizeSkillOptions,
  resolveAdvancedConfigSummary,
  resolveModelSelection,
} from '../../src/utils/avatarAdvancedConfig'
import type { EngineItem, ModelGroup } from '../../src/types/advancedConfig'

describe('avatar advanced config helpers', () => {
  it('keeps only enabled names from avatar config entries', () => {
    expect(
      getEnabledNames([
        { name: 'calculator', enabled: true },
        { name: 'web_search', enabled: false },
        { name: 'knowledge-retrieval', enabled: true },
      ])
    ).toEqual(['calculator', 'knowledge-retrieval'])
  })

  it('selects default engine when no saved algorithm exists', () => {
    const engines: EngineItem[] = [
      {
        name: 'fast',
        description: '快速引擎',
        default: false,
        version: '1.0',
      },
      {
        name: 'standard',
        description: '标准引擎',
        default: true,
        version: '1.0',
      },
    ]

    expect(getDefaultEngineName(null, engines)).toBe('standard')
    expect(getDefaultEngineName('fast', engines)).toBe('fast')
  })

  it('normalizes skill API items returned with name fields', () => {
    expect(
      normalizeSkillOptions([
        { name: 'knowledge-retrieval', description: '自动检索关联的医学指南和文献。' },
        { skill_code: 'document-parsing', title: '文档解析' },
        { description: '缺少名称的异常项' },
      ])
    ).toEqual([
      {
        name: 'knowledge-retrieval',
        label: 'knowledge-retrieval',
        description: '自动检索关联的医学指南和文献。',
      },
      {
        name: 'document-parsing',
        label: '文档解析',
        description: '文档解析',
      },
    ])
  })

  it('keeps saved model when available and falls back to first model otherwise', () => {
    const groups: ModelGroup[] = [
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
      {
        provider: 'deepseek',
        items: [
          {
            id: 'deepseek-chat',
            name: 'DeepSeek Chat',
            provider: 'deepseek',
            api: 'chat',
            reasoning: false,
            input: ['text'],
            context_window: 64000,
            max_tokens: 4096,
          },
        ],
      },
    ]

    expect(
      resolveModelSelection({ provider: 'deepseek', model_id: 'deepseek-chat' }, groups)
    ).toEqual({
      provider: 'deepseek',
      model_id: 'deepseek-chat',
    })
    expect(resolveModelSelection({ provider: 'anthropic', model_id: 'missing' }, groups)).toEqual({
      provider: 'openai',
      model_id: 'gpt-4-turbo',
    })
    expect(resolveModelSelection(null, [])).toBeNull()
  })

  it('summarizes advanced config for readonly detail display', () => {
    const summary = resolveAdvancedConfigSummary(
      {
        tools: [
          { name: 'calculator', enabled: true },
          { name: 'web_search', enabled: false },
        ],
        skills: [{ name: 'knowledge-retrieval', enabled: true }],
        algorithms: [{ name: 'standard', enabled: true }],
        model: { provider: 'openai', model_id: 'gpt-4-turbo' },
      },
      {
        skills: [
          {
            name: 'knowledge-retrieval',
            label: '知识检索',
            description: '检索知识库',
          },
        ],
        engines: [
          {
            name: 'standard',
            description: '标准引擎',
            default: true,
            version: '1.0',
          },
        ],
        modelGroups: [
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
        ],
      }
    )

    expect(summary).toEqual({
      tools: ['calculator'],
      skills: ['知识检索'],
      algorithm: '标准引擎',
      model: 'GPT 系列 (OpenAI) / GPT-4 Turbo',
    })
  })

  it('uses fallback text for empty readonly advanced config', () => {
    expect(resolveAdvancedConfigSummary({}, { emptyText: '—' })).toEqual({
      tools: [],
      skills: [],
      algorithm: '—',
      model: '—',
    })
  })

  it('builds create avatar payload with advanced config fields', () => {
    expect(
      buildAvatarCreatePayload({
        type: 'general',
        org_id: 'org_001',
        name: ' 自动验收分身 ',
        avatar_url: '',
        bio: ' 测试简介 ',
        tags: ['验收'],
        greeting: ' 你好 ',
        style: 'custom',
        style_custom: ' 严谨 ',
        tools: ['calculator'],
        skills: ['knowledge-retrieval'],
        algorithm: 'standard',
        model: { provider: 'openai', model_id: 'gpt-4-turbo' },
      })
    ).toEqual({
      type: 'general',
      org_id: 'org_001',
      dept_id: undefined,
      user_id: undefined,
      name: '自动验收分身',
      avatar_url: undefined,
      bio: '测试简介',
      tags: ['验收'],
      greeting: '你好',
      style: 'custom',
      style_custom: '严谨',
      tools: ['calculator'],
      skills: ['knowledge-retrieval'],
      algorithm: 'standard',
      model: { provider: 'openai', model_id: 'gpt-4-turbo' },
    })
  })
})
