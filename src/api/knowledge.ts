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
  if (dirId) form.append('dir_id', dirId)
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
  return request.get<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`)
}

/**
 * 创建知识卡
 */
export function saveKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  payload: KnowledgeCardPayload
) {
  return request.post<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards`, payload)
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
  return request.put<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`, payload)
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
  return request.patch<KnowledgeCard>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/status`,
    { online_status: status }
  )
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
  return request.post<KnowledgeCard>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/rollback`,
    { target_version: targetVersion }
  )
}
