# Python Mock Backend OpenAPI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在前端项目同级目录新建 Python mock 后端，覆盖 `https://mediverse-management.huaxisy.com/docs#/` 当前 Swagger 暴露的全部接口，不依赖数据库。

**Architecture:** 新建 sibling 项目 `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend`，使用 FastAPI + Pydantic + Uvicorn 实现 OpenAPI 合同兼容 mock。所有业务数据使用进程内内存状态和固定 seed，提供 mock-only reset 接口用于测试；不引入 SQLite、MySQL、Redis 或文件型数据库。前端继续通过 Vite `DEV_PROXY_TARGET` 指向 mock 后端，现有 `src/mocks/**` 暂不删除，等 Python mock 通过全量合同测试后再做迁移切换。

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, Uvicorn, Pytest, HTTPX, Ruff, OpenAPI JSON snapshot, existing frontend `tests/api-contract`

---

## Confirmed Source

- Swagger UI: `https://mediverse-management.huaxisy.com/docs#/`
- OpenAPI JSON: `https://mediverse-management.huaxisy.com/openapi.json`
- Current snapshot checked on 2026-05-20:
  - 67 paths
  - 90 operations
  - Tags: `auth` 6, `api-tokens` 5, `departments` 5, `organizations` 4, `chat` 9, `upload` 1, `users` 6, `skills` 2, `avatars` 6, `my-avatar` 8, `knowledge` 26, `knowledge-qa` 3, `knowledge-recall` 7

---

## Scope

**In scope**

- 创建 Python mock backend sibling 目录：`/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend`。
- 固化线上 OpenAPI 快照到 mock backend 仓库内，作为实现和测试的唯一接口清单。
- 实现 Swagger 当前全部 90 个接口，包括 multipart 上传接口和知识库/召回/聊天相关接口。
- 所有接口返回与前端约定一致的 `{ code, message, data }` envelope；成功码默认 `code === 0`。
- 登录、刷新、鉴权使用可预测 mock token，不连接真实认证服务。
- 数据只保存在内存中；服务重启后回到 seed 状态。
- 提供 `POST /__mock/reset` 和 `GET /__mock/routes` 作为 mock-only 运维接口，不纳入线上接口合同。
- 增加 Python 后端自己的 pytest 合同测试，至少验证 90 个 operation 都已注册，并验证关键读写路径。
- 增加前端联调说明：通过 `.env.development.local` 设置 `DEV_PROXY_TARGET=http://127.0.0.1:8005`，保持 `VITE_ENABLE_MOCK=false`。

**Out of scope**

- 不接入真实数据库、对象存储、Elasticsearch、LLM、向量库、消息队列或第三方服务。
- 不重写前端页面业务逻辑。
- 不删除现有 `src/mocks/**` MSW mock；Python mock 稳定后另起迁移清理任务。
- 不提交 `.env.api-test`、真实 Token、真实账号密码或个人 IP。
- 不把 mock-only 接口写入前端生产配置。

---

## Endpoint Inventory

### auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `PUT /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`

### api-tokens

- `GET /api/v1/admin/api-tokens`
- `POST /api/v1/admin/api-tokens`
- `PUT /api/v1/admin/api-tokens/{id}`
- `DELETE /api/v1/admin/api-tokens/{id}`
- `PATCH /api/v1/admin/api-tokens/{id}/status`

### departments

- `GET /api/v1/departments`
- `POST /api/v1/departments`
- `GET /api/v1/departments/tree`
- `PUT /api/v1/departments/{id}`
- `DELETE /api/v1/departments/{id}`

### organizations

- `GET /api/v1/organizations`
- `POST /api/v1/organizations`
- `PUT /api/v1/organizations/{id}`
- `DELETE /api/v1/organizations/{id}`

### chat

- `GET /api/v1/chat/avatars`
- `GET /api/v1/chat/sessions`
- `POST /api/v1/chat/sessions`
- `PATCH /api/v1/chat/sessions/{id}/title`
- `DELETE /api/v1/chat/sessions/{id}`
- `DELETE /api/v1/chat/sessions/kb-search/by-user`
- `GET /api/v1/chat/sessions/{id}/messages`
- `POST /api/v1/chat/sessions/{id}/messages`
- `POST /api/v1/chat/sessions/{id}/ratings`

