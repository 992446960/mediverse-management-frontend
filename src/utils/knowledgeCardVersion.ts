export interface KnowledgeCardVersionRef {
  version?: string
  version_number?: number | string | null
  current_version?: number | string | null
}

export interface KnowledgeCardVersionOption {
  label: string
  value: number
}

export interface KnowledgeCardCompareTarget {
  from: number
  to: number
}

function positiveFiniteNumber(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null
}

function explicitVersionToNumeric(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return positiveFiniteNumber(value)
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return positiveFiniteNumber(Number(s))
  return knowledgeCardVersionToNumeric(s)
}

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

export function resolveKnowledgeCardVersionKey(
  input: KnowledgeCardVersionRef | number | string | null | undefined
): number | null {
  if (typeof input === 'number') return positiveFiniteNumber(input)
  if (typeof input === 'string') return knowledgeCardVersionToNumeric(input)
  if (!input) return null

  return (
    explicitVersionToNumeric(input.current_version) ??
    explicitVersionToNumeric(input.version_number) ??
    (input.version ? knowledgeCardVersionToNumeric(input.version) : null)
  )
}

export function resolveKnowledgeCardCurrentVersionKey<T extends KnowledgeCardVersionRef>(
  currentVersion: KnowledgeCardVersionRef | number | string | null | undefined,
  versions: T[]
): number | null {
  if (!currentVersion || typeof currentVersion !== 'object') {
    return resolveKnowledgeCardVersionKey(currentVersion)
  }

  const explicit =
    explicitVersionToNumeric(currentVersion.current_version) ??
    explicitVersionToNumeric(currentVersion.version_number)
  if (explicit != null) return explicit

  const matchedVersion = versions.find(
    (version) => version.version && version.version === currentVersion.version
  )
  return resolveKnowledgeCardVersionKey(matchedVersion ?? currentVersion)
}

export function buildKnowledgeCardVersionOptions<T extends KnowledgeCardVersionRef>(
  versions: T[]
): KnowledgeCardVersionOption[] {
  return versions.flatMap((row) => {
    const value = resolveKnowledgeCardVersionKey(row)
    if (value == null) return []
    return [{ label: row.version || `v${value}`, value }]
  })
}

export function isKnowledgeCardCurrentVersion(
  version: KnowledgeCardVersionRef | number | string | null | undefined,
  currentVersionKey: number | null | undefined
): boolean {
  if (currentVersionKey == null) return false
  return resolveKnowledgeCardVersionKey(version) === currentVersionKey
}

export function canCompareKnowledgeCardVersions(
  fromVersion: number,
  toVersion: number,
  validVersionKeys: number[]
): boolean {
  return (
    fromVersion > 0 &&
    toVersion > 0 &&
    fromVersion !== toVersion &&
    validVersionKeys.includes(fromVersion) &&
    validVersionKeys.includes(toVersion)
  )
}

export function canRollbackKnowledgeCardVersion(
  targetVersion: number,
  currentVersionKey: number | null | undefined,
  validVersionKeys: number[],
  comparedFromVersion?: number
): boolean {
  if (targetVersion <= 0 || !validVersionKeys.includes(targetVersion)) return false
  if (currentVersionKey != null && targetVersion === currentVersionKey) return false
  if (comparedFromVersion != null && comparedFromVersion === targetVersion) return false
  return true
}

export function findKnowledgeCardCompareTarget<T extends KnowledgeCardVersionRef>(
  targetVersion: T,
  versions: T[],
  currentVersionKey: number | null | undefined
): KnowledgeCardCompareTarget | null {
  const targetKey = resolveKnowledgeCardVersionKey(targetVersion)
  if (targetKey == null || isKnowledgeCardCurrentVersion(targetVersion, currentVersionKey)) {
    return null
  }

  const options = buildKnowledgeCardVersionOptions(versions)
  const currentOption = options.find((option) => option.value === currentVersionKey)
  const fromKey =
    currentOption && currentOption.value !== targetKey
      ? currentOption.value
      : options.find((option) => option.value !== targetKey)?.value

  return fromKey == null ? null : { from: fromKey, to: targetKey }
}

export function isKnowledgeCardDiffSelectionApplied(
  appliedFromVersion: number,
  appliedToVersion: number,
  selectedFromVersion: number,
  selectedToVersion: number
): boolean {
  return (
    appliedFromVersion > 0 &&
    appliedToVersion > 0 &&
    appliedFromVersion === selectedFromVersion &&
    appliedToVersion === selectedToVersion
  )
}
