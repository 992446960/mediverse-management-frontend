import type { AvatarSkill } from '@/api/sessions'

export const mockAvatarSkills: AvatarSkill[] = [
  {
    id: 'skill_1',
    name: '知识库检索',
    description: '检索相关医学知识库文档，支持语义搜索',
    icon: 'search',
  },
  {
    id: 'skill_2',
    name: '高血压风险评估',
    description: '根据患者指标评估高血压风险等级',
    icon: 'heart',
  },
  {
    id: 'skill_3',
    name: '用药建议',
    description: '根据病情和既往用药史推荐用药方案',
    icon: 'medicine-box',
  },
  {
    id: 'skill_4',
    name: '症状分析',
    description: '分析患者描述的症状并给出初步判断',
    icon: 'experiment',
  },
  {
    id: 'skill_5',
    name: '检验报告解读',
    description: '解读血常规、生化等检验报告指标',
    icon: 'file-text',
  },
]