### upload

- `POST /api/v1/upload/avatar`

### users

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PUT /api/v1/users/{id}`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users/{id}/reset-pass`
- `POST /api/v1/users/{id}/avatar/upload`

### skills

- `GET /api/v1/skills`
- `POST /api/v1/skills/{skill_code}/execute`

### avatars

- `GET /api/v1/avatars`
- `POST /api/v1/avatars`
- `GET /api/v1/avatars/configurable`
- `GET /api/v1/avatars/{id}`
- `PUT /api/v1/avatars/{id}`
- `DELETE /api/v1/avatars/{id}`

### my-avatar

- `GET /api/v1/my/avatar`
- `PUT /api/v1/my/avatar`
- `GET /api/v1/my/features`
- `POST /api/v1/my/avatar/upload`
- `GET /api/v1/my/avatar/stats`
- `GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}`
- `GET /api/v1/my/avatar/knowledge/stats`
- `GET /api/v1/my/avatar/{owner_type}/{owner_id}`

### knowledge

- `GET /api/v1/knowledge/{owner_type}/{owner_id}/directories`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/directories`
- `PUT /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}`
- `DELETE /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}`
- `PATCH /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}/rename`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/files`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/batch/move`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/indexing-tasks/{task_id}/retry`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/presign`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/status`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/confirm`
- `DELETE /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/tasks/{task_id}`
- `GET /api/v1/knowledge/card-types`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/cards`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/cards`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/cards`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}`
- `PUT /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}`
- `DELETE /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}`
- `PATCH /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/status`
- `PATCH /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/audit`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions`
- `GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions/diff`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/rollback`

### knowledge-qa

- `POST /api/v1/knowledge-qa/{owner_type}/{owner_id}/search`
- `POST /api/v1/knowledge-qa/follow-up`
- `GET /api/v1/knowledge-qa/history`

### knowledge-recall

- `POST /api/v1/knowledge-recall/{owner_type}/{owner_id}/recall`
- `DELETE /api/v1/knowledge-recall/history`
- `DELETE /api/v1/knowledge-recall/{owner_type}/{owner_id}/history`
- `GET /api/v1/knowledge-recall/{owner_type}/{owner_id}/history`
- `GET /api/v1/knowledge-recall/sessions/{session_id}`
- `DELETE /api/v1/knowledge-recall/sessions/{session_id}`
- `POST /api/v1/knowledge-recall/{owner_type}/{owner_id}/search`

### health

- `GET /`
- `GET /health`

---

## File Map

### New sibling backend

- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/README.md`  
  Documents startup, reset, frontend proxy, and no-database boundary.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/pyproject.toml`  
  Defines FastAPI, Uvicorn, Pytest, HTTPX, Ruff.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/main.py`  
  Builds FastAPI app, CORS, router registration, root and health endpoints.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/core/config.py`  
  Holds host, port, CORS origins, token prefix, and OpenAPI snapshot path.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/core/responses.py`  
  Central response helpers: `ok(data=None, message="success")`, `fail(code, message, data=None)`, and paginated payload builder.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/core/auth.py`  
  Mock token issue/parse dependency and current user resolution.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/state/models.py`  
  TypedDict/dataclass definitions for in-memory entities.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/state/seeds.py`  
  Deterministic seed users, orgs, departments, avatars, sessions, knowledge files, cards, versions, api tokens, skills.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/state/store.py`  
  `MockStore` with reset, id generation, filtering, pagination, CRUD mutation helpers.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/contracts/openapi.json`  
  Snapshot fetched from `https://mediverse-management.huaxisy.com/openapi.json`.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/scripts/fetch_openapi.sh`  
  Refreshes `app/contracts/openapi.json` from the online docs.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/scripts/route_inventory.py`  
  Prints tag counts and operation inventory from the snapshot.
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/auth.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/api_tokens.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/departments.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/organizations.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/chat.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/upload.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/users.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/skills.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/avatars.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/my_avatar.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/knowledge.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/knowledge_qa.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/knowledge_recall.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/app/routers/mock_admin.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/conftest.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_openapi_coverage.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_auth.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_admin_crud.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_chat.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_knowledge.py`
- Create: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend/tests/test_knowledge_search_recall.py`

### Existing frontend repository

- Modify: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-frontend/docs/frontend-development.md`  
  Add Python mock backend startup and `.env.development.local` proxy instructions.
