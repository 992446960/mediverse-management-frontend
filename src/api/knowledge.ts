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
} from '@/types/knowledge'
import type { PaginatedData } from '@/types/api'
import type { AxiosRequestConfig } from 'axios'

const BASE_URL = '/knowledge'

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
  form.append('file', file)
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
 * 查询单个文件详情（含 file_url、parsed_file_url）
 */
export function getFileDetail(
  ownerType: OwnerType,
  ownerId: string,
  fileId: string
): Promise<FileListItem> {
  return request.get<FileListItem>(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}`)
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
 * 重试失败的文件处理
 */
export function retryFile(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.post(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}/retry`)
}

/**
 * 删除文件
 */
export function deleteFile(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.delete(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}`)
}

/**
 * 下载文件
 */
export function downloadFile(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.get(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}/download`, {
    responseType: 'blob',
  })
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
