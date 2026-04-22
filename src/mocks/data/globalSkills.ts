import type { Skill } from '@/types/skill'

/** 3.2.1 GET /skills — 与 API 文档示例字段对齐，便于本地联调 execute args */
export const mockGlobalSkills: Skill[] = [
  {
    skill_code: 'knowledge-retrieval',
    title: '知识库检索',
    description: '自动检索关联的医学指南和文献。',
    args_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        owner_type: { type: 'string' },
        owner_id: { type: 'string' },
        type: { type: 'string' },
        top_k: { type: 'number' },
      },
      required: ['query', 'owner_type', 'owner_id'],
    },
  },
  {
    skill_code: 'document-parsing',
    title: '文档解析',
    description: '解析上传文档的结构与要点（示例技能）。',
    args_schema: {
      type: 'object',
      properties: {
        file_url: { type: 'string' },
      },
      required: ['file_url'],
    },
  },
]
