import type { KnowledgeCard, KnowledgeCardVersion } from '@/types/knowledge'

export const mockKnowledgeCards: KnowledgeCard[] = [
  {
    id: 'card_001',
    title: '高血压诊断标准',
    type: 'evidence',
    content:
      '### 高血压诊断标准\n\n根据《中国高血压防治指南（2018年修订版）》，在未用抗高血压药的情况下，非同日3次测量血压，收缩压≥140mmHg和/或舒张压≥90mmHg即可诊断为高血压。\n\n#### 血压水平分类：\n- **正常血压**：收缩压 <120 且 舒张压 <80\n- **正常高值**：收缩压 120-139 或 舒张压 80-89\n- **1级高血压**：收缩压 140-159 或 舒张压 90-99\n- **2级高血压**：收缩压 160-179 或 舒张压 100-109\n- **3级高血压**：收缩压 ≥180 或 舒张压 ≥110',
    tags: ['高血压', '诊断', '指南'],
    online_status: 'online',
    audit_status: 'approved',
    current_version: 3,
    reference_count: 12,
    sources: [{ id: 'file_001', file_name: '中国高血压防治指南2018.pdf', page_hint: '第 12-15 页' }],
    created_by: 'u_admin_001',
    created_by_name: '系统管理员',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-03-01T10:30:00Z',
  },
  {
    id: 'card_002',
    title: '降压药物选用原则',
    type: 'rule',
    content:
      '### 降压药物选用原则\n\n1. **小剂量开始**：初始治疗通常应采用较小有效剂量，根据需要逐步增加剂量。\n2. **优先选择长效制剂**：尽可能使用一天一次给药而有持续24小时降压作用的长效药物。\n3. **联合用药**：2级高血压及以上或高危患者，初始即可采用两种药物联合治疗。\n4. **个体化治疗**：根据患者具体情况、药物有效性及耐受性选择药物。',
    tags: ['用药', '指南', '治疗'],
    online_status: 'online',
    audit_status: 'approved',
    current_version: 2,
    reference_count: 8,
    sources: [{ id: 'file_001', file_name: '中国高血压防治指南2018.pdf', page_hint: '整篇' }],
    created_by: 'u_doctor_001',
    created_by_name: '张医生',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-02-20T14:20:00Z',
  },
  {
    id: 'card_003',
    title: '顽固性高血压处理经验',
    type: 'experience',
    content:
      '### 顽固性高血压处理经验\n\n在临床实践中，遇到顽固性高血压（使用三种及以上降压药仍未达标）时，应首先排除以下因素：\n\n- **伪难治性高血压**：如白大衣高血压、测量不准。\n- **生活方式未改善**：高盐饮食、肥胖、大量饮酒。\n- **药物干扰**：如非甾体抗炎药、甘草等。\n\n**经验建议**：尝试加入螺内酯（25mg/d）往往能取得意想不到的效果。',
    tags: ['临床经验', '顽固性高血压'],
    online_status: 'offline',
    audit_status: 'pending',
    current_version: 1,
    reference_count: 3,
    sources: [{ id: 'file_002', file_name: '临床高血压处理笔记.docx', page_hint: '整篇' }],
    created_by: 'u_doctor_002',
    created_by_name: '李医生',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
]

export const mockCardVersions: Record<string, KnowledgeCardVersion[]> = {
  card_001: [
    {
      id: 'ver_001_3',
      version_number: 3,
      change_summary: '更新了血压分类标准，对齐2018年修订版指南',
      operated_by: 'u_admin_001',
      operated_by_name: '系统管理员',
      created_at: '2024-03-01T10:30:00Z',
    },
    {
      id: 'ver_001_2',
      version_number: 2,
      change_summary: '修正了部分排版错误',
      operated_by: 'u_admin_001',
      operated_by_name: '系统管理员',
      created_at: '2024-02-10T15:00:00Z',
    },
    {
      id: 'ver_001_1',
      version_number: 1,
      change_summary: '初始版本',
      operated_by: 'u_admin_001',
      operated_by_name: '系统管理员',
      created_at: '2024-01-10T08:00:00Z',
    },
  ],
}
