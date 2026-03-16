import { http, HttpResponse, delay } from 'msw'
import type { AvatarConfig, AvatarStatsData } from '@/types/avatarConfig'

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

const mockStats: AvatarStatsData = {
  totalSessions: 12840,
  todaySessions: 458,
  todayTokensUsed: 2500,
  totalTokensUsed: 84200,
  totalReferences: 941,
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

  // 获取分身统计数据
  http.get('/api/v1/my/avatar/stats/:owner_type/:owner_id', async () => {
    await delay(300)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: mockStats,
    })
  }),
]
