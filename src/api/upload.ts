import { request } from '@/api/index'

interface UploadAvatarResponse {
  url: string
  file_name: string
  file_size: number
}

/**
 * 将接口返回的相对路径 url（如 /files/xxx.jpg）拼接为完整地址，用于 img 回显等。
 * - 已是 http/https 网络地址：直接返回
 * - 相对路径：优先 VITE_FILE_BASE_URL，否则用 VITE_API_BASE_URL 的 origin，再回退到 window.location.origin
 */
export function toAbsoluteFileUrl(path: string): string {
  if (!path) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!path.startsWith('/')) return path
  const fileBase = import.meta.env.VITE_FILE_BASE_URL
  if (fileBase) return fileBase.replace(/\/$/, '') + path
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL
    if (apiBase?.startsWith('http')) return new URL(apiBase).origin + path
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') return window.location.origin + path
  return path
}

/** 通用头像上传：用于分身、用户、机构等头像上传，返回可用的图片 URL（已拼接为完整地址） */
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadAvatarResponse>('/upload/avatar', formData).then((data) => ({
    ...data,
    url: toAbsoluteFileUrl(data.url),
  }))
}