- Modify: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-frontend/docs/documentation-task-board.md`  
  Record the new Python mock backend plan and verification commands.
- Modify: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-frontend/tests/api-contract/setup.ts`  
  Allow contract tests to target `http://127.0.0.1:8005/api/v1` without `.env.api-test` credentials when `API_TEST_USE_MOCK=true`.
- Modify: `/Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-frontend/tests/api-contract/*.test.ts`  
  Add missing coverage for endpoint groups that are currently absent: `skills`, `upload`, `knowledge-recall`, and any Swagger operation not represented by existing tests.

---

## Implementation Tasks

### Task 1: Scaffold Python backend and lock the OpenAPI snapshot

**Files:**
- Create: `../mediverse-management-mock-backend/pyproject.toml`
- Create: `../mediverse-management-mock-backend/README.md`
- Create: `../mediverse-management-mock-backend/app/main.py`
- Create: `../mediverse-management-mock-backend/app/contracts/openapi.json`
- Create: `../mediverse-management-mock-backend/scripts/fetch_openapi.sh`
- Create: `../mediverse-management-mock-backend/scripts/route_inventory.py`
- Test: `../mediverse-management-mock-backend/tests/test_openapi_coverage.py`

- [ ] **Step 1: Create project directory**

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management
mkdir -p mediverse-management-mock-backend/app/contracts mediverse-management-mock-backend/scripts mediverse-management-mock-backend/tests
```

- [ ] **Step 2: Add FastAPI project metadata**

Create `pyproject.toml` with dependencies:

```toml
[project]
name = "mediverse-management-mock-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.30.0",
  "python-multipart>=0.0.9",
  "pydantic>=2.8.0"
]

[project.optional-dependencies]
dev = [
  "httpx>=0.27.0",
  "pytest>=8.3.0",
  "ruff>=0.6.0"
]

[tool.ruff]
line-length = 100
target-version = "py312"
```

- [ ] **Step 3: Fetch OpenAPI snapshot**

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend
curl -fsSL https://mediverse-management.huaxisy.com/openapi.json -o app/contracts/openapi.json
jq -r '.paths | to_entries[] as $p | $p.value | keys[] as $m | "\($m|ascii_upcase) \($p.key)"' app/contracts/openapi.json | wc -l
```

Expected: `90`.

- [ ] **Step 4: Implement route inventory script**

`scripts/route_inventory.py` reads `app/contracts/openapi.json`, prints `path_count`, `operation_count`, tag counts, and a sorted `METHOD path [tag]` list.

- [ ] **Step 5: Add minimal app and health endpoints**

`app/main.py` must expose:

- `GET /` returning `{ "message": "Mediverse Management Mock Backend" }`
- `GET /health` returning `{ "status": "ok" }`
- `GET /__mock/routes` returning registered API routes

- [ ] **Step 6: Write coverage test that initially fails**

`tests/test_openapi_coverage.py` compares every `(method, path)` in `app/contracts/openapi.json` to FastAPI registered routes, excluding only `HEAD` and `OPTIONS`.

Run:

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend
pytest tests/test_openapi_coverage.py -q
```

Expected after Task 1: FAIL listing the unimplemented API routes.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore(mock-backend): scaffold Python FastAPI mock"
```

### Task 2: Build shared response, auth, and in-memory store

**Files:**
- Create: `../mediverse-management-mock-backend/app/core/config.py`
- Create: `../mediverse-management-mock-backend/app/core/responses.py`
- Create: `../mediverse-management-mock-backend/app/core/auth.py`
- Create: `../mediverse-management-mock-backend/app/state/models.py`
- Create: `../mediverse-management-mock-backend/app/state/seeds.py`
- Create: `../mediverse-management-mock-backend/app/state/store.py`
- Create: `../mediverse-management-mock-backend/app/routers/mock_admin.py`
- Test: `../mediverse-management-mock-backend/tests/test_auth.py`

