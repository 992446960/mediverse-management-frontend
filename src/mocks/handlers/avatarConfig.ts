import { http, HttpResponse, delay } from 'msw'
import type { AvatarConfig } from '@/types/avatarConfig'

const mockAvatarConfig: AvatarConfig = {
  id: 'avatar-1',
  owner_type: 'personal',
  owner_id: 'user-1',
  name: '我的数字分身',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  bio: '这是一个专业的医疗助手分身，擅长处理各种临床咨询。',
  greeting: '你好！我是您的数字临床助理，有什么可以帮您的？',
  style: 'formal',
  style_custom: null,
  tags: ['临床', '助手', '专业'],
}

/** 与线上接口一致：snake_case + Token 为后端已格式化字符串 */
const mockStats = {
  total_sessions: 39,
  today_sessions: 12,
  today_token: '282.5k',
  all_token: '18.8million',
  knowledge_progress: {
    indexed_files: 0,
    total_files: 0,
    percentage: 0,
  },
}

export const avatarConfigHandlers = [
  // 获取个人分身配置
  http.get('/api/v1/my/avatar', async () => {
    await delay(300)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: mockAvatarConfig,
    })
  }),

  // 获取科室/机构分身配置
  http.get('/api/v1/my/avatar/:owner_type/:owner_id', async ({ params }) => {
    const { owner_type, owner_id } = params
    await delay(300)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        ...mockAvatarConfig,
        owner_type,
        owner_id,
        name: owner_type === 'dept' ? '科室数字医生' : '机构数字医生',
      },
    })
  }),

  // 更新分身配置
  http.put('/api/v1/my/avatar', async ({ request }) => {
    const data = (await request.json()) as Partial<AvatarConfig>
    await delay(500)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...mockAvatarConfig, ...data },
    })
  }),

  http.put('/api/v1/my/avatar/:owner_type/:owner_id', async ({ request }) => {
    const data = (await request.json()) as Partial<AvatarConfig>
    await delay(500)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...mockAvatarConfig, ...data },
    })
  }),

  // 获取分身统计数据（按 owner_type 区分，便于仪表盘多路聚合联调）
  http.get('/api/v1/my/avatar/stats/:owner_type/:owner_id', async ({ params }) => {
    await delay(300)
    const ownerType = String(params.owner_type ?? '')
    const data =
      ownerType === 'dept'
        ? {
            ...mockStats,
            total_sessions: 20,
            today_sessions: 5,
            today_token: '120k',
            all_token: '5.2M',
            knowledge_progress: { indexed_files: 8, total_files: 20, percentage: 40 },
          }
        : ownerType === 'org'
          ? {
              ...mockStats,
              total_sessions: 100,
              today_sessions: 18,
              today_token: '50k',
              all_token: '12M',
              knowledge_progress: { indexed_files: 15, total_files: 30, percentage: 50 },
            }
          : mockStats
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data,
    })
  }),
]
