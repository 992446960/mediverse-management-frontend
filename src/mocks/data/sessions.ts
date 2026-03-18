import type { Session, Message } from '@/types/chat'

export const mockSessions: Session[] = [
  {
    id: 'session_1',
    title: '关于高血压的诊断标准',
    avatar_id: 'avatar_1',
    avatar_name: '张医生分身',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=doctor1',
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'session_2',
    title: '糖尿病饮食建议',
    avatar_id: 'avatar_1',
    avatar_name: '张医生分身',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=doctor1',
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'session_3',
    title: '心脏病预防措施',
    avatar_id: 'avatar_2',
    avatar_name: '李专家分身',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=doctor2',
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
]

export const mockMessages: Record<string, Message[]> = {
  session_1: [
    {
      id: 'msg_1_1',
      session_id: 'session_1',
      role: 'user',
      parts: [{ type: 'text', text: '高血压的诊断标准是什么？' }],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_1_2',
      session_id: 'session_1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: '根据《中国高血压防治指南（2018年修订版）》，高血压的诊断标准如下：\n\n1. **诊室血压**：\n   - 收缩压 ≥ 140 mmHg 和/或 舒张压 ≥ 90 mmHg。\n\n2. **家庭自测血压**：\n   - 收缩压 ≥ 135 mmHg 和/或 舒张压 ≥ 85 mmHg。\n\n3. **动态血压监测**：\n   - 24小时平均血压 ≥ 130/80 mmHg；\n   - 白天 ≥ 135/85 mmHg；\n   - 夜间 ≥ 120/70 mmHg。\n\n建议在不同日测量三次血压，以确诊。',
        },
      ],
      thinking_process: [
        {
          title: '检索指南',
          description: '找到《中国高血压防治指南》相关内容',
          status: 'done',
          duration: '1200ms',
        },
        {
          title: '提取标准',
          description: '提取诊室血压、家庭自测血压和动态血压监测的标准',
          status: 'done',
          duration: '800ms',
        },
      ],
      tool_calls: [
        {
          skill_name: '知识库检索',
          skill_description: '检索相关医学知识库文档',
          args: { query: '高血压诊断标准', top_k: 5 },
          result: {
            found: 3,
            titles: ['中国高血压防治指南2018', '高血压诊断流程', '血压测量规范'],
          },
          duration_ms: 320,
        },
      ],
      citations: ['card_hypertension_1', 'card_hypertension_2'],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000).toISOString(),
      status: 'sent',
    },
  ],
  session_2: [
    {
      id: 'msg_2_1',
      session_id: 'session_2',
      role: 'user',
      parts: [{ type: 'text', text: '糖尿病患者应该怎么吃？' }],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'sent',
    },
    {
      id: 'msg_2_2',
      session_id: 'session_2',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: '糖尿病患者的饮食建议如下：\n\n1. **控制总热量**：根据身高、体重和活动量计算每日所需热量。\n2. **均衡营养**：碳水化合物占50-60%，蛋白质占15-20%，脂肪占20-30%。\n3. **少食多餐**：建议每日3餐正餐 + 2-3次加餐。\n4. **低GI食物**：优先选择全谷物、蔬菜等低升糖指数食物。',
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000).toISOString(),
      status: 'sent',
    },
  ],
}
