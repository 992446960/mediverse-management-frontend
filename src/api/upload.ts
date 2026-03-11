import { request } from '@/api/index'

interface UploadAvatarResponse {
  url: string
  file_name: string
  file_size: number
}

/** 通用头像上传：用于分身、用户、机构等头像上传，返回可用的图片 URL */
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadAvatarResponse>('/upload/avatar', formData)
}

