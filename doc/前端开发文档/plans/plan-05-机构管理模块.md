# Plan 05: 机构管理模块

> 来源阶段：Phase 2（任务 2.1、2.2、2.3）  
> 前置依赖：Plan 04（主布局与权限体系）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Management 域 → 机构管理 CRUD 接口 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 机构管理列表页、新增/编辑弹窗、状态操作 |
| 技术设计 | `doc/初始文档/技术设计.md` | 2.1.1 机构表结构 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 2 任务 2.1~2.3 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 四.1 通用 CRUD Composable、四.2 机构管理 |

### 关键设计要点

- 本计划采用 **PageHead + PageFilter + PageTable** 通用 CRUD 组件体系（Phase 2 标准架构）
- 表格列配置化驱动渲染，支持复杂单元格类型（Scope, Operation）
- 状态操作（启用/停用）需二次确认
- 删除操作需二次确认弹窗
- 仅 `sysadmin` 角色可访问

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现 Page 页面组件、配置对象、API 层、Mock |
| 参考 | Skill: `vue-best-practices` | Composition API 规范 |
| 参考 | Skill: `vue` | 组件通信、computed 等 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 05-1 | 机构管理 API 层 | getOrganizations/createOrganization/updateOrganization/deleteOrganization | `src/api/organizations.ts` |
| 05-2 | 机构列表页（index.vue） | 集成 PageHead（标题+按钮）、PageFilter（搜索表单）、PageTable（数据展示） | `src/views/admin/Organizations/index.vue` |
| 05-3 | Page 组件配置 | 定义 headConf, filterConf, tableConf, tableColumns | `src/views/admin/Organizations/index.vue` |
| 05-4 | OrgForm 组件 | Modal 表单（名称必填/编码选填/描述选填/Logo 选填），支持新增和编辑两种模式 | `src/views/admin/Organizations/components/OrgForm.vue` |
| 05-5 | 状态与删除工具 | 复用 `confirmDelete` 工具函数处理二次确认 | `src/utils/confirm.ts` |
| 05-6 | 机构 Mock Handler | 模拟机构 CRUD 接口，含分页、搜索过滤、状态变更 | `src/mocks/handlers/organizations.ts` |
| 05-7 | 机构 Mock 数据 | 生成 20+ 条机构测试数据（医院名称、编码、不同状态） | `src/mocks/data/organizations.ts` |

### 3.2 PageTable 组件配置示例

```typescript
const tableColumns = computed<PageTableColumnConfig[]>(() => [
  { label: t('org.name'), prop: 'name', width: 160, showOverflowTooltip: true },
  { label: t('org.code'), prop: 'code', width: 120 },
  { label: t('org.description'), prop: 'description', width: 200, showOverflowTooltip: true },
  {
    label: t('org.status'),
    prop: 'status',
    type: 'scope',
    scopeType: '_tag',
    width: 100,
    tagType: (row) => (row.status === 'active' ? 'success' : 'error'),
    tagText: (row) => (row.status === 'active' ? t('status.active') : t('status.inactive')),
  },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    width: 160,
    formatter: (row) => dayjs(row.created_at as string).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 260,
    fixed: 'right',
    btns: [
      { text: t('common.edit'), icon: EditOutlined, handle: openEditForm },
      {
        text: t('status.inactive'),
        dynamicText: (row) => (row.status === 'active' ? t('status.inactive') : t('status.active')),
        handle: handleToggleStatus
      },
      { text: t('common.delete'), icon: DeleteOutlined, color: 'danger', handle: handleDelete },
    ],
  },
])
```

---

## 四、验收效果

- [ ] `PageTable` 组件体系配置正确
- [ ] 机构列表页正常展示，支持分页切换
- [ ] `PageFilter` 搜索关键词过滤功能正常
- [ ] 新增机构弹窗表单校验完整（名称必填）
- [ ] 编辑机构弹窗回显当前数据
- [ ] 状态启停操作有二次确认，操作成功后列表自动刷新
- [ ] 删除操作有二次确认弹窗，删除成功后列表刷新
- [ ] 表格列使用 `PageTableColumnConfig` 配置驱动渲染
- [ ] 非 sysadmin 角色无法访问此页面
- [ ] MSW Mock 数据返回格式与 API 设计文档一致
