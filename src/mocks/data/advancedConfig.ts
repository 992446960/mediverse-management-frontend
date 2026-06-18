import type { EngineItem, ModelGroup, ToolGroup } from '@/types/advancedConfig'

export const mockToolGroups: ToolGroup[] = [
  {
    category: 'web',
    items: [
      {
        name: 'web_fetch',
        description: '网页内容抓取工具',
        category: 'web',
      },
      {
        name: 'web_search',
        description: '联网搜索公开资料',
        category: 'web',
      },
    ],
  },
  {
    category: 'medical',
    items: [
      {
        name: 'knowledge-retrieval',
        description: '医学知识库检索工具',
        category: 'medical',
      },
      {
        name: 'calculator',
        description: '支持基础及高级数学运算',
        category: 'medical',
      },
    ],
  },
  {
    category: 'research',
    items: [
      {
        name: 'literature-reader',
        description: '读取并总结医学文献',
        category: 'research',
      },
    ],
  },
]

export const mockEngines: EngineItem[] = [
  {
    name: 'standard',
    description: '标准引擎 (低延迟，适用于日常交流)',
    default: true,
    version: '1.0',
  },
  {
    name: 'deep-reasoning',
    description: '深度推理引擎 (适用于复杂病情分析)',
    default: false,
    version: '1.2',
  },
]

export const mockModelGroups: ModelGroup[] = [
  {
    provider: 'openai',
    items: [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo (Preview)',
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
  {
    provider: 'anthropic',
    items: [
      {
        id: 'claude-sonnet-4-5',
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        api: 'chat',
        reasoning: true,
        input: ['text'],
        context_window: 200000,
        max_tokens: 8192,
      },
    ],
  },
]
