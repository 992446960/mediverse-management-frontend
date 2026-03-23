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

export interface SkillCitation {
  id: string
  owner_type?: string
  owner_id?: string
  type: 'evidence' | 'rule' | 'experience'
  title: string
  content: string
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
