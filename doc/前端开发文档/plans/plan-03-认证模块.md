# Plan 03: 认证模块（登录/登出/Token）

> 来源阶段：Phase 1（任务 1.5）  
> 前置依赖：Plan 02（全局类型定义与 API 请求层）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | 认证域：POST /auth/login、POST /auth/logout、POST /auth/refresh、POST /auth/change-password、GET /auth/me |
| PRD | `doc/初始文档/PRD.md` | 用户故事 US-001（登录）、US-002（登出）、业务规则 BR-001（首次登录强制改密） |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 登录页布局、错误提示交互 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 三、认证模块 |

### 关键设计要点

- 登录页使用 Ant Design Vue Form 组件，含表单校验
- 登录成功后 Token 持久化到 localStorage
- `must_change_pwd === true` 时强制跳转改密页
- Auth Store 使用 Pinia Composition API 风格
- 需编写对应 MSW Mock handler

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现 Auth Store、登录页、改密页、API 层、Mock |
| 参考 | Skill: `vue-best-practices` | Composition API 规范 |
| 参考 | Skill: `pinia` | Store 定义模式 |
| 参考 | Skill: `vue` | defineProps/defineEmits 等 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 03-1 | Auth API 层 | 实现 login、logout、refreshToken、changePassword、getUserInfo 五个 API 方法 | `src/api/auth.ts` |
| 03-2 | Auth Store | 实现 `useAuthStore`：user 状态、login/logout/refreshToken/fetchUserInfo actions、isLoggedIn/currentRoles getters | `src/stores/auth.ts` |
| 03-3 | Token 工具 | getToken/setToken/removeToken/getRefreshToken/setRefreshToken 工具函数 | `src/utils/auth.ts` |
| 03-4 | 登录页 | Login.vue：用户名+密码表单、Enter 键触发、密码明暗文切换、错误提示、loading 状态 | `src/views/auth/Login.vue` |
| 03-5 | 修改密码页 | ChangePassword.vue：旧密码+新密码+确认密码表单、密码强度校验、成功后自动跳转首页 | `src/views/auth/ChangePassword.vue` |
| 03-6 | Auth Mock Handler | 模拟登录/登出/刷新/改密/获取用户信息接口，返回标准格式数据 | `src/mocks/handlers/auth.ts` |
| 03-7 | Mock 用户数据 | 创建不同角色的测试用户数据（sysadmin/org_admin/dept_admin/user） | `src/mocks/data/users.ts` |

### 3.2 Store 设计

```typescript
// useAuthStore 接口设计
interface AuthStoreState {
  user: User | null
  token: string | null
  refreshToken: string | null
}

// Actions
login(params: LoginParams): Promise<void>
logout(): Promise<void>
refreshToken(): Promise<void>
fetchUserInfo(): Promise<void>

// Getters
isLoggedIn: boolean
currentRoles: UserRole[]
isSysAdmin: boolean
isOrgAdmin: boolean
isDeptAdmin: boolean
currentOrgId: string | null
currentDeptId: string | null
```

### 3.3 登录页交互细节

1. 表单校验规则：用户名必填（最少 3 字符）、密码必填（最少 6 字符）
2. Enter 键触发登录
3. 密码输入框支持明暗文切换（EyeOutlined / EyeInvisibleOutlined）
4. 登录失败：在表单顶部显示错误 Alert
5. 登录成功：
   - `must_change_pwd === true` → 跳转 `/change-password`
   - 否则 → 跳转 URL 中的 `redirect` 参数或首页 `/`
6. Loading 状态：按钮显示加载中，禁止重复提交

### 3.4 Mock 测试账号

| 用户名 | 密码 | 角色 | 备注 |
|--------|------|------|------|
| `sysadmin` | `123456` | sysadmin | 系统管理员 |
| `orgadmin` | `123456` | org_admin | 机构管理员 |
| `deptadmin` | `123456` | dept_admin | 科室管理员 |
| `doctor` | `123456` | user | 普通用户 |
| `newuser` | `123456` | user | must_change_pwd=true |

---

## 四、验收效果

- [ ] 登录页 UI 完整：表单、校验提示、密码明暗文切换、Loading 状态
- [ ] 正确账号登录成功后跳转首页，Token 存入 localStorage
- [ ] 错误账号登录显示错误提示信息
- [ ] `newuser` 登录后强制跳转到改密页
- [ ] 改密成功后自动跳转首页
- [ ] 登出后 Token 清除、用户状态重置、跳转登录页
- [ ] `useAuthStore` 的 `isLoggedIn`、`currentRoles` 计算属性正确
- [ ] MSW Mock 接口响应格式与 API 设计文档一致
- [ ] TypeScript 编译通过，无类型错误
