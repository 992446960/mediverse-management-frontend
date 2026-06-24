import type { PaginationParams } from './api'

export type OwnerType = 'personal' | 'dept' | 'org' | 'avatar'
export type FileStatus = 'uploading' | 'parsing' | 'extracting' | 'indexing' | 'done' | 'failed'
/** 知识卡类型：由后端 GET /knowledge/card-types 动态下发，使用 string 保持扩展性 */
export type CardType = string
export type OnlineStatus = 'online' | 'offline' | 'creating' | 'updating'
export type AuditStatus = 'pending' | 'approved' | 'rejected'
export type FileCategory = 'guidline' | 'consensus' | 'clinical_record' | string
export type BatchAuditStatus = Extract<AuditStatus, 'approved' | 'rejected'>

/** GET /api/v1/knowledge/card-types 返回的单条 */
export interface CardTypeOption {
  name: string
  code: string
}

/** DELETE /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id} 返回的 data */
export interface DeleteCardResult {
  card_id: string
  action: string
}

/** 文件来源项（知识卡 sources / source_files 通用） */
export interface FileSource {
  id?: string
  name?: string
  file_name?: string
  file_type?: string
  file_size?: number
  storage_url?: string | null
  parsed_file_url?: string | null
  page_hint?: string | null
}

/** PATCH /knowledge/{owner_type}/{owner_id}/directories/{directory_id}/rename */
export interface RenameDirectoryPayload {
  name: string
}

/** POST /knowledge/{owner_type}/{owner_id}/files/batch/move */
export interface BatchMoveFilesPayload {
  file_ids: string[]
  target_dir_id: string | null
}

export interface BatchMoveFilesResult {
  moved_count: number
}

/** POST /knowledge/{owner_type}/{owner_id}/files/batch/delete */
export interface FileBatchDeletePayload {
  file_ids: string[]
}

export interface FileBatchDeleteResult {
  deleted_count: number
  file_ids: string[]
}

/** POST /knowledge/{owner_type}/{owner_id}/files/indexing-tasks/{task_id}/retry */
export interface FileIndexingRetryResult {
  task_id: string
  file_id: string
}

/** POST/PUT /knowledge/{owner_type}/{owner_id}/cards 异步写操作返回的 data */
export interface KnowledgeCardWriteTaskResult {
  task_id: string
  card_id: string
  audit_status: AuditStatus
  message: string
  online_status: OnlineStatus
  title: string
  type: CardType
}

/** 目录树节点 */
export interface DirectoryNode {
  id: string
  name: string
  is_default: boolean
  sort_order: number
  file_count: number
  children?: DirectoryNode[]
}

export interface DirectoryTreeResponse {
  tree: DirectoryNode[]
  total_file_count: number
  unclassified_file_count: number
}

/** 上传文件接口返回（单文件上传响应） */
export interface UploadFileResult {
  id: string
  file_name: string
  file_size: number
  status: FileStatus
  created_at: string
  cards?: FileCard[]
  storage_url?: string | null
  file_type?: string | null
  downstream_file_uuid?: string | null
  task_id?: string | null
  async_pending?: boolean
  downstream?: Record<string, unknown> | null
  indexing_task_id?: string | null
}

/** 文件列表项 */
export interface FileListItem {
  id: string
  file_name: string
  file_type: string
  file_size: number
  dir_id: string
  dir_name: string
  status: FileStatus
  /** 原文件 URL（部分接口字段名） */
  file_url?: string
  /** 存储侧原文件 URL（与 file_url 等价，优先任一可用即可） */
  storage_url?: string | null
  parsed_file_url?: string | null
  error_msg: string | null
  auto_category_suggestion: string | null
  auto_category_name: string | null
  knowledge_card_count: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  indexing_task_id?: string | null
}

/** 原文件可下载/预览 URL（兼容 file_url 与 storage_url） */
export function getFileOriginalUrl(item: FileListItem): string | undefined {
  const u = item.file_url ?? item.storage_url
  if (u == null || u === '') return undefined
  return u
}

/** 文件关联的知识卡（预览侧栏用） */
export interface FileCard {
  id: string
  type: CardType
  title: string
  tags: string[]
  online_status?: OnlineStatus
  audit_status?: AuditStatus
  audit_reject_reason?: string | null
  confidence?: number
  sources?: FileSource[]
}

