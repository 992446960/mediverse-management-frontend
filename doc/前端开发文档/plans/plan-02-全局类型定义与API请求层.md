# Plan 02: 全局类型定义与 API 请求层

> 来源阶段：Phase 1（任务 1.3、1.4）  
> 前置依赖：Plan 01（项目脚手架）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| 技术设计 | `doc/初始文档/技术设计.md` | 二、数据库设计（字段定义）；五、API 设计（响应格式） |
| API 设计 | `doc/初始文档/API设计.md` | 全文：所有接口的请求/响应类型 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | 三.2 通用类型定义、三.3 API 请求封装 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 二.1 Axios 请求封装 |

### 关键设计要点

- 所有业务实体类型必须与数据库 Schema 字段一一对应
- API 响应统一包装为 `{ code: number, message: string, data: T }`，code=0 为成功
- 分页响应固定格式 `{ total, page, page_size, items: T[] }`
- Axios 拦截器实现：JWT 自动携带、401 Token 刷新队列、统一错误 Toast
- 请求刷新期间其他 401 请求排队重放，防并发刷新死循环

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 编写类型定义文件和 API 封装 |
| 参考 | Skill: `vue-best-practices` | TypeScript 规范 |
| 参考 | Skill: `ecc-typescript` | TypeScript 严格类型规范 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 02-1 | 通用 API 类型 | 定义 `ApiResponse<T>`、`PaginatedData<T>`、`PaginationParams` | `src/types/api.ts` |
| 02-2 | 认证类型 | 定义 `User`、`UserRole`、`LoginParams`、`LoginResponse`、`ChangePasswordParams` | `src/types/auth.ts` |
| 02-3 | 机构/科室类型 | 定义 `Organization`、`Department` 及其 CRUD 参数类型 | `src/types/organization.ts`、`src/types/department.ts` |
| 02-4 | 用户管理类型 | 定义管理端 `UserListParams`、`UserForm` 等 | `src/types/user.ts` |
| 02-5 | 分身类型 | 定义 `Avatar`、`AvatarType`、`AvatarWizardForm` 等 | `src/types/avatar.ts` |
| 02-6 | 知识库类型 | 定义 `OwnerType`、`FileStatus`、`KnowledgeFile`、`KnowledgeCard`、`DirectoryTree` 等 | `src/types/knowledge.ts` |
| 02-7 | 对话类型 | 定义 `Session`、`Message`、`MessagePart`、`ThinkingStep`、`SourceCitation` 等 | `src/types/chat.ts` |
| 02-8 | 知识搜索类型 | 定义 `SearchResult`、`SearchCitation` 等 | `src/types/knowledgeSearch.ts` |
| 02-9 | API Token 类型 | 定义 `ApiToken` 及相关类型 | `src/types/apiToken.ts` |
| 02-10 | 路由元信息类型 | 扩展 `vue-router` 的 `RouteMeta` | `src/types/router.ts` |
| 02-11 | Axios 实例封装 | 创建 axios 实例 + 请求/响应拦截器 | `src/api/index.ts` |
| 02-12 | Token 工具函数 | Token 存取、刷新队列逻辑 | `src/utils/auth.ts` |
| 02-13 | 类型统一导出 | 创建 barrel export 文件 | `src/types/index.ts` |

### 3.2 核心类型定义（关键结构）

以下为必须实现的核心类型接口（完整定义见前端实施指南）：

```typescript
// 通用 API 响应
interface ApiResponse<T> { code: number; message: string; data: T }
interface PaginatedData<T> { total: number; page: number; page_size: number; items: T[] }

// 用户与认证
type UserRole = 'sysadmin' | 'org_admin' | 'dept_admin' | 'user'
interface User { id: string; org_id: string; roles: UserRole[]; must_change_pwd: boolean; ... }

// 知识库核心
type OwnerType = 'personal' | 'dept' | 'org'
type FileStatus = 'uploading' | 'parsing' | 'extracting' | 'indexing' | 'done' | 'failed'
type CardType = 'evidence' | 'rule' | 'experience'

// 对话核心
interface Message { id: string; role: 'user' | 'assistant' | 'tool'; parts: MessagePart[]; ... }
```

### 3.3 Axios 封装关键逻辑

1. **请求拦截器**：从 localStorage 读取 token，自动附加 `Authorization: Bearer <token>`
2. **响应拦截器**：
   - 成功响应：检查 `code === 0`，直接返回 `data` 层
   - `code !== 0`：使用 `message.error()` Toast 报错，Promise.reject
   - HTTP 401：触发 Token 刷新流程
3. **Token 刷新队列**：
   - 使用 `isRefreshing` 标志位防止并发刷新
   - 刷新期间其他 401 请求进入 `pendingRequests` 队列等待
   - 刷新成功：重放队列中的请求
   - 刷新失败：清除认证状态，跳转登录页
4. **导出泛型方法**：`get<T>`, `post<T>`, `put<T>`, `delete<T>`, `patch<T>`

---

## 四、验收效果

- [ ] `src/types/` 下所有类型文件已创建，覆盖全部业务实体
- [ ] 所有类型字段与 `技术设计.md` 数据库 Schema 一致
- [ ] `src/api/index.ts` Axios 实例创建完成
- [ ] 请求拦截器自动附加 JWT Token
- [ ] 响应拦截器统一解包 `ApiResponse`，code !== 0 时自动 Toast 报错
- [ ] 401 响应触发 Token 刷新逻辑，刷新期间请求排队
- [ ] Token 刷新失败时自动清除状态并跳转 `/login`
- [ ] 无并发刷新死循环（多个 401 同时到达时只触发一次 refresh）
- [ ] TypeScript 编译通过，无 `any` 使用
- [ ] 所有类型通过 `src/types/index.ts` 统一导出
