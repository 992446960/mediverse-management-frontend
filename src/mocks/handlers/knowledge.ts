import { http, HttpResponse, delay } from 'msw'
import { mockDirectories, mockFiles, FILE_STATUS_STEPS, MOCK_PARSED_MD } from '../data/knowledge'
import type { DirectoryNode, FileListItem, FileCard } from '@/types/knowledge'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 最小有效 PDF 用于预览占位 */
const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF`

/** 模拟知识卡数据 */
const mockFileCards: Record<string, FileCard[]> = {
  file_001: [
    {
      id: 'card_001',
      type: 'evidence',
      title: '高血压诊断标准',
      tags: ['高血压', '诊断'],
      online_status: 'online',
      confidence: 0.92,
    },
    {
      id: 'card_002',
      type: 'rule',
      title: '降压药物选用原则',
      tags: ['用药', '指南'],
      online_status: 'online',
      confidence: 0.88,
    },
    {
      id: 'card_003',
      type: 'experience',
      title: '顽固性高血压处理经验',
      tags: ['临床经验'],
      online_status: 'online',
      confidence: 0.85,
    },
  ],
}

// 可变数据，模拟增删改
const mutableDirectories = [...mockDirectories]
const mutableFiles = [...mockFiles]

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
        return HttpResponse.json(
          { code: 40001, message: 'Missing file', data: null },
          { status: 200 }
        )
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

  // 查询单个文件详情
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId`, async ({ params }) => {
    const { fileId } = params
    const file = mutableFiles.find((f) => f.id === fileId)
    if (!file) {
      return HttpResponse.json({ code: 40002, message: 'File not found', data: null })
    }
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: file,
    })
  }),

  // 查询文件关联的知识卡
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/files/:fileId/cards`, async ({ params }) => {
    const fileId = params.fileId as string
    await delay(300)
    const items = mockFileCards[fileId] ?? []
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: items,
    })
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

  // 模拟解析后文档（ParsedDocViewer fetch）
  http.get(`${API_BASE}/mock/files/:fileId/parsed`, async () => {
    await delay(100)
    return new HttpResponse(MOCK_PARSED_MD, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }),

  // 模拟原文件（vue-office fetch，返回最小 PDF 二进制流）
  http.get(`${API_BASE}/mock/files/:fileId/original`, async () => {
    await delay(100)
    const body = new TextEncoder().encode(MINIMAL_PDF)
    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(body.length),
      },
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