/** 知识卡详情 */
export interface KnowledgeCard {
  id: string
  title: string
  /** 旧版兼容字段；新接口正文使用 md_content */
  content?: string
  /** 列表接口返回的搜索预览 */
  content_preview?: string
  json_content: string
  md_content: string
  type: CardType
  tags: string[]
  online_status: OnlineStatus
  audit_status: AuditStatus
  audit_reject_reason?: string | null
  reference_count: number
  /** 关联原文件；详情接口也可能以 `sources` 返回，由 API 层归一化 */
  source_files: {
    id: string
    name: string
    page_hint?: string
    /** 详情若直接返回则可省去再拉文件列表 */
    file_size?: number
    file_type?: string
  }[]
  owner_type: OwnerType
  owner_id: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  version: string
  /** 后端显式当前版本号（若有），用于版本对比 / 回退操作键 */
  current_version?: number | string
}

/** 知识卡版本 */
export interface KnowledgeCardVersion {
  /** 后端版本行 id（若有） */
  id?: string
  version: string
  /** 后端显式版本号（若有），用于 diff / rollback 参数 */
  version_number?: number | string
  summary: string
  created_by: string
  created_by_name: string
  created_at: string
  md_content?: string
}

/** 文件处理状态响应 */
export interface FileStatusResponse {
  id: string
  file_uuid?: string
  status: FileStatus
  cards?: FileCard[]
  indexing_task_id?: string | null
  downstream_file_uuid?: string | null
  task_id?: string | null
  async_pending?: boolean
  downstream?: Record<string, unknown> | null
  progress: {
    current_step: FileStatus
    steps: FileStatus[]
    step_index: number
  }
  error_msg: string | null
}

/** 文件列表请求参数 */
export interface FileListParams extends PaginationParams {
  dir_id?: string
  status?: FileStatus
  /** 文件名模糊搜索（与后端 / Mock 一致） */
  keyword?: string
}

/** 知识卡列表请求参数 */
export interface KnowledgeCardListParams extends PaginationParams {
  type?: CardType | 'all'
  online_status?: OnlineStatus
  audit_status?: AuditStatus
  keyword?: string
  /** 按来源文件过滤（API 4.1.7） */
  source_file_id?: string
  /** 按标签过滤（API 4.1.7） */
  tag?: string
}

/** POST /knowledge/{owner_type}/{owner_id}/cards/batch/delete */
export interface CardBatchDeletePayload {
  card_ids: string[]
}

export interface CardBatchDeleteResult {
  deleted_count: number
  card_ids: string[]
}

/** POST /knowledge/{owner_type}/{owner_id}/cards/batch/audit */
export interface CardBatchAuditPayload {
  card_ids: string[]
  audit_status: BatchAuditStatus
  audit_reject_reason?: string
}

export interface CardBatchAuditResult {
  updated_count: number
  card_ids: string[]
}

/** POST /knowledge/{owner_type}/{owner_id}/cards/batch/online */
export interface CardBatchOnlinePayload {
  card_ids: string[]
}

export interface CardBatchOfflinePayload {
  card_ids: string[]
  note?: string
}

export interface CardBatchOnlineResult {
  updated_count: number
  card_ids: string[]
}

/** POST /knowledge/{owner_type}/{owner_id}/cards/batch/increment-reference-count */
export interface KnowledgeCardBatchIncrementReferenceCountPayload {
  card_ids: string[]
}

export interface KnowledgeCardBatchIncrementReferenceCountResult {
  updated_count: number
}

/** 创建目录请求负载 */
export interface CreateDirectoryPayload {
  parent_id: string | null
  name: string
  sort_order?: number
}

/** 状态渲染配置 */
export const FILE_STATUS_CONFIG: Record<FileStatus, { color: string; label: string }> = {
  uploading: { color: 'blue', label: '上传中...' },
  parsing: { color: 'cyan', label: '正在解析文档...' },
  extracting: { color: 'geekblue', label: '正在提取知识...' },
  indexing: { color: 'purple', label: '正在建立索引...' },
  /** 已完成：#53b614 */
  done: { color: '#53b614', label: '已完成' },
  failed: { color: 'error', label: '解析失败' },
}

/** 知识卡类型配置（兜底/颜色映射；后端可动态扩展，未在此 Map 中的类型走 fallback） */
export const CARD_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  rule: { color: 'orange', label: '规则卡' },
  scale: { color: 'purple', label: '量表卡' },
  risk_point: { color: 'red', label: '风险控制点卡' },
  pathway_clause: { color: 'cyan', label: '路径条款卡' },
  melody_element: { color: 'geekblue', label: '乐谱元素卡' },
  score_element: { color: 'geekblue', label: '乐谱元素卡' },
  disease_overview: { color: 'blue', label: '疾病概览卡' },
  evidence: { color: 'green', label: '证据卡' },
  doctor_visit: { color: 'magenta', label: '就诊卡' },
  doctor_trajectory: { color: 'gold', label: '轨迹卡' },
  doctor_summary: { color: 'volcano', label: '经验卡' },
}