- [ ] **Step 1: Define envelope helpers**

`ok(data=None, message="success")` returns `{"code": 0, "message": message, "data": data}`. `fail(code, message, data=None)` returns the same shape with non-zero code.

- [ ] **Step 2: Seed deterministic entities**

Seed must include at least:

- `sysadmin` user with password `mock123456`
- one organization
- one department under that organization
- one department admin
- one normal user
- one API token
- one expert avatar, one dept avatar, one org avatar
- one chat session with messages
- one knowledge directory tree per owner type: `personal`, `dept`, `org`
- five knowledge files with statuses covering `done`, `failed`, and processing states
- three knowledge cards with versions and source files
- skills `knowledge-retrieval` and `case-summary`

- [ ] **Step 3: Implement auth dependency**

Mock token format:

- access token: `mock_access_<user_id>`
- refresh token: `mock_refresh_<user_id>`

The dependency reads `Authorization: Bearer mock_access_<user_id>` and returns the matching seed user.

- [ ] **Step 4: Implement reset route**

`POST /__mock/reset` calls `MockStore.reset()` and returns `ok({"reset": true})`.

- [ ] **Step 5: Verify auth helper and reset**

Run:

```bash
pytest tests/test_auth.py -q
```

Expected: PASS for token issue, current user resolution, reset restoring mutated state.

- [ ] **Step 6: Commit**

```bash
git add app/core app/state app/routers/mock_admin.py tests/test_auth.py
git commit -m "feat(mock-backend): add shared state and auth helpers"
```

### Task 3: Implement auth routes

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/auth.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_auth.py`

- [ ] **Step 1: Implement six auth operations**

Behavior:

- `POST /api/v1/auth/login`: validates username/password against seed users and returns access token, refresh token, and user info.
- `POST /api/v1/auth/refresh`: accepts `mock_refresh_<user_id>` and returns new `mock_access_<user_id>_refreshed`.
- `GET /api/v1/auth/me`: returns current user plus `has_expert_avatar`, `has_dept_avatar`, `has_org_avatar`.
- `PUT /api/v1/auth/me`: mutates current user profile fields present in request body.
- `POST /api/v1/auth/logout`: returns `ok(None)`.
- `POST /api/v1/auth/change-password`: returns `ok(None)` after matching `old_password`.

- [ ] **Step 2: Add auth tests**

Cover login success, login wrong password, refresh success, `/auth/me`, profile update, logout, and change password.

- [ ] **Step 3: Run tests**

```bash
pytest tests/test_auth.py tests/test_openapi_coverage.py -q
```

Expected: auth tests PASS; coverage test still FAIL with non-auth routes.

- [ ] **Step 4: Commit**

```bash
git add app/routers/auth.py app/main.py tests/test_auth.py
git commit -m "feat(mock-backend): implement auth endpoints"
```

### Task 4: Implement admin CRUD domains

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/organizations.py`
- Create: `../mediverse-management-mock-backend/app/routers/departments.py`
- Create: `../mediverse-management-mock-backend/app/routers/users.py`
- Create: `../mediverse-management-mock-backend/app/routers/api_tokens.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_admin_crud.py`

- [ ] **Step 1: Implement organizations**

Support list filtering by `name`, `status`, pagination, create, update, delete. Delete removes the organization from in-memory list and preserves departments for deterministic tests unless explicitly filtered out by `org_id`.

- [ ] **Step 2: Implement departments**

Support list filtering by `org_id`, `name`, `status`, pagination, create, tree, update, delete. Tree returns organization nodes with child departments.

- [ ] **Step 3: Implement users**

Support list filtering by `org_id`, `dept_id`, `keyword`, `role`, `status`, pagination, create, update, detail, reset password, avatar upload.

- [ ] **Step 4: Implement API tokens**

Support list filtering by `org_id`, `name`, `status`, pagination, create with one-time `token` field, update, delete, status patch.

- [ ] **Step 5: Add CRUD tests**

