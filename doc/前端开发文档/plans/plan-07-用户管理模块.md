# Plan 07: 用户管理模块

> 来源阶段：Phase 2（任务 2.7、2.8）  
> 前置依赖：Plan 06（科室管理模块，复用 OrgDeptTree）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Management 域 → 用户 CRUD + 角色修改 + 密码重置 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 用户管理页（左右分栏）、角色设置弹窗、密码重置确认 |
| 技术设计 | `doc/初始文档/技术设计.md` | 2.1.3 用户表结构 |
| PRD | `doc/初始文档/PRD.md` | 业务规则：角色隔离、密码重置规则 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 四.4 用户管理 |

### 关键设计要点

- 复用 Plan 06 的 OrgDeptTree（`showDepartments=true` 展示科室层级）
- 角色隔离：科室管理员创建用户时机构/科室字段锁定为本科室
- 密码重置需二次确认，成功后显示临时密码（仅显示一次）
- 角色选择使用 Checkbox.Group，至少保留 `user` 角色
- 支持按机构/科室节点过滤用户列表

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现用户页面、角色编辑、密码重置、Mock |
| 参考 | Skill: `vue-best-practices` | 组件规范 |
| 参考 | Skill: `vue` | v-model、计算属性 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 07-1 | 用户管理 API 层 | getUsers/createUser/updateUser/deleteUser/updateUserRoles/resetPassword | `src/api/users.ts` |
| 07-2 | 用户列表页 | 左侧 OrgDeptTree（showDepartments=true）+ 右侧用户表格 | `src/views/admin/Users/index.vue` |
| 07-3 | UserTable 组件 | 配置化列（用户名/真实姓名/手机号/角色Tag/状态Badge/操作） | `src/views/admin/Users/components/UserTable.vue` |
| 07-4 | UserForm 组件 | 新增/编辑弹窗：用户名/真实姓名/手机/邮箱/角色选择，科室管理员创建时机构+科室锁定 | `src/views/admin/Users/components/UserForm.vue` |
| 07-5 | RoleEditor 组件 | 角色编辑弹窗：Checkbox.Group 多选角色，至少保留 user | `src/views/admin/Users/components/RoleEditor.vue` |
| 07-6 | 密码重置流程 | 二次确认弹窗 → 调用 API → 成功后 Modal 展示临时密码（不可再查看） | 集成在 UserTable 操作列 |
| 07-7 | 用户 Mock Handler | 模拟用户 CRUD + 角色修改 + 密码重置（返回临时密码），按 org_id/dept_id 过滤 | `src/mocks/handlers/users.ts` |
| 07-8 | 用户 Mock 数据 | 不同机构/科室下的用户数据（含各角色） | `src/mocks/data/users.ts` |

### 3.2 角色隔离逻辑

```
当前用户角色           | 可管理范围         | 创建用户时机构/科室字段
sysadmin              | 所有机构所有用户    | 可选任意机构+科室
org_admin             | 本机构所有用户      | 机构锁定，可选本机构下科室
dept_admin            | 本科室用户          | 机构+科室均锁定
```

### 3.3 密码重置交互流程

```
点击"重置密码" → 二次确认弹窗（"确定重置 xxx 的密码？"）
  → 确认 → 调用 resetPassword API
    → 成功 → Modal 展示临时密码 + "已复制到剪贴板"
    → 失败 → Toast 报错
```

---

## 四、验收效果

- [ ] OrgDeptTree 复用正常，展示机构+科室两级树
- [ ] 点击树节点后用户列表按 org_id/dept_id 过滤
- [ ] 新增用户表单校验完整（用户名必填、角色至少选 user）
- [ ] 科室管理员创建用户时机构/科室字段自动锁定为本科室
- [ ] 角色编辑弹窗支持多选，不允许取消全部角色
- [ ] 密码重置有二次确认，成功后展示临时密码
- [ ] 不同角色登录后可管理的用户范围正确隔离
- [ ] 表格列配置化驱动，角色列使用 Tag 渲染
