# Mediverse Management API 详细设计

> 文档版本：v2.1  
> 更新日期：2026-03-18  
> 来源：同步飞书 Wiki 最新内容（Wiki ID: RjKPwTWUBivbaykfexbcBzaTnvb）  
> 关联文档：技术设计.md、[接口域.md](./接口域.md)

---

## 更新日志

### v2.1 (2026-03-18)
- 同步飞书 Wiki 最新 API 设计规范与响应示例
- 修正 `/auth/me` 等接口的响应嵌套结构
- 补充用户管理中的手机号、邮箱字段
- 新增分身管理的通用编辑接口 `PUT /avatars/{id}`
- 优化分身列表查询参数，支持 `user_id` 过滤

---

## 文档结构（按域划分）

| 域 | 章节 | 说明 |
|----|------|------|
| Management | 一、1.2–1.5 | 认证、机构、科室、用户、会话、系统运维 |
| Ecosys | 二 | 数字医生分身管理 |
| Management（会话） | 三 | 数字医生对话、知识搜索 |
| KnowledgeBase | 四 | 文件、知识卡、知识库搜索 |

---

## 约定

### 通用请求头

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

### 错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 40001 | 参数缺失或格式错误 |
| 40002 | 资源不存在 |
| 40003 | 数据冲突（如名称重复） |
| 40101 | 未登录或 Token 无效 |
| 40102 | Token 已过期 |
| 40301 | 无操作权限 |
| 40302 | 跨租户访问被拒绝 |
| 42901 | 配额已耗尽（如体验次数用完） |
| 50001 | 服务器内部错误 |
| 50002 | 外部服务（LLM/ASR）不可用 |

### 分页参数（列表接口通用）

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | int | 1 | 页码，从 1 开始 |
| page_size | int | 20 | 每页条数，最大 100 |

### 分页响应结构（`data` 字段）

```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [ ... ]
}
```

---

## 一、Management 域

### 1.1 认证接口

#### 1.1.1 登录

`POST /api/v1/auth/login`

**Request Body**

```json
{
  "username": "zhangsan",
  "password": "P@ssw0rd"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码（明文，HTTPS 传输） |

**Response `data`**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiZDdiNDFmMmItYTY5ZC00NDZhLTkxYTYtNjA1N2Y1ZTYzY2Q2Iiwib3JnX2lkIjoiMzRmODZkN2UtMjI5ZC00ZGM1LWJkNDAtYzcwYmE5MTQyNDNhIiwiZGVwdF9pZCI6Ijc2MTgxMTdlLWZjYmItNGIyOC04MDlkLWRiODRhMjQwMzFlNCIsInJvbGVzIjpbInVzZXIiLCJzeXNhZG1pbiIsIm9yZ19hZG1pbiIsImRlcHRfYWRtaW4iXSwiZXhwIjoxNzczODQ1NjIxfQ.jgWNTbIuRmEdrvAPnxv4x9T_Zvz08T5jbcWxo0u0uec",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsInN1YiI6ImQ3YjQxZjJiLWE2OWQtNDQ2YS05MWE2LTYwNTdmNWU2M2NkNiIsIm9yZ19pZCI6IjM0Zjg2ZDdlLTIyOWQtNGRjNS1iZDQwLWM3MGJhOTE0MjQzYSIsImRlcHRfaWQiOiI3NjE4MTE3ZS1mY2JiLTRiMjgtODA5ZC1kYjg0YTI0MDMxZTQiLCJyb2xlcyI6WyJ1c2VyIiwic3lzYWRtaW4iLCJvcmdfYWRtaW4iLCJkZXB0X2FkbWluIl0sImV4cCI6MTc3NDQyMTYyMX0.KKFleaC5eBcJClILC9jwqGgnNR1cFo009VrR4mf8mVY",
  "token_type": "Bearer",
  "expires_in": 28800,
  "user": {
    "id": "d7b41f2b-a69d-446a-91a6-6057f5e63cd6",
    "username": "dev001",
    "real_name": "研发部",
    "avatar_url": "https://minio.huaxisy.com/medivers/huaxiaoyi/530e5aa8995146cebb7a25e59c6b6b90.png",
    "org_id": "34f86d7e-229d-4dc5-bd40-c70ba914243a",
    "dept_id": "7618117e-fcbb-4b28-809d-db84a24031e4",
    "roles": ["user", "sysadmin", "org_admin", "dept_admin"],
    "must_change_pwd": false,
    "phone": "13411111111",
    "email": "123@qq.com",
    "remark": "开发用测试账号1",
    "status": "active",
    "failed_login_count": 0,
    "locked_until": null,
    "org_name": "AI创新研究院",
    "dept_name": "前端开发",
    "has_expert_avatar": true,
    "has_dept_avatar": true,
    "has_org_avatar": true
  }
}
```

