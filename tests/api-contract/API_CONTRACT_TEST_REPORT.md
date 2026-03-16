# API 合规性测试报告

> 测试时间：2026-03-16  
> 测试环境：`https://mediverse-management.huaxisy.com/api/v1`  
> 框架：Vitest 4.1.0  
> 总耗时：5.98s

---

## 总览

| 指标       | 数值           |
|-----------|---------------|
| 测试文件    | 10 个          |
| 测试用例    | 83 个          |
| ✅ 通过     | **83** (100%)  |

---

## 各模块详情

### Auth（9 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 正确凭证登录返回 200 + token，符合 Schema | ✅ |
| 错误密码返回业务错误（code !== 0）或 401 | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 带 Token 返回当前用户信息，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| 有效 refresh_token 返回新 access_token，符合 Schema | ✅ |
| 无效 refresh_token 返回错误 | ✅ |
| logout 不带 Token 返回 401 | ✅ |
| logout 带 Token 成功登出 | ✅ |

### Organizations（6 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 分页列表返回正确，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| name 筛选正常 | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 不存在 ID 的 PUT 返回错误 | ✅ |
| 不存在 ID 的 DELETE 返回错误 | ✅ |

### Departments（7 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 分页列表返回正确，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| org_id 筛选正常 | ✅ |
| 树结构接口返回正确，符合 Schema | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 不存在 ID 的 PUT 返回错误 | ✅ |
| 不存在 ID 的 DELETE 返回错误 | ✅ |

### Users（8 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 分页列表返回正确，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| keyword 筛选正常 | ✅ |
| role 筛选正常 | ✅ |
| page_size=201 超出上限返回 400 | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 不存在 ID 的 PUT 返回错误 | ✅ |
| 不存在 ID 的 reset-pass 返回错误 | ✅ |

### Avatars（15 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 分页列表返回正确，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| type 筛选正常 | ✅ |
| keyword 筛选正常 | ✅ |
| status 筛选正常 | ✅ |
| page=0 返回 400 | ✅ |
| page_size=0 返回 400 | ✅ |
| page_size=201 返回 400 | ✅ |
| 查询已存在 avatar 详情，符合 Schema（含 knowledge_grants） | ✅ |
| 不存在 ID 返回业务错误 | ✅ |
| 非 UUID 格式 ID 返回 400 | ✅ |
| POST 缺少必填字段返回 400 | ✅ |
| POST 只传 type 缺 name 返回 400 | ✅ |
| 不存在 ID 的 PUT 返回错误 | ✅ |
| 不存在 ID 的 DELETE 返回错误 | ✅ |

### Chat（8 个用例 ✅）

| 用例 | 结果 |
|------|------|
| Chat Avatar 列表返回正确（含 quota），符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| 会话列表返回正确，符合 Schema | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 创建会话（avatar_id + idempotency_key）正常，符合 Schema | ✅ |
| 缺少 title 返回 400 | ✅ |
| 不存在 session 返回错误 | ✅ |
| 已有会话消息列表正确（has_more + items + parts），符合 Schema | ✅ |

### My Avatar（5 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 当前用户 avatar 返回正确（或 null），符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| 功能开关 7 个布尔字段全部正确，符合 Schema | ✅ |
| 统计数据（sessions + knowledge_progress）正常，符合 Schema | ✅ |
| 缺少 owner_type/owner_id 返回 400 | ✅ |

### Knowledge（11 个用例 ✅）

> owner_type 使用 `org`（从当前用户 org_id 推断）

| 用例 | 结果 |
|------|------|
| GET directories 返回树结构 | ✅ |
| POST directories 缺 name 返回 400 | ✅ |
| GET files 返回列表，符合 Schema | ✅ |
| GET cards 返回列表，符合 Schema | ✅ |
| POST cards 缺少必填字段返回 400 | ✅ |
| GET cards/{id} 不存在返回错误 | ✅ |
| GET cards/{id} 存在时符合 Schema | ✅ |
| GET cards/{id}/versions 返回版本数组 | ✅ |
| 不带 Token 访问 directories 返回 401 | ✅ |
| 不带 Token 访问 files 返回 401 | ✅ |
| 不带 Token 访问 cards 返回 401 | ✅ |

### Knowledge QA（8 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 知识搜索返回正确（qa_session_id + answer + citations），符合 Schema | ✅ |
| 缺少 query 返回 400 | ✅ |
| 不带 Token 返回 401 | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 无效 qa_session_id 返回错误 | ✅ |
| 搜索历史返回数组，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| limit 参数生效 | ✅ |

### API Tokens（6 个用例 ✅）

| 用例 | 结果 |
|------|------|
| 分页列表返回正确，符合 Schema | ✅ |
| 不带 Token 返回 401 | ✅ |
| 缺少必填字段返回 400 | ✅ |
| 不存在 ID 的 PUT 返回错误 | ✅ |
| 不存在 ID 的 DELETE 返回错误 | ✅ |
| 缺少 status 返回 400 | ✅ |

---

## 已确认的后端约定

| 约定 | 说明 |
|------|------|
| 校验错误状态码 | **400**（非 OpenAPI 标准的 422） |
| BaseResponse 结构 | `{ code: 0, message: "ok", data: T }` |
| Knowledge owner_type | 枚举值仅限 `personal` / `dept` / `org` |
| 认证方式 | `Authorization: Bearer <token>` |
| 未认证响应 | 401 |

---

## 测试覆盖的验证维度

| 维度 | 说明 |
|------|------|
| Schema 合规 | 通过 AJV 对比线上 `/openapi.json` 中的 response schema 自动校验 |
| BaseResponse 结构 | `code === 0`、`message` 为字符串、`data` 字段存在 |
| 字段类型 | UUID 格式、ISO 8601 日期时间、数组类型、布尔类型 |
| 认证守卫 | 所有需要 HTTPBearer 的接口不带 Token 返回 401 |
| 参数校验 | 缺少必填字段 / 违反约束返回 400 |
| 分页边界 | page=0、page_size=0、page_size 超上限均返回 400 |
| 不存在资源 | 假 UUID 返回 404 或 code !== 0 |
| 筛选参数 | keyword、type、status、org_id 等筛选正常工作 |

---

## 执行命令

```bash
# 运行全部 API 合规性测试
pnpm test:api

# 运行单个模块
pnpm test:api -- auth
pnpm test:api -- avatars

# Watch 模式
pnpm test:api:watch
```
