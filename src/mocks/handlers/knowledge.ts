import { http, HttpResponse, delay } from 'msw'
import { mockDirectories, mockFiles, FILE_STATUS_STEPS } from '../data/knowledge'
import type { DirectoryNode, FileListItem } from '@/types/knowledge'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// 可变数据，模拟增删改
let mutableDirectories = [...mockDirectories]
let mutableFiles = [...mockFiles]

export const knowledgeHandlers = [
  // 获取目录树
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/directories`, async () => {
    await delay(300)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: mutableDirectories,
    })
  }),

  // 新建目录
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/directories`, async ({ request }) => {
    const payload = (await request.json()) as any
    const newDir: DirectoryNode = {
      id: `dir_${Date.now()}`,
      name: payload.name,
      is_default: false,
      sort_order: 99,
      file_count: 0,
      children: [],
    }

    if (payload.parent_id) {
      const findAndAdd = (nodes: DirectoryNode[]) => {
        for (const node of nodes) {
          if (node.id === payload.parent_id) {
            node.children = node.children || []
            node.children.push(newDir)
            return true
          }
          if (node.children && findAndAdd(node.children)) return true
        }
        return false
      }
      findAndAdd(mutableDirectories)
    } else {
      mutableDirectories.push(newDir)
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: newDir,
    })
  }),

  // 上传文件（单文件，FormData: file + 可选 dir_id）
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files`, async ({ request }) => {
    try {
      const formData = await request.formData()
      const file = (formData.get('file') ?? formData.get('files')) as File | FileList | null
      const rawFile = file instanceof FileList ? file[0] : file
      const dirId = (formData.get('dir_id') as string) || ''

      if (!rawFile || !(rawFile instanceof File)) {
        return HttpResponse.json({ code: 40001, message: 'Missing file', data: null }, { status: 200 })
      }

    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const fileType = (rawFile.name.split('.').pop() || 'bin').toLowerCase()
    let dirName = '未分类'
    if (dirId) {
      const findDir = (nodes: typeof mutableDirectories): string | null => {
        for (const n of nodes) {
          if (n.id === dirId) return n.name
          if (n.children?.length) {
            const found = findDir(n.children)
            if (found) return found
          }
        }
        return null
      }
      dirName = findDir(mutableDirectories) ?? dirName
    }

    const newItem: FileListItem = {
      id,
      file_name: rawFile.name,
      file_type: fileType,
      file_size: rawFile.size,
      dir_id: dirId,
      dir_name: dirName,
      status: 'uploading',
      error_msg: null,
      auto_category_suggestion: null,
      auto_category_name: null,
      knowledge_card_count: 0,
      created_by: 'u_doctor_001',
      created_by_name: '北京协和医院',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mutableFiles.push(newItem)
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: [
        {
          id: newItem.id,
          file_name: newItem.file_name,
          file_size: newItem.file_size,
          status: newItem.status,
          created_at: newItem.created_at,
        },
      ],
    })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      return HttpResponse.json({ code: 50001, message, data: null }, { status: 200 })
    }
  }),

  // 查询文件列表
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/files`, async ({ request }) => {
    const url = new URL(request.url)
    const dirId = url.searchParams.get('dir_id')
    const status = url.searchParams.get('status')
    const keyword = url.searchParams.get('keyword')
    const page = Number(url.searchParams.get('page') || '1')
    const pageSize = Number(url.searchParams.get('page_size') || '20')

    let filtered = [...mutableFiles]

    if (dirId === '__uncategorized__') {
      filtered = filtered.filter((f) => !f.dir_id)
    } else if (dirId && dirId !== '__all__') {
      filtered = filtered.filter((f) => f.dir_id === dirId)
    }

    if (status) {
      filtered = filtered.filter((f) => f.status === status)
    }

    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter((f) => f.file_name.toLowerCase().includes(kw))
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    await delay(400)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        total,
        page,
        page_size: pageSize,
        items,
      },
    })
  }),

  // 查询文件处理状态（轮询）
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId/status`, async ({ params }) => {
    const { fileId } = params
    const file = mutableFiles.find((f) => f.id === fileId)

    if (!file) {
      return HttpResponse.json({ code: 404, message: 'File not found', data: null })
    }

    // 模拟状态推进
    if (file.status !== 'done' && file.status !== 'failed') {
      const currentIndex = FILE_STATUS_STEPS.indexOf(file.status)
      if (currentIndex >= 0 && currentIndex < FILE_STATUS_STEPS.length - 1) {
        const next = FILE_STATUS_STEPS[currentIndex + 1]
        if (next && Math.random() > 0.5) file.status = next
      }
    }

    const stepIndex = FILE_STATUS_STEPS.indexOf(file.status)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        id: fileId,
        status: file.status,
        progress: {
          current_step: file.status,
          steps: FILE_STATUS_STEPS,
          step_index: stepIndex,
        },
        error_msg: file.error_msg,
      },
    })
  }),

  // 重试失败的文件处理
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId/retry`, async ({ params }) => {
    const { fileId } = params
    const file = mutableFiles.find((f) => f.id === fileId)

    if (!file) {
      return HttpResponse.json({ code: 404, message: 'File not found', data: null })
    }

    file.status = 'uploading'
    file.error_msg = null

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  // 删除文件
  http.delete(`${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId`, async ({ params }) => {
    const { fileId } = params
    const index = mutableFiles.findIndex((f) => f.id === fileId)

    if (index === -1) {
      return HttpResponse.json({ code: 404, message: 'File not found', data: null })
    }

    mutableFiles.splice(index, 1)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  // 下载文件
  http.get(
    `${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId/download`,
    async ({ params }) => {
      const { fileId } = params
      const file = mutableFiles.find((f) => f.id === fileId)

      if (!file) {
        return HttpResponse.json({ code: 404, message: 'File not found', data: null })
      }

      // 模拟返回一个简单的 Blob 数据
      const blob = new Blob(['Mock file content for ' + file.file_name], { type: 'text/plain' })
      return new HttpResponse(blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`,
        },
      })
    }
  ),
]