| user 字段 | 类型 | 说明 |
|-----------|------|------|
| id | string | 用户 ID |
| username | string | 用户名 |
| real_name | string | 真实姓名 |
| avatar_url | string | 头像 URL |
| org_id | string | 机构 ID |
| dept_id | string | 科室 ID |
| roles | string[] | 角色列表：user / sysadmin / org_admin / dept_admin |
| must_change_pwd | boolean | 是否必须修改密码 |
| phone | string | 手机号 |
| email | string | 邮箱 |
| remark | string | 备注 |
| status | string | active / inactive |
| failed_login_count | number | 失败登录次数 |
| locked_until | string \| null | 锁定截止时间 |
| org_name | string | 机构名称 |
| dept_name | string | 科室名称 |
| has_expert_avatar | boolean | 是否显示「我的工作台」 |
| has_dept_avatar | boolean | 是否显示「科室工作台」 |
| has_org_avatar | boolean | 是否显示「机构工作台」 |

**错误场景**

| 场景 | code | message |
|------|------|---------|
| 账号或密码错误 | 40101 | 账号或密码错误 |
| 账号被锁定 | 40101 | 账号已锁定，请 15 分钟后重试 |
| 账号被禁用 | 40101 | 账号已停用，请联系管理员 |

---

#### 1.1.2 刷新 Token

`POST /api/v1/auth/refresh`

**Request Body**

```json
{
  "refresh_token": "eyJhbGci..."
}
```

**Response `data`**

```json
{
  "access_token": "eyJhbGci...",
  "expires_in": 28800
}
```

---

#### 1.1.3 退出登录

`POST /api/v1/auth/logout`

无 Request Body，使用请求头中的 access_token。

**Response `data`**: `null`

---

#### 1.1.4 修改密码

`POST /api/v1/auth/change-password`

**Request Body**

