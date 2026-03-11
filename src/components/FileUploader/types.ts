import type { UploadFileResult } from '@/types/knowledge'

/** 上传队列单项 */
export interface UploadQueueItem {
  uid: string
  file: File
  fileName: string
  status: 'pending' | 'uploading' | 'success' | 'fail'
  percent: number
  result?: UploadFileResult
  error?: string
}
