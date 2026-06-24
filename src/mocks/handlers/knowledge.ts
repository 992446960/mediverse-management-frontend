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
import {
  resolveKnowledgeCardPreviousVersionKey,
  resolveKnowledgeCardVersionKey,
} from '@/utils/knowledgeCardVersion'

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
      type: 'disease_overview',
      title: '高血压诊断标准',
      tags: ['高血压', '诊断'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: '',
      confidence: 0.92,
      sources: [{ id: 'file_001', file_name: '中国高血压防治指南2023.pdf' }],
    },
    {
      id: 'card_002',
      type: 'rule',
      title: '降压药物选用原则',
      tags: ['用药', '指南'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: '',
      confidence: 0.88,
      sources: [{ id: 'file_001', file_name: '中国高血压防治指南2023.pdf' }],
    },
    {
      id: 'card_003',
      type: 'scale',
      title: '顽固性高血压处理经验',
      tags: ['临床经验'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: '',
      confidence: 0.85,
      sources: [{ id: 'file_001', file_name: '中国高血压防治指南2023.pdf' }],
    },
    {
      id: 'card_004',
      type: 'scale',
      title: '高血压评估量表',
      tags: ['量表', '评估'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: '',
      confidence: 0.9,
      sources: [{ id: 'file_001', file_name: '中国高血压防治指南2023.pdf' }],
    },
  ],
}

// 可变数据，模拟增删改
const mutableDirectories = [...mockDirectories]
const mutableFiles = [...mockFiles]
const mutableCards = [...mockKnowledgeCards]

function findDirectoryById(nodes: DirectoryNode[], id: string): DirectoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = node.children?.length ? findDirectoryById(node.children, id) : null
    if (child) return child
  }
  return null
}

function findDirectoryName(nodes: DirectoryNode[], id: string): string | null {
  return findDirectoryById(nodes, id)?.name ?? null
}

