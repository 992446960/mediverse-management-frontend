import { http, HttpResponse, delay } from 'msw'
import { mockDirectories, mockFiles, FILE_STATUS_STEPS, MOCK_PARSED_MD } from '../data/knowledge'
import { mockKnowledgeCards, mockCardVersions } from '../data/knowledgeCards'
import type {
  DirectoryNode,
  FileListItem,
  FileCard,
  KnowledgeCard,
  OwnerType,
} from '@/types/knowledge'

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
const mutableCards = [...mockKnowledgeCards]

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
      const rawDirId = (formData.get('dir_id') as string) || ''
      const dirId = rawDirId

      if (!rawFile || !(rawFile instanceof File)) {
        return HttpResponse.json(
          { code: 40001, message: 'Missing file', data: null },
          { status: 200 }
        )
      }

      const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const fileType = (rawFile.name.split('.').pop() || 'bin').toLowerCase()
      let dirName = '未分类'
      let resolvedDirId = dirId
      if (dirId === '-1') {
        dirName = '未分类'
        resolvedDirId = '-1'
      } else if (dirId) {
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
        dir_id: resolvedDirId,
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

    if (dirId === '__uncategorized__' || dirId === '-1') {
      filtered = filtered.filter((f) => !f.dir_id || f.dir_id === '-1' || f.dir_id === '')
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

  // 查询知识卡列表
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/cards`, async ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const onlineStatus = url.searchParams.get('online_status')
    const auditStatus = url.searchParams.get('audit_status')
    const keyword = url.searchParams.get('keyword')
    const page = Number(url.searchParams.get('page') || '1')
    const pageSize = Number(url.searchParams.get('page_size') || '20')

    let filtered = [...mutableCards]

    if (type && type !== 'all') {
      filtered = filtered.filter((c) => c.type === type)
    }
    if (onlineStatus) {
      filtered = filtered.filter((c) => c.online_status === onlineStatus)
    }
    if (auditStatus) {
      filtered = filtered.filter((c) => c.audit_status === auditStatus)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(kw) || c.content.toLowerCase().includes(kw)
      )
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    await delay(300)
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

  // 获取单个知识卡详情
  http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId`, async ({ params }) => {
    const { cardId } = params
    const card = mutableCards.find((c) => c.id === cardId)
    if (!card) {
      return HttpResponse.json({ code: 404, message: 'Card not found', data: null })
    }
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: card,
    })
  }),

  // 创建知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards`, async ({ request, params }) => {
    const payload = (await request.json()) as any
    const { ownerType, ownerId } = params as { ownerType: OwnerType; ownerId: string }

    const newCard: KnowledgeCard = {
      id: `card_${Date.now()}`,
      title: payload.title,
      content: payload.content,
      type: payload.type,
      tags: payload.tags || [],
      online_status: 'offline',
      audit_status: 'pending',
      reference_count: 0,
      source_files: payload.source_files || [],
      owner_type: ownerType as any,
      owner_id: ownerId,
      created_by: 'u_current_user',
      created_by_name: '当前用户',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 'v1.0.0',
    }
    mutableCards.unshift(newCard)
    return HttpResponse.json({ code: 0, message: 'created', data: newCard })
  }),

  // 更新知识卡
  http.put(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId`,
    async ({ params, request }) => {
      const { cardId } = params
      const payload = (await request.json()) as any
      const card = mutableCards.find((c) => c.id === cardId)
      if (card) {
        const versionStr = card.version || 'v1.0.0'
        const versionParts = versionStr.split('.')
        const majorVersion = parseInt(versionParts[0]?.slice(1) || '1')
        Object.assign(card, {
          ...payload,
          updated_at: new Date().toISOString(),
          version: `v${majorVersion + 1}.0.0`,
        })
        return HttpResponse.json({ code: 0, message: 'ok', data: card })
      }
      return HttpResponse.json({ code: 404, message: 'not found' })
    }
  ),

  // 知识卡上下线（PATCH + online_status）
  http.patch(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/status`,
    async ({ params, request }) => {
      const { cardId } = params
      const { online_status } = (await request.json()) as { online_status: 'online' | 'offline' }
      const card = mutableCards.find((c) => c.id === cardId)
      if (card) {
        card.online_status = online_status
        return HttpResponse.json({ code: 0, message: 'ok', data: card })
      }
      return HttpResponse.json({ code: 404, message: 'not found' })
    }
  ),

  // 获取版本历史
  http.get(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/versions`,
    async ({ params }) => {
      const { cardId } = params
      const versions = mockCardVersions[cardId as string] || []
      return HttpResponse.json({ code: 0, message: 'ok', data: versions })
    }
  ),

  // 版本回退（body: target_version 数字）
  http.post(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/rollback`,
    async ({ params, request }) => {
      const { cardId } = params
      const { target_version } = (await request.json()) as { target_version: number }
      const card = mutableCards.find((c) => c.id === cardId)
      const versions = mockCardVersions[cardId as string] || []
      const versionData = versions[target_version - 1] // 1-based index

      if (card && versionData) {
        card.content = versionData.content
        card.version = versionData.version
        card.updated_at = new Date().toISOString()
        return HttpResponse.json({ code: 0, message: 'ok', data: card })
      }
      return HttpResponse.json({ code: 404, message: 'not found' })
    }
  ),
]
