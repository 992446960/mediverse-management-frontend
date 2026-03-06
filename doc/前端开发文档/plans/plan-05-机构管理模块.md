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

- 本计划同时产出 `useTableData` 通用 Composable（Phase 2 四个 CRUD 模块共享）
- 表格列配置化驱动渲染
- 状态操作（启用/停用）需二次确认
- 删除操作需二次确认弹窗
- 仅 `sysadmin` 角色可访问

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现 Composable、API 层、页面组件、Mock |
| 参考 | Skill: `vue-best-practices` | Composition API 规范 |
| 参考 | Skill: `vue` | 组件通信、computed 等 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 05-1 | useTableData Composable | 泛型分页查询 Composable：data/loading/pagination/searchParams + loadData/handleTableChange/handleSearch/refresh | `src/composables/useTableData.ts` |
| 05-2 | 机构管理 API 层 | getOrganizations/createOrganization/updateOrganization/deleteOrganization/updateOrgStatus | `src/api/organizations.ts` |
| 05-3 | 机构列表页（index.vue） | 搜索栏 + OrgTable + 新增按钮 + OrgForm 弹窗状态管理 | `src/views/admin/Organizations/index.vue` |
| 05-4 | OrgTable 组件 | 配置化列定义（名称/编码/描述/状态Badge/创建时间/操作列）| `src/views/admin/Organizations/components/OrgTable.vue` |
| 05-5 | OrgForm 组件 | Modal 表单（名称必填/编码选填/描述选填/Logo 选填），支持新增和编辑两种模式 | `src/views/admin/Organizations/components/OrgForm.vue` |
| 05-6 | 状态 Badge 工具 | 通用状态颜色映射函数 `getStatusColor` + 状态文案函数 | `src/utils/status.ts` |
| 05-7 | 删除确认工具 | 通用二次确认弹窗函数 `confirmDelete` | `src/utils/confirm.ts` |
| 05-8 | 机构 Mock Handler | 模拟机构 CRUD 接口，含分页、搜索过滤、状态变更 | `src/mocks/handlers/organizations.ts` |
| 05-9 | 机构 Mock 数据 | 生成 20+ 条机构测试数据（医院名称、编码、不同状态） | `src/mocks/data/organizations.ts` |

### 3.2 useTableData Composable 接口

```typescript
function useTableData<T, P extends PaginationParams>(options: {
  fetchFn: (params: P) => Promise<PaginatedData<T>>
  defaultParams?: Partial<P>
  immediate?: boolean  // 默认 true，mounted 自动加载
}): {
  data: Ref<T[]>
  loading: Ref<boolean>
  pagination: { current: number; pageSize: number; total: number }
  searchParams: Ref<Partial<P>>
  loadData: () => Promise<void>
  handleTableChange: (pag: { current: number; pageSize: number }) => void
  handleSearch: (params?: Partial<P>) => void
  refresh: () => void
}
```

### 3.3 表格列配置

```typescript
const columns = computed(() => [
  { title: t('org.name'), dataIndex: 'name', key: 'name' },
  { title: t('org.code'), dataIndex: 'code', key: 'code' },
  { title: t('org.description'), dataIndex: 'description', key: 'description', ellipsis: true },
  { title: t('org.status'), dataIndex: 'status', key: 'status' },  // customRender: renderStatusBadge
  { title: t('common.createdAt'), dataIndex: 'created_at', key: 'created_at' },  // customRender: renderDate
  { title: t('common.actions'), key: 'actions', fixed: 'right', width: 200 },
])
```

---

## 四、验收效果

- [ ] `useTableData` Composable 类型推导正确，支持泛型参数
- [ ] 机构列表页正常展示，支持分页切换
- [ ] 搜索关键词过滤功能正常
- [ ] 新增机构弹窗表单校验完整（名称必填）
- [ ] 编辑机构弹窗回显当前数据
- [ ] 状态启停操作有二次确认，操作成功后列表自动刷新
- [ ] 删除操作有二次确认弹窗，删除成功后列表刷新
- [ ] 状态 Badge 颜色正确（active-绿色 / inactive-灰色）
- [ ] 表格列使用配置数组驱动渲染（非模板硬编码）
- [ ] 非 sysadmin 角色无法访问此页面
- [ ] MSW Mock 数据返回格式与 API 设计文档一致
