/**
 * 知识卡版本字符串 → 与接口 `from_version` / `to_version` / 回滚 `target_version` 一致的整型键。
 * 优先解析 semver `v1.2.3`，否则回退为字符串中首个数字。
 */
export function knowledgeCardVersionToNumeric(version: string): number | null {
  const s = version.trim()
  const semver = s.match(/^v?(\d+)\.(\d+)\.(\d+)$/i)
  if (semver) {
    const major = Number(semver[1])
    const minor = Number(semver[2])
    const patch = Number(semver[3])
    if ([major, minor, patch].some((n) => !Number.isFinite(n))) return null
    return major * 1_000_000 + minor * 1000 + patch
  }
  const m = s.match(/(\d+)/)
  return m ? Number(m[1]) : null
}