function removeDirectoryById(
  nodes: DirectoryNode[],
  id: string
): 'deleted' | 'blocked' | 'missing' {
  const index = nodes.findIndex((node) => node.id === id)
  if (index >= 0) {
    const dir = nodes[index]!
    const hasFiles = mutableFiles.some((file) => file.dir_id === id)
    if (dir.is_default || dir.children?.length || dir.file_count > 0 || hasFiles) {
      return 'blocked'
    }
    nodes.splice(index, 1)
    return 'deleted'
  }

  for (const node of nodes) {
    if (!node.children?.length) continue
    const result = removeDirectoryById(node.children, id)
    if (result !== 'missing') return result
  }
  return 'missing'
}

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

  // 重命名非默认目录
  http.patch(
    `${API_BASE}/knowledge/:ownerType/:ownerId/directories/:directoryId/rename`,
    async ({ params, request }) => {
      const directoryId = String(params.directoryId ?? '')
      const payload = (await request.json()) as { name?: string }
      const nextName = payload.name?.trim()
      if (!nextName) {
        return HttpResponse.json(
          { code: 400, message: 'name is required', data: null },
          { status: 400 }
        )
      }

      const dir = findDirectoryById(mutableDirectories, directoryId)
      if (!dir) {
        return HttpResponse.json(
          { code: 404, message: 'Directory not found', data: null },
          { status: 404 }
        )
      }
      if (dir.is_default) {
        return HttpResponse.json(
          { code: 400, message: 'Default directory cannot be renamed', data: null },
          { status: 400 }
        )
      }

      dir.name = nextName
      return HttpResponse.json({ code: 0, message: 'ok', data: dir })
    }
  ),

  // 删除非默认空目录
  http.delete(
    `${API_BASE}/knowledge/:ownerType/:ownerId/directories/:directoryId`,
    async ({ params }) => {
      const directoryId = String(params.directoryId ?? '')
      const result = removeDirectoryById(mutableDirectories, directoryId)
      if (result === 'missing') {
        return HttpResponse.json(
          { code: 404, message: 'Directory not found', data: null },
          { status: 404 }
        )
      }
      if (result === 'blocked') {
        return HttpResponse.json(
          { code: 400, message: 'Directory cannot be deleted', data: null },
          { status: 400 }
        )
      }
      return HttpResponse.json({ code: 0, message: 'ok', data: 'deleted' })
    }
  ),

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
        indexing_task_id: `task_${id}`,
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

  // 批量移动文件到指定目录
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files/batch/move`, async ({ request }) => {
    const payload = (await request.json()) as {
      file_ids?: string[]
      target_dir_id?: string | null
    }
    const fileIds = Array.isArray(payload.file_ids) ? payload.file_ids : []
    if (fileIds.length === 0) {
      return HttpResponse.json(
        { code: 400, message: 'file_ids is required', data: null },
        { status: 400 }
      )
    }

    const targetDirId = payload.target_dir_id ?? null
    const targetDirName =
      targetDirId == null ? '未分类' : findDirectoryName(mutableDirectories, targetDirId)
    if (targetDirId != null && targetDirName == null) {
      return HttpResponse.json(
        { code: 404, message: 'Target directory not found', data: null },
        { status: 404 }
      )
    }

    let movedCount = 0
    for (const file of mutableFiles) {
      if (!fileIds.includes(file.id)) continue
      file.dir_id = targetDirId ?? ''
      file.dir_name = targetDirName ?? '未分类'
      file.updated_at = new Date().toISOString()
      movedCount++
    }
    if (movedCount === 0) {
      return HttpResponse.json(
        { code: 404, message: 'Files not found', data: null },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { moved_count: movedCount },
    })
  }),

  // 批量删除文件
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files/batch/delete`, async ({ request }) => {
    const payload = (await request.json()) as { file_ids?: string[] }
    const fileIds = Array.isArray(payload.file_ids) ? payload.file_ids : []
    if (fileIds.length === 0) {
      return HttpResponse.json(
        { code: 400, message: 'file_ids is required', data: null },
        { status: 400 }
      )
    }

    let deletedCount = 0
    for (const id of fileIds) {
      const index = mutableFiles.findIndex((file) => file.id === id)
      if (index >= 0) {
        mutableFiles.splice(index, 1)
        deletedCount++
      }
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { deleted_count: deletedCount, file_ids: fileIds },
    })
  }),

  // 删除全部文件
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files/delete-all`, async () => {
    const fileIds = mutableFiles.map((file) => file.id)
    mutableFiles.splice(0, mutableFiles.length)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { deleted_count: fileIds.length, file_ids: fileIds },
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
        indexing_task_id: file.indexing_task_id,
        progress: {
          current_step: file.status,
          steps: FILE_STATUS_STEPS,
          step_index: stepIndex,
        },
        error_msg: file.error_msg,
      },
    })
  }),

  // 重试失败的文件索引任务
  http.post(
    `${API_BASE}/knowledge/:ownerType/:ownerId/files/indexing-tasks/:taskId/retry`,
    async ({ params }) => {
      const taskId = String(params.taskId ?? '')
      const file = mutableFiles.find((item) => item.indexing_task_id === taskId)
      if (!file) {
        return HttpResponse.json(
          { code: 404, message: 'Task not found', data: null },
          { status: 404 }
        )
      }
      file.status = 'indexing'
      file.error_msg = null
      file.updated_at = new Date().toISOString()
      return HttpResponse.json({
        code: 0,
        message: 'ok',
        data: {
          task_id: taskId,
          file_id: file.id,
        },
      })
    }
  ),

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

  // 查询知识卡类型（4.1.15）
  http.get(`${API_BASE}/knowledge/card-types`, async () => {
    await delay(200)
    return HttpResponse.json({
      code: 200,
      message: '',
      data: [
        { name: '规则卡', code: 'rule' },
        { name: '量表卡', code: 'scale' },
        { name: '风险控制点卡', code: 'risk_point' },
        { name: '路径条款卡', code: 'pathway_clause' },
        { name: '乐谱元素卡', code: 'score_element' },
        { name: '疾病概览卡', code: 'disease_overview' },
        { name: '证据卡', code: 'evidence' },
        { name: '就诊卡', code: 'doctor_visit' },
        { name: '轨迹卡', code: 'doctor_trajectory' },
        { name: '经验卡', code: 'doctor_summary' },
      ],
    })
  }),

  // 查询文件分类选项
  http.get(`${API_BASE}/knowledge/files/categories`, async () => {
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: ['guidline', 'consensus', 'clinical_record'],
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
        (c) => c.title.toLowerCase().includes(kw) || c.md_content.toLowerCase().includes(kw)
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
      md_content: payload.md_content || '',
      json_content: '',
      type: payload.type,
      tags: payload.tags || [],
      online_status: 'creating',
      audit_status: 'pending',
      audit_reject_reason: '',
      reference_count: 0,
      source_files: Array.isArray(payload.source_file_ids)
        ? payload.source_file_ids.map((id: string) => ({ id, name: id }))
        : [],
      owner_type: ownerType as any,
      owner_id: ownerId,
      created_by: 'u_current_user',
      created_by_name: '当前用户',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 'v1.0.0',
    }
    mutableCards.unshift(newCard)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        task_id: `task_${newCard.id}`,
        card_id: newCard.id,
        audit_status: newCard.audit_status,
        message: '任务已提交，请通过 task_id 查询进度',
        online_status: newCard.online_status,
        title: newCard.title,
        type: newCard.type,
      },
    })
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
          online_status: 'updating',
          audit_status: 'pending',
          updated_at: new Date().toISOString(),
          version: `v${majorVersion + 1}.0.0`,
        })
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            task_id: `task_${card.id}`,
            card_id: card.id,
            audit_status: card.audit_status,
            message: '任务已提交，请通过 task_id 查询进度',
            online_status: card.online_status,
            title: card.title,
            type: card.type,
          },
        })
      }
      return HttpResponse.json({ code: 404, message: 'not found' })
    }
  ),

  // 知识卡上下线（PATCH + online_status）
  http.patch(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/status`,
    async ({ params, request }) => {
      const { cardId } = params
      const { online_status, note } = (await request.json()) as {
        online_status: 'online' | 'offline'
        note?: string
      }
      const card = mutableCards.find((c) => c.id === cardId)
      if (card) {
        card.online_status = online_status
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            ...card,
            status_action: { card_id: card.id, online_status, note: note || undefined },
          },
        })
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

  // 版本对比（4.1.13）
  http.get(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/versions/diff`,
    async ({ params, request }) => {
      const { cardId } = params
      const url = new URL(request.url)
      const fromVersion = Number(url.searchParams.get('from_version'))
      const toVersion = Number(url.searchParams.get('to_version'))
      const versions = mockCardVersions[cardId as string] || []
      const fromData = versions.find((v) => resolveKnowledgeCardVersionKey(v) === fromVersion)
      const toData = versions.find((v) => resolveKnowledgeCardVersionKey(v) === toVersion)
      const fromContent = fromData?.md_content ?? ''
      const toContent = toData?.md_content ?? ''
      const diff = []
      if (fromContent !== toContent) {
        if (fromContent)
          diff.push({
            type: 'delete',
            md_content: fromContent,
            highlight_version: toVersion,
            md_content_snapshot_version: fromVersion,
          })
        if (toContent)
          diff.push({
            type: 'insert',
            md_content: toContent,
            highlight_version: toVersion,
            md_content_snapshot_version: toVersion,
          })
      } else {
        diff.push({
          type: 'equal',
          md_content: fromContent,
          highlight_version: toVersion,
          md_content_snapshot_version: fromVersion,
        })
      }
      await delay(300)
      return HttpResponse.json({
        code: 0,
        message: 'ok',
        data: {
          from_version: fromVersion,
          to_version: toVersion,
          from_md_content: fromContent,
          to_md_content: toContent,
          diff,
        },
      })
    }
  ),

  // 删除知识卡（4.1.16）
  http.delete(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId`, async ({ params }) => {
    const { cardId } = params
    const index = mutableCards.findIndex((c) => c.id === cardId)
    if (index === -1) {
      return HttpResponse.json({ code: 40002, message: 'Card not found', data: null })
    }
    mutableCards.splice(index, 1)
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { card_id: cardId, action: 'deleted' },
    })
  }),

  // 批量删除知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/batch/delete`, async ({ request }) => {
    const payload = (await request.json()) as { card_ids?: string[] }
    const cardIds = Array.isArray(payload.card_ids) ? payload.card_ids : []
    if (cardIds.length === 0) {
      return HttpResponse.json(
        { code: 400, message: 'card_ids is required', data: null },
        { status: 400 }
      )
    }

    let deletedCount = 0
    for (const id of cardIds) {
      const index = mutableCards.findIndex((card) => card.id === id)
      if (index >= 0) {
        mutableCards.splice(index, 1)
        deletedCount++
      }
    }

    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { deleted_count: deletedCount, card_ids: cardIds },
    })
  }),

  // 删除全部知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/delete-all`, async () => {
    const cardIds = mutableCards.map((card) => card.id)
    mutableCards.splice(0, mutableCards.length)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { deleted_count: cardIds.length, card_ids: cardIds },
    })
  }),

  // 批量审核知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/batch/audit`, async ({ request }) => {
    const payload = (await request.json()) as {
      card_ids?: string[]
      audit_status?: 'approved' | 'rejected'
      audit_reject_reason?: string
    }
    const cardIds = Array.isArray(payload.card_ids) ? payload.card_ids : []
    if (cardIds.length === 0 || !payload.audit_status) {
      return HttpResponse.json(
        { code: 400, message: 'card_ids and audit_status are required', data: null },
        { status: 400 }
      )
    }

    let updatedCount = 0
    for (const card of mutableCards) {
      if (!cardIds.includes(card.id)) continue
      card.audit_status = payload.audit_status
      card.audit_reject_reason =
        payload.audit_status === 'rejected' ? (payload.audit_reject_reason ?? '') : null
      card.updated_at = new Date().toISOString()
      updatedCount++
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { updated_count: updatedCount, card_ids: cardIds },
    })
  }),

  // 全部审核通过
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/audit-approve-all`, async () => {
    const cardIds: string[] = []
    for (const card of mutableCards) {
      if (card.audit_status === 'approved') continue
      card.audit_status = 'approved'
      card.audit_reject_reason = null
      card.updated_at = new Date().toISOString()
      cardIds.push(card.id)
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { updated_count: cardIds.length, card_ids: cardIds },
    })
  }),

  // 批量上线知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/batch/online`, async ({ request }) => {
    const payload = (await request.json()) as { card_ids?: string[] }
    const cardIds = Array.isArray(payload.card_ids) ? payload.card_ids : []
    let updatedCount = 0
    for (const card of mutableCards) {
      if (!cardIds.includes(card.id)) continue
      card.online_status = 'online'
      card.updated_at = new Date().toISOString()
      updatedCount++
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { updated_count: updatedCount, card_ids: cardIds },
    })
  }),

  // 全部上线知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/online-all`, async () => {
    const cardIds: string[] = []
    for (const card of mutableCards) {
      if (card.audit_status !== 'approved' || card.online_status === 'online') continue
      card.online_status = 'online'
      card.updated_at = new Date().toISOString()
      cardIds.push(card.id)
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { updated_count: cardIds.length, card_ids: cardIds },
    })
  }),

  // 批量下线知识卡
  http.post(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/batch/offline`,
    async ({ request }) => {
      const payload = (await request.json()) as { card_ids?: string[] }
      const cardIds = Array.isArray(payload.card_ids) ? payload.card_ids : []
      let updatedCount = 0
      for (const card of mutableCards) {
        if (!cardIds.includes(card.id)) continue
        card.online_status = 'offline'
        card.updated_at = new Date().toISOString()
        updatedCount++
      }
      return HttpResponse.json({
        code: 0,
        message: 'ok',
        data: { updated_count: updatedCount, card_ids: cardIds },
      })
    }
  ),

  // 全部下线知识卡
  http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/offline-all`, async () => {
    const cardIds: string[] = []
    for (const card of mutableCards) {
      if (card.online_status !== 'online') continue
      card.online_status = 'offline'
      card.updated_at = new Date().toISOString()
      cardIds.push(card.id)
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { updated_count: cardIds.length, card_ids: cardIds },
    })
  }),

  // 批量增加引用次数
  http.post(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/batch/increment-reference-count`,
    async ({ request }) => {
      const payload = (await request.json()) as { card_ids?: string[] }
      const cardIds = Array.isArray(payload.card_ids) ? payload.card_ids : []
      let updatedCount = 0
      for (const card of mutableCards) {
        if (!cardIds.includes(card.id)) continue
        card.reference_count += 1
        updatedCount++
      }
      return HttpResponse.json({
        code: 0,
        message: 'ok',
        data: { updated_count: updatedCount },
      })
    }
  ),

  // 修改审核状态（API 4.1.17）
  http.patch(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/audit`,
    async ({ params, request }) => {
      const { cardId } = params
      const { audit_status, audit_reject_reason } = (await request.json()) as {
        audit_status: 'approved' | 'pending' | 'rejected'
        audit_reject_reason?: string
      }
      const card = mutableCards.find((c) => c.id === cardId)
      if (card) {
        card.audit_status = audit_status
        card.audit_reject_reason = audit_status === 'rejected' ? audit_reject_reason || '' : ''
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            ...card,
            review_action: { card_id: card.id, review_state: audit_status },
          },
        })
      }
      return HttpResponse.json({ code: 404, message: 'not found' })
    }
  ),

  // 版本回退（API 4.1.14）
  http.post(
    `${API_BASE}/knowledge/:ownerType/:ownerId/cards/:cardId/rollback`,
    async ({ params, request }) => {
      const { cardId } = params
      const { reason } = (await request.json()) as {
        reason?: string
      }
      const card = mutableCards.find((c) => c.id === cardId)
      const versions = mockCardVersions[cardId as string] || []
      const currentVersion = resolveKnowledgeCardVersionKey(card)
      const validVersionKeys = versions.flatMap((row) => {
        const key = resolveKnowledgeCardVersionKey(row)
        return key == null ? [] : [key]
      })
      const previousVersion = resolveKnowledgeCardPreviousVersionKey(
        currentVersion,
        validVersionKeys
      )
      const versionData = versions.find(
        (row) => resolveKnowledgeCardVersionKey(row) === previousVersion
      )

      if (card && versionData) {
        const nextVersion = (currentVersion ?? 0) + 1
        card.md_content = versionData.md_content ?? ''
        card.current_version = nextVersion
        card.version = `v${nextVersion}`
        card.updated_at = new Date().toISOString()
        versions.unshift({
          ...versionData,
          version: card.version,
          version_number: nextVersion,
          summary: reason ? `回滚：${reason}` : `回滚到 ${versionData.version}`,
          created_at: card.updated_at,
        })
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: card,
        })
      }
      return HttpResponse.json({ code: 400, message: '只能回退到上一版本' })
    }
  ),
]