Tests must verify create -> list -> update -> detail -> delete for each domain, and pagination envelope fields `items`, `total`, `page`, `page_size`.

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_admin_crud.py tests/test_openapi_coverage.py -q
```

Expected: admin CRUD tests PASS; coverage test still FAIL with remaining routes.

- [ ] **Step 7: Commit**

```bash
git add app/routers/organizations.py app/routers/departments.py app/routers/users.py app/routers/api_tokens.py app/main.py tests/test_admin_crud.py
git commit -m "feat(mock-backend): implement admin CRUD endpoints"
```

### Task 5: Implement avatar, my-avatar, upload, and skills routes

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/avatars.py`
- Create: `../mediverse-management-mock-backend/app/routers/my_avatar.py`
- Create: `../mediverse-management-mock-backend/app/routers/upload.py`
- Create: `../mediverse-management-mock-backend/app/routers/skills.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_admin_crud.py`

- [ ] **Step 1: Implement avatar list/create/detail/update/delete**

Support filters `org_id`, `dept_id`, `user_id`, `type`, `keyword`, `status`, pagination. `GET /avatars/configurable` returns avatars the current user can configure from seed scope.

- [ ] **Step 2: Implement my-avatar routes**

Return current user's avatar config, feature flags, stats, knowledge stats, owner-scoped avatar config, update current avatar, and upload avatar.

- [ ] **Step 3: Implement upload route**

`POST /api/v1/upload/avatar` accepts multipart `file` and returns a deterministic mock URL such as `/mock/uploads/avatar/<generated_id>.png`.

- [ ] **Step 4: Implement skills routes**

`GET /api/v1/skills` returns seeded skill list. `POST /api/v1/skills/{skill_code}/execute` returns deterministic `done.result` content; for `knowledge-retrieval`, include `md_content`, `json_content`, and `citations`.

- [ ] **Step 5: Add tests**

Cover multipart upload, avatar filters, my-avatar stats, skill execution, and unknown skill failure envelope.

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_admin_crud.py tests/test_openapi_coverage.py -q
```

Expected: route coverage only missing chat and knowledge groups.

- [ ] **Step 7: Commit**

```bash
git add app/routers/avatars.py app/routers/my_avatar.py app/routers/upload.py app/routers/skills.py app/main.py tests/test_admin_crud.py
git commit -m "feat(mock-backend): implement avatar and skill endpoints"
```

### Task 6: Implement chat routes

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/chat.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_chat.py`

- [ ] **Step 1: Implement chat avatar list**

`GET /api/v1/chat/avatars` filters seeded avatars by `org_id`, `dept_id`, `type`, `keyword`, and pagination.

- [ ] **Step 2: Implement session CRUD**

Support list, create, title update, delete, and delete all current user's KB-search sessions.

- [ ] **Step 3: Implement message list and send**

`GET /api/v1/chat/sessions/{id}/messages` supports `before_id` and `limit`. `POST /api/v1/chat/sessions/{id}/messages` accepts multipart form fields used by the frontend, appends user message and deterministic assistant reply, and returns the assistant message payload.

- [ ] **Step 4: Implement ratings**

`POST /api/v1/chat/sessions/{id}/ratings` records rating in memory and returns rating output.

- [ ] **Step 5: Add chat tests**

Cover create session, send multipart message, list messages, rename, rate, delete, and KB-search cleanup.

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_chat.py tests/test_openapi_coverage.py -q
```

Expected: chat tests PASS; route coverage only missing knowledge groups.

- [ ] **Step 7: Commit**

```bash
git add app/routers/chat.py app/main.py tests/test_chat.py
git commit -m "feat(mock-backend): implement chat endpoints"
```

### Task 7: Implement knowledge file and directory routes

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/knowledge.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_knowledge.py`

- [ ] **Step 1: Implement directory operations**

Support owner-scoped list, create, update, delete, and rename. Reject delete/rename for the default root directory using non-zero envelope code.

- [ ] **Step 2: Implement file list and upload**

Support owner-scoped list filters `dir_id`, `status`, `keyword`, pagination. Multipart upload creates one file item per uploaded file, returns upload result list, and creates a corresponding task id.

