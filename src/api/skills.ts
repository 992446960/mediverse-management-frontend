import { request } from '@/api/index'
import { buildApiUrl } from '@/config/apiBaseUrl'
import { getToken } from '@/utils/auth'
import type { Skill, SkillExecuteRequest } from '@/types/skill'

/**
 * 3.2.1 查询技能列表
 */
export function getSkills(): Promise<Skill[]> {
  return request.get<Skill[]>('/skills')
}

/**
 * 3.2.2 调用技能（流式响应）
 * args 内字段以各技能的 args_schema 为准；context 可选，用于会话/分身等扩展字段。
 */
export async function executeSkillRaw(
  skillCode: string,
  payload: SkillExecuteRequest
): Promise<Response> {
  const url = buildApiUrl(`/skills/${skillCode}/execute`)

  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'Accept-Encoding': 'identity',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return res
}
