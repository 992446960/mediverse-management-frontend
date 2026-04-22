import type { DirectoryNode, FileListItem, FileStatus } from '@/types/knowledge'

/** 模拟目录树数据 */
export const mockDirectories: DirectoryNode[] = [
  {
    id: 'dir_001',
    name: '指南',
    is_default: true,
    sort_order: 1,
    file_count: 12,
    children: [
      {
        id: 'dir_001_001',
        name: '高血压指南',
        is_default: false,
        sort_order: 1,
        file_count: 3,
        children: [],
      },
      {
        id: 'dir_001_002',
        name: '糖尿病指南',
        is_default: false,
        sort_order: 2,
        file_count: 5,
        children: [],
      },
    ],
  },
  {
    id: 'dir_002',
    name: '共识',
    is_default: true,
    sort_order: 2,
    file_count: 8,
    children: [],
  },
  {
    id: 'dir_003',
    name: '文献',
    is_default: true,
    sort_order: 3,
    file_count: 25,
    children: [],
  },
  {
    id: 'dir_004',
    name: '病例',
    is_default: true,
    sort_order: 4,
    file_count: 42,
    children: [],
  },
  {
    id: 'dir_005',
    name: '规则',
    is_default: true,
    sort_order: 5,
    file_count: 15,
    children: [],
  },
  {
    id: 'dir_006',
    name: '其他',
    is_default: true,
    sort_order: 6,
    file_count: 4,
    children: [],
  },
]

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 模拟解析后文档（PDF 解析视图用） */
export const MOCK_PARSED_MD = `# 中国高血压防治指南 2023 解析摘要

## 一、高血压定义与分类

根据《中国高血压防治指南（2023年）》，高血压定义为：在未使用降压药物的情况下，非同日3次测量诊室血压，收缩压≥140mmHg和（或）舒张压≥90mmHg。

### 血压分类

| 分类 | 收缩压(mmHg) | 舒张压(mmHg) |
|------|-------------|-------------|
| 正常 | <120 | 和 <80 |
| 正常高值 | 120-139 | 和（或）80-89 |
| 高血压 | ≥140 | 和（或）≥90 |

## 二、诊断要点

1. 确诊需多次测量
2. 建议进行动态血压监测
3. 排除继发性高血压
`

/** 模拟文件列表数据 */
export const mockFiles: FileListItem[] = [
  {
    id: 'file_001',
    file_name: '中国高血压防治指南2023.pdf',
    file_type: 'pdf',
    file_size: 2411520,
    dir_id: 'dir_001_001',
    dir_name: '高血压指南',
    status: 'done',
    file_url: `${API_BASE}/mock/files/file_001/original`,
    parsed_file_url: `${API_BASE}/mock/files/file_001/parsed`,
    error_msg: null,
    auto_category_suggestion: 'dir_001',
    auto_category_name: '指南',
    knowledge_card_count: 12,
    created_by: 'u_doctor_001',
    created_by_name: '北京协和医院',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:05:00Z',
  },
  {
    id: 'file_002',
    file_name: '糖尿病足诊疗专家共识.docx',
    file_type: 'docx',
    file_size: 1548200,
    dir_id: 'dir_001_002',
    dir_name: '糖尿病指南',
    status: 'parsing',
    file_url: `${API_BASE}/mock/files/file_002/original`,
    parsed_file_url: null,
    error_msg: null,
    auto_category_suggestion: 'dir_001',
    auto_category_name: '指南',
    knowledge_card_count: 0,
    created_by: 'u_doctor_001',
    created_by_name: '北京协和医院',
    created_at: '2026-03-09T09:00:00Z',
    updated_at: '2026-03-09T09:00:00Z',
  },
  {
    id: 'file_003',
    file_name: '心血管疾病风险评估表.xlsx',
    file_type: 'xlsx',
    file_size: 45600,
    dir_id: '',
    dir_name: '未分类',
    status: 'failed',
    file_url: `${API_BASE}/mock/files/file_003/original`,
    parsed_file_url: null,
    error_msg: '文件格式解析异常：未找到有效的表格数据',
    auto_category_suggestion: null,
    auto_category_name: null,
    knowledge_card_count: 0,
    created_by: 'u_doctor_001',
    created_by_name: '北京协和医院',
    created_at: '2026-03-08T15:30:00Z',
    updated_at: '2026-03-08T15:31:00Z',
  },
  {
    id: 'file_004',
    file_name: '罕见病诊疗指南.pdf',
    file_type: 'pdf',
    file_size: 5600000,
    dir_id: 'dir_006',
    dir_name: '其他',
    status: 'extracting',
    file_url: `${API_BASE}/mock/files/file_004/original`,
    parsed_file_url: null,
    error_msg: null,
    auto_category_suggestion: 'dir_006',
    auto_category_name: '其他',
    knowledge_card_count: 0,
    created_by: 'u_doctor_001',
    created_by_name: '北京协和医院',
    created_at: '2026-03-09T09:10:00Z',
    updated_at: '2026-03-09T09:10:00Z',
  },
  {
    id: 'file_005',
    file_name: '临床路径管理规定.txt',
    file_type: 'txt',
    file_size: 12400,
    dir_id: 'dir_005',
    dir_name: '规则',
    status: 'indexing',
    file_url: `${API_BASE}/mock/files/file_005/original`,
    parsed_file_url: null,
    error_msg: null,
    auto_category_suggestion: 'dir_005',
    auto_category_name: '规则',
    knowledge_card_count: 0,
    created_by: 'u_doctor_001',
    created_by_name: '北京协和医院',
    created_at: '2026-03-09T09:15:00Z',
    updated_at: '2026-03-09T09:15:00Z',
  },
]

export const FILE_STATUS_STEPS: FileStatus[] = [
  'uploading',
  'parsing',
  'extracting',
  'indexing',
  'done',
]