type TranslateFn = (key: string) => string

const CARD_TYPE_LABEL_KEYS: Record<string, string> = {
  rule: 'knowledge.card.typeRule',
  scale: 'knowledge.card.typeScale',
  risk_point: 'knowledge.card.typeRiskPoint',
  pathway_clause: 'knowledge.card.typePathwayClause',
  melody_element: 'knowledge.card.typeMelodyElement',
  score_element: 'knowledge.card.typeScoreElement',
  disease_overview: 'knowledge.card.typeDiseaseOverview',
  evidence: 'knowledge.card.typeEvidence',
  doctor_visit: 'knowledge.card.typeDoctorVisit',
  doctor_trajectory: 'knowledge.card.typeDoctorTrajectory',
  doctor_summary: 'knowledge.card.typeDoctorSummary',
}

/**
 * 安全获取知识卡类型配置；未知类型返回 fallback（灰色 + code 原文）。
 */
export function getCardTypeConfig(type: string, t?: TranslateFn): { color: string; label: string } {
  const config = CARD_TYPE_CONFIG[type] ?? { color: 'default', label: type }
  const labelKey = CARD_TYPE_LABEL_KEYS[type]
  return {
    ...config,
    label: labelKey && t ? t(labelKey) : config.label,
  }
}

export function getCardTypeOptionLabel(option: CardTypeOption, t?: TranslateFn): string {
  const config = getCardTypeConfig(option.code, t)
  return config.label === option.code ? option.name || option.code : config.label
}

/** 知识卡在线状态配置 */
export const ONLINE_STATUS_CONFIG: Record<OnlineStatus, { color: string; label: string }> = {
  online: { color: 'success', label: '已上线' },
  offline: { color: 'default', label: '已下线' },
  creating: { color: 'processing', label: '创建中' },
  updating: { color: 'processing', label: '更新中' },
}

const ONLINE_STATUS_LABEL_KEYS: Record<OnlineStatus, string> = {
  online: 'knowledge.card.onlineStatusOnline',
  offline: 'knowledge.card.onlineStatusOffline',
  creating: 'knowledge.card.onlineStatusCreating',
  updating: 'knowledge.card.onlineStatusUpdating',
}

export function getOnlineStatusConfig(
  status: string,
  t?: TranslateFn
): { color: string; label: string } {
  const config = ONLINE_STATUS_CONFIG[status as OnlineStatus] ?? { color: 'default', label: status }
  const labelKey = ONLINE_STATUS_LABEL_KEYS[status as OnlineStatus]
  return {
    ...config,
    label: labelKey && t ? t(labelKey) : config.label,
  }
}

/** 知识卡审核状态配置 */
export const AUDIT_STATUS_CONFIG: Record<AuditStatus, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审核' },
  approved: { color: 'success', label: '已通过' },
  rejected: { color: 'error', label: '已驳回' },
}

const AUDIT_STATUS_LABEL_KEYS: Record<AuditStatus, string> = {
  pending: 'knowledge.card.auditPending',
  approved: 'knowledge.card.auditApproved',
  rejected: 'knowledge.card.auditRejected',
}

export function getAuditStatusConfig(
  status: AuditStatus,
  t?: TranslateFn
): { color: string; label: string } {
  const config = AUDIT_STATUS_CONFIG[status]
  return {
    ...config,
    label: t ? t(AUDIT_STATUS_LABEL_KEYS[status]) : config.label,
  }
}

export function canPublishKnowledgeCard(auditStatus: AuditStatus): boolean {
  return auditStatus === 'approved'
}

export function canOperateKnowledgeCard(onlineStatus: OnlineStatus): boolean {
  return onlineStatus !== 'creating' && onlineStatus !== 'updating'
}

/** 创建/更新知识卡请求负载 */
export interface KnowledgeCardPayload {
  id?: string
  title: string
  /** Markdown 内容，替代旧版 content 字段 */
  md_content: string
  type: CardType
  tags: string[]
  /** 来源文件 ID 列表，仅创建时可选（API 4.1.9） */
  source_file_ids?: string[]
}

/** 版本 Diff 单元（API 4.1.13） */
export interface VersionDiffSegment {
  type: 'equal' | 'delete' | 'insert'
  md_content: string
  highlight_version?: number
  md_content_snapshot_version?: number
}

/** 版本对比响应（API 4.1.13） */
export interface VersionDiffResult {
  from_version: number
  to_version: number
  from_md_content: string
  to_md_content: string
  diff: VersionDiffSegment[]
}
