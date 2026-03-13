# Plan 08: 分身管理模块（含向导式创建）

> 来源阶段：Phase 2（任务 2.9、2.10）  
> 前置依赖：Plan 05（复用 useTableData）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Ecosys 域 → 分身 CRUD + 状态变更 |
| 产品规划 | `doc/初始文档/产品规划.md` | 三类分身定义（全科/专科/专家）、绑定逻辑 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 分身列表页、向导式创建弹窗（四步骤） |
| 技术设计 | `doc/初始文档/技术设计.md` | 2.2.1 分身表结构 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 四.5 分身管理（向导式创建） |

### 关键设计要点

- 分身创建使用 Ant Design Steps 向导式四步骤
- 绑定范围根据分身类型动态切换：general→机构，specialist→科室，expert→用户
- 沟通风格支持预设选项 + 自定义输入
- 列表支持按类型/机构/科室筛选

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现分身列表、向导式创建、API 层、Mock |
| 参考 | `ux-designer` | 向导交互细节审查（可选） |
| 参考 | Skill: `vue-best-practices` | 组件规范 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 08-1 | 分身管理 API 层 | getAvatars/createAvatar/updateAvatar/deleteAvatar | `src/api/avatars.ts` |
| 08-2 | 分身列表页 | 集成 PageHead + PageFilter + PageTable + AvatarWizard + AvatarEditModal + KnowledgeCardList Drawer | `src/views/admin/Avatars/index.vue` |
| 08-3 | Page 组件配置 | 配置化列（名称/类型Tag/绑定范围/状态Badge/创建时间/操作）；操作列含“知识库”入口 | `src/views/admin/Avatars/index.vue` |
| 08-4 | AvatarWizard 组件 | 四步向导：选类型 → 绑定范围 → 基础信息 → 确认预览 | `src/views/admin/Avatars/components/AvatarWizard.vue` |
| 08-5 | 向导步骤子组件 | 每个步骤的表单内容组件 | `src/views/admin/Avatars/components/steps/*.vue` |
| 08-6 | KnowledgeCardList | 在分身列表页集成知识卡管理抽屉，直接管理分身关联知识卡 | `src/components/KnowledgeCardList/index.vue` |
| 08-7 | 分身 Mock Handler | 模拟分身 CRUD + 按类型/org_id/dept_id 筛选 | `src/mocks/handlers/avatars.ts` |
| 08-8 | 分身 Mock 数据 | 三种类型的分身数据 | `src/mocks/data/avatars.ts` |

### 3.2 向导式创建步骤

```
Step 1: 选择类型
  ├── 全科数字医生 (general)  → "面向整个机构的通用型数字医生"
  ├── 专科数字医生 (specialist) → "面向特定科室的专科型数字医生"
  └── 专家分身 (expert)       → "面向个人的专家型数字分身"

Step 2: 绑定范围
  ├── general    → 选择机构（必填）
  ├── specialist → 选择机构 + 选择科室（科室必填）
  └── expert     → 选择机构 + 选择科室 + 选择用户（用户必填）

Step 3: 基础信息
  ├── 名称（必填）
  ├── 头像 URL（选填）
  ├── 简介（选填）
  ├── 标签（可添加/移除）
  ├── 开场白（选填）
  └── 沟通风格（预设 RadioGroup + 自定义 Input）
      ├── formal（正式专业）
      ├── friendly（友善亲切）
      ├── concise（简洁高效）
      ├── detailed（详细全面）
      └── custom（自定义输入）

Step 4: 确认预览
  └── 汇总展示前三步信息 → 确认创建
```

### 3.3 分身类型 Tag 颜色

| 类型 | Tag 颜色 | 标签文案 |
|------|---------|---------|
| general | blue | 全科 |
| specialist | green | 专科 |
| expert | purple | 专家 |

---

## 四、验收效果

- [ ] 分身列表正常展示，支持按类型/机构/科室筛选
- [ ] 向导式创建四步骤流程完整，每步表单校验正确
- [ ] Step 2 绑定范围根据类型动态切换（联动选择器）
- [ ] 沟通风格选择"自定义"时显示文本输入框
- [ ] Step 4 确认预览汇总展示所有信息
- [ ] 创建成功后返回列表并自动刷新
- [ ] 列表支持分页切换
- [ ] 分身类型列使用不同颜色 Tag 渲染
- [ ] 复用 `useTableData`、`getStatusColor`、`confirmDelete`
