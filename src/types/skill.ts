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
