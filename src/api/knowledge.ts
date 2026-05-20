import { request } from './index'
import type {
  OwnerType,
  DirectoryNode,
  FileListItem,
  FileListParams,
  FileStatusResponse,
  CreateDirectoryPayload,
  UploadFileResult,
  FileCard,
  KnowledgeCard,
  KnowledgeCardVersion,
  KnowledgeCardListParams,
  KnowledgeCardPayload,
  VersionDiffResult,
  CardTypeOption,
  DeleteCardResult,
  RenameDirectoryPayload,
  BatchMoveFilesPayload,
  BatchMoveFilesResult,
  FileIndexingRetryResult,
  CreateKnowledgeCardResult,
} from '@/types/knowledge'
import type { PaginatedData } from '@/types/api'
import type { AxiosRequestConfig } from 'axios'

const BASE_URL = '/knowledge'

/** 后端 GET .../cards/:id/versions 单条（字段名可能与前端模型不一致） */
interface KnowledgeCardVersionRaw {
  id?: string
  version?: string
  version_number?: number | string
  summary?: string
  change_summary?: string | null
  created_by?: string
  operated_by?: string
  created_by_name?: string
  operated_by_name?: string
  created_at: string
  md_content?: string
  content?: string
}

/** 详情/写操作返回：兼容 `sources` + `file_name`（见 API 设计 4.1.8）与旧字段 `source_files` + `name` */
function normalizeKnowledgeCard(data: unknown): KnowledgeCard {
  if (data == null || typeof data !== 'object') {
    throw new Error('normalizeKnowledgeCard: invalid data')
  }
  const raw = data as Record<string, unknown>
  const base = data as KnowledgeCard

  const normalizeFiles = (arr: unknown[]): KnowledgeCard['source_files'] =>
    arr
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((f) => {
        const pageHint =
          typeof f.page_hint === 'string' && f.page_hint !== '' ? f.page_hint : undefined
        const row: KnowledgeCard['source_files'][number] = {
          id: String(f.id ?? f.file_id ?? ''),
          name: String(f.name ?? f.file_name ?? ''),
        }
        if (pageHint !== undefined) row.page_hint = pageHint
        const fsRaw = f['file_size'] ?? f['size']
        if (typeof fsRaw === 'number' && !Number.isNaN(fsRaw)) row.file_size = fsRaw
        const ft = f['file_type']
        if (typeof ft === 'string' && ft !== '') row.file_type = ft
        return row
      })

  let source_files: KnowledgeCard['source_files'] = []
  if (Array.isArray(raw.source_files) && raw.source_files.length > 0) {
    source_files = normalizeFiles(raw.source_files)
  } else if (Array.isArray(raw.sources) && raw.sources.length > 0) {
    source_files = normalizeFiles(raw.sources)
  }

  const cv = raw.current_version
  const version =
    typeof raw.version === 'string' && raw.version !== ''
      ? raw.version
      : typeof cv === 'number' || (typeof cv === 'string' && cv !== '')
        ? `v${cv}`
        : base.version

  const json_content = typeof raw.json_content === 'string' ? raw.json_content : ''
  const md_content =
    typeof raw.md_content === 'string' && raw.md_content !== ''
      ? raw.md_content
      : typeof base.content === 'string'
        ? base.content
        : ''

  const normalized: KnowledgeCard = {
    ...base,
    source_files,
    version,
    current_version:
      typeof cv === 'number' || (typeof cv === 'string' && cv !== '') ? cv : base.current_version,
    json_content,
    md_content,
  }
  if (typeof base.content === 'string') normalized.content = base.content
  return normalized
}

function normalizeKnowledgeCardVersion(raw: KnowledgeCardVersionRaw): KnowledgeCardVersion {
  const version =
    raw.version != null && raw.version !== ''
      ? raw.version
      : raw.version_number != null
        ? `v${raw.version_number}`
        : ''
  return {
    id: raw.id,
    version,
    version_number: raw.version_number,
    summary: raw.change_summary ?? raw.summary ?? '',
    created_by: raw.operated_by ?? raw.created_by ?? '',
    created_by_name: raw.operated_by_name ?? raw.created_by_name ?? '',
    created_at: raw.created_at,
    md_content: raw.md_content ?? raw.content ?? '',
  }
}

