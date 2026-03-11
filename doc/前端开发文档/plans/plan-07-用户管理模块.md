# Plan 07: 用户管理模块

> 来源阶段：Phase 2（任务 2.7、2.8）  
> 前置依赖：Plan 06（科室管理模块，复用 OrgDeptTree）  
> 项目目录：`mediverse-management-frontend/`  
> **API 依据**：`doc/初始文档/API设计V2.0.md` 1.4 用户管理、1.1 认证（修改密码）

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计V2.0.md` | 1.4 用户管理（列表/新增/编辑/重置密码）、1.1.4 修改密码 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 用户管理页（左右分栏）、角色设置弹窗、密码重置确认 |
| 技术设计 | `doc/初始文档/技术设计.md` | 2.1.3 用户表结构 |
| PRD | `doc/初始文档/PRD.md` | 业务规则：角色隔离、密码重置规则 |
| 前端开发实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 四.4 用户管理 |

### 关键设计要点（对齐 API 设计 V2.0）

- 复用 Plan 06 的 OrgDeptTree（`showDepartments=true` 展示机构-科室层级），点击节点用 `org_id`/`dept_id` 过滤用户列表。
- **接口范围**：V2.0 仅提供查询列表、新增、编辑、重置密码；**无删除用户接口**，用户“下线”通过编辑为 `status=inactive` 实现。
- 角色隔离：科室管理员创建用户时机构/科室字段锁定为本科室；角色至少保留 `user`，角色修改通过 `PUT /api/v1/users/{id}` 的 `roles` 字段提交。
- **密码重置**：`POST /api/v1/users/{id}/reset-pass` 无 Request Body，将密码重置为**系统默认密码 123456**，响应 `data` 为 `null`。前端流程：二次确认 → 调用接口 → 成功提示「密码已重置为默认密码 123456」并可复制，不再展示“临时密码仅显示一次”。
- 列表支持 Query：`org_id`、`dept_id`、`keyword`（姓名/用户名）、`role`、`status`、`page`、`page_size`；响应为统一分页结构 `total/page/page_size/items`。
- 新增用户必填：`username`、`real_name`、`roles`；可选 `password`（不传默认 123456）、`org_id`、`dept_id`、`remark`、`status`。V2.0 新增请求体**不含** `phone`、`email`；编辑接口可修改字段为 `real_name`、`org_id`、`dept_id`、`roles`、`remark`、`status`（列表项含 `phone`/`email` 时可仅展示，编辑是否支持以后续 API 扩展为准）。

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
| 07-1 | 用户管理 API 层 | getUsers（Query: org_id, dept_id, keyword, role, status, page, page_size）/ createUser / updateUser（含 roles）/ resetPass（POST users/:id/reset-pass，无 body，data 为 null） | `src/api/users.ts` |
| 07-2 | 用户列表页 | 左侧 OrgDeptTree（showDepartments=true）+ 右侧用户表格，树节点选中传 org_id/dept_id 查列表 | `src/views/admin/Users/index.vue` |
| 07-3 | UserTable 组件 | 配置化列：用户名/真实姓名/手机号/角色 Tag/状态 Badge/操作（编辑、角色、重置密码、停用；无删除） | `src/views/admin/Users/components/UserTable.vue` |
| 07-4 | UserForm 组件 | 新增：username, real_name, password(可选), org_id, dept_id, roles, remark, status；编辑：real_name, org_id, dept_id, roles, remark, status；科室管理员创建时机构+科室锁定；phone/email 仅展示时以列表项为准 | `src/views/admin/Users/components/UserForm.vue` |
| 07-5 | RoleEditor 组件 | 角色编辑弹窗：Checkbox.Group 多选角色，至少保留 user；提交调用 updateUser 传 roles | `src/views/admin/Users/components/RoleEditor.vue` |
| 07-6 | 密码重置流程 | 二次确认 → 调用 POST /api/v1/users/{id}/reset-pass → 成功提示「密码已重置为默认密码 123456」并可复制 | 集成在 UserTable 操作列 |
| 07-7 | 用户 Mock Handler | 模拟 getUsers（分页+过滤）/ createUser / updateUser / resetPass（返回 data: null）；无 deleteUser | `src/mocks/handlers/users.ts` |
| 07-8 | 用户 Mock 数据 | 不同机构/科室下的用户数据（含各角色），与 1.4.1 响应字段一致 | `src/mocks/data/users.ts` |

### 3.2 角色隔离逻辑

```
当前用户角色           | 可管理范围         | 创建用户时机构/科室字段
sysadmin              | 所有机构所有用户    | 可选任意机构+科室
org_admin             | 本机构所有用户      | 机构锁定，可选本机构下科室
dept_admin            | 本科室用户          | 机构+科室均锁定
```

### 3.3 密码重置交互流程（对齐 V2.0）

```
点击「重置密码」→ 二次确认弹窗（「确定重置 xxx 的密码？将重置为默认密码 123456」）
  → 确认 → 调用 POST /api/v1/users/{id}/reset-pass（无 body）
    → 成功（data 为 null）→ 提示「密码已重置为默认密码 123456」+ 可复制 123456
    → 失败 → Toast 报错
```

---

## 四、验收效果

- [ ] OrgDeptTree 复用正常，展示机构+科室两级树
- [ ] 点击树节点后用户列表按 org_id/dept_id 过滤，分页参数与 keyword/role/status 生效
- [ ] 新增用户：username、real_name、roles 必填，角色至少含 user；password 可选（不传即默认 123456）
- [ ] 科室管理员创建用户时机构/科室字段自动锁定为本科室
- [ ] 编辑用户提交字段与 V2.0 一致（real_name, org_id, dept_id, roles, remark, status）
- [ ] 角色编辑弹窗多选角色、至少保留 user，提交走 updateUser
- [ ] 密码重置：二次确认后调用 reset-pass，成功提示「默认密码 123456」并可复制（无临时密码返回）
- [ ] 不同角色登录后可管理的用户范围正确隔离
- [ ] 无删除用户接口，仅支持停用（status=inactive）；表格列配置化，角色列 Tag 渲染
