import { http, HttpResponse, delay } from 'msw'
import type { AvatarConfig } from '@/types/avatarConfig'

/** 与 `mocks/data/avatars` 中条目 id 一致，便于 PUT /avatars/:id 联调 */
const mockAvatarConfig: AvatarConfig = {
  id: 'avatar_expert_001',
  owner_type: 'personal',
  owner_id: 'u_doctor_001',
  name: '张医生专家分身',
  avatar_url: 'https://picsum.photos/200/200?random=avatar_expert_001',
  bio: '从事内科临床工作 20 年，擅长高血压、糖尿病等慢性病管理。',
  greeting: '您好，我是张医生，请问有什么可以帮助您？',
  style: 'formal',
  style_custom: null,
  tags: ['内科', '高血压', '糖尿病', '慢性病'],
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
  /** 获取分身配置（含 personal/{user_id}） */
  http.get('/api/v1/my/avatar/:owner_type/:owner_id', async ({ params }) => {
    const owner_type = String(params.owner_type ?? '')
    const owner_id = String(params.owner_id ?? '')
    await delay(300)
    const name =
      owner_type === 'dept'
        ? '科室数字医生'
        : owner_type === 'org'
          ? '机构数字医生'
          : mockAvatarConfig.name
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        ...mockAvatarConfig,
        owner_type,
        owner_id,
        name,
      },
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
