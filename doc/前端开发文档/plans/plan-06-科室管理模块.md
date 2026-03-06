# Plan 06: 科室管理模块（含 OrgDeptTree）

> 来源阶段：Phase 2（任务 2.4、2.5、2.6）  
> 前置依赖：Plan 05（机构管理模块，复用 useTableData）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Management 域 → 科室 CRUD 接口 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 科室管理页（左右分栏：目录树+列表） |
| 技术设计 | `doc/初始文档/技术设计.md` | 2.1.2 科室表结构 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 2 任务 2.4~2.6 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 四.3 科室管理 |

### 关键设计要点

- 本计划包含 `OrgDeptTree` 通用组件，科室管理和用户管理共用
- 左右分栏布局：左侧机构树 → 右侧科室列表
- 系统管理员可见所有机构，机构管理员只显示本机构
- 新增科室时自动关联当前选中的机构
- OrgDeptTree 通过 Props 控制是否显示科室层级

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现 OrgDeptTree 组件、科室页面、API 层、Mock |
| 参考 | Skill: `vue-best-practices` | 组件设计、Props/Events 规范 |
| 参考 | Skill: `vue` | provide/inject、computed |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 06-1 | 科室管理 API 层 | getDepartments/createDepartment/updateDepartment/deleteDepartment/updateDeptStatus + getOrgListForTree | `src/api/departments.ts` |
| 06-2 | OrgDeptTree 组件 | 左侧面板目录树组件：展示机构列表（sysadmin 展示全部，org_admin 只展示本机构），支持 Props 控制是否展示科室子节点 | `src/components/OrgDeptTree/index.vue` |
| 06-3 | 科室列表页 | 左侧 OrgDeptTree + 右侧科室表格 + 新增/编辑弹窗 | `src/views/admin/Departments/index.vue` |
| 06-4 | DeptTable 组件 | 配置化列定义（名称/科室编码/所属机构/状态Badge/操作） | `src/views/admin/Departments/components/DeptTable.vue` |
| 06-5 | DeptForm 组件 | Modal 表单：名称必填、所属机构（新增时自动填充当前选中机构）、描述 | `src/views/admin/Departments/components/DeptForm.vue` |
| 06-6 | 科室 Mock Handler | 模拟科室 CRUD，按 org_id 过滤 | `src/mocks/handlers/departments.ts` |
| 06-7 | 科室 Mock 数据 | 多个机构下的科室数据（内科、外科、儿科等） | `src/mocks/data/departments.ts` |

### 3.2 OrgDeptTree 组件设计

```typescript
interface OrgDeptTreeProps {
  showDepartments?: boolean   // 是否展示科室子节点（科室管理=false，用户管理=true）
  selectedKey?: string        // 当前选中节点 key
}

interface OrgDeptTreeEmits {
  (e: 'node-click', payload: { type: 'org' | 'dept'; id: string; name: string }): void
}
```

**数据流设计：**

```
OrgDeptTree (左侧)                     DeptTable (右侧)
  │                                      │
  │ @node-click({ type: 'org', id })    │
  └─────────────────────────────────────→│ 接收 selectedOrgId → 刷新列表
```

---

## 四、验收效果

- [ ] OrgDeptTree 组件可独立使用，支持 `showDepartments` Props 切换
- [ ] sysadmin 登录可见所有机构节点
- [ ] org_admin 登录只可见本机构节点
- [ ] 点击机构节点后右侧科室列表按 org_id 过滤刷新
- [ ] 新增科室时所属机构字段自动关联当前选中机构
- [ ] 科室 CRUD 全流程正常（新增/编辑/删除/状态切换）
- [ ] 表格列配置化驱动渲染
- [ ] 复用 Plan 05 的 `useTableData`、`getStatusColor`、`confirmDelete`