/**
 * 单文件上传。FormData 仅 append 一个 file，可选 dir_id。
 * 响应 data 可能是单对象或单元素数组，统一解析为 UploadFileResult。
 */
export function uploadFile(
  ownerType: OwnerType,
  ownerId: string,
  file: File,
  dirId?: string,
  config?: AxiosRequestConfig
): Promise<UploadFileResult> {
  if (!(file instanceof File)) {
    return Promise.reject(new Error('uploadFile requires a native File object'))
  }
  const form = new FormData()
  form.append('files', file)
  if (dirId !== undefined && dirId !== '') {
    form.append('dir_id', String(dirId))
  }
  // 全局 axios 默认 10s，大文件经反代上传易超时；调用方可通过 config.timeout 覆盖
  const uploadConfig = { timeout: 600_000, ...config }
  return request
    .post<
      UploadFileResult | UploadFileResult[]
    >(`${BASE_URL}/${ownerType}/${ownerId}/files`, form, uploadConfig)
    .then((data) => {
      const one = Array.isArray(data) ? data[0] : data
      if (!one) throw new Error('Upload response empty')
      return one
    })
}

/**
 * 获取目录树
 */
export function getDirectoryTree(ownerType: OwnerType, ownerId: string) {
  return request.get<DirectoryNode[]>(`${BASE_URL}/${ownerType}/${ownerId}/directories`)
}

/**
 * 新建目录
 */
export function createDirectory(
  ownerType: OwnerType,
  ownerId: string,
  payload: CreateDirectoryPayload
) {
  return request.post<DirectoryNode>(`${BASE_URL}/${ownerType}/${ownerId}/directories`, payload)
}

/**
 * 重命名非默认目录
 */
export function renameDirectory(
  ownerType: OwnerType,
  ownerId: string,
  directoryId: string,
  payload: RenameDirectoryPayload
) {
  return request.patch<DirectoryNode>(
    `${BASE_URL}/${ownerType}/${ownerId}/directories/${directoryId}/rename`,
    payload
  )
}

/**
 * 删除非默认空目录
 */
export function deleteDirectory(ownerType: OwnerType, ownerId: string, directoryId: string) {
  return request.delete<string>(`${BASE_URL}/${ownerType}/${ownerId}/directories/${directoryId}`)
}

/**
 * 查询文件列表
 */
export function getFileList(ownerType: OwnerType, ownerId: string, params: FileListParams) {
  return request.get<PaginatedData<FileListItem>>(`${BASE_URL}/${ownerType}/${ownerId}/files`, {
    params,
  })
}

const FILE_LIST_LOOKUP_PAGE_SIZE = 100
const FILE_LIST_LOOKUP_MAX_PAGES = 30

/**
 * 在文件列表中按 id 查找完整 `FileListItem`（关联文件跳转预览等；无单独文件详情接口时通过分页扫描）。
 */
export async function getFileListItemById(
  ownerType: OwnerType,
  ownerId: string,
  fileId: string
): Promise<FileListItem | null> {
  if (!fileId) return null
  let page = 1
  for (let i = 0; i < FILE_LIST_LOOKUP_MAX_PAGES; i++) {
    const { items, total } = await getFileList(ownerType, ownerId, {
      page,
      page_size: FILE_LIST_LOOKUP_PAGE_SIZE,
    })
    const hit = items.find((x) => x.id === fileId)
    if (hit) return hit
    if (page * FILE_LIST_LOOKUP_PAGE_SIZE >= total) break
    page++
  }
  return null
}

/**
 * 查询文件处理状态（轮询）
 */
export function getFileStatus(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.get<FileStatusResponse>(
    `${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}/status`
  )
}

/**
 * 删除文件
 */
export function deleteFile(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.delete(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}`)
}

/**
 * 批量移动文件到指定目录
 */
export function batchMoveFiles(
  ownerType: OwnerType,
  ownerId: string,
  payload: BatchMoveFilesPayload
) {
  return request.post<BatchMoveFilesResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/files/batch/move`,
    payload
  )
}

/**
 * 重试失败的文件索引任务
 */
export function retryFileIndexingTask(ownerType: OwnerType, ownerId: string, taskId: string) {
  return request.post<FileIndexingRetryResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/files/indexing-tasks/${taskId}/retry`
  )
}

/**
 * 查询文件关联的知识卡
 * GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/cards
 */
export function getFileCards(
  ownerType: OwnerType,
  ownerId: string,
  fileId: string
): Promise<FileCard[]> {
  return request.get<FileCard[]>(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}/cards`)
}

