import type { SkillCitation } from '@/types/skill'

/** 含 `sources` / `source_file_name` 的通用形状（技能 citation、知识库检索 citation 等） */
export interface SourcesLike {
  sources?: Array<{ name?: string; file_name?: string } | string>
  source_file_name?: string
}

/** 将 `sources` / `source_file_name` 格式化为预览组件用的单行文案 */
export function formatSourcesLikeForPreview(like: SourcesLike): string | undefined {
  const { sources, source_file_name: single } = like
  if (Array.isArray(sources) && sources.length > 0) {
    const names: string[] = []
    for (const s of sources) {
      if (typeof s === 'string') {
        if (s.trim() !== '') names.push(s.trim())
        continue
      }
      if (s == null || typeof s !== 'object') continue
      const raw = s.name ?? s.file_name
      if (typeof raw === 'string' && raw.trim() !== '') names.push(raw.trim())
    }
    if (names.length > 0) return names.join('、')
  }
  if (typeof single === 'string' && single.trim() !== '') return single.trim()
  return undefined
}

/** 将技能 citation 的 `sources` / `source_file_name` 格式化为预览组件用的单行文案 */
export function formatCitationSourceForPreview(citation: SkillCitation): string | undefined {
  return formatSourcesLikeForPreview(citation)
}