- [ ] **Step 3: Implement file workflow**

Support batch move, indexing retry, presign upload, status, confirm upload, delete file, and task detail. Retry must change failed file/task state to processing or done in a deterministic way.

- [ ] **Step 4: Add tests**

Cover directory create/rename/delete, file upload/list/status, batch move, failed indexing retry, presign, confirm, task detail.

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_knowledge.py tests/test_openapi_coverage.py -q
```

Expected: file and directory tests PASS; route coverage still missing knowledge card and search groups.

- [ ] **Step 6: Commit**

```bash
git add app/routers/knowledge.py app/main.py tests/test_knowledge.py
git commit -m "feat(mock-backend): implement knowledge file endpoints"
```

### Task 8: Implement knowledge card routes

**Files:**
- Modify: `../mediverse-management-mock-backend/app/routers/knowledge.py`
- Test: `../mediverse-management-mock-backend/tests/test_knowledge.py`

- [ ] **Step 1: Implement card type and file-card list**

`GET /api/v1/knowledge/card-types` returns fixed card type list. `GET /files/{id}/cards` returns cards associated with one file.

- [ ] **Step 2: Implement card CRUD**

Support list filters `type`, `online_status`, `audit_status`, `source_file_id`, `tag`, `keyword`, pagination, create, detail, update, delete.

- [ ] **Step 3: Implement card status and audit**

Status patch returns `CardWithStatusActionOut`; audit patch returns `CardWithReviewActionOut` and updates `audit_reject_reason` when rejected.

- [ ] **Step 4: Implement versions, diff, rollback**

Version list returns deterministic versions. Diff returns line-level `md_content` diff items. Rollback rejects current version, applies old version content, creates a new version, and returns `rollback_action`.

- [ ] **Step 5: Add tests**

Cover create/detail/update/status/audit/versions/diff/rollback/delete and field assertions for `md_content`, `json_content`, `source_files`, `audit_reject_reason`.

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_knowledge.py tests/test_openapi_coverage.py -q
```

Expected: knowledge tests PASS; route coverage only missing knowledge QA and recall groups.

- [ ] **Step 7: Commit**

```bash
git add app/routers/knowledge.py tests/test_knowledge.py
git commit -m "feat(mock-backend): implement knowledge card endpoints"
```

### Task 9: Implement knowledge QA and recall routes

**Files:**
- Create: `../mediverse-management-mock-backend/app/routers/knowledge_qa.py`
- Create: `../mediverse-management-mock-backend/app/routers/knowledge_recall.py`
- Modify: `../mediverse-management-mock-backend/app/main.py`
- Test: `../mediverse-management-mock-backend/tests/test_knowledge_search_recall.py`

- [ ] **Step 1: Implement knowledge QA**

Support owner-scoped search, follow-up, and history. Search result must include answer, citations, matched files, thinking steps, and a session id for follow-up.

- [ ] **Step 2: Implement Agentic recall**

`POST /api/v1/knowledge-recall/{owner_type}/{owner_id}/recall` returns deterministic synthesized answer, citations, retrieved sources, downstream metadata, and records a recall session.

- [ ] **Step 3: Implement recall history**

Support clear all, clear owner-scoped, list owner-scoped history, get session detail, soft delete session.

- [ ] **Step 4: Implement non-Agentic recall search**

`POST /api/v1/knowledge-recall/{owner_type}/{owner_id}/search` filters seeded knowledge cards/files by keyword and returns deterministic result items and metadata.

- [ ] **Step 5: Add tests**

