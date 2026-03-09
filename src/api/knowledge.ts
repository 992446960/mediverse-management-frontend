import { request } from './index'
import type {
  OwnerType,
  DirectoryNode,
  FileListItem,
  FileListParams,
  FileStatusResponse,
  CreateDirectoryPayload,
} from '@/types/knowledge'
import type { PaginatedData } from '@/types/api'

const BASE_URL = '/knowledge'

/**
 * 获取目录树
 */
export function getDirectoryTree(ownerType: OwnerType, ownerId: string) {
  return request.get<DirectoryNode[]>(`${BASE_URL}/${ownerType}/${ownerId}/directories`)
}

/**
 * 新建目录
 */
export function createDirectory(ownerType: OwnerType, ownerId: string, payload: CreateDirectoryPayload) {
  return request.post<DirectoryNode>(`${BASE_URL}/${ownerType}/${ownerId}/directories`, payload)
}

/**
 * 查询文件列表
 */
export function getFileList(ownerType: OwnerType, ownerId: string, params: FileListParams) {
  return request.get<PaginatedData<FileListItem>>(`${BASE_URL}/${ownerType}/${ownerId}/files`, { params })
}

/**
 * 查询文件处理状态（轮询）
 */
export function getFileStatus(ownerType: OwnerType, ownerId: string, fileId: string) {
  return request.get<FileStatusResponse>(`${BASE_URL}/${ownerType}/${ownerId}/files/${fileId}/status`)
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