// ─── 知识卡 CRUD ───────────────────────────────────────────

/**
 * 查询知识卡列表
 */
export function getKnowledgeCards(
  ownerType: OwnerType,
  ownerId: string,
  params: KnowledgeCardListParams
) {
  return request.get<PaginatedData<KnowledgeCard>>(`${BASE_URL}/${ownerType}/${ownerId}/cards`, {
    params,
  })
}

/**
 * 获取单个知识卡详情
 */
export function getKnowledgeCardDetail(ownerType: OwnerType, ownerId: string, cardId: string) {
  return request
    .get<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`)
    .then(normalizeKnowledgeCard)
}

/**
 * 创建知识卡
 */
export function saveKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  payload: KnowledgeCardPayload
): Promise<CreateKnowledgeCardResult> {
  return request.post<CreateKnowledgeCardResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards`,
    payload
  )
}

/**
 * 更新知识卡
 */
export function updateKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  payload: Partial<
    Pick<KnowledgeCardPayload, 'title' | 'type' | 'md_content' | 'tags'> & {
      change_summary?: string
    }
  >
) {
  return request
    .put<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`, payload)
    .then(normalizeKnowledgeCard)
}

/**
 * 知识卡上下线切换（API 4.1.11）
 */
export function toggleKnowledgeCardStatus(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  status: 'online' | 'offline',
  note?: string
) {
  const body: Record<string, unknown> = { online_status: status }
  if (note) body.note = note
  return request
    .patch<
      KnowledgeCard & { status_action?: { card_id: string; online_status: string } }
    >(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/status`, body)
    .then(normalizeKnowledgeCard)
}

/**
 * 获取知识卡版本历史
 */
export function getKnowledgeCardVersions(ownerType: OwnerType, ownerId: string, cardId: string) {
  return request
    .get<KnowledgeCardVersionRaw[]>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/versions`)
    .then((rows) => rows.map(normalizeKnowledgeCardVersion))
}

/**
 * 知识卡版本回退（API 4.1.14）
 */
export function rollbackKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  targetVersion: number,
  reason?: string
) {
  const body: Record<string, unknown> = { target_version: targetVersion }
  if (reason) body.reason = reason
  return request
    .post<
      KnowledgeCard & { rollback_action?: { card_id: string; review_state: string } }
    >(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/rollback`, body)
    .then(normalizeKnowledgeCard)
}

/**
 * 查询知识卡类型（API 4.1.15）
 * GET /api/v1/knowledge/card-types
 */
export function getCardTypes(): Promise<CardTypeOption[]> {
  return request.get<CardTypeOption[]>(`${BASE_URL}/card-types`, {
    successCodes: [0, 200],
  })
}

/**
 * 删除知识卡（API 4.1.16）
 * DELETE /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}
 */
export function deleteKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string
): Promise<DeleteCardResult> {
  return request.delete<DeleteCardResult>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`)
}

/**
 * 修改知识卡审核状态（API 4.1.17）
 * PATCH /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/audit
 */
export function auditKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  auditStatus: 'approved' | 'rejected',
  auditRejectReason?: string
) {
  const body: Record<string, unknown> = { audit_status: auditStatus }
  if (auditStatus === 'rejected' && auditRejectReason) {
    body.audit_reject_reason = auditRejectReason
  }
  return request
    .patch<
      KnowledgeCard & { review_action?: { card_id: string; review_state: string } }
    >(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/audit`, body)
    .then(normalizeKnowledgeCard)
}

/**
 * 知识卡版本对比（API 4.1.13）
 * GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions/diff
 */
export async function getKnowledgeCardVersionDiff(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiffResult> {
  const raw = await request.get<VersionDiffResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/versions/diff`,
    { params: { from_version: fromVersion, to_version: toVersion } }
  )
  // 兼容后端可能返回 content（旧字段）或 md_content（新字段）
  if (raw.diff) {
    raw.diff = raw.diff.map((seg: any) => ({
      ...seg,
      md_content: seg.md_content ?? seg.content ?? '',
    }))
  }
  raw.from_md_content = raw.from_md_content ?? (raw as any).from_content ?? ''
  raw.to_md_content = raw.to_md_content ?? (raw as any).to_content ?? ''
  return raw
}