```json
{
  "old_password": "OldP@ss",
  "new_password": "NewP@ss123",
  "confirm_password": "NewP@ss123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| old_password | string | ✅ | 当前密码 |
| new_password | string | ✅ | 新密码，至少 8 位，含字母和数字 |
| confirm_password | string | ✅ | 确认新密码，须与 new_password 一致 |

**Response `data`**: `null`

---

#### 1.1.5 获取当前用户

`GET /api/v1/auth/me`

无 Request Body，使用请求头中的 access_token。

**Response `data`**

```json
{
  "user": {
    "id": "d7b41f2b-a69d-446a-91a6-6057f5e63cd6",
    "username": "dev001",
    "real_name": "研发部",
    "avatar_url": "https://...",
    "org_id": "...",
    "dept_id": "...",
    "roles": ["user", "sysadmin", "org_admin", "dept_admin"],
    "must_change_pwd": false,
    "phone": "13411111111",
    "email": "123@qq.com",
    "remark": "开发用测试账号1",
    "status": "active",
    "failed_login_count": 0,
    "locked_until": null,
    "org_name": "AI创新研究院",
    "dept_name": "前端开发",
    "has_expert_avatar": true,
    "has_dept_avatar": true,
    "has_org_avatar": true
  }
}
```

#### 1.1.6 修改当前用户

`PUT /api/v1/auth/me`

Request Body如下，使用请求头中的 access_token。
```json
{
  "real_name": "string",
  "avatar_url": "string",
  "username": "string",
  "phone": "string",
  "email": "string",
  "remark": "string"
}
```

**Response `data`**：与 1.1.5 响应结构一致（嵌套在 `user` 字段下）。

---

### 1.2 机构管理

#### 1.2.1 查询机构列表

`GET /api/v1/organizations`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | ❌ | 名称模糊搜索 |
| status | string | ❌ | `active` / `inactive` / 不传=全部 |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "total": 5,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "name": "XX 医院",
      "logo_url": "https://...",
      "code": "ORG001",
      "description": "三甲综合医院",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 1.2.2 新增机构

`POST /api/v1/organizations`

**Request Body**

```json
{
  "name": "XX 医院",
  "logo_url": "https://...",
  "code": "ORG001",
  "description": "三甲综合医院",
  "status": "active"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | ✅ | 机构名称，唯一，最多 100 字 |
| code | string | ✅ | 机构编码，唯一 |
| logo_url | string | ❌ | Logo 图片 URL |
| description | string | ❌ | 描述 |
| status | string | ❌ | `active`（默认）/ `inactive` |

**Response `data`**：返回创建后的完整机构对象（同 1.2.1 `items` 中的单条）

---

#### 1.2.3 编辑机构

`PUT /api/v1/organizations/{id}`

**Request Body**（所有字段可选，仅传需修改的字段）

```json
{
  "name": "XX 医院",
  "code": "ORG001",
  "description": "三甲综合医院",
  "status": "inactive"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | ❌ | 机构名称 |
| code | string | ❌ | 机构编码 |
| logo_url | string | ❌ | Logo 图片 URL |
| description | string | ❌ | 描述 |
| status | string | ❌ | `active` / `inactive` |

**Response `data`**：返回更新后的完整机构对象

---

#### 1.2.4 删除机构

`DELETE /api/v1/organizations/{id}`

**Response `data`**: `null`

**错误场景**

| 场景 | code | message |
|------|------|---------|
| 机构下有科室/用户 | 40003 | 该机构下有 N 个科室和 M 个用户，请先转移或删除相关数据 |

---


---

### 1.3 科室管理

#### 1.3.1 查询科室列表

`GET /api/v1/departments`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ❌ | 按机构过滤（系统管理员可用） |
| name | string | ❌ | 名称模糊搜索 |
| status | string | ❌ | `active` / `inactive` |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "items": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "org_name": "XX 医院",
      "name": "内科",
      "code": "DEPT001",
      "description": "...",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 1.3.2 新增科室

`POST /api/v1/departments`

**Request Body**

```json
{
  "org_id": "uuid",
  "name": "内科",
  "code": "DEPT001",
  "description": "负责内科疾病诊疗",
  "status": "active"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ✅ | 所属机构 ID |
| name | string | ✅ | 科室名称，同机构内唯一，最多 100 字 |
| code | string | ✅ | 科室编码，同机构内唯一 |
| description | string | ❌ | 描述 |
| status | string | ❌ | `active`（默认）/ `inactive` |

**Response `data`**：返回创建后的完整科室对象（同 1.3.1 `items` 中的单条）

---

#### 1.3.3 编辑科室

`PUT /api/v1/departments/{id}`

**Request Body**（所有字段可选，仅传需修改的字段）

```json
{
  "name": "内科",
  "code": "DEPT001",
  "description": "负责内科疾病诊疗",
  "status": "inactive"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | ❌ | 科室名称 |
| code | string | ❌ | 科室编码 |
| description | string | ❌ | 描述 |
| status | string | ❌ | `active` / `inactive` |

**Response `data`**：返回更新后的完整科室对象

---

#### 1.3.4 删除科室

`DELETE /api/v1/departments/{id}`

**Response `data`**: `null`

**错误场景**

| 场景 | code | message |
|------|------|---------|
| 科室下有用户 | 40003 | 该科室下有 N 个用户，请先转移或删除相关数据 |

---

#### 1.3.5 机构目录树

`GET /api/v1/departments/tree`

返回当前用户有权看到的机构-科室树，用于页面左侧目录树。

**Response `data`**

```json
[
  {
    "id": "uuid",
    "name": "XX 医院",
    "type": "org",
    "children": [
      { "id": "uuid", "name": "内科", "type": "dept" },
      { "id": "uuid", "name": "外科", "type": "dept" }
    ]
  }
]
```

---

### 1.4 用户管理

#### 1.4.1 查询用户列表

`GET /api/v1/users`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ❌ | 按机构过滤 |
| dept_id | string | ❌ | 按科室过滤 |
| keyword | string | ❌ | 姓名/用户名模糊搜索 |
| role | string | ❌ | `sysadmin` / `org_admin` / `dept_admin` / `user` |
| status | string | ❌ | `active` / `inactive` |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "username": "zhangsan",
      "real_name": "张三",
      "avatar_url": "https://...",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "org_id": "uuid",
      "org_name": "XX 医院",
      "dept_id": "uuid",
      "dept_name": "内科",
      "roles": ["user", "dept_admin"],
      "remark": "备注信息",
      "status": "active",
      "failed_login_count": 0,
      "locked_until": null,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 1.4.2 新增用户

`POST /api/v1/users`

**Request Body**

```json
{
  "username": "zhangsan",
  "real_name": "张三",
  "password": "123456",
  "org_id": "uuid",
  "dept_id": "uuid",
  "roles": ["user"],
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "remark": "备注信息",
  "status": "active"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| username | string | ✅ | 用户名，全局唯一，4-50 位字母数字下划线 |
| real_name | string | ✅ | 真实姓名，最多 50 字 |
| password | string | ❌ | 初始密码，不传时默认 123456 |
| org_id | string | ❌ | 所属机构 ID |
| dept_id | string | ❌ | 所属科室 ID |
| roles | string[] | ✅ | 角色列表，至少含 `user` |
| phone | string | ❌ | 手机号 |
| email | string | ❌ | 邮箱 |
| remark | string | ❌ | 备注，最多 500 字 |
| status | string | ❌ | `active`（默认）/ `inactive` |

**Response `data`**：返回创建后的完整用户对象（同 1.4.1 `items` 中的单条）

---

#### 1.4.3 编辑用户

`PUT /api/v1/users/{id}`

**Request Body**（所有字段可选，仅传需修改的字段）

```json
{
  "real_name": "张三",
  "org_id": "uuid",
  "dept_id": "uuid",
  "roles": ["user", "dept_admin"],
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "remark": "备注信息",
  "status": "active"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| real_name | string | ❌ | 真实姓名 |
| org_id | string | ❌ | 所属机构 ID |
| dept_id | string | ❌ | 所属科室 ID |
| roles | string[] | ❌ | 角色列表 |
| phone | string | ❌ | 手机号 |
| email | string | ❌ | 邮箱 |
| remark | string | ❌ | 备注 |
| status | string | ❌ | `active` / `inactive` |

**Response `data`**：返回更新后的完整用户对象

---

#### 1.4.4 重置密码

`POST /api/v1/users/{id}/reset-pass`

无 Request Body，将用户密码重置为系统默认密码 123456。

**Response `data`**: `null`

---

#### 1.4.5 启用/停用用户

`PATCH /api/v1/users/{id}/status`

**Request Body**

```json
{
  "status": "inactive"
}
```

**Response `data`**: 返回更新后的完整用户对象

---

#### 1.4.6 通用头像上传接口

`POST /api/v1/upload/avatar`

用于分身、用户、机构等头像上传，返回可用的图片 URL。

**Request**

- Content-Type: `multipart/form-data`
- file: File 必填，图片文件，支持 jpg/png/webp，建议 ≤ 2MB

**Response `data`**

```json
{
  "url": "https://cdn.example.com/avatars/xxx.jpg",
  "file_name": "avatar.jpg",
  "file_size": 102400
}
```

---

## 二、Ecosys 域

### 2.1 分身管理

#### 2.1.1 查询分身列表

`GET /api/v1/avatars`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ❌ | 按机构过滤 |
| dept_id | string | ❌ | 按科室过滤 |
| user_id | string | ❌ | 按所属用户过滤 |
| type | string | ❌ | `general` / `specialist` / `expert` |
| keyword | string | ❌ | 名称模糊搜索 |
| status | string | ❌ | `active` / `inactive` |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "expert",
      "org_id": "uuid",
      "org_name": "XX 医院",
      "dept_id": "uuid",
      "dept_name": "内科",
      "user_id": "uuid",
      "user_name": "张三",
      "name": "张医生分身",
      "avatar_url": "https://...",
      "bio": "从事内科临床工作 20 年...",
      "tags": ["内科", "高血压", "糖尿病"],
      "greeting": "您好，我是张医生...",
      "style": "formal",
      "status": "active",
      "created_by": "uuid",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.1.2 创建分身

`POST /api/v1/avatars`

**Request Body**

```json
{
  "type": "expert",
  "org_id": "uuid",
  "dept_id": "uuid",
  "user_id": "uuid",
  "name": "张医生分身",
  "avatar_url": "https://...",
  "bio": "从事内科临床工作 20 年...",
  "tags": ["内科", "高血压"],
  "greeting": "您好，我是张医生，请问有什么可以帮助您？",
  "style": "formal",
  "style_custom": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| type | string | ✅ | `general` / `specialist` / `expert` |
| org_id | string | 条件 | type=general 时必填 |
| dept_id | string | 条件 | type=specialist 时必填 |
| user_id | string | 条件 | type=expert 时必填 |
| name | string | ✅ | 分身名称，同绑定范围内唯一，最多 100 字 |
| avatar_url | string | ❌ | 头像 URL，不传使用默认 |
| bio | string | ❌ | 简介，最多 500 字 |
| tags | string[] | ❌ | 标签，最多 10 个 |
| greeting | string | ❌ | 开场白，最多 200 字 |
| style | string | ❌ | `formal`（默认）/ `friendly` / `concise` / `detailed` / `custom` |
| style_custom | string | 条件 | style=custom 时必填，最多 100 字 |

---

#### 2.1.3 查询分身详情

`GET /api/v1/avatars/{id}`

**Response `data`**：返回完整分身对象（同 2.1.1 `items` 单条），另附：

```json
{
  "...": "同 2.1.1 的字段",
  "knowledge_grants": [
    {
      "id": "uuid",
      "scope_type": "dept",
      "scope_id": "uuid",
      "scope_name": "内科",
      "granted_by": "uuid",
      "granted_by_name": "张三",
      "granted_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2.1.4 我的分身配置

`GET /api/v1/my/avatar`

返回当前登录用户的专家分身（含配置），格式同 2.1.3。

#### 2.1.5 分身编辑接口

`PUT /api/v1/my/avatar`

仅允许更新以下字段：

```json
{
  "name": "string",
  "bio": "...",
  "tags": ["..."],
  "greeting": "...",
  "style": "friendly",
  "style_custom": null,
  "status": "active",
  "avatar_url": "https://..."
}
```

#### 2.1.6 我的分身统计

`GET /api/v1/my/avatar/stats`

**Response `data`**

```json
{
  "total_sessions": 1238,
  "today_sessions": 12,
  "knowledge_progress": {
    "indexed_files": 156,
    "total_files": 190,
    "percentage": 82.1
  }
}
```

#### 2.1.7 我的分身统计2.0

`GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}`（根据owner_type类型使用不同的owner_id查询分身统计数据）

- 作用：用于多角色用户进入不同角色工作台获取对应分身统计数据

#### 2.1.8 我的分身配置2.0

`GET /api/v1/my/avatar/{owner_type}/{owner_id}`
（根据owner_type类型使用不同的owner_id查询分身配置数据）
- 作用：用于多角色用户进入不同角色工作台获取对应分身配置数据

#### 2.1.9 按 ID 编辑分身

`PUT /api/v1/avatars/{id}`

**Request Body**（所有字段可选）

```json
{
  "name": "string",
  "bio": "string",
  "tags": ["string"],
  "greeting": "string",
  "style": "string",
  "style_custom": "string",
  "avatar_url": "string",
  "status": "active"
}
```

**Response `data`**：返回更新后的完整分身对象
---
#### 2.1.10 启用/停用分身

`PATCH /api/v1/avatars/{id}/status`

**Request Body**

```json
{
  "status": "inactive"
}
```

**Response `data`**: 返回更新后的完整分身对象

---

## 三、Management 域 — 会话管理（数字医生对话、知识搜索）

### 3.1 数字医生对话

#### 3.1.1 查询可体验的分身列表

`GET /api/v1/chat/avatars`

返回当前用户有体验权限的分身（依据 ExperienceQuota 过滤）。

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| keyword | string | ❌ | 名称模糊搜索 |
| type | string | ❌ | `general` / `specialist` / `expert` |
| org_id | string | ❌ | 机构过滤 |
| dept_id | string | ❌ | 科室过滤 |

**Response `data`**

```json
[
  {
    "id": "uuid",
    "type": "expert",
    "name": "张医生分身",
    "avatar_url": "https://...",
    "bio": "...",
    "tags": ["内科"],
    "org_name": "XX 医院",
    "dept_name": "内科",
    "quota": {
      "avatar_scope": "custom",
      "max_sessions": 50,
      "used_sessions": 12,
      "remaining": 38,
      "is_unlimited": false,
      "is_exhausted": false
    }
  }
]
```

---

#### 3.1.2 查询会话列表

`GET /api/v1/chat/sessions`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| avatar_id | string | ❌ | 按分身过滤 |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "items": [
    {
      "id": "uuid",
      "avatar_id": "uuid",
      "avatar_name": "张医生分身",
      "avatar_url": "https://...",
      "title": "高血压咨询",
      "status": "active",
      "last_message_at": "2026-03-03T10:30:00Z",
      "created_at": "2026-03-03T09:00:00Z"
    }
  ]
}
```

---

#### 3.1.3 新建会话

`POST /api/v1/chat/sessions`

**Request Body**

```json
{
  "avatar_id": "uuid",
  "idempotency_key": "client-generated-uuid"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| avatar_id | string | ✅ | 要对话的分身 ID |
| idempotency_key | string | ✅ | 客户端生成的 UUID，防止重复创建 |

**Response `data`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "session": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "avatar_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "avatar_name": "string",
      "avatar_url": "string",
      "title": "string",
      "status": "string",
      "last_message_at": "2026-03-18T03:33:36.883Z",
      "created_at": "2026-03-18T03:33:36.883Z"
    },
    "greeting": "string",
    "quota": {
      "avatar_scope": "string",
      "max_sessions": 0,
      "used_sessions": 0,
      "remaining": 0,
      "is_unlimited": true,
      "is_exhausted": true
    }
  }
}
```

**错误场景**

| 场景 | code | message |
|------|------|---------|
| 无该分身体验权限 | 40301 | 无权体验该数字医生 |
| 配额已耗尽 | 42901 | 该分身体验次数已用完 |

---

#### 3.1.4 重命名会话

`PATCH /api/v1/chat/sessions/{id}/title`

**Request Body**

```json
{
  "title": "高血压随访咨询"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| title | string | ✅ | 最多 50 字 |

---

#### 3.1.5 获取历史消息

`GET /api/v1/chat/sessions/{id}/messages`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| before_id | string | ❌ | 游标分页：加载该消息 ID 之前的消息 |
| limit | int | ❌ | 默认 50，最大 100 |

**Response `data`**

```json
{
  "has_more": true,
  "items": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "avatar_id": "uuid",
      "role": "user",
      "parts": [
        { "type": "text", "text": "我最近血压有点高..." },
        {
          "type": "file",
          "url": "https://...",
          "file_name": "报告.pdf",
          "mime_type": "application/pdf"
        }
      ],
      "tool_calls": null,
      "tokens_used": null,
      "created_at": "2026-03-03T10:01:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "parts": [{ "type": "text", "text": "根据您描述的情况，..." }],
      "tool_calls": [
        {
          "skill_name": "高血压风险评估",
          "skill_description": "评估高血压风险等级",
          "args": { "age": 45, "bp": "150/95" },
          "result": { "risk_level": "中风险" },
          "duration_ms": 320
        }
      ],
      "citations": ["card_id_1", "card_id_2"],
      "tokens_used": 850,
      "created_at": "2026-03-03T10:01:05Z"
    }
  ]
}
```

---

#### 3.1.6 发送消息（流式）

`POST /api/v1/chat/sessions/{id}/messages`

**Request**

- Content-Type: `multipart/form-data`
- text: 文本内容（可选）
- attachments: [File, ...]（可选，最多 5 个）
- text 和 attachments 至少有一个不为空

**Response**

- Content-Type: `text/event-stream`
- Cache-Control: `no-cache`
- Connection: `keep-alive`
- SSE 事件流（每行 `data: {JSON}\n\n`）

**事件类型**

| 事件类型 | 用途 | 对应 messages 字段 |
|----------|------|---------------------|
| thinking_step | 思考过程步骤 | thinking_process |
| delta | 回答正文流式 token | parts[].text |
| done | 结束，返回 message 信息 | — |
| error | 异常终止 | — |

**事件定义示例**

1. **thinking_step** — 思考过程步骤（同一 index 可多次推送，用于更新 status/description；status=done 时包含 duration_ms）

```
data: {"type":"thinking_step","index":0,"title":"检索知识库","status":"processing"}
data: {"type":"thinking_step","index":0,"title":"检索知识库","status":"processing","description":"正在查询知识库..."}
data: {"type":"thinking_step","index":0,"title":"检索知识库","status":"done","description":"找到 3 条相关知识","duration_ms":120}
data: {"type":"thinking_step","index":1,"title":"生成回答","status":"processing"}
data: {"type":"thinking_step","index":1,"title":"生成回答","status":"done","description":"已生成回答","duration_ms":450}
```

2. **delta** — 回答正文流式输出（多次推送，客户端拼接）

```
data: {"type":"delta","content":"根据"}
data: {"type":"delta","content":"您描述"}
data: {"type":"delta","content":"的症状，建议"}
```

3. **done** — 完成，服务端已落库

```
data: {"type":"done","message_id":"uuid","tokens_used":850}
```

4. **error** — 异常

```
data: {"type":"error","code":50002,"message":"AI 服务暂时不可用，请稍后重试"}
```

**事件字段说明**

| 事件 | 字段 | 类型 | 必填 | 说明 |
|------|------|------|:----:|------|
| thinking_step | index | int | ✅ | 步骤序号，从 0 开始 |
| thinking_step | title | string | ✅ | 步骤名称 |
| thinking_step | status | string | ✅ | processing / done |
| thinking_step | description | string | ❌ | 步骤描述，可逐步追加 |
| thinking_step | duration_ms | int | ❌ | 步骤耗时（毫秒），status=done 时建议提供 |
| delta | content | string | ✅ | 正文片段，客户端累加到 parts[0].text |
| done | message_id | string | ✅ | 落库后的 message.id |
| done | tokens_used | int | ✅ | 本次消耗 token 数 |
| error | code | int | ✅ | 错误码 |
| error | message | string | ✅ | 错误信息 |

落库后的 message 结构（与表一致）：

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "avatar_id": "uuid",
  "role": "assistant",
  "parts": [{ "type": "text", "text": "根据您描述的症状，建议..." }],
  "thinking_process": [
    { "title": "检索知识库", "description": "找到 3 条相关知识", "status": "done", "duration": "120ms" },
    { "title": "生成回答", "description": "已生成回答", "status": "done", "duration": "450ms" }
  ],
  "sources": null,
  "tokens_used": 850,
  "created_at": "2026-03-04T10:00:00Z"
}
```

> thinking_process 中 duration 存为字符串如 "120ms" 或数值均可，与前端展示约定一致即可。

---

#### 3.1.7 提交评分

`POST /api/v1/chat/sessions/{id}/ratings`

**Request Body**

```json
{
  "scores": {
    "accuracy": 4,
    "completion": 5
  },
  "feedback_text": "回答很专业，但可以更简洁一些"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| scores | object | ✅ | 各评分维度的分值，如 { accuracy: 4, completion: 5 }，1-5 |
| feedback_text | string | ❌ | 文本反馈，最多 500 字 |

**Response `data`**

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "scores": { "accuracy": 4, "completion": 5 },
  "feedback_text": "...",
  "created_at": "2026-03-03T10:30:00Z"
}
```

---

## 四、KnowledgeBase 域

`{owner_type}` 取值为 `personal` / `dept` / `org`，`{owner_id}` 对应 `user_id` / `dept_id` / `org_id`。

### 4.1 文件与知识卡

#### 4.1.1 获取目录树

`GET /api/v1/knowledge/{owner_type}/{owner_id}/directories`

**Response `data`**

```json
[
  {
    "id": "uuid",
    "name": "指南",
    "is_default": true,
    "sort_order": 0,
    "file_count": 12,
    "children": [
      {
        "id": "uuid",
        "name": "高血压指南",
        "is_default": false,
        "sort_order": 0,
        "file_count": 3,
        "children": []
      }
    ]
  }
]
```

---

#### 4.1.2 新建目录

`POST /api/v1/knowledge/{owner_type}/{owner_id}/directories`

**Request Body**

```json
{
  "parent_id": "uuid",
  "name": "高血压指南",
  "sort_order": 0
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| parent_id | string | ❌ | 父目录 ID，不传则为一级目录 |
| name | string | ✅ | 目录名，同父目录下唯一，最多 30 字 |
| sort_order | int | ❌ | 排序值，默认 0 |

---

#### 4.1.3 查询文件列表

`GET /api/v1/knowledge/{owner_type}/{owner_id}/files`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| dir_id | string | ❌ | 按目录过滤 |
| status | string | ❌ | uploading / parsing / extracting / indexing / done / failed |
| keyword | string | ❌ | 文件名模糊搜索 |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "file_name": "内科诊疗指南.pdf",
      "file_type": "pdf",
      "file_size": 2411520,
      "dir_id": "uuid",
      "dir_name": "指南",
      "status": "done",
      "file_url": "https://minio.example.com/bucket/path/file?X-Amz-Signature=...",
      "parsed_file_url": "https://minio.example.com/bucket/path/file?X-Amz-Signature=...",
      "error_msg": null,
      "auto_category_suggestion": "uuid",
      "auto_category_name": "指南",
      "knowledge_card_count": 12,
      "created_by": "uuid",
      "created_by_name": "张三",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

> `file_url` 为原文件访问地址；`parsed_file_url` 为解析后的文件 URL（如 md），供预览使用。
#### 4.1.3.1 文件预览说明：
- 文件类型支持：PDF、xlsx、word、文本型(txt、md、json、jsonl、csv)
- 仅pdf类型支持预览原文件和解析后的文件，其他类型仅预览原文件
- 文件后缀类型用不同的pdf、word控件显示内容
---

#### 4.1.4 上传文件

`POST /api/v1/knowledge/{owner_type}/{owner_id}/files`

**Request**

- Content-Type: `multipart/form-data`
- files: [File, ...] 必填，最多 20 个
- dir_id: string 可选，目标目录

**Response `data`**

```json
[
  {
    "id": "uuid",
    "file_name": "内科诊疗指南.pdf",
    "file_size": 2411520,
    "status": "uploading",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

#### 4.1.5 查询文件处理状态（轮询）

`GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/status`

**Response `data`**

```json
{
  "id": "uuid",
  "status": "indexing",
  "progress": {
    "current_step": "indexing",
    "steps": ["uploading", "parsing", "extracting", "indexing", "done"],
    "step_index": 3
  },
  "error_msg": null
}
```

---

#### 4.1.6 查询文件关联的知识卡

`GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/cards`

**Response `data`**

```json
[
  {
    "id": "uuid",
    "type": "evidence",
    "title": "高血压诊断标准",
    "tags": ["高血压", "诊断"],
    "online_status": "online",
    "confidence": 0.92
  }
]
```

---

#### 4.1.7 查询知识卡列表

`GET /api/v1/knowledge/{owner_type}/{owner_id}/cards`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| type | string | ❌ | evidence / rule / experience |
| online_status | string | ❌ | online / offline |
| audit_status | string | ❌ | pending / approved / rejected |
| source_file_id | string | ❌ | 按来源文件过滤（返回包含该文件为来源之一的知识卡） |
| tag | string | ❌ | 按标签过滤 |
| keyword | string | ❌ | 标题/内容关键词搜索 |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20 |

**Response `data`**（分页）

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "evidence",
      "title": "高血压诊断标准",
      "content_preview": "根据 2023 年《中国高血压防治指南》...",
      "tags": ["高血压", "诊断"],
      "online_status": "online",
      "audit_status": "approved",
      "current_version": 3,
      "reference_count": 23,
      "created_by": "uuid",
      "created_by_name": "张三",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

---

#### 4.1.8 查询知识卡详情

`GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}`

**Response `data`**

```json
{
  "id": "uuid",
  "type": "evidence",
  "title": "高血压诊断标准",
  "content": "## 高血压诊断标准\n\n根据 2023 年...",
  "tags": ["高血压", "诊断"],
  "online_status": "online",
  "audit_status": "approved",
  "current_version": 3,
  "reference_count": 23,
  "sources": [
    { "id": "uuid", "file_name": "内科诊疗指南.pdf", "page_hint": "第 12-15 页" },
    { "id": "uuid-2", "file_name": "心血管共识.pdf", "page_hint": "整篇" }
  ],
  "created_by": "uuid",
  "created_by_name": "张三",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z"
}
```

---

#### 4.1.9 创建知识卡

`POST /api/v1/knowledge/{owner_type}/{owner_id}/cards`

**Request Body**

```json
{
  "type": "rule",
  "title": "降压药用药规范",
  "content": "## 一线降压药\n\n...",
  "tags": ["高血压", "用药"],
  "source_file_ids": ["uuid", "uuid-2"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| type | string | ✅ | evidence / rule / experience |
| title | string | ✅ | 标题，最多 200 字 |
| content | string | ✅ | Markdown 格式内容 |
| tags | string[] | ❌ | 标签，最多 10 个 |
| source_file_ids | string[] | ❌ | 来源文件 ID 列表（可选，多对多关系） |

---

#### 4.1.10 编辑知识卡

`PUT /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}`

**Request Body**

```json
{
  "title": "降压药用药规范（更新版）",
  "content": "## 一线降压药\n\n（最新修订）...",
  "tags": ["高血压", "用药", "2026版"],
  "change_summary": "根据 2026 年新版指南更新用药剂量"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| title | string | ❌ | 标题 |
| content | string | ❌ | 内容 |
| tags | string[] | ❌ | 标签 |
| change_summary | string | ❌ | 本次修改摘要，最多 200 字 |

**Response `data`**：返回更新后的完整知识卡对象（同 4.1.8）

---

#### 4.1.11 上线/下线知识卡

`PATCH /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/status`

**Request Body**

```json
{
  "online_status": "offline"
}
```

---

#### 4.1.12 查询版本列表

`GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions`

**Response `data`**

```json
[
  {
    "id": "uuid",
    "version_number": 3,
    "change_summary": "根据 2026 年新版指南更新用药剂量",
    "operated_by": "uuid",
    "operated_by_name": "张三",
    "created_at": "2026-02-01T00:00:00Z"
  }
]
```

---

#### 4.1.13 版本对比

`GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions/diff`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| from_version | int | ✅ | 对比起始版本号 |
| to_version | int | ✅ | 对比目标版本号 |

**Response `data`**

```json
{
  "from_version": 2,
  "to_version": 3,
  "diff": [
    { "type": "equal", "content": "## 一线降压药\n\n" },
    { "type": "delete", "content": "初始剂量 5mg/天" },
    { "type": "insert", "content": "初始剂量 10mg/天（2026版指南更新）" }
  ]
}
```

---

#### 4.1.14 回滚版本

`POST /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/rollback`

**Request Body**

```json
{
  "target_version": 2
}
```

**Response `data`**：返回回滚后的完整知识卡对象（新版本号为 current_version+1）

---

### 4.2 知识库搜索

复用 sessions（type=kb_search）+ messages，搜索历史从会话列表取。

#### 4.2.1 搜索

`POST /api/v1/knowledge-qa/search`

**Request Body**

```json
{
  "query": "高血压患者可以服用哪些降压药？",
  "top_k": 5
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| query | string | ✅ | 搜索问题，最多 500 字 |
| top_k | int | ❌ | 返回相关知识卡数量，默认 5，最大 20 |

**Response `data`**

```json
{
  "qa_session_id": "uuid",
  "answer": "根据知识库中的资料，高血压患者常用的降压药包括...[1][2]",
  "citations": [
    {
      "index": 1,
      "card_id": "uuid",
      "card_title": "降压药用药规范",
      "card_type": "rule",
      "relevance_score": 0.92,
      "content_preview": "一线降压药包括..."
    },
    {
      "index": 2,
      "card_id": "uuid",
      "card_title": "高血压诊疗指南摘要",
      "card_type": "evidence",
      "relevance_score": 0.85,
      "content_preview": "2023年指南推荐..."
    }
  ],
  "matched_files": [
    {
      "file_id": "uuid",
      "file_name": "内科诊疗指南.pdf",
      "relevance_score": 0.91
    }
  ]
}
```

---

#### 4.2.2 追问

`POST /api/v1/knowledge-qa/follow-up`

**Request Body**

```json
{
  "qa_session_id": "uuid",
  "query": "其中 CCB 类药物有什么副作用？"
}
```

**Response `data`**：同 4.2.1（qa_session_id 保持不变，保留上下文）

---

#### 4.2.3 查询搜索历史

`GET /api/v1/knowledge-qa/history`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| limit | int | ❌ | 默认 10，最大 50 |

**Response `data`**

```json
[
  {
    "id": "uuid",
    "query": "高血压患者可以服用哪些降压药？",
    "created_at": "2026-03-03T09:00:00Z"
  }
]
```

---

### 4.3 文件上传预签名（可选优化）

对于大文件，推荐使用预签名 URL 直传 MinIO，避免文件流量经过后端。

#### 4.3.1 获取预签名上传 URL

`POST /api/v1/knowledge/{owner_type}/{owner_id}/files/presign`

**Request Body**

```json
{
  "file_name": "内科诊疗指南.pdf",
  "file_size": 2411520,
  "file_type": "pdf",
  "dir_id": "uuid"
}
```

**Response `data`**

```json
{
  "file_id": "uuid",
  "upload_url": "https://minio.example.com/bucket/path?X-Amz-Signature=...",
  "expires_in": 3600
}
```

客户端直接 PUT 文件到 upload_url，完成后调用：

#### 4.3.2 确认上传完成

`POST /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/confirm`

无 Request Body。触发后端开始文件处理流水线。

---

## 1.5 系统运维（API Token）

#### 1.5.1 查询 Token 列表

`GET /api/v1/admin/api-tokens`

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ❌ | 按机构过滤 |
| name | string | ❌ | 按名称筛选 |
| status | string | ❌ | `active` / `inactive` |
| page | int | ❌ | 默认 1 |
| page_size | int | ❌ | 默认 20，最大 200 |

**Response `data`**（分页）

```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "name": "外部系统集成",
      "description": "用于 HIS 系统对接",
      "token_hash": "sk_live_xxxxxxxx",
      "status": "active",
      "last_used_at": "2026-03-02T15:00:00Z",
      "created_by": "uuid",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 1.5.2 创建 Token

`POST /api/v1/admin/api-tokens`

**Request Body**

```json
{
  "org_id": "uuid",
  "name": "外部系统集成",
  "description": "用于 HIS 系统对接"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| org_id | string | ✅ | 所属机构 ID |
| name | string | ✅ | Token 名称，同机构内唯一，最多 100 字 |
| description | string | ❌ | 描述，最多 500 字 |

**Response `data`**

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "name": "外部系统集成",
  "token_hash": "sk_live_xxxxxxxx",
  "plain_token": "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "active",
  "created_by": "uuid",
  "created_at": "2026-03-03T10:00:00Z"
}
```

> ⚠ plain_token 明文仅在此响应中返回一次，请立即复制保存。

---

#### 1.5.3 更新 Token 信息

`PUT /api/v1/admin/api-tokens/{id}`

**Request Body**

```json
{
  "name": "外部系统集成（更新）",
  "description": "新用途说明"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| name | string | ❌ | Token 名称 |
| description | string | ❌ | 描述 |

**Response `data`**：返回更新后的完整 Token 对象（不含 plain_token）

---

#### 1.5.4 启用/禁用 Token

`PATCH /api/v1/admin/api-tokens/{id}/status`

**Request Body**

```json
{
  "status": "inactive"
}
```

**Response `data`**：返回更新后的完整 Token 对象

---

#### 1.5.5 删除 Token

`DELETE /api/v1/admin/api-tokens/{id}`

**Response `data`**: `null`

---

本文档覆盖第一期所有核心接口，运维监控类接口（任务管理、会话管理、日志等）在第二期补充。