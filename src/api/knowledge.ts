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
} from '@/types/knowledge'
import type { PaginatedData } from '@/types/api'
import type { AxiosRequestConfig } from 'axios'

const BASE_URL = '/knowledge'

/** 后端 GET .../cards/:id/versions 单条（字段名可能与前端模型不一致） */
interface KnowledgeCardVersionRaw {
  id?: string
  version?: string
  version_number?: number
  summary?: string
  change_summary?: string | null
  created_by?: string
  operated_by?: string
  created_by_name?: string
  operated_by_name?: string
  created_at: string
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

  return {
    ...base,
    source_files,
    version,
  }
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
    summary: raw.change_summary ?? raw.summary ?? '',
    created_by: raw.operated_by ?? raw.created_by ?? '',
    created_by_name: raw.operated_by_name ?? raw.created_by_name ?? '',
    created_at: raw.created_at,
    content: raw.content ?? '',
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
  return request
    .post<
      UploadFileResult | UploadFileResult[]
    >(`${BASE_URL}/${ownerType}/${ownerId}/files`, form, config)
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
) {
  return request
    .post<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards`, payload)
    .then(normalizeKnowledgeCard)
}

/**
 * 更新知识卡
 */
export function updateKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  payload: Partial<
    Pick<KnowledgeCardPayload, 'title' | 'content' | 'tags'> & { change_summary?: string }
  >
) {
  return request
    .put<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`, payload)
    .then(normalizeKnowledgeCard)
}

/**
 * 知识卡上下线切换（PATCH + online_status）
 */
export function toggleKnowledgeCardStatus(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  status: 'online' | 'offline'
) {
  return request
    .patch<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/status`, {
      online_status: status,
    })
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
 * 知识卡版本回退（body: target_version 数字）
 */
export function rollbackKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  targetVersion: number
) {
  return request
    .post<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/rollback`, {
      target_version: targetVersion,
    })
    .then(normalizeKnowledgeCard)
}