Cover QA search/follow-up/history, Agentic recall, non-Agentic search, owner history list, session detail, soft delete, clear owner, clear all.

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_knowledge_search_recall.py tests/test_openapi_coverage.py -q
```

Expected: search and recall tests PASS; route coverage PASS for all 90 Swagger operations plus root and health.

- [ ] **Step 7: Commit**

```bash
git add app/routers/knowledge_qa.py app/routers/knowledge_recall.py app/main.py tests/test_knowledge_search_recall.py
git commit -m "feat(mock-backend): implement knowledge search endpoints"
```

### Task 10: Add frontend integration and contract verification

**Files:**
- Modify: `docs/frontend-development.md`
- Modify: `docs/documentation-task-board.md`
- Modify: `tests/api-contract/setup.ts`
- Modify: `tests/api-contract/*.test.ts`
- Test: frontend `pnpm test:api`, `pnpm check:docs`, `pnpm verify`

- [ ] **Step 1: Document local proxy**

Add this frontend local setup:

```bash
cat > .env.development.local <<'EOF'
DEV_PROXY_TARGET=http://127.0.0.1:8005
VITE_ENABLE_MOCK=false
EOF
```

Do not commit `.env.development.local`.

- [ ] **Step 2: Make API contract tests mock-aware**

When `API_TEST_USE_MOCK=true`, tests use:

```bash
API_BASE_URL=http://127.0.0.1:8005/api/v1
API_TEST_USERNAME=sysadmin
API_TEST_PASSWORD=mock123456
```

The test setup must avoid reading `.env.api-test` in mock mode.

- [ ] **Step 3: Add missing API contract coverage**

Extend frontend API contract tests so every Swagger tag has test coverage: `auth`, `api-tokens`, `departments`, `organizations`, `chat`, `upload`, `users`, `skills`, `avatars`, `my-avatar`, `knowledge`, `knowledge-qa`, `knowledge-recall`.

- [ ] **Step 4: Run Python backend verification**

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend
pytest -q
ruff check .
```

Expected: PASS.

- [ ] **Step 5: Run backend and frontend API contract tests**

Terminal A:

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-mock-backend
uvicorn app.main:app --host 127.0.0.1 --port 8005
```

Terminal B:

```bash
cd /Users/wang/Desktop/HSXY/develoment/code/mediverse-management/mediverse-management-frontend
API_TEST_USE_MOCK=true API_BASE_URL=http://127.0.0.1:8005/api/v1 pnpm test:api
```

Expected: PASS.

- [ ] **Step 6: Run frontend documentation and aggregate checks**

```bash
pnpm check:docs
pnpm verify
```

Expected: PASS.

- [ ] **Step 7: Commit frontend integration docs and tests**

```bash
git add docs/frontend-development.md docs/documentation-task-board.md tests/api-contract
git commit -m "test(mock-backend): wire frontend contract tests to Python mock"
```

---

## Acceptance Criteria

- `../mediverse-management-mock-backend` can start with:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8005
```

- `GET http://127.0.0.1:8005/health` returns `{"status":"ok"}`.
- `scripts/route_inventory.py` reports 90 Swagger operations.
- `tests/test_openapi_coverage.py` passes and proves all 90 online Swagger operations are registered.
- Python backend test suite passes with `pytest -q`.
- Python lint passes with `ruff check .`.
- Frontend API contract tests pass against Python mock with `API_TEST_USE_MOCK=true`.
- Frontend can run with `DEV_PROXY_TARGET=http://127.0.0.1:8005` and `VITE_ENABLE_MOCK=false`.
- No database process, file database, `.env.api-test`, real Token, real account password, or personal IP is committed.
- `docs/frontend-development.md` and `docs/documentation-task-board.md` describe the Python mock backend workflow.

---

## Risks And Controls

- **Swagger drift:** keep `app/contracts/openapi.json` locked per implementation run; refresh only through `scripts/fetch_openapi.sh` and review route diff before changing code.
- **Frontend/MSW divergence:** do not delete `src/mocks/**` in this plan; run API contract tests against Python mock first, then migrate frontend local workflow.
- **No database means lost state after restart:** document this as intentional; `POST /__mock/reset` makes tests deterministic.
- **Multipart shape mismatch:** cover all five multipart endpoints in pytest and frontend API contract tests.
- **Long tail interface gaps:** route coverage test must fail until every Swagger operation is registered.

---

## Self-Review Checklist

- [ ] The implementation plan covers all 90 Swagger operations listed above.
- [ ] The backend directory is sibling to the frontend directory.
- [ ] The plan does not introduce a database.
- [ ] The plan keeps secrets and local env files out of git.
- [ ] The plan includes Python backend verification and frontend contract verification.
- [ ] The plan updates frontend docs required by project rules.
