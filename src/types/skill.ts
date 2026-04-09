import type { CardType } from './knowledge'

export interface Skill {
  skill_code: string
  title: string
  description?: string
  args_schema: {
    type?: string
    properties?: Record<string, { type: string; description?: string; items?: { type: string } }>
    required?: string[]
  }
}

/** 3.2.2 POST /skills/{skill_code}/execute — context 可按业务扩展（会话/分身等） */
export type SkillExecuteContext = Record<string, unknown> & {
  session_id?: string
  avatar_id?: string
}

/** 3.2.2 请求体；args 以各技能 args_schema 为准 */
export interface SkillExecuteRequest {
  args: Record<string, unknown>
  context?: SkillExecuteContext
}

/** 文档示例：知识库检索类技能常见入参 */
export interface KnowledgeRetrievalSkillArgs {
  query: string
  owner_type: string
  owner_id: string
  type?: string
  top_k?: number
}

/** 技能 citation 中的来源项（与知识卡 `sources` / `file_name` 命名对齐） */
export interface SkillCitationSource {
  id?: string
  name?: string
  file_name?: string
}

export interface SkillCitation {
  id: string
  owner_type?: string
  owner_id?: string
  type: CardType
  title: string
  content: string
  /** 关联来源文件列表（SSE `result.citations[].sources`；元素可为 `{ name/file_name }` 或文件名字符串） */
  sources?: Array<SkillCitationSource | string>
  /** 单文件来源名（兼容旧字段）；无 `sources` 时可用于展示「来源」 */
  source_file_name?: string
  tags?: string[]
  online_status?: string
  audit_status?: string
  current_version?: number
  reference_count?: number
  created_at?: string
  updated_at?: string
}

export interface SkillExecuteResult {
  parts: Array<{ type: string; text: string }>
  citations: SkillCitation[]
}
