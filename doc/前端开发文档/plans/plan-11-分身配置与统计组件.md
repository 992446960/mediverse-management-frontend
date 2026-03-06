# Plan 11: 分身配置与统计组件

> 来源阶段：Phase 3（任务 3.10、3.11、3.12）  
> 前置依赖：Plan 09（文件管理通用组件集，复用 useWorkspaceContext）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Ecosys 域 → 分身配置更新、统计数据接口 |
| 产品规划 | `doc/初始文档/产品规划.md` | 分身配置项（头像/名称/简介/开场白/风格/标签） |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 分身配置页面布局、统计卡片、工作台顶部选择器 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.10~3.12、四.1 复用分析矩阵 |

### 关键设计要点

- AvatarConfig：通用分身配置表单组件，个人/科室/机构三处复用
- AvatarStats：统计卡片组件（累计接诊/今日接诊/Token 消耗等）
- WorkspaceScopeSelector：科室/机构工作台顶部的范围选择器（机构→科室联动）
- 三个组件均通过 Props 参数化，不耦合特定业务场景

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现配置组件、统计组件、范围选择器 |
| 参考 | Skill: `vue-best-practices` | 组件解耦 |
| 参考 | Skill: `vue` | v-model、defineModel |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 11-1 | 分身配置 API | 获取分身配置 / 更新分身配置（按 ownerType+ownerId 或个人接口） | `src/api/avatarConfig.ts` |
| 11-2 | 分身统计 API | 获取分身统计数据（接诊数、Token 消耗、知识引用、学习进度） | `src/api/avatarStats.ts` |
| 11-3 | AvatarConfig 组件 | 表单组件：头像上传预览、名称/简介/开场白输入、沟通风格选择（预设+自定义）、标签管理 | `src/components/AvatarConfig/index.vue` |
| 11-4 | AvatarStats 组件 | 统计卡片组件：四格卡片（累计接诊/今日接诊/Token 消耗/知识引用）+ 学习进度条 | `src/components/AvatarStats/index.vue` |
| 11-5 | WorkspaceScopeSelector 组件 | 范围选择器：机构切换（所有角色根据权限可见范围），科室工作台增加科室联动下拉 | `src/components/WorkspaceScopeSelector/index.vue` |
| 11-6 | Mock 补充 | 分身配置/统计相关 Mock handler 和数据 | `src/mocks/handlers/avatarConfig.ts` |

### 3.2 AvatarConfig Props 设计

```typescript
interface AvatarConfigProps {
  avatarId: string
  ownerType: OwnerType
  apiEndpoint?: string  // 个人分身使用 /api/v1/my/avatar，其他使用标准路径
  readonly?: boolean    // 只读模式（无权限时）
}

interface AvatarConfigEmits {
  (e: 'saved'): void
}
```

### 3.3 AvatarStats 数据模型

```typescript
interface AvatarStatsData {
  totalSessions: number
  todaySessions: number
  totalTokensUsed: number
  totalReferences: number
  learningProgress: {
    totalFiles: number
    processedFiles: number
    percentage: number
  }
}
```

### 3.4 WorkspaceScopeSelector 模式

```
机构工作台 (level='org')：
  [机构选择器 ▼]

科室工作台 (level='dept')：
  [机构选择器 ▼] → [科室选择器 ▼]（联动）
```

---

## 四、验收效果

- [ ] AvatarConfig 表单渲染完整，所有字段有校验
- [ ] 沟通风格选择"自定义"时显示自由输入框
- [ ] 标签管理支持添加/移除标签
- [ ] 保存配置成功后有 Toast 提示
- [ ] AvatarStats 四格统计卡片数据正确展示
- [ ] 学习进度条展示文件处理完成百分比
- [ ] WorkspaceScopeSelector 机构下拉正确展示可访问机构
- [ ] 科室工作台的联动选择器：切换机构后科室列表刷新
- [ ] 切换范围后触发内容区数据刷新
- [ ] 所有组件通过 Props 参数化，不硬编码 ownerType
